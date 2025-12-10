import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductionQueueItem {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  variant_description: string | null;
  total_quantity: number;
  order_count: number;
  oldest_order_date: string;
  quote_item_ids: string[];
}

export function useProductionQueue() {
  const { user } = useAuth();
  const [queueItems, setQueueItems] = useState<ProductionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const loadQueue = useCallback(async () => {
    if (!user) {
      setQueueItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_production_queue', {
        p_vendor_user_id: user.id
      });

      if (error) throw error;
      setQueueItems((data as ProductionQueueItem[]) || []);
    } catch (error) {
      console.error('Error loading production queue:', error);
      toast.error('Error al cargar la cola de producción');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markBatchAsReady = useCallback(async (quoteItemIds: string[]) => {
    if (!user || quoteItemIds.length === 0) return false;

    setMarking(true);
    try {
      const { data, error } = await supabase.rpc('mark_production_batch_ready', {
        p_quote_item_ids: quoteItemIds,
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; updated_count: number };
      
      if (result.success) {
        toast.success(`${result.updated_count} item(s) marcados como listos para envío`);
        await loadQueue(); // Refresh the queue
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking batch as ready:', error);
      toast.error('Error al marcar el lote como listo');
      return false;
    } finally {
      setMarking(false);
    }
  }, [user, loadQueue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  return {
    queueItems,
    loading,
    marking,
    loadQueue,
    markBatchAsReady,
    totalPendingItems: queueItems.length,
    totalPendingUnits: queueItems.reduce((sum, item) => sum + item.total_quantity, 0)
  };
}
