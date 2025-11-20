import {
  Zap,
  Users,
  TrendingUp,
  Clock,
  Network,
  BarChart3,
  Mail,
  Phone,
  GitFork,
  Target,
  Share2,
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WhySubscribePage() {
  const navigate = useNavigate();

  // Animación estándar para entrada
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter selection:bg-indigo-100 selection:text-indigo-900">
      {/* HEADER (Mantenido simple y limpio) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate("/")}
                className="text-xl font-bold flex items-center gap-2 text-slate-900"
              >
                <div className="bg-indigo-600 p-1 rounded-md">
                  <Network className="w-4 h-4 text-white" />
                </div>
                CatifyPro
              </button>
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Inicio
                </button>
                <button className="text-sm font-medium text-indigo-600">Por qué suscribirse</button>
                <button
                  onClick={() => navigate("/blog")}
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Blog
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="hidden sm:inline-flex text-slate-600"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/login")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
              >
                Comienza Gratis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* SECCIÓN 1: EL MANIFIESTO (Hero) */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white">
          <div className="absolute right-0 top-0 bg-indigo-50 w-[600px] h-[600px] rounded-full blur-[100px] mix-blend-multiply opacity-70"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center">
          <motion.div {...fadeInUp}>
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-1 text-sm border-indigo-200">
              Evolución B2B
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Deja de buscar clientes.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Empieza a construir Socios.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              El viejo modelo B2B es transaccional: <i>"Te vendo, me pagas"</i>.<br />
              El modelo CatifyPro es exponencial: <i>"Te doy mi tecnología, tú vendes por mí, ambos crecemos"</i>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 2: EL EFECTO RED (L1 -> L2 -> L3) */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">1. El Efecto Red: Tu Inventario es Viral</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Transformamos tu cadena de distribución en un ecosistema conectado donde el inventario fluye
              automáticamente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Conector visual desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-slate-200 z-0 dashed border-t-2 border-slate-200 border-dashed"></div>

            {/* Step 1 */}
            <motion.div
              className="relative z-10 bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center hover:border-indigo-300 transition-colors"
              {...fadeInUp}
            >
              <div className="w-14 h-14 mx-auto bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-4 relative">
                <Users className="w-7 h-7 text-indigo-600" />
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  TÚ
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Fabricante / Mayorista</h3>
              <p className="text-sm text-slate-600">
                Subes tu inventario una vez. Defines precios base y controlas el stock global.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="relative z-10 bg-indigo-50 p-8 rounded-2xl border border-indigo-200 text-center shadow-lg shadow-indigo-100"
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <div className="w-14 h-14 mx-auto bg-indigo-600 rounded-xl shadow-md flex items-center justify-center mb-4 relative">
                <GitFork className="w-7 h-7 text-white" />
                <div className="absolute -bottom-3 bg-white text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-200 shadow-sm">
                  SOCIO
                </div>
              </div>
              <h3 className="font-bold text-indigo-900 mb-2">Tu Cliente (Revendedor)</h3>
              <p className="text-sm text-indigo-700">
                Recibe una <span className="font-bold">réplica instantánea</span> de tu catálogo. Pone su logo, su
                margen de ganancia y vende TU stock como si fuera suyo.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="relative z-10 bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center hover:border-indigo-300 transition-colors"
              {...fadeInUp}
              transition={{ delay: 0.4 }}
            >
              <div className="w-14 h-14 mx-auto bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                <Share2 className="w-7 h-7 text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Usuario Final</h3>
              <p className="text-sm text-slate-600">
                Compra en el catálogo de tu cliente. Tú recibes la orden de producción. Crecimiento sin fricción.
              </p>
            </motion.div>
          </div>

          <div className="mt-12 bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-full">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm uppercase tracking-wide mb-1">
                El resultado estratégico
              </h4>
              <p className="text-amber-800 text-sm leading-relaxed">
                Ya no necesitas contratar 50 vendedores. Tienes 50 clientes que usan tu tecnología para vender por ti.
                Ellos ganan su comisión, tú ganas volumen y penetración de mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: PRODUCTIVIDAD RADICAL */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeInUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Clock className="w-4 h-4" />
                <span>Automatización 24/7</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Tu equipo cierra tratos.
                <br />
                CatifyPro hace la talacha.
              </h2>
              <p className="text-slate-600 text-lg mb-8">
                El 40% del tiempo de un vendedor se pierde haciendo cotizaciones en Excel o PDF que nadie lee.
                Automatízalo.
              </p>

              <ul className="space-y-4">
                {[
                  "Cotizador 24/7: Tu cliente arma su pedido a las 3 AM.",
                  "Cálculo de precios y stock en tiempo real (Adiós errores).",
                  "PDFs generados al instante con look profesional.",
                  "Seguimiento automático de 'Visto' y 'Abierto'.",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200"
            >
              {/* Abstract UI Representation of a Quote */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-8 w-24 bg-green-100 rounded text-green-700 text-xs font-bold flex items-center justify-center">
                    APROBADA
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3 w-48 bg-slate-200 rounded"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-40 bg-slate-200 rounded"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-56 bg-slate-200 rounded"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <div className="text-xs text-slate-400">Generada automáticamente</div>
                  <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-blue-200">
                    Convertir a Pedido
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: INTELIGENCIA TÉCNICA (CAPI & RADAR) */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        {/* Background Tech Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-indigo-500 text-white mb-4 border-none">Tecnología Avanzada Simplificada</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">La ventaja injusta: Data e Inteligencia</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Lo que diferencia a CatifyPro de un PDF o un Excel es lo que sucede "bajo el capó".
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* CAPI CARD */}
            <Card className="bg-slate-800 border-slate-700 text-slate-100 overflow-hidden group hover:border-indigo-500 transition-colors">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-white">Meta CAPI & Pixel Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                  Integramos la <strong>API de Conversiones de Meta (Facebook/Instagram)</strong> directamente en tus
                  catálogos.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Retargeting Automático:</strong> Persigue a quien vio tu catálogo pero no compró.
                    </span>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>ROAS Real:</strong> Sabe exactamente qué anuncio generó esa cotización grande.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RADAR CARD */}
            <Card className="bg-slate-800 border-slate-700 text-slate-100 overflow-hidden group hover:border-emerald-500 transition-colors">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                  <BrainCircuit className="w-6 h-6 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-white">Radar de Mercado & Search Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                  Escuchamos lo que tus clientes (y los clientes de ellos) buscan en el buscador interno.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Demanda Oculta:</strong> "50 personas buscaron 'Válvula X' y no la tienes".
                    </span>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Inventario Inteligente:</strong> Compra solo lo que el mercado ya está pidiendo.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: CTA FINAL */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">¿Listo para dominar tu mercado?</h2>
          <p className="text-xl text-slate-600 mb-10">
            No te suscribas solo a un software. Suscríbete a un modelo de negocio que trabaja mientras duermes.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 text-lg font-bold shadow-xl shadow-indigo-200"
            >
              Empezar Prueba Gratuita
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-50 h-14 px-10 text-lg"
            >
              Agendar Demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Sin tarjeta de crédito • Cancela cuando quieras • Soporte en español
          </p>
        </div>
      </section>

      {/* FOOTER (Consistente con el diseño anterior) */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-sm">
            <div>
              <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2">
                <Network className="w-5 h-5" /> CatifyPro
              </h3>
              <p className="leading-relaxed mb-4">
                La plataforma definitiva para digitalizar, distribuir y escalar operaciones comerciales B2B.
              </p>
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
                <li>
                  <button
                    onClick={() => navigate("/why-subscribe")}
                    className="hover:text-indigo-400 transition-colors text-indigo-400"
                  >
                    Por qué CatifyPro
                  </button>
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
                  <button className="hover:text-indigo-400 transition-colors">Términos de Servicio</button>
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
