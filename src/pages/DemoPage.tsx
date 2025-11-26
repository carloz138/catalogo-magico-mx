import { useState } from "react";
import { DEMO_DATA, Industry } from "@/data/demoData";
import { DemoRadarWidget, DemoSearchWidget, DemoForecastWidget } from "@/components/demo/DemoWidgets";
import DemoCatalog from "@/components/demo/DemoCatalog";
import { DemoKPIs, DemoSalesChart, BenefitTip } from "@/components/demo/DemoCharts"; // Asegúrate de importar los que hicimos antes o ponlos aqui
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShoppingCart, Settings, ArrowRight, Shirt, Hammer, Gem, Dog, Anvil } from "lucide-react";

export default function DemoPage() {
  const [industry, setIndustry] = useState<Industry>("ropa");
  const data = DEMO_DATA[industry];

  const IndustryIcon = {
    ropa: Shirt, ferreteria: Hammer, belleza: Gem, veterinaria: Dog, acero: Anvil
  }[industry];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* CONTROL BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between sticky top-4 z-40">
         <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Settings className="w-6 h-6 animate-spin-slow" />
             </div>
             <div>
                 <h2 className="font-bold text-slate-900 text-lg">Modo Demo</h2>
                 <p className="text-xs text-slate-500">Prueba cómo se ve tu negocio</p>
             </div>
         </div>
         <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
             <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                 <SelectTrigger className="w-[200px] h-11 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                 <SelectContent>
                     <SelectItem value="ropa">👗 Ropa</SelectItem>
                     <SelectItem value="ferreteria">🛠️ Ferretería</SelectItem>
                     <SelectItem value="acero">🏗️ Acero</SelectItem>
                     <SelectItem value="belleza">💄 Belleza</SelectItem>
                     <SelectItem value="veterinaria">🐶 Veterinaria</SelectItem>
                 </SelectContent>
             </Select>
             <Button className="h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" onClick={() => window.location.href='/register'}>
                Crear Cuenta Real <ArrowRight className="w-4 h-4 ml-2"/>
             </Button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <IndustryIcon className="w-8 h-8 text-slate-400" />
            <h1 className="text-3xl font-bold text-slate-800">{data.label}</h1>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-white p-1 border border-slate-200 h-12 rounded-xl mb-6 shadow-sm">
                <TabsTrigger value="dashboard" className="h-10 px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                    <LayoutDashboard className="w-4 h-4 mr-2"/> Dashboard
                </TabsTrigger>
                <TabsTrigger value="catalogo" className="h-10 px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                    <ShoppingCart className="w-4 h-4 mr-2"/> Catálogo Cliente
                </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. KPIs */}
                <DemoKPIs data={data.kpis} currency="MXN" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 2. MAIN CHART */}
                    <div className="lg:col-span-2 space-y-6">
                        <BenefitTip title="Ventas Reales vs Proyección" description="Este gráfico separa el dinero en banco de las promesas. La línea punteada es nuestra IA prediciendo tu próxima semana." />
                        {/* Aquí usa el DemoSalesChart que creamos en el paso anterior, si no lo tienes dime para pasartelo de nuevo, asumo que ya lo tienes del mensaje previo */}
                        {/* <DemoSalesChart data={...} />  <- Asegúrate de importarlo */}
                    </div>

                    {/* 3. WIDGETS COLUMN */}
                    <div className="space-y-6">
                        <Card className="shadow-lg border-indigo-100 overflow-hidden">
                             <CardHeader className="bg-indigo-50/50 pb-3">
                                <CardTitle className="text-sm flex justify-between">
                                    <span>Radar de Oportunidades</span>
                                    <Badge>IA</Badge>
                                </CardTitle>
                             </CardHeader>
                             <div className="p-4 bg-yellow-50 text-yellow-800 text-xs mb-0 border-b border-yellow-100">
                                💡 <strong>Beneficio:</strong> Detecta productos que te piden pero no vendes.
                             </div>
                             <DemoRadarWidget data={data.radar} />
                        </Card>

                        <Card className="shadow-lg border-slate-200">
                             <CardHeader className="pb-3"><CardTitle className="text-sm">Términos de Búsqueda</CardTitle></CardHeader>
                             <div className="p-4 bg-blue-50 text-blue-800 text-xs mb-0 border-b border-blue-100">
                                💡 <strong>Beneficio:</strong> Conoce qué buscan tus clientes en tu catálogo.
                             </div>
                             <DemoSearchWidget data={data.searchTerms} />
                        </Card>
                    </div>
                </div>

                {/* 4. FORECAST FULL WIDTH */}
                <div className="mt-8">
                     <BenefitTip title="Predicción de Demanda" description="¿Debes comprar stock? Nuestra IA analiza tu historial y te dice qué esperar la próxima semana." />
                     <DemoForecastWidget history={data.forecastHistory} />
                </div>
            </TabsContent>

            <TabsContent value="catalogo" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-4 bg-slate-100 text-center text-sm text-slate-500 border-b">
                        Así es como tus clientes verán tu tienda digital 👇
                    </div>
                    <DemoCatalog products={data.products} color={data.colors.primary} />
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
