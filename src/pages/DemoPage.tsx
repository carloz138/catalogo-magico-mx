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
  Info,
} from "lucide-react";
import WelcomeTour from "@/components/demo/WelcomeTour";
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
          {/* 🔥 TABS OPTIMIZADOS PARA MÓVIL Y DESKTOP 🔥 */}
          <div className="flex flex-col items-center mb-8 gap-4">
            <TabsList className="w-full grid grid-cols-2 h-auto p-1.5 bg-slate-200/60 rounded-xl gap-1 md:w-auto md:inline-flex md:bg-white md:border md:border-slate-200 md:shadow-sm">
              <TabsTrigger
                value="dashboard"
                className="h-10 md:h-11 rounded-lg md:rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm md:data-[state=active]:bg-slate-900 md:data-[state=active]:text-white font-medium text-xs md:text-base transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                Inteligencia
              </TabsTrigger>

              <TabsTrigger
                value="catalogo"
                className="relative h-10 md:h-11 rounded-lg md:rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm md:data-[state=active]:bg-slate-900 md:data-[state=active]:text-white font-medium text-xs md:text-base transition-all overflow-visible"
              >
                <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                Catálogo Interactivo
                {/* 🔴 PUNTO PULSANTE PARA INVITAR AL CLIC */}
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 md:h-3 md:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-indigo-500 border-2 border-white"></span>
                </span>
              </TabsTrigger>
            </TabsList>

            {/* 🔥 DISCLAIMER 🔥 */}
            <div className="flex items-start gap-2 bg-blue-50/50 border border-blue-100 p-2 rounded-lg max-w-lg mx-auto">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] md:text-xs text-slate-500 text-center md:text-left leading-tight">
                <strong>Nota:</strong> Los productos y datos mostrados son ejemplos generados para esta demostración. No
                representan inventario real.
              </p>
            </div>
          </div>

          <TabsContent
            value="dashboard"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative"
          >
            {/* SECCIÓN 1: KPIs y VENTAS */}
            <section className="relative">
              <DemoKPIs data={data.kpis} currency="MXN" />
              <div className="mt-8">
                <BenefitTip
                  title="Tu Dinero Real vs. Promesas"
                  description="CatifyPro separa las 'cotizaciones aceptadas' del dinero real en banco."
                />
                <DemoSalesChart data={data.mainChartData} />
              </div>
            </section>

            {/* SECCIÓN 2: OPORTUNIDADES */}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RADAR */}
                <div className="relative">
                  {/* HOTSPOT 2 */}
                  <DemoHotspot
                    className="top-[-10px] right-[-10px] z-20"
                    title="Radar de Demanda"
                    description="Aquí aparecen las solicitudes de productos que tus clientes buscan pero TÚ NO TIENES en catálogo."
                    side="left"
                  />
                  <Card className="shadow-lg border-indigo-100 overflow-hidden hover:shadow-xl transition-shadow h-full">
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
                </div>

                {/* SEARCH LOGS */}
                <div className="relative">
                  {/* HOTSPOT 3 */}
                  <DemoHotspot
                    className="top-[-10px] right-[-10px] z-20"
                    title="Tendencias de Búsqueda"
                    description="Descubre qué buscan tus clientes. Identifica 'No encontrado' para ver oportunidades perdidas."
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

            {/* SECCIÓN 3: PREDICCIÓN */}
            <section className="mt-8">
              <BenefitTip
                title="Predicción de Inventario"
                description="Nuestra IA analiza patrones de búsqueda y venta histórica para decirte qué productos se agotarán la próxima semana."
              />

              <div className="relative mt-4">
                {/* HOTSPOT 4 */}
                <DemoHotspot
                  className="top-[-10px] right-[-10px] z-20"
                  title="Top 10 en Tendencia"
                  description="Visualiza el ritmo de venta de tus productos estrella para evitar que te quedes sin stock."
                  side="left"
                />
                <DemoForecastWidget productsData={data.topDemandProducts} />
              </div>
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

              {/* HOTSPOT GENERAL */}
              <DemoHotspot
                className="top-14 left-4 z-30"
                title="Tu Catálogo Inteligente"
                description="Esta es la tienda que tus clientes ven. Está diseñada para convertir visitas en ventas rápidamente."
                side="right"
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
