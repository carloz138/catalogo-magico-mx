import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { BarChart3, ShoppingBag, Users } from "lucide-react"; // Iconos de ejemplo

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();

  // Estado para el catálogo principal del usuario
  const [catalogId, setCatalogId] = useState<string | null>(null);

  // Obtener el ID del catálogo del usuario actual
  useEffect(() => {
    const fetchCatalog = async () => {
      if (!user) return;
      try {
        // Buscamos el primer catálogo activo del usuario
        const { data } = await supabase.from("digital_catalogs").select("id").eq("user_id", user.id).limit(1).single();

        if (data) {
          setCatalogId(data.id);
        }
      } catch (error) {
        console.error("Error fetching catalog for dashboard:", error);
      }
    };
    fetchCatalog();
  }, [user]);

  if (isLoadingRole) {
    return <div className="p-8 text-center">Cargando tu panel...</div>;
  }

  // --- VISTA 1: SOLO REVENDEDOR (L2) ---
  if (userRole === "L2") {
    return (
      <div className="p-6 space-y-6 container mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Revendedor</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Ventas</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">+0% del mes pasado</p>
            </CardContent>
          </Card>
          {/* Aquí puedes agregar más KPIs para L2 */}
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
          <p className="text-gray-500">Aquí está lo que está pasando en tu negocio.</p>
        </div>
        {/* Aquí podrías poner botones de acción rápida como "Crear Producto" */}
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

        {/* PESTAÑA 1: RESUMEN (Tus gráficas actuales irían aquí) */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholders de KPIs actuales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Ventas Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,345</div>
                <p className="text-xs text-green-600 font-medium">↑ 12% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Cotizaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-gray-500">5 pendientes de revisión</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Productos Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
              </CardContent>
            </Card>
          </div>

          {/* Aquí irían tus gráficas grandes */}
          <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
            Gráfica de Rendimiento (Placeholder)
          </div>
        </TabsContent>

        {/* PESTAÑA 2: INTELIGENCIA (LO NUEVO) */}
        <TabsContent value="inteligencia" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 👇 AQUÍ ESTÁ TU WIDGET NUEVO */}
            {catalogId ? (
              <MarketIntelligenceWidget catalogId={catalogId} />
            ) : (
              <div className="p-8 text-center border rounded-lg bg-gray-50">Cargando datos de inteligencia...</div>
            )}

            {/* Espacio para futuros widgets (ej. "Términos sin resultados") */}
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
                <div className="bg-blue-50 p-3 rounded-full mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Más Insights Próximamente</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                  Estamos recopilando datos de búsquedas fallidas y tendencias de precios para ti.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {userRole === "BOTH" && (
          <TabsContent value="mis_ventas">
            <div className="p-12 text-center border rounded-lg bg-gray-50 text-gray-500">
              Aquí verás tus estadísticas como revendedor.
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
