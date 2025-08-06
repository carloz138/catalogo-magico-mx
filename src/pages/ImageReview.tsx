import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { toast } from '@/hooks/use-toast';
import { downloadImageFromUrl, uploadImageToSupabase } from '@/utils/imageProcessing';

interface ProcessedImage {
  product_id: string;
  product_name: string;
  original_url: string;
  processed_url: string;
  api_used: string;
  expires_at: string;
  credits_estimated: number;
  cost_mxn: number;
}

interface SavedProduct {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
  category: string;
  price_retail: number;
}

interface LocationState {
  processedImages?: ProcessedImage[];
  selectedProducts?: any[];
}

interface ImageDownloadProgress {
  [productId: string]: {
    status: 'pending' | 'downloading' | 'processing' | 'uploading' | 'completed' | 'error';
    progress: number;
    error?: string;
  };
}

const ImageReview = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'saved'>('pending');
  const [pendingImages, setPendingImages] = useState<ProcessedImage[]>([]);
  const [savedImages, setSavedImages] = useState<SavedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<ImageDownloadProgress>({});
  const [isSaving, setIsSaving] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const state = location.state as LocationState;

  const fetchSavedImages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          image_url,
          processing_status,
          is_processed,
          created_at,
          original_image_url,
          category,
          price_retail
        `)
        .eq('user_id', user.id)
        .eq('is_processed', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const savedProducts: SavedProduct[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url || item.original_image_url || '',
        created_at: item.created_at || '',
        category: item.category || '',
        price_retail: item.price_retail || 0
      }));

      setSavedImages(savedProducts);
    } catch (error) {
      console.error('Error fetching saved images:', error);
      toast({
        title: "Error",
        description: "Error al cargar las imágenes guardadas",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      
      // Always fetch saved images
      await fetchSavedImages();

      // Handle navigation state
      if (state?.processedImages && state?.selectedProducts) {
        setPendingImages(state.processedImages);
        setSelectedProducts(state.selectedProducts);
        
        // Select all pending images by default
        const allIds = new Set(state.processedImages.map(img => img.product_id));
        setSelectedImageIds(allIds);
        setActiveTab('pending');
      }

      setIsLoading(false);
    };

    initializeComponent();
  }, [state, user]);

  const saveAndContinue = async () => {
    if (selectedImageIds.size === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos una imagen",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    const selectedImages = pendingImages.filter(img => selectedImageIds.has(img.product_id));
    const totalImages = selectedImages.length;
    let completedImages = 0;

    // Initialize progress tracking
    const initialProgress: ImageDownloadProgress = {};
    selectedImages.forEach(img => {
      initialProgress[img.product_id] = { status: 'pending', progress: 0 };
    });
    setDownloadProgress(initialProgress);

    const savedProducts = [];

    try {
      for (const image of selectedImages) {
        const productId = image.product_id;
        
        try {
          // Update status to downloading
          setDownloadProgress(prev => ({
            ...prev,
            [productId]: { status: 'downloading', progress: 25 }
          }));

          // Download the processed image
          const imageBlob = await downloadImageFromUrl(image.processed_url);

          // Update status to processing
          setDownloadProgress(prev => ({
            ...prev,
            [productId]: { status: 'processing', progress: 50 }
          }));

          // Update status to uploading
          setDownloadProgress(prev => ({
            ...prev,
            [productId]: { status: 'uploading', progress: 75 }
          }));

          // Upload to Supabase with multiple sizes
          const uploadedUrls = await uploadImageToSupabase(
            supabase,
            productId,
            imageBlob,
            `processed_${productId}.jpg`
          );

          // Find the original product data
          const originalProduct = selectedProducts.find(p => p.id === productId);
          
          // Update product in database
          const { error: updateError } = await supabase
            .from('products')
            .update({
              processed_image_url: uploadedUrls.catalog,
              processing_status: 'completed',
              is_processed: true,
              credits_used: image.credits_estimated
            })
            .eq('id', productId);

          if (updateError) throw updateError;

          // Add to saved products list with updated data
          savedProducts.push({
            ...originalProduct,
            processed_image_url: uploadedUrls.catalog,
            processing_status: 'completed',
            is_processed: true
          });

          // Update status to completed
          setDownloadProgress(prev => ({
            ...prev,
            [productId]: { status: 'completed', progress: 100 }
          }));

          completedImages++;
          setOverallProgress((completedImages / totalImages) * 100);

        } catch (error) {
          console.error(`Error processing image for product ${productId}:`, error);
          
          setDownloadProgress(prev => ({
            ...prev,
            [productId]: { 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Error desconocido'
            }
          }));
        }
      }

      if (savedProducts.length > 0) {
        toast({
          title: "¡Éxito!",
          description: `${savedProducts.length} imágenes guardadas correctamente`
        });

        // Refresh saved images
        await fetchSavedImages();

        // Clear pending images and reset selection
        setPendingImages([]);
        setSelectedImageIds(new Set());
        
        // Switch to saved tab
        setActiveTab('saved');

        // Navigate to template selection with saved products
        navigate('/template-selection', {
          state: { 
            products: savedProducts,
            businessInfo: businessInfo,
            skipProcessing: true 
          }
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar las imágenes seleccionadas",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error saving images:', error);
      toast({
        title: "Error",
        description: "Error al guardar las imágenes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleImageSelection = (productId: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allIds = new Set(pendingImages.map(img => img.product_id));
    setSelectedImageIds(allIds);
  };

  const selectNone = () => {
    setSelectedImageIds(new Set());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-600" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando biblioteca de imágenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/products')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Productos</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Biblioteca de Imágenes</h1>
                <p className="text-gray-600">
                  Gestiona tus imágenes procesadas
                </p>
              </div>
            </div>
            
            {activeTab === 'pending' && pendingImages.length > 0 && (
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={selectAll} disabled={isSaving}>
                  Seleccionar Todo
                </Button>
                <Button variant="outline" onClick={selectNone} disabled={isSaving}>
                  Deseleccionar Todo
                </Button>
              </div>
            )}
          </div>
          
          {isSaving && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso general</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'saved')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              Por confirmar ({pendingImages.length})
            </TabsTrigger>
            <TabsTrigger value="saved">
              Guardadas ({savedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingImages.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay imágenes por confirmar
                </h3>
                <p className="text-gray-600 mb-4">
                  Las imágenes procesadas aparecerán aquí para tu revisión
                </p>
                <Button 
                  onClick={() => setActiveTab('saved')}
                  variant="outline"
                >
                  Ver imágenes guardadas
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {pendingImages.map((image) => {
                  const isSelected = selectedImageIds.has(image.product_id);
                  const progress = downloadProgress[image.product_id];
                  
                  return (
                    <Card key={image.product_id} className={`overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}>
                      <CardContent className="p-0">
                        <div className="aspect-square relative">
                          <img
                            src={image.processed_url}
                            alt={image.product_name}
                            className="w-full h-full object-cover"
                          />
                          
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleImageSelection(image.product_id)}
                              disabled={isSaving}
                              className="bg-white"
                            />
                          </div>
                          
                          {progress && (
                            <div className="absolute top-2 right-2">
                              {getStatusIcon(progress.status)}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                            {image.product_name}
                          </h3>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>API: {image.api_used}</div>
                            <div>Créditos: {image.credits_estimated}</div>
                            <div>Costo: ${image.cost_mxn} MXN</div>
                          </div>
                          
                          {progress && progress.status !== 'pending' && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span className="capitalize">{progress.status}</span>
                                <span>{progress.progress}%</span>
                              </div>
                              <Progress value={progress.progress} className="h-2" />
                              {progress.error && (
                                <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {savedImages.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No tienes imágenes guardadas
                </h3>
                <p className="text-gray-600 mb-4">
                  Las imágenes que confirmes aparecerán aquí
                </p>
                <Button 
                  onClick={() => navigate('/products')}
                  variant="outline"
                >
                  Procesar imágenes
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {savedImages.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Guardado: {new Date(product.created_at).toLocaleDateString()}</div>
                          <div>Categoría: {product.category}</div>
                          <div>Precio: ${product.price_retail}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Bottom action bar - only show for pending tab with selections */}
        {activeTab === 'pending' && selectedImageIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedImageIds.size} imagen{selectedImageIds.size !== 1 ? 'es' : ''} seleccionada{selectedImageIds.size !== 1 ? 's' : ''}
                </div>
                <Button 
                  onClick={saveAndContinue}
                  disabled={isSaving || selectedImageIds.size === 0}
                  className="bg-primary text-white"
                >
                  {isSaving ? 'Guardando...' : `Guardar y elegir template (${selectedImageIds.size} productos)`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageReview;
