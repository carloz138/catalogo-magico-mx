import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/contexts/RoleContext";
import { motion } from "framer-motion";
import {
  Network,
  GitFork,
  Radar,
  BrainCircuit,
  Menu,
  X,
  ArrowRight,
  ArrowDown,
  Search,
  Database,
  Store,
  User,
  BarChart4,
  Handshake,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const Index = () => {
  const navigate = useNavigate();
  const { userRole } = useUserRole();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- STATE: Network Simulator ---
  const [simResellers, setSimResellers] = useState<number>(10);
  const [simEndClients, setSimEndClients] = useState<number>(50);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleMenuButton = () => {
    if (user) navigate("/products");
    else navigate("/login");
  };

  // --- CALCULATIONS ---
  const totalNetworkReach = simResellers * simEndClients;
  const estimatedDataPoints = Math.round(totalNetworkReach * 2.5);
  const hiddenDemandDetected = Math.round(estimatedDataPoints * 0.15);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Network className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">CatifyPro</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/why-subscribe")}
                className="text-slate-600 hover:text-indigo-600"
              >
                Por qué suscribirse
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/blog")}
                className="text-slate-600 hover:text-indigo-600"
              >
                Blog
              </Button>
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              <Button variant="ghost" onClick={handleMenuButton} className="font-medium">
                {user ? "Dashboard" : "Login"}
              </Button>
              {!user && (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200/50 transition-all hover:translate-y-[-1px]"
                >
                  Comenzar Gratis
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-100 shadow-xl animate-in slide-in-from-top-5 z-40">
              <div className="flex flex-col p-4 space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/why-subscribe")}
                  className="w-full justify-start h-12 text-lg font-medium"
                >
                  Por qué suscribirse
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/blog")}
                  className="w-full justify-start h-12 text-lg font-medium"
                >
                  Blog
                </Button>
                <div className="h-px bg-slate-100 my-2"></div>
                <Button
                  variant="ghost"
                  onClick={handleMenuButton}
                  className="w-full justify-start h-12 text-lg font-medium"
                >
                  {user ? "Ir al Dashboard" : "Iniciar Sesión"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute right-0 top-0 bg-indigo-100 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full blur-[80px] mix-blend-multiply animate-pulse"></div>
          <div className="absolute left-0 bottom-0 bg-blue-50 w-[200px] h-[200px] md:w-[500px] md:h-[500px] rounded-full blur-[60px] mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs md:text-sm font-medium mb-6">
              <Handshake className="w-3 h-3 md:w-4 md:h-4" />
              <span>Convierte a tus clientes en socios estratégicos</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
              Conecta tu inventario.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Potencia toda tu cadena.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              No solo les vendes productos, les das la tecnología para vender más. Tú obtienes visión del mercado, ellos
              obtienen una plataforma de gestión profesional.
              <b> Todos crecen.</b>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto px-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/upload" : "/login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-200 w-full sm:w-auto"
              >
                Crear mi Ecosistema
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("network-simulator")?.scrollIntoView({ behavior: "smooth" })}
                className="h-14 px-8 text-lg rounded-full border-slate-300 w-full sm:w-auto bg-white hover:bg-slate-50"
              >
                Ver Impacto en Red
              </Button>
            </div>
          </motion.div>

          {/* MAPA CONCEPTUAL (L1 -> L2 -> L3) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 relative max-w-5xl mx-auto"
          >
            <div className="rounded-3xl bg-slate-900 p-1 md:p-2 shadow-2xl border border-slate-800">
              <div className="rounded-2xl bg-slate-950 overflow-hidden relative py-12 md:py-16 px-4 flex flex-col items-center justify-center border border-slate-800">
                <p className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mb-8 md:mb-12 font-semibold">
                  El Flujo de Valor Compartido
                </p>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 w-full max-w-4xl">
                  {/* NODE 1: TÚ (L1) */}
                  <div className="flex flex-col items-center z-20 w-full md:w-1/3 group">
                    <div className="relative">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400 group-hover:scale-105 transition-transform">
                        <Database className="w-10 h-10 md:w-12 md:h-12 text-white" />
                      </div>
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full border-4 border-slate-950">
                        L1: TÚ
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <h3 className="text-white font-bold text-lg">Proveedor Estratégico</h3>
                      <p className="text-indigo-300 text-xs md:text-sm font-mono mt-1">Gestión de Inventario</p>
                      <p className="text-slate-500 text-xs mt-2 max-w-[160px] mx-auto leading-tight">
                        Analizas la demanda global para abastecer mejor a tus socios.
                      </p>
                    </div>
                  </div>

                  {/* CONNECTOR 1 */}
                  <div className="flex flex-col md:flex-row items-center justify-center w-full md:w-auto gap-2">
                    <ArrowDown className="text-slate-600 w-6 h-6 md:hidden animate-bounce" />
                    <div className="hidden md:flex flex-col items-center px-4">
                      <span className="text-[10px] text-slate-500 mb-1 whitespace-nowrap">Tecnología + Stock</span>
                      <div className="h-[2px] w-24 bg-gradient-to-r from-indigo-600 to-violet-500 animate-pulse"></div>
                      <ArrowRight className="text-violet-500 w-4 h-4 absolute ml-24" />
                    </div>
                  </div>

                  {/* NODE 2: TU CLIENTE (L2) */}
                  <div className="flex flex-col items-center z-20 w-full md:w-1/3 group">
                    <div className="relative">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400 group-hover:scale-105 transition-transform">
                        <Store className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <div className="absolute -top-3 -right-3 bg-slate-700 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full border-4 border-slate-950">
                        L2: SOCIO
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <h3 className="text-white font-bold text-lg">Tu Distribuidor</h3>
                      <p className="text-violet-300 text-xs md:text-sm font-mono mt-1">Socio Empoderado</p>
                      <p className="text-slate-500 text-xs mt-2 max-w-[160px] mx-auto leading-tight">
                        Gestiona sus pedidos y vende más con tu tecnología y recomendaciones.
                      </p>
                    </div>
                  </div>

                  {/* CONNECTOR 2 */}
                  <div className="flex flex-col md:flex-row items-center justify-center w-full md:w-auto gap-2">
                    <ArrowDown className="text-slate-600 w-6 h-6 md:hidden animate-bounce delay-100" />
                    <div className="hidden md:flex flex-col items-center px-4">
                      <span className="text-[10px] text-slate-500 mb-1 whitespace-nowrap">Mejor Servicio</span>
                      <div className="h-[2px] w-24 bg-gradient-to-r from-violet-600 to-slate-500 animate-pulse delay-75"></div>
                      <ArrowRight className="text-slate-500 w-4 h-4 absolute ml-24" />
                    </div>
                  </div>

                  {/* NODE 3: USUARIO FINAL (L3) */}
                  <div className="flex flex-col items-center z-20 w-full md:w-1/3 group">
                    <div className="relative">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg border border-slate-600 group-hover:scale-105 transition-transform">
                        <User className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                      </div>
                      <div className="absolute -top-3 -right-3 bg-slate-700 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full border-4 border-slate-950">
                        L3: MERCADO
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <h3 className="text-white font-bold text-lg">Cliente Final</h3>
                      <p className="text-slate-400 text-xs md:text-sm font-mono mt-1">Demanda Real</p>
                      <p className="text-slate-500 text-xs mt-2 max-w-[160px] mx-auto leading-tight">
                        Encuentra lo que busca gracias a una cadena optimizada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. EXPLICACIÓN DE VALOR */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Un sistema donde todos ganan</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Mejoras la operación de tus clientes para que ellos mejoren tus ventas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
            {[
              {
                icon: Store,
                color: "indigo",
                title: "Herramienta de Gestión (L2)",
                desc: "Tu cliente recibe gratis un SaaS completo para cotizar y gestionar sus pedidos. Le ahorras trabajo administrativo.",
              },
              {
                icon: BrainCircuit,
                color: "violet",
                title: "Inteligencia Colectiva",
                desc: "El Recomendador aprende de toda la red. Ayuda a tu cliente a ofrecer productos complementarios que no sabía que podía vender.",
              },
              {
                icon: Radar,
                color: "emerald",
                title: "Radar de Abastecimiento",
                desc: "Ves qué piden los usuarios finales (L3) para avisar a tus distribuidores y surtirles antes de que pierdan la venta.",
              },
            ].map((item, i) => {
              const Icon = item.icon; // FIX: Capitalized variable for dynamic component
              return (
                <motion.div
                  key={i}
                  className="relative z-10 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-lg text-center hover:border-indigo-100 transition-colors"
                  {...fadeInUp}
                  transition={{ delay: i * 0.2 }}
                >
                  <div
                    className={`w-14 h-14 mx-auto bg-${item.color}-50 rounded-2xl flex items-center justify-center mb-4 border border-${item.color}-100`}
                  >
                    <Icon className={`w-7 h-7 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN TÉCNICA (CAPI & RADAR) */}
      <section className="py-16 md:py-24 bg-slate-950 text-white overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6">
                <TrendingUp className="w-4 h-4" />
                <span>Optimización de Cadena</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Si a tu cliente le va bien,
                <br />
                <span className="text-indigo-400">a ti te va mejor.</span>
              </h2>
              <p className="text-slate-400 mb-8 text-sm md:text-base leading-relaxed">
                La tecnología de CatifyPro trabaja en segundo plano para alinear la oferta de tu red con la demanda real
                del mercado.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Search,
                    color: "indigo",
                    title: "Demanda Real (Search Logs)",
                    text: "Detecta productos faltantes en el mercado para abastecer proactivamente a tus socios.",
                  },
                  {
                    icon: BarChart4,
                    color: "violet",
                    title: "Recomendador de Red",
                    text: "Tu catálogo le sugiere a tu cliente qué más ofrecerle al usuario final basado en tendencias globales.",
                  },
                  {
                    icon: Lock,
                    color: "emerald",
                    title: "Protección de Canal",
                    text: "Tú ves tendencias de mercado para mejorar el stock, pero tu socio mantiene la relación con su cliente.",
                  },
                ].map((feat, i) => {
                  const Icon = feat.icon; // FIX: Capitalized variable
                  return (
                    <div key={i} className="flex gap-4">
                      <div className={`mt-1 bg-${feat.color}-500/20 p-2 rounded-lg h-fit shrink-0`}>
                        <Icon className={`w-5 h-5 text-${feat.color}-400`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm md:text-base">{feat.title}</h4>
                        <p className="text-slate-400 text-xs md:text-sm mt-1">{feat.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LIVE FEED */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 md:p-8 shadow-2xl mt-8 lg:mt-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
              <div className="relative space-y-4 font-mono text-xs md:text-sm">
                <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-2">
                  <span>ECOSYSTEM ACTIVITY</span>
                  <span className="text-green-400 animate-pulse">● LIVE</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center opacity-60 truncate">
                    <span className="text-violet-400">[L2_Socio]</span>
                    <span className="text-slate-300">Generando Cotización #9921...</span>
                  </div>
                  <div className="flex gap-2 items-center bg-indigo-500/10 p-3 rounded border border-indigo-500/20">
                    <span className="text-indigo-300 font-bold">IA SUGGESTION</span>
                    <span className="text-white">"Agrega kit de instalación (+20% ticket)"</span>
                  </div>
                  <div className="flex gap-2 items-center opacity-60 truncate">
                    <span className="text-blue-400">[L3_Mercado]</span>
                    <span className="text-slate-300">Buscando: "Repuesto Genérico"</span>
                  </div>
                  <div className="flex gap-2 items-center bg-emerald-900/20 p-2 rounded border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">OPORTUNIDAD</span>
                    <span className="text-white text-xs">Alta demanda detectada. Sugerir stock a L2.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIMULADOR */}
      <section id="network-simulator" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Impacto en tu Red</h2>
            <p className="text-slate-600 mt-4 text-sm md:text-base">Visualiza el potencial de conectar a tus socios.</p>
          </div>

          <Card className="shadow-xl border-0 overflow-hidden bg-white rounded-2xl">
            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-10 bg-white space-y-8">
                <div>
                  <label className="flex justify-between text-sm font-bold text-slate-700 mb-4">
                    <span>Tus Socios Activos (L2)</span>
                    <span className="text-indigo-600 text-lg">{simResellers}</span>
                  </label>
                  <Slider
                    value={[simResellers]}
                    onValueChange={(val) => setSimResellers(val[0])}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                  <p className="text-xs text-slate-400 mt-1">Distribuidores a potenciar.</p>
                </div>
                <div>
                  <label className="flex justify-between text-sm font-bold text-slate-700 mb-4">
                    <span>Alcance de Mercado por Socio (L3)</span>
                    <span className="text-indigo-600 text-lg">{simEndClients}</span>
                  </label>
                  <Slider
                    value={[simEndClients]}
                    onValueChange={(val) => setSimEndClients(val[0])}
                    max={500}
                    step={10}
                    className="py-4"
                  />
                  <p className="text-xs text-slate-400 mt-1">Clientes finales potenciales.</p>
                </div>
              </div>

              <div className="p-6 md:p-10 bg-indigo-950 text-white flex flex-col justify-center relative">
                <div className="text-center space-y-8 relative z-10">
                  <div>
                    <p className="text-indigo-300 text-xs uppercase tracking-widest mb-2 font-bold">Ecosistema Total</p>
                    <p className="text-4xl md:text-5xl font-bold text-white">{totalNetworkReach.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mt-1">Clientes Finales Conectados</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-indigo-800/50">
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-emerald-400">
                        {estimatedDataPoints.toLocaleString()}
                      </p>
                      <p className="text-indigo-200 text-[10px] uppercase font-bold mt-1">Insights de Mercado</p>
                    </div>
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-amber-400">
                        {hiddenDemandDetected.toLocaleString()}
                      </p>
                      <p className="text-indigo-200 text-[10px] uppercase font-bold mt-1">Oportunidades Nuevas</p>
                    </div>
                  </div>
                  <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold mt-2">
                    Optimizar mi Cadena
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section className="py-20 bg-indigo-600 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">¿Listo para fortalecer tu red?</h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
            Dales a tus clientes la herramienta que necesitan para crecer contigo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
            <Button
              size="lg"
              onClick={() => navigate(user ? "/upload" : "/login")}
              className="bg-white text-indigo-600 hover:bg-indigo-50 h-14 px-10 text-lg font-bold rounded-full shadow-xl w-full sm:w-auto"
            >
              Comenzar Gratis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10 h-14 px-10 text-lg font-bold rounded-full w-full sm:w-auto"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8 text-sm text-center md:text-left">
          <div className="col-span-1 md:col-span-1 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Network className="w-5 h-5" />
              <span className="font-bold text-lg">CatifyPro</span>
            </div>
            <p className="mb-4 text-xs leading-relaxed max-w-xs">
              Plataforma de Gestión y Distribución Inteligente B2B.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Producto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Características
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Precios
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <a href="/blog" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Soporte
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacidad
                </a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="hover:text-white transition-colors">
                  Términos
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center pt-8 border-t border-slate-900 text-xs opacity-40">
          © 2025 CatifyPro. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Index;
