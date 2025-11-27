import { useState } from "react";
import { DEMO_DATA, Industry } from "@/data/demoData";
import {
  DemoRadarWidget,
  DemoSearchWidget,
  DemoForecastWidget,
  OpportunityBanner,
} from "@/components/demo/DemoWidgets";
import DemoCatalog from "@/components/demo/DemoCatalog";
import { DemoKPIs, DemoSalesChart, BenefitTip } from "@/components/demo/DemoCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// CORRECCIÓN: Agregué TrendingUp a los imports
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  ArrowRight,
  Shirt,
  Hammer,
  Gem,
  Dog,
  Anvil,
  Radar,
  TrendingUp,
} from "lucide-react";

export default function DemoPage() {
  const [industry, setIndustry] = useState<Industry>("ropa");
  const data = DEMO_DATA[industry];

  const IndustryIcon = {
    ropa: Shirt,
    ferreteria: Hammer,
    belleza: Gem,
    veterinaria: Dog,
    acero: Anvil,
  }[industry];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* HEADER DE CONTROL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between sticky top-4 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Modo Demo</h2>
            <p className="text-xs text-slate-500">Simulación en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
            <SelectTrigger className="w-[200px] h-11 bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ropa">👗 Ropa</SelectItem>
              <SelectItem value="ferreteria">🛠️ Ferretería</SelectItem>
              <SelectItem value="acero">🏗️ Acero</SelectItem>
              <SelectItem value="belleza">💄 Belleza</SelectItem>
              <SelectItem value="veterinaria">🐶 Veterinaria</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-white"
            onClick={() => (window.location.href = "/register")}
          >
            Prueba Gratis <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <IndustryIcon className="w-8 h-8 text-slate-700" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{data.label}</h1>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-white p-1 border border-slate-200 h-12 rounded-xl mb-6 shadow-sm inline-flex">
            <TabsTrigger
              value="dashboard"
              className="h-10 px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-medium"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="catalogo"
              className="h-10 px-6 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 font-medium"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Catálogo Cliente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. SECCIÓN FINANCIERA */}
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Resumen Financiero</h3>
              <DemoKPIs data={data.kpis} currency="MXN" />

              <div className="mt-6">
                <BenefitTip
                  title="Tu Dinero Real vs. Promesas"
                  description="CatifyPro separa las 'cotizaciones aceptadas' del dinero real en banco. La línea punteada es nuestra IA proyectando tu cierre de mes."
                />
                <DemoSalesChart data={data.mainChartData} />
              </div>
            </section>

            {/* 2. SECCIÓN DE OPORTUNIDADES (EL CAMBIO FUERTE) */}
            <section>
              <div className="flex items-center justify-between mb-4 mt-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Inteligencia de Mercado</h3>
                <Badge className="bg-violet-100 text-violet-700 border-0 hover:bg-violet-100">AI Powered</Badge>
              </div>

              {/* BANNER GRANDE DE DINERO */}
              <OpportunityBanner value={data.opportunityValue || 50000} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-indigo-100 overflow-hidden hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="bg-white p-1.5 rounded-md shadow-sm">
                        <Radar className="w-4 h-4 text-indigo-600" />
                      </div>
                      Solicitudes de Producto
                    </CardTitle>
                  </CardHeader>
                  <DemoRadarWidget data={data.radar} />
                </Card>

                <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="bg-white p-1.5 rounded-md shadow-sm">
                        {/* AQUI SE USA EL ICONO QUE FALTABA */}
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      Lo más buscado en tu tienda
                    </CardTitle>
                  </CardHeader>
                  <DemoSearchWidget data={data.searchTerms} />
                </Card>
              </div>
            </section>

            {/* 3. FORECAST */}
            <section className="mt-8">
              <BenefitTip
                title="Predicción de Inventario"
                description="Nuestra IA analiza patrones de búsqueda y venta histórica para decirte qué productos se agotarán la próxima semana."
              />
              <DemoForecastWidget history={data.forecastHistory} />
            </section>
          </TabsContent>

          <TabsContent value="catalogo" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
              <div className="p-3 bg-slate-50 text-center text-xs font-medium text-slate-500 border-b flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Vista previa del cliente
              </div>
              <DemoCatalog products={data.products} color={data.colors.primary} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
