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

// Componentes
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
} from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();

  // Estado para KPIs Reales
  const [metrics, setMetrics] = useState({
    activeResellersCount: 0,
    totalProductsCount: 0,
    recentQuotesCount: 0,
    hasActiveCatalog: false, // Para L2
  });

  const [isLoadingData, setIsLoadingData] = useState(true);

  // Efecto: Carga de Datos Globales (User-Centric)
  useEffect(() => {
    const loadDashboardMetrics = async () => {
      if (!user) return;

      try {
        // --- SOLUCIÓN "CORTAFUEGOS" PARA TS2589 ---
        // Al tipar explícitamente la variable de respuesta como ': any',
        // obligamos a TypeScript a dejar de calcular la estructura profunda de la DB.

        // 1. Contar Revendedores Activos
        const res1: any = await supabase
          .from("replicated_catalogs")
          .select("id", { count: "exact", head: true })
          .eq("fabricante_id", user.id)
          .eq("is_active", true);
        const resellersCount = res1.count;

        // 2. Contar Productos Totales
        const res2: any = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        const productsCount = res2.count;

        // 3. Contar Cotizaciones Recientes (7 días)
        const res3: any = await supabase
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        const quotesCount = res3.count;

        // 4. Verificar si tiene Catálogo Propio
        const res4: any = await supabase
          .from("digital_catalogs")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        const catalogData = res4.data;

        // Lógica adicional para L2: si no tiene catálogo propio, buscar réplica
        let hasCatalog = !!catalogData;

        if (!hasCatalog) {
          const res5: any = await supabase
            .from("replicated_catalogs")
            .select("id")
            .eq("reseller_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();
          if (res5.data) hasCatalog = true;
        }

        setMetrics({
          activeResellersCount: resellersCount || 0,
          totalProductsCount: productsCount || 0,
          recentQuotesCount: quotesCount || 0,
          hasActiveCatalog: hasCatalog,
        });
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardMetrics();
  }, [user]);

  if (isLoadingRole || !user || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // ========================================================
  // VISTA 1: REVENDEDOR (L2)
  // ========================================================
  if (userRole === "L2") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 mb-2 hover:bg-indigo-100">
              Modo Revendedor
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tu Negocio Digital</h1>
            <p className="text-slate-500">Gestiona tus ventas y tu catálogo replicado.</p>
          </div>
          {metrics.hasActiveCatalog && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2 w-full md:w-auto">
              <Share2 className="w-4 h-4" /> Compartir mi Tienda
            </Button>
          )}
        </div>

        <motion.div variants={itemVariants}>
          <Card
            className={`border-l-4 ${metrics.hasActiveCatalog ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-amber-500 bg-amber-50/30"} shadow-sm`}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${metrics.hasActiveCatalog ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                >
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {metrics.hasActiveCatalog ? "Tienda Activa y Operando" : "Tienda Inactiva"}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {metrics.hasActiveCatalog
                      ? "Tus clientes pueden ver tu catálogo y cotizarte ahora mismo."
                      : "Necesitas aceptar una invitación de tu proveedor para activar tu catálogo."}
                  </p>
                </div>
              </div>
              {!metrics.hasActiveCatalog && (
                <Button variant="outline" className="hidden md:flex">
                  Ver Invitaciones
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <DashboardKPIs userId={user.id} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-md border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Rendimiento de Ventas
              </CardTitle>
              <CardDescription>Tus ingresos en los últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart userId={user.id} />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors">
                <span className="text-sm">Ver Pedidos Pendientes</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors">
                <span className="text-sm">Configurar Precios</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Últimos Movimientos</h3>
          <ResellerInsights userId={user.id} resellerId={user.id} />
        </motion.div>
      </motion.div>
    );
  }

  // ========================================================
  // VISTA 2: FABRICANTE (L1)
  // ========================================================
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Comando</h1>
          <p className="text-slate-500 flex items-center gap-2">
            Bienvenido, {paqueteUsuario?.name || "Administrador"}
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Sistema Operativo
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="hidden md:flex">
            Descargar Reporte
          </Button>
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" /> Invitar Revendedor
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resumen" className="w-full space-y-8">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm inline-flex w-full md:w-auto overflow-x-auto">
          <TabsTrigger
            value="resumen"
            className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-6 py-2.5 rounded-lg transition-all"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Resumen General
          </TabsTrigger>

          <TabsTrigger
            value="inteligencia"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 text-slate-500 px-6 py-2.5 rounded-lg transition-all"
          >
            <Users className="w-4 h-4 mr-2" /> Inteligencia de Red
          </TabsTrigger>

          <TabsTrigger
            value="estrategia"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-slate-500 px-6 py-2.5 rounded-lg transition-all"
          >
            <BrainCircuit className="w-4 h-4 mr-2" /> Visión Estratégica
            {paqueteUsuario?.analytics_level !== "enterprise" && <Sparkles className="w-3 h-3 ml-2 text-yellow-400" />}
          </TabsTrigger>

          {userRole === "BOTH" && (
            <TabsTrigger
              value="mis_ventas"
              className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 text-slate-500 px-6 py-2.5 rounded-lg transition-all"
            >
              <ShoppingBag className="w-4 h-4 mr-2" /> Vista Revendedor
            </TabsTrigger>
          )}
        </TabsList>

        {/* --- TAB 1: RESUMEN OPERATIVO --- */}
        <TabsContent value="resumen" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants}>
            <DashboardKPIs userId={user.id} />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md border-slate-200">
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Consolidado de ventas directas y a través de red.</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart userId={user.id} />
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">
                  Salud de la Red
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Revendedores Activos</span>
                    <span className="text-indigo-600 font-bold">{metrics.activeResellersCount}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-indigo-600 rounded-full ${metrics.activeResellersCount > 0 ? "w-full" : "w-0"} transition-all duration-1000`}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Productos Gestionados</span>
                    <span className="text-emerald-600 font-bold">{metrics.totalProductsCount}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 w-full rounded-full opacity-70"></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Actividad Reciente</p>
                      <p className="text-sm font-bold text-slate-900">
                        {metrics.recentQuotesCount} cotizaciones esta semana
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* --- TAB 2: INTELIGENCIA DE MERCADO --- */}
        <TabsContent value="inteligencia" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <>
              <Card className="shadow-lg border-indigo-100 overflow-hidden">
                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-indigo-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-600" /> Radar de Oportunidades
                    </CardTitle>
                    <Badge className="bg-indigo-200 text-indigo-800 hover:bg-indigo-200">IA Activa</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <MarketIntelligenceWidget userId={user.id} />
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-slate-600" /> Términos de Búsqueda (L3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SearchStatsWidget userId={user.id} />
                </CardContent>
              </Card>
            </>
          </motion.div>
        </TabsContent>

        {/* --- TAB 3: VISIÓN ESTRATÉGICA (VIP / ENTERPRISE) --- */}
        <TabsContent value="estrategia" className="space-y-8 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Predicción de Demanda
                </h3>
                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                  Próximos 7 días
                </Badge>
              </div>
              <DemandForecastWidget userId={user.id} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Auditoría de Capital</h3>
              </div>
              <DeadStockAnalysis userId={user.id} />
            </div>
          </motion.div>
        </TabsContent>

        {/* --- TAB 4: VISTA HÍBRIDA (BOTH) --- */}
        {userRole === "BOTH" && (
          <TabsContent value="mis_ventas" className="space-y-6 focus-visible:outline-none">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-6">
              <h3 className="text-emerald-800 font-bold text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Vista de Revendedor Personal
              </h3>
              <p className="text-emerald-600 text-sm">
                Aquí ves los datos específicos de cuando actúas como revendedor de otros productos.
              </p>
            </div>
            <DashboardKPIs userId={user.id} />
            <ResellerInsights userId={user.id} resellerId={user.id} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
