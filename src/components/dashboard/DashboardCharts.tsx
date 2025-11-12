import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, DollarSign, ShoppingBag, FileText, Activity } from "lucide-react";

// --- TIPO DE DATOS ---
type KPIData = {
  total_sales: number;
  total_quotes: number;
  pending_quotes: number;
  conversion_rate: number;
};

// --- COMPONENTE 1: TARJETAS DE KPI ---
export function DashboardKPIs({ userId }: { userId: string }) {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      const { data: kpis, error } = await supabase.rpc('fn_get_dashboard_kpis', { p_user_id: userId });
      if (!error && kpis) setData(kpis as any); // 'as any' porque viene como JSON
      setLoading(false);
    };
    fetchKPIs();
  }, [userId]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse"><div className="h-32 bg-gray-100 rounded-xl"></div><div className="h-32 bg-gray-100 rounded-xl"></div><div className="h-32 bg-gray-100 rounded-xl"></div></div>;

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(data.total_sales / 100).toLocaleString('es-MX')}</div>
          <p className="text-xs text-muted-foreground">Últimos 30 días</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Cotizaciones</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_quotes}</div>
          <p className="text-xs text-muted-foreground">{data.pending_quotes} pendientes</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Cierre</CardTitle>
          <Activity className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.conversion_rate}%</div>
          <p className="text-xs text-muted-foreground">De cotización a venta</p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- COMPONENTE 2: GRÁFICA DE VENTAS ---
export function SalesChart({ userId }: { userId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: chartData } = await supabase.rpc('fn_get_sales_chart_data', { p_user_id: userId });
      // Convertimos centavos a pesos para la gráfica
      const formatted = (chartData || []).map((d: any) => ({
        name: d.date_label,
        total: d.amount / 100
      }));
      setData(formatted);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading) return <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-xl"><Loader2 className="animate-spin text-gray-400" /></div>;

  if (data.length === 0) return (
    <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
        <ShoppingBag className="w-10 h-10 mb-2 opacity-50" />
        <p>Aún no hay datos de ventas para mostrar.</p>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
        <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString('es-MX')}`, 'Ventas']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
