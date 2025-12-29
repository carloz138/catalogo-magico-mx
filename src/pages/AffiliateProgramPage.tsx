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
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              Ser Afiliado
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-16 pb-16 md:pt-24 md:pb-24 container mx-auto px-4 text-center max-w-4xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[120px] opacity-60 -z-10"></div>

        <motion.div {...fadeInUp}>
          <Badge className="mb-6 bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1 text-xs uppercase tracking-widest">
            Programa de Partners
          </Badge>
          <h1 className="text-3xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
            Tu Nueva Fuente de Ingresos
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              💸 Sin Inversión Inicial
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            Tú compartes, nosotros pagamos. Gana comisiones reales por cada negocio que traigas a CatifyPro.
          </p>
        </motion.div>
      </section>

      {/* LA OFERTA */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              La Oferta Irresistible
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Comisiones agresivas que recompensan tu esfuerzo desde el primer día.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div {...fadeInUp}>
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-50"></div>
                <CardContent className="p-10 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-6">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-6xl md:text-7xl font-extrabold text-emerald-600 mb-2">
                    50%
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 mb-2">
                    de la venta
                  </p>
                  <p className="text-lg text-slate-500 font-medium">
                    el 1er Mes
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
                <CardContent className="p-10 text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-6xl md:text-7xl font-extrabold text-indigo-600 mb-2">
                    +50%
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 mb-2">
                    ADICIONAL
                  </p>
                  <p className="text-lg text-slate-500 font-medium">
                    si renuevan el 2do Mes
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div {...fadeInUp} className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-6 py-3">
              <Gift className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-medium">
                Ejemplo: Si vendes una suscripción de $499 MXN, ganas <b>$249 MXN</b> el primer mes + <b>$249 MXN</b> si renuevan.
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Cómo Funciona
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              3 pasos simples para empezar a generar ingresos pasivos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.1 }}>
                <Card className="bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-500">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              ¿Por qué ser Afiliado de CatifyPro?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Un programa diseñado para que ganes de verdad, no solo migajas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div key={index} {...fadeInUp} transition={{ delay: index * 0.1 }}>
                <Card className="bg-slate-50 border-0 hover:bg-white hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QUIÉN PUEDE SER AFILIADO */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div {...fadeInUp} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
                Para Todos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                ¿Quién puede ser Afiliado?
              </h2>
              <p className="text-slate-600 text-lg mb-8">
                No necesitas ser experto en ventas ni tener una audiencia enorme. Solo necesitas conocer negocios que podrían beneficiarse de CatifyPro.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Consultores y agencias</b> de marketing o tecnología</span>
                </li>
                <li className="flex gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Contadores y asesores</b> de negocios</span>
                </li>
                <li className="flex gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Influencers y creadores</b> de contenido B2B</span>
                </li>
                <li className="flex gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span><b>Cualquier persona</b> con contactos en el mundo empresarial</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 text-center">
                <Users className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                <p className="text-2xl font-bold text-slate-900 mb-2">
                  +500 Afiliados Activos
                </p>
                <p className="text-slate-500">
                  Ya están generando ingresos con CatifyPro
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Empieza a Ganar Hoy
            </h2>
            <p className="text-emerald-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Regístrate gratis, obtén tu código único y comienza a generar ingresos pasivos. Sin inversión, sin riesgo.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-white text-emerald-700 hover:bg-emerald-50 h-16 px-12 text-xl rounded-full shadow-2xl"
            >
              Quiero mi Código de Afiliado
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <button onClick={() => navigate("/")} className="text-xl font-bold flex items-center gap-2 text-white mx-auto mb-4 justify-center">
            <div className="bg-indigo-600 p-1 rounded-md">
              <Network className="w-4 h-4 text-white" />
            </div>
            CatifyPro
          </button>
          <p className="text-sm">
            © {new Date().getFullYear()} CatifyPro. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
