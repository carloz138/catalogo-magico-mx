import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertCircle, TrendingUp, BrainCircuit, Search, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// --- WIDGET 1: DEMO RADAR ---
export const DemoRadarWidget = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-white min-h-[300px] relative overflow-hidden rounded-lg border border-slate-100 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Producto Solicitado</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((req) => (
            <TableRow key={req.id} className="hover:bg-indigo-50/30">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    {req.producto_nombre}
                    <Badge className="h-5 px-1 bg-emerald-100 text-emerald-700 border-0 text-[10px]">Nuevo</Badge>
                  </span>
                </div>
              </TableCell>
              <TableCell><Badge variant="secondary">{req.cantidad} pzas</Badge></TableCell>
              <TableCell className="text-slate-600">{req.cliente}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" className="h-8 text-xs border-indigo-200 text-indigo-700">
                  <MessageSquare className="w-3 h-3 mr-1.5" /> Cotizar
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
              <Badge variant="secondary">{term.count} búsquedas</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(term.count / maxCount) * 100}%` }} 
                />
              </div>
              {term.zeroResults > 0 ? (
                <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> {term.zeroResults} perdidos
                </span>
              ) : (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                   <TrendingUp className="w-3 h-3"/> Alta conversión
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// --- WIDGET 3: DEMO FORECAST (Con Lógica Local de Regresión Simuleda) ---
export const DemoForecastWidget = ({ history }: { history: any[] }) => {
    // Simulamos la regresión lineal simple
    const dataPoints = history.map((d, i) => ({ x: i, y: d.count, date: d.date }));
    // Pendiente simple aproximada (ultimo - primero / n)
    const slope = (dataPoints[dataPoints.length-1].y - dataPoints[0].y) / dataPoints.length;
    
    const chartData = [
        ...dataPoints.slice(-30).map(p => ({
            date: format(parseISO(p.date), "dd MMM", {locale: es}),
            real: p.y,
            predicted: null
        })),
        ...Array.from({length: 7}, (_, i) => ({
            date: format(addDays(new Date(), i+1), "dd MMM", {locale: es}),
            real: null,
            predicted: dataPoints[dataPoints.length-1].y + (slope * (i+1))
        }))
    ];

    return (
        <Card className="shadow-none border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        Predicción de Demanda
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">IA Activa</Badge>
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
                        <Tooltip />
                        <ReferenceLine x={format(new Date(), "dd MMM", {locale: es})} stroke="#ef4444" strokeDasharray="3 3" />
                        <Area type="monotone" dataKey="real" stroke="#4f46e5" fill="url(#colorReal)" strokeWidth={2} />
                        <Area type="monotone" dataKey="predicted" stroke="#10b981" fill="url(#colorPred)" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
