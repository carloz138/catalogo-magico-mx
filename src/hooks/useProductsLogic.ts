// /src/hooks/useProductsLogic.ts
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { processImagesOnly } from '@/lib/catalogService';
import { Product, getDisplayImageUrl, getProcessingStatus } from '@/types/products';

export const useProductsLogic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCatalogPreview, setShowCatalogPreview] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBusinessInfoBanner, setShowBusinessInfoBanner] = useState(true);
  
  // Estados para modal de confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Estado activo de pestaña
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'with-background';
  });

  useEffect(() => {
    if (user) {
      loadProducts();
      
      // Auto-refresh para ver estado de procesamiento
      const interval = setInterval(loadProducts, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sincronizar pestaña activa con URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['with-background', 'processing', 'no-background'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, user_id, name, description, custom_description, 
          price_retail, price_wholesale, wholesale_min_qty, category, brand,
          original_image_url, processed_image_url, hd_image_url, image_url,
          processing_status, processing_progress, is_processed, processed_at,
          credits_used, service_type, error_message,
          has_variants, variant_count, tags,
          created_at, updated_at, deleted_at
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null) // Solo productos activos (no eliminados)
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

  // Filtrar productos por pestaña activa
  const getProductsForTab = (tab: string) => {
    let statusFilter: string[];
    
    switch (tab) {
      case 'with-background':
        statusFilter = ['pending'];
        break;
      case 'processing':
        statusFilter = ['processing'];
        break;
      case 'no-background':
        statusFilter = ['completed'];
        break;
      default:
        statusFilter = ['pending'];
    }

    return products.filter(product => {
      const status = getProcessingStatus(product);
      const matchesStatus = statusFilter.includes(status);
      
      // Búsqueda expandida incluyendo tags restaurada
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchLower) ||
        (product.description?.toLowerCase().includes(searchLower)) ||
        (product.brand?.toLowerCase().includes(searchLower)) ||
        (product.tags && Array.isArray(product.tags) && 
         product.tags.some(tag => tag.toLowerCase().includes(searchLower)));
      
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      return matchesStatus && matchesSearch && matchesCategory;
    });
  };

  const filteredProducts = getProductsForTab(activeTab);
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Cambiar pestaña SIN resetear selecciones
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    const currentTabProductIds = filteredProducts.map(p => p.id);
    const currentTabSelectedCount = selectedProducts.filter(id => currentTabProductIds.includes(id)).length;
    
    if (currentTabSelectedCount === currentTabProductIds.length) {
      // Deseleccionar todos los de esta pestaña
      setSelectedProducts(prev => prev.filter(id => !currentTabProductIds.includes(id)));
    } else {
      // Seleccionar todos los de esta pestaña
      setSelectedProducts(prev => [...new Set([...prev, ...currentTabProductIds])]);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleRemoveBackground = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para quitar el fondo",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      
      const productsForWebhook = selectedProductsData.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || product.custom_description,
        category: product.category,
        price_retail: product.price_retail || 0,
        original_image_url: product.original_image_url,
        estimated_credits: 1,
        estimated_cost_mxn: 2.0
      }));

      await Promise.all(selectedProductsData.map(product => 
        supabase
          .from('products')
          .update({ 
            processing_status: 'processing',
            processing_progress: 0
          })
          .eq('id', product.id)
      ));

      const result = await processImagesOnly(
        productsForWebhook,
        {
          business_name: 'Mi Empresa',
          primary_color: '#3B82F6',
          secondary_color: '#1F2937'
        }
      );

      if (result.success) {
        toast({
          title: "¡Proceso iniciado!",
          description: `Quitando fondo a ${selectedProducts.length} productos`,
          variant: "default",
        });

        handleTabChange('processing');
        
      } else {
        throw new Error(result.error || 'Error en el procesamiento');
      }

    } catch (error) {
      console.error('Error procesando imágenes:', error);
      toast({
        title: "Error en procesamiento",
        description: error instanceof Error ? error.message : "No se pudieron procesar las imágenes",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      await loadProducts();
    }
  };

  const resetProcessingProducts = async () => {
    try {
      const { data: processingProducts, error } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('processing_status', 'processing');

      if (error) throw error;

      if (processingProducts && processingProducts.length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            processing_status: 'pending',
            processing_progress: 0 
          })
          .in('id', processingProducts.map(p => p.id));

        if (updateError) throw updateError;

        toast({
          title: "Productos restaurados",
          description: `${processingProducts.length} productos han vuelto a "Con Fondo"`,
          variant: "default",
        });

        await loadProducts();
      } else {
        toast({
          title: "No hay productos procesando",
          description: "No se encontraron productos en estado de procesamiento",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error resetting processing products:', error);
      toast({
        title: "Error",
        description: "No se pudieron resetear los productos",
        variant: "destructive",
      });
    }
  };

  const handleCreateCatalog = async (isBusinessInfoComplete: boolean) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para crear un catálogo",
        variant: "destructive",
      });
      return;
    }

    // Validación de datos de negocio
    if (!isBusinessInfoComplete) {
      toast({
        title: "Información del negocio incompleta",
        description: "Para crear catálogos profesionales necesitas completar los datos de tu empresa",
        variant: "default",
      });
      
      setShowBusinessInfoBanner(true);
      return;
    }

    setShowCatalogPreview(true);
  };

  const confirmCreateCatalog = async (catalogTitle: string) => {
    try {
      const selectedProductsData = products
        .filter(p => selectedProducts.includes(p.id))
        .map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description || product.custom_description,
          custom_description: product.custom_description,
          category: product.category,
          brand: product.brand,
          model: product.model,
          color: product.color,
          price_retail: product.price_retail || 0,
          price_wholesale: product.price_wholesale || 0,
          wholesale_min_qty: product.wholesale_min_qty,
          features: product.features,
          tags: product.tags,
          image_url: getDisplayImageUrl(product),
          original_image_url: product.original_image_url,
          processed_image_url: product.processed_image_url,
          hd_image_url: product.hd_image_url,
          video_url: product.video_url,
          social_media_urls: product.social_media_urls,
          processing_status: product.processing_status,
          ai_description: product.ai_description,
          ai_tags: product.ai_tags,
          has_variants: product.has_variants,
          variant_count: product.variant_count,
          created_at: product.created_at,
          updated_at: product.updated_at
        }));

      // Guardar en localStorage para TemplateSelection (incluyendo el título personalizado)
      console.log('🔍 DEBUG - Guardando título en localStorage:', catalogTitle);
      localStorage.setItem('selectedProductsData', JSON.stringify(selectedProductsData));
      localStorage.setItem('catalogTitle', catalogTitle); // Guardar el título personalizado
      localStorage.setItem('businessInfo', JSON.stringify({
        business_name: 'Mi Empresa'
      }));

      navigate('/template-selection');

    } catch (error) {
      console.error('Error en confirmCreateCatalog:', error);
      toast({
        title: "Error",
        description: "No se pudo preparar el catálogo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
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

      await loadProducts();
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

  const getStats = () => {
    return {
      total: products.length,
      withBackground: products.filter(p => getProcessingStatus(p) === 'pending').length,
      processing: products.filter(p => getProcessingStatus(p) === 'processing').length,
      noBackground: products.filter(p => getProcessingStatus(p) === 'completed').length,
      failed: products.filter(p => getProcessingStatus(p) === 'failed').length,
    };
  };

  return {
    // Estados
    products,
    selectedProducts,
    loading,
    processing,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    showCatalogPreview,
    setShowCatalogPreview,
    showViewModal,
    setShowViewModal,
    selectedProduct,
    showBusinessInfoBanner,
    setShowBusinessInfoBanner,
    activeTab,
    
    // Estados de confirmación de eliminación
    showDeleteConfirm,
    setShowDeleteConfirm,
    productToDelete,
    
    // Datos derivados
    filteredProducts,
    categories,
    stats: getStats(),
    
    // Funciones
    handleTabChange,
    toggleProductSelection,
    selectAllProducts,
    handleViewProduct,
    handleRemoveBackground,
    resetProcessingProducts,
    handleCreateCatalog,
    confirmCreateCatalog,
    handleDeleteProduct,
    confirmDeleteProduct,
    navigate
  };
};