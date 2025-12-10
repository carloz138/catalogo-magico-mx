import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorSearchAnalytics {
  search_term: string;
  total_count: number;
  zero_results_count: number;
  last_searched: string;
}

export function useVendorAnalytics(days: number = 30) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<VendorSearchAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_vendor_search_analytics', {
        p_vendor_id: user.id,
        p_days: days
      });

      if (rpcError) throw rpcError;
      setAnalytics((data as VendorSearchAnalytics[]) || []);
    } catch (err: any) {
      console.error('Error fetching vendor analytics:', err);
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [user, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate summary stats
  const totalSearches = analytics.reduce((sum, a) => sum + a.total_count, 0);
  const totalZeroResults = analytics.reduce((sum, a) => sum + a.zero_results_count, 0);
  const zeroResultRate = totalSearches > 0 ? (totalZeroResults / totalSearches) * 100 : 0;

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
    stats: {
      totalSearches,
      totalZeroResults,
      zeroResultRate,
      uniqueTerms: analytics.length
    }
  };
}
