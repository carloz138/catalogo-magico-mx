import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface DeletedProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  deleted_at: string;
  original_image_url: string;
  processed_image_url: string;
}

export const useDeletedProducts = () => {
  const { user } = useAuth();
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeletedProducts = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_deleted_products', {
        requesting_user_id: user.id
      });

      if (error) throw error;
      setDeletedProducts(data || []);
    } catch (error) {
      console.error('Error loading deleted products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos eliminados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const restoreProduct = useCallback(async (productId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('restore_product', {
        product_id: productId,
        requesting_user_id: user.id
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "No se pudo restaurar el producto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Producto restaurado",
        description: "El producto se restauró exitosamente",
      });

      await loadDeletedProducts();
    } catch (error) {
      console.error('Error restoring product:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar el producto",
        variant: "destructive",
      });
    }
  }, [user?.id, loadDeletedProducts]);

  const permanentlyDeleteProduct = useCallback(async (productId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('permanently_delete_product', {
        product_id: productId,
        requesting_user_id: user.id
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "No se pudo eliminar permanentemente el producto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Producto eliminado permanentemente",
        description: "El producto se eliminó para siempre",
      });

      await loadDeletedProducts();
    } catch (error) {
      console.error('Error permanently deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar permanentemente el producto",
        variant: "destructive",
      });
    }
  }, [user?.id, loadDeletedProducts]);

  useEffect(() => {
    if (user) {
      loadDeletedProducts();
    }
  }, [user, loadDeletedProducts]);

  return {
    deletedProducts,
    loading,
    restoreProduct,
    permanentlyDeleteProduct,
    loadDeletedProducts
  };
};