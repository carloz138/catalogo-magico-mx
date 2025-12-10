import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketplaceCatalog {
  catalog_id: string;
  catalog_name: string;
  catalog_description: string | null;
  catalog_slug: string;
  vendor_id: string;
  vendor_name: string;
  vendor_logo: string | null;
  product_count: number;
  is_subscribed: boolean;
  created_at: string;
}

export function useMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [catalogs, setCatalogs] = useState<MarketplaceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_marketplace_catalogs', {
        p_limit: 50,
        p_offset: 0
      });

      if (error) throw error;
      setCatalogs((data as MarketplaceCatalog[]) || []);
    } catch (error: any) {
      console.error('Error fetching marketplace catalogs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los catálogos del marketplace',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const subscribeWithMargin = async (catalogId: string, marginPercentage: number) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Necesitas iniciar sesión para suscribirte a un catálogo',
        variant: 'destructive'
      });
      return null;
    }

    setSubscribing(catalogId);
    try {
      const { data, error } = await supabase.rpc('subscribe_with_margin', {
        p_catalog_id: catalogId,
        p_margin_percentage: marginPercentage
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        subscription_id: string;
        replicated_catalog_id: string;
        products_processed: number;
        variants_processed: number;
        margin_applied: number;
        message: string;
      };

      // Update local state
      setCatalogs(prev => 
        prev.map(c => 
          c.catalog_id === catalogId 
            ? { ...c, is_subscribed: true } 
            : c
        )
      );

      toast({
        title: '¡Productos importados!',
        description: `Se importaron ${result.products_processed} productos y ${result.variants_processed} variantes con ${marginPercentage}% de margen`
      });

      return result;
    } catch (error: any) {
      console.error('Error subscribing with margin:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar la suscripción',
        variant: 'destructive'
      });
      return null;
    } finally {
      setSubscribing(null);
    }
  };

  const unsubscribeFromCatalog = async (catalogId: string) => {
    if (!user) return false;

    setSubscribing(catalogId);
    try {
      const { error } = await supabase
        .from('catalog_subscriptions')
        .update({ is_active: false })
        .eq('subscriber_id', user.id)
        .eq('original_catalog_id', catalogId);

      if (error) throw error;

      // Update local state
      setCatalogs(prev => 
        prev.map(c => 
          c.catalog_id === catalogId 
            ? { ...c, is_subscribed: false } 
            : c
        )
      );

      toast({
        title: 'Suscripción cancelada',
        description: 'Ya no venderás los productos de este catálogo'
      });

      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from catalog:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSubscribing(null);
    }
  };

  return {
    catalogs,
    loading,
    subscribing,
    subscribeWithMargin,
    unsubscribeFromCatalog,
    refetch: fetchCatalogs
  };
}
