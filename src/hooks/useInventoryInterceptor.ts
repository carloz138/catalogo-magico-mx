import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PendingBackorders {
  pending_count: number;
  total_quantity: number;
  quote_item_ids: string[];
}

export interface AllocationResult {
  success: boolean;
  fulfilled_orders: number;
  fulfilled_quantity: number;
  remaining_stock: number;
}

export function useInventoryInterceptor() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [pendingBackorders, setPendingBackorders] = useState<PendingBackorders | null>(null);

  // Check if there are pending backorders for a product/variant
  const checkPendingBackorders = useCallback(async (
    productId: string,
    variantId?: string | null
  ): Promise<PendingBackorders | null> => {
    if (!user) return null;

    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_backorders', {
        p_product_id: productId,
        p_variant_id: variantId || null
      });

      if (error) throw error;

      // RPC returns array, we need first row
      const result = (data as PendingBackorders[])?.[0] || null;
      
      if (result && result.pending_count > 0) {
        setPendingBackorders(result);
        return result;
      }
      
      setPendingBackorders(null);
      return null;
    } catch (error) {
      console.error('Error checking pending backorders:', error);
      return null;
    } finally {
      setChecking(false);
    }
  }, [user]);

  // Allocate new stock to pending backorders
  const allocateStockToBackorders = useCallback(async (
    productId: string,
    variantId: string | null,
    newStock: number
  ): Promise<AllocationResult | null> => {
    if (!user) return null;

    setAllocating(true);
    try {
      const { data, error } = await supabase.rpc('allocate_stock_to_backorders', {
        p_product_id: productId,
        p_variant_id: variantId,
        p_new_stock: newStock,
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as unknown as AllocationResult;
      
      if (result.success && result.fulfilled_orders > 0) {
        toast.success(
          `✅ ${result.fulfilled_orders} pedido(s) asignados (${result.fulfilled_quantity} unidades). Stock restante: ${result.remaining_stock}`
        );
      }
      
      setPendingBackorders(null);
      return result;
    } catch (error) {
      console.error('Error allocating stock:', error);
      toast.error('Error al asignar stock a pedidos pendientes');
      return null;
    } finally {
      setAllocating(false);
    }
  }, [user]);

  // Clear the pending state (user chose not to allocate)
  const clearPendingBackorders = useCallback(() => {
    setPendingBackorders(null);
  }, []);

  return {
    checking,
    allocating,
    pendingBackorders,
    checkPendingBackorders,
    allocateStockToBackorders,
    clearPendingBackorders,
    hasPendingBackorders: pendingBackorders !== null && pendingBackorders.pending_count > 0
  };
}
