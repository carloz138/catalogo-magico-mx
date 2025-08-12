import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Download, Upload, Check, X, AlertCircle, Sparkles, Bookmark, Clock, 
  Image as ImageIcon, Search, FileDown, FileUp, RefreshCw, AlertTriangle, FileText, Filter
} from 'lucide-react';
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
  price_wholesale?: number;
  sku?: string;
  custom_description?: string;
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

// ✅ FUNCIONES DE UTILIDAD PARA CSV
const generateProductsCSV = (products: SavedProduct[]): string => {
  const headers = [
    'id',
    'name', 
    'sku',
    'category',
    'price_retail',
    'price_wholesale', 
    'custom_description',
    'image_url',
    'created_at'
  ];
  
  const csvContent = [
    headers.join(','),
    ...products.map(product => [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      `"${product.sku || ''}"`,
      `"${product.category}"`,
      product.price_retail || '',
      product.price_wholesale || '',
      `"${(product.custom_description || '').replace(/"/g, '""')}"`,
      `"${product.image_url}"`,
      product.created_at
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const validateCSVStructure = (csvText: string): { valid: boolean; errors: string[]; data?: any[] } => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { valid: false, errors: ['El archivo CSV debe tener al menos una fila de encabezados y una fila de datos'] };
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const requiredHeaders = ['id', 'name', 'category', 'price_retail'];
  const optionalHeaders = ['sku', 'price_wholesale', 'custom_description'];
  const allValidHeaders = [...requiredHeaders, ...optionalHeaders, 'image_url', 'created_at'];
  
  const errors: string[] = [];
  
  // Verificar encabezados requeridos
  const missingHeaders = requiredHeaders.filter(req => !headers.includes(req));
  if (missingHeaders.length > 0) {
    errors.push(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
  }
  
  // Verificar encabezados válidos
  const invalidHeaders = headers.filter(h => !allValidHeaders.includes(h));
  if (invalidHeaders.length > 0) {
    errors.push(`Columnas no reconocidas: ${invalidHeaders.join(', ')}`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Parsear datos
  try {
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      // Validar que ID exista
      if (!row.id) {
        errors.push(`Fila ${index + 2}: ID es requerido`);
      }
      
      // Validar precio retail
      if (row.price_retail && isNaN(parseFloat(row.price_retail))) {
        errors.push(`Fila ${index + 2}: price_retail debe ser un número válido`);
      }
      
      return row;
    });
    
    return { valid: errors.length === 0, errors, data: errors.length === 0 ? data : undefined };
  } catch (error) {
    return { valid: false, errors: ['Error al parsear el archivo CSV. Verifica el formato.'] };
  }
};

// ✅ FUNCIONES DE UTILIDAD OPTIMIZADAS PARA PNG (previas)
const downloadImageFromUrl = async (url: string): Promise<Blob> => {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'image/png' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const blob = await response.blob();
    
    if (!blob.type.includes('png')) {
      return new Blob([blob], { type: 'image/png' });
    }
    
    return blob;
  } catch (error) {
    console.error('Error en downloadImageFromUrl:', error);
    throw error;
  }
};

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
      try {
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
        
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (resultBlob) => {
            if (!resultBlob) {
              reject(new Error("Canvas produced null blob"));
              return;
            }
            
            const pngBlob = new Blob([resultBlob], {
              type: 'image/png'
            });
            
            resolve(pngBlob);
          },
          'image/png',
          1.0
        );
      } catch (error) {
        reject(error);
      }
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
    resizeImage(originalBlob, 300, 300),
    resizeImage(originalBlob, 800, 800),
    resizeImage(originalBlob, 1200, 1200),
    resizeImage(originalBlob, 2400, 2400)
  ]);

  const sizes = [
    { blob: thumbnailBlob, suffix: 'thumb', size: 'thumbnail' },
    { blob: catalogBlob, suffix: 'catalog', size: 'catalog' },
    { blob: luxuryBlob, suffix: 'luxury', size: 'luxury' },
    { blob: printBlob, suffix: 'print', size: 'print' }
  ];

  const uploadedUrls: any = {};

  for (const { blob, suffix, size } of sizes) {
    try {
      const pngBlob = new Blob([blob], {
        type: 'image/png'
      });

      const fileName = `${baseFilename}_${suffix}.png`;

      const { error } = await supabaseClient.storage
        .from('processed-images')
        .upload(fileName, pngBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false,
          duplex: 'half',
          transform: null
        });

      if (error) throw error;

      const { data: urlData } = supabaseClient.storage
        .from('processed-images')
        .getPublicUrl(fileName, {
          download: true
        });

      uploadedUrls[size] = urlData.publicUrl;
      
    } catch (error) {
      console.error(`Error subiendo ${size}:`, error);
      throw new Error(`Failed to upload ${size} image: ${error.message}`);
    }
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
  
  // ✅ NUEVOS ESTADOS PARA BÚSQUEDA Y CSV
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingFromCSV, setIsUpdatingFromCSV] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const state = location.state as LocationState;

  // ✅ FILTRO DE PRODUCTOS GUARDADOS CON BÚSQUEDA
  const filteredSavedImages = useMemo(() => {
    if (!searchQuery.trim()) return savedImages;
    
    const query = searchQuery.toLowerCase();
    return savedImages.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query)) ||
      (product.custom_description && product.custom_description.toLowerCase().includes(query))
    );
  }, [savedImages, searchQuery]);

  // Función mejorada para obtener imágenes guardadas
  const fetchSavedImages = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .select(`
          id,
          name,
          sku,
          original_image_url,
          image_url,
          processing_status,
          created_at,
          updated_at,
          category,
          price_retail,
          price_wholesale,
          custom_description
        `)
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error fetching saved images:', error);
        setSavedImages([]);
        return;
      }

      const savedProducts: SavedProduct[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Producto sin nombre',
        sku: item.sku || '',
        image_url: item.image_url || item.original_image_url || '',
        created_at: item.created_at || '',
        category: item.category || 'Sin categoría',
        price_retail: item.price_retail || 0,
        price_wholesale: item.price_wholesale || 0,
        custom_description: item.custom_description || '',
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

  // ✅ FUNCIÓN: Descargar productos como CSV
  const handleDownloadCSV = () => {
    if (savedImages.length === 0) {
      toast({
        title: "No hay productos",
        description: "No tienes productos guardados para descargar",
        variant: "destructive"
      });
      return;
    }
    
    const csvContent = generateProductsCSV(savedImages);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `mis-productos-${timestamp}.csv`;
    
    downloadCSV(csvContent, filename);
    
    toast({
      title: "📄 CSV Descargado",
      description: `${savedImages.length} productos descargados como ${filename}`,
      variant: "default"
    });
  };

  // ✅ FUNCIÓN: Manejar selección de archivo CSV
  const handleCSVFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Archivo inválido",
          description: "Por favor selecciona un archivo CSV (.csv)",
          variant: "destructive"
        });
        return;
      }
      setCsvFile(file);
    }
  };

  // ✅ FUNCIÓN: Procesar actualización desde CSV
  const handleUpdateFromCSV = async () => {
    if (!csvFile) {
      toast({
        title: "Selecciona un archivo",
        description: "Primero debes seleccionar un archivo CSV",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingFromCSV(true);

    try {
      // Leer archivo
      const csvText = await csvFile.text();
      
      // Validar estructura
      const validation = validateCSVStructure(csvText);
      
      if (!validation.valid) {
        toast({
          title: "❌ CSV Inválido",
          description: (
            <div>
              <p className="mb-2">Errores encontrados:</p>
              <ul className="list-disc list-inside text-sm">
                {validation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-blue-600">
                💡 Descarga tu archivo actual como ejemplo del formato correcto
              </p>
            </div>
          ),
          variant: "destructive"
        });
        return;
      }

      if (!validation.data) {
        throw new Error('No hay datos válidos en el CSV');
      }

      // Verificar que los IDs existen en productos guardados
      const savedProductIds = new Set(savedImages.map(p => p.id));
      const csvProductIds = validation.data.map(row => row.id);
      const missingIds = csvProductIds.filter(id => !savedProductIds.has(id));
      
      if (missingIds.length > 0) {
        toast({
          title: "IDs no encontrados",
          description: `Los siguientes IDs no existen en tus productos: ${missingIds.slice(0, 3).join(', ')}${missingIds.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
        return;
      }

      // Actualizar productos en base de datos
      let updatedCount = 0;
      
      for (const row of validation.data) {
        try {
          const updateData: any = {
            name: row.name,
            category: row.category,
            price_retail: parseFloat(row.price_retail) || 0,
            updated_at: new Date().toISOString()
          };
          
          // Campos opcionales
          if (row.sku) updateData.sku = row.sku;
          if (row.price_wholesale) updateData.price_wholesale = parseFloat(row.price_wholesale) || 0;
          if (row.custom_description) updateData.custom_description = row.custom_description;
          
          const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', row.id)
            .eq('user_id', user!.id); // Seguridad adicional
          
          if (error) {
            console.error(`Error actualizando producto ${row.id}:`, error);
          } else {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error procesando fila para ${row.id}:`, error);
        }
      }

      if (updatedCount > 0) {
        toast({
          title: "✅ Productos actualizados",
          description: `${updatedCount} de ${validation.data.length} productos actualizados exitosamente`,
          variant: "default"
        });
        
        // Refrescar lista
        await fetchSavedImages();
      } else {
        toast({
          title: "❌ No se actualizó nada",
          description: "No se pudieron actualizar los productos. Revisa el archivo.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error procesando CSV:', error);
      toast({
        title: "Error procesando CSV",
        description: "Hubo un problema al procesar el archivo CSV",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingFromCSV(false);
      setCsvFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  // Funciones existentes (saveImagesOnly, saveAndGenerateCatalog, generateCatalogFromSaved, etc.)
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
        
        const imageBlob = await downloadImageFromUrl(image.processed_url);
        const uploadedUrls = await uploadImageToSupabase(supabase, productId, imageBlob, `processed_${productId}.png`);

        await (supabase as any)
          .from('products')
          .update({
            processing_status: 'completed',
            image_url: uploadedUrls.catalog,
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

      await fetchSavedImages();
      setPendingImages(prev => prev.filter(img => !selectedImageIds.has(img.product_id)));
      setSelectedImageIds(new Set());
      setActiveTab('saved');

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
        
        const imageBlob = await downloadImageFromUrl(image.processed_url);
        const uploadedUrls = await uploadImageToSupabase(supabase, productId, imageBlob, `processed_${productId}.png`);
        const originalProduct = selectedProducts.find(p => p.id === productId);

        await (supabase as any)
          .from('products')
          .update({
            processing_status: 'completed',
            image_url: uploadedUrls.catalog,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        savedProducts.push({
          ...originalProduct,
          image_url: uploadedUrls.catalog,
          processing_status: 'completed'
        });
        
        setOverallProgress(((i + 1) / selectedImages.length) * 100);
      }

      toast({
        title: "🚀 ¡PNG listas para templates!",
        description: `${savedProducts.length} imágenes con transparencia optimizadas`,
        variant: "default"
      });

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

  const generateCatalogFromSaved = async () => {
    if (selectedSavedIds.size === 0) {
      toast({
        title: "Selecciona imágenes PNG",
        description: "Marca las imágenes que quieras incluir en tu catálogo",
        variant: "destructive"
      });
      return;
    }

    const selectedSavedProducts = filteredSavedImages.filter(img => selectedSavedIds.has(img.id));

    if (!businessInfo) {
      toast({
        title: "Error",
        description: "Información del negocio no disponible. Ve a configuración.",
        variant: "destructive"
      });
      return;
    }

    if (selectedSavedProducts.length === 0) {
      toast({
        title: "Error",
        description: "No se pudieron obtener los productos seleccionados",
        variant: "destructive"
      });
      return;
    }

    try {
      navigate('/template-selection', {
        state: { 
          products: selectedSavedProducts,
          businessInfo: businessInfo,
          skipProcessing: true 
        }
      });
      
      toast({
        title: "🎨 PNG listas para templates",
        description: `${selectedSavedProducts.length} imágenes con transparencia seleccionadas`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error en navegación PNG:', error);
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
  };

  const selectAllSaved = () => {
    const allIds = new Set(filteredSavedImages.map(img => img.id));
    setSelectedSavedIds(allIds);
  };

  const clearSelection = () => {
    if (activeTab === 'pending') {
      setSelectedImageIds(new Set());
    } else {
      setSelectedSavedIds(new Set());
      setSearchQuery(''); // Limpiar búsqueda también
    }
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
      {/* Header */}
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
            
            {/* Controles generales */}
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
          
          {/* Progress bar */}
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
        {/* Tabs */}
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
                          
                          {isImageLoading && (
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                          
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
                          
                          <div className="absolute top-3 right-3">
                            <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              PNG
                            </div>
                          </div>
                          
                          {progress && progress.status !== 'pending' && (
                            <div className="absolute bottom-3 right-3">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                {getStatusIcon(progress.status)}
                              </div>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute inset-0 bg-orange-500/20 border-2 border-orange-500 rounded-lg"></div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-3 line-clamp-2 text-gray-800 min-h-[2.5rem]">
                            {image.product_name}
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Procesado con:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                {image.api_used}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Formato:</span>
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                PNG con transparencia
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Costo:</span>
                              <span className="text-gray-800 font-semibold">
                                {image.credits_estimated} créditos (${image.cost_mxn} MXN)
                              </span>
                            </div>
                            
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-3">
                              <div className="flex items-center gap-2 text-orange-700">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span className="text-xs font-medium">
                                  Expira: {new Date(image.expires_at).toLocaleDateString('es-MX')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
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
            {/* ✅ CONTROLES PARA PRODUCTOS GUARDADOS */}
            {savedImages.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-6 border shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Buscador */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por nombre, categoría, SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Gestión CSV */}
                  <div className="flex flex-wrap gap-2">
                    {/* Descargar CSV */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      <span className="hidden sm:inline">Descargar CSV</span>
                      <span className="sm:hidden">CSV</span>
                    </Button>
                    
                    {/* Subir CSV */}
                    <div className="flex items-center gap-2">
                      <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleCSVFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('csv-file-input')?.click()}
                        className="flex items-center gap-2"
                      >
                        <FileUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Seleccionar CSV</span>
                        <span className="sm:hidden">Subir</span>
                      </Button>
                      
                      {csvFile && (
                        <Button
                          size="sm"
                          onClick={handleUpdateFromCSV}
                          disabled={isUpdatingFromCSV}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          {isUpdatingFromCSV ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Actualizar</span>
                          <span className="sm:hidden">OK</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Estado del archivo seleccionado */}
                {csvFile && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium text-sm">Archivo seleccionado:</span>
                      <span className="text-sm">{csvFile.name}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Este archivo actualizará tus productos existentes. Haz clic en "Actualizar" para proceder.
                    </p>
                  </div>
                )}
                
                {/* Resultados de búsqueda */}
                {searchQuery && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>
                      Mostrando {filteredSavedImages.length} de {savedImages.length} productos
                      {filteredSavedImages.length === 0 && (
                        <span className="text-red-600 ml-2">- No se encontraron coincidencias</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

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
            ) : filteredSavedImages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    No hay productos que coincidan con "{searchQuery}"
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpiar búsqueda
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredSavedImages.map((product) => {
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
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                            loading="lazy"
                          />
                          
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
                          
                          <div className="absolute top-3 right-3">
                            <div className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              PNG
                            </div>
                          </div>

                          {isSelected && (
                            <div className="absolute inset-0 bg-green-500/20 border-2 border-green-500 rounded-lg"></div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-3 line-clamp-2 text-gray-800 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                          
                          <div className="space-y-2">
                            {product.sku && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">SKU:</span>
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                  {product.sku}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Categoría:</span>
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                {product.category}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Precio:</span>
                              <span className="text-gray-800 font-semibold">
                                ${product.price_retail.toFixed(2)} MXN
                              </span>
                            </div>
                            
                            {product.price_wholesale && product.price_wholesale > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Mayoreo:</span>
                                <span className="text-purple-600 font-semibold">
                                  ${product.price_wholesale.toFixed(2)} MXN
                                </span>
                              </div>
                            )}
                            
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

      {/* Bottom Action Bars */}
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

      {activeTab === 'saved' && selectedSavedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-sm text-gray-700 font-medium">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {selectedSavedIds.size} PNG guardada{selectedSavedIds.size !== 1 ? 's' : ''} seleccionada{selectedSavedIds.size !== 1 ? 's' : ''}
                  {searchQuery && (
                    <span className="text-blue-600">
                      (de {filteredSavedImages.length} filtradas)
                    </span>
                  )}
                </span>
              </div>
              <Button 
                onClick={generateCatalogFromSaved}
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