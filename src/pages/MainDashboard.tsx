import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Contextos
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

// Componentes Hijos
import { DashboardKPIs, SalesChart } from "@/components/dashboard/DashboardCharts";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { SearchStatsWidget } from "@/components/dashboard/SearchStatsWidget";
// import { ResellerInsights } from "@/components/dashboard/ResellerInsights"; // Descomentar si lo usas
import { DeadStockAnalysis } from "@/components/dashboard/analytics/DeadStockAnalysis";
import { DemandForecastWidget } from "@/components/dashboard/analytics/DemandForecastWidget";

// Iconos
import {
  BarChart3,
  ShoppingBag,
  Users,
  Zap,
  Share2,
  TrendingUp,
  Activity,
  Search,
  BrainCircuit,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();

  // Estado para controlar los Tabs (para navegar desde las tarjetas de acción)
  const [activeTab, setActiveTab] = useState("resumen");

  // Estado extendido con las nuevas métricas de inteligencia
  const [metrics, setMetrics] = useState({
    activeResellersCount: 0,
    totalProductsCount: 0,
    recentQuotesCount: 0,
    pendingOrdersCount: 0,
    newProviderProducts: 0,
    // Nuevos campos de inteligencia (search logs y radares)
    missedSearchTerm: null as string | null,
    missedSearchCount: 0,
    marketOpportunities: 0,
  });

  const [hasActiveCatalog, setHasActiveCatalog] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. Verificar si tiene catálogo activo (para botón compartir)
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
          .eq("is_active", true)
          .maybeSingle();
        if (rep) setHasActiveCatalog(true);
      }
    };
    checkCatalog();
  }, [user]);

  // 2. Cargar Estadísticas e Insights (RPC Mejorada)
  useEffect(() => {
    const loadMetrics = async () => {
      if (!user) return;
      try {
        // Llamamos a la RPC actualizada. Usamos 'as any' temporalmente si TS reclama.
        const { data, error } = await supabase.rpc("get_dashboard_stats" as any, { p_user_id: user.id });

        if (error) throw error;

        if (data) {
          setMetrics((prev) => ({ ...prev, ...(data as any) }));
        }
      } catch (e) {
        console.error("Error loading stats:", e);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadMetrics();
  }, [user]);

  // Loading State
  if (isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Animaciones
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  // UI Helpers
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
      {/* --- HEADER --- */}
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

      {/* --- SECCIÓN PRESCRIPTIVA: TARJETAS DE ACCIÓN INTELIGENTE --- */}
      {/* Esta sección solo muestra tarjetas si hay algo urgente/importante que atender */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. PEDIDOS (Verde - Dinero Cerrado) */}
        {metrics.pendingOrdersCount > 0 ? (
          <Card className="bg-emerald-50 border-emerald-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingBag className="w-16 h-16 text-emerald-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Pedidos por Aprobar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700 text-sm mb-3">
                Tienes <span className="font-bold text-2xl mx-1">{metrics.pendingOrdersCount}</span> pedidos pendientes
                de procesar.
              </p>
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                Gestionar Pedidos
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Estado Base (Opcional: Ocultar o mostrar status ok)
          <Card className="bg-white border-slate-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-500 text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Todo al día. No hay pedidos pendientes.</p>
            </CardContent>
          </Card>
        )}

        {/* 2. RADARES DE MERCADO (Azul - Oportunidad de Venta) */}
        {metrics.marketOpportunities > 0 && (
          <Card className="bg-indigo-50 border-indigo-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-indigo-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-indigo-800 text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" /> Radar de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-700 text-sm mb-3">
                <span className="font-bold text-2xl mx-1">{metrics.marketOpportunities}</span> clientes potenciales
                piden productos.
                {/* Mensaje contextual para L1 */}
                {userRole !== "L2" && (
                  <span className="block text-xs mt-1 opacity-80">(Incluye solicitudes de tu red de revendedores)</span>
                )}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                onClick={() => setActiveTab("inteligencia")}
              >
                Ver Solicitudes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 3. BÚSQUEDAS FALLIDAS (Naranja - Demanda Insatisfecha) */}
        {metrics.missedSearchCount > 2 && (
          <Card className="bg-orange-50 border-orange-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Search className="w-16 h-16 text-orange-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Alta Demanda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 text-sm mb-3">
                Buscan <strong>"{metrics.missedSearchTerm}"</strong> ({metrics.missedSearchCount} veces) y no aparece.
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0"
                // Acción depende del rol
                onClick={() =>
                  userRole === "L2" ? console.log("Solicitar a proveedor") : console.log("Crear producto")
                }
              >
                {userRole === "L2" ? "Solicitar a Proveedor" : "Agregar Producto"}
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* --- TABS PRINCIPALES --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm inline-flex w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="resumen" className="px-6 py-2.5">
            <BarChart3 className="w-4 h-4 mr-2" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="inteligencia" className="px-6 py-2.5">
            <Users className="w-4 h-4 mr-2" /> Inteligencia
            {/* Badge en el Tab si hay alertas */}
            {metrics.marketOpportunities > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {metrics.marketOpportunities}
              </span>
            )}
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

            {/* Tarjeta Lateral de Resumen (Salud de Red o Novedades) */}
            <Card className="bg-white border-slate-200 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">
                  {userRole === "L2" ? "Novedades Proveedor" : "Salud de la Red"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {userRole === "L2" ? (
                  // L2: Novedades
                  <div className="text-center py-4">
                    {metrics.newProviderProducts > 0 ? (
                      <>
                        <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-lg font-bold text-slate-800">
                          {metrics.newProviderProducts} Productos Nuevos
                        </p>
                        <p className="text-xs text-slate-500">Tu proveedor actualizó su catálogo.</p>
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm">Sin novedades recientes.</p>
                    )}
                  </div>
                ) : (
                  // L1: Red
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>Revendedores Activos</span>
                      <span className="text-indigo-600 font-bold text-lg">{metrics.activeResellersCount}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 font-medium mt-4">
                      <span>Total Productos</span>
                      <span className="text-emerald-600 font-bold text-lg">{metrics.totalProductsCount}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">{metrics.recentQuotesCount} cotizaciones (7 días)</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* TAB 2: INTELIGENCIA (Aquí vive el Radar) */}
        <TabsContent value="inteligencia" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WIDGET RADAR DE MERCADO */}
            <Card className="shadow-lg border-indigo-100 overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" /> Radar de Oportunidades
                  </CardTitle>
                  <Badge className="bg-indigo-200 text-indigo-800 hover:bg-indigo-200">
                    {userRole === "L1" ? "Global (Red)" : "Local"}
                  </Badge>
                </div>
                <CardDescription>
                  {userRole === "L1"
                    ? "Solicitudes de productos no encontrados en tu catálogo y en el de tus revendedores."
                    : "Solicitudes directas de tus clientes cuando no encuentran algo."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Aquí es donde tu MarketIntelligenceWidget hace la magia de ocultar/mostrar datos según L1/L2 */}
                <MarketIntelligenceWidget userId={user.id} />
              </CardContent>
            </Card>

            {/* WIDGET SEARCH LOGS */}
            <Card className="shadow-lg border-slate-200 overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-slate-600" /> Términos de Búsqueda
                </CardTitle>
                <CardDescription>Lo que tus clientes escriben en el buscador.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SearchStatsWidget userId={user.id} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* TAB 3: ESTRATEGIA */}
        <TabsContent value="estrategia" className="space-y-8 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Predicción de Demanda
                </h3>
              </div>
              <DemandForecastWidget userId={user.id} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Auditoría de Capital (Stock Muerto)</h3>
              </div>
              <DeadStockAnalysis userId={user.id} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
