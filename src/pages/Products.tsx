import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
// ✅ NUEVO: Importar función de procesamiento
import { processImagesOnly } from '@/lib/catalogService';
import { 
  Package, 
  Search, 
  Filter, 
  Zap, // ✅ CAMBIO: Zap en lugar de Palette
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2 // ✅ NUEVO: Para loading
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  image_url: string;
  original_image_url: string; // ✅ NUEVO: Para webhook
  category: string | null;
  created_at: string;
}

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // ✅ NUEVO: Estado de procesamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price_retail, price_wholesale, image_url, original_image_url, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // ✅ FUNCIÓN NUEVA: Procesar imágenes con webhook
  const handleProcessImages = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para procesar",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      console.log('🚀 Iniciando procesamiento de imágenes...');
      
      // ✅ Obtener productos seleccionados con toda la info necesaria
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      
      // ✅ Preparar datos para el webhook
      const productsForWebhook = selectedProductsData.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price_retail: product.price_retail || 0,
        // ✅ CRÍTICO: Usar original_image_url para webhook
        original_image_url: product.original_image_url || product.image_url,
        estimated_credits: 1, // Valor por defecto
        estimated_cost_mxn: 0.20 // Valor por defecto
      }));

      console.log(`📊 Enviando ${productsForWebhook.length} productos al webhook:`, productsForWebhook);

      // ✅ Llamar a tu función de procesamiento
      const result = await processImagesOnly(
        productsForWebhook,
        {
          business_name: 'Mi Empresa', // Datos básicos
          primary_color: '#3B82F6',
          secondary_color: '#1F2937'
        }
      );

      if (result.success) {
        toast({
          title: "¡Procesamiento iniciado!",
          description: `${selectedProducts.length} productos enviados al webhook. Ve a Centro de Imágenes para revisar el progreso.`,
          variant: "default",
        });

        console.log('✅ Webhook exitoso:', result);

        // ✅ NAVEGACIÓN CORRECTA: Ir a image-review
        navigate('/image-review');
        
      } else {
        throw new Error(result.error || 'Error en el procesamiento');
      }

    } catch (error) {
      console.error('❌ Error procesando imágenes:', error);
      toast({
        title: "Error en procesamiento",
        description: error instanceof Error ? error.message : "No se pudieron procesar las imágenes",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // ✅ ACCIONES ACTUALIZADAS
  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>
      
      {/* ✅ BOTÓN PRINCIPAL CORREGIDO */}
      {selectedProducts.length > 0 && (
        <Button 
          onClick={handleProcessImages} 
          disabled={processing}
          className="flex items-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Procesar Imágenes ({selectedProducts.length})
            </>
          )}
        </Button>
      )}
      
      <Button onClick={() => navigate('/upload')} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Agregar Productos
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout actions={actions}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando productos...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        {products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes productos guardados
              </h3>
              <p className="text-gray-600 mb-4">
                Sube tus primeras imágenes de productos para comenzar
              </p>
              <Button onClick={() => navigate('/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Subir Productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* ✅ BANNER DE PROCESAMIENTO */}
            {processing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Procesando {selectedProducts.length} productos...
                      </h4>
                      <p className="text-sm text-blue-700">
                        El webhook está quitando fondos de las imágenes. Este proceso puede tardar 2-5 minutos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter and selection controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={selectAllProducts}
                      disabled={processing}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedProducts.length} de {filteredProducts.length} productos seleccionados
                    </span>
                    {/* ✅ INDICADOR DE ESTADO */}
                    {selectedProducts.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Listos para procesar
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      disabled={processing}
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className={`overflow-hidden hover:shadow-md transition-shadow ${
                  processing ? 'opacity-50' : ''
                }`}>
                  <div className="relative">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        className="bg-white"
                        disabled={processing}
                      />
                    </div>
                    {/* ✅ INDICADOR DE SELECCIÓN */}
                    {selectedProducts.includes(product.id) && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-500 text-white">
                          <Zap className="w-3 h-3 mr-1" />
                          Seleccionado
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {product.price_retail && (
                      <p className="font-bold text-primary mb-2">
                        ${product.price_retail.toFixed(2)} MXN
                      </p>
                    )}
                    {product.category && (
                      <Badge variant="outline" className="mb-3">
                        {product.category}
                      </Badge>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" disabled={processing}>
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" disabled={processing}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" disabled={processing}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ✅ INFO ADICIONAL */}
            {selectedProducts.length > 0 && !processing && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">
                        {selectedProducts.length} productos listos para procesar
                      </h4>
                      <p className="text-sm text-green-700">
                        El sistema quitará los fondos de las imágenes y las optimizará para catálogos profesionales.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Products;
