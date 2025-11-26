import { 
  Area, 
  ComposedChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, DollarSign } from "lucide-react";

// --- 1. COMPONENTE BENEFIT TIP (La ventanita de "Sabías que...") ---
export const BenefitTip = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 flex gap-3 items-start shadow-sm">
    <div className="bg-white p-2 rounded-full mt-0.5 shadow-sm border border-indigo-100 shrink-0">
      <Lightbulb className="w-5 h-5 text-indigo-600" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-1">{title}</h4>
      <p className="text-sm text-indigo-700 leading-relaxed">{description}</p>
    </div>
  </div>
);

// --- 2. COMPONENTE DEMO KPIs (Las tarjetitas de números) ---
export function DemoKPIs({ data, currency }: { data: any, currency: string }) {
  const formatMoney = (n: number) => 
    new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(n);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Venta Total */}
      <Card className="relative overflow-hidden border-emerald-100 bg-emerald-50/30 shadow-sm">
        <div className="absolute top-2 right-2 opacity-10">
          <DollarSign className="w-12 h-12 text-emerald-600"/>
        </div>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Ventas Totales
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-xl md:text-2xl font-bold text-slate-800">{formatMoney(data.ventas)}</div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1">Ingresos reales (Pagados)</p>
        </CardContent>
      </Card>
      
      {/* Tasa Cierre */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tasa de Cierre
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-xl md:text-2xl font-bold text-slate-800">{data.tasaCierre}%</div>
          <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3"/> +5% vs mes pasado
          </p>
        </CardContent>
      </Card>

      {/* Cotizaciones */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Cotizaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-xl md:text-2xl font-bold text-slate-800">{data.cotizaciones}</div>
          <p className="text-[10px] text-slate-400 mt-1">Generadas este mes</p>
        </CardContent>
      </Card>

       {/* Pendientes */}
       <Card className="shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
            En Negociación
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-xl md:text-2xl font-bold text-slate-800">{data.pendientes}</div>
          <p className="text-[10px] text-amber-600 font-medium mt-1">Oportunidad abierta</p>
        </CardContent>
      </Card>
    </div>
  )
}

// --- 3. COMPONENTE DEMO SALES CHART (El gráfico principal) ---
export function DemoSalesChart({ data }: { data: any[] }) {
  // Calculamos la tendencia simple para mostrar un badge
  const lastVal = data[data.length - 1]?.prediction || 0;
  const prevVal = data[0]?.total || 0;
  const isGrowing = lastVal > prevVal;

  return (
    <Card className="shadow-lg border-indigo-100 overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-50 pb-4">
         <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-lg text-slate-800">Tendencia de Ingresos</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Histórico real + Proyección IA (Línea punteada)</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${isGrowing ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {isGrowing ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                {isGrowing ? 'Tendencia Positiva' : 'Estable'}
            </div>
         </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id="demoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b' }}
                minTickGap={30}
            />
            <YAxis 
                fontSize={10} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `$${v/1000}k`} 
                tick={{ fill: '#64748b' }}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name === 'total' ? 'Venta Real' : 'Predicción IA'
                ]}
                labelStyle={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '0.75rem' }}
            />
            <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#6366f1" 
                fill="url(#demoGradient)" 
                strokeWidth={3} 
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
                type="monotone" 
                dataKey="prediction" 
                stroke="#8b5cf6" 
                strokeDasharray="5 5" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
            </ComposedChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
