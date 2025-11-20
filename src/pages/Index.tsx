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
  Users,
  Menu,
  X,
  ArrowRight,
  Search,
  Database,
  Share2,
  BarChart4,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider"; // Asegúrate de tener este componente o usa un input range básico

const Index = () => {
  const navigate = useNavigate();
  const { userRole } = useUserRole();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- STATE: Network Simulator (Reemplazo de ROI) ---
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
    if (user) {
      if (userRole === "L2" || userRole === "BOTH") {
        navigate("/products");
      } else {
        navigate("/products");
      }
    } else {
      navigate("/login");
    }
  };

  // --- CALCULATIONS: Network Simulator ---
  const totalNetworkReach = simResellers * simEndClients;
  const estimatedDataPoints = Math.round(totalNetworkReach * 2.5); // Promedio de búsquedas por usuario
  const hiddenDemandDetected = Math.round(estimatedDataPoints * 0.15); // 15% son búsquedas sin resultados (Oportunidad de Radar)

  // --- ANIMATIONS ---
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. NAVBAR (Funcionalidad Intacta) */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
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
                className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                Por qué suscribirse
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/blog")}
                className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                Blog
              </Button>
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              <Button variant="ghost" onClick={handleMenuButton} className="font-medium text-slate-900">
                {user ? "Ir al Dashboard" : "Iniciar Sesión"}
              </Button>
              {!user && (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 bg-white border-t border-slate-100 absolute w-full left-0 px-4 shadow-xl">
              <Button
                variant="ghost"
                onClick={() => {
                  handleMenuButton();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                {user ? "Dashboard" : "Login"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/why-subscribe");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                Por qué suscribirse
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/blog");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                Blog
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* 2. HERO SECTION: Network Value */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative">
        {/* Background Pattern sutil */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute right-0 top-0 bg-indigo-100 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-multiply animate-pulse"></div>
          <div className="absolute left-0 bottom-0 bg-blue-100 w-[400px] h-[400px] rounded-full blur-[100px] mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
              <GitFork className="w-4 h-4" />
              <span>El efecto red aplicado a tu inventario</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-[1.1]">
              Tu inventario distribuido.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Tu inteligencia centralizada.
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              CatifyPro no es solo un catálogo digital. Es el sistema operativo que permite a tus clientes (L2) replicar
              tu inventario para vender, mientras tú recolectas data de demanda real de todo el mercado (L3).
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/upload" : "/login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transition-all"
              >
                Activar mi Red Viral
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("network-simulator")?.scrollIntoView({ behavior: "smooth" })}
                className="h-14 px-8 text-lg rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Simular Alcance
              </Button>
            </div>
          </motion.div>

          {/* Dashboard Preview Abstracto */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="rounded-2xl bg-slate-900 p-2 shadow-2xl border border-slate-800">
              <div className="rounded-xl bg-slate-950 overflow-hidden relative aspect-[16/9] flex items-center justify-center border border-slate-800">
                {/* Aquí iría una imagen real de tu dashboard, por ahora simulamos la red */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>

                {/* Representación Visual del Efecto Red */}
                <div className="relative z-10 flex items-center justify-center gap-12">
                  {/* Node L1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 z-20 relative">
                      <Database className="w-10 h-10 text-white" />
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full border-2 border-slate-900">
                        Tú (L1)
                      </div>
                    </div>
                    <p className="text-indigo-200 mt-4 font-mono text-sm">Master Data</p>
                  </div>

                  {/* Connections */}
                  <div className="flex flex-col gap-4">
                    <div className="h-[2px] w-24 bg-gradient-to-r from-indigo-600 to-violet-500 animate-pulse"></div>
                    <div className="h-[2px] w-24 bg-gradient-to-r from-indigo-600 to-violet-500 animate-pulse opacity-50"></div>
                    <div className="h-[2px] w-24 bg-gradient-to-r from-indigo-600 to-violet-500 animate-pulse opacity-25"></div>
                  </div>

                  {/* Node L2 */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg z-20">
                      <Share2 className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-violet-200 mt-4 font-mono text-sm">Clientes (L2)</p>
                  </div>

                  {/* Connections Back */}
                  <div className="flex flex-col gap-4">
                    <ArrowRight className="text-slate-600 w-6 h-6" />
                  </div>

                  {/* Node L3 */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center shadow-lg z-20 border border-slate-600">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 mt-4 font-mono text-sm">Mercado (L3)</p>
                  </div>
                </div>

                {/* Data Flow Particles (Decorativo) */}
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[300px] -translate-x-1/2 -translate-y-1/2 border border-indigo-500/10 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[200px] -translate-x-1/2 -translate-y-1/2 border border-violet-500/10 rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. THE NETWORK ENGINE (Explicación del Modelo) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">Cómo funciona el Ecosistema</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Dejas de ser un proveedor lineal para convertirte en el centro de una red comercial inteligente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Conector Visual (Línea) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200 z-0"></div>

            {/* Paso 1 */}
            <motion.div
              className="relative z-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
              {...fadeInUp}
            >
              <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
                <GitFork className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Replica Viral</h3>
              <p className="text-slate-600 leading-relaxed">
                Tus clientes (L2) crean su propia tienda con <b>tu inventario</b> en 1 clic. Ellos ponen sus precios, tú
                controlas el stock.
              </p>
            </motion.div>

            {/* Paso 2 */}
            <motion.div
              className="relative z-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 mx-auto bg-violet-50 rounded-2xl flex items-center justify-center mb-6 border border-violet-100">
                <Globe className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Venta Exponencial</h3>
              <p className="text-slate-600 leading-relaxed">
                Tu catálogo llega al cliente final (L3) a través de cientos de vendedores. <b>CAPI Tracking</b> funciona
                en toda la cadena.
              </p>
            </motion.div>

            {/* Paso 3 */}
            <motion.div
              className="relative z-10 bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 text-center"
              {...fadeInUp}
              transition={{ delay: 0.4 }}
            >
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <Radar className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Radar de Demanda</h3>
              <p className="text-slate-600 leading-relaxed">
                ¿Qué buscan los L3 que no tienes? Recibe <b>Search Logs</b> agregados para detectar tendencias antes que
                nadie.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. DARK SECTION: INTELLIGENCE LAYER (Lo que no se ve) */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden relative">
        {/* Decoración de fondo técnica */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
                <BrainCircuit className="w-4 h-4" />
                <span>Inteligencia Colectiva</span>
              </div>
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Tus clientes saben lo que el mercado quiere.
                <br />
                <span className="text-indigo-400">Ahora tú también.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Normalmente, la información se pierde en el mostrador del distribuidor. CatifyPro captura esa data.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-indigo-500/20 p-2 rounded-lg h-fit">
                    <Search className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Search Logs Unificados</h4>
                    <p className="text-slate-400 text-sm mt-1">
                      Si 50 clientes de tus distribuidores buscan "Válvula X" y no hay stock, nuestro sistema te alerta
                      para que la consigas.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-violet-500/20 p-2 rounded-lg h-fit">
                    <BarChart4 className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Recomendador IA de Red</h4>
                    <p className="text-slate-400 text-sm mt-1">
                      El algoritmo aprende de las ventas de TODA tu red para sugerir cross-selling efectivo a cada
                      nivel.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-emerald-500/20 p-2 rounded-lg h-fit">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Privacidad & Control</h4>
                    <p className="text-slate-400 text-sm mt-1">
                      Tú ves tendencias agregadas, tu cliente (L2) protege sus datos de contacto. Todos ganan sin
                      fricción.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphic Representation of Data Capture */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl relative group hover:border-indigo-500/50 transition-colors">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-20 blur group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative space-y-4 font-mono text-sm">
                <div className="flex justify-between text-slate-500 text-xs border-b border-slate-800 pb-2">
                  <span>LIVE FEED: NETWORK_REQUESTS</span>
                  <span className="text-green-400 animate-pulse">● RECIBIENDO DATA</span>
                </div>
                {/* Simulated Logs */}
                <div className="space-y-3">
                  <div className="flex gap-3 items-center opacity-50">
                    <span className="text-slate-600">[10:42:01]</span>
                    <span className="text-violet-400">L2_Store_88</span>
                    <span className="text-slate-300">Sold: SKU-9921 (5 units)</span>
                  </div>
                  <div className="flex gap-3 items-center opacity-70">
                    <span className="text-slate-600">[10:42:05]</span>
                    <span className="text-blue-400">L3_User_Guest</span>
                    <span className="text-slate-300">Search: "Filtro Industrial 5mm"</span>
                  </div>
                  <div className="flex gap-3 items-center bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                    <span className="text-indigo-300">[10:42:12]</span>
                    <span className="text-amber-400">ALERT SYSTEM</span>
                    <span className="text-white font-bold">OPPORTUNITY DETECTED: "Filtro 5mm" (15 req/hr)</span>
                  </div>
                  <div className="flex gap-3 items-center opacity-60">
                    <span className="text-slate-600">[10:42:15]</span>
                    <span className="text-violet-400">L2_Store_12</span>
                    <span className="text-slate-300">Quote Created: $4,500 USD</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    Analysis: Demand for "Filtro 5mm" exceeds current inventory across network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIMULADOR DE ALCANCE DE RED (Reemplazo de ROI) */}
      <section id="network-simulator" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Simulador de Inteligencia de Red</h2>
            <p className="text-slate-600 mt-4">
              Descubre cuánta información de mercado estás perdiendo hoy por no conectar a tus clientes.
            </p>
          </div>

          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Inputs */}
              <div className="p-8 bg-white space-y-10">
                <div>
                  <label className="flex justify-between text-sm font-medium text-slate-700 mb-4">
                    <span>¿Cuántos distribuidores/revendedores tienes? (L2)</span>
                    <span className="text-indigo-600 font-bold text-lg">{simResellers}</span>
                  </label>
                  <Slider
                    value={[simResellers]}
                    onValueChange={(val) => setSimResellers(val[0])}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                  <p className="text-xs text-slate-400 mt-2">Distribuidores, ferreterías o puntos de venta.</p>
                </div>

                <div>
                  <label className="flex justify-between text-sm font-medium text-slate-700 mb-4">
                    <span>Promedio de clientes finales por revendedor (L3)</span>
                    <span className="text-indigo-600 font-bold text-lg">{simEndClients}</span>
                  </label>
                  <Slider
                    value={[simEndClients]}
                    onValueChange={(val) => setSimEndClients(val[0])}
                    max={500}
                    step={10}
                    className="py-4"
                  />
                  <p className="text-xs text-slate-400 mt-2">Base de compradores activos de cada uno.</p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-sm text-slate-600 italic">
                    "Actualmente, tu visibilidad termina donde vendes al distribuidor. Con CatifyPro, tu visibilidad se
                    extiende hasta el cliente final."
                  </p>
                </div>
              </div>

              {/* Results */}
              <div className="p-8 bg-indigo-950 text-white flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 text-center space-y-8">
                  <div>
                    <p className="text-indigo-300 text-sm font-medium uppercase tracking-widest mb-2">
                      Tu Alcance Real Potencial
                    </p>
                    <p className="text-5xl font-bold text-white">{totalNetworkReach.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Compradores Finales (L3)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-800/50">
                    <div>
                      <p className="text-3xl font-bold text-emerald-400">{estimatedDataPoints.toLocaleString()}</p>
                      <p className="text-indigo-200 text-xs mt-1">Data Points / Mes</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-400">{hiddenDemandDetected.toLocaleString()}</p>
                      <p className="text-indigo-200 text-xs mt-1">Oportunidades Ocultas (Radar)</p>
                    </div>
                  </div>

                  <Button className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold mt-4">
                    Capturar esta Data Ahora
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. SOCIAL PROOF (Mantenido pero estilizado) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-12">Empresas visionarias que ya escalan su red</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Mis distribuidores dejaron de usar PDF y ahora venden directo desde mi sistema. Mis pedidos aumentaron un 40% sin contratar vendedores.",
                author: "Carlos M.",
                role: "CEO, FerreMaster MX",
              },
              {
                quote:
                  "El Radar de Mercado me avisó que 15 clientes buscaban un producto que no tenía. Lo importé y vendí todo en una semana.",
                author: "Ana S.",
                role: "Gerente Comercial, TextileHub",
              },
              {
                quote:
                  "La integración con L2 es transparente. Ellos sienten que es SU tienda, pero yo mantengo el control de la marca y precios.",
                author: "Roberto G.",
                role: "Director, AutoParts Network",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-amber-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">¿Listo para conectar los puntos?</h2>
          <p className="text-indigo-100 text-xl mb-10">
            Deja de adivinar qué quiere el mercado. Deja que tu red te lo diga.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? "/upload" : "/login")}
            className="bg-white text-indigo-600 hover:bg-indigo-50 h-14 px-10 text-lg font-bold rounded-full shadow-2xl"
          >
            Comenzar Gratis
          </Button>
          <p className="mt-6 text-indigo-200 text-sm">
            Sin tarjeta de crédito • Setup en 5 minutos • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* 8. FOOTER (Simplificado Visualmente) */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8 text-sm">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Network className="w-5 h-5" />
              <span className="font-bold text-lg">CatifyPro</span>
            </div>
            <p className="mb-4">Sistema Operativo para Redes de Distribución B2B.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Producto</h4>
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
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Radar AI
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <a href="/blog" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Casos de Éxito
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Ayuda
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
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
        <div className="max-w-7xl mx-auto text-center pt-8 border-t border-slate-900 text-xs opacity-50">
          © 2025 CatifyPro. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Index;
