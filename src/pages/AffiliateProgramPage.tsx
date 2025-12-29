import { useEffect } from "react";
import {
  Network,
  UserPlus,
  QrCode,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Users,
  TrendingUp,
  DollarSign,
  Gift,
  Repeat,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AffiliateProgramPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  };

  const steps = [
    {
      icon: UserPlus,
      title: "Regístrate Gratis",
      description: "Crea tu cuenta en segundos y accede a tu panel de afiliado.",
    },
    {
      icon: QrCode,
      title: "Obtén tu Código Único",
      description: "Copia tu link personalizado desde el Dashboard.",
    },
    {
      icon: Wallet,
      title: "Recibe Pagos Semanales",
      description: "Depositamos tus ganancias cada semana directamente a tu cuenta.",
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Sin Inversión Inicial",
      description: "No pagas nada para empezar. Solo comparte y gana.",
    },
    {
      icon: Repeat,
      title: "Ingresos Recurrentes",
      description: "Gana cada vez que tus referidos renueven su suscripción.",
    },
    {
      icon: TrendingUp,
      title: "Sin Límite de Ganancias",
      description: "Mientras más compartas, más ganas. Sin topes.",
    },
    {
      icon: Gift,
      title: "Bonos por Renovación",
      description: "50% adicional si tu referido renueva el segundo mes.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-inter selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* HEADER - Mobile optimized */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="bg-indigo-600 p-1 rounded-md">
              <Network className="w-4 h-4 text-white" />
            </div>
            CatifyPro
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-slate-600 text-sm px-2 md:px-3">
              Login
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/login")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-sm px-3 md:px-4"
            >
              Ser Afiliado
            </Button>
          </div>
        </div>
      </header>

      {/* HERO - Mobile first */}
      <section className="pt-10 pb-10 md:pt-20 md:pb-20 container mx-auto px-4 text-center max-w-4xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-emerald-100 rounded-full blur-[80px] md:blur-[120px] opacity-60 -z-10"></div>

        <motion.div {...fadeInUp}>
          <Badge className="mb-4 md:mb-6 bg-emerald-100 text-emerald-700 border-emerald-200 px-3 md:px-4 py-1 text-[10px] md:text-xs uppercase tracking-widest">
            Programa de Partners
          </Badge>
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight tracking-tight">
            Tu Nueva Fuente de Ingresos
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              💸 Sin Inversión Inicial
            </span>
          </h1>
          <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-10 leading-relaxed max-w-3xl mx-auto px-2">
            Tú compartes, nosotros pagamos. Gana comisiones reales por cada negocio que traigas a CatifyPro.
          </p>
        </motion.div>
      </section>

      {/* LA OFERTA - Mobile first cards */}
      <section className="py-10 md:py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeInUp} className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
              La Oferta Irresistible
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto px-2">
              Comisiones agresivas que recompensan tu esfuerzo desde el primer día.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            <motion.div {...fadeInUp}>
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-lg md:shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-emerald-200 rounded-full blur-3xl opacity-50"></div>
                <CardContent className="p-6 md:p-10 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-12 md:w-16 h-12 md:h-16 bg-emerald-100 rounded-xl md:rounded-2xl mb-4 md:mb-6">
                    <DollarSign className="w-6 md:w-8 h-6 md:h-8 text-emerald-600" />
                  </div>
                  <div className="text-5xl md:text-7xl font-extrabold text-emerald-600 mb-1 md:mb-2">
                    50%
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-slate-900 mb-1 md:mb-2">
                    de la venta
                  </p>
                  <p className="text-base md:text-lg text-slate-500 font-medium">
                    el 1er Mes
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-lg md:shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
                <CardContent className="p-6 md:p-10 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-12 md:w-16 h-12 md:h-16 bg-indigo-100 rounded-xl md:rounded-2xl mb-4 md:mb-6">
                    <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-indigo-600" />
                  </div>
                  <div className="text-5xl md:text-7xl font-extrabold text-indigo-600 mb-1 md:mb-2">
                    +50%
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-slate-900 mb-1 md:mb-2">
                    ADICIONAL
                  </p>
                  <p className="text-base md:text-lg text-slate-500 font-medium">
                    si renuevan el 2do Mes
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div {...fadeInUp} className="mt-6 md:mt-12 text-center px-2">
            <div className="inline-flex flex-col md:flex-row items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl md:rounded-full px-4 md:px-6 py-3">
              <Gift className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-amber-800 font-medium text-sm md:text-base text-center">
                Ejemplo: Venta de $499 MXN = <b>$249</b> 1er mes + <b>$249</b> si renuevan
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CÓMO FUNCIONA - Mobile first */}
      <section className="py-12 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
              Cómo Funciona
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
              3 pasos simples para empezar a generar ingresos pasivos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {steps.map((step, index) => (
              <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.1 }}>
                <Card className="bg-white border border-slate-200 shadow-md md:shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-5 md:p-8 text-center">
                    <div className="relative mb-4 md:mb-6 inline-block">
                      <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                        <step.icon className="w-7 md:w-10 h-7 md:h-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 md:w-8 h-6 md:h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-500 text-sm md:text-base">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS - Mobile first grid */}
      <section className="py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
              ¿Por qué ser Afiliado?
            </h2>
            <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
              Un programa diseñado para que ganes de verdad, no solo migajas.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.1 }}>
                <Card className="bg-slate-50 border-0 hover:bg-white hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-4 md:p-6">
                    <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg md:rounded-xl bg-emerald-100 flex items-center justify-center mb-3 md:mb-4">
                      <benefit.icon className="w-5 md:w-6 h-5 md:h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-slate-900 mb-1 md:mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QUIÉN PUEDE SER AFILIADO - Mobile first */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Stats card first on mobile */}
            <div className="order-1 md:order-2 bg-white p-2 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-slate-200">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg md:rounded-xl p-6 md:p-8 text-center">
                <Users className="w-14 md:w-20 h-14 md:h-20 text-emerald-500 mx-auto mb-4 md:mb-6" />
                <p className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
                  +500 Afiliados Activos
                </p>
                <p className="text-slate-500 text-sm md:text-base">
                  Ya están generando ingresos con CatifyPro
                </p>
              </div>
            </div>

            {/* Content second on mobile */}
            <div className="order-2 md:order-1">
              <Badge className="mb-3 md:mb-4 bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                Para Todos
              </Badge>
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4 md:mb-6">
                ¿Quién puede ser Afiliado?
              </h2>
              <p className="text-slate-600 text-sm md:text-lg mb-5 md:mb-8">
                No necesitas ser experto en ventas ni tener una audiencia enorme. Solo necesitas conocer negocios que podrían beneficiarse de CatifyPro.
              </p>
              <ul className="space-y-3 md:space-y-4">
                <li className="flex gap-2 md:gap-3 text-slate-700 text-sm md:text-base">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Consultores y agencias</b> de marketing o tecnología</span>
                </li>
                <li className="flex gap-2 md:gap-3 text-slate-700 text-sm md:text-base">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Contadores y asesores</b> de negocios</span>
                </li>
                <li className="flex gap-2 md:gap-3 text-slate-700 text-sm md:text-base">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Influencers y creadores</b> de contenido B2B</span>
                </li>
                <li className="flex gap-2 md:gap-3 text-slate-700 text-sm md:text-base">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Cualquier persona</b> con contactos empresariales</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL - Mobile optimized */}
      <section className="py-12 md:py-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-5 md:top-10 md:left-10 w-24 md:w-40 h-24 md:h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-5 right-5 md:bottom-10 md:right-10 w-32 md:w-60 h-32 md:h-60 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-2xl md:text-5xl font-bold text-white mb-4 md:mb-6">
              Empieza a Ganar Hoy
            </h2>
            <p className="text-emerald-100 text-sm md:text-xl mb-6 md:mb-10 max-w-2xl mx-auto px-2">
              Regístrate gratis, obtén tu código único y comienza a generar ingresos pasivos. Sin inversión, sin riesgo.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-white text-emerald-700 hover:bg-emerald-50 h-12 md:h-16 px-6 md:px-12 text-base md:text-xl rounded-full shadow-2xl w-full max-w-xs md:max-w-none md:w-auto"
            >
              Quiero mi Código de Afiliado
              <ArrowRight className="ml-2 w-5 md:w-6 h-5 md:h-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER - Compact mobile */}
      <footer className="bg-slate-900 text-slate-400 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <button onClick={() => navigate("/")} className="text-lg md:text-xl font-bold flex items-center gap-2 text-white mx-auto mb-3 md:mb-4 justify-center">
            <div className="bg-indigo-600 p-1 rounded-md">
              <Network className="w-4 h-4 text-white" />
            </div>
            CatifyPro
          </button>
          <p className="text-xs md:text-sm">
            © {new Date().getFullYear()} CatifyPro. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
