import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Zap,
  Clock,
  TrendingUp,
  DollarSign,
  Shield,
  Users,
  CheckCircle2,
  Target,
  Sparkles,
  Network,
  Menu,
  X,
  Check,
  ChevronDown,
  MessageSquare,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [monthlyLeads, setMonthlyLeads] = useState(100);
  const [avgQuote, setAvgQuote] = useState(50000);

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

  const handleAuthButton = async () => {
    if (user) {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada");
    } else {
      navigate("/login");
    }
  };

  const lossesPerMonth = Math.round((monthlyLeads * avgQuote * 0.35) / 100);
  const capturedSales = lossesPerMonth;

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const slideUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 },
  };

  return (
    <div className="min-h-screen bg-neutral-light font-inter">
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => navigate("/")} className="text-2xl font-bold text-primary">
              CatifyPro
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={handleAuthButton} className="text-neutral">
                Login
              </Button>
              <Button variant="ghost" onClick={() => navigate("/why-subscribe")} className="text-neutral">
                Por qué suscribirse
              </Button>
              <Button variant="ghost" onClick={() => navigate("/blog")} className="text-neutral">
                Blog
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  handleAuthButton();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left"
              >
                Login
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/why-subscribe");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left"
              >
                Por qué suscribirse
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/blog");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left"
              >
                Blog
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Hero principal */}
      <motion.section
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-secondary/5"
        {...fadeIn}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral mb-6 leading-tight">
            Cotiza en segundos. <br />
            Cierra ventas sin esperar.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-4 max-w-4xl mx-auto">
            Deja de perder oportunidades por tardar en responder. Con CatifyPro, tus clientes cotizan y compran 24/7 —
            incluso mientras duermes.
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            El primero que responde, gana. Convierte tus cotizaciones en un sistema automático que trabaja por ti y
            transforma a tus clientes en tu fuerza de ventas.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? "/upload" : "/login")}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
          >
            Comienza gratis
          </Button>

          {/* Indicadores destacados */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
            <Card className="p-6 text-center bg-white shadow-md">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">+50%</div>
                <div className="text-sm text-gray-600">más ventas por respuesta inmediata</div>
              </CardContent>
            </Card>
            <Card className="p-6 text-center bg-white shadow-md">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">0 seg</div>
                <div className="text-sm text-gray-600">de tiempo de respuesta</div>
              </CardContent>
            </Card>
            <Card className="p-6 text-center bg-white shadow-md">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">3X</div>
                <div className="text-sm text-gray-600">crecimiento en pedidos con red activa</div>
              </CardContent>
            </Card>
            <Card className="p-6 text-center bg-white shadow-md">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary mb-2">$0</div>
                <div className="text-sm text-gray-600">costo de adquisición con red viral</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 3. Comparativa rápida */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" {...slideUp}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-12">
            Tu competencia vs Tú
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Tu Competencia */}
            <Card className="p-8 border-2 border-red-200 bg-red-50">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-neutral mb-6 text-center">Tu Competencia</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Responde tarde o por WhatsApp</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Pierde al cliente más rápido</span>
                  </li>
                  <li className="flex items-start">
                    <X className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Vive con CAC alto</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Tú con CatifyPro */}
            <Card className="p-8 border-2 border-primary bg-primary/5 shadow-lg">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-neutral mb-6 text-center">Tú (con CatifyPro)</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Cotizas en segundos, 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Capturas más ventas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Expandes tu red sin gastar en marketing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 4. El problema que te cuesta ventas */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-light" {...fadeIn}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-4">
            El problema que te cuesta ventas todos los días
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Estos son los frenos que limitan tu crecimiento y que CatifyPro elimina con automatización inteligente.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Clock className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral mb-2">Horas perdidas</h3>
                <p className="text-gray-600 text-sm">Semanas haciendo PDFs manuales.</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Zap className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral mb-2">Respuesta lenta</h3>
                <p className="text-gray-600 text-sm">Ventas que se van a otro proveedor.</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Target className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral mb-2">Sin control</h3>
                <p className="text-gray-600 text-sm">No sabes qué clientes te compran ni por qué.</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <TrendingUp className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-neutral mb-2">Crecimiento limitado</h3>
                <p className="text-gray-600 text-sm">Tu negocio depende solo de ti.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 5. Por qué CatifyPro es diferente - 4 Pilares */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" {...slideUp}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-4">Los 4 pilares de CatifyPro</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            No somos un CRM ni un e-commerce. Somos la plataforma que conecta Ventas, Operaciones y Marketing para que
            tu negocio crezca solo.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-0">
                <Sparkles className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-2xl font-bold text-neutral mb-2">Crisis de productividad</h3>
                <p className="text-gray-700">Automatiza tareas y libera tiempo.</p>
              </CardContent>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-0">
                <Target className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-neutral mb-2">Aceleración de ingresos</h3>
                <p className="text-gray-700">Cierra ventas mientras duermes.</p>
              </CardContent>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-0">
                <Shield className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-2xl font-bold text-neutral mb-2">Cerebro estratégico</h3>
                <p className="text-gray-700">Toma decisiones con datos reales.</p>
              </CardContent>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-0">
                <Network className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold text-neutral mb-2">Ventaja competitiva</h3>
                <p className="text-gray-700">Convierte a tus clientes en tus vendedores.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 6. Calculadora de ROI */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-light" {...fadeIn}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-4">
            Calcula cuánto estás dejando ir cada mes
          </h2>
          <p className="text-center text-gray-600 mb-12">
            El 35-50% de las ventas van al primero que responde. Descubre cuánto pierdes cada mes por no automatizar
            tus cotizaciones.
          </p>

          <Card className="p-8 bg-white shadow-lg">
            <CardContent className="p-0 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leads mensuales</label>
                <Input
                  type="number"
                  value={monthlyLeads}
                  onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor promedio de cotización (MXN)
                </label>
                <Input
                  type="number"
                  value={avgQuote}
                  onChange={(e) => setAvgQuote(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <Card className="p-6 bg-red-50 border-2 border-red-200">
                  <CardContent className="p-0">
                    <p className="text-sm text-gray-600 mb-2">Pérdidas por respuesta lenta</p>
                    <p className="text-3xl font-bold text-red-600">${lossesPerMonth.toLocaleString()} MXN/mes</p>
                  </CardContent>
                </Card>

                <Card className="p-6 bg-green-50 border-2 border-green-200">
                  <CardContent className="p-0">
                    <p className="text-sm text-gray-600 mb-2">Ventas capturadas con CatifyPro</p>
                    <p className="text-3xl font-bold text-green-600">${capturedSales.toLocaleString()} MXN/mes</p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-center text-lg font-semibold text-gray-700 mt-6">
                Con CatifyPro, esas ventas ya no se te escapan.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* 7. Ciclo de Crecimiento Acelerado */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" {...slideUp}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-12">
            Cómo CatifyPro transforma tu negocio paso a paso
          </h2>

          <div className="space-y-8">
            {[
              {
                num: "1",
                text: "Crea tu catálogo profesional en minutos.",
                icon: <Sparkles className="w-8 h-8" />,
              },
              {
                num: "2",
                text: "Tu cliente cotiza y tú apruebas con un clic.",
                icon: <CheckCircle2 className="w-8 h-8" />,
              },
              {
                num: "3",
                text: "Gestionas pedidos y seguimientos 24/7.",
                icon: <Clock className="w-8 h-8" />,
              },
              {
                num: "4",
                text: "Tus clientes replican tu catálogo y venden a su red.",
                icon: <Users className="w-8 h-8" />,
              },
              {
                num: "5",
                text: "Tu negocio crece mientras tú controlas todo.",
                icon: <TrendingUp className="w-8 h-8" />,
              },
            ].map((step, idx) => (
              <Card key={idx} className="p-6 bg-neutral-light hover:shadow-lg transition-shadow">
                <CardContent className="p-0 flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-secondary">{step.icon}</div>
                      <p className="text-lg font-semibold text-neutral">{step.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 8. Tu Arma Secreta */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-secondary/10" {...fadeIn}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral mb-6">
            Convierte a cada cliente en tu propio vendedor
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto">
            Con un clic, tu cliente replica tu catálogo con tus productos. Ellos venden a su red, tú ganas.
            Crecimiento viral sin esfuerzo.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 bg-white text-center">
              <CardContent className="p-0">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-neutral mb-2">Costo de adquisición $0</h3>
              </CardContent>
            </Card>
            <Card className="p-6 bg-white text-center">
              <CardContent className="p-0">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-neutral mb-2">Mayor retención</h3>
              </CardContent>
            </Card>
            <Card className="p-6 bg-white text-center">
              <CardContent className="p-0">
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-neutral mb-2">Crecimiento automático</h3>
              </CardContent>
            </Card>
            <Card className="p-6 bg-white text-center">
              <CardContent className="p-0">
                <Network className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-bold text-neutral mb-2">Red de clientes-vendedores activa</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 9. Análisis competitivo */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" {...slideUp}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-4">
            ¿Por qué no usar Salesforce, Shopify o HubSpot?
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Porque están fragmentados. CatifyPro conecta Ventas + Operaciones + Marketing en una sola plataforma.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-4 text-left">Característica</th>
                  <th className="p-4 text-center">CatifyPro</th>
                  <th className="p-4 text-center">Salesforce</th>
                  <th className="p-4 text-center">Shopify</th>
                  <th className="p-4 text-center">HubSpot</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Cotizador 24/7</td>
                  <td className="p-4 text-center">
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                </tr>
                <tr className="bg-neutral-light">
                  <td className="p-4 font-medium">Portal de pedidos</td>
                  <td className="p-4 text-center">
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center text-gray-500">~</td>
                  <td className="p-4 text-center text-gray-500">~</td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Red viral B2B</td>
                  <td className="p-4 text-center">
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                </tr>
                <tr className="bg-neutral-light">
                  <td className="p-4 font-medium">Radar de demanda</td>
                  <td className="p-4 text-center">
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center">
                    <X className="w-5 h-5 text-red-600 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Precio accesible</td>
                  <td className="p-4 text-center">
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="p-4 text-center text-red-600 font-bold">$$$</td>
                  <td className="p-4 text-center text-red-600 font-bold">$$$</td>
                  <td className="p-4 text-center text-yellow-600 font-bold">$$</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>

      {/* 10. Casos de éxito */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-light" {...fadeIn}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-4">
            Empresas reales, resultados reales
          </h2>
          <p className="text-center text-gray-600 mb-12">Lo que nuestros clientes están logrando con CatifyPro</p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-white shadow-lg">
              <CardContent className="p-0">
                <p className="text-gray-700 mb-6 italic">
                  "Mis clientes ahora venden mis productos con su propio catálogo. Mis pedidos se triplicaron."
                </p>
                <p className="font-bold text-neutral">— Carlos Mendoza</p>
                <p className="text-sm text-gray-600">Distribuidor Mayorista (Guadalajara)</p>
              </CardContent>
            </Card>

            <Card className="p-8 bg-white shadow-lg">
              <CardContent className="p-0">
                <p className="text-gray-700 mb-6 italic">
                  "El cotizador 24/7 es un cambio total. Cierro ventas incluso mientras duermo."
                </p>
                <p className="font-bold text-neutral">— Sofía Hernández</p>
                <p className="text-sm text-gray-600">Textiles y Decoración (Puebla)</p>
              </CardContent>
            </Card>

            <Card className="p-8 bg-white shadow-lg">
              <CardContent className="p-0">
                <p className="text-gray-700 mb-6 italic">
                  "Ahora tengo 20 clientes que venden por mí. No gasto en marketing, solo cumplo pedidos."
                </p>
                <p className="font-bold text-neutral">— Roberto Aguilar</p>
                <p className="text-sm text-gray-600">Productos Industriales (Monterrey)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 11. Planes y precios */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" {...slideUp}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-4">
            Elige tu plan de crecimiento
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Desde catálogos básicos hasta ecosistemas completos. Todos incluyen cotizador y soporte.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plan Starter */}
            <Card className="p-8 bg-white border-2 border-gray-200 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-neutral mb-2">Starter</h3>
                <p className="text-4xl font-bold text-primary mb-1">
                  $99<span className="text-lg text-gray-600">/mes</span>
                </p>
                <p className="text-sm text-gray-600 mb-6">Ideal para empezar</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Catálogo digital</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Cotizador automático</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Hasta 2 catálogos activos</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => navigate(user ? "/checkout" : "/login")}
                >
                  Comienza gratis
                </Button>
              </CardContent>
            </Card>

            {/* Plan Básico - Popular */}
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary shadow-xl scale-105">
              <CardContent className="p-0">
                <Badge className="mb-4 bg-secondary text-white">Popular</Badge>
                <h3 className="text-2xl font-bold text-neutral mb-2">Básico</h3>
                <p className="text-4xl font-bold text-primary mb-1">
                  $299<span className="text-lg text-gray-600">/mes</span>
                </p>
                <p className="text-sm text-gray-600 mb-6">Red de distribución activa</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Red de distribución activa</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">5 catálogos activos</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Analytics avanzadas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Créditos IA incluidos</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => navigate(user ? "/checkout" : "/login")}
                >
                  Comienza gratis
                </Button>
              </CardContent>
            </Card>

            {/* Plan Profesional */}
            <Card className="p-8 bg-white border-2 border-gray-200 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold text-neutral mb-2">Profesional</h3>
                <p className="text-4xl font-bold text-primary mb-1">
                  $599<span className="text-lg text-gray-600">/mes</span>
                </p>
                <p className="text-sm text-gray-600 mb-6">Ecosistema completo</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Red ilimitada</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Inteligencia de negocio PRO</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Catálogos privados</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">100 créditos IA/mes incluidos</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={() => navigate(user ? "/checkout" : "/login")}
                >
                  Comienza gratis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* 12. Preguntas frecuentes */}
      <motion.section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-light" {...fadeIn}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-neutral mb-12">
            Todo lo que necesitas saber sobre CatifyPro
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white rounded-lg px-6 border-none">
              <AccordionTrigger className="text-left font-semibold text-neutral hover:no-underline">
                ¿Qué pasa cuando mi cliente replica un catálogo?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Tu cliente obtiene gratuitamente su propia versión de tu catálogo con TUS productos. Puede personalizar
                su marca y precios (con tus límites), pero el inventario y precios base los controlas tú. Cuando su
                cliente hace un pedido, tú lo cumples y defines los márgenes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white rounded-lg px-6 border-none">
              <AccordionTrigger className="text-left font-semibold text-neutral hover:no-underline">
                ¿Puedo controlar los precios que mis clientes ven?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Sí, completamente. Tú defines el precio base y el margen mínimo. Tu cliente puede aumentar el precio
                para su margen, pero nunca vender por debajo de tu precio mínimo. Mantienes control total sobre tu
                rentabilidad.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white rounded-lg px-6 border-none">
              <AccordionTrigger className="text-left font-semibold text-neutral hover:no-underline">
                ¿Qué tan seguro es el sistema?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Utilizamos encriptación de nivel bancario y cumplimos con todas las normativas de protección de datos.
                Tu información de productos, precios y clientes está completamente protegida. Además, cuentas con
                backups automáticos diarios.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white rounded-lg px-6 border-none">
              <AccordionTrigger className="text-left font-semibold text-neutral hover:no-underline">
                ¿Es difícil configurarlo?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Para nada. En menos de 15 minutos puedes tener tu primer catálogo activo. El sistema es intuitivo: sube
                productos, personaliza tu marca, y comparte el link. No necesitas conocimientos técnicos. Además,
                ofrecemos onboarding guiado.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white rounded-lg px-6 border-none">
              <AccordionTrigger className="text-left font-semibold text-neutral hover:no-underline">
                ¿Qué tipo de soporte ofrecen?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                Todos los planes incluyen soporte por email con respuesta en menos de 24 horas. Los planes Profesional
                incluyen soporte prioritario con respuesta en menos de 4 horas y acceso a videollamadas de
                capacitación.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </motion.section>

      {/* 13. Cierre final (CTA) */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/80 text-white"
        {...slideUp}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">Comienza a responder en 0 segundos.</h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a las empresas que ya capturan las ventas que otros pierden por tardar.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? "/upload" : "/login")}
            className="bg-white text-primary hover:bg-neutral-light px-10 py-6 text-lg font-semibold"
          >
            Comienza gratis
          </Button>
        </div>
      </motion.section>

      {/* 14. Footer */}
      <footer className="bg-neutral text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Producto */}
            <div>
              <h3 className="font-bold text-lg mb-4">Producto</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <button onClick={() => navigate("/why-subscribe")} className="hover:opacity-100">
                    Funcionalidades
                  </button>
                </li>
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:opacity-100">
                    Precios
                  </button>
                </li>
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:opacity-100">
                    4 Pilares
                  </button>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="font-bold text-lg mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <button onClick={() => navigate("/blog")} className="hover:opacity-100">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:opacity-100">
                    Casos de Éxito
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/login")} className="hover:opacity-100">
                    Soporte
                  </button>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="font-bold text-lg mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-sm opacity-70">
            © 2024 CatifyPro. Todos los derechos reservados. Hecho con ❤️ en México.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
