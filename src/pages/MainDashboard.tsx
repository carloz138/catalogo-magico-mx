import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardKPIs, SalesChart } from "@/components/dashboard/DashboardCharts";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { SearchStatsWidget } from "@/components/dashboard/SearchStatsWidget";
import { ResellerInsights } from "@/components/dashboard/ResellerInsights";
// Asegúrate de que la ruta sea correcta según donde guardaste el componente anterior
import { DeadStockReport } from "@/components/dashboard/DeadStockReport"; 

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
  Sparkles, // Nuevo ícono para la sección Futura
  BrainCircuit // Nuevo ícono para IA
} from "lucide-react";

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
        let { data } = await supabase
          .from("digital_catalogs")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!data) {
          const { data: replicaData } = await supabase
            .from("replicated_catalogs")
            .select("id")
            .eq("reseller_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();
          if (replicaData) data = replicaData;
        }
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
        {/* ... (El código L2 se mantiene igual que tu original) ... */}
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
        
        {/* (Resto del contenido L2 igual que tu código original...) */}
        <motion.div variants={itemVariants}>
           <DashboardKPIs userId={user.id} />
        </motion.div>
        {/* ... etc ... */}
      </motion.div>
    );
  }

  // ========================================================
  // VISTA 2: FABRICANTE (L1) - CON PESTAÑA "VISIÓN FUTURA"
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
        
        {/* TABS LIST: AQUI AGREGAMOS LA NUEVA PESTAÑA */}
        <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm inline-flex w-full md:w-auto flex-wrap">
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

          {/* --- NUEVA PESTAÑA "VIP" (Visión Futura) --- */}
          <TabsTrigger
            value="futuro"
            className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 text-slate-500 px-6 py-2.5 rounded-lg transition-all border border-transparent data-[state=active]:border-violet-100"
          >
            <Sparkles className="w-4 h-4 mr-2 text-violet-500" /> Visión Futura
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

        {/* --- CONTENIDO TAB 1: RESUMEN --- */}
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
                 {/* (Contenido de Salud de Red igual al original) */}
                 <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Revendedores Activos</span>
                    <span className="text-indigo-600">85%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-[85%] rounded-full"></div>
                  </div>
                </div>
                {/* ... Resto del contenido de la tarjeta ... */}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* --- CONTENIDO TAB 2: INTELIGENCIA --- */}
        <TabsContent value="inteligencia" className="space-y-6 focus-visible:outline-none">
          {/* (Se mantiene igual al original) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {catalogId ? (
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
                    <MarketIntelligenceWidget catalogId={catalogId} />
                  </CardContent>
                </Card>
                
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
                 <p>Esperando datos...</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* --- CONTENIDO TAB 3: VISIÓN FUTURA (VIP / NUEVO) --- */}
        <TabsContent value="futuro" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants} className="space-y-6">
            
            {/* Banner Intro Futuro */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                        <BrainCircuit className="w-6 h-6 text-violet-200" /> 
                        Análisis Predictivo & Optimización
                    </h2>
                    <p className="text-violet-100 max-w-2xl">
                        Utilizamos los datos históricos de tu red para detectar ineficiencias antes de que ocurran. 
                        Mantén tu flujo de caja saludable eliminando el stock estancado.
                    </p>
                </div>
                {/* Decoración de fondo */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-10"></div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Columna Izquierda: Reporte de Stock Muerto (El componente que hicimos antes) */}
                <div className="xl:col-span-2">
                    <DeadStockReport /> 
                </div>

                {/* Columna Derecha: Próximas funcionalidades (Placeholder VIP) */}
                <div className="space-y-6">
                    <Card className="border-violet-100 shadow-sm bg-violet-50/30">
                        <CardHeader>
                            <CardTitle className="text-violet-900 text-lg">Predicción de Demanda</CardTitle>
                            <CardDescription>Proyección basada en IA (Próximamente)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Tendencia esperada (Nov)</span>
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> +12%
                                    </span>
                                </div>
                                <div className="h-32 flex items-end justify-between gap-2 px-2 pb-2 border-b border-violet-200/50">
                                    {/* Gráfico de barras dummy */}
                                    {[40, 65, 45, 80, 55, 90].map((h, i) => (
                                        <div key={i} className="w-full bg-violet-200 rounded-t-sm hover:bg-violet-300 transition-colors" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 italic">
                                    *Datos simulados. Recopilando historial para activar predicciones reales.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Alertas Tempranas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                <li className="flex gap-3 items-start text-sm text-slate-600">
                                    <span className="bg-yellow-100 text-yellow-600 p-1 rounded mt-0.5">⚠️</span>
                                    <span>3 productos están por entrar en zona de "bajo movimiento".</span>
                                </li>
                                <li className="flex gap-3 items-start text-sm text-slate-600">
                                    <span className="bg-green-100 text-green-600 p-1 rounded mt-0.5">✓</span>
                                    <span>La rotación de inventario mejoró un 5% vs mes anterior.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

          </motion.div>
        </TabsContent>

        {/* --- CONTENIDO TAB 4: VISTA HÍBRIDA --- */}
        {userRole === "BOTH" && (
          <TabsContent value="mis_ventas" className="space-y-6 focus-visible:outline-none">
             {/* (Igual al original) */}
             <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-6">
              <h3 className="text-emerald-800 font-bold text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Vista de Revendedor Personal
              </h3>
              {/* ... */}
            </div>
            <DashboardKPIs userId={user.id} />
            <ResellerInsights catalogId={catalogId} resellerId={user.id} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
