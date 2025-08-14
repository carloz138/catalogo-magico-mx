
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit, 
  Save, 
  X, 
  Loader2, 
  Trash2,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  processing_status: string;
}

interface EditingProduct extends Product {
  isEditing: boolean;
  originalData: Product;
  hasChanges: boolean;
}

const categories = [
  'Electrónicos y Tecnología',
  'Electrodomésticos',
  'Gadgets y Accesorios Tech',
  'Muebles y Decoración',
  'Artículos para el Hogar',
  'Oficina y Papelería',
  'Libros y Material Educativo',
  'Herramientas y Ferretería',
  'Refacciones y Automóviles',
  'Juguetes y Figuras',
  'Equipos Deportivos',
  'Instrumentos Musicales',
  'Alimentos Empaquetados',
  'Ropa y Textiles',
  'Belleza y Cuidado Personal',
  'Mascotas y Artículos Pet'
];

export const ProductsTableEditor = () => {
  const [products, setProducts] = useState<EditingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const editingProducts: EditingProduct[] = (data || []).map(product => ({
        ...product,
        isEditing: false,
        originalData: { ...product },
        hasChanges: false
      }));

      setProducts(editingProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, isEditing: true, originalData: { ...product } }
        : product
    ));
  };

  const cancelEditing = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { 
            ...product.originalData, 
            isEditing: false, 
            originalData: product.originalData,
            hasChanges: false 
          }
        : product
    ));
  };

  const updateField = (productId: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updated = { ...product, [field]: value };
        updated.hasChanges = JSON.stringify(updated.originalData) !== JSON.stringify({
          ...updated.originalData,
          [field]: value
        });
        return updated;
      }
      return product;
    }));
  };

  const saveProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSavingIds(prev => new Set([...prev, productId]));

    try {
      const updateData = {
        name: product.name.trim(),
        sku: product.sku?.trim() || null,
        category: product.category,
        custom_description: product.custom_description?.trim() || null,
        price_retail: product.price_retail ? Math.round(product.price_retail * 100) : null,
        price_wholesale: product.price_wholesale ? Math.round(product.price_wholesale * 100) : null,
        wholesale_min_qty: product.wholesale_min_qty || null
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              isEditing: false, 
              hasChanges: false,
              originalData: { ...p }
            }
          : p
      ));

      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado correctamente",
      });

    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
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

      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado correctamente",
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

  const formatPrice = (priceInCents: number | null) => {
    if (!priceInCents) return '';
    return (priceInCents / 100).toFixed(2);
  };

  const parsePrice = (priceString: string) => {
    const parsed = parseFloat(priceString);
    return isNaN(parsed) ? null : parsed;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando productos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Editor de Productos</h2>
        <Button onClick={loadProducts} variant="outline">
          Actualizar
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Imagen</TableHead>
              <TableHead className="min-w-[200px]">Nombre</TableHead>
              <TableHead className="w-32">SKU</TableHead>
              <TableHead className="w-40">Categoría</TableHead>
              <TableHead className="w-32">Precio Venta</TableHead>
              <TableHead className="w-32">Precio Mayoreo</TableHead>
              <TableHead className="w-24">Min. Mayoreo</TableHead>
              <TableHead className="min-w-[200px]">Descripción</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <img
                    src={product.original_image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                </TableCell>
                
                <TableCell>
                  {product.isEditing ? (
                    <Input
                      value={product.name}
                      onChange={(e) => updateField(product.id, 'name', e.target.value)}
                      className="min-w-[180px]"
                    />
                  ) : (
                    <span className="font-medium">{product.name}</span>
                  )}
                </TableCell>

                <TableCell>
                  {product.isEditing ? (
                    <Input
                      value={product.sku || ''}
                      onChange={(e) => updateField(product.id, 'sku', e.target.value)}
                      placeholder="SKU"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{product.sku || '-'}</span>
                  )}
                </TableCell>

                <TableCell>
                  {product.isEditing ? (
                    <Select
                      value={product.category}
                      onValueChange={(value) => updateField(product.id, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">{product.category}</span>
                  )}
                </TableCell>

                <TableCell>
                  {product.isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        value={formatPrice(product.price_retail)}
                        onChange={(e) => updateField(product.id, 'price_retail', parsePrice(e.target.value))}
                        placeholder="0.00"
                        className="pl-8"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ) : (
                    <span className="text-sm">
                      {product.price_retail ? `$${formatPrice(product.price_retail)}` : '-'}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {product.isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        value={formatPrice(product.price_wholesale)}
                        onChange={(e) => updateField(product.id, 'price_wholesale', parsePrice(e.target.value))}
                        placeholder="0.00"
                        className="pl-8"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ) : (
                    <span className="text-sm">
                      {product.price_wholesale ? `$${formatPrice(product.price_wholesale)}` : '-'}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {product.isEditing ? (
                    <Input
                      type="number"
                      value={product.wholesale_min_qty || ''}
                      onChange={(e) => updateField(product.id, 'wholesale_min_qty', parseInt(e.target.value) || null)}
                      placeholder="12"
                      min="1"
                    />
                  ) : (
                    <span className="text-sm">{product.wholesale_min_qty || '-'}</span>
                  )}
                </TableCell>

                <TableCell>
                  {product.isEditing ? (
                    <Textarea
                      value={product.custom_description || ''}
                      onChange={(e) => updateField(product.id, 'custom_description', e.target.value)}
                      placeholder="Descripción personalizada"
                      rows={2}
                      className="min-w-[180px] resize-none"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {product.custom_description || '-'}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    {product.isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => saveProduct(product.id)}
                          disabled={!product.hasChanges || savingIds.has(product.id)}
                        >
                          {savingIds.has(product.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEditing(product.id)}
                          disabled={savingIds.has(product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(product.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay productos disponibles
        </div>
      )}
    </div>
  );
};
