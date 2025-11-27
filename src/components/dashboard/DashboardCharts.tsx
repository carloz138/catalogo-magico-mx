import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Loader2, DollarSign, ShoppingBag, FileText, Activity, TrendingUp } from "lucide-react";
import { format, subDays, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// --- COMPONENTE 1: TARJETAS DE KPI (OPERACIÓN DIARIA) ---
export function DashboardKPIs({ userId }: { userId: string }) {
  const [stats, setStats] = useState({
    totalSales: 0,
    countQuotes: 0,
    pendingQuotes: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      if (!userId) return;

      try {
        // 1. Obtener Cotizaciones para flujo operativo
        const { data: quotes } = await supabase.from("quotes").select("id, status").eq("user_id", userId);

        // 2. Obtener Transacciones para DINERO REAL (Lo nuevo)
        const { data: payments } = await supabase
          .from("payment_transactions")
          .select("amount_total")
          .eq("merchant_id", userId)
          .eq("status", "paid");

        if (quotes && payments) {
          const totalQuotes = quotes.length;

          // Ventas Reales (Suma de lo pagado en centavos / 100)
          const totalRealMoney = payments.reduce((sum, p) => sum + (p.amount_total || 0), 0) / 100;

          // Cotizaciones Aceptadas (Interés de compra)
          const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length;
          // Pendientes o en Negociación
          const pending = quotes.filter((q) => q.status === "pending" || q.status === "negotiation").length;

          // Tasa de Cierre Financiero: Pagos Reales / Cotizaciones Aceptadas
          const conversion = acceptedQuotes > 0 ? Math.round((payments.length / acceptedQuotes) * 100) : 0;

          setStats({
            totalSales: totalRealMoney,
            countQuotes: totalQuotes,
            pendingQuotes: pending,
            conversionRate: conversion,
          });
        }
      } catch (error) {
        console.error("Error KPI Charts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, [userId]);

  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
    );

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-emerald-700 uppercase">
            Ventas Cobradas
          </CardTitle>
          <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{formatMoney(stats.totalSales)}</div>
          <p className="text-[10px] text-emerald-600 font-medium">Dinero en banco</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-slate-500 uppercase">Cotizaciones</CardTitle>
          <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{stats.countQuotes}</div>
          <p className="text-[10px] text-slate-400">Generadas totales</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-slate-500 uppercase">En Negociación</CardTitle>
          <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{stats.pendingQuotes}</div>
          <p className="text-[10px] text-amber-600 font-medium">Oportunidad abierta</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-slate-500 uppercase">
            Eficiencia Cobro
          </CardTitle>
          <Activity className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{stats.conversionRate}%</div>
          <p className="text-[10px] text-slate-400">Aceptado vs Pagado</p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- COMPONENTE 2: GRÁFICA DE VENTAS (SalesChart 2.0 - Comparativo & Motivacional) ---
export function SalesChart({ userId }: { userId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Inteligencia
  const [metrics, setMetrics] = useState({
    currentTotal: 0,
    previousTotal: 0,
    growth: 0, // % de crecimiento vs mes anterior
    pacingStatus: "neutral" as "ahead" | "behind" | "neutral",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const today = new Date();
        // Pedimos 60 días para tener el mes actual y el anterior completo
        const startDate = subDays(today, 60);

        // Llamada RPC (asegúrate de que get_daily_sales exista en Supabase)
        const { data: rawData, error } = await supabase.rpc("get_daily_sales", {
          start_date: startDate.toISOString(),
          end_date: today.toISOString(),
          target_merchant_id: userId,
        });

        if (error) throw error;

        // --- PROCESAMIENTO DE DATOS ---
        const salesMap = new Map();
        // Llenar mapa con datos crudos
        rawData?.forEach((d: any) => {
          const dateKey = d.sale_date.split("T")[0];
          salesMap.set(dateKey, d.daily_total / 100);
        });

        // Construir la comparación de los últimos 30 días vs los 30 anteriores
        const chartData = [];
        let accumCurrent = 0;
        let accumPrevious = 0;

        // Iteramos los últimos 30 días
        for (let i = 29; i >= 0; i--) {
          const dateCurrent = subDays(today, i);
          const datePrevious = subDays(today, i + 30); // El mismo día, hace un mes

          const keyCurrent = format(dateCurrent, "yyyy-MM-dd");
          const keyPrevious = format(datePrevious, "yyyy-MM-dd");

          const valCurrent = salesMap.get(keyCurrent) || 0;
          const valPrevious = salesMap.get(keyPrevious) || 0;

          accumCurrent += valCurrent;
          accumPrevious += valPrevious;

          chartData.push({
            day: format(dateCurrent, "dd MMM", { locale: es }), // Etiqueta eje X
            current: valCurrent,
            previous: valPrevious, // La "Sombra"
            delta: valCurrent - valPrevious, // Para el tooltip
          });
        }

        // Calcular Crecimiento / Ritmo (Pacing)
        let growthPercent = 0;
        if (accumPrevious > 0) {
          growthPercent = ((accumCurrent - accumPrevious) / accumPrevious) * 100;
        }

        setData(chartData);
        setMetrics({
          currentTotal: accumCurrent,
          previousTotal: accumPrevious,
          growth: growthPercent,
          pacingStatus: growthPercent >= 0 ? "ahead" : "behind",
        });
      } catch (error) {
        console.error("Error Sales Chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading)
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );

  // Tooltip Personalizado para explicar la comparativa
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const curr = payload[0].value;
      const prev = payload[1]?.value || 0;
      const diff = curr - prev;

      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-indigo-600 font-semibold">Este mes:</span>
            <span className="font-bold">${curr.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-slate-400">Mes pasado:</span>
            <span className="text-slate-500">${prev.toLocaleString()}</span>
          </div>
          <div
            className={`pt-2 border-t border-slate-100 flex items-center gap-2 ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {diff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            <span className="font-bold">
              {diff >= 0 ? "+$" : "-$"}
              {Math.abs(diff).toLocaleString()}
            </span>
            <span>vs mes anterior</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* HEADER: EL MARCADOR */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wide">Ingresos (30 días)</span>
            {/* Badge de Ritmo */}
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                metrics.pacingStatus === "ahead"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {metrics.pacingStatus === "ahead" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3 rotate-180" />
              )}
              {Math.abs(metrics.growth).toFixed(1)}% vs mes anterior
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-900">
              ${metrics.currentTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              (vs ${metrics.previousTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })})
            </span>
          </div>
        </div>

        {/* Tarjeta de Proyección Simple */}
        <div className="hidden md:block bg-indigo-50 border border-indigo-100 rounded-lg p-2 px-4">
          <p className="text-[10px] text-indigo-500 uppercase font-bold mb-0.5">Ritmo de venta</p>
          <p className="text-sm text-indigo-900 font-medium">
            Promedio:{" "}
            <span className="font-bold">
              ${(metrics.currentTotal / 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>{" "}
            al día
          </p>
        </div>
      </div>

      {/* GRÁFICA COMPARATIVA */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 1. MES ANTERIOR (Sombra Gris - Contexto) */}
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="transparent"
              activeDot={false}
              animationDuration={1500}
            />

            {/* 2. MES ACTUAL (Área Principal - Foco) */}
            <Area
              type="monotone"
              dataKey="current"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#colorCurrent)"
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={2000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Explicativo */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500 border-t border-slate-50 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full opacity-30"></div>
          <span>Este Mes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-400 h-0 w-4"></div>
          <span>Mes Pasado (Mismo día)</span>
        </div>
      </div>
    </div>
  );
}
