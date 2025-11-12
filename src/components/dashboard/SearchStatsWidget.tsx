import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureAccess } from "@/hooks/useFeatureAccess"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SearchStat {
  search_term: string;
  search_count: number;
  last_searched_at: string;
}

export function SearchStatsWidget({ catalogId }: { catalogId: string }) {
  const [stats, setStats] = useState<SearchStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Usamos el mismo nivel de acceso que el Radar (Básico IA / Pro)
  const { isAllowed, UpsellComponent } = useFeatureAccess('radar_inteligente'); 

  useEffect(() => {
    if (!isAllowed) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Llamamos a la RPC de búsquedas fallidas
        const { data, error } = await supabase.rpc('fn_get_failed_searches_stats' as any, {
          p_catalog_id: catalogId,
          p_days_ago: 30
        });

        if (error) throw error;
        
        if (data) {
            setStats(data as unknown as SearchStat[]);
        }
      } catch (err) {
        console.error("Error fetching search stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [catalogId, isAllowed]);

  // --- ESTADO: NO TIENE PERMISO (UPSELL) ---
  if (!isAllowed) {
    return (
      <Card className="relative overflow-hidden border-blue-200 bg-blue-50/30 h-full">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/50 z-10 flex items-center justify-center p-6">
           <div className="max-w-md shadow-xl w-full scale-90">{UpsellComponent}</div>
        </div>
        <CardHeader className="opacity-50">
          <CardTitle className="flex items-center gap-2 text-gray-400">
            <Search className="w-5 h-5" /> Términos sin Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="opacity-30 space-y-4">
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // --- ESTADO: CARGANDO ---
  if (loading) return <Skeleton className="h-[400px] w-full" />;

  // Calculamos el máximo para las barras de progreso relativas
  const maxCount = Math.max(...stats.map(s => s.search_count), 1);

  // --- ESTADO: DATA REAL ---
  return (
    <Card className="h-full border-blue-100 shadow-sm bg-white">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Search className="w-5 h-5 text-blue-600" />
                    Búsquedas sin Resultados
                </CardTitle>
                <CardDescription>
                    Lo que tus clientes buscan y no encuentran (Últimos 30 días).
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">¡Excelente!</p>
                <p className="text-sm">Tus clientes están encontrando todo lo que buscan.</p>
            </div>
        ) : (
            <div className="space-y-5">
                {stats.map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-end text-sm">
                            <span className="font-semibold text-gray-800 capitalize">
                                "{stat.search_term}"
                            </span>
                            <span className="font-bold text-blue-600">
                                {stat.search_count} veces
                            </span>
                        </div>
                        
                        {/* Barra de progreso visual */}
                        <Progress value={(stat.search_count / maxCount) * 100} className="h-2 bg-blue-50" indicatorClassName="bg-blue-500" />
                        
                        <div className="flex justify-between items-center pt-1">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Clock className="w-3 h-3" />
                                Última vez: {formatDistanceToNow(new Date(stat.last_searched_at), { addSuffix: true, locale: es })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
