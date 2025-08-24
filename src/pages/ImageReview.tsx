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
import { Product, ProcessedImageForUI, productToProcessedImage, getDisplayImageUrl } from '@/types/products';
import { 
  FileImage, 
  CheckCircle, 
  Eye, 
  Download,
  RefreshCw,
  Palette,
  Save,
  Loader2,
  Package,
  Bug
} from 'lucide-react';

const ImageReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<ProcessedImageForUI[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadProcessedImages();
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered');
      loadProcessedImages();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProcessedImages = async () => {
    if (!user) return;

    try {
      console.log('🔍 Cargando productos procesados...');
      setLastRefresh(new Date());
      
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

      // Convertir a formato para UI - SOLO imágenes completadas con imagen procesada
      const convertedImages = (productsData || [])
        .map(product => productToProcessedImage(product))
        .filter(img => 
          img.status === 'completed' && 
          (img.processed_url || img.hd_url)
        );
      
      setImages(convertedImages);
      
      console.log(`✅ ${convertedImages.length} imágenes procesadas listas para review`);
      
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

  const handleForceRefresh = async () => {
    console.log('🔄 FORCE REFRESH manual triggered');
    setLoading(true);
    await loadProcessedImages();
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log('🐛 Debug mode:', !debugMode ? 'ENABLED' : 'DISABLED');
  };

  const debugSpecificProduct = async (productId: string) => {
    console.log(`🔍 DEBUGGING producto específico: ${productId}`);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('🐛 PRODUCTO COMPLETO:', data);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAllImages = () => {
    if (selectedImages.length === images.length && images.length > 0) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

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
      
      const selectedProductsData = images
        .filter(img => selectedImages.includes(img.id))
        .map(img => {
          const product = products.find(p => p.id === img.product_id);
          return {
            id: img.product_id,
            name: img.product_name,
            description: img.product_description,
            category: img.category,
            price_retail: img.price_retail || 0,
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

  const actions = (
    <div className="flex items-center gap-3">
      {debugMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleDebugMode}
          className="bg-red-50 border-red-300 text-red-700"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ON
        </Button>
      )}
      
      {selectedImages.length > 0 && (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleSaveToStorage}
            disabled={saving}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar ({selectedImages.length})
          </Button>
          
          <Button 
            onClick={handleSaveAndCreateCatalog}
            disabled={saving}
            size="sm"
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
      
      <Button onClick={handleForceRefresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Actualizar
      </Button>

      {!debugMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDebugMode}
        >
          <Bug className="h-4 w-4" />
        </Button>
      )}
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
        {debugMode && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Panel de Debugging
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Última actualización:</strong><br />
                  {lastRefresh.toLocaleTimeString()}
                </div>
                <div>
                  <strong>Total productos:</strong><br />
                  {products.length} en BD, {images.length} procesadas
                </div>
                <div>
                  <strong>Seleccionadas:</strong><br />
                  {selectedImages.length} de {images.length}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {images.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay imágenes procesadas
              </h3>
              <p className="text-gray-600 mb-4">
                Ve a tu biblioteca de productos y procesa algunas imágenes para remover el fondo
              </p>
              <Button onClick={() => navigate('/products')}>
                <Package className="h-4 w-4 mr-2" />
                Ver Productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedImages.length === images.length && images.length > 0}
                      onCheckedChange={selectAllImages}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedImages.length} de {images.length} imágenes seleccionadas
                    </span>
                    {selectedImages.length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Listas para catálogo
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{images.length} procesadas</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid de imágenes procesadas - MÁS PEQUEÑAS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Imagen procesada sin fondo */}
                  <div className="relative aspect-square bg-gray-50">
                    <img
                      src={image.processed_url || image.hd_url || image.original_url}
                      alt={image.product_name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Checkbox de selección */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onCheckedChange={() => toggleImageSelection(image.id)}
                        className="bg-white shadow-sm"
                      />
                    </div>
                    
                    {/* Badge de completado */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sin fondo
                      </Badge>
                    </div>

                    {/* Overlay con botones - visible en hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Información compacta del producto */}
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate mb-1">{image.product_name}</h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      {image.price_retail && (
                        <span className="font-semibold text-primary">
                          ${(image.price_retail / 100).toFixed(0)}
                        </span>
                      )}
                      {image.category && (
                        <Badge variant="outline" className="text-xs py-0">
                          {image.category}
                        </Badge>
                      )}
                    </div>

                    {/* Debug info */}
                    {debugMode && (
                      <div className="mt-2 p-1 bg-red-50 rounded text-xs">
                        <div>ID: {image.id.slice(-6)}</div>
                        <button 
                          onClick={() => debugSpecificProduct(image.product_id)}
                          className="text-red-600 hover:underline"
                        >
                          Debug
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info final sobre selección */}
            {selectedImages.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">
                        {selectedImages.length} imágenes seleccionadas
                      </h4>
                      <p className="text-sm text-green-700">
                        Imágenes procesadas sin fondo, listas para crear un catálogo profesional.
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
