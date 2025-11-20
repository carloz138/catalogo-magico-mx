import { useEffect } from "react";
import {
  Zap,
  Network,
  Mail,
  Phone,
  GitFork,
  Target,
  BrainCircuit,
  CheckCircle2,
  Store,
  Search,
  BarChart4,
  ArrowRight,
  Lock,
  PieChart,
  Cloud,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WhySubscribePage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="bg-indigo-600 p-1 rounded-md">
              <Network className="w-4 h-4 text-white" />
            </div>
            CatifyPro
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-slate-600">
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/login")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* SECCIÓN 1: HERO - MANIFIESTO */}
      <section className="pt-16 pb-16 md:pt-24 md:pb-24 container mx-auto px-4 text-center max-w-4xl relative overflow-hidden">
        {/* Background Bloom */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px] opacity-60 -z-10"></div>

        <motion.div {...fadeInUp}>
          <Badge className="mb-6 bg-indigo-100 text-indigo-700 border-indigo-200 px-4 py-1 text-xs uppercase tracking-widest">
            De Proveedor a Socio Estratégico
          </Badge>
          <h1 className="text-3xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
            No solo digitalices tu catálogo.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Digitaliza a tus Clientes.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            La mayoría de las herramientas B2B solo te ayudan a ti. CatifyPro le da superpoderes a tus clientes para que
            vendan más.
            <br className="hidden md:block" />
            <b>Si ellos crecen, tú creces.</b>
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-10 text-lg rounded-full shadow-xl shadow-indigo-200"
          >
            Empezar mi Red
          </Button>
        </motion.div>
      </section>

      {/* SECCIÓN 2: EL PROBLEMA VS LA SOLUCIÓN */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 relative overflow-hidden">
                {/* Decorative abstract elements */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-50"></div>

                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="bg-red-100 text-red-600 p-1 rounded-md text-xs">ANTES</span>
                  El Modelo Tradicional
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-slate-600">
                    <div className="min-w-[24px] h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                      X
                    </div>
                    <p className="text-sm">Tu cliente espera horas por una cotización en PDF.</p>
                  </li>
                  <li className="flex gap-3 text-slate-600">
                    <div className="min-w-[24px] h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                      X
                    </div>
                    <p className="text-sm">Él no sabe qué venderle a su cliente final.</p>
                  </li>
                  <li className="flex gap-3 text-slate-600">
                    <div className="min-w-[24px] h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                      X
                    </div>
                    <p className="text-sm">Tú compras inventario "a ciegas" sin saber la demanda real.</p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Rompe el cuello de botella</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                CatifyPro elimina la fricción entre tú, tu distribuidor y el mercado final. Creamos un flujo continuo de
                información y ventas.
              </p>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
                <Zap className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Velocidad = Ventas</h4>
                  <p className="text-sm text-indigo-700">
                    El 50% de las ventas B2B se las lleva el proveedor que responde primero. Con nuestro sistema, la
                    respuesta es inmediata (0 segundos).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: FUNCIONALIDADES DETALLADAS */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tu Arsenal Tecnológico</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar, escalar y optimizar tu red de distribución.
            </p>
          </div>

          <div className="space-y-24">
            {/* FUNCIONALIDAD 1: REPLICA DE CATALOGOS */}
            <motion.div className="grid md:grid-cols-2 gap-12 items-center" {...fadeInUp}>
              <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-between items-center px-4 opacity-30">
                    <Store className="w-12 h-12 text-slate-400" />
                    <ArrowRight className="w-8 h-8 text-slate-300" />
                    <Store className="w-12 h-12 text-indigo-600" />
                    <ArrowRight className="w-8 h-8 text-slate-300" />
                    <Store className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="z-10 bg-white p-6 rounded-xl shadow-lg text-center border border-indigo-100">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold">
                      L2
                    </div>
                    <p className="font-bold text-slate-900">Tienda de Tu Cliente</p>
                    <p className="text-xs text-slate-500 mt-2">Powered by Tu Inventario</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-4 uppercase text-xs tracking-wider">
                  <GitFork className="w-4 h-4" />
                  Réplica Viral
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  Regálales su propia Tienda Digital
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Tus clientes obtienen una versión profesional de tu catálogo donde pueden poner{" "}
                  <b>su logo, sus precios</b>.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Venden productos que tienes en stock y los que tienes bajo pedido.</span>
                  </li>
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Tú controlas el precio mínimo para proteger el mercado.</span>
                  </li>
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span>Se sienten empoderados, no utilizados. Fidelidad total.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* NUEVA SECCIÓN: ANALITICA Y BUSINESS INTELLIGENCE */}
            <motion.div className="grid md:grid-cols-2 gap-12 items-center" {...fadeInUp}>
              <div className="order-2 md:order-1">
                <div className="inline-flex items-center gap-2 text-violet-600 font-bold mb-4 uppercase text-xs tracking-wider">
                  <PieChart className="w-4 h-4" />
                  Business Intelligence
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Analítica que Mueve Dinero</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Dejamos de lado las métricas vanidosas. Te damos datos para optimizar tu flujo de efectivo y compras.
                </p>

                <div className="space-y-6">
                  {/* Benefit A */}
                  <div className="flex gap-4">
                    <div className="mt-1 bg-violet-100 p-2 rounded-lg h-fit">
                      <TrendingDown className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Inventario sin Movimiento (Dead Stock)</h4>
                      <p className="text-slate-600 text-sm mt-1">
                        Detecta productos que llevan meses en bodega. Lanza promociones específicas a tu red de clientes
                        para liquidarlos y recuperar capital.
                      </p>
                    </div>
                  </div>

                  {/* Benefit B */}
                  <div className="flex gap-4">
                    <div className="mt-1 bg-violet-100 p-2 rounded-lg h-fit">
                      <Cloud className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Wordcloud de Radar con IA</h4>
                      <p className="text-slate-600 text-sm mt-1">
                        No leas miles de filas. Nuestra IA agrupa visualmente lo que el mercado pide. Si ves "Válvula
                        Roja" en grande, es hora de importarla.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 md:order-2 bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
                <div className="bg-slate-900 rounded-xl p-6 md:p-8 relative overflow-hidden">
                  {/* Visual Abstracto de Wordcloud */}
                  <div className="text-center space-y-2 mb-6">
                    <Badge className="bg-violet-500 hover:bg-violet-600">Tendencias de Búsqueda (IA)</Badge>
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-3 opacity-90">
                    <span className="text-3xl font-bold text-white">Filtro 5mm</span>
                    <span className="text-xl text-violet-300">Válvula Check</span>
                    <span className="text-sm text-slate-400">Tubería PVC</span>
                    <span className="text-2xl font-bold text-emerald-400">Adaptador Univ.</span>
                    <span className="text-lg text-slate-300">Cable 10m</span>
                    <span className="text-xs text-slate-500">Tuercas</span>
                  </div>

                  {/* Visual de Dead Stock Alert */}
                  <div className="mt-8 bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="text-white text-sm font-bold">Alerta de Inventario Lento</p>
                      <p className="text-slate-400 text-xs">SKU-882 lleva 90 días sin venta. ¿Ofertar?</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FUNCIONALIDAD 3: RECOMENDADOR IA & SEARCH LOGS */}
            <motion.div className="grid md:grid-cols-2 gap-12 items-center" {...fadeInUp}>
              <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-8 flex flex-col items-center justify-center text-center relative">
                  <BrainCircuit className="w-16 h-16 text-emerald-500 mb-6" />
                  <div className="bg-white p-4 rounded-lg shadow-md border border-emerald-100 max-w-xs w-full">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-400 uppercase font-bold">Oportunidad Detectada</p>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">
                        Alta Probabilidad
                      </Badge>
                    </div>
                    <p className="text-slate-800 text-sm text-left">
                      "Cliente buscó <b>'Taladro X'</b> (Sin Stock). <br />
                      <span className="text-emerald-600 font-bold">Acción:</span> Ofrecer 'Taladro Y' (En Stock)."
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-4 uppercase text-xs tracking-wider">
                  <Search className="w-4 h-4" />
                  Motor de Ventas
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Logs de Búsqueda & Recomendador</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Convertimos datos pasivos en ventas activas. Ayuda a tu cliente a vender lo que tienes, y descubre qué
                  traer para lo que no tienes.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>
                      <b>Search Logs:</b> Registro exacto de cada intención de compra fallida. Es dinero sobre la mesa
                      que ahora puedes recoger.
                    </span>
                  </li>
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>
                      <b>Recomendador IA:</b> "Sopla" al oído de tu cliente productos complementarios (Cross-selling)
                      basados en patrones de toda la red.
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* FUNCIONALIDAD 4: CAPI & MARKETING */}
            <motion.div className="grid md:grid-cols-2 gap-12 items-center" {...fadeInUp}>
              <div className="order-2 md:order-1">
                <div className="inline-flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase text-xs tracking-wider">
                  <Target className="w-4 h-4" />
                  Marketing ROI
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Meta CAPI & Tracking</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Conectamos tu catálogo directamente con Facebook e Instagram Ads. Sabrás exactamente qué anuncio
                  generó qué venta.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>
                      <b>Retargeting Automático:</b> Persigue a quien vio tu catálogo pero no cotizó.
                    </span>
                  </li>
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>
                      <b>Protección de Datos:</b> Tu cliente mantiene sus leads, tú obtienes la atribución.
                    </span>
                  </li>
                  <li className="flex gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Optimiza tu presupuesto publicitario al máximo.</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 bg-white p-2 rounded-2xl shadow-xl border border-slate-200 -rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-50 rounded-xl p-8 flex items-center justify-center relative overflow-hidden">
                  {/* Graph representation */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">GASTO ADS</span>
                      <span className="text-xs font-bold text-slate-400">VENTAS</span>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                      <div className="w-1/5 bg-slate-200 h-16 rounded-t-md"></div>
                      <div className="w-1/5 bg-slate-200 h-20 rounded-t-md"></div>
                      <div className="w-1/5 bg-blue-200 h-24 rounded-t-md relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                          CAPI Activado
                        </div>
                      </div>
                      <div className="w-1/5 bg-blue-500 h-32 rounded-t-md"></div>
                      <div className="w-1/5 bg-blue-600 h-full rounded-t-md"></div>
                    </div>
                    <div className="text-center pt-2">
                      <span className="text-green-600 font-bold text-sm">+300% ROAS</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: PRIVACIDAD Y CONFIANZA (Dark Section) */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Un Ecosistema Seguro</h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Sabemos que la relación con el cliente es sagrada. CatifyPro está diseñado para que{" "}
            <b>tu cliente siempre sea el dueño de su relación con el cliente final</b>.
            <br />
            <br />
            Tú ves datos agregados y tendencias para mejorar el abastecimiento. Ellos mantienen su cartera de clientes
            protegida.
          </p>
          <div className="inline-block bg-indigo-900/50 border border-indigo-500/30 px-6 py-3 rounded-lg text-indigo-200 text-sm">
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Anonimato garantizado en la cadena de suministro.
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-white text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">¿Listo para evolucionar?</h2>
          <p className="text-xl text-slate-600 mb-10">
            Deja de ser un simple proveedor. Conviértete en el motor tecnológico de tus clientes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 text-lg rounded-full shadow-xl"
            >
              Empezar
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-slate-600 h-14 px-12 text-lg rounded-full border-slate-300"
            >
              Ver Demo en Video
            </Button>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            No requiere tarjeta de crédito para empezar. Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-sm text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                <Network className="w-5 h-5" /> CatifyPro
              </h3>
              <p className="leading-relaxed mb-4 max-w-xs">Plataforma de Gestión y Distribución Inteligente B2B.</p>
              <div className="flex gap-4">
                <Mail className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer" />
                <Phone className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer" />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Plataforma</h3>
              <ul className="space-y-3">
                <li>
                  <button className="hover:text-indigo-400 transition-colors">Funcionalidades</button>
                </li>
                <li>
                  <button className="hover:text-indigo-400 transition-colors">Precios</button>
                </li>
                <li>
                  <button className="hover:text-indigo-400 transition-colors">API & Integraciones</button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Recursos</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate("/blog")} className="hover:text-indigo-400 transition-colors">
                    Blog
                  </button>
                </li>
                <li>
                  <button className="hover:text-indigo-400 transition-colors">Centro de Ayuda</button>
                </li>
                <li>
                  <button className="hover:text-indigo-400 transition-colors">Privacidad</button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 text-center text-xs opacity-50">
            <p>© 2025 CatifyPro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
