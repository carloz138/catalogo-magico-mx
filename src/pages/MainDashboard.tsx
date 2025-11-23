import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- IMPORTACIONES REALES ---
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

// Componentes Hijos
import { DashboardKPIs, SalesChart } from "@/components/dashboard/DashboardCharts";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { SearchStatsWidget } from "@/components/dashboard/SearchStatsWidget";
import { ResellerInsights } from "@/components/dashboard/ResellerInsights";
import { DeadStockAnalysis } from "@/components/dashboard/analytics/DeadStockAnalysis";
import { DemandForecastWidget } from "@/components/dashboard/analytics/DemandForecastWidget";

import {
  BarChart3,
  ShoppingBag,
  Users,
  Zap,
  Share2,
  ArrowRight,
  TrendingUp,
  Activity,
  Search,
  BrainCircuit,
  Sparkles,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();

  // ESTADO DE MÉTRICAS REALES
  const [metrics, setMetrics] = useState({
    activeResellersCount: 0,
    totalProductsCount: 0,
    recentQuotesCount: 0,
    pendingOrdersCount: 0,
    newProviderProducts: 0,
  });

  const [hasActiveCatalog, setHasActiveCatalog] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. Cargar si tiene catálogo (Para botón "Compartir")
  useEffect(() => {
    if (!user) return;
    const checkCatalog = async () => {
      const { data } = await supabase.from("digital_catalogs").select("id").eq("user_id", user.id).maybeSingle();
      if (data) setHasActiveCatalog(true);
      else {
        const { data: rep } = await supabase
          .from("replicated_catalogs")
          .select("id")
          .eq("reseller_id", user.id)
          .maybeSingle();
        if (rep) setHasActiveCatalog(true);
      }
    };
    checkCatalog();
  }, [user]);

  // 2. Cargar Métricas Operativas (RPC)
  useEffect(() => {
    const loadMetrics = async () => {
      if (!user) return;
      try {
        // Llamada a la función SQL que creamos
        const { data, error } = await supabase.rpc("get_dashboard_stats", { p_user_id: user.id });
        if (error) throw error;
        if (data) {
          setMetrics(data as any);
        }
      } catch (e) {
        console.error("Error loading stats:", e);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadMetrics();
  }, [user]);

  if (isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  // --- RENDER ---

  // NOMBRE DEL PLAN DINÁMICO
  const planName = paqueteUsuario?.name || "Plan Gratuito";
  const planBadgeColor =
    paqueteUsuario?.analytics_level === "enterprise" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge
            className={`${userRole === "L2" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"} border-0 mb-2`}
          >
            {userRole === "L2" ? "Panel de Revendedor" : "Panel de Fabricante"}
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Comando</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            Bienvenido, <span className="font-semibold text-slate-700">{user.email?.split("@")[0]}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planBadgeColor}`}>{planName}</span>
          </p>
        </div>

        {hasActiveCatalog && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2">
            <Share2 className="w-4 h-4" /> {userRole === "L2" ? "Compartir mi Tienda" : "Invitar Revendedor"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="resumen" className="w-full space-y-8">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm inline-flex w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="resumen" className="px-6 py-2.5">
            <BarChart3 className="w-4 h-4 mr-2" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="inteligencia" className="px-6 py-2.5">
            <Users className="w-4 h-4 mr-2" /> Inteligencia
          </TabsTrigger>
          <TabsTrigger value="estrategia" className="px-6 py-2.5">
            <BrainCircuit className="w-4 h-4 mr-2" /> Estrategia
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RESUMEN OPERATIVO */}
        <TabsContent value="resumen" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants}>
            <DashboardKPIs userId={user.id} />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md border-slate-200">
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Consolidado de operaciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart userId={user.id} />
              </CardContent>
            </Card>

            {/* TARJETA DE ACCIÓN / SALUD (Dinámica según Rol) */}
            {userRole === "L2" ? (
              // VISTA REVENDEDOR (L2)
              <Card className="bg-slate-900 text-white border-slate-800 flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" /> Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ALERTA DE PEDIDOS */}
                  <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors">
                    <span className="text-sm text-slate-200">Pedidos por atender</span>
                    {metrics.pendingOrdersCount > 0 ? (
                      <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">
                        {metrics.pendingOrdersCount}
                      </Badge>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  {/* ALERTA DE NOVEDADES DEL PROVEEDOR */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {metrics.newProviderProducts > 0 ? (
                      <>
                        <p className="text-xs text-yellow-400 mb-2 font-medium flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> ¡Hay novedades!
                        </p>
                        <p className="text-xs text-slate-400 mb-3">
                          Tu proveedor lanzó {metrics.newProviderProducts} productos nuevos esta semana.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-slate-900 border-0 bg-white hover:bg-slate-100"
                        >
                          Ver Catálogo Proveedor
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">Sin novedades recientes del proveedor.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // VISTA FABRICANTE (L1)
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">
                    Salud de la Red
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* MÉTRICAS REALES DE LA RED */}
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>Revendedores Totales</span>
                      <span className="text-indigo-600 font-bold text-lg">{metrics.activeResellersCount}</span>
                    </div>
                    <p className="text-xs text-slate-400">Tiendas replicadas activas en tu red.</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>Productos Gestionados</span>
                      <span className="text-emerald-600 font-bold text-lg">{metrics.totalProductsCount}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <Activity className="w-8 h-8 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Actividad Reciente</p>
                        <p className="text-sm font-bold text-slate-900">
                          {metrics.recentQuotesCount} cotizaciones en los últimos 7 días
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* TAB 2 y 3 SE MANTIENEN IGUAL QUE ANTES... */}
        <TabsContent value="inteligencia" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-indigo-100 overflow-hidden">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" /> Radar de Oportunidades
                  </CardTitle>
                  <Badge className="bg-indigo-200 text-indigo-800 hover:bg-indigo-200">Global</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <MarketIntelligenceWidget catalogId={null} />
              </CardContent>
            </Card>
            <Card className="shadow-lg border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-slate-600" /> Términos de Búsqueda (L3)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <SearchStatsWidget catalogId={null} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="estrategia" className="space-y-8 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Predicción de Demanda
                </h3>
              </div>
              <DemandForecastWidget catalogId={null} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Auditoría de Capital</h3>
              </div>
              <DeadStockAnalysis />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
