
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, Upload, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { toast } from '@/components/ui/use-toast';

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
  
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<ImageDownloadProgress>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const state = location.state as LocationState;

  useEffect(() => {
    if (!state?.processedImages || !state?.selectedProducts) {
      navigate('/products');
      return;
    }

    setProcessedImages(state.processedImages);
    setSelectedProducts(state.selectedProducts);
    
    // Select all images by default
    const allIds = new Set(state.processedImages.map(img => img.product_id));
    setSelectedImageIds(allIds);
  }, [state, navigate]);

  const downloadImageFromUrl = async (url: string): Promise<Blob> => {
    try {
      // Use a proxy service to bypass CORS restrictions
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        // Fallback: try direct fetch
        const directResponse = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!directResponse.ok) {
          throw new Error(`Failed to download image: ${response.status}`);
        }
        
        return await directResponse.blob();
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
        // Calculate new dimensions
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
    productId: string, 
    originalBlob: Blob, 
    filename: string
  ): Promise<{ thumbnail: string; catalog: string; luxury: string; print: string }> => {
    const timestamp = Date.now();
    const baseFilename = `${timestamp}_${productId}`;
    
    // Generate different sizes
    const [thumbnailBlob, catalogBlob, luxuryBlob, printBlob] = await Promise.all([
      resizeImage(originalBlob, 300, 300, 0.8),   // Thumbnail: 300x300
      resizeImage(originalBlob, 800, 800, 0.85),  // Catalog: 800x800
      resizeImage(originalBlob, 1200, 1200, 0.9), // Luxury: 1200x1200
      resizeImage(originalBlob, 2400, 2400, 0.95) // Print: 2400x2400
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
      
      const { data, error } = await supabase.storage
        .from('processed-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('processed-images')
        .getPublicUrl(fileName);

      uploadedUrls[size] = urlData.publicUrl;
    }

    return uploadedUrls;
  };

  const processSelectedImages = async () => {
    if (selectedImageIds.size === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos una imagen",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const selectedImages = processedImages.filter(img => selectedImageIds.has(img.product_id));
    const totalImages = selectedImages.length;
    let completedImages = 0;

    // Initialize progress tracking
    const initialProgress: ImageDownloadProgress = {};
    selectedImages.forEach(img => {
      initialProgress[img.product_id] = { status: 'pending', progress: 0 };
    });
    setDownloadProgress(initialProgress);

    const processedProducts = [];

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
              processed_image_url: uploadedUrls.catalog, // Main catalog image
              processed_images: {
                thumbnail: uploadedUrls.thumbnail,
                catalog: uploadedUrls.catalog,
                luxury: uploadedUrls.luxury,
                print: uploadedUrls.print,
                api_used: image.api_used,
                processed_at: new Date().toISOString(),
                credits_used: image.credits_estimated,
                cost_mxn: image.cost_mxn
              },
              processing_status: 'completed',
              is_processed: true,
              processed_at: new Date().toISOString(),
              credits_used: image.credits_estimated
            })
            .eq('id', productId);

          if (updateError) throw updateError;

          // Add to processed products list with updated data
          processedProducts.push({
            ...originalProduct,
            processed_image_url: uploadedUrls.catalog,
            processed_images: {
              thumbnail: uploadedUrls.thumbnail,
              catalog: uploadedUrls.catalog,
              luxury: uploadedUrls.luxury,
              print: uploadedUrls.print
            },
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

      if (processedProducts.length > 0) {
        toast({
          title: "¡Éxito!",
          description: `${processedProducts.length} imágenes procesadas correctamente`
        });

        // Navigate to template selection with processed products
        navigate('/template-selection', {
          state: { selectedProducts: processedProducts }
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudieron procesar las imágenes seleccionadas",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Error",
        description: "Error al procesar las imágenes",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
    const allIds = new Set(processedImages.map(img => img.product_id));
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

  if (!state?.processedImages) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No hay imágenes procesadas para revisar</p>
          <Button onClick={() => navigate('/products')}>
            Volver a Productos
          </Button>
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
                <h1 className="text-2xl font-bold">Revisar Imágenes Procesadas</h1>
                <p className="text-gray-600">
                  {processedImages.length} imágenes procesadas • {selectedImageIds.size} seleccionadas
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={selectAll} disabled={isProcessing}>
                Seleccionar Todo
              </Button>
              <Button variant="outline" onClick={selectNone} disabled={isProcessing}>
                Deseleccionar Todo
              </Button>
              <Button 
                onClick={processSelectedImages}
                disabled={isProcessing || selectedImageIds.size === 0}
                className="bg-primary text-white"
              >
                {isProcessing ? 'Guardando...' : 'Guardar y elegir template'}
              </Button>
            </div>
          </div>
          
          {isProcessing && (
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedImages.map((image) => {
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
                        disabled={isProcessing}
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
      </main>
    </div>
  );
};

export default ImageReview;
