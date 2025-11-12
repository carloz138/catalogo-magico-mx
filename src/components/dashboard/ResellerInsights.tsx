import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
import { SearchStatsWidget } from "@/components/dashboard/SearchStatsWidget";
// 👇 NUEVO IMPORT
import { ResellerInsights } from "@/components/dashboard/ResellerInsights";
import { BarChart3, ShoppingBag, Users, Zap } from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();
  
  // Estado para el catálogo principal (L1 o L2)
  const [catalogId, setCatalogId] = useState<string | null>(null);

  // Obtener el ID del catálogo del usuario actual (Funciona para L1 y L2)
  useEffect(() => {
    const fetchCatalog = async () => {
      if (!user) return;
      try {
        // 1. Buscar en Digital Catalogs (L1)
        let { data, error } = await supabase
          .from('digital_catalogs')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        
        // 2. Si no es L1, buscar en Replicated Catalogs (L2)
        if (!data) {
           const { data: replicaData } = await supabase
            .from('replicated_catalogs')
            .select('id') // Nota: necesitamos el ID de la TABLA digital_catalogs, no el ID de la replica
            // Espera, el search_log se liga al 'catalog_id' original o al replicado?
            // En PublicCatalog usamos 'catalog.id'. 
            // Si es una réplica, PublicCatalog usa el ID de la réplica?
            // Revisemos tu tabla search_logs... usa 'catalog_id' UUID references digital_catalogs.
            // Ah! Aquí hay un detalle técnico importante.
            // Si el L2 tiene una réplica, ¿los logs se guardan con el ID de la réplica o del original?
            // ... En PublicCatalog, catalog.id es el ID del registro en digital_catalogs.
            // Si es réplica, el "catálogo" visual es el de la réplica.
            // Asumiremos que guardas el ID de la réplica en search_logs si la estructura lo permite,
            // O si search_logs apunta a digital_catalogs, entonces el L2 comparte logs con L1.
            
            // CORRECCIÓN RÁPIDA: Para L2, buscaremos el ID de su réplica activa.
            .eq('reseller_id', user.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
            
            // Nota: Esto asume que 'search_logs' puede guardar IDs de réplicas.
            // Si no, solo mostraremos el Radar para L2.
            if (replicaData) {
                // Usamos el ID de la réplica
                data = replicaData; 
            }
        }
        
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
  if (userRole === 'L2') {
    return (
      <div className="p-6 space-y-6 container mx-auto">
        <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Revendedor</h1>
            <p className="text-gray-500">Bienvenido a tu negocio digital.</p>
        </div>

        {/* KPIs Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Actividad de Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">Visitas este mes</p>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900">Tu Catálogo</CardTitle>
                    <Zap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-sm font-medium text-purple-700 mb-2">
                        {catalogId ? "Activo y visible ✅" : "No activado"}
                    </div>
                    {!catalogId && (
                        <p className="text-xs text-muted-foreground">
                            Solicita una cotización para activar tu catálogo.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* 👇 AQUÍ ESTÁ EL COMPONENTE QUE LE DA VALOR AL L2 */}
        <div className="mt-8">
            {user && (
                <ResellerInsights 
                    catalogId={catalogId} 
                    resellerId={user.id} 
                />
            )}
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
                Hola, {paqueteUsuario?.name ? 'Socio ' + paqueteUsuario.name.split(' ')[1] : 'Bienvenido'}
            </h1>
            <p className="text-gray-500">Aquí está lo que está pasando en tu negocio.</p>
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
          {userRole === 'BOTH' && (
             <TabsTrigger value="mis_ventas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Mis Ventas (L2)
             </TabsTrigger>
          )}
        </TabsList>

        {/* PESTAÑA 1: RESUMEN */}
        <TabsContent value="resumen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            
            <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                Gráfica de Rendimiento (Placeholder)
            </div>
        </TabsContent>

        {/* PESTAÑA 2: INTELIGENCIA */}
        <TabsContent value="inteligencia" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Widget Enterprise */}
                {catalogId ? (
                    <MarketIntelligenceWidget catalogId={catalogId} />
                ) : (
                    <div className="p-8 text-center border rounded-lg bg-gray-50">
                        Cargando datos...
                    </div>
                )}

                {/* Widget Profesional */}
                {catalogId ? (
                    <SearchStatsWidget catalogId={catalogId} />
                ) : (
                    <div className="p-8 text-center border rounded-lg bg-gray-50">
                        Cargando datos...
                    </div>
                )}
            </div>
        </TabsContent>

        {userRole === 'BOTH' && (
            <TabsContent value="mis_ventas">
                {/* Reutilizamos el componente de Insights para la vista de revendedor del usuario BOTH */}
                {user && (
                    <ResellerInsights 
                        catalogId={catalogId} // Ojo: Aquí idealmente buscaríamos el ID de SU réplica, no su original
                        resellerId={user.id} 
                    />
                )}
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
