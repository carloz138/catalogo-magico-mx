import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { SearchStatsWidget } from "@/components/dashboard/SearchStatsWidget";
import { ResellerInsights } from "@/components/dashboard/ResellerInsights";
// 👇 IMPORTAMOS LOS NUEVOS GRÁFICOS
import { DashboardKPIs, SalesChart } from "@/components/dashboard/DashboardCharts";
import { BarChart3, ShoppingBag, Users, Zap } from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();

  const [catalogId, setCatalogId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!user) return;
      try {
        // Lógica híbrida para encontrar catálogo L1 o L2
        let { data, error } = await supabase
          .from("digital_catalogs")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!data) {
          const { data: replicaData } = await supabase
            .from("replicated_catalogs")
            .select("id") // Nota: Esto debería ser el ID de la réplica para propósitos de UI
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
    return <div className="p-8 text-center">Cargando tu panel...</div>;
  }

  // --- VISTA 1: SOLO REVENDEDOR (L2) ---
  if (userRole === "L2") {
    return (
      <div className="p-6 space-y-6 container mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Revendedor</h1>
          <p className="text-gray-500">Bienvenido a tu negocio digital. Aquí tienes el pulso de tus ventas.</p>
        </div>

        {/* 1. KPIs Reales */}
        <DashboardKPIs userId={user.id} />

        {/* 2. Gráfica de Ventas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Rendimiento de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart userId={user.id} />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <Zap className="h-4 w-4" /> Estado del Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-700 mb-2">
                {catalogId ? "Activo y Vendiendo ✅" : "Inactivo ⚠️"}
              </div>
              {!catalogId ? (
                <p className="text-sm text-muted-foreground">
                  Solicita una cotización a tu proveedor para activar tu tienda hoy mismo.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tu tienda está visible. ¡Comparte el link para vender más!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 3. Inteligencia Básica (Raw Data) */}
        <div className="mt-8">
          <ResellerInsights catalogId={catalogId} resellerId={user.id} />
        </div>
      </div>
    );
  }

  // --- VISTA 2: FABRICANTE (L1) O HÍBRIDO (BOTH) ---
  return (
    <div className="p-6 space-y-8 container mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Hola, {paqueteUsuario?.name ? "Socio " + paqueteUsuario.name.split(" ")[1] : "Bienvenido"}
          </h1>
          <p className="text-gray-500">Resumen de rendimiento de tu red de distribución.</p>
        </div>
      </div>

      <Tabs defaultValue="resumen" className="w-full space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="resumen" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4 mr-2" /> Resumen General
          </TabsTrigger>
          <TabsTrigger value="inteligencia" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" /> Inteligencia de Mercado ✨
          </TabsTrigger>
          {userRole === "BOTH" && (
            <TabsTrigger value="mis_ventas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Mis Ventas (L2)
            </TabsTrigger>
          )}
        </TabsList>

        {/* PESTAÑA 1: RESUMEN */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPIs Globales */}
          <DashboardKPIs userId={user.id} />

          {/* Gráfica Principal */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 2: INTELIGENCIA */}
        <TabsContent value="inteligencia" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {catalogId ? (
              <>
                <MarketIntelligenceWidget catalogId={catalogId} />
                <SearchStatsWidget catalogId={catalogId} />
              </>
            ) : (
              <div className="col-span-2 p-12 text-center border rounded-lg bg-gray-50 text-gray-500">
                Cargando datos de inteligencia...
              </div>
            )}
          </div>
        </TabsContent>

        {userRole === "BOTH" && (
          <TabsContent value="mis_ventas">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Tus Estadísticas Personales (Como Revendedor)</h3>
              <DashboardKPIs userId={user.id} />
              <ResellerInsights catalogId={catalogId} resellerId={user.id} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
