import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BrainCircuit, Loader2, TrendingUp, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { addDays, format, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
// IMPORTANTE: Usamos la librería que ya tienes instalada
import regression from "regression";

interface ForecastPoint {
  date: string;
  real: number | null;
  predicted: number | null;
  ci_lower?: number | null; // Intervalo de confianza (visual)
  ci_upper?: number | null;
}

interface DemandForecastProps {
  userId: string;
}

export const DemandForecastWidget = ({ userId }: DemandForecastProps) => {
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("predictivo");

  const [chartData, setChartData] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [topTerms, setTopTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [rawLogs, setRawLogs] = useState<any[]>([]);

  // Métricas de la IA
  const [aiConfidence, setAiConfidence] = useState<number>(0); // R-squared (0 a 100)
  const [trendDescription, setTrendDescription] = useState<string>("");
  const [trendDirection, setTrendDirection] = useState<"up" | "down" | "flat">("flat");

  useEffect(() => {
    if (isAllowed && userId && !loadingPlan) {
      fetchInitialData();
    }
  }, [isAllowed, userId, loadingPlan]);

  useEffect(() => {
    if (selectedTerm && rawLogs.length > 0) {
      runAiModel(selectedTerm, rawLogs);
    }
  }, [selectedTerm]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: logs } = await supabase
        .from("search_logs")
        .select("search_term, created_at")
        .eq("user_id", userId)
        .gte("created_at", subDays(new Date(), 45).toISOString()) // 45 días de historia
        .order("created_at", { ascending: true });

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }
      setRawLogs(logs);

      // Top terms logic
      const counts: Record<string, number> = {};
      logs.forEach((l) => {
        const term = l.search_term?.toLowerCase().trim();
        if (term) counts[term] = (counts[term] || 0) + 1;
      });
      const sortedTerms = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((item) => item[0]);

      if (sortedTerms.length > 0) {
        const formattedTerms = sortedTerms.map((t) => t.charAt(0).toUpperCase() + t.slice(1));
        setTopTerms(formattedTerms);
        setSelectedTerm(formattedTerms[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAiModel = (termLabel: string, logs: any[]) => {
    const termKey = termLabel.toLowerCase();

    // 1. Agrupar por días (Serie de Tiempo)
    const dailyCounts: Record<string, number> = {};
    // Analizamos 30 días hacia atrás para tener buena data
    for (let i = 30; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      dailyCounts[d] = 0;
    }

    logs
      .filter((l) => l.search_term?.toLowerCase().trim() === termKey)
      .forEach((l) => {
        const d = format(parseISO(l.created_at), "yyyy-MM-dd");
        if (dailyCounts[d] !== undefined) dailyCounts[d]++;
      });

    // Formato para la librería regression: [x, y]
    const dataPoints = Object.entries(dailyCounts).map(([date, count], index) => [index, count]);

    // 2. EJECUTAR REGRESIÓN POLINÓMICA (Grado 2 para detectar curvas)
    // Si hay pocos datos (<10 puntos), usa lineal. Si hay más, usa polinómica.
    const method = dataPoints.length > 10 ? "polynomial" : "linear";
    const options = method === "polynomial" ? { order: 2, precision: 3 } : { precision: 3 };

    // @ts-ignore - La librería regression a veces da problemas de tipos estrictos
    const result = regression[method](dataPoints, options);

    // 3. Evaluar la calidad del modelo (R2)
    const r2 = result.r2 * 100; // 0 a 100
    setAiConfidence(r2);

    // 4. Interpretar la tendencia (Pendiente final)
    // Predecimos el punto de mañana vs hoy para ver la dirección
    const lastX = dataPoints.length - 1;
    const predictToday = result.predict(lastX)[1];
    const predictTomorrow = result.predict(lastX + 1)[1];
    const delta = predictTomorrow - predictToday;

    if (delta > 0.5) {
      setTrendDirection("up");
      setTrendDescription("Tendencia Acelerada 🔥");
    } else if (delta < -0.2) {
      setTrendDirection("down");
      setTrendDescription("Enfriamiento 🧊");
    } else {
      setTrendDirection("flat");
      setTrendDescription("Demanda Estable ⚓");
    }

    // 5. Construir Datos para Gráfica
    const finalData: ForecastPoint[] = [];

    // Historia Real
    Object.entries(dailyCounts).forEach(([date, count], index) => {
      // Calculamos la curva de tendencia suavizada histórica
      const smoothVal = result.predict(index)[1];
      finalData.push({
        date: format(new Date(date), "dd MMM", { locale: es }),
        real: count,
        predicted: Math.max(0, smoothVal), // Mostramos la línea de tendencia sobre la real
      });
    });

    // Predicción Futura (7 días)
    const lastDate = new Date();
    for (let i = 1; i <= 7; i++) {
      const nextIndex = lastX + i;
      const pred = result.predict(nextIndex)[1];
      finalData.push({
        date: format(addDays(lastDate, i), "dd MMM", { locale: es }),
        real: null,
        predicted: Math.max(0, pred),
      });
    }

    setChartData(finalData);
  };

  // UI Helpers
  const getConfidenceBadge = () => {
    if (aiConfidence > 60)
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
          Alta Confianza IA
        </Badge>
      );
    if (aiConfidence > 30)
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Confianza Media</Badge>;
    return (
      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200">Datos Insuficientes</Badge>
    );
  };

  if (loadingPlan) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!isAllowed) return <div className="h-full min-h-[400px]">{UpsellComponent}</div>;

  return (
    <Card className="shadow-lg border-indigo-100 bg-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 border-0 flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> Predictive AI v2
              </Badge>
              {getConfidenceBadge()}
            </div>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">Proyección de Demanda</CardTitle>
            <CardDescription>
              {trendDescription ? `Análisis: ${trendDescription}` : "Selecciona un producto..."}
            </CardDescription>
          </div>

          <div className="w-full sm:w-[220px]">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Analizar producto..." />
              </SelectTrigger>
              <SelectContent>
                {topTerms.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[350px] pt-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendDirection === "up" ? "#10b981" : "#f59e0b"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendDirection === "up" ? "#10b981" : "#f59e0b"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748b" }}
                minTickGap={30}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
              />

              {/* Datos Reales (Sólido) */}
              <Area
                type="monotone"
                dataKey="real"
                name="Búsquedas Reales"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorReal)"
                activeDot={{ r: 6 }}
              />

              {/* Predicción IA (Punteado) */}
              <Area
                type="monotone"
                dataKey="predicted"
                name="IA Forecast"
                stroke={trendDirection === "up" ? "#10b981" : "#f59e0b"}
                strokeWidth={3}
                strokeDasharray="4 4"
                fill="url(#colorPred)"
              />

              <ReferenceLine
                x={format(new Date(), "dd MMM", { locale: es })}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ position: "top", value: "Hoy", fill: "#ef4444", fontSize: 10 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
            <p>No hay datos suficientes para generar un pronóstico.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
