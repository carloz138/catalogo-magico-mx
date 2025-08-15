import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
// ✅ IMPORTAR TIPOS CORRECTOS
import { Product, ProcessedImageForUI, productToProcessedImage, getDisplayImageUrl, getProcessingStatus, hasBeforeAfterComparison } from '@/types/products';
import { 
  FileImage, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Filter,
  RefreshCw,
  Palette,
  Save,
  ArrowLeftRight,
  Loader2,
  Package,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

const ImageReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<ProcessedImageForUI[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showComparison, setShowComparison] = useState<boolean>(true);

  useEffect(() => {
    loadProcessedImages();
    // ✅ Auto-refresh cada 15 segundos
    const interval = setInterval(loadProcessedImages, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProcessedImages = async () => {
    if (!user) return;

    try {
      console.log('🔍 Cargando productos para review...');
      
      // ✅ QUERY CORRECTO: Usar campos que SÍ existen (incluir user_id)
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          id, user_id, name, description, custom_description,
          price_retail, category, brand,
          original_image_url, processed_image_url, hd_image_url, image_url,
          processing_status, processing_progress, is_processed, processed_at,
          credits_used, service_type, error_message,
          created_at, updated_at
        `)
        .eq('user_id', user.id)
        .not('original_image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando productos:', error);
        throw error;
      }

      console.log(`📦 Cargados ${productsData?.length || 0} productos`);
      setProducts(productsData || []);

      // ✅ CONVERTIR a formato para UI
      const convertedImages = (productsData || []).map(productToProcessedImage);
      setImages(convertedImages);
      
      console.log(`✅ Convertidos ${convertedImages.length} productos para review`);
      
    } catch (error) {
      console.error('❌ Error cargando imágenes procesadas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes procesadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image => {
    return filterStatus === 'all' || image.status === filterStatus;
  });

  const completedImages = filteredImages.filter(img => img.status === 'completed');

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAllCompleted = () => {
    const completedIds = completedImages.map(img => img.id);
    if (selectedImages.length === completedIds.length && completedIds.length > 0) {
      setSelectedImages([]);
    } else {
      setSelectedImages(completedIds);
    }
  };

  // ✅ FUNCIÓN: Guardar Y Crear Catálogo
  const handleSaveAndCreateCatalog = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "Selecciona imágenes",
        description: "Debes seleccionar al menos una imagen procesada para crear un catálogo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Preparando catálogo con imágenes seleccionadas...');
      
      // ✅ Obtener productos seleccionados con imágenes procesadas
      const selectedProductsData = images
        .filter(img => selectedImages.includes(img.id) && img.status === 'completed')
        .map(img => {
          const product = products.find(p => p.id === img.product_id);
          return {
            id: img.product_id,
            name: img.product_name,
            description: img.product_description,
            category: img.category,
            price_retail: img.price_retail || 0,
            // ✅ USAR IMAGEN PROCESADA CORRECTA
            image_url: img.processed_url || img.hd_url || getDisplayImageUrl(product!),
            original_image_url: img.original_url,
            processed_image_url: img.processed_url,
            hd_image_url: img.hd_url,
            created_at: img.created_at
          };
        });

      if (selectedProductsData.length === 0) {
        throw new Error('No hay imágenes completadas seleccionadas');
      }

      console.log(`📋 Productos preparados para catálogo:`, selectedProductsData.length);

      // ✅ Marcar como procesados en BD
      for (const img of images.filter(i => selectedImages.includes(i.id))) {
        const { error } = await supabase
          .from('products')
          .update({ 
            is_processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', img.product_id);
        
        if (error) {
          console.warn(`⚠️ Error marcando producto ${img.product_id} como procesado:`, error);
        }
      }

      toast({
        title: "¡Imágenes preparadas!",
        description: `${selectedProductsData.length} productos listos para crear catálogo`,
        variant: "default",
      });

      console.log('✅ Navegando a template selection con productos:', selectedProductsData);

      // ✅ NAVEGACIÓN CORRECTA
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
      console.error('❌ Error preparando catálogo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron preparar las imágenes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ FUNCIÓN: Solo marcar como guardadas
  const handleSaveToStorage = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "Selecciona imágenes",
        description: "Debes seleccionar al menos una imagen para guardar",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Marcando imágenes como guardadas...');
      
      for (const imageId of selectedImages) {
        const { error } = await supabase
          .from('products')
          .update({ 
            is_processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', imageId);
        
        if (error) {
          console.warn(`⚠️ Error guardando producto ${imageId}:`, error);
        }
      }

      toast({
        title: "¡Imágenes guardadas!",
        description: `${selectedImages.length} imágenes marcadas como procesadas`,
        variant: "default",
      });

      // ✅ Recargar datos
      await loadProcessedImages();
      setSelectedImages([]);

    } catch (error) {
      console.error('❌ Error guardando imágenes:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las imágenes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Loader2, text: 'Procesando' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completado' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Error' },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {config.text}
      </Badge>
    );
  };

  const getStatsCards = () => {
    const stats = {
      total: images.length,
      completed: images.filter(img => img.status === 'completed').length,
      processing: images.filter(img => img.status === 'processing').length,
      failed: images.filter(img => img.status === 'failed').length,
      pending: images.filter(img => img.status === 'pending').length
    };

    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
            <p className="text-sm text-gray-600">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold text-red-600">{stats.failed}</h3>
            <p className="text-sm text-gray-600">Errores</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="completed">Completadas</option>
          <option value="processing">Procesando</option>
          <option value="pending">Pendientes</option>
          <option value="failed">Con error</option>
        </select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowComparison(!showComparison)}
      >
        <ArrowLeftRight className="h-4 w-4 mr-2" />
        {showComparison ? 'Ocultar' : 'Mostrar'} Comparación
      </Button>
      
      {selectedImages.length > 0 && (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleSaveToStorage}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Marcar como Guardadas ({selectedImages.length})
          </Button>
          
          <Button 
            onClick={handleSaveAndCreateCatalog}
            disabled={saving || selectedImages.filter(id => {
              const img = images.find(i => i.id === id);
              return img?.status === 'completed';
            }).length === 0}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Palette className="h-4 w-4 mr-2" />
            )}
            Crear Catálogo
          </Button>
        </div>
      )}
      
      <Button onClick={loadProcessedImages} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Actualizar
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando imágenes procesadas...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        {images.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay imágenes para revisar
              </h3>
              <p className="text-gray-600 mb-4">
                Ve a tu biblioteca de productos y selecciona algunos para procesar sus imágenes
              </p>
              <Button onClick={() => navigate('/products')}>
                <Package className="h-4 w-4 mr-2" />
                Ver Productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* ✅ ESTADÍSTICAS */}
            {getStatsCards()}

            {/* ✅ BANNER DE PROGRESO */}
            {images.filter(img => img.status === 'processing').length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Procesando {images.filter(img => img.status === 'processing').length} imágenes...
                      </h4>
                      <p className="text-sm text-blue-700">
                        El sistema está quitando fondos y optimizando las imágenes. Actualización automática cada 15 segundos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selection controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedImages.length === completedImages.length && completedImages.length > 0}
                      onCheckedChange={selectAllCompleted}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedImages.length} de {completedImages.length} imágenes completadas seleccionadas
                    </span>
                    {selectedImages.length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Listas para catálogo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image) => {
                const product = products.find(p => p.id === image.product_id);
                const hasComparison = product && hasBeforeAfterComparison(product);
                
                return (
                  <Card key={image.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* ✅ COMPARACIÓN ANTES/DESPUÉS */}
                    {showComparison && hasComparison && image.status === 'completed' ? (
                      <div className="grid grid-cols-2 gap-1">
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={image.original_url}
                            alt={`${image.product_name} - Original`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1">
                            <Badge className="bg-red-100 text-red-800 text-xs">Original</Badge>
                          </div>
                        </div>
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={image.processed_url || image.hd_url || image.original_url}
                            alt={`${image.product_name} - Procesada`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1">
                            <Badge className="bg-green-100 text-green-800 text-xs">Sin fondo</Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={image.processed_url || image.hd_url || image.original_url}
                          alt={image.product_name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* ✅ PROGRESO DE PROCESAMIENTO */}
                        {image.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <div className="text-sm">{image.progress}%</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* ✅ CONTROLES */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onCheckedChange={() => toggleImageSelection(image.id)}
                        className="bg-white"
                        disabled={image.status !== 'completed'}
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(image.status)}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 truncate">{image.product_name}</h3>
                      {image.product_description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {image.product_description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        {image.price_retail && (
                          <span className="font-bold text-primary">
                            ${(image.price_retail / 100).toFixed(2)} MXN
                          </span>
                        )}
                        {image.category && (
                          <Badge variant="outline" className="text-xs">
                            {image.category}
                          </Badge>
                        )}
                      </div>

                      {/* ✅ INFO DE PROCESAMIENTO */}
                      <div className="text-xs text-gray-500 mb-3">
                        <div>Estado: {image.status}</div>
                        <div>Servicio: {image.service_type || 'básico'}</div>
                        <div>Créditos: {image.credits_used || 'N/A'}</div>
                        <div>{new Date(image.created_at).toLocaleDateString('es-ES')}</div>
                      </div>

                      {/* ✅ ERROR MESSAGE */}
                      {image.status === 'failed' && image.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                          <p className="text-xs text-red-700">{image.error_message}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        {image.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* ✅ INFO PARA CREAR CATÁLOGO */}
            {selectedImages.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">
                        {selectedImages.length} imágenes seleccionadas para catálogo
                      </h4>
                      <p className="text-sm text-green-700">
                        Las imágenes están listas para crear un catálogo profesional con fondos transparentes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default ImageReview;
