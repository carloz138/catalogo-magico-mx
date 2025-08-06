import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, Check, X, AlertCircle, Sparkles, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { toast } from '@/hooks/use-toast';

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

// ✅ FUNCIONES DE UTILIDAD (antes importadas de utils)
const downloadImageFromUrl = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download processed image');
  }
};

const resizeImage = (blob: Blob, maxWidth: number, maxHeight: number, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(blob);
  });
};

const uploadImageToSupabase = async (
  supabaseClient: any,
  productId: string, 
  originalBlob: Blob, 
  filename: string
): Promise<{ thumbnail: string; catalog: string; luxury: string; print: string }> => {
  const timestamp = Date.now();
  const baseFilename = `${timestamp}_${productId}`;
  
  const [thumbnailBlob, catalogBlob, luxuryBlob, printBlob] = await Promise.all([
    resizeImage(originalBlob, 300, 300, 0.8),
    resizeImage(originalBlob, 800, 800, 0.85),
    resizeImage(originalBlob, 1200, 1200, 0.9),
    resizeImage(originalBlob, 2400, 2400, 0.95)
  ]);

  const sizes = [
    { blob: thumbnailBlob, suffix: 'thumb', size: 'thumbnail' },
    { blob: catalogBlob, suffix: 'catalog', size: 'catalog' },
    { blob: luxuryBlob, suffix: 'luxury', size: 'luxury' },
    { blob: printBlob, suffix: 'print', size: 'print' }
  ];

  const uploadedUrls: any = {};

  for (const { blob, suffix, size } of sizes) {
    const fileName = `${baseFilename}_${suffix}.jpg`;
    
    const { data, error } = await supabaseClient.storage
      .from('processed-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabaseClient.storage
      .from('processed-images')
      .getPublicUrl(fileName);

    uploadedUrls[size] = urlData.publicUrl;
  }

  return uploadedUrls;
};

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
  const [selectedSavedIds, setSelectedSavedIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<ImageDownloadProgress>({});
  const [isSaving, setIsSaving] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const state = location.state as LocationState;

  // ✅ FIX: Función simplificada que solo usa columnas existentes
  const fetchSavedImages = async () => {
    if (!user) return;

    try {
      // ✅ Solo usamos columnas que sabemos que existen
      const { data, error } = await (supabase as any)
        .from('products')
        .select(`
          id,
          name,
          original_image_url,
          processing_status,
          created_at,
          category,
          price_retail
        `)
        .eq('user_id', user.id)
        .eq('processing_status', 'completed') // ✅ Usamos processing_status en lugar de is_processed
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching saved images (might be expected if columns missing):', error);
        setSavedImages([]); // ✅ Fallar graciosamente
        return;
      }

      // ✅ Mapeo seguro con verificación de datos
      const savedProducts: SavedProduct[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Producto sin nombre',
        image_url: item.original_image_url || '', // ✅ Usamos original_image_url por ahora
        created_at: item.created_at || '',
        category: item.category || 'Sin categoría',
        price_retail: item.price_retail || 0
      }));

      setSavedImages(savedProducts);
    } catch (error) {
      console.error('Error fetching saved images:', error);
      setSavedImages([]); // ✅ Fallar graciosamente
      toast({
        title: "Info",
        description: "No se pudieron cargar imágenes guardadas (normal en primera configuración)",
        variant: "default"
      });
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      await fetchSavedImages();

      if (state?.processedImages && state?.selectedProducts) {
        setPendingImages(state.processedImages);
        setSelectedProducts(state.selectedProducts);
        
        const allIds = new Set(state.processedImages.map(img => img.product_id));
        setSelectedImageIds(allIds);
        setActiveTab('pending');
      }

      setIsLoading(false);
    };

    initializeComponent();
  }, [state, user]);

  // ✅ FUNCIÓN 1: Solo guardar imágenes (sin ir a template)
  const saveImagesOnly = async () => {
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
    let completedImages = 0;

    try {
      for (const image of selectedImages) {
        const productId = image.product_id;
        
        const imageBlob = await downloadImageFromUrl(image.processed_url);
        const uploadedUrls = await uploadImageToSupabase(supabase, productId, imageBlob, `processed_${productId}.jpg`);

        // ✅ Update seguro - solo updating_status que sabemos que existe
        await (supabase as any)
          .from('products')
          .update({
            processing_status: 'completed'
            // ✅ No actualizamos is_processed hasta que sepamos que existe
          })
          .eq('id', productId);

        completedImages++;
      }

      toast({
        title: "¡Imágenes guardadas!",
        description: `${completedImages} imágenes guardadas en tu biblioteca`
      });

      // Refrescar biblioteca y limpiar pending
      await fetchSavedImages();
      setPendingImages(prev => prev.filter(img => !selectedImageIds.has(img.product_id)));
      setSelectedImageIds(new Set());

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

  // ✅ FUNCIÓN 2: Guardar y generar catálogo (desde pending)
  const saveAndGenerateCatalog = async () => {
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
    const savedProducts = [];

    try {
      for (const image of selectedImages) {
        const productId = image.product_id;
        
        const imageBlob = await downloadImageFromUrl(image.processed_url);
        const uploadedUrls = await uploadImageToSupabase(supabase, productId, imageBlob, `processed_${productId}.jpg`);
        const originalProduct = selectedProducts.find(p => p.id === productId);

        // ✅ Update seguro
        await (supabase as any)
          .from('products')
          .update({
            processing_status: 'completed'
          })
          .eq('id', productId);

        savedProducts.push({
          ...originalProduct,
          image_url: uploadedUrls.catalog,
          processing_status: 'completed'
        });
      }

      toast({
        title: "¡Éxito!",
        description: `${savedProducts.length} imágenes guardadas`
      });

      navigate('/template-selection', {
        state: { 
          products: savedProducts,
          businessInfo: businessInfo,
          skipProcessing: true 
        }
      });

    } catch (error) {
      console.error('Error saving and generating catalog:', error);
      toast({
        title: "Error",
        description: "Error al procesar las imágenes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ FUNCIÓN 3: Generar catálogo desde guardadas
  const generateCatalogFromSaved = async () => {
    if (selectedSavedIds.size === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos una imagen guardada",
        variant: "destructive"
      });
      return;
    }

    const selectedSavedProducts = savedImages.filter(img => selectedSavedIds.has(img.id));
    
    navigate('/template-selection', {
      state: { 
        products: selectedSavedProducts,
        businessInfo: businessInfo,
        skipProcessing: true 
      }
    });
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

  const toggleSavedSelection = (productId: string) => {
    setSelectedSavedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllPending = () => {
    const allIds = new Set(pendingImages.map(img => img.product_id));
    setSelectedImageIds(allIds);
  };

  const selectAllSaved = () => {
    const allIds = new Set(savedImages.map(img => img.id));
    setSelectedSavedIds(allIds);
  };

  const clearSelection = () => {
    if (activeTab === 'pending') {
      setSelectedImageIds(new Set());
    } else {
      setSelectedSavedIds(new Set());
    }
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
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                  Gestiona tus imágenes procesadas y crea catálogos
                </p>
              </div>
            </div>
            
            {/* Controles de selección según tab activo */}
            {((activeTab === 'pending' && pendingImages.length > 0) || 
              (activeTab === 'saved' && savedImages.length > 0)) && (
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={activeTab === 'pending' ? selectAllPending : selectAllSaved} 
                  disabled={isSaving}
                >
                  Seleccionar todo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSelection} 
                  disabled={isSaving}
                >
                  Limpiar selección
                </Button>
              </div>
            )}
          </div>
          
          {isSaving && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Procesando imágenes</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'saved')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Por confirmar ({pendingImages.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Guardadas ({savedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingImages.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay imágenes por confirmar
                </h3>
                <p className="text-gray-600 mb-6">
                  Las imágenes procesadas aparecerán aquí para tu revisión
                </p>
                <div className="space-x-4">
                  <Button 
                    onClick={() => setActiveTab('saved')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    Ver imágenes guardadas
                  </Button>
                  <Button 
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Procesar más imágenes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pendingImages.map((image) => {
                  const isSelected = selectedImageIds.has(image.product_id);
                  const progress = downloadProgress[image.product_id];
                  
                  return (
                    <Card key={image.product_id} className={`overflow-hidden transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'
                    }`} onClick={() => toggleImageSelection(image.product_id)}>
                      <CardContent className="p-0">
                        <div className="aspect-square relative">
                          {/* ✅ CLAVE: Muestra image.processed_url (sin fondo) */}
                          <img
                            src={image.processed_url}
                            alt={image.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Failed to load processed image:', image.processed_url);
                              // ✅ Fallback a imagen original si falla
                              (e.target as HTMLImageElement).src = image.original_url;
                            }}
                          />
                          
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => {}} // Manejado por el onClick del Card
                              disabled={isSaving}
                              className="bg-white shadow-lg"
                            />
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                              🔄 Temporal
                            </div>
                          </div>
                          
                          {progress && (
                            <div className="absolute bottom-2 right-2">
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
                            <div className="text-orange-600">Expira: {new Date(image.expires_at).toLocaleDateString()}</div>
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
              <div className="text-center py-16">
                <Bookmark className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No tienes imágenes guardadas
                </h3>
                <p className="text-gray-600 mb-6">
                  Las imágenes que confirmes aparecerán aquí permanentemente
                </p>
                <Button 
                  onClick={() => navigate('/products')}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Procesar imágenes
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedImages.map((product) => {
                  const isSelected = selectedSavedIds.has(product.id);
                  
                  return (
                    <Card key={product.id} className={`overflow-hidden transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-green-500' : 'hover:shadow-lg'
                    }`} onClick={() => toggleSavedSelection(product.id)}>
                      <CardContent className="p-0">
                        <div className="aspect-square relative">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => {}} // Manejado por el onClick del Card
                              className="bg-white shadow-lg"
                            />
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                              ✅ Guardada
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Categoría: {product.category}</div>
                            <div>Precio: ${(product.price_retail / 100).toFixed(2)} MXN</div>
                            <div>Guardada: {new Date(product.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ✅ BOTTOM ACTION BAR - DIFERENTE POR TAB */}
      {/* Tab Pending - 2 botones */}
      {activeTab === 'pending' && selectedImageIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedImageIds.size} imagen{selectedImageIds.size !== 1 ? 'es' : ''} temporal{selectedImageIds.size !== 1 ? 'es' : ''} seleccionada{selectedImageIds.size !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={saveImagesOnly}
                  disabled={isSaving}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Solo guardar ({selectedImageIds.size})
                </Button>
                <Button 
                  onClick={saveAndGenerateCatalog}
                  disabled={isSaving}
                  className="bg-primary text-white flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : `Guardar y generar catálogo (${selectedImageIds.size})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Saved - 1 botón */}
      {activeTab === 'saved' && selectedSavedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedSavedIds.size} imagen{selectedSavedIds.size !== 1 ? 'es' : ''} guardada{selectedSavedIds.size !== 1 ? 's' : ''} seleccionada{selectedSavedIds.size !== 1 ? 's' : ''}
              </div>
              <Button 
                onClick={generateCatalogFromSaved}
                className="bg-green-600 text-white flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generar catálogo ({selectedSavedIds.size} productos)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageReview;
