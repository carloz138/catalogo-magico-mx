import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

//comentario
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
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
  BrainCircuit, // Nuevo icono para la pestaña VIP
  Sparkles,
  Loader2,
} from "lucide-react";

// ============================================================================
// 🛠️ SECCIÓN DE MOCKS (BORRAR ESTA SECCIÓN AL PEGAR EN TU PROYECTO)
// Estos componentes simulan tus archivos externos para que la previsualización funcione.
// ============================================================================

// Mock Contexts
const useAuth = () => ({ user: { id: "mock-user-id" } });
const useUserRole = () => ({ userRole: "L1", isLoadingRole: false }); // Cambia a "L2" o "BOTH" para probar vistas
const useSubscription = () => ({
  paqueteUsuario: { name: "Plan Empresarial", analytics_level: "enterprise" },
});
const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        limit: () => ({
          maybeSingle: async () => ({ data: { id: "mock-catalog-id" } }),
        }),
      }),
    }),
  }),
};

// Mock Components
const MockWidget = ({ title, color = "bg-white" }: { title: string; color?: string }) => (
  <div
    className={`p-6 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center h-full min-h-[300px] ${color}`}
  >
    <p className="text-slate-500 font-medium flex items-center gap-2">
      <Activity className="w-4 h-4" /> {title}
    </p>
  </div>
);

const DashboardKPIs = ({ userId }: any) => <MockWidget title="KPIs Generales (Componente)" color="bg-blue-50/50" />;
const SalesChart = ({ userId }: any) => <MockWidget title="Gráfico de Ventas (Componente)" />;
const MarketIntelligenceWidget = ({ catalogId }: any) => <MockWidget title="Radar de Mercado (Componente)" />;
const SearchStatsWidget = ({ catalogId }: any) => <MockWidget title="Stats de Búsqueda (Componente)" />;
const ResellerInsights = ({ catalogId }: any) => <MockWidget title="Insights de Revendedor (Componente)" />;
// Nuevos Widgets VIP Mocks
const DeadStockAnalysis = () => <MockWidget title="Dead Stock Analysis (Componente Real)" color="bg-amber-50/50" />;
const DemandForecastWidget = ({ catalogId }: any) => (
  <MockWidget title="Demand Forecast (Componente Real)" color="bg-purple-50/50" />
);

