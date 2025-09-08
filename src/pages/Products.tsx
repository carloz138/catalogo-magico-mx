import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useCatalogLimits } from '@/hooks/useCatalogLimits';
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
import { Product, getDisplayImageUrl, getProcessingStatus } from '@/types/products';
import { 
  Package, 
  Search, 
  Zap,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  Palette,
  Info,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCatalogPreview, setShowCatalogPreview] = useState(false);
  
  // Estado activo de pestaña
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'pending';
  });
  
  // Hook para límites de catálogos
  const { 
    validation, 
    canGenerate,
    validateBeforeGeneration,
    catalogsUsed,
    catalogsLimit 
  } = useCatalogLimits();

  useEffect(() => {
    if (user) {
      loadProducts();
      
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
      // Seleccionar todos los de esta pestaña
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

      await Promise.all(selectedProductsData.map(product => 
        supabase
          .from('products')
          .update({ 
            processing_status: 'processing',
            processing_progress: 0
          })
          .eq('id', product.id)
      ));

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

  const handleCreateCatalog = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para crear un catálogo",
        variant: "destructive",
      });
      return;
    }

    // Validar límites antes de mostrar preview
    const canProceed = await validateBeforeGeneration();
    if (!canProceed.canGenerate) {
      toast({
        title: "Límite alcanzado",
        description: canProceed.message || "Has alcanzado el límite de catálogos",
        variant: "destructive",
      });
      return;
    }
    
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

      // Guardar en localStorage para TemplateSelection
      localStorage.setItem('selectedProductsData', JSON.stringify(selectedProductsData));
      localStorage.setItem('businessInfo', JSON.stringify({
        business_name: 'Mi Empresa'
      }));

      navigate('/template-selection');

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

  // Banner compacto de límites SOLO cuando sea crítico
  const LimitsAlert = () => {
    if (!validation) return null;

    const isAtCatalogLimit = !canGenerate;

    // Solo mostrar cuando haya un problema crítico
    if (isAtCatalogLimit) {
      return (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900">
                  Límite de catálogos alcanzado ({catalogsUsed}/{catalogsLimit})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                >
                  Upgrade
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/analytics')}
                  className="text-red-600 text-xs"
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Ver uso
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Modal de preview del catálogo
  const CatalogPreviewModal = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    const pending = selectedProductsData.filter(p => getProcessingStatus(p) === 'pending');
    const processing = selectedProductsData.filter(p => getProcessingStatus(p) === 'processing');
    const completed = selectedProductsData.filter(p => getProcessingStatus(p) === 'completed');
    
    return (
      <Dialog open={showCatalogPreview} onOpenChange={setShowCatalogPreview}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar Catálogo</DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedProductsData.length} productos seleccionados
            </p>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto">
            {/* Resumen por estados */}
            <div className="grid grid-cols-3 gap-4">
              {pending.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-3 text-center">
                    <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                    <div className="font-semibold text-orange-900">{pending.length}</div>
                    <div className="text-xs text-orange-700">Sin procesar</div>
                  </CardContent>
                </Card>
              )}
              
              {processing.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-3 text-center">
                    <Loader2 className="h-6 w-6 text-blue-600 mx-auto mb-2 animate-spin" />
                    <div className="font-semibold text-blue-900">{processing.length}</div>
                    <div className="text-xs text-blue-700">Procesando</div>
                  </CardContent>
                </Card>
              )}
              
              {completed.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-900">{completed.length}</div>
                    <div className="text-xs text-green-700">Sin fondo</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Info del catálogo */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-blue-900">Tu catálogo incluirá:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Imágenes originales (productos sin procesar)</li>
                      <li>• Imágenes con fondos removidos (productos completados)</li>
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
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowCatalogPreview(false);
                confirmCreateCatalog();
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Palette className="h-4 w-4 mr-2" />
              Crear Catálogo ({selectedProductsData.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Actions responsivas mejoradas
  const actions = (
    <div className="flex items-center gap-2">
      {/* Búsqueda - solo visible cuando no hay selecciones en móvil */}
      <div className={`items-center gap-2 ${selectedProducts.length > 0 ? 'hidden lg:flex' : 'flex'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-32 sm:w-40 lg:w-48"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="hidden md:block border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[100px]"
        >
          <option value="all">Todas</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {/* Botones de acción cuando hay selecciones */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline"
            onClick={handleCreateCatalog}
            size="sm"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            disabled={!canGenerate}
          >
            <Palette className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Catálogo</span>
            <span className="ml-1">({selectedProducts.length})</span>
          </Button>

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
                  <Zap className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Procesar</span>
                  <span className="ml-1">({selectedProducts.length})</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}
      
      {/* Botón agregar siempre visible */}
      <Button onClick={() => navigate('/upload')} variant="outline" size="sm">
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Agregar</span>
      </Button>

      {/* Botón analytics cuando no hay selecciones */}
      {selectedProducts.length === 0 && (
        <Button 
          onClick={() => navigate('/analytics')} 
          variant="ghost" 
          size="sm"
          className="hidden lg:flex"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      )}
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
        {/* Banner de límites críticos */}
        <LimitsAlert />
        
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
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => navigate('/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Productos
                </Button>
                <Button 
                  onClick={() => navigate('/analytics')} 
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Pestañas mejoradas para móvil */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="pending" className="relative px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Por Procesar</span>
                    <span className="sm:hidden">Pendientes</span>
                    {stats.pending > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                        {stats.pending}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="processing" className="relative px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Procesando</span>
                    {stats.processing > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-blue-500">
                        {stats.processing}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="completed" className="relative px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Completadas</span>
                    {stats.completed > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-green-500">
                        {stats.completed}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* Contenido de pestañas */}
              <TabsContent value="pending" className="space-y-4">
                {stats.pending === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        No hay productos pendientes
                      </h3>
                      <p className="text-sm text-gray-600">
                        Todos tus productos han sido procesados
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Controles de selección - desktop */}
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

                    {/* Grid responsivo de productos */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          processing={processing}
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
                      <p className="text-sm text-gray-600">
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          processing={true}
                          showProgress={true}
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
                      <p className="text-sm text-gray-600">
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          processing={false}
                          showCompleted={true}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <CatalogPreviewModal />
      </AppLayout>
    </ProtectedRoute>
  );
};

// Componente de tarjeta de producto mejorado
const ProductCard = ({ 
  product, 
  selectedProducts, 
  toggleProductSelection, 
  handleDeleteProduct, 
  processing, 
  showProgress = false, 
  showCompleted = false 
}: any) => {
  const status = getProcessingStatus(product);
  const displayImageUrl = getDisplayImageUrl(product);

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${
      processing ? 'opacity-50' : ''
    }`}>
      <div className="relative">
        <div className="aspect-square bg-gray-100">
          <img
            src={displayImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => toggleProductSelection(product.id)}
            className="bg-white shadow-sm"
            disabled={processing}
          />
        </div>
        
        <div className="absolute top-2 right-2">
          {showCompleted ? (
            <Badge className="bg-green-100 text-green-800 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Sin fondo
            </Badge>
          ) : (
            <Badge className={`text-xs ${
              status === 'pending' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {status === 'processing' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
              {status === 'pending' ? 'Pendiente' : 'Procesando'}
            </Badge>
          )}
        </div>
        
        {showProgress && status === 'processing' && product.processing_progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
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
      
      <CardContent className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">{product.name}</h3>
        
        {product.price_retail && (
          <p className="font-bold text-primary mb-2 text-sm">
            ${(product.price_retail / 100).toFixed(2)}
          </p>
        )}
        
        {product.category && (
          <Badge variant="outline" className="text-xs mb-2">
            {product.category}
          </Badge>
        )}
        
        <div className="flex gap-1 sm:gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs" disabled={processing}>
            <Eye className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Ver</span>
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs" disabled={processing}>
            <Edit className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            disabled={processing}
            onClick={() => handleDeleteProduct(product)}
            className="text-xs"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Products;