import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsService, CatalogAnalytics } from '@/services/analyticsService';

export function useCatalogAnalytics(catalogId: string | null) {
  const { user } = useAuth();
  
  return useQuery<CatalogAnalytics>({
    queryKey: ['catalog-analytics', catalogId],
    queryFn: async () => {
      if (!catalogId || !user) {
        throw new Error('Catalog ID and user required');
      }
      return AnalyticsService.getCatalogAnalytics(catalogId, user.id);
    },
    enabled: !!catalogId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });
}