// ============================================================================
// 🚀 COMPONENTE PRINCIPAL (ESTE ES EL CÓDIGO REAL)
// ============================================================================

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();
  const [catalogId, setCatalogId] = useState<string | null>(null);

  // Efecto de carga de datos
  useEffect(() => {
    const fetchCatalog = async () => {
      if (!user) return;
      try {
        // Lógica real de Supabase (usando el mock en la preview)
        let { data } = await supabase
          .from() // Mocked
          .select()
          .eq()
          .limit()
          .maybeSingle();

        // En producción esto busca el catálogo real
        if (data) setCatalogId(data.id);
      } catch (error) {
        console.error("Error fetching catalog:", error);
      }
    };
    fetchCatalog();
  }, [user]);

  if (isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
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
  // VISTA 1: REVENDEDOR (L2) - ENFOQUE: VENTAS Y ACTIVACIÓN
  // ========================================================
  if (userRole === "L2") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
      >
        {/* Header Simple */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 mb-2 hover:bg-indigo-100">
              Modo Revendedor
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tu Negocio Digital</h1>
            <p className="text-slate-500">Gestiona tus ventas y tu catálogo replicado.</p>
          </div>
          {catalogId && (
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2 w-full md:w-auto">
              <Share2 className="w-4 h-4" /> Compartir mi Tienda
            </Button>
          )}
        </div>

        {/* Estado del Catálogo (Banner Prominente) */}
        <motion.div variants={itemVariants}>
          <Card
            className={`border-l-4 ${catalogId ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-amber-500 bg-amber-50/30"} shadow-sm`}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${catalogId ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                >
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {catalogId ? "Tienda Activa y Operando" : "Tienda Inactiva"}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {catalogId
                      ? "Tus clientes pueden ver tu catálogo y cotizarte ahora mismo."
                      : "Necesitas aceptar una invitación de tu proveedor para activar tu catálogo."}
                  </p>
                </div>
              </div>
              {!catalogId && (
                <Button variant="outline" className="hidden md:flex">
                  Ver Invitaciones
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* KPI Section */}
        <motion.div variants={itemVariants}>
          <DashboardKPIs userId={user.id} />
        </motion.div>

        {/* Main Chart */}
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

          {/* Quick Actions / Insights simplificados */}
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
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2">Tu proveedor agregó 5 productos nuevos hoy.</p>
                <Button variant="link" className="text-indigo-400 p-0 h-auto text-xs">
                  Ver Novedades
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Table */}
        <motion.div variants={itemVariants}>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Últimos Movimientos</h3>
          <ResellerInsights catalogId={catalogId} resellerId={user.id} />
        </motion.div>
      </motion.div>
    );
  }

  // ========================================================
  // VISTA 2: FABRICANTE (L1) - ENFOQUE: ESTRATEGIA Y RED
  // ========================================================
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Premium */}
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
        {/* Custom Tabs Style */}
        <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm inline-flex w-full md:w-auto overflow-x-auto">
          {/* TAB: RESUMEN */}
          <TabsTrigger
            value="resumen"
            className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-6 py-2.5 rounded-lg transition-all"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Resumen General
          </TabsTrigger>

          {/* TAB: INTELIGENCIA */}
          <TabsTrigger
            value="inteligencia"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 text-slate-500 px-6 py-2.5 rounded-lg transition-all"
          >
            <Users className="w-4 h-4 mr-2" /> Inteligencia de Red
          </TabsTrigger>

          {/* TAB: ESTRATEGIA (NUEVA VIP) */}
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
            {/* Chart Principal */}
            <Card className="lg:col-span-2 shadow-md border-slate-200">
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Consolidado de ventas directas y a través de red.</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart userId={user.id} />
              </CardContent>
            </Card>

            {/* Tarjeta de Estado de Red */}
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
                    <span className="text-indigo-600">85%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-[85%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Inventario Sincronizado</span>
                    <span className="text-emerald-600">100%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 w-full rounded-full"></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Actividad Reciente</p>
                      <p className="text-sm font-bold text-slate-900">3 nuevos catálogos replicados hoy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* --- TAB 2: INTELIGENCIA DE MERCADO (PREMIUM) --- */}
        <TabsContent value="inteligencia" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {catalogId ? (
              <>
                {/* Widget de Radar / Demanda */}
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
                    <MarketIntelligenceWidget catalogId={catalogId} />
                  </CardContent>
                </Card>

                {/* Widget de Búsquedas */}
                <Card className="shadow-lg border-slate-200 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      <Search className="w-5 h-5 text-slate-600" /> Términos de Búsqueda (L3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SearchStatsWidget catalogId={catalogId} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="col-span-2 p-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                  <BarChart3 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Esperando Datos</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                  Necesitas tener un catálogo activo y tráfico en tu red para ver la inteligencia de mercado.
                </p>
                <Button variant="outline" className="mt-6">
                  Configurar Catálogo
                </Button>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* --- TAB 3: VISIÓN ESTRATÉGICA (VIP / ENTERPRISE) --- */}
        <TabsContent value="estrategia" className="space-y-8 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="space-y-8">
            {/* SECCIÓN 1: FUTURO (Pronóstico) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Predicción de Demanda
                </h3>
                {catalogId && (
                  <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                    Próximos 7 días
                  </Badge>
                )}
              </div>
              <DemandForecastWidget catalogId={catalogId} />
            </div>

            {/* SECCIÓN 2: PRESENTE (Optimización de Stock) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Auditoría de Capital</h3>
              </div>
              <DeadStockAnalysis />
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
            <ResellerInsights catalogId={catalogId} resellerId={user.id} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
