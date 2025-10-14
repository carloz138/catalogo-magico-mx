import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Save, X, Edit, Trash2, Plus, Eye, Package, 
  Filter, Search, RefreshCw, Settings, Palette, ShoppingCart,
  AlertCircle, CheckCircle, Clock, Upload, ExternalLink, Tag, BookOpen, Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Product, getDisplayImageUrl, getCatalogImageUrl, getProcessingStatus } from '@/types/products';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { VariantManagementModal } from './VariantManagementModal';

// ==========================================
// TIPOS ESPECÍFICOS DEL EDITOR
// ==========================================

type EditableProductField = 
  | 'name'
  | 'sku' 
  | 'description'
  | 'custom_description'
  | 'price_retail'
  | 'price_wholesale'
  | 'wholesale_min_qty'
  | 'category'
  | 'brand'
  | 'model'
  | 'color'
  | 'features'
  | 'tags';

type ProductCategory = 'ropa' | 'calzado' | 'electronica' | 'joyeria' | 'fiestas' | 'floreria' | 'general';

// Usamos el tipo Product de /types/products.ts directamente
type EditorProduct = Product;

interface EditingCell {
  rowId: string;
  column: EditableProductField;
}

interface ProductFilters {
  search: string;
  category: ProductCategory | '';
  status: string;
}

interface ProductsTableEditorProps {
  onEditVariants?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  className?: string;
}

// ==========================================
// CONSTANTES
// ==========================================

const PRODUCT_CATEGORIES = [
  { value: 'ropa' as ProductCategory, label: 'Ropa', icon: '👕' },
  { value: 'calzado' as ProductCategory, label: 'Calzado', icon: '👟' },
  { value: 'electronica' as ProductCategory, label: 'Electrónicos', icon: '📱' },
  { value: 'joyeria' as ProductCategory, label: 'Joyería', icon: '💍' },
  { value: 'fiestas' as ProductCategory, label: 'Fiestas', icon: '🎉' },
  { value: 'floreria' as ProductCategory, label: 'Florería', icon: '🌺' },
  { value: 'general' as ProductCategory, label: 'General', icon: '📦' }
];

const MAX_TAGS = 10;

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const centsToPrice = (cents: number | null): string => {
  return cents ? (cents / 100).toFixed(2) : "0.00";
};

const priceToCents = (price: string | number): number => {
  if (!price) return 0;
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(priceNum * 100);
};

const formatFeatures = (features: string[] | null): string => {
  if (!features || !Array.isArray(features)) return '';
  return JSON.stringify(features);
};

const parseFeatures = (featuresStr: string): string[] => {
  try {
    return JSON.parse(featuresStr);
  } catch {
    return [];
  }
};

// NUEVAS FUNCIONES PARA TAGS
const formatTags = (tags: string[] | null): string => {
  if (!tags || !Array.isArray(tags)) return '';
  return tags.join(', ');
};

const parseTags = (tagsStr: string): string[] => {
  if (!tagsStr.trim()) return [];
  
  const tags = tagsStr
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .slice(0, MAX_TAGS); // Limitar a máximo 10 tags
  
  // Remover duplicados
  return [...new Set(tags)];
};

// ✅ CORRECCIÓN: Función helper para validar y castear la categoría
const validateProductCategory = (category: string | null): ProductCategory | null => {
  if (!category) return null;
  
  const validCategories: ProductCategory[] = ['ropa', 'calzado', 'electronica', 'joyeria', 'fiestas', 'floreria', 'general'];
  
  return validCategories.includes(category as ProductCategory) 
    ? (category as ProductCategory) 
    : null;
};

// ==========================================
// INTERFACES LOCALES ESPECÍFICAS DEL EDITOR
// ==========================================

