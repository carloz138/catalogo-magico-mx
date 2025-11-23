import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext"; // Importamos Auth
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, AlertCircle, Search, BrainCircuit } from "lucide-react";

// ... funciones normalizeText y levenshteinDistance IGUALES ...
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// ... interfaces ...

export const SearchStatsWidget = ({ catalogId }: { catalogId?: string | null }) => {
  const { isAllowed: isProSmart } = useFeatureAccess("recomendaciones");
  const { isAllowed: hasAccess, loading: loadingPlan, UpsellComponent } = useFeatureAccess("radar_inteligente");
  const { user } = useAuth(); // Usamos el USER

  const [terms, setTerms] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (hasAccess && user && !loadingPlan) {
      fetchSearchLogs();
    }
  }, [hasAccess, user, loadingPlan]);

  const fetchSearchLogs = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      // CAMBIO: Buscar por user_id global, no por catalog_id
      const { data, error } = await supabase
        .from("search_logs")
        .select("*")
        .eq("user_id", user.id) // <--- ESTA ES LA CLAVE
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;
      if (data) processLogs(data); // La funcion processLogs queda IGUAL
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // ... Resto del componente (processLogs y return) queda IGUAL ...
  // Solo asegúrate de copiar la funcion processLogs del archivo anterior

  // (He omitido el resto para brevedad, pero debes mantener la logica de visualizacion)
  const processLogs = (logs: any[]) => {
    // ... (Copia la lógica de agrupación Fuzzy que ya tenías)
    // Si necesitas que te la vuelva a escribir completa dímelo.
    // Simulación rápida para que compile este bloque:
    setTerms(logs.map((l) => ({ term: l.search_term, count: 1, zeroResultsCount: 0, variations: [] })));
  };

  // RENDERS
  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!hasAccess) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;

  if (loadingData) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] w-full bg-white p-0">
      {/* ... Copia el JSX de visualización del archivo anterior ... */}
      <div className="p-4 text-center text-slate-500">Visualización de Búsquedas (Copia tu JSX aquí)</div>
    </ScrollArea>
  );
};
