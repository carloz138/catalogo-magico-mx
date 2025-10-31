import { Zap, Users, TrendingUp, Clock, Network, BarChart3, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WhySubscribePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate("/")}
                className="text-2xl font-bold bg-gradient-to-r from-[#0070F3] to-[#FF9B50] bg-clip-text text-transparent"
              >
                CatifyPro
              </button>
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Inicio
                </button>
                <button className="text-sm font-medium text-[#0070F3] border-b-2 border-[#0070F3] pb-1">
                  Por qué suscribirse
                </button>
                <button
                  onClick={() => navigate("/blog")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
                Login
              </Button>
              <Button onClick={() => navigate("/login")} className="bg-[#0070F3] hover:bg-[#0070F3]/90 text-white">
                Comienza Gratis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* SECCIÓN 1 — Introducción Expandida */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            ¿Por Qué Suscribirte a CatifyPro?
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Porque mientras tu competencia sigue enviando cotizaciones por correo y esperando días para responder, tú ya
            estás cerrando ventas automáticas las 24 horas.
          </p>
          <div className="bg-muted/50 rounded-lg p-6 md:p-8 max-w-4xl mx-auto text-left space-y-4">
            <p className="text-lg text-foreground leading-relaxed">
              CatifyPro transforma tu proceso comercial en un sistema que vende solo.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              No necesitas ser experto en tecnología ni invertir miles en publicidad: tu catálogo se convierte en una
              herramienta de venta activa 24/7, tus clientes pueden generar sus propias cotizaciones al instante, y
              además pueden convertirse en tu fuerza de ventas distribuyendo tus productos a través de su propia red.
            </p>
            <p className="text-lg font-semibold text-foreground leading-relaxed">
              Esto no es solo automatización. Es multiplicar tu capacidad de venta sin aumentar tu nómina.
            </p>
          </div>
        </motion.div>
      </section>

      {/* SECCIÓN 2 — Ventaja 1: Velocidad que Genera Ventas */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-none shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#0070F3]/10 to-[#0070F3]/5 p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0070F3] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl md:text-4xl mb-3">
                      1. Gana Ventas por Velocidad: La Regla del Primer Respondedor
                    </CardTitle>
                    <p className="text-xl font-semibold text-[#0070F3]">
                      Entre el 35% y 50% de todas las ventas se las lleva quien responde primero.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">El problema:</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      La empresa promedio tarda 42 horas en responder una solicitud de cotización. Para cuando envías tu
                      PDF por correo, tu cliente ya compró con alguien más.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">La expectativa del mercado:</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      El 82% de los clientes espera respuesta en 10 minutos o menos. El 60% se va si no la recibe.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">La solución de CatifyPro:</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Tus clientes generan su propia cotización en tiempo real desde tu catálogo digital, sin esperar a
                      que tu equipo esté disponible. No importa si es domingo a las 11 PM o lunes a las 6 AM.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Tú recibes solo las solicitudes listas para cerrar, con productos seleccionados, cantidades
                      definidas y precios calculados automáticamente.
                    </p>
                  </div>

                  <div className="bg-[#0070F3]/5 rounded-lg p-6 border border-[#0070F3]/20">
                    <h3 className="text-lg font-bold text-foreground mb-3">Resultado real:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">Tiempo de respuesta: De 42 horas a 0 segundos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Más ventas capturadas mientras tu competencia duerme
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">Cero oportunidades perdidas por lentitud</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">Tu equipo dedica tiempo a cerrar, no a cotizar</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Visual comparativo */}
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <div className="bg-destructive/10 rounded-lg p-6 text-center border border-destructive/20">
                    <Clock className="w-12 h-12 text-destructive mx-auto mb-3" />
                    <div className="text-4xl font-bold text-destructive mb-2">42 horas</div>
                    <p className="text-sm text-muted-foreground">Promedio de respuesta tradicional</p>
                  </div>
                  <div className="bg-[#0070F3]/10 rounded-lg p-6 text-center border border-[#0070F3]/20">
                    <Zap className="w-12 h-12 text-[#0070F3] mx-auto mb-3" />
                    <div className="text-4xl font-bold text-[#0070F3] mb-2">0 segundos</div>
                    <p className="text-sm text-muted-foreground">Con CatifyPro</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 3 — Ventaja 2: Red de Ventas Viral */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-none shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#FF9B50]/10 to-[#FF9B50]/5 p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF9B50] flex items-center justify-center flex-shrink-0">
                    <Network className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl md:text-4xl mb-3">
                      2. Convierte a tus Clientes en tu Fuerza de Ventas Automática
                    </CardTitle>
                    <p className="text-xl font-semibold text-[#FF9B50]">
                      Cada cliente que te compra puede activar su propio catálogo y vender tus productos a su red. Tú
                      ganas cada vez que venden.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">El modelo tradicional:</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Vendes a un distribuidor y ahí termina tu alcance. Si quieres llegar a más clientes finales,
                      necesitas contratar más vendedores o invertir más en publicidad.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">El modelo CatifyPro:</h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      Cuando aceptas una cotización de tu cliente, él recibe un enlace para activar su propio catálogo
                      digital con tus productos. Su catálogo muestra:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF9B50] font-bold">•</span>
                        <span className="text-muted-foreground">
                          <strong>Productos "En Stock":</strong> Lo que te compró y tiene disponible
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF9B50] font-bold">•</span>
                        <span className="text-muted-foreground">
                          <strong>Productos "Bajo Pedido":</strong> El resto de tu catálogo que puede ofrecer sin tener
                          inventario
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Así funciona el crecimiento:</h3>
                    <ol className="space-y-3 ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">1.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Tú vendes a tu Cliente B (distribuidor, mayorista, revendedor)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">2.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Cliente B activa su catálogo replicado en un clic
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">3.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Cliente B vende a sus Clientes C (tiendas, usuarios finales) usando su catálogo digital
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">4.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Cuando Cliente C pide un producto "bajo pedido", y genera venta extra para Cliente B
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">5.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Tú produces/envías y ganas, sin haber invertido nada extra
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-[#FF9B50]/5 rounded-lg p-6 border border-[#FF9B50]/20">
                    <h3 className="text-lg font-bold text-foreground mb-2">Lo mejor:</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Tu cliente no puede ver quién es tu proveedor. El catálogo es completamente anónimo, protegiendo
                      tu cadena de suministro.
                    </p>
                  </div>

                  <div className="bg-[#0070F3]/5 rounded-lg p-6 border border-[#0070F3]/20">
                    <h3 className="text-lg font-bold text-foreground mb-3">Resultado real:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">Escalas ventas sin aumentar tu equipo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">Tus clientes trabajan para ti de forma natural</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Capturas demanda de clientes que nunca habrías alcanzado
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Cero inversión adicional en marketing o vendedores
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Diagrama visual */}
                <div className="flex items-center justify-center gap-4 py-6 flex-wrap">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-[#0070F3] flex items-center justify-center mx-auto mb-2">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Usuario A</p>
                    <p className="text-xs text-muted-foreground">(Fabricante)</p>
                  </div>
                  <div className="text-[#FF9B50] text-3xl">→</div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-[#FF9B50] flex items-center justify-center mx-auto mb-2">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Cliente B</p>
                    <p className="text-xs text-muted-foreground">(Distribuidor)</p>
                  </div>
                  <div className="text-[#FF9B50] text-3xl">→</div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0070F3] to-[#FF9B50] flex items-center justify-center mx-auto mb-2">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Cliente C</p>
                    <p className="text-xs text-muted-foreground">(Usuario final)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 4 — Ventaja 3: Inteligencia de Mercado */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-none shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#0070F3]/10 to-[#FF9B50]/5 p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0070F3] to-[#FF9B50] flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl md:text-4xl mb-3">
                      3. Toma Decisiones con Datos Reales: Deja de Adivinar qué Comprar
                    </CardTitle>
                    <p className="text-xl font-semibold text-[#0070F3]">
                      Descubre qué están pidiendo tus clientes y los clientes de tus clientes antes de invertir en
                      inventario.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">El problema del mercado latino:</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Los datos de mercado son costosos, desactualizados o simplemente no existen. Decides qué importar
                      o producir basándote en intuición, y a veces pierdes miles en inventario que no se mueve.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">La solución: Radar de Mercado integrado</h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      CatifyPro incluye un sistema de señales de demanda en tiempo real:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Tus clientes pueden reportar productos que buscan y no encuentran en tu catálogo
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Los clientes de tus clientes (en catálogos replicados) también pueden pedir productos
                          específicos
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Tú ves un dashboard con las solicitudes más frecuentes de toda tu red
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Cómo lo usas:</h3>
                    <ol className="space-y-3 ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">1.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Ves que 15 clientes están pidiendo "Cables USB-C de 3 metros"
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">2.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Decides importar ese producto con seguridad de que tiene demanda real
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">3.</span>
                        <span className="text-muted-foreground leading-relaxed">Lo agregas a tu catálogo</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">4.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Automáticamente aparece en todos los catálogos replicados como "bajo pedido"
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#FF9B50] font-bold text-lg flex-shrink-0">5.</span>
                        <span className="text-muted-foreground leading-relaxed">
                          Vendes con riesgo cero porque ya sabías que se iba a vender
                        </span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-[#FF9B50]/5 rounded-lg p-6 border border-[#FF9B50]/20">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Además, CatifyPro integra píxeles de seguimiento (Meta, Google):
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      Directamente en tu catálogo digital. Así puedes:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF9B50] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Conectar tu inversión publicitaria con ventas reales
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF9B50] font-bold">•</span>
                        <span className="text-muted-foreground">Ver qué campaña generó cada cotización</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF9B50] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Recuperar clientes que vieron tu catálogo pero no cotizaron (remarketing automático)
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-[#0070F3]/5 rounded-lg p-6 border border-[#0070F3]/20">
                    <h3 className="text-lg font-bold text-foreground mb-3">Resultado real:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">Reduces inventario ocioso hasta 40%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Inviertes solo en productos con demanda comprobada
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Justificas cada peso gastado en publicidad con ROI medible
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0070F3] font-bold">•</span>
                        <span className="text-muted-foreground">
                          Aumentas rotación de inventario y flujo de efectivo
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 5 — Beneficio Emocional y Visión */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Más que una Suscripción: Es una Estrategia de Crecimiento
            </h2>

            <div className="bg-gradient-to-br from-[#0070F3]/5 to-[#FF9B50]/5 rounded-lg p-8 md:p-12 text-left space-y-6 max-w-4xl mx-auto">
              <p className="text-xl font-semibold text-foreground">CatifyPro no reemplaza a tu equipo, lo potencia.</p>

              <div className="space-y-3">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Mientras tú gestionas el negocio estratégico:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0070F3] font-bold">•</span>
                    <span className="text-muted-foreground">
                      Tu catálogo trabaja por ti 24/7 generando cotizaciones automáticas
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0070F3] font-bold">•</span>
                    <span className="text-muted-foreground">
                      Tus clientes venden por ti multiplicando tu alcance sin costo
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0070F3] font-bold">•</span>
                    <span className="text-muted-foreground">
                      Tus decisiones se basan en datos reales de demanda, no en suposiciones
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0070F3] font-bold">•</span>
                    <span className="text-muted-foreground">Tu inversión en marketing es medible y justificable</span>
                  </li>
                </ul>
              </div>

              <p className="text-lg font-semibold text-foreground">
                Esto es cómo las PyMEs en LATAM están compitiendo contra empresas más grandes: con velocidad,
                inteligencia y redes que crecen solas.
              </p>

              <p className="text-lg text-muted-foreground">
                No necesitas estructuras complejas ni presupuestos millonarios. Solo necesitas dejar que tu negocio
                opere de forma inteligente.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 6 — Planes y CTA Final */}
      <section className="bg-gradient-to-br from-[#0070F3] to-[#FF9B50] py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8 text-white"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Elige tu Plan y Empieza a Multiplicar Ventas Hoy
            </h2>

            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
              Prueba gratis durante 14 días y empieza a automatizar tus ventas desde el primer día. Sin tarjeta de
              crédito. Cancela cuando quieras. Sin compromisos.
            </p>

            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-white text-[#0070F3] hover:bg-white/90 text-lg font-bold px-12 py-7 h-auto rounded-lg shadow-xl"
              >
                Comienza Gratis Ahora
              </Button>
            </div>

            <p className="text-lg pt-4 opacity-90">Más de 500+ empresas ya están vendiendo más rápido con CatifyPro</p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1E1E1E] text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Producto */}
            <div>
              <h3 className="font-bold text-lg mb-4">Producto</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
                    Funcionalidades
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
                    Precios
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/why-subscribe")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    4 Pilares
                  </button>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="font-bold text-lg mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
                    Nosotros
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
                    Casos de Éxito
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/blog")}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <button className="text-gray-400 hover:text-white transition-colors">Soporte</button>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="font-bold text-lg mb-4">Contacto</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>contacto@catifypro.com</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>© 2024 CatifyPro. Todos los derechos reservados. Hecho con ❤️ en México.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
