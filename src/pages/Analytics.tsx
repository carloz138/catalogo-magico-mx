import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';
import KpiDashboard from '@/components/dashboard/KpiDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Zap,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Layers,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  products: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    thisMonth: number;
    lastMonth: number;
    avgProcessingTime: number;
    topCategories: Array<{ category: string; count: number; percentage: number }>;
  };
  catalogs: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    totalDownloads: number;
    avgProductsPerCatalog: number;
    mostUsedTemplate: string;
  };
  credits: {
    total: number;
    used: number;
    remaining: number;
    thisMonth: number;
    avgPerProduct: number;
    efficiency: number;
  };
  performance: {
    processingSuccess: number;
    catalogGeneration: number;
    userSatisfaction: number;
    monthlyGrowth: number;
  };
}

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30'); // días

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [productsData, catalogsData, userStats] = await Promise.all([
        loadProductsAnalytics(),
        loadCatalogsAnalytics(),
        loadUserStats()
      ]);

      // Procesar y combinar datos
      const analytics: AnalyticsData = {
        products: productsData,
        catalogs: catalogsData,
        credits: {
          total: userStats.totalCredits || 0,
          used: userStats.creditsUsed || 0,
          remaining: userStats.credits || 0,
          thisMonth: userStats.monthlyCreditsUsed || 0,
          avgPerProduct: productsData.completed > 0 ? Math.round(userStats.creditsUsed / productsData.completed) : 0,
          efficiency: calculateEfficiency(userStats.creditsUsed, productsData.completed)
        },
        performance: {
          processingSuccess: calculateProcessingSuccess(productsData),
          catalogGeneration: catalogsData.total > 0 ? 95 : 0, // Asumiendo 95% éxito
          userSatisfaction: 4.8, // Score simulado
          monthlyGrowth: calculateMonthlyGrowth(productsData.thisMonth, productsData.lastMonth)
        }
      };

      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProductsAnalytics = async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, processing_status, category, created_at, processed_at')
      .eq('user_id', user!.id);

    if (error) throw error;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthProducts = products?.filter(p => new Date(p.created_at) >= thisMonth) || [];
    const lastMonthProducts = products?.filter(p => {
      const date = new Date(p.created_at);
      return date >= lastMonth && date <= lastMonthEnd;
    }) || [];

    // Calcular categorías más populares
    const categoryCount = products?.reduce((acc, product) => {
      const category = product.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / (products?.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calcular tiempo promedio de procesamiento
    const processedProducts = products?.filter(p => 
      p.processing_status === 'completed' && p.processed_at
    ) || [];
    
    const avgProcessingTime = processedProducts.length > 0 
      ? processedProducts.reduce((acc, product) => {
          const created = new Date(product.created_at).getTime();
          const processed = new Date(product.processed_at!).getTime();
          return acc + (processed - created);
        }, 0) / processedProducts.length / (1000 * 60) // En minutos
      : 0;

    return {
      total: products?.length || 0,
      pending: products?.filter(p => p.processing_status === 'pending').length || 0,
      processing: products?.filter(p => p.processing_status === 'processing').length || 0,
      completed: products?.filter(p => p.processing_status === 'completed').length || 0,
      thisMonth: thisMonthProducts.length,
      lastMonth: lastMonthProducts.length,
      avgProcessingTime: Math.round(avgProcessingTime),
      topCategories
    };
  };

  const loadCatalogsAnalytics = async () => {
    const { data: catalogs, error } = await supabase
      .from('catalogs')
      .select('id, name, total_products, created_at, template_style')
      .eq('user_id', user!.id);

    if (error) throw error;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthCatalogs = catalogs?.filter(c => new Date(c.created_at) >= thisMonth) || [];
    const lastMonthCatalogs = catalogs?.filter(c => {
      const date = new Date(c.created_at);
      return date >= lastMonth && date <= lastMonthEnd;
    }) || [];

    // Template más usado
    const templateCount = catalogs?.reduce((acc, catalog) => {
      const template = catalog.template_style || 'professional';
      acc[template] = (acc[template] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const mostUsedTemplate = Object.entries(templateCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'professional';

    const avgProductsPerCatalog = catalogs?.length 
      ? Math.round(catalogs.reduce((acc, cat) => acc + (cat.total_products || 0), 0) / catalogs.length)
      : 0;

    return {
      total: catalogs?.length || 0,
      thisMonth: thisMonthCatalogs.length,
      lastMonth: lastMonthCatalogs.length,
      totalDownloads: (catalogs?.length || 0) * 3, // Simulado: 3 descargas promedio por catálogo
      avgProductsPerCatalog,
      mostUsedTemplate
    };
  };

  const loadUserStats = async () => {
    const { data: user_data, error } = await supabase
      .from('users')
      .select('credits, total_credits_purchased')
      .eq('id', user!.id)
      .single();

    if (error) throw error;

    // Obtener uso de créditos
    const { data: creditUsage, error: creditError } = await supabase
      .from('credit_usage')
      .select('credits_used, created_at')
      .eq('user_id', user!.id);

    if (creditError) console.error('Error loading credit usage:', creditError);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCreditsUsed = creditUsage?.filter(c => new Date(c.created_at) >= thisMonth)
      .reduce((acc, usage) => acc + usage.credits_used, 0) || 0;

    const totalCreditsUsed = creditUsage?.reduce((acc, usage) => acc + usage.credits_used, 0) || 0;

    return {
      credits: user_data.credits || 0,
      totalCredits: user_data.total_credits_purchased || 0,
      creditsUsed: totalCreditsUsed,
      monthlyCreditsUsed
    };
  };

  const calculateEfficiency = (creditsUsed: number, productsCompleted: number) => {
    if (productsCompleted === 0) return 0;
    const avgCreditsPerProduct = creditsUsed / productsCompleted;
    // Eficiencia basada en el promedio ideal de 1 crédito por producto
    return Math.min(100, Math.round((1 / Math.max(avgCreditsPerProduct, 0.1)) * 100));
  };

  const calculateProcessingSuccess = (productsData: any) => {
    const total = productsData.total;
    if (total === 0) return 100;
    const successful = productsData.completed;
    return Math.round((successful / total) * 100);
  };

  const calculateMonthlyGrowth = (thisMonth: number, lastMonth: number) => {
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-gray-400" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Header simplificado
  const PageHeader = () => (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
        Analytics
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        Métricas y rendimiento de tu cuenta
      </p>
    </div>
  );

  // Actions para el header
  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      {/* Móvil: Solo selector + refresh */}
      <div className="flex items-center gap-2 flex-1 md:flex-none">
        <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-2 rounded-lg border flex-1 md:flex-none">
          <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs sm:text-sm bg-transparent border-none outline-none cursor-pointer w-full md:w-auto"
          >
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
          </select>
        </div>

        <Button
          onClick={loadAnalytics}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Link productos - solo desktop */}
        <Button
          onClick={() => navigate('/products')}
          variant="ghost"
          size="sm"
          className="hidden md:flex"
        >
          <Package className="h-4 w-4 mr-2" />
          Productos
        </Button>
      </div>
    </div>
  );

  if (loading || !analyticsData) {
    return (
      <AppLayout actions={actions}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando métricas...</p>
            </div>
          </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout actions={actions}>
        <div className="space-y-6">
          {/* Header simplificado */}
          <PageHeader />

          {/* Dashboard de Uso */}
          <UsageDashboard />

          {/* KPIs de Ventas */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Métricas de Ventas</h2>
            <KpiDashboard />
          </div>
        </div>
      </AppLayout>
  );
};

export default Analytics;