import { supabase } from '@/integrations/supabase/client';
import { hashIP } from '@/utils/analytics';

export interface ViewMetadata {
  country?: string;
  city?: string;
  referrer?: string;
  userAgent?: string;
  ipHash: string;
}

export interface CatalogAnalytics {
  totalViews: number;
  uniqueViews: number;
  conversionRate: number;
  viewsByDay: { date: string; count: number }[];
  topCountries?: { country: string; count: number }[];
  topCities?: { city: string; count: number }[];
}

export class AnalyticsService {
  
  // Registrar vista del catálogo
  static async trackCatalogView(
    catalogId: string,
    metadata: ViewMetadata
  ): Promise<void> {
    try {
      // Insertar vista en catalog_views
      const { error: viewError } = await supabase
        .from('catalog_views')
        .insert({
          catalog_id: catalogId,
          ip_address: metadata.ipHash,
          user_agent: metadata.userAgent,
          referrer: metadata.referrer,
          country: metadata.country,
          city: metadata.city,
        });
      
      if (viewError) throw viewError;
      
      // Incrementar contador de vistas
      const { error: updateError } = await supabase.rpc(
        'increment_catalog_views',
        { p_catalog_id: catalogId }
      );
      
      if (updateError) {
        console.error('Error incrementing view count:', updateError);
      }
    } catch (error) {
      console.error('Error tracking catalog view:', error);
      throw error;
    }
  }
  
  // Obtener analytics del catálogo
  static async getCatalogAnalytics(
    catalogId: string,
    userId: string
  ): Promise<CatalogAnalytics> {
    try {
      // Verificar que el catálogo pertenece al usuario
      const { data: catalog, error: catalogError } = await supabase
        .from('digital_catalogs')
        .select('user_id, view_count')
        .eq('id', catalogId)
        .eq('user_id', userId)
        .single();
      
      if (catalogError) throw catalogError;
      if (!catalog) throw new Error('Catálogo no encontrado');
      
      // Obtener todas las vistas
      const { data: views, error: viewsError } = await supabase
        .from('catalog_views')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('viewed_at', { ascending: false });
      
      if (viewsError) throw viewsError;
      
      // Calcular vistas únicas por IP
      const uniqueIPs = new Set(views?.map(v => v.ip_address).filter(Boolean));
      
      // Calcular vistas por día (últimos 30 días)
      const viewsByDay = this.calculateViewsByDay(views || []);
      
      // Obtener cotizaciones del catálogo
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id')
        .eq('catalog_id', catalogId);
      
      if (quotesError) throw quotesError;
      
      // Calcular tasa de conversión
      const totalViews = catalog.view_count || 0;
      const totalQuotes = quotes?.length || 0;
      const conversionRate = totalViews > 0 ? (totalQuotes / totalViews) * 100 : 0;
      
      // Verificar plan del usuario para analytics avanzados
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('package_id, credit_packages(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      const packageName = subscription?.credit_packages?.name?.toLowerCase() || '';
      const hasAdvancedAnalytics = 
        packageName.includes('medio') || 
        packageName.includes('profesional') ||
        packageName.includes('premium') ||
        packageName.includes('empresarial');
      
      const analytics: CatalogAnalytics = {
        totalViews,
        uniqueViews: uniqueIPs.size,
        conversionRate: Math.round(conversionRate * 100) / 100,
        viewsByDay,
      };
      
      // Agregar analytics avanzados solo para planes medio/premium
      if (hasAdvancedAnalytics && views) {
        analytics.topCountries = this.calculateTopCountries(views);
        analytics.topCities = this.calculateTopCities(views);
      }
      
      return analytics;
    } catch (error) {
      console.error('Error getting catalog analytics:', error);
      throw error;
    }
  }
  
  // Calcular vistas por día (últimos 30 días)
  private static calculateViewsByDay(
    views: Array<{ viewed_at: string }>
  ): { date: string; count: number }[] {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Inicializar objeto con últimos 30 días
    const viewsMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      viewsMap[dateStr] = 0;
    }
    
    // Contar vistas por día
    views.forEach(view => {
      const dateStr = view.viewed_at.split('T')[0];
      if (viewsMap[dateStr] !== undefined) {
        viewsMap[dateStr]++;
      }
    });
    
    // Convertir a array ordenado
    return Object.entries(viewsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // Calcular top países
  private static calculateTopCountries(
    views: Array<{ country: string | null }>
  ): { country: string; count: number }[] {
    const countryCounts: Record<string, number> = {};
    
    views.forEach(view => {
      if (view.country) {
        countryCounts[view.country] = (countryCounts[view.country] || 0) + 1;
      }
    });
    
    return Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  // Calcular top ciudades
  private static calculateTopCities(
    views: Array<{ city: string | null }>
  ): { city: string; count: number }[] {
    const cityCounts: Record<string, number> = {};
    
    views.forEach(view => {
      if (view.city) {
        cityCounts[view.city] = (cityCounts[view.city] || 0) + 1;
      }
    });
    
    return Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
