import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Package, TrendingDown, Loader2, Sparkles, ArrowRight } from "lucide-react";

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

// Nueva interfaz para la sugerencia de IA
interface AiSuggestion {
  strategy: string; // Nombre de la estrategia
  discount: number; // % recomendado
  color: string; // Color del badge
  urgencyScore: number; // 0 a 100
  reason: string; // Explicación humana
}

// 1. CAMBIO DE INTERFAZ: Aceptamos userId
interface DeadStockProps {
  userId: string;
}

export const DeadStockAnalysis = ({ userId }: DeadStockProps) => {
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("recomendaciones");

  const [data, setData] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState("60");
  const [totalLoss, setTotalLoss] = useState(0);

  // Estado para el valor máximo encontrado (para normalizar la IA)
  const [maxItemValue, setMaxItemValue] = useState(0);

  useEffect(() => {
    // 2. DEPENDENCIA: userId
    if (isAllowed && userId && !loadingPlan) {
      fetchDeadStock();
    }
  }, [isAllowed, loadingPlan, daysFilter, userId]);

  const fetchDeadStock = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 3. SOLUCIÓN TYPESCRIPT: 'as any' para evitar error de tipado RPC
      // Además pasamos p_user_id para asegurar contexto de usuario
      const { data: rpcData, error } = await supabase.rpc("get_dead_stock_report" as any, {
        days_inactive: parseInt(daysFilter),
        p_user_id: userId,
      });

      if (error) throw error;

      if (rpcData) {
        // 4. CASTING: Forzamos el tipo para que TS sepa que esto es un array de DeadStockItem
        const typedData = rpcData as unknown as DeadStockItem[];

        setData(typedData);

        const totalCents = typedData.reduce((acc, item) => acc + (item.potential_loss_value || 0), 0);
        setTotalLoss(totalCents / 100);

        // Encontramos el producto más caro para usarlo de referencia en la IA
        const maxVal = Math.max(...typedData.map((i) => i.potential_loss_value || 0));
        setMaxItemValue(maxVal);
      }
    } catch (error) {
      console.error("Error fetching dead stock report:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 🧠 CEREBRO DE IA (SISTEMA EXPERTO) 🧠
  const getAiStrategy = (item: DeadStockItem): AiSuggestion => {
    // 1. Normalizar variables (de 0 a 1)
    const timeScore = Math.min(item.days_since_last_sale / 180, 1); // 180 días es el tope de gravedad
    const valueScore = maxItemValue > 0 ? item.potential_loss_value / maxItemValue : 0;

    // 2. Calcular Índice de Urgencia Ponderado
    const urgencyIndex = valueScore * 0.6 + timeScore * 0.4;
    const urgencyScore = Math.round(urgencyIndex * 100);

    // 3. Árbol de Decisión (Decision Tree)
    if (urgencyIndex > 0.7) {
      return {
        strategy: "Liquidación Total",
        discount: 50,
        color: "bg-red-100 text-red-700 border-red-200",
        urgencyScore,
        reason: "Alto valor retenido crítico",
      };
    } else if (urgencyIndex > 0.4) {
      return {
        strategy: "Oferta Flash",
        discount: 30,
        color: "bg-amber-100 text-amber-700 border-amber-200",
        urgencyScore,
        reason: "Inventario envejeciendo",
      };
    } else {
      return {
        strategy: "Bundle / Regalo",
        discount: 15,
        color: "bg-blue-100 text-blue-700 border-blue-200",
        urgencyScore,
        reason: "Bajo impacto financiero",
      };
    }
  };

  const chartData = [...data]
    .sort((a, b) => b.potential_loss_value - a.potential_loss_value)
    .slice(0, 5)
    .map((item) => ({
      name: item.variant_name !== "N/A" ? `${item.product_name} (${item.variant_name})` : item.product_name,
      value: item.potential_loss_value / 100,
      stock: item.current_stock,
    }));

  // --- RENDERS ---

  if (loadingPlan) return <div className="h-[500px] w-full bg-slate-50 animate-pulse rounded-xl" />;

  if (!isAllowed) {
    return (
      <div className="h-full min-h-[500px]">
        {React.cloneElement(UpsellComponent as React.ReactElement, {
          featureName: "IA de Inventarios",
          description: "Nuestra IA analiza tu stock muerto y te dice exactamente qué descuento aplicar para venderlo.",
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Auditoría con IA
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs ml-2 border-indigo-200">
              <Sparkles className="w-3 h-3 mr-1" /> Smart Suggestions
            </Badge>
          </h2>
          <p className="text-slate-500">Detección de stock muerto y sugerencias de precios.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200">
              <SelectValue placeholder="Días" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Días</SelectItem>
              <SelectItem value="60">60 Días</SelectItem>
              <SelectItem value="90">90 Días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : data.length === 0 ? (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-emerald-100 p-4 rounded-full mb-4">
              <TrendingDown className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800">Inventario Sano</h3>
            <p className="text-emerald-700 max-w-md mt-2">
              Tu estrategia funciona. No hay recomendaciones de liquidación por ahora.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top Riesgos Financieros</CardTitle>
                <CardDescription>Donde más dinero pierdes</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} interval={0} />
                    <Tooltip formatter={(value: number) => formatMoney(value)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm overflow-hidden border-indigo-100">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Recomendaciones de IA
                  </CardTitle>
                  <Badge variant="outline" className="bg-white text-xs">
                    Motor de Precios v1.0
                  </Badge>
                </div>
              </CardHeader>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Estrategia IA</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, idx) => {
                      const ai = getAiStrategy(item);
                      return (
                        <TableRow key={idx} className="group hover:bg-slate-50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{item.product_name}</span>
                              {item.variant_name !== "N/A" && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Package className="w-3 h-3" /> {item.variant_name}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 mt-1">
                                Valor retenido: {formatMoney(item.potential_loss_value / 100)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-700">{item.days_since_last_sale} días</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${ai.urgencyScore > 70 ? "bg-red-500" : "bg-amber-400"}`}
                                  style={{ width: `${ai.urgencyScore}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant="outline" className={`${ai.color} font-medium`}>
                              {ai.strategy}
                            </Badge>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Sugerido: <span className="font-bold">-{ai.discount}%</span>
                            </p>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 text-xs"
                            >
                              Aplicar <ArrowRight className="w-3 h-3 ml-1" />
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
        </>
      )}
    </div>
  );
};
