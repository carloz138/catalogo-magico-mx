import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, AlertCircle, Search, BrainCircuit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- HELPERS (Lógica Difusa) ---
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const levenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }

  return matrix[b.length][a.length];
};

// --- INTERFACES ---
interface SearchTermGroup {
  mainTerm: string;
  totalCount: number;
  zeroResultsCount: number;
  variations: string[];
}

interface SearchStatsProps {
  userId: string;
}

export const SearchStatsWidget = ({ userId }: SearchStatsProps) => {
  const { isAllowed: isProSmart } = useFeatureAccess("recomendaciones"); // Feature Flag secundario
  const { isAllowed: hasAccess, loading: loadingPlan, UpsellComponent } = useFeatureAccess("radar_inteligente");

  const [terms, setTerms] = useState<SearchTermGroup[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    // Dependemos de userId que viene del Dashboard
    if (hasAccess && userId && !loadingPlan) {
      fetchSearchLogs();
    }
  }, [hasAccess, userId, loadingPlan]);

  const fetchSearchLogs = async () => {
    if (!userId) return;
    setLoadingData(true);
    try {
      // CONSULTA GLOBAL POR USUARIO
      const { data, error } = await supabase
        .from("search_logs")
        .select("search_term, results_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(300); // Muestra amplia para mejor agrupación

      if (error) throw error;
      if (data) processLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const processLogs = (logs: any[]) => {
    const groups: SearchTermGroup[] = [];

    logs.forEach((log) => {
      const term = normalizeText(log.search_term || "");
      if (!term) return;

      // Buscar grupo existente (Exacto o Fuzzy)
      let existingGroup = groups.find((g) => g.mainTerm === term);

      // Si no hay exacto, buscar similar (Fuzzy)
      if (!existingGroup) {
        existingGroup = groups.find((g) => {
          const dist = levenshteinDistance(g.mainTerm, term);
          // Tolerancia: 1 error por cada 4 caracteres
          const tolerance = Math.max(1, Math.floor(g.mainTerm.length / 4));
          return dist <= tolerance;
        });
      }

      if (existingGroup) {
        existingGroup.totalCount++;
        if (log.results_count === 0) existingGroup.zeroResultsCount++;
        if (!existingGroup.variations.includes(log.search_term)) {
          existingGroup.variations.push(log.search_term);
        }
      } else {
        groups.push({
          mainTerm: term,
          totalCount: 1,
          zeroResultsCount: log.results_count === 0 ? 1 : 0,
          variations: [log.search_term],
        });
      }
    });

    // Ordenar: Más buscados primero
    const sorted = groups.sort((a, b) => b.totalCount - a.totalCount).slice(0, 15);
    setTerms(sorted);
  };

  // --- RENDERS ---
  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!hasAccess) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;

  if (loadingData) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full bg-white">
      {terms.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
          <Search className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">Sin datos suficientes</p>
          <p className="text-xs mt-1">Cuando tus clientes busquen productos, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {terms.map((group, i) => {
            const isCritical = group.zeroResultsCount > 0 && group.zeroResultsCount > group.totalCount * 0.5;

            return (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 capitalize">
                      {group.variations[0]}{" "}
                      {/* Usamos la primera variación real para mostrar (más bonito que el normalizado) */}
                    </span>
                    {isProSmart && group.variations.length > 1 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <BrainCircuit className="w-3 h-3 text-purple-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Agrupado por IA: {group.variations.join(", ")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                    {group.totalCount} búsquedas
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-2">
                  {/* Barra de Progreso Visual */}
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-4 max-w-[60%]">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, (group.totalCount / terms[0].totalCount) * 100)}%` }}
                    />
                  </div>

                  {/* Indicador de Oportunidad Perdida */}
                  {group.zeroResultsCount > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {group.zeroResultsCount} fallidos
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      Conversión alta
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
};
