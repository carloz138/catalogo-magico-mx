import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ShoppingCart
} from 'lucide-react';

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // ✅ NUEVOS ESTADOS PARA SUSCRIPCIONES
  const [usageValidation, setUsageValidation] = useState<UsageValidation | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadUsageValidation(); // ✅ NUEVA FUNCIÓN
      
      // Auto-refresh para ver estado de procesamiento
      const interval = setInterval(loadProducts, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ✅ TESTING TEMPORAL - useEffect adicional
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        import('@/lib/subscriptionService').then(({ testSubscriptionService }) => {
          testSubscriptionService(user.id);
        });
      }, 3000);
    }
  }, [user]);

  // ✅ NUEVA FUNCIÓN: Cargar validación de uso
  const loadUsageValidation = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Loading usage validation...');
      const validation = await subscriptionService.validateUsage(user.id);
      setUsageValidation(validation);
      console.log('✅ Usage validation loaded:', validation);
    } catch (error) {
      console.error('❌ Error loading usage validation:', error);
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
      console.log(`✅ Cargados ${data?.length || 0} productos`);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const status = getProcessingStatus(product);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // ✅ FUNCIÓN MODIFICADA: Procesar imágenes con validaciones
  const handleProcessImages = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para procesar",
        variant: "destructive",
      });
      return;
    }

    // ✅ NUEVA VALIDACIÓN DE CRÉDITOS
    console.log('🔍 Validating credits before processing...');
    if (!usageValidation?.canProcessBackground) {
      if (usageValidation?.suggestCreditPurchase) {
        toast({
          title: "Sin créditos disponibles",
          description: "Necesitas comprar créditos para quitar fondos. Plan gratuito no incluye procesamiento.",
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
        description: `Necesitas ${selectedProducts.length} créditos, pero solo tienes ${usageValidation.remainingBgCredits}. Compra más créditos o selecciona menos productos.`,
        variant: "destructive",
      });
      setShowCreditModal(true);
      return;
    }

    console.log(`🚀 Starting processing with ${usageValidation.remainingBgCredits} credits available`);
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
        estimated_cost_mxn: 2.0 // Tu costo real
      }));

      // ✅ CONSUMIR CRÉDITOS ANTES DEL WEBHOOK
      console.log(`💳 Consuming ${selectedProducts.length} credits...`);
      const creditsConsumed = await subscriptionService.consumeBackgroundRemovalCredit(
        user.id, 
        selectedProducts.length
      );

      if (!creditsConsumed) {
        throw new Error('No se pudieron consumir los créditos');
      }

      console.log('✅ Credits consumed successfully');

      // Marcar como procesando
      await Promise.all(selectedProductsData.map(product => 
        supabase
          .from('products')
          .update({ 
            processing_status: 'processing',
            processing_progress: 0
          })
          .eq('id', product.id)
      ));

      // Recargar validación después de consumir créditos
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
          title: "¡Procesamiento iniciado!",
          description: `${selectedProducts.length} productos enviados al webhook. ${selectedProducts.length} créditos consumidos.`,
          variant: "default",
        });

        console.log('✅ Webhook successful, navigating to image-review');
        navigate('/image-review');
        
      } else {
        throw new Error(result.error || 'Error en el procesamiento');
      }

    } catch (error) {
      console.error('❌ Error procesando imágenes:', error);
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

  // ✅ NUEVA FUNCIÓN: Guardar sin procesar
  const handleSaveWithoutProcessing = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para guardar",
        variant: "destructive",
      });
      return;
    }

    try {
      await Promise.all(selectedProducts.map(productId => 
        supabase
          .from('products')
          .update({ 
            processing_status: 'saved_original',
            is_processed: false,
            processed_at: new Date().toISOString()
          })
          .eq('id', productId)
      ));

      toast({
        title: "Productos guardados",
        description: `${selectedProducts.length} productos guardados con imagen original`,
        variant: "default",
      });

      setSelectedProducts([]);
      await loadProducts();

    } catch (error) {
      console.error('Error guardando productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los productos",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (product: Product) => {
    const status = getProcessingStatus(product);
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Pendiente' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Loader2, text: 'Procesando' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Listo' },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Error' },
    };
    
    const config = configs[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1 text-xs`} variant="outline">
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {config.text}
      </Badge>
    );
  };

  const getStats = () => {
    const stats = {
      total: products.length,
      pending: products.filter(p => getProcessingStatus(p) === 'pending').length,
      processing: products.filter(p => getProcessingStatus(p) === 'processing').length,
      completed: products.filter(p => getProcessingStatus(p) === 'completed').length,
      failed: products.filter(p => getProcessingStatus(p) === 'failed').length,
    };
    return stats;
  };

  const stats = getStats();

  const handleViewProduct = (product: Product) => {
    console.log('Ver producto:', product.name);
    toast({
      title: "Vista de producto",
      description: `Abriendo ${product.name}`,
    });
  };

  const handleEditProduct = (product: Product) => {
    console.log('Editar producto:', product.name);
    toast({
      title: "Editar producto",
      description: `Editando ${product.name}`,
    });
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

  // ✅ COMPONENTE: Banner de estado de plan
  const PlanStatusBanner = () => {
    if (!usageValidation) return null;

    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">
                📋 {usageValidation.currentPlan}
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>📤 Subidas restantes: {usageValidation.remainingUploads}</p>
                <p>✨ Créditos para fondos: {usageValidation.remainingBgCredits}</p>
                <p>📋 Catálogos restantes: {usageValidation.remainingCatalogs}</p>
              </div>
            </div>
            {usageValidation.suggestCreditPurchase && (
              <Button onClick={() => setShowCreditModal(true)} size="sm">
                💳 Comprar Créditos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ✅ COMPONENTE: Modal de upgrade
  const UpgradeModal = () => (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🚀 Upgrade Requerido</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">{usageValidation?.upgradeRequired}</p>
          <div className="space-y-2">
            <p><strong>Planes disponibles:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Plan Básico: $299/mes - 5 créditos + 50 uploads</li>
              <li>Plan Estándar: $599/mes - 30 créditos + 200 uploads</li>
              <li>Plan Premium: $1,199/mes - 80 créditos + 500 uploads</li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/pricing')}>
            Ver Planes
          </Button>
          <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ✅ COMPONENTE: Modal de compra de créditos
  const CreditModal = () => (
    <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>💳 Comprar Créditos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">Compra créditos adicionales para procesar más imágenes:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <h4 className="font-semibold">Pack 10 Créditos</h4>
              <p className="text-2xl font-bold text-green-600">$35 MXN</p>
              <p className="text-sm text-gray-600">$3.50 por crédito</p>
            </div>
            <div className="border rounded p-3">
              <h4 className="font-semibold">Pack 25 Créditos</h4>
              <p className="text-2xl font-bold text-blue-600">$80 MXN</p>
              <p className="text-sm text-gray-600">$3.20 por crédito ⭐</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">* Los créditos no expiran por 12 meses</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCreditModal(false)}>
            Comprar Después
          </Button>
          <Button variant="outline" onClick={() => setShowCreditModal(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>
      
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-2">
          {/* ✅ NUEVO: Botón guardar sin procesar */}
          <Button 
            variant="outline"
            onClick={handleSaveWithoutProcessing}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Sin Fondo ({selectedProducts.length})
          </Button>

          {/* Botón procesar modificado */}
          <Button 
            onClick={handleProcessImages} 
            disabled={processing}
            className="flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Quitar Fondos ({selectedProducts.length})
              </>
            )}
          </Button>
        </div>
      )}
      
      <Button onClick={() => navigate('/upload')} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Agregar Productos
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
        {/* ✅ NUEVO: Banner de estado de plan */}
        <PlanStatusBanner />
        
        {products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes productos guardados
              </h3>
              <p className="text-gray-600 mb-4">
                Sube tus primeras imágenes de productos para comenzar
              </p>
              <Button onClick={() => navigate('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Subir Productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                  <p className="text-sm text-gray-600">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-gray-600">{stats.pending}</h3>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-blue-600">{stats.processing}</h3>
                  <p className="text-sm text-gray-600">Procesando</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3>
                  <p className="text-sm text-gray-600">Listos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-red-600">{stats.failed}</h3>
                  <p className="text-sm text-gray-600">Errores</p>
                </CardContent>
              </Card>
            </div>

            {/* BANNER DE PROCESAMIENTO */}
            {processing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Procesando {selectedProducts.length} productos...
                      </h4>
                      <p className="text-sm text-blue-700">
                        El webhook está quitando fondos de las imágenes. Este proceso puede tardar 2-5 minutos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CONTROLES DE FILTROS */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={selectAllProducts}
                      disabled={processing}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedProducts.length} de {filteredProducts.length} productos seleccionados
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      disabled={processing}
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      disabled={processing}
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Pendientes</option>
                      <option value="processing">Procesando</option>
                      <option value="completed">Listos</option>
                      <option value="failed">Con error</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GRID DE PRODUCTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const status = getProcessingStatus(product);
                const displayImageUrl = getDisplayImageUrl(product);
                
                return (
                  <Card key={product.id} className={`overflow-hidden hover:shadow-md transition-shadow ${
                    processing ? 'opacity-50' : ''
                  }`}>
                    <div className="relative">
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={displayImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                          className="bg-white"
                          disabled={processing}
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(product)}
                      </div>
                      
                      {status === 'processing' && product.processing_progress !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
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
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      {product.price_retail && (
                        <p className="font-bold text-primary mb-2">
                          ${(product.price_retail / 100).toFixed(2)} MXN
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                        {product.has_variants && product.variant_count && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            {product.variant_count} variantes
                          </Badge>
                        )}
                      </div>

                      {status === 'failed' && product.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                          <p className="text-xs text-red-700">{product.error_message}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1" 
                          disabled={processing}
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1" 
                          disabled={processing}
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={processing}
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedProducts.length > 0 && !processing && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">
                        {selectedProducts.length} productos listos para procesar
                      </h4>
                      <p className="text-sm text-green-700">
                        El sistema quitará los fondos de las imágenes y las optimizará para catálogos profesionales.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* ✅ NUEVOS MODALES */}
        <UpgradeModal />
        <CreditModal />
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Products;
