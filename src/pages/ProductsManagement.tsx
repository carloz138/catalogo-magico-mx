// /src/pages/ProductsManagement.tsx - VERSIÓN FINAL CORREGIDA
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProductsTableEditor from '@/components/products/ProductsTableEditor';
import { Button } from '@/components/ui/button';
import { Plus, Settings, BarChart3, Package, Edit, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/products';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ==========================================
// PÁGINA PRINCIPAL DE GESTIÓN DE PRODUCTOS
// ==========================================

// ==========================================
// MOBILE PRODUCT CARD COMPONENT
// ==========================================

interface MobileProductCardProps {
  product: Product;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}

const MobileProductCard: React.FC<MobileProductCardProps> = ({ product, onEdit, onView }) => (
  <div className="bg-white rounded-lg border shadow-sm p-4">
    <div className="flex gap-3">
      {/* Imagen */}
      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {product.original_image_url ? (
          <img 
            src={product.original_image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          SKU: {product.sku || 'N/A'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.price_retail ? (product.price_retail / 100).toFixed(2) : '0.00'}
          </span>
          {product.category && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-2 mt-3 pt-3 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onView(product.id)}
        className="flex-1 h-10"
      >
        <Eye className="w-4 h-4 mr-2" />
        Ver
      </Button>
      <Button
        size="sm"
        onClick={() => onEdit(product.id)}
        className="flex-1 h-10"
      >
        <Edit className="w-4 h-4 mr-2" />
        Editar
      </Button>
    </div>
  </div>
);

const ProductsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showMobileEditModal, setShowMobileEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state para edición móvil
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price_retail: '',
    price_wholesale: '',
    category: '',
    description: '',
    tags: ''
  });

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchProducts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleEditVariants = (productId: string) => {
    setSelectedProductId(productId);
    setShowVariantsModal(true);
    toast({
      title: "Gestión de Variantes",
      description: "Función de variantes en desarrollo",
    });
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleGoToUpload = () => {
    navigate('/upload');
  };

  const handleGoToCatalog = () => {
    navigate('/template-selection');
  };

  const handleGoToAnalytics = () => {
    navigate('/analytics');
  };

  const handleMobileEdit = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        price_retail: product.price_retail ? (product.price_retail / 100).toString() : '',
        price_wholesale: product.price_wholesale ? (product.price_wholesale / 100).toString() : '',
        category: product.category || '',
        description: product.custom_description || product.description || '',
        tags: product.tags ? product.tags.join(', ') : ''
      });
      setShowMobileEditModal(true);
    }
  };

  const handleSaveMobileEdit = async () => {
    if (!editingProduct || !user) return;

    try {
      // Procesar tags
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          sku: formData.sku,
          price_retail: formData.price_retail ? Math.round(parseFloat(formData.price_retail) * 100) : null,
          price_wholesale: formData.price_wholesale ? Math.round(parseFloat(formData.price_wholesale) * 100) : null,
          category: formData.category || null,
          custom_description: formData.description || null,
          tags: tagsArray.length > 0 ? tagsArray : null
        })
        .eq('id', editingProduct.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "Producto actualizado correctamente"
      });
      
      setShowMobileEditModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive"
      });
    }
  };

  // ==========================================
  // ✅ ACCIONES DEL HEADER CORREGIDAS
  // ==========================================

  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      {/* Móvil: Solo botón principal */}
      <div className="md:hidden flex items-center gap-2 flex-1">
        <Button 
          size="sm"
          onClick={handleGoToUpload}
          className="flex-1 h-11"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Desktop: Todos los botones */}
      <div className="hidden md:flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGoToAnalytics}
          className="flex items-center gap-2 h-9"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGoToCatalog}
          className="flex items-center gap-2 h-9"
        >
          <Package className="w-4 h-4" />
          Crear Catálogo
        </Button>
        
        <Button 
          size="sm"
          onClick={handleGoToUpload}
          className="flex items-center gap-2 h-9"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>
    </div>
  );

  // ==========================================
  // ✅ RENDER OPTIMIZADO Y CORREGIDO
  // ==========================================

  return (
    <AppLayout 
        title="Editar Productos"
        subtitle="Edición inline, variantes y gestión masiva de productos"
        actions={actions}
      >
        {/* ✅ CONTENIDO OPTIMIZADO PARA EL NUEVO LAYOUT */}
        <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden min-w-0">
          
          {/* ✅ STATS CARDS RESPONSIVE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
            <div className="bg-white rounded-lg sm:rounded-xl border shadow-sm p-3 sm:p-6 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl border shadow-sm p-3 sm:p-6 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Variantes</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl border shadow-sm p-3 sm:p-6 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg sm:rounded-xl flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Procesados</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {products.filter(p => p.processing_status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg sm:rounded-xl border shadow-sm p-3 sm:p-6 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Este Mes</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop ONLY: Tabla inline editing */}
          <div className="hidden lg:block bg-white rounded-xl border shadow-sm overflow-hidden w-full">
            <ProductsTableEditor
              onEditVariants={handleEditVariants}
              onViewProduct={handleViewProduct}
              className="border-0 shadow-none rounded-none"
              externalProducts={products}
              onProductsChange={setProducts}
            />
          </div>

          {/* Móvil/Tablet: Cards scrollables */}
          <div className="lg:hidden w-full min-w-0">
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
                  <p className="text-sm text-gray-500">Cargando productos...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-600 mb-4">No hay productos aún</p>
                  <Button onClick={handleGoToUpload} size="sm" className="w-full h-11">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
              ) : (
                products.map(product => (
                  <MobileProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleMobileEdit}
                    onView={handleViewProduct}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Variantes */}
        {showVariantsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Gestión de Variantes</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowVariantsModal(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <span className="sr-only">Cerrar</span>
                  ✕
                </Button>
              </div>
              <div className="py-12 text-center text-gray-500">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Componente de gestión de variantes en desarrollo</p>
                <p className="text-sm">Producto ID: {selectedProductId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edición Móvil */}
        {showMobileEditModal && editingProduct && (
          <div className="lg:hidden fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Editar Producto</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMobileEditModal(false)}
                  className="h-10 w-10 p-0"
                >
                  ✕
                </Button>
              </div>

              {/* Form Content */}
              <div className="p-4 space-y-4">
                {/* Nombre */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 text-base"
                    placeholder="Nombre del producto"
                  />
                </div>

                {/* SKU */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </Label>
                  <Input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="h-11 text-base"
                    placeholder="SKU"
                  />
                </div>

                {/* Precio Retail */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    Precio Retail
                  </Label>
                  <Input
                    type="number"
                    value={formData.price_retail}
                    onChange={(e) => setFormData({ ...formData, price_retail: e.target.value })}
                    className="h-11 text-base"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Precio Mayoreo */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    Precio Mayoreo
                  </Label>
                  <Input
                    type="number"
                    value={formData.price_wholesale}
                    onChange={(e) => setFormData({ ...formData, price_wholesale: e.target.value })}
                    className="h-11 text-base"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </Label>
                  <Input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-11 text-base"
                    placeholder="Categoría"
                  />
                </div>

                {/* Etiquetas */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    Etiquetas
                  </Label>
                  <Input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="h-11 text-base"
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separa las etiquetas con comas
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px] text-base"
                    placeholder="Descripción del producto"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2 safe-bottom">
                <Button
                  variant="outline"
                  onClick={() => setShowMobileEditModal(false)}
                  className="flex-1 h-11"
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-11"
                  onClick={handleSaveMobileEdit}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Móvil */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-40 safe-bottom">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToAnalytics}
              className="flex-1 h-11"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            
            <Button
              size="sm"
              onClick={handleGoToUpload}
              className="flex-[2] h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Spacer */}
        <div className="lg:hidden h-20" />
      </AppLayout>
  );
};

export default ProductsManagement;