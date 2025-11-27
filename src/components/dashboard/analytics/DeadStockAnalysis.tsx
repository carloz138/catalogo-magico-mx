import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  Loader2,
  Sparkles,
  ArrowRight,
  Tag,
  Percent,
  CheckCircle2,
} from "lucide-react";

// Interfaces
interface DeadStockItem {
  product_name: string;
  variant_name: string;
  sku: string | null;
  current_stock: number;
  last_sale_date: string | null;
  days_since_last_sale: number;
  potential_loss_value: number; // centavos
}

interface AiSuggestion {
  action_type: "LIQUIDATION" | "BUNDLE" | "PROMOTION";
  title: string;
  description: string;
  discount_suggested: number;
  urgency_score: number; // 0-100
  color_class: string;
}

interface DeadStockProps {
  userId: string;
}

export const DeadStockAnalysis = ({ userId }: DeadStockProps) => {
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("recomendaciones");

  const [data, setData] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState("60");
  const [currencyConfig] = useState({ locale: "es-MX", currency: "MXN" });

  useEffect(() => {
    if (isAllowed && userId && !loadingPlan) {
      fetchDeadStock();
    }
  }, [isAllowed, loadingPlan, daysFilter, userId]);

  const fetchDeadStock = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: rpcData, error } = await supabase.rpc("get_dead_stock_report" as any, {
        days_inactive: parseInt(daysFilter),
        p_user_id: userId,
      });

      if (error) throw error;

      if (rpcData) {
        // Ordenamos por "Dolor Financiero" (Valor * Días) para que la IA priorice
        const sorted = (rpcData as unknown as DeadStockItem[]).sort(
          (a, b) => b.potential_loss_value * b.days_since_last_sale - a.potential_loss_value * a.days_since_last_sale,
        );
        setData(sorted);
      }
    } catch (error) {
      console.error("Error fetching dead stock report:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 CEREBRO DE RECOMENDACIÓN (Rules Engine)
  const generateAiStrategy = (item: DeadStockItem): AiSuggestion => {
    const value = item.potential_loss_value / 100; // a pesos
    const days = item.days_since_last_sale;

    // Cálculo de "Índice de Dolor" (Pain Index)
    // Combina el valor monetario atrapado con el tiempo de inactividad
    const painIndex = value * 0.4 + days * 10;

    // Normalizamos score 0-100 (aprox)
    let score = Math.min(100, Math.round(painIndex / 10));

    // Lógica Prescriptiva
    if (days > 120) {
      // Caso Crítico: Stock Zombie (> 4 meses)
      return {
        action_type: "LIQUIDATION",
        title: "Liquidación Total",
        description: "Este capital está muerto. Recupéralo al costo.",
        discount_suggested: 50,
        urgency_score: score,
        color_class: "bg-red-100 text-red-700 border-red-200",
      };
    } else if (value < 500 && days > 60) {
      // Caso Bajo Valor: Ideal para Bundles (Packs)
      return {
        action_type: "BUNDLE",
        title: "Crear Pack (Bundle)",
        description: "Úsalo de regalo o 'Add-on' en productos populares.",
        discount_suggested: 20,
        urgency_score: score,
        color_class: "bg-blue-100 text-blue-700 border-blue-200",
      };
    } else {
      // Caso Estándar: Promoción Flash
      return {
        action_type: "PROMOTION",
        title: "Oferta Flash",
        description: "Incentiva la rotación rápida este fin de semana.",
        discount_suggested: 25,
        urgency_score: score,
        color_class: "bg-amber-100 text-amber-700 border-amber-200",
      };
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (loadingPlan) return <div className="h-[500px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!isAllowed) return <div className="h-full min-h-[500px]">{UpsellComponent}</div>;

  const chartData = data.slice(0, 5).map((i) => ({
    name: i.product_name.substring(0, 15) + "...",
    value: i.potential_loss_value / 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Auditoría de Capital
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs ml-2 border-indigo-200">
              <Sparkles className="w-3 h-3 mr-1" /> AI Advisor
            </Badge>
          </h2>
          <p className="text-slate-500 text-sm">Detectamos dinero estancado y calculamos la mejor salida.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200">
              <SelectValue placeholder="Días" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Días sin venta</SelectItem>
              <SelectItem value="60">60 Días sin venta</SelectItem>
              <SelectItem value="90">90 Días sin venta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : data.length === 0 ? (
        <Card className="bg-emerald-50 border-emerald-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-emerald-100 p-4 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800">Inventario Saludable</h3>
            <p className="text-emerald-700 max-w-md mt-2">
              ¡Excelente gestión! No tienes productos estancados por más de {daysFilter} días.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Lateral */}
          <Card className="lg:col-span-1 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-slate-500 font-bold">
                Top Capital Congelado
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                  />
                  <Tooltip formatter={(val: number) => `$${val}`} cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabla Inteligente */}
          <Card className="lg:col-span-2 shadow-sm overflow-hidden border-indigo-100 bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" /> Acciones Recomendadas
                </CardTitle>
              </div>
            </CardHeader>
            <div className="max-h-[350px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Diagnóstico IA</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, idx) => {
                    const strategy = generateAiStrategy(item);
                    return (
                      <TableRow key={idx} className="group hover:bg-slate-50/80 transition-colors">
                        <TableCell className="w-[40%]">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 text-sm line-clamp-1">{item.product_name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-5 text-slate-500 font-normal">
                                {item.days_since_last_sale} días parado
                              </Badge>
                              <span className="text-xs text-slate-400">
                                Retiene {formatMoney(item.potential_loss_value)}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center w-[35%]">
                          <div
                            className={`inline-flex flex-col items-start p-2 rounded-lg border ${strategy.color_class} bg-opacity-50 w-full`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="font-bold text-xs flex items-center gap-1">
                                {strategy.action_type === "LIQUIDATION" && <AlertTriangle className="w-3 h-3" />}
                                {strategy.action_type === "BUNDLE" && <Package className="w-3 h-3" />}
                                {strategy.title}
                              </span>
                              <Badge className="bg-white/50 text-current border-0 text-[10px] h-4 px-1">
                                -{strategy.discount_suggested}%
                              </Badge>
                            </div>
                            <span className="text-[10px] text-left leading-tight opacity-90">
                              {strategy.description}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right w-[25%]">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-medium"
                          >
                            Aplicar Oferta <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
