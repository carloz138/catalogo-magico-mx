import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscribedProduct {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_description: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  category: string | null;
  image_url: string | null;
  vendor_id: string | null;
  vendor_name: string;
  catalog_id: string;
  catalog_name: string;
  is_subscribed: boolean;
}

export function useSubscribedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<SubscribedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_subscribed_catalog_products', {
        p_subscriber_id: user.id
      });

      if (rpcError) throw rpcError;
      setProducts((data as SubscribedProduct[]) || []);
    } catch (err: any) {
      console.error('Error fetching subscribed products:', err);
      setError(err.message || 'Error loading subscribed products');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Group products by vendor
  const productsByVendor = products.reduce((acc, product) => {
    const vendorName = product.vendor_name || 'Proveedor';
    if (!acc[vendorName]) {
      acc[vendorName] = [];
    }
    acc[vendorName].push(product);
    return acc;
  }, {} as Record<string, SubscribedProduct[]>);

  return {
    products,
    productsByVendor,
    loading,
    error,
    refetch: fetchProducts,
    totalCount: products.length,
    vendorCount: Object.keys(productsByVendor).length
  };
}
