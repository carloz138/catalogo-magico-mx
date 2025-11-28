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
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowRight,
  Shirt,
  Hammer,
  Gem,
  Dog,
  Anvil,
  TrendingUp,
  MonitorPlay,
  Ticket,
} from "lucide-react";
import WelcomeTour from "@/components/demo/WelcomeTour";
// 👇 IMPORTAR EL COMPONENTE NUEVO
import { DemoHotspot } from "@/components/demo/DemoHotspot";

export default function DemoPage() {
  const [industry, setIndustry] = useState<Industry>("ropa");
  const [showWelcome, setShowWelcome] = useState(true);
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
      <WelcomeTour isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur px-3 py-1 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={() => setShowWelcome(true)}
            >
              <MonitorPlay className="w-3 h-3" /> Repetir Tour
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Descubre CatifyPro</h1>
            <p className="text-slate-400 text-lg">Adapta la plataforma a tu industria en un clic.</p>
          </div>

          <div className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">👀 Cambia de industria</span>
            <div className="flex gap-2 w-full">
              <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                <SelectTrigger className="w-full md:w-[280px] h-12 bg-white text-slate-900 border-0 font-medium text-base shadow-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ropa">👗 Ropa & Moda</SelectItem>
                  <SelectItem value="ferreteria">🛠️ Ferretería Industrial</SelectItem>
                  <SelectItem value="acero">🏗️ Aceros & Construcción</SelectItem>
                  <SelectItem value="belleza">💄 Belleza & Cosméticos</SelectItem>
                  <SelectItem value="veterinaria">🐶 Veterinaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-2">
            <Button
              className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 shadow-lg shadow-emerald-900/50"
              onClick={() => (window.location.href = "/register")}
            >
              Crear Cuenta Real <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-900/30 px-2 py-1 rounded-md border border-emerald-900/50">
              <Ticket className="w-3 h-3" /> Código: <span className="text-white font-bold">CYBER-AI-3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-8 pl-2">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100">
            <IndustryIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{data.label}</h2>
            <p className="text-slate-500 text-sm">Así verías tus datos reales.</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-white p-1.5 border border-slate-200 h-14 rounded-2xl mb-8 shadow-sm inline-flex">
            <TabsTrigger
              value="dashboard"
              className="h-11 px-8 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-medium text-base transition-all"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Inteligencia
            </TabsTrigger>
            <TabsTrigger
              value="catalogo"
              className="h-11 px-8 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-medium text-base transition-all"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Catálogo Interactivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <DemoKPIs data={data.kpis} currency="MXN" />
              <div className="mt-8">
                <BenefitTip
                  title="Tu Dinero Real vs. Promesas"
                  description="CatifyPro separa las 'cotizaciones aceptadas' del dinero real en banco."
                />
                <DemoSalesChart data={data.mainChartData} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 mt-12">
                <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider">
                  Oportunidades Detectadas
                </h3>
                <Badge className="bg-indigo-100 text-indigo-700 border-0 hover:bg-indigo-100 px-3 py-1">
                  AI Powered
                </Badge>
              </div>

              <OpportunityBanner value={data.opportunityValue || 50000} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {/* 🔴 HOTSPOT RADAR */}
                <DemoHotspot
                  className="top-[-10px] right-[-10px] z-20"
                  title="Radar de Demanda"
                  description="Aquí ves lo que tus clientes te piden pero NO tienes en catálogo. Te dicen producto y cantidad exacta para que sepas qué comprar."
                  side="left"
                />

                <Card className="shadow-lg border-indigo-100 overflow-hidden hover:shadow-xl transition-shadow relative">
                  <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full absolute top-0 right-0 -mt-1 -mr-1"></div>
                        <ShoppingCart className="w-5 h-5 text-indigo-600" />
                      </div>
                      Solicitudes de Producto (Radar)
                    </CardTitle>
                  </CardHeader>
                  <DemoRadarWidget data={data.radar} />
                </Card>

                {/* 🔴 HOTSPOT SEARCH LOGS */}
                <div className="relative">
                  <DemoHotspot
                    className="top-[-10px] right-[-10px] z-20"
                    title="Search Logs (Tendencias)"
                    description="Descubre qué buscan tus clientes. Identifica productos encontrados (éxito) y productos no encontrados (oportunidades perdidas)."
                    side="left"
                  />
                  <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-shadow h-full">
                    <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        Lo más buscado en tu tienda
                      </CardTitle>
                    </CardHeader>
                    <DemoSearchWidget data={data.searchTerms} />
                  </Card>
                </div>
              </div>
            </section>

            <section className="mt-8">
              <BenefitTip
                title="Predicción de Inventario"
                description="Nuestra IA analiza patrones de búsqueda y venta histórica para decirte qué productos se agotarán la próxima semana."
              />
              <DemoForecastWidget productsData={data.topDemandProducts} />
            </section>
          </TabsContent>

          <TabsContent value="catalogo" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden min-h-[700px] relative group">
              {/* Barra simulada navegador */}
              <div className="absolute top-0 left-0 w-full h-10 bg-slate-100 border-b flex items-center px-4 gap-2 z-20">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="mx-auto bg-white px-4 py-1 rounded-md text-xs font-medium text-slate-500 border shadow-sm flex items-center gap-2">
                  🔒 catifypro.store/tu-negocio
                </div>
              </div>

              {/* 🔴 HOTSPOT CATALOGO */}
              <DemoHotspot
                className="top-14 left-4"
                title="Tu Catálogo Inteligente"
                description="Así ven tus clientes tu tienda. Completamente responsiva y optimizada para convertir visitas en cotizaciones."
                side="right"
              />

              {/* 🔴 HOTSPOT CARRITO (Estimado arriba derecha) */}
              <DemoHotspot
                className="top-14 right-4 md:right-10"
                title="Carrito con Upsell"
                description="Cuando agregan algo, el carrito les sugiere productos complementarios para aumentar tu ticket promedio."
                side="left"
              />

              {/* 🔴 HOTSPOT RECOMENDADOR (Estimado abajo centro/derecha) */}
              <DemoHotspot
                className="bottom-20 right-4 md:right-10 md:bottom-10"
                title="IA Recomendadora"
                description="Este módulo aprende de todos tus clientes y sugiere automáticamente lo que es más probable que compren."
                side="left"
              />

              <div className="pt-10 h-full">
                <DemoCatalog products={data.products} color={data.colors.primary} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
