import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { processImagesOnly } from '@/lib/catalogService';
import { subscriptionService, UsageValidation } from '@/lib/subscriptionService';
import { Product, getDisplayImageUrl, getProcessingStatus } from '@/types/products';
import { 
  Package, 
  Search, 
  Filter, 
  Zap,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  Palette,
  ChevronDown,
  Settings
} from 'lucide-react';

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  // Estado global de selección (mantiene selecciones entre pestañas)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showCatalogPreview, setShowCatalogPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado activo de pestaña (lee desde URL)
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'pending';
  });
  
  // Estados para suscripciones
  const [usageValidation, setUsageValidation] = useState<UsageValidation | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadUsageValidation();
      
      // Auto-refresh para ver estado de procesamiento
      const interval = setInterval(loadProducts, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sincronizar pestaña activa con URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['pending', 'processing', 'completed'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const loadUsageValidation = async () => {
    if (!user) return;
    
    try {
      const validation = await subscriptionService.validateUsage(user.id);
      setUsageValidation(validation);
    } catch (error) {
      console.error('Error loading usage validation:', error);
    }
  };

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, user_id, name, description, custom_description, 
          price_retail, price_wholesale, category, brand,
          original_image_url, processed_image_url, hd_image_url, image_url,
          processing_status, processing_progress, is_processed, processed_at,
          credits_used, service_type, error_message,
          has_variants, variant_count,
          created_at, updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por pestaña activa
  const getProductsForTab = (tab: string) => {
    let statusFilter: string[];
    
    switch (tab) {
      case 'pending':
        statusFilter = ['pending'];
        break;
      case 'processing':
        statusFilter = ['processing'];
        break;
      case 'completed':
        statusFilter = ['completed'];
        break;
      default:
        statusFilter = ['pending'];
    }

    return products.filter(product => {
      const status = getProcessingStatus(product);
      const matchesStatus = statusFilter.includes(status);
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      return matchesStatus && matchesSearch && matchesCategory;
    });
  };

  const filteredProducts = getProductsForTab(activeTab);
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Cambiar pestaña SIN resetear selecciones
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Ya NO limpiamos las selecciones para mantenerlas entre pestañas
    
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    const currentTabProductIds = filteredProducts.map(p => p.id);
    const currentTabSelectedCount = selectedProducts.filter(id => currentTabProductIds.includes(id)).length;
    
    if (currentTabSelectedCount === currentTabProductIds.length) {
      // Deseleccionar todos los de esta pestaña
      setSelectedProducts(prev => prev.filter(id => !currentTabProductIds.includes(id)));
    } else {
      // Seleccionar todos los de esta pestaña (sin duplicar)
      setSelectedProducts(prev => [...new Set([...prev, ...currentTabProductIds])]);
    }
  };

  const handleProcessImages = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para procesar",
        variant: "destructive",
      });
      return;
    }

    // Validación de créditos
    if (!usageValidation?.canProcessBackground) {
      if (usageValidation?.suggestCreditPurchase) {
        toast({
          title: "Sin créditos disponibles",
          description: "Necesitas comprar créditos para quitar fondos",
          variant: "destructive",
        });
        setShowCreditModal(true);
        return;
      }
      
      toast({
        title: "Upgrade requerido",
        description: usageValidation?.upgradeRequired || "Necesitas un plan de pago",
        variant: "destructive",
      });
      setShowUpgradeModal(true);
      return;
    }

    if (usageValidation.remainingBgCredits < selectedProducts.length) {
      toast({
        title: "Créditos insuficientes",
        description: `Necesitas ${selectedProducts.length} créditos, pero solo tienes ${usageValidation.remainingBgCredits}`,
        variant: "destructive",
      });
      setShowCreditModal(true);
      return;
    }

    setProcessing(true);

    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      
      const productsForWebhook = selectedProductsData.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || product.custom_description,
        category: product.category,
        price_retail: product.price_retail || 0,
        original_image_url: product.original_image_url,
        estimated_credits: 1,
        estimated_cost_mxn: 2.0
      }));

      const creditsConsumed = await subscriptionService.consumeBackgroundRemovalCredit(
        user.id, 
        selectedProducts.length
      );

      if (!creditsConsumed) {
        throw new Error('No se pudieron consumir los créditos');
      }

      await Promise.all(selectedProductsData.map(product => 
        supabase
          .from('products')
          .update({ 
            processing_status: 'processing',
            processing_progress: 0
          })
          .eq('id', product.id)
      ));

      await loadUsageValidation();

      const result = await processImagesOnly(
        productsForWebhook,
        {
          business_name: 'Mi Empresa',
          primary_color: '#3B82F6',
          secondary_color: '#1F2937'
        }
      );

      if (result.success) {
        toast({
          title: "Procesamiento iniciado",
          description: `${selectedProducts.length} productos enviados al procesamiento`,
          variant: "default",
        });

        handleTabChange('processing');
        
      } else {
        throw new Error(result.error || 'Error en el procesamiento');
      }

    } catch (error) {
      console.error('Error procesando imágenes:', error);
      toast({
        title: "Error en procesamiento",
        description: error instanceof Error ? error.message : "No se pudieron procesar las imágenes",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      await loadProducts();
    }
  };

  const handleCreateCatalog = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para crear un catálogo",
        variant: "destructive",
      });
      return;
    }
    
    // Mostrar modal de preview antes de crear catálogo
    setShowCatalogPreview(true);
  };

  const confirmCreateCatalog = async () => {
    try {
      const selectedProductsData = products
        .filter(p => selectedProducts.includes(p.id))
        .map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || product.custom_description,
          category: product.category,
          price_retail: product.price_retail || 0,
          image_url: getDisplayImageUrl(product),
          original_image_url: product.original_image_url,
          processed_image_url: product.processed_image_url,
          hd_image_url: product.hd_image_url,
          created_at: product.created_at
        }));

      navigate('/template-selection', {
        state: {
          products: selectedProductsData,
          businessInfo: {
            business_name: 'Mi Empresa'
          },
          skipProcessing: true
        }
      });

    } catch (error) {
      console.error('Error preparando catálogo:', error);
      toast({
        title: "Error",
        description: "No se pudo preparar el catálogo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: `${product.name} ha sido eliminado correctamente`,
      });

      await loadProducts();
      setSelectedProducts(prev => prev.filter(id => id !== product.id));

    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const getStats = () => {
    return {
      total: products.length,
      pending: products.filter(p => getProcessingStatus(p) === 'pending').length,
      processing: products.filter(p => getProcessingStatus(p) === 'processing').length,
      completed: products.filter(p => getProcessingStatus(p) === 'completed').length,
      failed: products.filter(p => getProcessingStatus(p) === 'failed').length,
    };
  };

  const stats = getStats();

  // Obtener productos seleccionados por estado para el modal
  const getSelectedProductsByStatus = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    return {
      pending: selectedProductsData.filter(p => getProcessingStatus(p) === 'pending'),
      processing: selectedProductsData.filter(p => getProcessingStatus(p) === 'processing'),
      completed: selectedProductsData.filter(p => getProcessingStatus(p) === 'completed'),
      total: selectedProductsData.length
    };
  };

  // BANNER COMPACTO para mobile
  const PlanStatusBanner = () => {
    if (!usageValidation) return null;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="p-3">
          {/* Mobile: Diseño vertical compacto */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-900 text-sm">
                {usageValidation.currentPlan}
              </h4>
              {usageValidation.suggestCreditPurchase && (
                <Button onClick={() => setShowCreditModal(true)} size="sm" className="h-7 text-xs">
                  Créditos
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
              <div className="text-center">
                <div className="font-medium">{usageValidation.remainingUploads}</div>
                <div className="text-blue-600">Subidas</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{usageValidation.remainingBgCredits}</div>
                <div className="text-blue-600">Créditos</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{usageValidation.remainingCatalogs}</div>
                <div className="text-blue-600">Catálogos</div>
              </div>
            </div>
          </div>

          {/* Desktop: Diseño original */}
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">
                {usageValidation.currentPlan}
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Subidas restantes: {usageValidation.remainingUploads}</p>
                <p>Créditos para fondos: {usageValidation.remainingBgCredits}</p>
                <p>Catálogos restantes: {usageValidation.remainingCatalogs}</p>
              </div>
            </div>
            {usageValidation.suggestCreditPurchase && (
              <Button onClick={() => setShowCreditModal(true)} size="sm">
                Comprar Créditos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // MODALES optimizados para mobile
  const UpgradeModal = () => (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Upgrade Requerido</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-sm">{usageValidation?.upgradeRequired}</p>
          <div className="space-y-3">
            <p className="font-medium text-sm">Planes disponibles:</p>
            <div className="space-y-2 text-sm">
              <div className="p-2 border rounded">
                <div className="font-medium">Básico - $299/mes</div>
                <div className="text-gray-600">5 créditos + 50 uploads</div>
              </div>
              <div className="p-2 border rounded">
                <div className="font-medium">Estándar - $599/mes</div>
                <div className="text-gray-600">30 créditos + 200 uploads</div>
              </div>
              <div className="p-2 border rounded">
                <div className="font-medium">Premium - $1,199/mes</div>
                <div className="text-gray-600">80 créditos + 500 uploads</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/pricing')} className="flex-1">Ver Planes</Button>
          <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const CreditModal = () => (
    <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Comprar Créditos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4 text-sm">Compra créditos adicionales para procesar más imágenes:</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-semibold">Pack 10 Créditos</div>
                <div className="text-sm text-gray-600">$3.50 por crédito</div>
              </div>
              <div className="text-lg font-bold text-green-600">$35</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-semibold">Pack 25 Créditos ⭐</div>
                <div className="text-sm text-gray-600">$3.20 por crédito</div>
              </div>
              <div className="text-lg font-bold text-blue-600">$80</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">* Los créditos no expiran por 12 meses</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCreditModal(false)} className="flex-1">Comprar Después</Button>
          <Button variant="outline" onClick={() => setShowCreditModal(false)} className="flex-1">Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // MODAL DE PREVIEW DEL CATÁLOGO
  const CatalogPreviewModal = () => {
    const selectedByStatus = getSelectedProductsByStatus();
    
    return (
      <Dialog open={showCatalogPreview} onOpenChange={setShowCatalogPreview}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Preview del Catálogo</DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedByStatus.total} productos seleccionados de diferentes estados
            </p>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto">
            {/* Resumen por estados */}
            <div className="grid grid-cols-3 gap-4">
              {selectedByStatus.pending.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-3 text-center">
                    <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="font-semibold text-orange-900">{selectedByStatus.pending.length}</div>
                    <div className="text-xs text-orange-700">Por Procesar</div>
                  </CardContent>
                </Card>
              )}
              
              {selectedByStatus.processing.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-3 text-center">
                    <Loader2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-blue-900">{selectedByStatus.processing.length}</div>
                    <div className="text-xs text-blue-700">Procesando</div>
                  </CardContent>
                </Card>
              )}
              
              {selectedByStatus.completed.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-900">{selectedByStatus.completed.length}</div>
                    <div className="text-xs text-green-700">Completadas</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {products
                .filter(p => selectedProducts.includes(p.id))
                .map(product => {
                  const status = getProcessingStatus(product);
                  return (
                    <div key={product.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={getDisplayImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Badge de estado */}
                      <div className="absolute -top-1 -right-1">
                        {status === 'pending' && (
                          <Badge className="bg-orange-100 text-orange-800 h-5 w-5 p-0 text-xs flex items-center justify-center">
                            <Clock className="h-3 w-3" />
                          </Badge>
                        )}
                        {status === 'processing' && (
                          <Badge className="bg-blue-100 text-blue-800 h-5 w-5 p-0 text-xs flex items-center justify-center">
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </Badge>
                        )}
                        {status === 'completed' && (
                          <Badge className="bg-green-100 text-green-800 h-5 w-5 p-0 text-xs flex items-center justify-center">
                            <CheckCircle className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>

                      {/* Tooltip con nombre en hover */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="truncate">{product.name}</div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Información adicional */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-blue-900">¿Qué incluirá tu catálogo?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Productos con imágenes originales (pendientes y en proceso)</li>
                      <li>• Productos con fondos removidos (completadas)</li>
                      <li>• Precios y descripciones de todos los productos</li>
                      <li>• Diseño profesional personalizable</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCatalogPreview(false)}
              className="flex-1"
            >
              Seguir Editando
            </Button>
            <Button
              onClick={() => {
                setShowCatalogPreview(false);
                confirmCreateCatalog();
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Palette className="h-4 w-4 mr-2" />
              Crear Catálogo ({selectedByStatus.total})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ACTIONS RESPONSIVAS
  const actions = (
    <div className="flex items-center gap-2">
      {/* Búsqueda con filtro de categoría integrado */}
      <div className={`items-center gap-2 ${selectedProducts.length > 0 ? 'hidden md:flex' : 'flex'}`}>
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-32 md:w-48"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="hidden md:block border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[120px]"
        >
          <option value="all">Todas</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {/* Botones de acción - compactos en mobile */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-1 md:gap-2">
          {/* Botón crear catálogo - compacto en mobile */}
          <Button 
            variant="outline"
            onClick={handleCreateCatalog}
            size="sm"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Palette className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Catálogo ({selectedProducts.length})</span>
            <span className="md:hidden">({selectedProducts.length})</span>
          </Button>

          {/* Botón procesar - solo en pending */}
          {activeTab === 'pending' && (
            <Button 
              onClick={handleProcessImages} 
              disabled={processing}
              size="sm"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Quitar Fondos ({selectedProducts.length})</span>
                  <span className="md:hidden">({selectedProducts.length})</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}
      
      {/* Botón agregar - siempre visible */}
      <Button onClick={() => navigate('/upload')} variant="outline" size="sm">
        <Plus className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Agregar</span>
      </Button>

      {/* Filtros - botón hamburguesa en mobile */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden"
      >
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout actions={actions}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando productos...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <PlanStatusBanner />
        
        {products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 md:py-12">
              <Package className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                No tienes productos guardados
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Sube tus primeras imágenes de productos para comenzar
              </p>
              <Button onClick={() => navigate('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Subir Productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* PESTAÑAS COMPACTAS */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="pending" className="relative px-2 py-2 text-xs md:text-sm">
                  <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Por Procesar</span>
                    <span className="sm:hidden">Pendientes</span>
                    {stats.pending > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                        {stats.pending}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="processing" className="relative px-2 py-2 text-xs md:text-sm">
                  <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Procesando</span>
                    {stats.processing > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-blue-500">
                        {stats.processing}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="completed" className="relative px-2 py-2 text-xs md:text-sm">
                  <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                    <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Completadas</span>
                    {stats.completed > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-green-500">
                        {stats.completed}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* FILTROS MÓVILES COLAPSABLES */}
              {showFilters && (
                <Card className="md:hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Categoría</label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        >
                          <option value="all">Todas las categorías</option>
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CONTENIDO DE PESTAÑAS */}
              <TabsContent value="pending" className="space-y-4">
                {stats.pending === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        No hay productos pendientes
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Todos tus productos han sido procesados o están en proceso
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                     {/* Controles desktop - Solo contador y selección */}
                     <Card className="hidden md:block">
                       <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={filteredProducts.length > 0 && selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length === filteredProducts.length}
                                onCheckedChange={selectAllProducts}
                                disabled={processing}
                              />
                              <span className="text-sm text-gray-600">
                                <span className="font-semibold text-blue-600">
                                  {selectedProducts.length} total seleccionados
                                </span>
                                {' '} | {selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length} de {filteredProducts.length} en esta pestaña
                              </span>
                            </div>
                          </div>
                       </CardContent>
                     </Card>

                    {/* Controles móviles compactos */}
                    <div className="md:hidden flex items-center justify-between px-2">
                       <div className="flex items-center gap-2">
                         <Checkbox
                           checked={filteredProducts.length > 0 && selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length === filteredProducts.length}
                           onCheckedChange={selectAllProducts}
                           disabled={processing}
                         />
                         <span className="text-xs text-gray-600">
                           <span className="font-semibold text-blue-600">{selectedProducts.length}</span>
                           {' '}total | {selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length}/{filteredProducts.length}
                         </span>
                       </div>
                    </div>

                    {/* Grid responsivo mejorado */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          processing={processing}
                          isMobile={true}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="processing" className="space-y-4">
                {stats.processing === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Loader2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        No hay productos procesándose
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Selecciona productos en "Por Procesar" para quitar fondos
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-blue-900 text-sm md:text-base">
                              {stats.processing} productos procesándose
                            </h4>
                            <p className="text-xs md:text-sm text-blue-700">
                              El sistema está quitando fondos automáticamente
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          processing={true}
                          showProgress={true}
                          isMobile={true}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {stats.completed === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        No hay productos completados
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Procesa algunos productos para verlos aquí sin fondo
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-green-900 text-sm md:text-base">
                              {stats.completed} productos con fondo removido
                            </h4>
                            <p className="text-xs md:text-sm text-green-700">
                              Listos para crear catálogos profesionales
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          processing={false}
                          showCompleted={true}
                          isMobile={true}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <UpgradeModal />
        <CreditModal />
        <CatalogPreviewModal />
      </AppLayout>
    </ProtectedRoute>
  );
};

// COMPONENT CARD OPTIMIZADO PARA MOBILE
const ProductCard = ({ product, selectedProducts, toggleProductSelection, handleDeleteProduct, processing, showProgress = false, showCompleted = false, isMobile = false }: any) => {
  const status = getProcessingStatus(product);
  const displayImageUrl = getDisplayImageUrl(product);

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${
      processing ? 'opacity-50' : ''
    }`}>
      <div className="relative">
        {/* Imagen con aspect ratio mejorado para mobile */}
        <div className="aspect-square bg-gray-100">
          <img
            src={displayImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        {/* Checkbox más grande en mobile */}
        <div className="absolute top-1 md:top-2 left-1 md:left-2">
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => toggleProductSelection(product.id)}
            className={`bg-white shadow-sm ${isMobile ? 'h-5 w-5' : ''}`}
            disabled={processing}
          />
        </div>
        
        {/* Badge de estado más legible en mobile */}
        <div className="absolute top-1 md:top-2 right-1 md:right-2">
          {showCompleted ? (
            <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0.5 md:px-2 md:py-1">
              <CheckCircle className="w-2 h-2 md:w-3 md:h-3 mr-1" />
              <span className="hidden sm:inline">Sin fondo</span>
              <span className="sm:hidden">✓</span>
            </Badge>
          ) : (
            <Badge className={`text-xs px-1 py-0.5 md:px-2 md:py-1 ${
              status === 'pending' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {status === 'processing' ? <Loader2 className="w-2 h-2 md:w-3 md:h-3 animate-spin mr-1" /> : <Clock className="w-2 h-2 md:w-3 md:h-3 mr-1" />}
              <span className="hidden sm:inline">{status === 'pending' ? 'Pendiente' : 'Procesando'}</span>
              <span className="sm:hidden">{status === 'pending' ? 'P' : 'Proc'}</span>
            </Badge>
          )}
        </div>
        
        {/* Progress bar más visible en mobile */}
        {showProgress && status === 'processing' && product.processing_progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 md:p-2">
            <div className="flex items-center gap-1 md:gap-2">
              <Loader2 className="w-2 h-2 md:w-3 md:h-3 animate-spin" />
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${product.processing_progress || 0}%` }}
                  />
                </div>
              </div>
              <span className="text-xs">{product.processing_progress || 0}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Card content compacto para mobile */}
      <CardContent className="p-2 md:p-4">
        <h3 className="font-semibold text-sm md:text-lg mb-1 truncate">{product.name}</h3>
        
        {/* Precio más prominente en mobile */}
        {product.price_retail && (
          <p className="font-bold text-primary mb-2 text-sm md:text-base">
            ${(product.price_retail / 100).toFixed(2)}
          </p>
        )}
        
        {/* Categoría solo en desktop por espacio */}
        {product.category && (
          <Badge variant="outline" className="text-xs mb-2 hidden md:inline-flex">
            {product.category}
          </Badge>
        )}
        
        {/* Botones compactos en mobile */}
        <div className="flex gap-1 md:gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs md:text-sm h-7 md:h-8" disabled={processing}>
            <Eye className="h-2 w-2 md:h-3 md:w-3 md:mr-1" />
            <span className="hidden md:inline">Ver</span>
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs md:text-sm h-7 md:h-8" disabled={processing}>
            <Edit className="h-2 w-2 md:h-3 md:w-3 md:mr-1" />
            <span className="hidden md:inline">Editar</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs md:text-sm h-7 md:h-8 px-1 md:px-2"
            disabled={processing}
            onClick={() => handleDeleteProduct(product)}
          >
            <Trash2 className="h-2 w-2 md:h-3 md:w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Products;
