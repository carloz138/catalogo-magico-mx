import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, BrainCircuit, Radar, Sparkles, ArrowUpRight, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Helper MXN
const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(val);

// --- WIDGET 0: OPORTUNIDAD DESTACADA ---
export const OpportunityBanner = ({ value }: { value: number }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-xl shadow-indigo-200 mb-6 group cursor-pointer hover:scale-[1.01] transition-transform">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Radar className="w-48 h-48 text-white animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Inteligencia Artificial
            </span>
            <span className="text-indigo-200 text-xs">Detectado hace 10 min</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {formatMoney(value)} <span className="text-indigo-200 text-lg font-normal">en ventas potenciales</span>
          </h3>
          <p className="text-indigo-100 max-w-lg">
            Detectamos <strong>5 clientes</strong> en tu red buscando productos que no tienes en stock. ¡Consíguelos y
            cierra la venta hoy!
          </p>
        </div>
        <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold shadow-lg border-0 h-12 px-6">
          Ver Oportunidades <ArrowUpRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// --- WIDGET 1: DEMO RADAR ---
export const DemoRadarWidget = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white min-h-[300px] relative overflow-hidden rounded-lg border border-slate-100 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Producto Solicitado</TableHead>
            <TableHead>Potencial</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((req) => (
            <TableRow key={req.id} className="hover:bg-indigo-50/30 group">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-slate-700 group-hover:text-indigo-700 transition-colors">
                    {req.producto_nombre}
                    {req.status === "urgente" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400">{req.cantidad} unidades requeridas</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                  <DollarSign className="w-3 h-3" /> {req.potential?.toLocaleString("es-MX")}
                </div>
              </TableCell>
              <TableCell className="text-slate-600">{req.cliente}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  className="h-8 text-xs bg-slate-900 hover:bg-indigo-600 text-white shadow-md transition-all"
                >
                  Capturar Venta
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// --- WIDGET 2: DEMO SEARCH ---
export const DemoSearchWidget = ({ data }: { data: any[] }) => {
  const maxCount = Math.max(...data.map((d: any) => d.count));

  return (
    <ScrollArea className="h-[300px] w-full bg-white rounded-lg border border-slate-100 shadow-sm">
      <div className="divide-y divide-slate-100">
        {data.map((term, i) => (
          <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 capitalize">{term.term}</span>
              <Badge variant="outline" className="text-slate-500 font-normal">
                {term.count} búsquedas
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${term.zeroResults > 0 ? "bg-amber-500" : "bg-indigo-500"}`}
                  style={{ width: `${(term.count / maxCount) * 100}%` }}
                />
              </div>
              {term.zeroResults > 0 ? (
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 uppercase tracking-tight">
                  <AlertCircle className="w-3 h-3" /> Oportunidad
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-tight">
                  <TrendingUp className="w-3 h-3" /> Popular
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// --- WIDGET 3: FORECAST ---
export const DemoForecastWidget = ({ history }: { history: any[] }) => {
  const dataPoints = history.map((d, i) => ({ x: i, y: d.count, date: d.date }));
  const slope = (dataPoints[dataPoints.length - 1].y - dataPoints[0].y) / dataPoints.length;

  const chartData = [
    ...dataPoints.slice(-30).map((p) => ({
      date: format(parseISO(p.date), "dd MMM", { locale: es }),
      real: p.y,
      predicted: null,
    })),
    ...Array.from({ length: 7 }, (_, i) => ({
      date: format(addDays(new Date(), i + 1), "dd MMM", { locale: es }),
      real: null,
      predicted: dataPoints[dataPoints.length - 1].y + slope * (i + 1),
    })),
  ];

  return (
    <Card className="shadow-none border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            Predicción de Demanda
          </CardTitle>
          <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-sm animate-pulse">IA Activa</Badge>
        </div>
        <CardDescription>Análisis predictivo a 7 días basado en historial.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
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
            <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <ReferenceLine x={format(new Date(), "dd MMM", { locale: es })} stroke="#ef4444" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="real" stroke="#4f46e5" fill="url(#colorReal)" strokeWidth={2} />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              fill="url(#colorPred)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
