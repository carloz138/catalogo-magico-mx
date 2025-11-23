import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Radar, Clock, User, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SearchLog {
  term: string;
  count: number;
  last_search: string;
}

interface RadarRequest {
  product_name: string;
  customer_name: string;
  created_at: string;
}

// 1. CORRECCIÓN DE INTERFAZ: Adaptada para recibir lo que manda MainDashboard
interface ResellerInsightsProps {
  userId: string; // Requerido por MainDashboard
  resellerId?: string; // Opcional (usaremos userId si falta)
  catalogId?: string | null; // Opcional
}

export function ResellerInsights({ userId, resellerId, catalogId }: ResellerInsightsProps) {
  const [searches, setSearches] = useState<SearchLog[]>([]);
  const [requests, setRequests] = useState<RadarRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Determinamos el ID efectivo del revendedor
  const effectiveResellerId = resellerId || userId;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ---------------------------------------------------------
        // 1. Cargar Búsquedas
        // ---------------------------------------------------------
        // Intentamos usar la tabla estándar primero si no hay RPC, o adaptamos la lógica
        let searchDataRaw: any[] | null = null;

        if (catalogId) {
          // Intento A: Si tienes la función RPC
          const { data, error } = await supabase.rpc("fn_get_reseller_search_logs" as any, {
            p_catalog_id: catalogId,
          });
          if (!error) searchDataRaw = data as any;
        }

        // Intento B: Si falló lo anterior o no hay catalogId, buscamos directo en tabla por USER_ID
        if (!searchDataRaw && userId) {
          const { data } = await supabase
            .from("search_logs")
            .select("search_term, results_count, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

          if (data) {
            // Mapeamos al formato que espera tu interfaz
            searchDataRaw = data.map((d) => ({
              term: d.search_term,
              count: 1, // Simplificación si no viene agrupado
              last_search: d.created_at,
            }));
          }
        }

        if (searchDataRaw) setSearches(searchDataRaw);

        // ---------------------------------------------------------
        // 2. Cargar Solicitudes de Radar
        // ---------------------------------------------------------
        let radarDataRaw: any[] | null = null;

        // Intento A: RPC
        const { data: rpcRadar, error: rpcError } = await supabase.rpc("fn_get_reseller_radar_requests" as any, {
          p_reseller_id: effectiveResellerId,
        });

        if (!rpcError && rpcRadar) {
          radarDataRaw = rpcRadar as any;
        } else {
          // Intento B: Tabla directa (Fallback seguro)
          const { data: tableRadar } = await supabase
            .from("solicitudes_mercado")
            .select("producto_nombre, cliente_final_nombre, creado_el")
            .eq("revendedor_id", effectiveResellerId)
            .order("creado_el", { ascending: false })
            .limit(10);

          if (tableRadar) {
            radarDataRaw = tableRadar.map((r) => ({
              product_name: r.producto_nombre,
              customer_name: r.cliente_final_nombre || "Anónimo",
              created_at: r.creado_el,
            }));
          }
        }

        if (radarDataRaw) setRequests(radarDataRaw);
      } catch (error) {
        console.error("Error fetching reseller insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [catalogId, effectiveResellerId, userId]);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🔍 Actividad de tus Clientes
        </CardTitle>
        <CardDescription>Descubre qué buscan y qué necesitan tus clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="searches" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="searches" className="flex items-center gap-2">
              <Search className="w-4 h-4" /> Lo que Buscan
            </TabsTrigger>
            <TabsTrigger value="radar" className="flex items-center gap-2">
              <Radar className="w-4 h-4" /> Lo que Piden
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: BÚSQUEDAS */}
          <TabsContent value="searches" className="space-y-4">
            {searches.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <p>Aún no hay búsquedas registradas.</p>
                <p className="text-xs mt-1">Comparte tu catálogo para generar datos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searches.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 capitalize">{item.term}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.last_search), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                      {item.count} {item.count === 1 ? "vez" : "veces"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PESTAÑA 2: RADAR */}
          <TabsContent value="radar" className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <p>Nadie ha usado el Radar aún.</p>
                <p className="text-xs mt-1">Tus clientes lo usarán cuando no encuentren algo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 capitalize">{item.product_name}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> {item.customer_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
