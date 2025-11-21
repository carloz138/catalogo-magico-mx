import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, TrendingUp, AlertCircle } from "lucide-react";

// Interfaz de la tabla cruda
interface SearchLog {
  id: string;
  search_term: string;
  results_count: number;
  created_at: string;
}

// Interfaz del dato procesado para mostrar
interface AggregatedTerm {
  term: string;
  count: number;
  zeroResultsCount: number; // Cuántas veces dio 0 resultados
  lastSearched: Date;
}

interface SearchStatsProps {
  catalogId: string | null;
}

export const SearchStatsWidget = ({ catalogId }: SearchStatsProps) => {
  // 1. GATING: Usamos el mismo permiso que el Radar (Básico IA)
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("radar_inteligente");
  
  const [terms, setTerms] = useState<AggregatedTerm[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [totalSearches, setTotalSearches] = useState(0);

  useEffect(() => {
    if (isAllowed && catalogId && !loadingPlan) {
      fetchSearchLogs();
    }
  }, [isAllowed, catalogId, loadingPlan]);

  const fetchSearchLogs = async () => {
    if (!catalogId) return;
    setLoadingData(true);

    try {
      // Traemos los últimos 200 logs para analizar tendencias recientes
      const { data, error } = await supabase
        .from("search_logs")
        .select("*")
        .eq("catalog_id", catalogId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      if (data) {
        processLogs(data);
      }
    } catch (error) {
      console.error("Error fetching search logs:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // 🧠 CEREBRO: Agrupa los logs crudos en estadísticas
  const processLogs = (logs: SearchLog[]) => {
    setTotalSearches(logs.length);
    const map = new Map<string, AggregatedTerm>();

    logs.forEach((log) => {
      // Normalizamos: "Jaula" y "jaula " son lo mismo
      const cleanTerm = log.search_term.trim().toLowerCase(); 
      
      // Omitimos búsquedas muy cortas o vacías
      if (cleanTerm.length < 2) return;

      if (!map.has(cleanTerm)) {
        map.set(cleanTerm, {
          term: cleanTerm, // Guardamos en minúscula para agrupar
          count: 0,
          zeroResultsCount: 0,
          lastSearched: new Date(log.created_at),
        });
      }

      const item = map.get(cleanTerm)!;
      item.count += 1;
      if (log.results_count === 0) {
        item.zeroResultsCount += 1;
      }
      // Mantenemos la fecha más reciente
      const logDate = new Date(log.created_at);
      if (logDate > item.lastSearched) {
        item.lastSearched = logDate;
      }
    });

    // Convertimos el mapa a array y ordenamos por popularidad
    const sortedTerms = Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20

    // Capitalizamos la primera letra para mostrar bonito (jaula -> Jaula)
    const displayTerms = sortedTerms.map(t => ({
      ...t,
      term: t.term.charAt(0).toUpperCase() + t.term.slice(1)
    }));

    setTerms(displayTerms);
  };

  // --- RENDER ---

  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!isAllowed) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;

  if (loadingData) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Analizando tendencias...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full bg-white p-0">
      <div className="p-4 space-y-5">
        
        {/* 1. NUBE DE PALABRAS (Resumen Visual) */}
        <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Lo más buscado ({totalSearches})
            </h4>
            {terms.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No hay suficientes datos de búsqueda aún.</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {terms.slice(0, 8).map((item, idx) => (
                        <Badge 
                            key={idx}
                            variant="secondary"
                            className={`
                                cursor-default transition-all hover:scale-105 px-3 py-1
                                ${idx === 0 ? 'bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-200' : ''}
                                ${idx === 1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : ''}
                                ${idx > 1 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : ''}
                            `}
                        >
                            {item.term}
                        </Badge>
                    ))}
                </div>
            )}
        </div>

        {/* 2. LISTA DETALLADA (Con Alertas de Oportunidad) */}
        <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2 mt-4">
                <Search className="w-3 h-3" /> Detalle de Intención
            </h4>
            
            <div className="divide-y divide-slate-50">
                {terms.map((item, idx) => {
                    // Calculamos si es una "Oportunidad Perdida" (Más del 50% de las veces da 0 resultados)
                    const isMissedOpportunity = (item.zeroResultsCount / item.count) > 0.5;

                    return (
                        <div key={idx} className="flex items-center justify-between text-sm group hover:bg-slate-50 p-2 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-700 font-medium">{item.term}</span>
                                {isMissedOpportunity && (
                                    <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                                        <AlertCircle className="w-3 h-3" /> Sin Stock
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400 font-mono bg-slate-100 px-1.5 rounded">
                                    {item.count}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </ScrollArea>
  );
};
