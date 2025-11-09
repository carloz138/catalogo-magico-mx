import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConsolidatedOrders } from "@/hooks/useConsolidatedOrders";
import { ConsolidatedOrderCard } from "@/components/consolidated/ConsolidatedOrderCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { ConsolidatedOrderStatus } from "@/types/consolidated-order";

export default function ConsolidatedOrdersListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConsolidatedOrderStatus | "all">("all");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { orders, loading, syncDraft } = useConsolidatedOrders({
    status: activeTab === "all" ? undefined : activeTab,
    autoLoad: true,
  });

  const handleSync = async (orderId: string) => {
    setSyncingId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      await syncDraft(orderId, order.original_catalog_id);
    }
    setSyncingId(null);
  };

  const handleOrderClick = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      navigate(`/reseller/consolidate/${order.supplier_id}?order_id=${orderId}`);
    }
  };

  const getTabCounts = () => {
    return {
      all: orders.length,
      draft: orders.filter((o) => o.status === "draft").length,
      sent: orders.filter((o) => o.status === "sent").length,
      accepted: orders.filter((o) => o.status === "accepted").length,
      rejected: orders.filter((o) => o.status === "rejected").length,
    };
  };

  const counts = getTabCounts();

  // Ordenar por número de productos (descendente)
  const sortedOrders = [...orders].sort((a, b) => b.items_count - a.items_count);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard/reseller")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Pedidos Consolidados</h1>
              <p className="text-gray-600">
                Gestiona tus pedidos agrupados por proveedor
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">Borradores ({counts.draft})</TabsTrigger>
            <TabsTrigger value="sent">Enviados ({counts.sent})</TabsTrigger>
            <TabsTrigger value="accepted">Aceptados ({counts.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados ({counts.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {sortedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No hay pedidos consolidados
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Los pedidos consolidados aparecerán aquí cuando aceptes cotizaciones
                    de tus proveedores
                  </p>
                  <Button onClick={() => navigate("/quotes")}>
                    Ver Cotizaciones
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedOrders.map((order) => (
                  <ConsolidatedOrderCard
                    key={order.id}
                    order={order}
                    onSync={handleSync}
                    onClick={handleOrderClick}
                    syncing={syncingId === order.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
