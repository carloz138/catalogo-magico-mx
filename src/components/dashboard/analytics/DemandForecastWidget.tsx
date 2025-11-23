import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BrainCircuit, Loader2, TrendingUp, Info, BarChart } from "lucide-react";
import { addDays, format, subDays, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ForecastPoint {
  date: string;
  real: number | null;
  predicted: number | null;
  trend: number | null;
}

interface DemandForecastProps {
  userId: string;
}

type DataMaturity = "learning" | "tactical" | "strategic";

export const DemandForecastWidget = ({ userId }: DemandForecastProps) => {
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("predictivo");

  const [chartData, setChartData] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de Datos y Selección
  const [topTerms, setTopTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [growthRate, setGrowthRate] = useState<number>(0);

  // Estado de "Madurez" de la IA
  const [dataMaturity, setDataMaturity] = useState<DataMaturity>("learning");
  const [activeDaysCount, setActiveDaysCount] = useState(0);

  useEffect(() => {
    if (isAllowed && userId && !loadingPlan) {
      fetchInitialData();
    }
  }, [isAllowed, userId, loadingPlan]);

  useEffect(() => {
    if (selectedTerm && rawLogs.length > 0) {
      calculateForecast(selectedTerm, rawLogs);
    }
  }, [selectedTerm]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Traemos 60 días de historia para detectar tendencias mensuales
      const { data: logs } = await supabase
        .from("search_logs")
        .select("search_term, created_at")
        .eq("user_id", userId)
        .gte("created_at", subDays(new Date(), 60).toISOString())
        .order("created_at", { ascending: true });

      if (!logs || logs.length === 0) {
        setDataMaturity("learning");
        setActiveDaysCount(0);
        setLoading(false);
        return;
      }

      setRawLogs(logs);

      // 2. Calcular "Días Activos" (Madurez de los datos)
      // Creamos un Set de fechas únicas (YYYY-MM-DD) para saber cuántos días reales hubo actividad
      const uniqueDays = new Set(logs.map((l) => format(parseISO(l.created_at), "yyyy-MM-dd")));
      const uniqueCount = uniqueDays.size;
      setActiveDaysCount(uniqueCount);

      // Definimos el nivel de madurez
      if (uniqueCount < 7) {
        setDataMaturity("learning"); // Menos de una semana de datos reales
      } else if (uniqueCount < 30) {
        setDataMaturity("tactical"); // Datos suficientes para corto plazo
      } else {
        setDataMaturity("strategic"); // Datos robustos
      }

      // 3. Encontrar los Top 5 términos más buscados
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
      console.error("Error en forecast:", e);
    } finally {
      setLoading(false);
    }
  };

  const calculateForecast = (termLabel: string, logs: any[]) => {
    const termKey = termLabel.toLowerCase();

    // 1. Preparar datos diarios (rellenar huecos con 0)
    // Usamos el rango de historia disponible o máximo 60 días
    const dailyCounts: Record<string, number> = {};
    const daysToAnalyze = 60;

    for (let i = daysToAnalyze; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      dailyCounts[d] = 0;
    }

    // 2. Llenar con datos reales
    logs
      .filter((l) => l.search_term?.toLowerCase().trim() === termKey)
      .forEach((l) => {
        const d = format(parseISO(l.created_at), "yyyy-MM-dd");
        if (dailyCounts[d] !== undefined) dailyCounts[d]++;
      });

    const historyArray = Object.entries(dailyCounts).map(([date, count], index) => ({
      x: index,
      y: count,
      date,
    }));

    // 3. Regresión Lineal (y = mx + b)
    const n = historyArray.length;
    const sumX = historyArray.reduce((acc, val) => acc + val.x, 0);
    const sumY = historyArray.reduce((acc, val) => acc + val.y, 0);
    const sumXY = historyArray.reduce((acc, val) => acc + val.x * val.y, 0);
    const sumXX = historyArray.reduce((acc, val) => acc + val.x * val.x, 0);

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    setGrowthRate(slope * 100);

    // 4. Construir Dataset Gráfico
    const finalData: ForecastPoint[] = [];

    // Pasado
    // Solo mostramos los últimos 30 días en la gráfica para que se vea limpia,
    // aunque el cálculo usó 60.
    const viewHistoryDays = 30;
    const visibleHistory = historyArray.slice(-viewHistoryDays);

    visibleHistory.forEach((item) => {
      finalData.push({
        date: format(new Date(item.date), "dd MMM", { locale: es }),
        real: item.y,
        predicted: null,
        trend: Math.max(0, slope * item.x + intercept),
      });
    });

    // Futuro (Proyección)
    // Si estamos en modo 'tactical', proyectamos menos días (3).
    // Si es 'strategic', proyectamos la semana completa (7).
    const projectionDays = dataMaturity === "strategic" ? 7 : 4;
    const lastDayIndex = historyArray.length - 1;

    for (let i = 1; i <= projectionDays; i++) {
      const nextIndex = lastDayIndex + i;
      const nextDate = addDays(new Date(), i);
      const prediction = slope * nextIndex + intercept;

      finalData.push({
        date: format(nextDate, "dd MMM", { locale: es }),
        real: null,
        predicted: Math.max(0, prediction),
        trend: null,
      });
    }

    setChartData(finalData);
  };

  // --- RENDER ---

  if (loadingPlan) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-xl" />;

  if (!isAllowed) {
    return (
      <div className="h-full min-h-[400px]">
        {React.cloneElement(UpsellComponent as React.ReactElement, {
          featureName: "IA Predictiva",
          description: "Desbloquea el análisis de tendencias de tus productos más buscados.",
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

  // --- MODO APRENDIZAJE (DISCLAIMER) ---
  // Si no tenemos suficientes días de datos (< 7), mostramos esto en lugar de la gráfica rota.
  if (dataMaturity === "learning") {
    const progress = Math.min(100, (activeDaysCount / 7) * 100);

    return (
      <Card className="shadow-lg border-indigo-100 bg-gradient-to-br from-white to-slate-50">
        <CardContent className="h-[400px] flex flex-col items-center justify-center text-center p-8">
          <div className="bg-indigo-50 p-4 rounded-full mb-4 animate-pulse">
            <BrainCircuit className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Calibrando Inteligencia Artificial</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Nuestro algoritmo está aprendiendo los patrones de búsqueda de tus clientes. Necesitamos al menos{" "}
            <span className="font-semibold text-indigo-600">7 días de actividad</span> para generar predicciones
            confiables.
          </p>

          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Progreso de aprendizaje</span>
              <span>{activeDaysCount} / 7 días</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Info className="w-3 h-3" />
            <span>Tus datos están seguros mientras se procesan.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- MODO GRÁFICO (TACTICAL / STRATEGIC) ---
  return (
    <Card className="shadow-lg border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                <BrainCircuit className="w-3 h-3 mr-1" /> IA Forecast
              </Badge>

              {/* Badge de Confianza Dinámico */}
              {dataMaturity === "tactical" ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  Confianza Media (Recopilando historia)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  IA Optimizada (60 días)
                </Badge>
              )}
            </div>

            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              Proyección de Demanda
              <span
                className={`text-sm font-medium ${growthRate > 0 ? "text-green-600" : "text-slate-500"} flex items-center`}
              >
                <TrendingUp className="w-4 h-4 mx-1" />
                {growthRate > 0 ? "+" : ""}
                {growthRate.toFixed(1)}%
              </span>
            </CardTitle>
            <CardDescription>
              {dataMaturity === "tactical"
                ? "Proyección conservadora a 4 días."
                : "Análisis predictivo completo a 7 días."}
            </CardDescription>
          </div>

          {/* SELECTOR DE PRODUCTOS */}
          <div className="w-full sm:w-[200px]">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="bg-white border-indigo-200 text-indigo-900 font-medium shadow-sm">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {topTerms.map((term) => (
                  <SelectItem key={term} value={term} className="cursor-pointer">
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dataMaturity === "tactical" ? "#f59e0b" : "#10b981"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={dataMaturity === "tactical" ? "#f59e0b" : "#10b981"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              minTickGap={30}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
            />

            <Area
              type="monotone"
              dataKey="real"
              name="Búsquedas"
              stroke="#4f46e5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorReal)"
            />
            <Area
              type="monotone"
              dataKey="predicted"
              name="Predicción"
              stroke={dataMaturity === "tactical" ? "#f59e0b" : "#10b981"}
              strokeWidth={3}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorPred)"
            />
            {/* Línea de Hoy */}
            <ReferenceLine
              x={format(new Date(), "dd MMM", { locale: es })}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label="Hoy"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Historia
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${dataMaturity === "tactical" ? "bg-amber-500" : "bg-emerald-500"}`}
            ></div>
            Futuro ({dataMaturity === "tactical" ? "Estimado" : "Alta Confianza"})
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
