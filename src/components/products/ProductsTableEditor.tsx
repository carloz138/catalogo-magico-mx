import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Save, X, Edit, Trash2, Plus, Eye, Package, 
  Filter, Search, RefreshCw, Settings, Palette, ShoppingCart,
  AlertCircle, CheckCircle, Clock, Upload, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ==========================================
// TIPOS LOCALES CORREGIDOS
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
  | 'features';

type ProductCategory = 'ropa' | 'calzado' | 'electronica' | 'joyeria' | 'fiestas' | 'floreria' | 'general';

interface EditingCell {
  rowId: string;
  column: EditableProductField;
}

interface ProductFilters {
  search: string;
  category: ProductCategory | '';
  status: string;
}

interface ProductWithVariants {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  custom_description: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  category: ProductCategory | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  features: string[] | null;
  processing_status: string;
  has_variants: boolean;
  variant_count: number;
  created_at: string;
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

// CORRECCIÓN: Manejo de features con JSON
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

// ==========================================
// INTERFACES LOCALES
// ==========================================

interface ProductsTableEditorProps {
  onEditVariants?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  className?: string;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

const ProductsTableEditor: React.FC<ProductsTableEditorProps> = ({
  onEditVariants,
  onViewProduct,
  className = ''
}) => {
  const { user } = useAuth();
  
  // Estados principales
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Estados de edición
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Estados de selección
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Estados de filtros
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: ''
  });

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // ==========================================
  // FUNCIONES DE DATOS
  // ==========================================

  const fetchProducts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
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
          processing_status,
          has_variants,
          variant_count,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsData: ProductWithVariants[] = data ? data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        custom_description: product.custom_description,
        price_retail: product.price_retail,
        price_wholesale: product.price_wholesale,
        wholesale_min_qty: product.wholesale_min_qty,
        category: product.category,
        brand: product.brand,
        model: product.model,
        color: product.color,
        features: product.features,
        processing_status: product.processing_status,
        has_variants: product.has_variants || false,
        variant_count: product.variant_count || 0,
        created_at: product.created_at
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
  // FUNCIONES DE EDICIÓN INLINE - CORREGIDAS
  // ==========================================

  const startEdit = (rowId: string, column: EditableProductField, currentValue: any) => {
    setEditingCell({ rowId, column });
    
    // CORRECCIÓN: Manejo mejorado de valores
    if (column === 'price_retail' || column === 'price_wholesale') {
      setEditingValue(currentValue ? centsToPrice(currentValue) : '');
    } else if (column === 'features') {
      setEditingValue(formatFeatures(currentValue));
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
    if (!editingCell || saving) return; // Prevenir doble ejecución

    const { rowId, column } = editingCell;
    let processedValue: any = editingValue;

    // Validación para campos numéricos
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

      // Actualizar estado local optimizado
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
  // FUNCIONES DE ACCIONES MASIVAS
  // ==========================================

  const deleteProducts = async (productIds: string[]) => {
    if (!confirm(`¿Eliminar ${productIds.length} producto(s)?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Corrección: Actualización optimizada del estado
      setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
      setSelectedProducts([]);
      
      toast({
        title: "Productos eliminados",
        description: `${productIds.length} producto(s) eliminado(s)`,
      });
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

      // Corrección: Actualización optimizada
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
  // PRODUCTOS FILTRADOS - CORREGIDO
  // ==========================================

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !filters.search || 
        product.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.sku?.toLowerCase()?.includes(filters.search.toLowerCase()) ||
        product.brand?.toLowerCase()?.includes(filters.search.toLowerCase());
      
      const matchesCategory = !filters.category || product.category === filters.category;
      
      const matchesStatus = !filters.status || product.processing_status === filters.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, filters.search, filters.category, filters.status]);

  // ==========================================
  // COMPONENTES DE RENDERIZADO
  // ==========================================

  const renderEditableCell = (product: ProductWithVariants, column: EditableProductField, value: any, type: string = 'text') => {
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

    // Formateo de valores para visualización
    if (column === 'price_retail' || column === 'price_wholesale') {
      displayValue = value ? `$${centsToPrice(value)}` : '-';
    } else if (column === 'features') {
      const featuresArray = value && Array.isArray(value) ? value : [];
      displayValue = featuresArray.length > 0 
        ? featuresArray.join(', ') 
        : '-';
    } else if (column === 'wholesale_min_qty') {
      displayValue = value ?? '-';
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

  const renderSelectCell = (product: ProductWithVariants, column: EditableProductField, value: any, options: typeof PRODUCT_CATEGORIES) => {
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
              placeholder="Buscar por nombre, SKU o marca..."
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
                <th className="p-3 text-left font-medium min-w-[120px]">Estado</th>
                <th className="p-3 text-left font-medium min-w-[150px]">Variantes</th>
                <th className="p-3 text-left font-medium min-w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
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
                    {getStatusBadge(product.processing_status)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {product.has_variants ? (
                        <Badge variant="outline">
                          <Package className="w-3 h-3 mr-1" />
                          {product.variant_count}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin variantes</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditVariants?.(product.id)}
                        title="Gestionar variantes"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewProduct?.(product.id)}
                        title="Ver producto"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProducts([product.id])}
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
    </div>
  );
};

export default ProductsTableEditor;