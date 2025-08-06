import React, { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Plus, Upload, Eye, Edit, Trash2, CheckCircle, AlertCircle, 
  Clock, CreditCard, Search, X, Sparkles, Crown, Download, FileSpreadsheet,
  HelpCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ProductEditModal } from '@/components/products/ProductEditModal';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import { createCatalog, processImagesOnly } from '@/lib/catalogService';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  category: string;
  custom_description: string | null;
  original_image_url: string;
  image_url?: string; // ✅ URL de imagen procesada
  processing_status: string;
  created_at: string;
  smart_analysis: any;
  estimated_credits: number;
  estimated_cost_mxn: number;
}

type FilterType = 'all' | 'draft' | 'processing' | 'completed';

// Native CSV parsing and generation utilities
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
};

const generateCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape values that contain commas or quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', icon: <Edit className="w-3 h-3" />, text: 'Borrador' };
      case 'processing':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" />, text: 'Procesando' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, text: 'Completado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3" />, text: 'Desconocido' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
      {config.icon}
      {config.text}
    </Badge>
  );
};

const ProductCard = ({ 
  product, 
  selected, 
  onSelect, 
  onEdit, 
  onDelete 
}: { 
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const isProcessed = product.processing_status === 'completed' && product.image_url;
  
  return (
    <div className={`relative border rounded-lg overflow-hidden bg-white transition-all ${
      selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
    }`}>
      {/* Processing Status Indicator */}
      <div className="absolute top-2 left-2 z-10">
        {isProcessed ? (
          <Badge className="bg-green-500 text-white text-xs">✅ Listo</Badge>
        ) : (
          <Badge className="bg-orange-500 text-white text-xs">🔄 Pendiente</Badge>
        )}
      </div>
      
      <div className="aspect-square">
        <img 
          src={isProcessed ? product.image_url : product.original_image_url} 
          alt={product.name || 'Producto sin nombre'}
          className="w-full h-full object-cover"
        />
        {!isProcessed && (
          <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
            <span className="text-orange-700 font-medium text-sm">Necesita procesamiento</span>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{product.name || 'Sin nombre'}</h3>
        <p className="text-xs text-gray-500 truncate mb-2">
          {product.price_retail ? `$${(product.price_retail / 100).toLocaleString()} MXN` : 'Sin precio'}
        </p>
        
        {/* Credits info solo si no está procesado */}
        {!isProcessed && product.smart_analysis && (
          <div className="text-xs text-orange-600 bg-orange-50 rounded p-1 mb-1">
            <div className="flex justify-between">
              <span>Créditos:</span>
              <span className="font-medium">{product.estimated_credits || 1}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo:</span>
              <span>{
                typeof product.smart_analysis === 'string' 
                  ? (JSON.parse(product.smart_analysis).recommendedApi === 'removebg' ? '🎯 Premium' : '💰 Estándar')
                  : (product.smart_analysis?.recommendedApi === 'removebg' ? '🎯 Premium' : '💰 Estándar')
              }</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <StatusBadge status={product.processing_status} />
        </div>
        
        <div className="flex justify-between text-xs">
          <button 
            onClick={onEdit} 
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Editar
          </button>
          <button 
            onClick={onDelete} 
            className="text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Eliminar
          </button>
        </div>
      </div>
      
      <div className="absolute top-2 right-2">
        <input 
          type="checkbox" 
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 text-primary rounded focus:ring-primary"
        />
      </div>
    </div>
  );
};

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasBusinessInfo, businessInfo } = useBusinessInfo();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ✅ NUEVOS ESTADOS PARA CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCsvGuide, setShowCsvGuide] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvValidation, setCsvValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    updates: number;
    creates: number;
  }>({ valid: false, errors: [], warnings: [], updates: 0, creates: 0 });
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchUserCredits();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          price_retail,
          price_wholesale,
          wholesale_min_qty,
          category,
          custom_description,
          original_image_url,
          processing_status,
          created_at,
          smart_analysis,
          estimated_credits,
          estimated_cost_mxn
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add image_url from smart_analysis if available
      const productsWithImageUrl = (data || []).map(product => ({
        ...product,
        image_url: product.smart_analysis && typeof product.smart_analysis === 'object' && 'processed_image_url' in product.smart_analysis 
          ? product.smart_analysis.processed_image_url 
          : undefined
      }));
      
      setProducts(productsWithImageUrl);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserCredits(data?.credits || 0);
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (filter !== 'all') {
      filtered = filtered.filter(product => product.processing_status === filter);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) || false
      );
    }
    
    return filtered;
  }, [products, filter, searchQuery]);

  // ✅ NUEVA FUNCIÓN: Analizar selección inteligente
  const analyzeSelection = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    
    const processed = selectedProductsData.filter(p => 
      p.processing_status === 'completed' && p.image_url
    );
    const unprocessed = selectedProductsData.filter(p => 
      p.processing_status !== 'completed' || !p.image_url
    );
    
    return {
      total: selectedProductsData.length,
      processed: processed.length,
      unprocessed: unprocessed.length,
      processedProducts: processed,
      unprocessedProducts: unprocessed,
      allProcessed: unprocessed.length === 0,
      allUnprocessed: processed.length === 0,
      mixed: processed.length > 0 && unprocessed.length > 0
    };
  };

  // ✅ NUEVA FUNCIÓN: Procesar solo imágenes
  const processSelectedImages = async () => {
    const analysis = analyzeSelection();
    
    if (analysis.unprocessedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Todos los productos seleccionados ya están procesados",
        variant: "destructive",
      });
      return;
    }

    if (!hasBusinessInfo) {
      sonnerToast.info('Primero configura la información de tu negocio');
      navigate('/business-info');
      return;
    }
    
    try {
      sonnerToast.loading('Procesando imágenes...', { id: 'processing-images' });
      
      const result = await processImagesOnly(analysis.unprocessedProducts, businessInfo);
      
      if (result.success) {
        sonnerToast.success('¡Imágenes procesadas!', { 
          id: 'processing-images',
          description: 'Revisa los resultados y selecciona cuáles guardar.'
        });
        
        // ✅ NAVEGAR A PÁGINA DE REVISIÓN
        navigate('/image-review', { 
          state: { 
            processedImages: result.processed_images,
            originalProducts: analysis.unprocessedProducts,
            alreadyProcessedProducts: analysis.processedProducts,
            businessInfo: businessInfo
          }
        });
        
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error processing images:', error);
      sonnerToast.error('No se pudieron procesar las imágenes', { 
        id: 'processing-images',
        description: 'Inténtalo de nuevo más tarde.'
      });
    }
  };

  // ✅ FUNCIÓN MODIFICADA: Para productos ya procesados
  const createCatalogFromSelection = async () => {
    if (selectedProducts.length === 0) return;
    
    if (!hasBusinessInfo) {
      sonnerToast.info('Primero configura la información de tu negocio');
      navigate('/business-info');
      return;
    }
    
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    
    // ✅ VERIFICAR QUE TODOS ESTÉN PROCESADOS
    const unprocessed = selectedProductsData.filter(p => 
      p.processing_status !== 'completed' || !p.image_url
    );
    
    if (unprocessed.length > 0) {
      toast({
        title: "Productos sin procesar",
        description: `${unprocessed.length} productos necesitan procesamiento de imagen`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      sonnerToast.loading('Preparando catálogo...', { id: 'preparing-catalog' });
      
      // ✅ IR DIRECTO A TEMPLATE SELECTION
      navigate('/template-selection', { 
        state: { 
          products: selectedProductsData,
          businessInfo: businessInfo,
          skipProcessing: true 
        }
      });
      
      sonnerToast.success('Productos listos', { 
        id: 'preparing-catalog',
        description: 'Selecciona el template para tu catálogo.'
      });
      
    } catch (error) {
      console.error('Error preparing catalog:', error);
      sonnerToast.error('Error preparando catálogo', { 
        id: 'preparing-catalog',
        description: 'Inténtalo de nuevo.'
      });
    }
  };

  // ✅ NUEVA FUNCIÓN: Para flujo mixto
  const processMixedSelection = async () => {
    const analysis = analyzeSelection();
    
    if (analysis.unprocessed === 0) {
      // Todos procesados, ir directo a template
      navigate('/template-selection', { 
        state: { 
          products: analysis.processedProducts,
          businessInfo: businessInfo,
          skipProcessing: true 
        }
      });
      return;
    }
    
    // Procesar los faltantes
    await processSelectedImages();
  };

  // ✅ COMPONENTE: Smart Action Button
  const SmartActionButton = () => {
    const analysis = analyzeSelection();
    
    if (selectedProducts.length === 0) return null;
    
    const estimatedCredits = analysis.unprocessedProducts.reduce((total, product) => 
      total + (product.estimated_credits || 1), 0
    );
    
    // 🟢 ESCENARIO 1: Todos ya procesados (GRATIS)
    if (analysis.allProcessed) {
      return (
        <div className="space-y-2">
          <Button 
            onClick={createCatalogFromSelection}
            className="bg-green-600 text-white px-8 py-3 w-full"
          >
            <span className="flex items-center gap-2">
              ✨ Crear catálogo con selección
              <Badge className="bg-green-500 text-white">GRATIS</Badge>
            </span>
          </Button>
          <p className="text-center text-sm text-gray-600">
            🟢 {analysis.processed} productos ya procesados - Sin costo adicional
          </p>
        </div>
      );
    }
    
    // 🔴 ESCENARIO 2: Todos sin procesar
    if (analysis.allUnprocessed) {
      return (
        <div className="space-y-2">
          <Button 
            onClick={processSelectedImages}
            className="bg-orange-500 text-white px-8 py-3 w-full"
          >
            <span className="flex items-center gap-2">
              🔄 Procesar imágenes seleccionadas
              <Badge className="bg-blue-500 text-white">{estimatedCredits} créditos</Badge>
            </span>
          </Button>
          <p className="text-center text-sm text-gray-600">
            🔴 {analysis.unprocessed} productos necesitan procesamiento
          </p>
        </div>
      );
    }
    
    // 🟡 ESCENARIO 3: Mixto
    return (
      <div className="space-y-2">
        <Button 
          onClick={processMixedSelection}
          className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-8 py-3 w-full"
        >
          <span className="flex items-center gap-2">
            🎯 Procesar faltantes y crear catálogo
            <Badge className="bg-blue-500 text-white">{estimatedCredits} créditos</Badge>
          </span>
        </Button>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 rounded p-2 text-center">
            <span className="text-green-700 font-medium">✅ {analysis.processed} listos</span>
            <br />
            <span className="text-gray-600">Sin costo</span>
          </div>
          <div className="bg-orange-50 rounded p-2 text-center">
            <span className="text-orange-700 font-medium">🔄 {analysis.unprocessed} procesar</span>
            <br />
            <span className="text-gray-600">{estimatedCredits} créditos</span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ UPDATED CSV FUNCTIONS WITH NATIVE PARSING
  const exportToCSV = (selectedOnly = false) => {
    const productsToExport = selectedOnly 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;

    if (productsToExport.length === 0) {
      toast({
        title: "Sin productos para exportar",
        description: selectedOnly ? "No has seleccionado productos" : "No tienes productos guardados",
        variant: "destructive",
      });
      return;
    }

    const csvData = productsToExport.map(product => ({
      id: product.id,
      name: product.name || '',
      sku: product.sku || '',
      price_retail: product.price_retail ? (product.price_retail / 100).toFixed(2) : '',
      price_wholesale: product.price_wholesale ? (product.price_wholesale / 100).toFixed(2) : '',
      wholesale_min_qty: product.wholesale_min_qty || '',
      category: product.category || '',
      custom_description: product.custom_description || '',
      // CAMPOS INFORMATIVOS
      processing_status: product.processing_status || '',
      has_processed_image: product.image_url ? 'YES' : 'NO',
      estimated_credits: product.estimated_credits || 1,
      created_at: product.created_at || '',
      original_image_url: product.original_image_url || '',
      processed_image_url: product.image_url || '',
    }));

    const csv = generateCSV(csvData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const fileName = selectedOnly 
      ? `productos_seleccionados_${new Date().toISOString().split('T')[0]}.csv`
      : `todos_los_productos_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "¡CSV Exportado!",
      description: `✅ ${productsToExport.length} productos exportados exitosamente`,
    });
  };

  const downloadEmptyTemplate = () => {
    const emptyTemplate = [{
      id: '',
      name: 'Ejemplo: Camisa Azul Clásica',
      sku: 'CAM-001',
      price_retail: '25.99',
      price_wholesale: '18.50',
      wholesale_min_qty: '12',
      category: 'Ropa y Textiles',
      custom_description: 'Camisa de algodón 100% en color azul marino',
      processing_status: '',
      has_processed_image: 'NO',
      estimated_credits: 1,
      created_at: '',
      original_image_url: '',
      processed_image_url: ''
    }];

    const csv = generateCSV(emptyTemplate);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = async (file: File) => {
    setCsvFile(file);
    setImporting(true);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      setCsvPreview(parsedData);
      validateCsvData(parsedData);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error al leer CSV",
        description: "El archivo no es un CSV válido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const validateCsvData = (csvRows: any[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let updates = 0;
    let creates = 0;
    
    const validCategories = [
      'Ropa y Textiles', 'Belleza y Cuidado Personal', 'Mascotas y Artículos Pet',
      'Joyería y Accesorios', 'Electrónicos y Tecnología', 'Juguetes y Figuras',
      'Muebles y Decoración', 'Artículos para el Hogar', 'Herramientas y Ferretería',
      'Deportes y Fitness', 'Automotive', 'Otro'
    ];

    const existingProductIds = products.map(p => p.id);

    csvRows.forEach((row, index) => {
      const rowNum = index + 2;

      // Validar campos requeridos
      if (!row.name?.trim()) {
        errors.push(`Fila ${rowNum}: El campo 'name' es obligatorio`);
      }
      if (!row.category?.trim()) {
        errors.push(`Fila ${rowNum}: El campo 'category' es obligatorio`);
      } else if (!validCategories.includes(row.category)) {
        warnings.push(`Fila ${rowNum}: Categoría '${row.category}' no reconocida`);
      }

      // Validar precios
      if (row.price_retail && (isNaN(parseFloat(row.price_retail)) || parseFloat(row.price_retail) < 0)) {
        errors.push(`Fila ${rowNum}: Precio de venta inválido`);
      }

      // Detectar si es actualización o creación
      if (row.id && existingProductIds.includes(row.id)) {
        updates++;
        const existingProduct = products.find(p => p.id === row.id);
        if (existingProduct?.image_url) {
          warnings.push(`Fila ${rowNum}: Producto ya tiene imagen procesada (se mantendrá)`);
        }
      } else {
        creates++;
      }
    });

    setCsvValidation({
      valid: errors.length === 0,
      errors,
      warnings,
      updates,
      creates
    });
  };

  const importCsvData = async () => {
    if (!csvPreview.length) return;

    setImporting(true);
    
    try {
      const updates = [];
      const creates = [];

      for (const row of csvPreview) {
        if (row.id && products.find(p => p.id === row.id)) {
          const existingProduct = products.find(p => p.id === row.id);
          
          updates.push({
            id: row.id,
            name: row.name?.trim() || existingProduct.name,
            sku: row.sku?.trim() || existingProduct.sku,
            price_retail: row.price_retail ? Math.round(parseFloat(row.price_retail) * 100) : existingProduct.price_retail,
            price_wholesale: row.price_wholesale ? Math.round(parseFloat(row.price_wholesale) * 100) : existingProduct.price_wholesale,
            wholesale_min_qty: row.wholesale_min_qty ? parseInt(row.wholesale_min_qty) : existingProduct.wholesale_min_qty,
            category: row.category?.trim() || existingProduct.category,
            custom_description: row.custom_description?.trim() || existingProduct.custom_description,
            // MANTENER imagen procesada
            image_url: existingProduct.image_url,
            processing_status: existingProduct.processing_status,
            original_image_url: existingProduct.original_image_url
          });
        } else {
          creates.push({
            name: row.name?.trim(),
            sku: row.sku?.trim() || null,
            price_retail: row.price_retail ? Math.round(parseFloat(row.price_retail) * 100) : null,
            price_wholesale: row.price_wholesale ? Math.round(parseFloat(row.price_wholesale) * 100) : null,
            wholesale_min_qty: row.wholesale_min_qty ? parseInt(row.wholesale_min_qty) : null,
            category: row.category?.trim(),
            custom_description: row.custom_description?.trim() || null,
            processing_status: 'pending',
            user_id: user.id,
            estimated_credits: 1
          });
        }
      }

      // Ejecutar cambios
      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('products')
            .update(update)
            .eq('id', update.id);
          
          if (error) throw error;
        }
      }

      if (creates.length > 0) {
        const { error } = await supabase
          .from('products')
          .insert(creates);
          
        if (error) throw error;
      }

      toast({
        title: "¡Importación exitosa!",
        description: `✅ ${updates.length} actualizados, ${creates.length} creados`,
      });

      await fetchProducts();
      setShowImportModal(false);
      setCsvFile(null);
      setCsvPreview([]);

    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error en importación",
        description: "Algunos productos no se pudieron importar",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const toggleSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    setSelectedProducts(filteredProducts.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado de tu biblioteca",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral/60">Cargando productos...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Inicio</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Mi Biblioteca de Productos</h1>
                  <p className="text-gray-600">{products.length} productos guardados</p>
                </div>
              </div>
              
              {/* BOTONES PRINCIPALES */}
              <div className="flex gap-3">
                {/* CSV Controls */}
                {products.length > 0 && (
                  <div className="flex gap-2 mr-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportToCSV(false)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exportar CSV
                    </Button>
                    
                    {selectedProducts.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportToCSV(true)}
                        className="flex items-center gap-2 border-primary text-primary"
                      >
                        <Download className="w-4 h-4" />
                        Seleccionados ({selectedProducts.length})
                      </Button>
                    )}
                  </div>
                )}
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Importar CSV
                </Button>
                
                <Button onClick={() => navigate('/upload')} className="bg-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar productos
                </Button>
              </div>
            </div>
            
            {/* CSV Info Banner */}
            {products.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                        💡 Edición Masiva Disponible
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowCsvGuide(true)}
                          className="text-blue-600 p-1 h-6"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Button>
                      </h3>
                      <p className="text-sm text-blue-700">
                        Exporta a CSV, edita en Excel y vuelve a importar. 
                        <span className="font-medium"> ¡Preservamos las imágenes ya procesadas!</span>
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600">
                        {products.filter(p => p.processing_status === 'completed').length}
                      </div>
                      <div className="text-gray-600">Procesadas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">
                        {products.filter(p => p.processing_status !== 'completed').length}
                      </div>
                      <div className="text-gray-600">Pendientes</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar productos por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">Todos los productos</option>
                <option value="draft">Borradores</option>
                <option value="processing">Procesando</option>
                <option value="completed">Completados</option>
              </select>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAll}>
                  Seleccionar todos
                </Button>
                <Button variant="outline" onClick={clearSelection}>
                  Limpiar selección
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  Créditos disponibles: <span className="font-bold">{userCredits}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/checkout')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Comprar créditos
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 
                  'No se encontraron productos' : 
                  (filter === 'all' ? 'No tienes productos guardados' : `No tienes productos en estado "${filter}"`)
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 
                  `No hay productos que coincidan con "${searchQuery}"` :
                  'Comienza subiendo fotos de tus productos para crear tu biblioteca'
                }
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={clearSearch}>
                  Limpiar búsqueda
                </Button>
              ) : (
                <Button onClick={() => navigate('/upload')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir productos
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  selected={selectedProducts.includes(product.id)}
                  onSelect={() => toggleSelection(product.id)}
                  onEdit={() => handleEditProduct(product)}
                  onDelete={() => deleteProduct(product.id)}
                />
              ))}
            </div>
          )}
          
          {/* ✅ SMART ACTION BUTTON DINÁMICO */}
          {selectedProducts.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div>
                  <p className="font-semibold">{selectedProducts.length} productos seleccionados</p>
                  <p className="text-sm text-gray-600">
                    Estimado: {selectedProducts.reduce((total, id) => {
                      const product = products.find(p => p.id === id);
                      return total + (product?.estimated_credits || 1);
                    }, 0)} créditos 
                    (${selectedProducts.reduce((total, id) => {
                      const product = products.find(p => p.id === id);
                      return total + (product?.estimated_cost_mxn || 0.20);
                    }, 0).toFixed(2)} MXN)
                  </p>
                </div>
                
                <div className="w-80">
                  <SmartActionButton />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* CSV IMPORT MODAL */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Importar Productos desde CSV
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {!csvFile ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Selecciona tu archivo CSV</p>
                    <p className="text-gray-600 mb-4">
                      Importa productos nuevos o actualiza existentes
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Button className="mb-4">
                        <Upload className="w-4 h-4 mr-2" />
                        Seleccionar archivo CSV
                      </Button>
                    </label>
                    
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={downloadEmptyTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Template
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {importing ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p>Procesando archivo CSV...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">{csvValidation.updates}</div>
                          <div className="text-sm text-green-700">A actualizar</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <Plus className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">{csvValidation.creates}</div>
                          <div className="text-sm text-blue-700">Nuevos</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                          <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-600">{csvValidation.errors.length}</div>
                          <div className="text-sm text-orange-700">Errores</div>
                        </div>
                      </div>

                      {csvValidation.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-red-800 mb-2">❌ Errores:</h3>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {csvValidation.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-700">• {error}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-4">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setCsvFile(null);
                            setCsvPreview([]);
                          }}
                        >
                          Seleccionar otro archivo
                        </Button>
                        
                        <Button 
                          onClick={importCsvData}
                          disabled={!csvValidation.valid || importing}
                          className={csvValidation.valid ? "bg-primary text-white" : ""}
                        >
                          {importing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Importando...
                            </>
                          ) : csvValidation.valid ? (
                            `✅ Importar ${csvValidation.updates + csvValidation.creates} productos`
                          ) : (
                            '❌ Corrige errores primero'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <ProductEditModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onProductUpdate={handleProductUpdate}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Products;
