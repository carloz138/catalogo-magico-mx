import { useState } from "react";
import { DEMO_DATA, Industry } from "@/data/demoData";
import { DemoKPIs, DemoSalesChart, BenefitTip } from "@/components/demo/DemoCharts";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LayoutDashboard, ShoppingCart, Settings, Users, Shirt, Hammer, Gem, Dog, Anvil } from "lucide-react";

export default function DemoPage() {
  const [industry, setIndustry] = useState<Industry>("ropa");
  const [view, setView] = useState("dashboard");

  const currentData = DEMO_DATA[industry];

  // Icono dinámico según industria
  const IndustryIcon = {
    ropa: Shirt,
    ferreteria: Hammer,
    belleza: Gem,
    veterinaria: Dog,
    acero: Anvil // Icono placeholder para acero (o usar uno genérico)
  }[industry] || Settings;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      
      {/* --- HEADER DE CONTROL (BARRA DE DEMO) --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Configurador de Demo</h2>
            <p className="text-xs text-slate-500">Simula la experiencia de tu cliente ideal</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-64">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Industria</label>
             <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
              <SelectTrigger className="w-full font-medium">
                <SelectValue placeholder="Selecciona giro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ropa">👗 Ropa y Moda</SelectItem>
                <SelectItem value="ferreteria">🛠️ Ferretería</SelectItem>
                <SelectItem value="acero">🏗️ Aceros (B2B)</SelectItem>
                <SelectItem value="belleza">💄 Belleza</SelectItem>
                <SelectItem value="veterinaria">🐶 Veterinaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button className="h-10 mt-5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 shadow-md" onClick={() => alert("Aquí iría al registro real")}>
            Iniciar Prueba Real <ArrowRight className="w-4 h-4 ml-2"/>
          </Button>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TÍTULO DEL DASHBOARD SIMULADO */}
        <div className="flex items-center gap-3 mb-2">
            <IndustryIcon className="w-8 h-8 text-slate-400" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                {currentData.label} <span className="text-slate-300 font-light">| Dashboard</span>
            </h1>
            <Badge variant="outline" className="ml-2 border-purple-200 bg-purple-50 text-purple-700">Plan Enterprise 🚀</Badge>
        </div>

        <Tabs defaultValue="dashboard" value={view} onValueChange={setView} className="w-full">
          <TabsList className="bg-white p-1 border border-slate-200 rounded-xl mb-6">
            <TabsTrigger value="dashboard" className="px-6"><LayoutDashboard className="w-4 h-4 mr-2"/> Analítica</TabsTrigger>
            <TabsTrigger value="catalogo" className="px-6"><ShoppingCart className="w-4 h-4 mr-2"/> Catálogo & AI</TabsTrigger>
            <TabsTrigger value="pedidos" className="px-6" disabled><Users className="w-4 h-4 mr-2"/> Pedidos (Pronto)</TabsTrigger>
          </TabsList>

          {/* VISTA 1: DASHBOARD ANALYTICS */}
          <TabsContent value="dashboard" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            
            {/* SECCIÓN 1: KPIs & EDUCACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                     <BenefitTip 
                        title="¿Por qué importa esto?" 
                        description="En CatifyPro, una 'Venta' solo cuenta cuando el dinero entró al banco. Tus clientes verán su flujo de caja real, no promesas." 
                     />
                    <DemoKPIs data={currentData.kpis} currency={currentData.currency} />
                </div>
            </div>

            {/* SECCIÓN 2: GRÁFICO PRINCIPAL & PREDICCIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-lg border-indigo-100">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Tendencia de Ingresos + IA</span>
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0">Predicción Activa</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DemoSalesChart data={currentData.chartData} />
                    </CardContent>
                </Card>

                {/* WIDGETS DE INTELIGENCIA (SIDEBAR) */}
                <div className="space-y-6">
                    
                    {/* Radar de Mercado */}
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                Radar de Mercado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-300 text-sm mb-4">
                                {currentData.insights.radar}
                            </p>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Beneficio</div>
                            <p className="text-xs text-emerald-400">
                                Detecta productos que te piden pero no vendes. ¡Vende más!
                            </p>
                        </CardContent>
                    </Card>

                    {/* Search Logs */}
                    <Card className="border-slate-200 shadow-sm">
                         <CardHeader>
                            <CardTitle className="text-sm text-slate-600">Lo más buscado hoy</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-slate-800 font-medium text-sm mb-2">
                                "{currentData.insights.search}"
                            </p>
                             <BenefitTip 
                                title="Inteligencia de Búsqueda" 
                                description="Si 50 clientes buscan 'Rojo' y no tienes, estás perdiendo dinero. CatifyPro te avisa." 
                             />
                        </CardContent>
                    </Card>

                </div>
            </div>
          </TabsContent>

          {/* VISTA 2: CATÁLOGO (PLACEHOLDER PARA EL SIGUIENTE PASO) */}
          <TabsContent value="catalogo">
             <div className="h-64 flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-xl">
                <ShoppingCart className="w-12 h-12 text-slate-300 mb-4"/>
                <p className="text-slate-500 font-medium">Aquí cargaremos el Demo del Catálogo + Recomendador IA</p>
                <Button variant="link" onClick={() => alert("¡Hagámoslo en el siguiente paso!")}>Configurar siguiente paso</Button>
             </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
