import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, Check, X, AlertCircle, Sparkles, Bookmark, Clock, Image as ImageIcon } from 'lucide-react';
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
  processed_at?: string;
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

// ✅ FUNCIONES DE UTILIDAD OPTIMIZADAS PARA PNG
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

// ✅ FUNCIÓN ACTUALIZADA: resizeImage ahora usa PNG para preservar transparencia
const resizeImage = (blob: Blob, maxWidth: number, maxHeight: number): Promise<Blob> => {
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
      
      // ✅ Mantener aspect ratio
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
      
      // ✅ IMPORTANTE: No llenar fondo para preservar transparencia
      // ctx.fillStyle = 'white'; // ❌ NO hacer esto
      // ctx.fillRect(0, 0, width, height); // ❌ NO hacer esto
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // ✅ CAMBIO CRÍTICO: PNG en lugar de JPEG para preservar transparencia
      canvas.toBlob(resolve, 'image/png'); // ✅ PNG preserva transparencia
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(blob);
  });
};

// ✅ FUNCIÓN ACTUALIZADA: uploadImageToSupabase ahora usa PNG
const uploadImageToSupabase = async (
  supabaseClient: any,
  productId: string, 
  originalBlob: Blob, 
  filename: string
): Promise<{ thumbnail: string; catalog: string; luxury: string; print: string }> => {
  const timestamp = Date.now();
  const baseFilename = `${timestamp}_${productId}`;
  
  // ✅ CREAR MÚLTIPLES TAMAÑOS EN PNG
  const [thumbnailBlob, catalogBlob, luxuryBlob, printBlob] = await Promise.all([
    resizeImage(originalBlob, 300, 300),    // Thumbnail: 300x300
    resizeImage(originalBlob, 800, 800),    // Catalog: 800x800  
    resizeImage(originalBlob, 1200, 1200),  // Luxury: 1200x1200
    resizeImage(originalBlob, 2400, 2400)   // Print: 2400x2400 (alta resolución)
  ]);

  const sizes = [
    { blob: thumbnailBlob, suffix: 'thumb', size: 'thumbnail' },
    { blob: catalogBlob, suffix: 'catalog', size: 'catalog' },
    { blob: luxuryBlob, suffix: 'luxury', size: 'luxury' },
    { blob: printBlob, suffix: 'print', size: 'print' }
  ];

  const uploadedUrls: any = {};

  for (const { blob, suffix, size } of sizes) {
    // ✅ CAMBIO CRÍTICO: Usar extensión .png
    const fileName = `${baseFilename}_${suffix}.png`;
    
    const { data, error } = await supabaseClient.storage
      .from('processed-images')
      .upload(fileName, blob, {
        contentType: 'image/png', // ✅ PNG content type
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
  const [imagesLoading, setImagesLoading] = useState<Set<string>>(new Set());

  const state = location.state as LocationState;

  // ✅ Función mejorada para obtener imágenes guardadas
  const fetchSavedImages = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .select(`
          id,
          name,
          original_image_url,
          image_url,
          processing_status,
          created_at,
          updated_at,
          category,
          price_retail
        `)
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error fetching saved images (might be expected if columns missing):', error);
        setSavedImages([]);
        return;
      }

      const savedProducts: SavedProduct[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Producto sin nombre',
        // ✅ Usar image_url procesada (ahora en PNG) como prioritaria
        image_url: item.image_url || item.original_image_url || '',
        created_at: item.created_at || '',
        category: item.category || 'Sin categoría',
        price_retail: item.price_retail || 0,
        processed_at: item.updated_at || item.created_at || ''
      }));

      setSavedImages(savedProducts);
      console.log('✅ Fetched saved images (PNG format):', savedProducts.length, 'products');
    } catch (error) {
      console.error('Error fetching saved images:', error);
      setSavedImages([]);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      await fetchSavedImages();

      if (state?.processedImages && state?.selectedProducts) {
        console.log('✅ Inicializando con', state.processedImages.length, 'imágenes procesadas');
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

  // ✅ FUNCIÓN 1: Solo guardar y QUEDARSE en ImageReview
  const saveImagesOnly = async () => {
    if (selectedImageIds.size === 0) {
      toast({
        title: "Selecciona imágenes",
        description: "Marca al menos una imagen para guardar",
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
        
        setOverallProgress(((completedImages + 0.5) / selectedImages.length) * 100);
        
        console.log(`🖼️ Procesando imagen ${completedImages + 1}/${selectedImages.length} como PNG`);
        
        const imageBlob = await downloadImageFromUrl(image.processed_url);
        // ✅ uploadImageToSupabase ahora genera múltiples tamaños en PNG
        const uploadedUrls = await uploadImageToSupabase(supabase, productId, imageBlob, `processed_${productId}.png`);

        // ✅ Guardar URL procesada en PNG
        await (supabase as any)
          .from('products')
          .update({
            processing_status: 'completed',
            image_url: uploadedUrls.catalog, // ✅ URL de imagen PNG con transparencia
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        completedImages++;
        setOverallProgress((completedImages / selectedImages.length) * 100);
      }

      toast({
        title: "🎉 ¡Imágenes guardadas en PNG!",
        description: `${completedImages} imágenes con transparencia guardadas en tu biblioteca`,
        variant: "default"
      });

      // ✅ Refrescar y cambiar a tab guardadas
      await fetchSavedImages();
      setPendingImages(prev => prev.filter(img => !selectedImageIds.has(img.product_id)));
      setSelectedImageIds(new Set());
      setActiveTab('saved');

      setTimeout(() => {
        toast({
          title: "💡 PNG con transparencia",
          description: "Tus imágenes mantienen fondos transparentes para mejores catálogos",
          variant: "default"
        });
      }, 1500);

    } catch (error) {
      console.error('Error saving PNG images:', error);
      toast({
        title: "Error al guardar PNG",
        description: "Algo salió mal. Inténtalo de nuevo",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setOverallProgress(0);
    }
  };

  // ✅ FUNCIÓN 2: Guardar y IR A template-selection
  const saveAndGenerateCatalog = async () => {
    if (selectedImageIds.size === 0) {
      toast({
        title: "Selecciona imágenes",
        description: "Marca al menos una imagen para continuar",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    const selectedImages = pendingImages.filter(img => selectedImageIds.has(img.product_id));
    const savedProducts = [];

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const productId = image.product_id;
        
        setOverallProgress(((i + 0.5) / selectedImages.length) * 100);
        
        console.log(`🖼️ Guardando imagen ${i + 1}/${selectedImages.length} como PNG con transparencia`);
        
        const imageBlob = await downloadImageFromUrl(image.processed_url);
        // ✅ uploadImageToSupabase ahora crea múltiples tamaños en PNG
        const uploadedUrls = await uploadImageToSupabase(supabase, productId, imageBlob, `processed_${productId}.png`);
        const originalProduct = selectedProducts.find(p => p.id === productId);

        // ✅ Guardar URL procesada en PNG
        await (supabase as any)
          .from('products')
          .update({
            processing_status: 'completed',
            image_url: uploadedUrls.catalog, // ✅ PNG con transparencia para catalogo
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        savedProducts.push({
          ...originalProduct,
          image_url: uploadedUrls.catalog, // ✅ PNG optimizada para templates
          processing_status: 'completed'
        });
        
        setOverallProgress(((i + 1) / selectedImages.length) * 100);
      }

      toast({
        title: "🚀 ¡PNG listas para templates!",
        description: `${savedProducts.length} imágenes con transparencia optimizadas`,
        variant: "default"
      });

      // ✅ Navegar a template-selection con productos PNG
      navigate('/template-selection', {
        state: { 
          products: savedProducts,
          businessInfo: businessInfo,
          skipProcessing: true 
        }
      });

    } catch (error) {
      console.error('Error saving PNG and generating catalog:', error);
      toast({
        title: "Error al procesar PNG",
        description: "Algo salió mal. Revisa tu conexión e inténtalo de nuevo",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setOverallProgress(0);
    }
  };

  // ✅ FUNCIÓN 3: Generar catálogo desde guardadas PNG
  const generateCatalogFromSaved = async () => {
    console.log('🔍 generateCatalogFromSaved iniciado con PNG');
    console.log('🔍 selectedSavedIds:', selectedSavedIds);

    if (selectedSavedIds.size === 0) {
      toast({
        title: "Selecciona imágenes PNG",
        description: "Marca las imágenes que quieras incluir en tu catálogo",
        variant: "destructive"
      });
      return;
    }

    const selectedSavedProducts = savedImages.filter(img => selectedSavedIds.has(img.id));
    console.log('🔍 selectedSavedProducts (PNG):', selectedSavedProducts);

    // ✅ VALIDACIONES
    if (!businessInfo) {
      console.error('❌ No hay businessInfo');
      toast({
        title: "Error",
        description: "Información del negocio no disponible. Ve a configuración.",
        variant: "destructive"
      });
      return;
    }

    if (selectedSavedProducts.length === 0) {
      console.error('❌ No se encontraron productos PNG seleccionados');
      toast({
        title: "Error",
        description: "No se pudieron obtener los productos seleccionados",
        variant: "destructive"
      });
      return;
    }

    // ✅ LOG DE NAVEGACIÓN CON PNG
    console.log('🚀 Navegando con productos PNG:', {
      products: selectedSavedProducts,
      businessInfo: businessInfo,
      skipProcessing: true,
      imageFormat: 'PNG'
    });

    try {
      navigate('/template-selection', {
        state: { 
          products: selectedSavedProducts,
          businessInfo: businessInfo,
          skipProcessing: true 
        }
      });
      
      console.log('✅ Navegación con PNG ejecutada correctamente');

      toast({
        title: "🎨 PNG listas para templates",
        description: `${selectedSavedProducts.length} imágenes con transparencia seleccionadas`,
        variant: "default"
      });

    } catch (error) {
      console.error('❌ Error en navegación PNG:', error);
      toast({
        title: "Error de navegación",
        description: "No se pudo acceder a la selección de templates",
        variant: "destructive"
      });
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
    toast({
      title: "Todas las PNG seleccionadas",
      description: `${allIds.size} imágenes temporales con transparencia`,
      variant: "default"
    });
  };

  const selectAllSaved = () => {
    const allIds = new Set(savedImages.map(img => img.id));
    setSelectedSavedIds(allIds);
    toast({
      title: "Todas las PNG seleccionadas", 
      description: `${allIds.size} imágenes guardadas con transparencia`,
      variant: "default"
    });
  };

  const clearSelection = () => {
    if (activeTab === 'pending') {
      setSelectedImageIds(new Set());
    } else {
      setSelectedSavedIds(new Set());
    }
    toast({
      title: "Selección limpiada",
      description: "Ninguna imagen seleccionada",
      variant: "default"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-600 animate-bounce" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-purple-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleImageLoad = (productId: string) => {
    setImagesLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const handleImageStart = (productId: string) => {
    setImagesLoading(prev => new Set([...prev, productId]));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Cargando biblioteca PNG</h3>
          <p className="text-gray-600 text-sm">Preparando imágenes con transparencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ✅ HEADER OPTIMIZADO */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/products')}
                className="flex items-center space-x-2 shrink-0 hover:bg-gray-100 transition-colors"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver a Productos</span>
                <span className="sm:hidden">Volver</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Biblioteca PNG</h1>
                <p className="text-gray-600 text-sm hidden sm:block">
                  Imágenes con transparencia para catálogos profesionales
                </p>
              </div>
            </div>
            
            {/* ✅ CONTROLES MÓVILES */}
            {((activeTab === 'pending' && pendingImages.length > 0) || 
              (activeTab === 'saved' && savedImages.length > 0)) && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={activeTab === 'pending' ? selectAllPending : selectAllSaved} 
                  disabled={isSaving}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Seleccionar todo</span>
                  <span className="sm:hidden">Todo</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSelection} 
                  disabled={isSaving}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Limpiar</span>
                  <span className="sm:hidden">Limpiar</span>
                </Button>
              </div>
            )}
          </div>
          
          {/* ✅ PROGRESS BAR MEJORADO PARA PNG */}
          {isSaving && (
            <div className="mt-4 bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex justify-between items-center text-sm text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Guardando en formato PNG</span>
                </div>
                <span className="font-semibold text-orange-600">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full h-2" />
              <p className="text-xs text-gray-500 mt-2">Preservando transparencia en múltiples resoluciones...</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-32">
        {/* ✅ TABS OPTIMIZADOS */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'saved')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 h-12 mx-auto sm:mx-0">
            <TabsTrigger value="pending" className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Por confirmar</span>
              <span className="sm:hidden">Pendientes</span>
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                {pendingImages.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2 text-sm">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">PNG Guardadas</span>
              <span className="sm:hidden">PNG</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                {savedImages.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingImages.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Sin imágenes pendientes
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Las imágenes procesadas (con fondo removido) aparecerán aquí para confirmar y guardar como PNG
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => setActiveTab('saved')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4" />
                      Ver PNG guardadas
                    </Button>
                    <Button 
                      onClick={() => navigate('/products')}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                    >
                      <Upload className="w-4 h-4" />
                      Procesar imágenes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {pendingImages.map((image) => {
                  const isSelected = selectedImageIds.has(image.product_id);
                  const progress = downloadProgress[image.product_id];
                  const isImageLoading = imagesLoading.has(image.product_id);
                  
                  return (
                    <Card 
                      key={image.product_id} 
                      className={`
                        overflow-hidden transition-all duration-200 cursor-pointer
                        ${isSelected 
                          ? 'ring-2 ring-orange-500 shadow-lg scale-[1.02] bg-orange-50' 
                          : 'hover:shadow-xl hover:scale-[1.01] bg-white'
                        }
                        ${isSaving ? 'pointer-events-none opacity-70' : ''}
                      `} 
                      onClick={() => !isSaving && toggleImageSelection(image.product_id)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square relative overflow-hidden">
                          {/* ✅ IMAGEN CON TRANSPARENCIA */}
                          <img
                            src={image.processed_url}
                            alt={image.product_name}
                            className={`
                              w-full h-full object-cover transition-all duration-300
                              ${isImageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
                            `}
                            loading="lazy"
                            onLoadStart={() => handleImageStart(image.product_id)}
                            onLoad={() => handleImageLoad(image.product_id)}
                            onError={(e) => {
                              console.error('Failed to load processed PNG:', image.processed_url);
                              (e.target as HTMLImageElement).src = image.original_url;
                            }}
                          />
                          
                          {/* ✅ LOADING OVERLAY */}
                          {isImageLoading && (
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                          
                          {/* ✅ CHECKBOX */}
                          <div className="absolute top-3 left-3">
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center transition-all
                              ${isSelected 
                                ? 'bg-orange-500 border-2 border-orange-500 shadow-lg' 
                                : 'bg-white/90 border-2 border-gray-300 backdrop-blur-sm'
                              }
                            `}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                          
                          {/* ✅ STATUS BADGE MEJORADO PARA PNG */}
                          <div className="absolute top-3 right-3">
                            <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              PNG
                            </div>
                          </div>
                          
                          {/* ✅ PROGRESS INDICATOR */}
                          {progress && progress.status !== 'pending' && (
                            <div className="absolute bottom-3 right-3">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                {getStatusIcon(progress.status)}
                              </div>
                            </div>
                          )}

                          {/* ✅ SELECTED OVERLAY */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-orange-500/20 border-2 border-orange-500 rounded-lg"></div>
                          )}
                        </div>
                        
                        {/* ✅ CARD CONTENT CON INFO PNG */}
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-3 line-clamp-2 text-gray-800 min-h-[2.5rem]">
                            {image.product_name}
                          </h3>
                          
                          <div className="space-y-2">
                            {/* ✅ API INFO */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Procesado con:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                {image.api_used}
                              </span>
                            </div>
                            
                            {/* ✅ FORMAT INFO - Destacar PNG */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Formato:</span>
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                PNG con transparencia
                              </span>
                            </div>
                            
                            {/* ✅ COST INFO */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Costo:</span>
                              <span className="text-gray-800 font-semibold">
                                {image.credits_estimated} créditos (${image.cost_mxn} MXN)
                              </span>
                            </div>
                            
                            {/* ✅ EXPIRY WARNING */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-3">
                              <div className="flex items-center gap-2 text-orange-700">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span className="text-xs font-medium">
                                  Expira: {new Date(image.expires_at).toLocaleDateString('es-MX')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* ✅ PROGRESS SECTION */}
                          {progress && progress.status !== 'pending' && (
                            <div className="mt-4 bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between text-xs text-gray-700 mb-2">
                                <span className="capitalize font-medium">{progress.status}</span>
                                <span className="font-semibold">{progress.progress}%</span>
                              </div>
                              <Progress value={progress.progress} className="h-2" />
                              {progress.error && (
                                <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                                  {progress.error}
                                </p>
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
              <div className="text-center py-12 sm:py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bookmark className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Sin PNG guardadas
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Las imágenes PNG con transparencia que confirmes se guardarán aquí para crear catálogos profesionales
                  </p>
                  <Button 
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4" />
                    Procesar imágenes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {savedImages.map((product) => {
                  const isSelected = selectedSavedIds.has(product.id);
                  
                  return (
                    <Card 
                      key={product.id} 
                      className={`
                        overflow-hidden transition-all duration-200 cursor-pointer
                        ${isSelected 
                          ? 'ring-2 ring-green-500 shadow-lg scale-[1.02] bg-green-50' 
                          : 'hover:shadow-xl hover:scale-[1.01] bg-white'
                        }
                      `} 
                      onClick={() => toggleSavedSelection(product.id)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square relative overflow-hidden">
                          {/* ✅ IMAGEN PNG CON TRANSPARENCIA */}
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* ✅ CHECKBOX VERDE */}
                          <div className="absolute top-3 left-3">
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center transition-all
                              ${isSelected 
                                ? 'bg-green-500 border-2 border-green-500 shadow-lg' 
                                : 'bg-white/90 border-2 border-gray-300 backdrop-blur-sm'
                              }
                            `}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                          
                          {/* ✅ PNG BADGE */}
                          <div className="absolute top-3 right-3">
                            <div className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              PNG
                            </div>
                          </div>

                          {/* ✅ SELECTED OVERLAY */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-green-500/20 border-2 border-green-500 rounded-lg"></div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-3 line-clamp-2 text-gray-800 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Categoría:</span>
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                {product.category}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Precio:</span>
                              <span className="text-gray-800 font-semibold">
                                ${(product.price_retail / 100).toFixed(2)} MXN
                              </span>
                            </div>
                            
                            {/* ✅ PNG QUALITY BADGE */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-3">
                              <div className="flex items-center gap-2 text-green-700">
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="text-xs font-medium">
                                  PNG guardada: {new Date(product.processed_at || product.created_at).toLocaleDateString('es-MX')}
                                </span>
                              </div>
                            </div>
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

      {/* ✅ BOTTOM ACTION BAR ACTUALIZADO PARA PNG */}
      {/* Tab Pending - 2 botones */}
      {activeTab === 'pending' && selectedImageIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-sm text-gray-700 font-medium">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {selectedImageIds.size} PNG temporal{selectedImageIds.size !== 1 ? 'es' : ''} seleccionada{selectedImageIds.size !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  onClick={saveImagesOnly}
                  disabled={isSaving}
                  variant="outline"
                  className="flex items-center gap-2 flex-1 sm:flex-none"
                  size="sm"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Guardar PNG ({selectedImageIds.size})</span>
                  <span className="sm:hidden">Guardar ({selectedImageIds.size})</span>
                </Button>
                <Button 
                  onClick={saveAndGenerateCatalog}
                  disabled={isSaving}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 flex-1 sm:flex-none"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Guardando PNG...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">PNG → Catálogo ({selectedImageIds.size})</span>
                      <span className="sm:hidden">Crear ({selectedImageIds.size})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Saved - 1 botón */}
      {activeTab === 'saved' && selectedSavedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-sm text-gray-700 font-medium">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {selectedSavedIds.size} PNG guardada{selectedSavedIds.size !== 1 ? 's' : ''} seleccionada{selectedSavedIds.size !== 1 ? 's' : ''}
                </span>
              </div>
              <Button 
                onClick={() => {
                  console.log('🖱️ BOTÓN PNG CLICKEADO - Generar catálogo');
                  console.log('🖱️ selectedSavedIds en click:', selectedSavedIds);
                  generateCatalogFromSaved();
                }}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Catálogo PNG ({selectedSavedIds.size} productos)</span>
                <span className="sm:hidden">Crear PNG ({selectedSavedIds.size})</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageReview;