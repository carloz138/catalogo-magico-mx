import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';
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

  // Actions para el header mejoradas
  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={loadAnalytics}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Actualizar</span>
      </Button>
      
      <select
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value)}
        className="px-2 sm:px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
      >
        <option value="7">7 días</option>
        <option value="30">30 días</option>
        <option value="90">3 meses</option>
      </select>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/products')}
        className="hidden sm:flex items-center gap-2"
      >
        <Package className="h-4 w-4" />
        Productos
      </Button>
    </div>
  );

  if (loading || !analyticsData) {
    return (
      <ProtectedRoute>
        <AppLayout actions={actions}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando métricas...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="space-y-6">
          {/* SECCIÓN 1: Dashboard de Uso */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Panel de Control</h2>
                <p className="text-sm text-gray-600">Estado actual de tu cuenta y límites</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="hidden sm:flex"
              >
                Mejorar Plan
              </Button>
            </div>
            <UsageDashboard />
          </div>

          {/* SECCIÓN 2: KPIs Principales */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Métricas Principales</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Productos */}
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Productos</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.products.total)}
                      </p>
                    </div>
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.performance.monthlyGrowth)}
                    <span className={`text-xs sm:text-sm ml-1 ${getGrowthColor(analyticsData.performance.monthlyGrowth)}`}>
                      {analyticsData.performance.monthlyGrowth > 0 ? '+' : ''}{analyticsData.performance.monthlyGrowth}%
                    </span>
                    <span className="text-xs text-gray-500 ml-2 hidden sm:inline">vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>

              {/* Catálogos */}
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Catálogos</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.catalogs.total)}
                      </p>
                    </div>
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500 truncate">
                      {analyticsData.catalogs.avgProductsPerCatalog} productos promedio
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Créditos IA */}
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Créditos IA</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.credits.remaining)}
                      </p>
                    </div>
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500 truncate">
                      Para remover fondos de imágenes
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Éxito de Procesamiento */}
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Éxito</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {analyticsData.performance.processingSuccess}%
                      </p>
                    </div>
                    <div className="h-8 w-8 sm:h-12 sm:w-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-gray-500 ml-1 truncate">
                      {analyticsData.products.completed} completados
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SECCIÓN 3: Tabs detallados */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2 text-xs sm:text-sm">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Productos</span>
              </TabsTrigger>
              <TabsTrigger value="catalogs" className="flex items-center gap-2 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Catálogos</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 text-xs sm:text-sm">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Rendimiento</span>
                <span className="sm:hidden">KPIs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Estado de Productos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                      Estado de Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <span className="text-sm">Pendientes</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{analyticsData.products.pending}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {analyticsData.products.total > 0 
                              ? Math.round((analyticsData.products.pending / analyticsData.products.total) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span className="text-sm">Procesando</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{analyticsData.products.processing}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {analyticsData.products.total > 0 
                              ? Math.round((analyticsData.products.processing / analyticsData.products.total) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-sm">Completados</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{analyticsData.products.completed}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {analyticsData.products.total > 0 
                              ? Math.round((analyticsData.products.completed / analyticsData.products.total) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                      Actividad Mensual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Productos este mes</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{analyticsData.products.thisMonth}</span>
                          {getGrowthIcon(analyticsData.performance.monthlyGrowth)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Catálogos este mes</span>
                        <span className="font-semibold">{analyticsData.catalogs.thisMonth}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Créditos usados</span>
                        <span className="font-semibold">{analyticsData.credits.thisMonth}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tiempo promedio</span>
                        <span className="font-semibold">{analyticsData.products.avgProcessingTime} min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Categorías */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    Categorías Más Populares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.products.topCategories.length > 0 ? (
                      analyticsData.products.topCategories.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-sm font-medium">{category.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${category.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {category.count}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No hay categorías aún</p>
                        <p className="text-xs">Sube productos para ver estadísticas</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Productos Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {formatNumber(analyticsData.products.total)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {analyticsData.products.thisMonth} añadidos este mes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tasa de Éxito</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      {analyticsData.performance.processingSuccess}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      De procesamiento exitoso
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tiempo Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                      {analyticsData.products.avgProcessingTime}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minutos por producto
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="catalogs" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Catálogos Creados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {formatNumber(analyticsData.catalogs.total)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {analyticsData.catalogs.thisMonth} este mes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Productos por Catálogo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-600">
                      {analyticsData.catalogs.avgProductsPerCatalog}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Promedio de productos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Template Favorito</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-pink-600 capitalize">
                      {analyticsData.catalogs.mostUsedTemplate}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Más utilizado
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                      KPIs de Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Procesamiento exitoso</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${analyticsData.performance.processingSuccess}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{analyticsData.performance.processingSuccess}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Generación de catálogos</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${analyticsData.performance.catalogGeneration}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{analyticsData.performance.catalogGeneration}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Eficiencia de créditos</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${analyticsData.credits.efficiency}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{analyticsData.credits.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      Insights y Recomendaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Recomendaciones basadas en datos */}
                      {analyticsData.products.pending > analyticsData.products.completed && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-yellow-800">
                                Procesa tus productos pendientes
                              </p>
                              <p className="text-xs text-yellow-700">
                                Tienes {analyticsData.products.pending} productos sin procesar.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analyticsData.credits.remaining < 5 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-red-800">
                                Créditos bajos
                              </p>
                              <p className="text-xs text-red-700">
                                Solo tienes {analyticsData.credits.remaining} créditos restantes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analyticsData.catalogs.total === 0 && analyticsData.products.completed > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-green-800">
                                ¡Crea tu primer catálogo!
                              </p>
                              <p className="text-xs text-green-700">
                                Tienes {analyticsData.products.completed} productos listos.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analyticsData.performance.monthlyGrowth > 50 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-blue-800">
                                ¡Excelente crecimiento!
                              </p>
                              <p className="text-xs text-blue-700">
                                Has crecido {analyticsData.performance.monthlyGrowth}% este mes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Si no hay insights, mostrar mensaje motivacional */}
                      {analyticsData.products.total === 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-blue-800">
                                ¡Comienza tu primer proyecto!
                              </p>
                              <p className="text-xs text-blue-700">
                                Sube algunos productos para ver tus métricas aquí.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Analytics;