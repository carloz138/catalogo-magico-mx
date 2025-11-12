import { useEffect, useState } from "react";
import { useUserRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketIntelligenceWidget } from "@/components/dashboard/MarketIntelligenceWidget";
// Importa tus otros widgets existentes (Graficas, Tablas, etc.)
// import { SalesChart } from ...
// import { RecentQuotesTable } from ...

export default function MainDashboard() {
  const { userRole, isLoadingRole } = useUserRole();
  const { paqueteUsuario } = useSubscription();
  const [activeTab, setActiveTab] = useState("resumen");

  // Supongamos que obtienes el ID del catálogo principal del usuario aquí
  // const catalogId = useCatalogId(); // (O como lo obtengas actualmente)
  const catalogId = "ID_TEMPORAL_O_DEL_CONTEXTO";

  if (isLoadingRole) return <div>Cargando dashboard...</div>;

  // --- VISTA 1: SOLO REVENDEDOR (L2) ---
  if (userRole === "L2") {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Panel de Revendedor</h1>
        {/* KPIs simples de ventas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* <MetricCard title="Mis Ventas" ... /> */}
          {/* <MetricCard title="Ganancia Estimada" ... /> */}
        </div>
        {/* Tabla de cotizaciones */}
        {/* <RecentQuotesTable role="L2" /> */}
      </div>
    );
  }

  // --- VISTA 2: FABRICANTE (L1) O HÍBRIDO (BOTH) ---
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, {paqueteUsuario?.name ? "Socio " + paqueteUsuario.name : "Bienvenido"}
        </h1>
        {/* Aquí podrías poner un badge con su plan actual */}
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList>
          <TabsTrigger value="resumen">Resumen General</TabsTrigger>
          <TabsTrigger value="inteligencia">Inteligencia de Mercado ✨</TabsTrigger>
          {userRole === "BOTH" && <TabsTrigger value="mis_ventas">Mis Ventas (L2)</TabsTrigger>}
        </TabsList>

        <TabsContent value="resumen" className="space-y-6 mt-6">
          {/* Aquí van tus gráficas actuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* <SalesChart /> */}
            {/* <TopProductsChart /> */}
          </div>
        </TabsContent>

        <TabsContent value="inteligencia" className="space-y-6 mt-6">
          {/* 👇 AQUÍ VA LA NUEVA ANALÍTICA DE IA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketIntelligenceWidget catalogId={catalogId} />
            {/* Aquí podrías poner otra tarjeta como "Términos sin resultados" (Plan Pro) */}
          </div>
        </TabsContent>

        {userRole === "BOTH" && (
          <TabsContent value="mis_ventas">
            {/* Vista simplificada de L2 */}
            <p>Aquí va el dashboard de tus ventas personales.</p>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
