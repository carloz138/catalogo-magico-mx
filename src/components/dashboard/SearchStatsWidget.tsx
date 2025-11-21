import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, AlertCircle, Search, BrainCircuit } from "lucide-react";

// --- ALGORITMOS DE INTELIGENCIA GRATUITA ---

// 1. Normalización Básica (Para todos)
// Quita acentos y pone minúsculas. "Cámara" -> "camara"
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// 2. Algoritmo de Levenshtein (Solo para PRO)
// Mide qué tan diferentes son dos palabras.
// Costo: 0 USD (Es pura matemática en el navegador del cliente)
const levenshteinDistance = (a: string, b: string) => {
  const matrix = [];
  let i, j;

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// --- COMPONENTE ---

interface AggregatedTerm {
  term: string;
  count: number;
  zeroResultsCount: number;
  variations: string[]; // Guardamos las variaciones (ej: "jaula", "jaulas")
}

interface SearchStatsProps {
  catalogId: string | null;
}

export const SearchStatsWidget = ({ catalogId }: SearchStatsProps) => {
  // 1. Detectamos el NIVEL de inteligencia permitido
  // Si tiene 'recomendaciones' (Plan PRO), activamos Fuzzy Logic. 
  // Si solo tiene 'radar_inteligente' (Plan BASIC), usamos lógica simple.
  const { isAllowed: isProSmart } = useFeatureAccess("recomendaciones"); // Usamos una feature del plan PRO para diferenciar
  const { isAllowed: hasAccess, loading: loadingPlan, UpsellComponent } = useFeatureAccess("radar_inteligente");

  const [terms, setTerms] = useState<AggregatedTerm[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [totalSearches, setTotalSearches] = useState(0);

  useEffect(() => {
    if (hasAccess && catalogId && !loadingPlan) {
      fetchSearchLogs();
    }
  }, [hasAccess, catalogId, loadingPlan]);

  const fetchSearchLogs = async () => {
    if (!catalogId) return;
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("search_logs")
        .select("*")
        .eq("catalog_id", catalogId)
        .order("created_at", { ascending: false })
        .limit(300); // Analizamos más datos para que el algoritmo funcione mejor

      if (error) throw error;
      if (data) processLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const processLogs = (logs: any[]) => {
    setTotalSearches(logs.length);
    let processedTerms: AggregatedTerm[] = [];

    logs.forEach((log) => {
      const rawTerm = log.search_term;
      const cleanTerm = normalizeText(rawTerm);
      if (cleanTerm.length < 2) return;

      // LÓGICA INTELIGENTE DIVIDIDA POR PLAN
      let foundIndex = -1;

      if (isProSmart) {
        // PLAN PRO ($599): Búsqueda Difusa (Smart)
        // Buscamos si ya existe un término "parecido" en nuestra lista
        foundIndex = processedTerms.findIndex((item) => {
          // 1. Coincidencia exacta
          if (item.term === cleanTerm) return true;
          
          // 2. Plurales simples (jaula vs jaulas) -> Si una contiene a la otra
          if (item.term.includes(cleanTerm) || cleanTerm.includes(item.term)) return true;

          // 3. Algoritmo Levenshtein (Typos: Samsun vs Samsung)
          // Solo si las palabras tienen longitud similar (>3 letras)
          if (cleanTerm.length > 3 && item.term.length > 3) {
             const distance = levenshteinDistance(item.term, cleanTerm);
             // Permitimos 1 error por cada 4 letras (aprox)
             return distance <= 1; 
          }
          return false;
        });

      } else {
        // PLAN BASICO ($299): Coincidencia Exacta (Dumb)
        foundIndex = processedTerms.findIndex((item) => item.term === cleanTerm);
      }

      if (foundIndex !== -1) {
        // SI YA EXISTE (O SE PARECE), LO SUMAMOS AL GRUPO
        processedTerms[foundIndex].count += 1;
        if (log.results_count === 0) processedTerms[foundIndex].zeroResultsCount += 1;
        if (!processedTerms[foundIndex].variations.includes(rawTerm)) {
            processedTerms[foundIndex].variations.push(rawTerm);
        }
      } else {
        // SI ES NUEVO, LO CREAMOS
        processedTerms.push({
          term: cleanTerm,
          count: 1,
          zeroResultsCount: log.results_count === 0 ? 1 : 0,
          variations: [rawTerm]
        });
      }
    });

    // Ordenamos por popularidad
    const sorted = processedTerms.sort((a, b) => b.count - a.count).slice(0, 20);
    
    // Formateamos para visualización (Capitalizar primera letra)
    const finalTerms = sorted.map(t => ({
        ...t,
        term: t.term.charAt(0).toUpperCase() + t.term.slice(1)
    }));

    setTerms(finalTerms);
  };

  // --- RENDERS ---
  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!hasAccess) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;

  if (loadingData) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Procesando datos...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full bg-white p-0">
      <div className="p-4 space-y-5">
        
        <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Top Búsquedas
            </h4>
            {isProSmart && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3" /> IA Fuzzy Activa
                </Badge>
            )}
        </div>

        {/* NUBE DE TAGS */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
            {terms.slice(0, 8).map((item, idx) => (
                <Badge 
                    key={idx} variant="secondary"
                    className={`cursor-default transition-all hover:scale-105 px-3 py-1
                        ${idx === 0 ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600'}
                    `}
                >
                    {item.term} <span className="ml-1 opacity-60 text-[10px]">({item.count})</span>
                </Badge>
            ))}
        </div>

        {/* LISTA DETALLADA */}
        <div className="space-y-1">
            {terms.map((item, idx) => {
                const isMissed = (item.zeroResultsCount / item.count) > 0.5;
                return (
                    <div key={idx} className="flex flex-col justify-center text-sm group hover:bg-slate-50 p-2 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-700 font-medium">{item.term}</span>
                                {isMissed && (
                                    <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-semibold">
                                        <AlertCircle className="w-3 h-3" /> Alta Demanda Perdida
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-500">{item.count}</span>
                        </div>
                        
                        {/* SI ES PRO: Muestra qué palabras agrupó (evidencia de inteligencia) */}
                        {isProSmart && item.variations.length > 1 && (
                            <p className="text-[10px] text-slate-400 mt-1 pl-2 border-l-2 border-indigo-100">
                                Agrupa: {item.variations.slice(0, 3).join(", ")}...
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </ScrollArea>
  );
};
