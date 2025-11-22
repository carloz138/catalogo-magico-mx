import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, DollarSign, Package, TrendingDown, Loader2, ArrowUpRight } from "lucide-react";

// 1. Interfaz basada en el retorno de tu RPC
interface DeadStockItem {
  product_name: string;
  variant_name: string;
  sku: string | null;
  current_stock: number;
  last_sale_date: string | null;
  days_since_last_sale: number;
  potential_loss_value: number; // Viene en centavos
}

export const DeadStockAnalysis = () => {
  // Gating: Solo plan PRO ($599) o superior
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("recomendaciones");
  
  // Estado
  const [data, setData] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState("60"); // Default 60 días
  const [totalLoss, setTotalLoss] = useState(0);

  useEffect(() => {
    if (isAllowed && !loadingPlan) {
      fetchDeadStock();
    }
  }, [isAllowed, loadingPlan, daysFilter]);

  const fetchDeadStock = async () => {
    setLoading(true);
    try {
      // LLAMADA A TU RPC OPTIMIZADA
      const { data: rpcData, error } = await supabase.rpc('get_dead_stock_report', { 
        days_inactive: parseInt(daysFilter) 
      });

      if (error) throw error;

      if (rpcData) {
        setData(rpcData);
        // Calculamos total (sumando centavos y dividiendo al final)
        const totalCents = rpcData.reduce((acc: number, item: DeadStockItem) => acc + item.potential_loss_value, 0);
        setTotalLoss(totalCents / 100);
      }
    } catch (error) {
      console.error("Error fetching dead stock report:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para moneda
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Preparar datos para el gráfico (Top 5 por valor)
  const chartData = [...data]
    .sort((a, b) => b.potential_loss_value - a.potential_loss_value)
    .slice(0, 5)
    .map(item => ({
      name: item.variant_name !== 'N/A' ? `${item.product_name} (${item.variant_name})` : item.product_name,
      value: item.potential_loss_value / 100, // A pesos para el gráfico
      stock: item.current_stock
    }));

  // --- RENDERS ---

  if (loadingPlan) return <div className="h-[500px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  
  if (!isAllowed) {
    return (
      <div className="h-full min-h-[500px]">
        {React.cloneElement(UpsellComponent as React.ReactElement, {
            featureName: "Análisis de Inventario Muerto",
            description: "Detecta automáticamente productos estancados y libera flujo de efectivo."
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Auditoría de Stock Muerto
          </h2>
          <p className="text-slate-500">Productos sin movimiento de ventas reciente.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-medium">Considerar inactivo tras:</span>
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200">
              <SelectValue placeholder="Días" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Días (Estricto)</SelectItem>
              <SelectItem value="60">60 Días (Estándar)</SelectItem>
              <SelectItem value="90">90 Días (Laxo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : data.length === 0 ? (
        // ESTADO "SANO"
        <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                    <TrendingDown className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800">Inventario en Movimiento</h3>
                <p className="text-emerald-700 max-w-md mt-2">
                    No se encontraron productos inactivos por más de {daysFilter} días. Tu rotación de inventario es saludable.
                </p>
            </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase">Capital Congelado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{formatMoney(totalLoss)}</div>
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                        Dinero en productos sin vender hace {daysFilter}+ días
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-slate-400 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase">Items Estancados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{data.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Variantes o productos únicos afectados</p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white shadow-sm flex flex-col justify-center items-center text-center p-6">
                 <p className="text-sm text-slate-300 mb-3">¿Necesitas liquidez?</p>
                 <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                    Generar Oferta Flash <ArrowUpRight className="w-4 h-4 ml-2" />
                 </Button>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GRÁFICO (Top 5) */}
            <Card className="lg:col-span-1 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Top 5 Mayor Impacto</CardTitle>
                    <CardDescription>Productos reteniendo más valor</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={100} 
                                tick={{fontSize: 10}} 
                                interval={0}
                            />
                            <Tooltip 
                                formatter={(value: number) => formatMoney(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#94a3b8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* TABLA DETALLADA */}
            <Card className="lg:col-span-2 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Detalle de Inventario</CardTitle>
                        <Badge variant="outline" className="bg-white">Ordenado por valor</Badge>
                    </div>
                </CardHeader>
                <div className="max-h-[300px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto / Variante</TableHead>
                                <TableHead className="text-center">Días Inactivo</TableHead>
                                <TableHead className="text-center">Stock</TableHead>
                                <TableHead className="text-right">Valor Retenido</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, idx) => (
                                <TableRow key={idx} className="group hover:bg-slate-50">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{item.product_name}</span>
                                            {item.variant_name !== 'N/A' && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Package className="w-3 h-3" /> {item.variant_name}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400">SKU: {item.sku || 'Sin SKU'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className={`${item.days_since_last_sale > 90 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.days_since_last_sale} días
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-slate-600">
                                        {item.current_stock}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-700">
                                        {formatMoney(item.potential_loss_value / 100)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