interface ProductsTableEditorProps {
  onEditVariants?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  className?: string;
  externalProducts?: EditorProduct[];
  onProductsChange?: (products: EditorProduct[]) => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

const ProductsTableEditor: React.FC<ProductsTableEditorProps> = ({
  onEditVariants,
  onViewProduct,
  className = '',
  externalProducts,
  onProductsChange
}) => {
  const { user } = useAuth();
  
  // Estados principales
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Estados de edición
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Estados de selección
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Estados de modales para catálogo
  const [showCatalogPreview, setShowCatalogPreview] = useState(false);
  const [catalogTitle, setCatalogTitle] = useState('');
  
  // Estados para modal de vista de producto
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EditorProduct | null>(null);
  
  // Estados para modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<EditorProduct | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
  
  // Estados para acciones masivas
  const [showBulkTagsModal, setShowBulkTagsModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBulkWholesaleMinModal, setShowBulkWholesaleMinModal] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const [bulkPriceType, setBulkPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkWholesaleMin, setBulkWholesaleMin] = useState('');
  
  // Estados de filtros
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: ''
  });

  // Estados para modal de variantes
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantProduct, setVariantProduct] = useState<EditorProduct | null>(null);

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    if (externalProducts) {
      setProducts(externalProducts);
      setLoading(false);
    } else if (user) {
      fetchProducts();
    }
  }, [user, externalProducts]);

  useEffect(() => {
    if (onProductsChange && !externalProducts) {
      onProductsChange(products);
    }
  }, [products, onProductsChange, externalProducts]);

  // ==========================================
  // FUNCIONES DE DATOS
  // ==========================================

  const fetchProducts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // SELECT completo incluyendo tags
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          user_id,
          name,
          sku,
          description,
          custom_description,
          price_retail,
          price_wholesale,
          wholesale_min_qty,
          category,
          brand,
          model,
          color,
          features,
          tags,
          processing_status,
          created_at,
          updated_at,
          original_image_url,
          processed_image_url,
          hd_image_url,
          image_url,
          deleted_at
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null) // Solo productos activos (no eliminados)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeo completo para el tipo Product
      const productsData: Product[] = data ? data.map(product => ({
        id: product.id,
        user_id: product.user_id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        custom_description: product.custom_description,
        price_retail: product.price_retail,
        price_wholesale: product.price_wholesale,
        wholesale_min_qty: product.wholesale_min_qty,
        category: validateProductCategory(product.category),
        brand: product.brand,
        model: product.model,
        color: product.color,
        features: product.features,
        tags: product.tags || [],
        processing_status: product.processing_status,
        created_at: product.created_at,
        updated_at: product.updated_at,
        original_image_url: product.original_image_url,
        processed_image_url: product.processed_image_url,
        hd_image_url: product.hd_image_url,
        image_url: product.image_url
      })) : [];

      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ==========================================
  // FUNCIONES DE EDICIÓN INLINE
  // ==========================================

  const startEdit = (rowId: string, column: EditableProductField, currentValue: any) => {
    setEditingCell({ rowId, column });
    
    if (column === 'price_retail' || column === 'price_wholesale') {
      setEditingValue(currentValue ? centsToPrice(currentValue) : '');
    } else if (column === 'features') {
      setEditingValue(formatFeatures(currentValue));
    } else if (column === 'tags') {
      setEditingValue(formatTags(currentValue));
    } else if (column === 'wholesale_min_qty') {
      setEditingValue(currentValue ? currentValue.toString() : '');
    } else {
      setEditingValue(currentValue || '');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const saveEdit = async () => {
    if (!editingCell || saving) return;

    const { rowId, column } = editingCell;
    let processedValue: any = editingValue;

    if (column === 'price_retail' || column === 'price_wholesale') {
      const numericValue = parseFloat(editingValue);
      if (isNaN(numericValue)) {
        toast({
          title: "Error",
          description: "Por favor ingrese un valor numérico válido",
          variant: "destructive",
        });
        return;
      }
      processedValue = priceToCents(numericValue);
    } else if (column === 'features') {
      processedValue = parseFeatures(editingValue);
    } else if (column === 'tags') {
      processedValue = parseTags(editingValue);
      if (processedValue.length > MAX_TAGS) {
        toast({
          title: "Error",
          description: `Máximo ${MAX_TAGS} etiquetas permitidas`,
          variant: "destructive",
        });
        return;
      }
    } else if (column === 'wholesale_min_qty') {
      const intValue = parseInt(editingValue);
      if (isNaN(intValue)) {
        toast({
          title: "Error",
          description: "Por favor ingrese un número entero válido",
          variant: "destructive",
        });
        return;
      }
      processedValue = intValue;
    }

    setSaving(rowId);

    try {
      const { error } = await supabase
        .from('products')
        .update({ [column]: processedValue })
        .eq('id', rowId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === rowId 
            ? { ...product, [column]: processedValue }
            : product
        )
      );

      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente",
      });

      cancelEdit();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cambio",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // ==========================================
  // FUNCIONES DE CATÁLOGO
  // ==========================================

  const handleCreateCatalog = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para crear un catálogo",
        variant: "destructive",
      });
      return;
    }

    // Generar título sugerido
    const today = new Date().toLocaleDateString('es-MX');
    setCatalogTitle(`Mi Catálogo - ${today}`);
    setShowCatalogPreview(true);
  };

  const confirmCreateCatalog = async () => {
    if (!catalogTitle.trim()) {
      toast({
        title: "Título requerido",
        description: "Por favor ingresa un título para tu catálogo",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedProductsData = products
        .filter(p => selectedProducts.includes(p.id))
        .map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || product.custom_description,
          category: product.category,
          price_retail: product.price_retail || 0,
          // 🎯 USAR URL OPTIMIZADA PARA CATÁLOGOS (catalog_image_url priorizada)
          image_url: getCatalogImageUrl(product),
          original_image_url: product.original_image_url,
          processed_image_url: product.processed_image_url,
          hd_image_url: product.hd_image_url,
          // 🎯 INCLUIR TODAS LAS URLs OPTIMIZADAS
          catalog_image_url: product.catalog_image_url,
          thumbnail_image_url: product.thumbnail_image_url,
          luxury_image_url: product.luxury_image_url,
          print_image_url: product.print_image_url,
          created_at: product.created_at
        }));

      // Guardar en localStorage para TemplateSelection (incluyendo el título)
      localStorage.setItem('selectedProductsData', JSON.stringify(selectedProductsData));
      localStorage.setItem('catalogTitle', catalogTitle.trim()); // Guardar el título personalizado
      localStorage.setItem('businessInfo', JSON.stringify({
        business_name: 'Mi Empresa'
      }));

      // Navegar a template selection
      window.location.href = '/template-selection';

    } catch (error) {
      console.error('Error en confirmCreateCatalog:', error);
      toast({
        title: "Error",
        description: "No se pudo preparar el catálogo",
        variant: "destructive",
      });
    }
  };

  const handleViewProduct = (product: EditorProduct) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleDeleteProduct = (product: EditorProduct) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete || !user) return;

    try {
      // Usar función de soft delete
      const { data, error } = await supabase.rpc('soft_delete_product', {
        product_id: productToDelete.id,
        requesting_user_id: user.id,
        reason: 'User deletion'
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "No tienes permisos para eliminar este producto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} se movió a la papelera`,
      });

      await fetchProducts();
      setSelectedProducts(prev => prev.filter(id => id !== productToDelete.id));
      setProductToDelete(null);

    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const deleteProducts = (productIds: string[]) => {
    setProductsToDelete(productIds);
    setShowBulkDeleteConfirm(true);
  };

  const confirmDeleteProducts = async () => {
    if (productsToDelete.length === 0 || !user) return;

    try {
      // Eliminar productos usando soft delete iterativo
      const deletePromises = productsToDelete.map(productId => 
        supabase.rpc('soft_delete_product', {
          product_id: productId,
          requesting_user_id: user.id,
          reason: 'Bulk deletion'
        })
      );

      const results = await Promise.all(deletePromises);
      
      // Verificar si hubo errores
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        console.error('Some products failed to delete');
        toast({
          title: "Error parcial",
          description: "Algunos productos no pudieron eliminarse",
          variant: "destructive",
        });
        return;
      }

      // Verificar permisos
      const successCount = results.filter(result => result.data === true).length;
      if (successCount === 0) {
        toast({
          title: "Error",
          description: "No tienes permisos para eliminar estos productos",
          variant: "destructive",
        });
        return;
      }

      await fetchProducts();
      setSelectedProducts([]);
      
      toast({
        title: "Productos eliminados",
        description: `${successCount} producto(s) movidos a la papelera`,
      });
      setProductsToDelete([]);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los productos",
        variant: "destructive",
      });
    }
  };

  const bulkUpdateCategory = async (category: ProductCategory) => {
    if (selectedProducts.length === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ category })
        .in('id', selectedProducts)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prevProducts => 
        prevProducts.map(product => 
          selectedProducts.includes(product.id) 
            ? { ...product, category }
            : product
        )
      );

      toast({
        title: "Categoría actualizada",
        description: `${selectedProducts.length} producto(s) actualizados`,
      });

      setSelectedProducts([]);
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    }
  };

  const bulkUpdateTags = async () => {
    if (selectedProducts.length === 0 || !bulkTags.trim()) return;

    const tagsArray = parseTags(bulkTags);
    if (tagsArray.length > MAX_TAGS) {
      toast({
        title: "Error",
        description: `Máximo ${MAX_TAGS} etiquetas permitidas`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ tags: tagsArray })
        .in('id', selectedProducts)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prevProducts => 
        prevProducts.map(product => 
          selectedProducts.includes(product.id) 
            ? { ...product, tags: tagsArray }
            : product
        )
      );

      toast({
        title: "Etiquetas actualizadas",
        description: `${selectedProducts.length} producto(s) actualizados con las etiquetas: ${tagsArray.join(', ')}`,
      });

      setSelectedProducts([]);
      setShowBulkTagsModal(false);
      setBulkTags('');
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las etiquetas",
        variant: "destructive",
      });
    }
  };

  const bulkUpdatePrice = async () => {
    if (selectedProducts.length === 0 || !bulkPrice.trim()) return;

    const numericValue = parseFloat(bulkPrice);
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese un precio válido",
        variant: "destructive",
      });
      return;
    }

    const priceInCents = priceToCents(numericValue);
    const field = bulkPriceType === 'retail' ? 'price_retail' : 'price_wholesale';

    try {
      const { error } = await supabase
        .from('products')
        .update({ [field]: priceInCents })
        .in('id', selectedProducts)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prevProducts => 
        prevProducts.map(product => 
          selectedProducts.includes(product.id) 
            ? { ...product, [field]: priceInCents }
            : product
        )
      );

      toast({
        title: "Precios actualizados",
        description: `${selectedProducts.length} producto(s) actualizados con precio ${bulkPriceType === 'retail' ? 'retail' : 'mayoreo'}`,
      });

      setSelectedProducts([]);
      setShowBulkPriceModal(false);
      setBulkPrice('');
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los precios",
        variant: "destructive",
      });
    }
  };

  const bulkUpdateWholesaleMin = async () => {
    if (selectedProducts.length === 0 || !bulkWholesaleMin.trim()) return;

    const intValue = parseInt(bulkWholesaleMin);
    if (isNaN(intValue) || intValue < 1) {
      toast({
        title: "Error",
        description: "Por favor ingrese una cantidad válida (mínimo 1)",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ wholesale_min_qty: intValue })
        .in('id', selectedProducts)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProducts(prevProducts => 
        prevProducts.map(product => 
          selectedProducts.includes(product.id) 
            ? { ...product, wholesale_min_qty: intValue }
            : product
        )
      );

      toast({
        title: "Cantidad mínima actualizada",
        description: `${selectedProducts.length} producto(s) actualizados con cantidad mínima de ${intValue} unidades`,
      });

      setSelectedProducts([]);
      setShowBulkWholesaleMinModal(false);
      setBulkWholesaleMin('');
    } catch (error) {
      console.error('Error updating wholesale_min_qty:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad mínima",
        variant: "destructive",
      });
    }
  };

  // ==========================================
  // FUNCIONES DE SELECCIÓN
  // ==========================================

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredProducts.map(p => p.id);
    setSelectedProducts(visibleIds);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // ==========================================
  // PRODUCTOS FILTRADOS - MEJORADO PARA INCLUIR TAGS
  // ==========================================

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !filters.search || 
        product.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.sku?.toLowerCase()?.includes(filters.search.toLowerCase()) ||
        product.brand?.toLowerCase()?.includes(filters.search.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesCategory = !filters.category || product.category === filters.category;
      
      const matchesStatus = !filters.status || product.processing_status === filters.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, filters.search, filters.category, filters.status]);

  // ==========================================
  // COMPONENTES DE RENDERIZADO
  // ==========================================

  const renderEditableCell = (product: EditorProduct, column: EditableProductField, value: any, type: string = 'text') => {
    const isEditing = editingCell?.rowId === product.id && editingCell?.column === column;
    const isSaving = saving === product.id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="h-8 text-sm"
            autoFocus
            placeholder={column === 'tags' ? 'etiqueta1, etiqueta2, etiqueta3...' : ''}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={saveEdit}
            disabled={isSaving}
            className="h-6 w-6 p-0"
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEdit}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    let displayValue: React.ReactNode = value ?? '';

    if (column === 'price_retail' || column === 'price_wholesale') {
      displayValue = value ? `$${centsToPrice(value)}` : '-';
    } else if (column === 'features') {
      const featuresArray = value && Array.isArray(value) ? value : [];
      displayValue = featuresArray.length > 0 
        ? featuresArray.join(', ') 
        : '-';
    } else if (column === 'tags') {
      const tagsArray = value && Array.isArray(value) ? value : [];
      displayValue = tagsArray.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {tagsArray.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tagsArray.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tagsArray.length - 3}
            </Badge>
          )}
        </div>
      ) : '-';
    } else if (column === 'wholesale_min_qty') {
      const hasWholesalePrice = product.price_wholesale && product.price_wholesale > 0;
      const hasWholesaleMin = value && value > 0;
      
      if (hasWholesalePrice && !hasWholesaleMin) {
        displayValue = (
          <div className="flex items-center gap-1">
            <span className="text-destructive font-medium">No asignado</span>
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3" />
            </Badge>
          </div>
        );
      } else {
        displayValue = value ?? '-';
      }
    }

    return (
      <div
        onClick={() => startEdit(product.id, column, value)}
        className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[24px] flex items-center"
        title="Click para editar"
      >
        {isSaving ? (
          <RefreshCw className="w-3 h-3 animate-spin mr-1" />
        ) : null}
        <span className="truncate">{displayValue}</span>
      </div>
    );
  };

  const renderSelectCell = (product: EditorProduct, column: EditableProductField, value: any, options: typeof PRODUCT_CATEGORIES) => {
    const isEditing = editingCell?.rowId === product.id && editingCell?.column === column;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <select
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm border rounded px-2"
            autoFocus
          >
            <option value="">Seleccionar</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    const option = options.find(opt => opt.value === value);
    const displayValue = option ? `${option.icon} ${option.label}` : (value || '-');

    return (
      <div
        onClick={() => startEdit(product.id, column, value)}
        className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[24px] flex items-center"
        title="Click para editar"
      >
        {displayValue}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      completed: { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircle className="w-3 h-3" />, 
        text: 'Completado' 
      },
      processing: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <Clock className="w-3 h-3" />, 
        text: 'Procesando' 
      },
      pending: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: <Upload className="w-3 h-3" />, 
        text: 'Pendiente' 
      },
      error: { 
        color: 'bg-red-100 text-red-800', 
        icon: <AlertCircle className="w-3 h-3" />, 
        text: 'Error' 
      },
      draft: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: <Edit className="w-3 h-3" />, 
        text: 'Borrador' 
      }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Productos</h2>
          <p className="text-gray-600">
            {products.length} productos total • {filteredProducts.length} mostrados
          </p>
        </div>
        <Button onClick={() => window.location.href = '/upload'}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, SKU, marca o etiquetas..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10"
            />
          </div>
        </div>
        
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value as ProductCategory | ''})}
          className="border rounded-md px-3 py-2"
        >
          <option value="">Todas las categorías</option>
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border rounded-md px-3 py-2"
        >
          <option value="">Todos los estados</option>
          <option value="completed">Completados</option>
          <option value="processing">Procesando</option>
          <option value="pending">Pendientes</option>
          <option value="draft">Borradores</option>
        </select>

        <Button
          variant="outline"
          onClick={fetchProducts}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Acciones Masivas */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="font-medium">{selectedProducts.length} productos seleccionados</span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleCreateCatalog}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Crear Catálogo
            </Button>
            <select
              onChange={(e) => e.target.value && bulkUpdateCategory(e.target.value as ProductCategory)}
              className="border rounded-md px-3 py-1 text-sm"
              defaultValue=""
            >
              <option value="">Cambiar categoría</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowBulkTagsModal(true)}
              className="flex items-center gap-1"
            >
              <Tag className="w-4 h-4" />
              Asignar Etiquetas
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setBulkPriceType('retail');
                setShowBulkPriceModal(true);
              }}
              className="flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Precio Retail
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setBulkPriceType('wholesale');
                setShowBulkPriceModal(true);
              }}
              className="flex items-center gap-1"
            >
              <Package className="w-4 h-4" />
              Precio Mayoreo
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowBulkWholesaleMinModal(true)}
              className="flex items-center gap-1"
            >
              <Package className="w-4 h-4" />
              Cant. Mín. Mayoreo
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => deleteProducts(selectedProducts)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Limpiar selección
            </Button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={selectedProducts.length === filteredProducts.length ? clearSelection : selectAllVisible}
                  />
                </th>
                <th className="p-3 text-left font-medium min-w-[200px]">Producto</th>
                <th className="p-3 text-left font-medium min-w-[100px]">SKU</th>
                <th className="p-3 text-left font-medium min-w-[150px]">Categoría</th>
                <th className="p-3 text-left font-medium min-w-[120px]">Precio Retail</th>
                <th className="p-3 text-left font-medium min-w-[140px]">Precio Mayoreo</th>
                <th className="p-3 text-left font-medium min-w-[120px]">Min. Mayoreo</th>
                <th className="p-3 text-left font-medium min-w-[120px]">Marca</th>
                <th className="p-3 text-left font-medium min-w-[100px]">Variantes</th>
                <th className="p-3 text-left font-medium min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Etiquetas
                  </div>
                </th>
                <th className="p-3 text-left font-medium min-w-[120px]">Estado</th>
                <th className="p-3 text-left font-medium min-w-[150px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: EditorProduct) => (
                <tr key={`product-${product.id}`} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="space-y-1 min-w-[200px]">
                      {renderEditableCell(product, 'name', product.name)}
                      {product.description && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {renderEditableCell(product, 'description', product.description)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {renderEditableCell(product, 'sku', product.sku)}
                  </td>
                  <td className="p-3">
                    {renderSelectCell(product, 'category', product.category, PRODUCT_CATEGORIES)}
                  </td>
                  <td className="p-3">
                    {renderEditableCell(product, 'price_retail', product.price_retail, 'number')}
                  </td>
                  <td className="p-3">
                    {renderEditableCell(product, 'price_wholesale', product.price_wholesale, 'number')}
                  </td>
                  <td className="p-3">
                    {renderEditableCell(product, 'wholesale_min_qty', product.wholesale_min_qty, 'number')}
                  </td>
                  <td className="p-3">
                    {renderEditableCell(product, 'brand', product.brand)}
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant={product.has_variants ? "default" : "outline"}
                      onClick={() => {
                        setVariantProduct(product);
                        setShowVariantModal(true);
                      }}
                      className="gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {product.has_variants ? (
                        <span>{product.variant_count || 0}</span>
                      ) : (
                        <span className="text-xs">Crear</span>
                      )}
                    </Button>
                  </td>
                  <td className="p-3 min-w-[150px]">
                    {renderEditableCell(product, 'tags', product.tags)}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(product.processing_status)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setVariantProduct(product);
                          setShowVariantModal(true);
                        }}
                        title="Gestionar variantes"
                      >
                        <Layers className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewProduct(product)}
                        title="Ver producto"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProduct(product)}
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estado vacío */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-600">
            {filters.search || filters.category || filters.status 
              ? 'Intenta ajustar los filtros'
              : 'Comienza agregando tu primer producto'
            }
          </p>
          {!(filters.search || filters.category || filters.status) && (
            <Button className="mt-4" onClick={() => window.location.href = '/upload'}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          )}
        </div>
      )}

      {/* Modal para Etiquetas Masivas */}
      {showBulkTagsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Asignar Etiquetas</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowBulkTagsModal(false);
                  setBulkTags('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Se asignarán estas etiquetas a {selectedProducts.length} producto(s) seleccionado(s).
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-tags">Etiquetas (separadas por comas)</Label>
                <Input
                  id="bulk-tags"
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  placeholder="etiqueta1, etiqueta2, etiqueta3..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo {MAX_TAGS} etiquetas. Las etiquetas existentes serán reemplazadas.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkTagsModal(false);
                    setBulkTags('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={bulkUpdateTags} disabled={!bulkTags.trim()}>
                  Asignar Etiquetas
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Precios Masivos */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Asignar Precio {bulkPriceType === 'retail' ? 'Retail' : 'Mayoreo'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowBulkPriceModal(false);
                  setBulkPrice('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Se asignará el precio {bulkPriceType === 'retail' ? 'retail' : 'mayoreo'} a {selectedProducts.length} producto(s) seleccionado(s).
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-price">
                  Precio {bulkPriceType === 'retail' ? 'Retail' : 'Mayoreo'} (MXN)
                </Label>
                <Input
                  id="bulk-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los precios existentes serán reemplazados.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkPriceModal(false);
                    setBulkPrice('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={bulkUpdatePrice} disabled={!bulkPrice.trim()}>
                  Asignar Precio
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Cantidad Mínima de Mayoreo Masiva */}
      {showBulkWholesaleMinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Asignar Cantidad Mínima de Mayoreo</h2>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowBulkWholesaleMinModal(false);
                  setBulkWholesaleMin('');
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Se asignará esta cantidad mínima a {selectedProducts.length} producto(s) seleccionado(s).
              </p>
              <div>
                <Label htmlFor="bulk-wholesale-min">Cantidad Mínima</Label>
                <Input
                  id="bulk-wholesale-min"
                  type="number"
                  min="1"
                  step="1"
                  value={bulkWholesaleMin}
                  onChange={(e) => setBulkWholesaleMin(e.target.value)}
                  placeholder="Ej: 10"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los valores existentes serán reemplazados. Esta cantidad define el mínimo para aplicar el precio de mayoreo.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkWholesaleMinModal(false);
                    setBulkWholesaleMin('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={bulkUpdateWholesaleMin} disabled={!bulkWholesaleMin.trim()}>
                  Asignar Cantidad
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Producto */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detalles del Producto</h2>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProduct(null);
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Imagen del producto */}
              <div className="flex justify-center">
                <div className="relative w-80 h-80 bg-gray-100 rounded-lg overflow-hidden">
                  {getDisplayImageUrl(selectedProduct) ? (
                    <>
                      <img
                        src={getDisplayImageUrl(selectedProduct)}
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading image:', getDisplayImageUrl(selectedProduct));
                          // Intentar con la imagen original si la procesada falla
                          if (selectedProduct.processed_image_url && e.currentTarget.src !== selectedProduct.original_image_url) {
                            e.currentTarget.src = selectedProduct.original_image_url || '';
                          } else {
                            // Mostrar icono si todas las imágenes fallan
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-icon w-full h-full flex items-center justify-center text-gray-400';
                              fallback.innerHTML = '<div class="text-center"><div class="w-16 h-16 mx-auto mb-2 opacity-50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><p class="text-sm">Imagen no disponible</p></div>';
                              parent.appendChild(fallback);
                            }
                          }
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', getDisplayImageUrl(selectedProduct));
                        }}
                      />
                      {/* Mostrar información de debug */}
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
                        {selectedProduct.processed_image_url ? 'Procesada' : 
                         selectedProduct.original_image_url ? 'Original' : 'Sin imagen'}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Package className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-sm">Sin imagen disponible</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del producto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nombre</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedProduct.name}</p>
                </div>
                
                {selectedProduct.sku && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">SKU</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProduct.sku}</p>
                  </div>
                )}
                
                {selectedProduct.category && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Categoría</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {PRODUCT_CATEGORIES.find(cat => cat.value === selectedProduct.category)?.label || selectedProduct.category}
                    </p>
                  </div>
                )}
                
                {selectedProduct.brand && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Marca</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedProduct.brand}</p>
                  </div>
                )}
                
                {selectedProduct.price_retail && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Precio Retail</Label>
                    <p className="text-sm text-gray-900 mt-1">${centsToPrice(selectedProduct.price_retail)} MXN</p>
                  </div>
                )}
                
                {selectedProduct.price_wholesale && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Precio Mayoreo</Label>
                    <p className="text-sm text-gray-900 mt-1">${centsToPrice(selectedProduct.price_wholesale)} MXN</p>
                  </div>
                )}
              </div>

              {selectedProduct.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Descripción</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedProduct.description}</p>
                </div>
              )}

              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Etiquetas</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProduct.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado del producto */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Estado</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedProduct.processing_status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview de Catálogo */}
      {showCatalogPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Crear Catálogo</h2>
              <Button 
                variant="ghost" 
                onClick={() => setShowCatalogPreview(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedProducts.length} productos seleccionados
                </h3>
                <p className="text-gray-600 mb-6">
                  Se generará un catálogo profesional con los productos seleccionados
                </p>
              </div>

              {/* Campo para título del catálogo */}
              <div className="space-y-2">
                <Label htmlFor="catalog-title-editor" className="text-sm font-medium">
                  Título del Catálogo
                </Label>
                <Input
                  id="catalog-title-editor"
                  value={catalogTitle}
                  onChange={(e) => setCatalogTitle(e.target.value)}
                  placeholder="Ingresa el título de tu catálogo"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Este título aparecerá en tu catálogo PDF y en la lista de catálogos
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCatalogPreview(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmCreateCatalog}
                  disabled={!catalogTitle.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Crear Catálogo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Variantes */}
      {variantProduct && (
        <VariantManagementModal
          open={showVariantModal}
          onOpenChange={(open) => {
            setShowVariantModal(open);
            if (!open) {
              setVariantProduct(null);
              // Recargar productos para actualizar el conteo de variantes
              if (!externalProducts && user) {
                fetchProducts();
              }
            }
          }}
          productId={variantProduct.id}
          productName={variantProduct.name}
          productCategory={variantProduct.category || undefined}
          basePrice={variantProduct.price_retail || undefined}
          basePriceWholesale={variantProduct.price_wholesale || undefined}
        />
      )}

      {/* Modales de Confirmación */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar Producto"
        description={productToDelete ? `¿Estás seguro de que quieres eliminar "${productToDelete.name}"? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteProduct}
        variant="destructive"
      />

      <ConfirmationDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Eliminar Productos"
        description={`¿Estás seguro de que quieres eliminar ${productsToDelete.length} productos? Esta acción no se puede deshacer.`}
        confirmText={`Eliminar ${productsToDelete.length} productos`}
        cancelText="Cancelar"
        onConfirm={confirmDeleteProducts}
        variant="destructive"
      />
    </div>
  );
};

export default ProductsTableEditor;