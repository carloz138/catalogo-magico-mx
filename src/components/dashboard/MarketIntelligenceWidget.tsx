import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext"; // Tu contexto
import { useFeatureAccess } from "@/hooks/useFeatureAccess"; // Tu hook de gating
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Search, Radar, ArrowUpRight, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketIntelligenceWidget({ catalogId }: { catalogId: string }) {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 1. USAMOS EL GUARDIA DE SEGURIDAD
  // Revisamos si tiene acceso al feature 'predictivo' (Plan Empresarial)
  const { isAllowed, UpsellComponent } = useFeatureAccess('predictivo'); 

  useEffect(() => {
    if (!isAllowed) {
      setLoading(false);
      return;
    }

    const fetchOpportunities = async () => {
      try {
        // Llamamos a la función SQL inteligente que creamos
        const { data, error } = await supabase.rpc('fn_get_demand_opportunities', {
          p_catalog_id: catalogId,
          p_similarity_threshold: 0.3
        });

        if (error) throw error;
        setOpportunities(data || []);
      } catch (err) {
        console.error("Error fetching intelligence:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [catalogId, isAllowed]);

  // --- ESTADO: NO TIENE PERMISO (UPSELL) ---
  if (!isAllowed) {
    return (
      <Card className="relative overflow-hidden border-purple-200 bg-purple-50/30">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/50 z-10 flex items-center justify-center p-6">
           {/* Usamos el componente que te devuelve el hook */}
           <div className="max-w-md shadow-xl">{UpsellComponent}</div>
        </div>
        {/* Fondo "Fake" para que se vea que hay datos detrás */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-400">
            <Brain className="w-5 h-5" /> Inteligencia de Mercado (IA)
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="space-y-4 opacity-30">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
           </div>
        </CardContent>
      </Card>
    );
  }

  // --- ESTADO: CARGANDO ---
  if (loading) return <Skeleton className="h-64 w-full" />;

  // --- ESTADO: TIENE PERMISO (DATA REAL) ---
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                <Brain className="w-5 h-5 text-purple-600" />
                Oportunidades de Mercado Detectadas
                </CardTitle>
                <CardDescription>
                Productos que la gente busca y pide, pero que tú no tienes.
                </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">IA Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
                <p>¡Todo cubierto! No se han detectado oportunidades perdidas recientes.</p>
            </div>
        ) : (
            <div className="space-y-4">
            {opportunities.map((op, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 capitalize">{op.term}</span>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Search className="w-3 h-3"/> {op.search_volume} búsquedas</span>
                            <span className="flex items-center gap-1 text-orange-600 font-medium"><Radar className="w-3 h-3"/> {op.radar_requests} solicitudes</span>
                        </div>
                    </div>
                    <Button size="sm" className="gap-1 bg-purple-600 hover:bg-purple-700">
                        Crear Producto <ArrowUpRight className="w-3 h-3" />
                    </Button>
                </div>
            ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
