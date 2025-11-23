import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Loader2, DollarSign, ShoppingBag, FileText, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// --- COMPONENTE 1: TARJETAS DE KPI (VENTAS) ---
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
        const { data: quotes } = await supabase.from("quotes").select("id, status, total_amount").eq("user_id", userId);

        if (quotes) {
          const total = quotes.length;
          // CORRECCIÓN: Usamos 'accepted' según tu JSON
          const approved = quotes.filter((q) => q.status === "accepted");
          const pending = quotes.filter((q) => q.status === "pending");

          const totalSales = approved.reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
          const conversion = total > 0 ? Math.round((approved.length / total) * 100) : 0;

          setStats({
            totalSales,
            countQuotes: total,
            pendingQuotes: pending.length,
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
            Ventas Totales
          </CardTitle>
          <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{formatMoney(stats.totalSales)}</div>
          <p className="text-[10px] text-emerald-600 font-medium">Ingresos cerrados</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-slate-500 uppercase">Cotizaciones</CardTitle>
          <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{stats.countQuotes}</div>
          <p className="text-[10px] text-slate-400">Totales</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-slate-500 uppercase">Pendientes</CardTitle>
          <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{stats.pendingQuotes}</div>
          <p className="text-[10px] text-amber-600 font-medium">Por cerrar</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-medium text-slate-500 uppercase">Tasa Cierre</CardTitle>
          <Activity className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-lg md:text-2xl font-bold text-slate-800">{stats.conversionRate}%</div>
          <p className="text-[10px] text-slate-400">Efectividad</p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- COMPONENTE 2: GRÁFICA DE VENTAS ---
export function SalesChart({ userId }: { userId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const days = parseInt(timeRange);
        const startDate = subDays(new Date(), days).toISOString();

        const { data: quotes, error } = await supabase
          .from("quotes")
          .select("total_amount, created_at")
          .eq("user_id", userId)
          .eq("status", "accepted") // CORRECCIÓN: 'accepted' es lo que tienes en DB
          .gte("created_at", startDate)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Lógica Zero-Filling
        const filledData = [];
        let accumTotal = 0;

        for (let i = days; i >= 0; i--) {
          const dateCursor = subDays(new Date(), i);

          const daySales = quotes?.filter((q) => isSameDay(parseISO(q.created_at), dateCursor)) || [];

          const totalDay = daySales.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
          accumTotal += totalDay;

          filledData.push({
            name: format(dateCursor, "dd MMM", { locale: es }),
            total: totalDay,
          });
        }

        setData(filledData);
      } catch (error) {
        console.error("Error Sales Chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, timeRange]);

  if (loading)
    return (
      <div className="h-[250px] flex items-center justify-center bg-slate-50 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );

  const totalPeriodo = data.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between px-1">
        <div>
          <p className="text-xl md:text-2xl font-bold text-slate-900">
            ${totalPeriodo.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-medium">Venta del periodo</p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[90px] h-8 text-xs bg-white">
            <SelectValue placeholder="Días" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Días</SelectItem>
            <SelectItem value="30">30 Días</SelectItem>
            <SelectItem value="90">90 Días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {totalPeriodo === 0 && data.every((d) => d.total === 0) ? (
        <div className="h-[200px] md:h-[250px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed text-slate-400">
          <ShoppingBag className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">Sin ventas registradas</p>
          <p className="text-xs">Tus cotizaciones aceptadas suman $0.</p>
        </div>
      ) : (
        <div className="h-[200px] md:h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
                formatter={(value: number) => [`$${value.toLocaleString("es-MX")}`, "Ventas"]}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ color: "#1e293b", fontWeight: "bold" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
