
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, UsageValidation } from '@/lib/subscriptionService';
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
  Zap,
  CreditCard,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';

const ImageReview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<ProcessedImageForUI[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Estados para suscripciones
  const [usageValidation, setUsageValidation] = useState<UsageValidation | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [totalCreditsConsumed, setTotalCreditsConsumed] = useState(0);

  useEffect(() => {
    if (user) {
      loadProcessedImages();
      loadUsageValidation();
      calculateCreditsConsumed();
      
      const interval = setInterval(() => {
        loadProcessedImages();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Cargar validación de suscripción
  const loadUsageValidation = async () => {
    if (!user) return;
    
    try {
      const validation = await subscriptionService.validateUsage(user.id);
      setUsageValidation(validation);
    } catch (error) {
      console.error('Error loading usage validation:', error);
    }
  };

  // Calcular créditos consumidos por procesamiento
  const calculateCreditsConsumed = async () => {
    if (!user) return;

    try {
      // Contar productos completados que consumieron créditos
      const { data, error } = await supabase
        .from('products')
        .select('credits_used')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .not('processed_image_url', 'is', null);

      if (error) throw error;

      const totalConsumed = data?.reduce((sum, product) => sum + (product.credits_used || 1), 0) || 0;
      setTotalCreditsConsumed(totalConsumed);

    } catch (error) {
      console.error('Error calculating credits consumed:', error);
    }
  };

  const loadProcessedImages = async () => {
    if (!user) return;

    try {
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
        .order('processed_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      setProducts(productsData || []);

      // Convertir a formato para UI - SOLO imágenes completadas con imagen procesada
      const convertedImages = (productsData || [])
        .map(product => productToProcessedImage(product))
        .filter(img => 
          img.status === 'completed' && 
          (img.processed_url || img.hd_url)
        );
      
      setImages(convertedImages);
      
    } catch (error) {
      console.error('Error cargando imágenes procesadas:', error);
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
    setLoading(true);
    await Promise.all([
      loadProcessedImages(),
      loadUsageValidation(),
      calculateCreditsConsumed()
    ]);
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

      for (const img of images.filter(i => selectedImages.includes(i.id))) {
        const { error } = await supabase
          .from('products')
          .update({ 
            is_processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', img.product_id);
        
        if (error) {
          console.warn(`Error marcando producto ${img.product_id} como procesado:`, error);
        }
      }

      toast({
        title: "Imágenes preparadas",
        description: `${selectedProductsData.length} productos listos para crear catálogo`,
        variant: "default",
      });

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
        description: error instanceof Error ? error.message : "No se pudieron preparar las imágenes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Banner de estado compacto
  const PlanStatusBanner = () => {
    if (!usageValidation) return null;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="p-3">
          {/* Mobile: Diseño compacto */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-900 text-sm">
                {usageValidation.currentPlan}
              </h4>
              <Button onClick={() => setShowCreditModal(true)} size="sm" className="h-7 text-xs">
                + Créditos
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-blue-700">
              <div className="text-center bg-white/50 rounded p-2">
                <div className="font-bold text-lg">{usageValidation.remainingBgCredits}</div>
                <div className="text-blue-600">Disponibles</div>
              </div>
              <div className="text-center bg-white/50 rounded p-2">
                <div className="font-bold text-lg text-orange-600">{totalCreditsConsumed}</div>
                <div className="text-blue-600">Consumidos</div>
              </div>
            </div>
          </div>

          {/* Desktop: Diseño completo */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h4 className="font-semibold text-blue-900">
                  {usageValidation.currentPlan}
                </h4>
                <div className="text-sm text-blue-700">
                  {usageValidation.remainingBgCredits} créditos disponibles
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-orange-600">{totalCreditsConsumed}</div>
                  <div className="text-blue-700">Consumidos</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{images.length}</div>
                  <div className="text-blue-700">Procesadas</div>
                </div>
              </div>
            </div>
            
            <Button onClick={() => setShowCreditModal(true)} size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Comprar Créditos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Modal de compra de créditos 
  const CreditModal = () => (
    <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Comprar Créditos Adicionales</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <TrendingUp className="h-4 w-4" />
              <span>Has procesado {images.length} imágenes exitosamente</span>
            </div>
          </div>
          
          <p className="mb-4 text-sm">Compra más créditos para seguir procesando:</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <div>
                <div className="font-semibold">Pack 10 Créditos</div>
                <div className="text-sm text-gray-600">$3.50 por crédito</div>
              </div>
              <div className="text-lg font-bold text-green-600">$35</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer bg-blue-50 border-blue-200">
              <div>
                <div className="font-semibold">Pack 25 Créditos ⭐</div>
                <div className="text-sm text-gray-600">$3.20 por crédito - Más popular</div>
              </div>
              <div className="text-lg font-bold text-blue-600">$80</div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <div>
                <div className="font-semibold">Pack 50 Créditos</div>
                <div className="text-sm text-gray-600">$3.00 por crédito - Mejor valor</div>
              </div>
              <div className="text-lg font-bold text-purple-600">$150</div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            * Los créditos no expiran por 12 meses. Ideal para procesar más productos.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCreditModal(false)} className="flex-1">
            Comprar Después
          </Button>
          <Button variant="outline" onClick={() => setShowCreditModal(false)} className="flex-1">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Actions responsivas
  const actions = (
    <div className="flex items-center gap-2">
      {/* Botón volver */}
      <Button onClick={() => navigate('/products?tab=completed')} variant="outline" size="sm">
        <ArrowLeft className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Volver</span>
      </Button>

      {selectedImages.length > 0 && (
        <div className="flex items-center gap-1 md:gap-2">
          <Button 
            onClick={handleSaveAndCreateCatalog}
            disabled={saving}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Palette className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Crear Catálogo</span>
                <span className="md:hidden">({selectedImages.length})</span>
              </>
            )}
          </Button>
        </div>
      )}
      
      <Button onClick={handleForceRefresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Actualizar</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <AppLayout actions={actions}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando imágenes procesadas...</p>
            </div>
          </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout actions={actions}>
        {/* Banner de suscripción con información de créditos */}
        <PlanStatusBanner />

        {images.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 md:py-12">
              <FileImage className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                No hay imágenes procesadas
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                Ve a tu biblioteca y procesa algunas imágenes para remover el fondo
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/products?tab=pending')}>
                  <Zap className="h-4 w-4 mr-2" />
                  Procesar Imágenes
                </Button>
                <Button onClick={() => navigate('/products')} variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Ver Biblioteca
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Card de estadísticas */}
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-4">
                    <Checkbox
                      checked={selectedImages.length === images.length && images.length > 0}
                      onCheckedChange={selectAllImages}
                      className="h-5 w-5 md:h-4 md:w-4"
                    />
                    <div className="text-xs md:text-sm text-gray-600">
                      <span className="font-medium">{selectedImages.length}</span> de{' '}
                      <span className="font-medium">{images.length}</span> seleccionadas
                      {selectedImages.length > 0 && (
                        <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                          Listas
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                      <span className="hidden sm:inline">{images.length} procesadas</span>
                      <span className="sm:hidden">{images.length}</span>
                    </div>
                    {totalCreditsConsumed > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                        <span className="hidden sm:inline">{totalCreditsConsumed} créditos usados</span>
                        <span className="sm:hidden">{totalCreditsConsumed}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid de imágenes más compacto y responsivo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 md:gap-4">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative aspect-square bg-gray-50">
                    <img
                      src={image.processed_url || image.hd_url || image.original_url}
                      alt={image.product_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Checkbox */}
                    <div className="absolute top-1 md:top-2 left-1 md:left-2">
                      <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onCheckedChange={() => toggleImageSelection(image.id)}
                        className="bg-white shadow-sm h-4 w-4 md:h-4 md:w-4"
                      />
                    </div>
                    
                    {/* Badge */}
                    <div className="absolute top-1 md:top-2 right-1 md:right-2">
                      <Badge className="bg-green-500 text-white text-xs px-1 py-0.5">
                        <CheckCircle className="w-2 h-2 md:w-3 md:h-3 mr-0.5" />
                        <span className="hidden sm:inline">Listo</span>
                      </Badge>
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 md:gap-2">
                      <Button size="sm" variant="secondary" className="h-6 w-6 md:h-8 md:w-8 p-0">
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-6 w-6 md:h-8 md:w-8 p-0">
                        <Download className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Información más compacta */}
                  <CardContent className="p-2 md:p-3">
                    <h3 className="font-medium text-xs md:text-sm truncate mb-1">
                      {image.product_name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs">
                      {image.price_retail && (
                        <span className="font-bold text-primary">
                          ${(image.price_retail / 100).toFixed(0)}
                        </span>
                      )}
                      {image.category && (
                        <Badge variant="outline" className="text-xs py-0 px-1 hidden md:inline-flex">
                          {image.category}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info final sobre selección */}
            {selectedImages.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <Palette className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 text-sm md:text-base">
                        {selectedImages.length} imágenes seleccionadas
                      </h4>
                      <p className="text-xs md:text-sm text-green-700">
                        Imágenes sin fondo, listas para crear un catálogo profesional
                      </p>
                    </div>
                    
                    {/* Botón secundario de comprar créditos */}
                    <Button 
                      onClick={() => setShowCreditModal(true)} 
                      variant="outline" 
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <CreditCard className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Más Créditos</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Modal de compra de créditos */}
        <CreditModal />
      </AppLayout>
  );
};

export default ImageReview;
