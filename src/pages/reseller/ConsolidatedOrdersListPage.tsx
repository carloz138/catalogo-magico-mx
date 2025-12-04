import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useConsolidatedOrders } from "@/hooks/useConsolidatedOrders";
import { ConsolidatedOrderCard } from "@/components/consolidated/ConsolidatedOrderCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import { ConsolidatedOrderStatus } from "@/types/consolidated-order";
import { useToast } from "@/hooks/use-toast";

export default function ConsolidatedOrdersListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ConsolidatedOrderStatus | "all">("all");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const { orders, loading, loadOrders, getOrCreateDraft, syncDraft } = useConsolidatedOrders({
    status: activeTab === "all" ? undefined : activeTab,
    autoLoad: false, // No cargar automáticamente, lo hacemos después de inicializar
  });

  // Inicializar borradores automáticamente al cargar
  useEffect(() => {
    if (user?.id) {
      initializeConsolidatedOrders();
    }
  }, [user?.id]);

  /**
   * Detecta catálogos replicados con cotizaciones aceptadas y crea/sincroniza borradores
   */
  const initializeConsolidatedOrders = async () => {
    if (!user?.id) return;
    
    setInitializing(true);
    try {
      // 1. Buscar todos los catálogos replicados del usuario con cotizaciones aceptadas
      const { data: replicatedCatalogs, error: rcError } = await supabase
        .from("replicated_catalogs")
        .select(`
          id,
          original_catalog_id,
          distributor_id
        `)
        .eq("reseller_id", user.id)
        .eq("is_active", true);

      if (rcError) throw rcError;

      if (!replicatedCatalogs || replicatedCatalogs.length === 0) {
        console.log("No hay catálogos replicados activos");
        await loadOrders();
        return;
      }

      // 2. Para cada catálogo replicado, verificar si tiene cotizaciones aceptadas
      for (const rc of replicatedCatalogs) {
        const { data: acceptedQuotes, error: qError } = await supabase
          .from("quotes")
          .select("id")
          .eq("replicated_catalog_id", rc.id)
          .eq("status", "accepted")
          .eq("user_id", user.id)
          .limit(1);

        if (qError) {
          console.error("Error checking quotes:", qError);
          continue;
        }

        // Si hay cotizaciones aceptadas, crear/sincronizar borrador
        if (acceptedQuotes && acceptedQuotes.length > 0) {
          console.log(`📦 Creando/sincronizando borrador para catálogo ${rc.original_catalog_id}`);
          await getOrCreateDraft(
            rc.distributor_id, // supplier_id = L1 (proveedor)
            rc.original_catalog_id,
            rc.id // replicated_catalog_id
          );
        }
      }

      // 3. Cargar la lista actualizada
      await loadOrders();
    } catch (error: any) {
      console.error("Error initializing consolidated orders:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos consolidados",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  const handleSync = async (orderId: string) => {
    setSyncingId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      await syncDraft(orderId, order.replicated_catalog_id);
      await loadOrders();
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

  if (loading || initializing) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
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
          <Button
            variant="outline"
            onClick={initializeConsolidatedOrders}
            disabled={initializing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${initializing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
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
                    Los pedidos consolidados se crean automáticamente cuando aceptas cotizaciones de clientes 
                    en tus catálogos replicados. Vuelve a las cotizaciones para aceptar pedidos.
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
