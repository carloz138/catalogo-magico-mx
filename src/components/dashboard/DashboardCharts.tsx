import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Loader2, DollarSign, ShoppingBag, FileText, Activity, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, addDays, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import regression from "regression"; // Asegúrate de haber agregado esto al package.json

// --- COMPONENTE 1: TARJETAS DE KPI (VENTAS REALES) ---
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
          const pending = quotes.filter((q) => q.status === "pending" || q.status === "negotiation").length;

          // Tasa de Cierre Financiero: Pagos Reales / Cotizaciones Aceptadas
          // Si tengo 10 aceptadas y 5 pagadas, mi eficiencia de cobro es 50%
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

// --- COMPONENTE 2: GRÁFICA DE VENTAS + IA PREDICTIVA ---
export function SalesChart({ userId }: { userId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<"up" | "down" | "neutral">("neutral");

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const endDate = new Date();
        const startDate = subDays(new Date(), 30); // Analizamos últimos 30 días para proyectar

        // 1. Llamada al RPC 'get_daily_sales' (Ventas Reales desde payment_transactions)
        // Nota: TypeScript puede quejarse si no definimos el RPC en los tipos, usamos 'as any' temporalmente si es necesario
        const { data: rawData, error } = await supabase.rpc("get_daily_sales", {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          target_merchant_id: userId,
        });

        if (error) throw error;

        // Si no hay datos, manejamos el vacío
        if (!rawData || rawData.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // 2. Formatear datos históricos
        const formattedHistory = rawData.map((d: any) => ({
          name: format(parseISO(d.sale_date), "dd MMM", { locale: es }),
          fullDate: d.sale_date,
          total: d.daily_total / 100, // Centavos a Pesos
          prediction: null, // El histórico no es predicción
        }));

        // 3. GENERAR PREDICCIÓN IA (Regresión Lineal)
        // Mapeamos a formato [x, y] -> [día_número, ventas]
        const regressionData = formattedHistory.map((d: any, index: number) => [index, d.total]);

        // Entrenamos el modelo lineal con los datos actuales
        const result = regression.linear(regressionData);
        const gradient = result.equation[0]; // La pendiente (m)

        setTrend(gradient > 0.5 ? "up" : gradient < -0.5 ? "down" : "neutral");

        // Predecir los próximos 7 días
        const lastIndex = formattedHistory.length - 1;
        const lastDateObj = parseISO(formattedHistory[lastIndex].fullDate);
        const futurePoints = [];

        for (let i = 1; i <= 7; i++) {
          const nextIndex = lastIndex + i;
          // Predicción y = mx + b (evitamos valores negativos)
          const predictedValue = Math.max(0, result.predict(nextIndex)[1]);

          futurePoints.push({
            name: format(addDays(lastDateObj, i), "dd MMM", { locale: es }),
            total: null, // El futuro no tiene venta real... aún
            prediction: predictedValue,
          });
        }

        // Punto de conexión visual (para que la línea punteada nazca de la última barra)
        const connectionPoint = {
          ...formattedHistory[lastIndex],
          prediction: formattedHistory[lastIndex].total,
        };
        formattedHistory[lastIndex] = connectionPoint;

        // Unimos Histórico + Futuro
        setData([...formattedHistory, ...futurePoints]);
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
      <div className="h-[250px] flex items-center justify-center bg-slate-50 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );

  // Calcular total histórico del periodo mostrado (sin contar predicciones)
  const totalPeriodo = data.reduce((acc, item) => acc + (item.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between px-1">
        <div>
          <p className="text-xl md:text-2xl font-bold text-slate-900">
            ${totalPeriodo.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-medium">
            Venta últimos 30 días
          </p>
        </div>

        {/* Indicador de Tendencia IA */}
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
            trend === "up"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : trend === "down"
                ? "bg-red-50 text-red-700 border-red-100"
                : "bg-slate-50 text-slate-600 border-slate-100"
          }`}
        >
          {trend === "up" && <TrendingUp className="w-3 h-3" />}
          {trend === "down" && <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend === "neutral" && <Activity className="w-3 h-3" />}
          <span>IA: {trend === "up" ? "Creciendo" : trend === "down" ? "Bajando" : "Estable"}</span>
        </div>
      </div>

      {totalPeriodo === 0 && data.every((d) => !d.total) ? (
        <div className="h-[200px] md:h-[250px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed text-slate-400">
          <ShoppingBag className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">Sin ventas cobradas</p>
          <p className="text-xs mt-1">Solo mostramos transacciones pagadas.</p>
        </div>
      ) : (
        <div className="h-[200px] md:h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`,
                  name === "total" ? "Venta Real" : "Proyección IA",
                ]}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ color: "#1e293b", fontWeight: "bold" }}
              />

              {/* 1. VENTAS REALES (Área Sólida) */}
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
                activeDot={{ r: 6 }}
              />

              {/* 2. PREDICCIÓN IA (Línea Punteada) */}
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
