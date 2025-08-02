import React, { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Upload, Eye, Edit, Trash2, CheckCircle, AlertCircle, Clock, CreditCard, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ProductEditModal } from '@/components/products/ProductEditModal';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import { createCatalog } from '@/lib/catalogService';

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
  created_at: string;
  smart_analysis: string | null;
  estimated_credits: number | null;
  estimated_cost_mxn: number | null;
}

type FilterType = 'all' | 'draft' | 'processing' | 'completed';

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
}) => (
  <div className={`relative border rounded-lg overflow-hidden bg-white transition-all ${
    selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
  }`}>
    <div className="aspect-square">
      <img 
        src={product.original_image_url} 
        alt={product.name || 'Producto sin nombre'}
        className="w-full h-full object-cover"
      />
    </div>
    
    <div className="p-3">
      <h3 className="font-medium text-sm truncate">{product.name || 'Sin nombre'}</h3>
      <p className="text-xs text-gray-500 truncate mb-2">
        {product.price_retail ? `$${(product.price_retail / 100).toLocaleString()} MXN` : 'Sin precio'}
      </p>
      
      {/* Smart Analysis Info */}
      {product.smart_analysis && (
        <div className="text-xs text-gray-600 mb-1 bg-gray-50 rounded p-1">
          <div className="flex justify-between">
            <span>Estimado:</span>
            <span className="font-medium">{product.estimated_credits || 1} créditos</span>
          </div>
          <div className="flex justify-between">
            <span>API:</span>
            <span>{JSON.parse(product.smart_analysis).recommendedApi === 'removebg' ? '🎯 Remove.bg' : '💰 Pixelcut'}</span>
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

  const CREDITS_PER_PRODUCT = 15;

  useEffect(() => {
    fetchProducts();
    fetchUserCredits();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(product => product.processing_status === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) || false
      );
    }
    
    return filtered;
  }, [products, filter, searchQuery]);

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

  const createCatalogFromSelection = async () => {
    if (selectedProducts.length === 0) return;
    
    if (!hasBusinessInfo) {
      sonnerToast.info('Primero configura la información de tu negocio');
      navigate('/business-info');
      return;
    }
    
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    
    try {
      sonnerToast.loading('Creando catálogo...', { id: 'creating-catalog' });
      
      const result = await createCatalog(selectedProductsData, businessInfo, 'professional');
      
      if (result.success) {
        sonnerToast.success('¡Catálogo creado! Se está procesando...', { 
          id: 'creating-catalog',
          description: 'Te notificaremos cuando esté listo.'
        });
        
        // Clear selection
        setSelectedProducts([]);
        
        // Redirect to catalogs page
        navigate('/catalogs');
        
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('Error creating catalog:', error);
      sonnerToast.error('No se pudo crear el catálogo', { 
        id: 'creating-catalog',
        description: 'Inténtalo de nuevo más tarde.'
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
              <Button onClick={() => navigate('/upload')} className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Agregar más productos
              </Button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              {/* Search Input */}
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
              
              {/* Status Filter */}
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
                <Button 
                  onClick={createCatalogFromSelection}
                  className="bg-primary text-white px-8 py-3"
                >
                  Crear catálogo con selección
                </Button>
              </div>
            </div>
          )}
        </main>

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
