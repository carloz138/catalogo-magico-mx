import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Contextos
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

// Componentes Hijos
import { DashboardKPIs, SalesChart } from "@/components/dashboard/DashboardCharts";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { SearchStatsWidget } from "@/components/dashboard/SearchStatsWidget";
import { DeadStockAnalysis } from "@/components/dashboard/analytics/DeadStockAnalysis";
import { DemandForecastWidget } from "@/components/dashboard/analytics/DemandForecastWidget";
import { AffiliateStats } from "@/components/dashboard/AffiliateStats";

// Iconos
import {
  BarChart3,
  ShoppingBag,
  Users,
  Zap,
  Share2,
  TrendingUp,
  Search,
  BrainCircuit,
  Loader2,
  Truck,
  MessageSquare,
  DollarSign,
  Package,
  Gift,
} from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const { isL1, isL2, isLoadingRole, refreshRole } = useUserRole();
  const { paqueteUsuario, hasAccess } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("resumen");
  const [hasActiveCatalog, setHasActiveCatalog] = useState(false);
  const [isProcessingPending, setIsProcessingPending] = useState(false);

  // Estado de Métricas
  const [metrics, setMetrics] = useState({
    activeResellersCount: 0,
    totalProductsCount: 0,
    recentQuotesCount: 0,
    pendingNegotiationCount: 0,
    ordersToDispatchCount: 0,
    newProviderProducts: 0,
    missedSearchTerm: null as string | null,
    missedSearchCount: 0,
    marketOpportunities: 0,
  });

  // --- LOGICA DE REPLICACIÓN AUTOMÁTICA AL ENTRAR ---
  useEffect(() => {
    const checkPendingReplication = async () => {
      const pendingCatalogId = localStorage.getItem("pending_replication_catalog_id");

      if (pendingCatalogId && user) {
        console.log("⚡ Detectada replicación pendiente:", pendingCatalogId);
        setIsProcessingPending(true);

        try {
          const { data, error } = await supabase.rpc("clone_catalog_direct", {
            p_original_catalog_id: pendingCatalogId,
          });

          if (error) throw error;

          localStorage.removeItem("pending_replication_catalog_id");
          await refreshRole();

          toast({
            title: "¡Catálogo listo!",
            description: "Te hemos redirigido para que configures tus precios.",
          });

          const result = data as any;
          if (result && result.catalog_id) {
            navigate(`/reseller/edit-prices?catalog_id=${result.catalog_id}`);
          }
        } catch (error: any) {
          console.error("Error en replicación automática:", error);
          toast({
            title: "Error al clonar",
            description: "No pudimos procesar tu solicitud pendiente.",
            variant: "destructive",
          });
          localStorage.removeItem("pending_replication_catalog_id");
        } finally {
          setIsProcessingPending(false);
        }
      }
    };

    checkPendingReplication();
  }, [user, navigate, refreshRole]);

  // 1. Verificar catálogo activo
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

  // 2. Cargar RPC
  useEffect(() => {
    const loadMetrics = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.rpc("get_dashboard_stats", { p_user_id: user.id });
        if (error) throw error;
        if (data) {
          setMetrics((prev) => ({ ...prev, ...(data as any) }));
        }
      } catch (e) {
        console.error("Error loading stats:", e);
      }
    };
    loadMetrics();
  }, [user]);

  if (isProcessingPending) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Preparando tu catálogo...</h2>
          <p className="text-slate-500">Estamos configurando tu espacio de ventas automáticamente.</p>
        </div>
      </div>
    );
  }

  if (isLoadingRole || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  const planName = paqueteUsuario?.name || "Plan Gratuito";
  const planBadgeColor =
    paqueteUsuario?.analytics_level === "pro" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700";

  // Si no tiene plan activo (paqueteUsuario es null o es free_l2 sin suscripción real para L1)
  const hasNoActivePlan = !paqueteUsuario || (paqueteUsuario as any).id === "free_l2";
  const isL1WithoutPlan = isL1 && !paqueteUsuario;

  // Mostrar banner de activación si es L1 sin plan
  if (isL1WithoutPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-8 max-w-2xl mx-auto"
      >
        <Card className="border-amber-200 bg-amber-50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-900">¡Activa tu Plan!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-amber-700">
              Aún no tienes un plan activo. Para comenzar a subir productos y crear catálogos, 
              necesitas activar una suscripción.
            </p>
            <Button 
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
              onClick={() => navigate("/checkout")}
            >
              <Zap className="w-4 h-4 mr-2" /> Ver Planes y Activar
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className={`${isL2 ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-700"} border-0 mb-2`}>
            {isL2 ? "Panel de Revendedor" : "Panel de Fabricante"}
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Comando</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            Bienvenido, <span className="font-semibold text-slate-700">{user.email?.split("@")[0]}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planBadgeColor}`}>{planName}</span>
          </p>
        </div>

        {hasActiveCatalog && (
          <div className="flex gap-2">
            {isL2 && (
              <Button
                variant="outline"
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={() => navigate("/reseller/edit-prices")}
              >
                <DollarSign className="w-4 h-4 mr-2" /> Precios
              </Button>
            )}
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2"
              onClick={() => navigate("/catalogs")}
            >
              <Share2 className="w-4 h-4" /> {isL2 ? "Compartir mi Tienda" : "Invitar Revendedor"}
            </Button>
          </div>
        )}
      </div>

      {/* --- TARJETAS DE ACCIÓN INTELIGENTE (Accesibles a todos para incentivar uso) --- */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. NEGOCIACIÓN / LOGÍSTICA */}
        {metrics.ordersToDispatchCount > 0 ? (
          <Card className="bg-emerald-50 border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Truck className="w-16 h-16 text-emerald-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                <Truck className="w-5 h-5" /> Envíos Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700 text-sm mb-3">
                Tienes <span className="font-bold text-2xl mx-1">{metrics.ordersToDispatchCount}</span> pedidos pagados
                listos para despachar.
              </p>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => navigate("/orders")}
              >
                Ir a Envíos
              </Button>
            </CardContent>
          </Card>
        ) : metrics.pendingNegotiationCount > 0 ? (
          <Card className="bg-blue-50 border-blue-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <MessageSquare className="w-16 h-16 text-blue-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Cotizaciones Nuevas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm mb-3">
                Tienes <span className="font-bold text-2xl mx-1">{metrics.pendingNegotiationCount}</span> clientes
                esperando precio y fecha.
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate("/quotes")}
              >
                Negociar Ahora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-slate-100 shadow-sm opacity-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-500 text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">
                Tu bandeja está al día.{" "}
                <span
                  className="block mt-1 text-indigo-500 font-medium cursor-pointer"
                  onClick={() => navigate("/catalogs")}
                >
                  ¡Comparte tu catálogo para vender más!
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* 2. RADAR DE OPORTUNIDADES (SOLO SI TIENE PERMISO) */}
        {isL1 &&
          hasAccess("radar_inteligente") &&
          (metrics.marketOpportunities > 0 ? (
            <Card className="bg-indigo-50 border-indigo-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Users className="w-16 h-16 text-indigo-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-800 text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Radar de Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-indigo-700 text-sm mb-3">
                  <span className="font-bold text-2xl mx-1">{metrics.marketOpportunities}</span> solicitudes de
                  productos que no tienes.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  onClick={() => setActiveTab("inteligencia")}
                >
                  Ver Oportunidades
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-slate-100 shadow-sm opacity-80">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-500 text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Radar L1
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm">El radar está escaneando búsquedas...</p>
              </CardContent>
            </Card>
          ))}

        {/* 2.5 TARJETA DE ACCIÓN L2 (Si es revendedor) */}
        {isL2 && (
          <Card className="bg-violet-50 border-violet-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <DollarSign className="w-16 h-16 text-violet-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-800 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Margen de Ganancia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-violet-700 text-sm mb-3">Ajusta tus precios para aumentar tu rentabilidad.</p>
              <Button
                size="sm"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => navigate("/reseller/edit-prices")}
              >
                Gestionar Precios
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 3. DEMANDA PERDIDA (SOLO SI TIENE PERMISO) */}
        {isL1 && hasAccess("radar_inteligente") && metrics.missedSearchCount > 2 && (
          <Card className="bg-orange-50 border-orange-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Search className="w-16 h-16 text-orange-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Alta Demanda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 text-sm mb-3">
                Buscan <strong>"{metrics.missedSearchTerm}"</strong> ({metrics.missedSearchCount} veces) y no está.
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0"
                onClick={() => navigate("/products/new")}
              >
                Crear Producto
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* --- TABS --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl shadow-sm inline-flex w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="resumen" className="px-6 py-2.5">
            <BarChart3 className="w-4 h-4 mr-2" /> Resumen
          </TabsTrigger>

          <TabsTrigger value="afiliados" className="px-6 py-2.5">
            <Gift className="w-4 h-4 mr-2 text-purple-600" /> Gana Dinero
          </TabsTrigger>

          {isL1 && hasAccess("radar_inteligente") && (
            <TabsTrigger value="inteligencia" className="px-6 py-2.5">
              <Users className="w-4 h-4 mr-2" /> Inteligencia
              {metrics.marketOpportunities > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {metrics.marketOpportunities}
                </span>
              )}
            </TabsTrigger>
          )}

          {isL1 && hasAccess("predictivo") && (
            <TabsTrigger value="estrategia" className="px-6 py-2.5">
              <BrainCircuit className="w-4 h-4 mr-2" /> Estrategia
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="resumen" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants}>
            <DashboardKPIs userId={user.id} />
          </motion.div>
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md border-slate-200">
              <CardHeader>
                <CardTitle>Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart userId={user.id} />
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-slate-500 font-bold">
                  {isL2 ? "Novedades" : "Salud de Red"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isL2 ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{metrics.newProviderProducts}</p>
                    <p className="text-xs text-slate-500">Productos Nuevos del Proveedor</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 text-blue-600"
                      onClick={() => navigate("/catalogs")}
                    >
                      Ver Catálogo Base
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>Revendedores</span>
                      <span className="text-indigo-600 font-bold">{metrics.activeResellersCount}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span>Productos</span>
                      <span className="text-emerald-600 font-bold">{metrics.totalProductsCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="afiliados" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={itemVariants}>
            <AffiliateStats />
          </motion.div>
        </TabsContent>

        {isL1 && hasAccess("radar_inteligente") && (
          <TabsContent value="inteligencia" className="space-y-6 focus-visible:outline-none">
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1 lg:col-span-2 shadow-lg border-indigo-100">
                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                  <CardTitle className="text-indigo-900 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Radar de Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <MarketIntelligenceWidget userId={user.id} />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-2 shadow-lg border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5" /> Búsquedas Fallidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SearchStatsWidget userId={user.id} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {isL1 && hasAccess("predictivo") && (
          <TabsContent value="estrategia" className="space-y-8 focus-visible:outline-none">
            <motion.div variants={itemVariants} className="space-y-8">
              <DemandForecastWidget userId={user.id} />
              <DeadStockAnalysis userId={user.id} />
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
