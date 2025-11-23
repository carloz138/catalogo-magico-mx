import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BrainCircuit, Loader2 } from "lucide-react";
import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";

// Tipos de datos
interface DailySearchData {
  date: string;
  count: number;
}

interface ForecastPoint {
  date: string;
  real: number | null; // Dato histórico
  predicted: number | null; // Dato futuro (IA)
  trend: number | null; // Línea de tendencia
}

// 1. CAMBIO DE INTERFAZ: Usamos userId
interface DemandForecastProps {
  userId: string;
}

export const DemandForecastWidget = ({ userId }: DemandForecastProps) => {
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("predictivo");

  const [chartData, setChartData] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [topTerm, setTopTerm] = useState<string>("");
  const [growthRate, setGrowthRate] = useState<number>(0);

  useEffect(() => {
    // 2. DEPENDENCIAS: Reaccionamos al cambio de userId
    if (isAllowed && userId && !loadingPlan) {
      fetchHistoryAndPredict();
    }
  }, [isAllowed, userId, loadingPlan]);

  const fetchHistoryAndPredict = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Obtenemos el término más buscado de los últimos 30 días GLOBALMENTE (User Centric)
      const { data: logs } = await supabase
        .from("search_logs")
        .select("search_term, created_at")
        .eq("user_id", userId) // <--- CAMBIO CLAVE AQUÍ
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at", { ascending: true });

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Agrupamos para encontrar el término top
      const counts: Record<string, number> = {};
      logs.forEach((l) => {
        const term = l.search_term?.toLowerCase().trim();
        if (term) counts[term] = (counts[term] || 0) + 1;
      });

      const sortedTerms = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sortedTerms.length === 0) {
        setLoading(false);
        return;
      }

      const winnerTerm = sortedTerms[0][0];
      setTopTerm(winnerTerm.charAt(0).toUpperCase() + winnerTerm.slice(1));

      // 3. Preparamos datos diarios de ese término para la regresión
      const dailyCounts: Record<string, number> = {};
      // Inicializamos los últimos 30 días en 0
      for (let i = 30; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        dailyCounts[d] = 0;
      }

      logs
        .filter((l) => l.search_term?.toLowerCase().trim() === winnerTerm)
        .forEach((l) => {
          const d = format(new Date(l.created_at), "yyyy-MM-dd");
          if (dailyCounts[d] !== undefined) dailyCounts[d]++;
        });

      const historyArray = Object.entries(dailyCounts).map(([date, count], index) => ({
        x: index, // Día 0, 1, 2... (Para la matemática)
        y: count,
        date,
      }));

      // 4. ALGORITMO DE REGRESIÓN LINEAL (Math Magic) 🧙‍♂️
      const n = historyArray.length;
      const sumX = historyArray.reduce((acc, val) => acc + val.x, 0);
      const sumY = historyArray.reduce((acc, val) => acc + val.y, 0);
      const sumXY = historyArray.reduce((acc, val) => acc + val.x * val.y, 0);
      const sumXX = historyArray.reduce((acc, val) => acc + val.x * val.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      setGrowthRate(slope * 100); // Velocidad de crecimiento aprox

      // 5. Construimos el dataset final (Pasado + Futuro)
      const finalData: ForecastPoint[] = [];

      // Pasado (Real)
      historyArray.forEach((item) => {
        finalData.push({
          date: format(new Date(item.date), "dd MMM", { locale: es }),
          real: item.y,
          predicted: null,
          trend: slope * item.x + intercept, // Línea de tendencia suave
        });
      });

      // Futuro (Predicción - Próximos 7 días)
      const lastDayIndex = historyArray.length - 1;
      for (let i = 1; i <= 7; i++) {
        const nextIndex = lastDayIndex + i;
        const nextDate = addDays(new Date(), i);
        const prediction = slope * nextIndex + intercept;

        finalData.push({
          date: format(nextDate, "dd MMM", { locale: es }),
          real: null,
          predicted: Math.max(0, prediction), // No predecimos negativos
          trend: null,
        });
      }

      setChartData(finalData);
    } catch (e) {
      console.error("Error en forecast:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---

  if (loadingPlan) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-xl" />;

  if (!isAllowed) {
    return (
      <div className="h-full min-h-[400px]">
        {React.cloneElement(UpsellComponent as React.ReactElement, {
          featureName: "IA Predictiva de Demanda",
          description:
            "Adelántate al futuro. Nuestra IA analiza tendencias y te dice qué se venderá la próxima semana.",
        })}
      </div>
    );
  }

  if (loading)
    return (
      <div className="h-[400px] flex items-center justify-center bg-white border rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );

  if (!topTerm)
    return (
      <Card className="border-dashed border-slate-300">
        <CardContent className="py-12 text-center text-slate-400">
          <BrainCircuit className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p>Necesitamos más datos de búsqueda para generar predicciones.</p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="shadow-lg border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Badge className="mb-2 bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              <BrainCircuit className="w-3 h-3 mr-1" /> IA Forecast
            </Badge>
            <CardTitle className="text-xl text-slate-800">
              Proyección de Demanda: <span className="text-indigo-600">"{topTerm}"</span>
            </CardTitle>
            <CardDescription>Basado en el comportamiento de búsqueda global.</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${growthRate > 0 ? "text-green-600" : "text-slate-500"}`}>
              {growthRate > 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </div>
            <span className="text-xs text-slate-500 uppercase font-bold">Tendencia Semanal</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} minTickGap={30} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
            />

            {/* Datos Reales (Pasado) */}
            <Area
              type="monotone"
              dataKey="real"
              name="Búsquedas Reales"
              stroke="#4f46e5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorReal)"
            />

            {/* Línea de Tendencia (Matemática) */}
            <Area
              type="monotone"
              dataKey="trend"
              name="Tendencia Base"
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth={1}
              fill="none"
              dot={false}
            />

            {/* Predicción (Futuro) */}
            <Area
              type="monotone"
              dataKey="predicted"
              name="Pronóstico IA"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorPred)"
            />

            {/* Línea divisoria Hoy */}
            <ReferenceLine
              x={format(new Date(), "dd MMM", { locale: es })}
              stroke="red"
              strokeDasharray="3 3"
              label="Hoy"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600"></span> Historia Real
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Predicción Futura
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
