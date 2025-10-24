import { ArrowLeft, Rocket, Network, Brain, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function WhySubscribePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Sencillo */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button onClick={() => navigate("/login")}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="container mx-auto max-w-4xl py-12 md:py-20 px-4 space-y-12">
        
        {/* --- Sección Hero --- */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-base py-1 px-4 rounded-full border-purple-300 bg-purple-50 text-purple-700">
            La Ventaja Estratégica de CatifyPro
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-gray-900">
            No es un Gasto. Es tu Nuevo Motor de Ventas.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            CatifyPro no es solo un "creador de catálogos". Es una Plataforma de Habilitación Comercial diseñada para PyMEs que resuelve tus tres mayores problemas: la lentitud en ventas, la incapacidad para medir tu publicidad y el alto riesgo de inventario.
          </p>
        </div>

        {/* --- Sección 1: Velocidad --- */}
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gray-50/70 border-b p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">La Ventaja Injusta (Ganas por Velocidad)</CardTitle>
                <CardDescription>Resuelve la "crisis de velocidad" y gana ventas 24/7.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  P: Mi equipo de ventas es bueno, ¿por qué necesito un cotizador automático?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  <strong className="text-gray-700">R:</strong> Porque tu equipo de ventas, como el 99% de los equipos B2B, está perdiendo. Los datos de 2025 muestran que tu competencia tarda un promedio de **42 horas** en responder a un nuevo prospecto. El problema es que **el 50% de las ventas se le otorgan al proveedor que responde primero**.
                  <br /><br />
                  El cotizador 24/7 de CatifyPro le permite a tu cliente generar su propia cotización en **cero segundos**. Mientras tu competencia duerme, tu catálogo está cerrando ventas. No estás reemplazando a tu equipo; les estás dando una herramienta para que solo se enfoquen en las cotizaciones que ya están listas para aceptarse, en lugar de perder el 70% de su día en tareas administrativas.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* --- Sección 2: Ecosistema --- */}
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gray-50/70 border-b p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <Network className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">El Ecosistema (Tu Verdadera Ventaja Competitiva)</CardTitle>
                <CardDescription>Activa el "Ecosistema de Red" y convierte a tus clientes en tus vendedores.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1" className="border-b">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  P: ¿Qué es eso del "Ecosistema" o "Red de Distribución"?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  <strong className="text-gray-700">R:</strong> Esta es nuestra característica más poderosa. Es simple:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>**Flujo Tradicional:** Tú (L1) vendes a un distribuidor (L2). La venta termina ahí.</li>
                    <li>**Flujo CatifyPro:** Tú (L1) vendes a un distribuidor (L2). Al aceptar tu cotización, el L2 recibe **GRATIS** su propio catálogo replicado, con **tu** inventario completo.</li>
                    <li>**El Resultado:** Tu distribuidor (L2) ahora usa tu plataforma para venderle a *sus* clientes (L3). Has convertido a tu cliente en tu propia fuerza de ventas digital.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  P: ¿Qué gana mi cliente (L2) con esto?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  <strong className="text-gray-700">R:</strong> Le estás regalando un E-commerce B2B completo sin costo. Él ahora puede gestionar sus propios pedidos, compartir un link profesional y (lo más importante) vender productos **tuyos** que no tiene en stock (la función "Bajo Pedido"). Aumenta sus ventas y su profesionalismo.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  P: ¿Qué gano yo (L1)?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  <strong className="text-gray-700">R:</strong> Ganas el juego.
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>**Costo de Adquisición Cero:** Cada cliente L3 que tu red L2 adquiere es un cliente nuevo para tus productos, sin que tú gastes un peso en marketing.</li>
                    <li>**Venta Sin Inventario:** Tu L2 puede vender *todo* tu catálogo, no solo lo que te compró. Recibirás pedidos incrementales de productos que tu L2 no se atrevía a comprar por riesgo de inventario.</li>
                    <li>**Lealtad Total (Channel Lock-in):** Tu distribuidor L2 ahora *depende* de tu plataforma para operar. El costo de cambiarse a tu competencia (que solo ofrece PDFs) es demasiado alto. Has asegurado tu cadena de distribución.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* --- Sección 3: Cerebro --- */}
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gray-50/70 border-b p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">El "Cerebro" (Dejar de Adivinar)</CardTitle>
                <CardDescription>Mide tu ROI con Píxeles y elimina el riesgo de inventario con el "Radar de Mercado".</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1" className="border-b">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  P: ¿Qué es la "Integración de Píxeles" y para qué sirve?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  <strong className="text-gray-700">R:</strong> Es la solución al "agujero negro" del ROI de marketing en B2B.
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>**El Problema:** Hoy, gastas $20,000 en LinkedIn o Meta. Los clientes ven tu anuncio, te piden el PDF por correo y la cotización ocurre "offline". **No puedes** saber si esa venta vino del anuncio.</li>
                    <li>**La Solución:** Pegas tu script de Google Tag Manager (GTM) en tu catálogo CatifyPro. Cuando un cliente genera una cotización, nosotros disparamos un evento. Por primera vez, tu panel de Meta Ads y Google Analytics te dirá: "La campaña de LinkedIn generó 3 cotizaciones por $150,000".</li>
                    <li>**Beneficio:** Dejas de adivinar tu gasto publicitario y empiezas a optimizarlo basado en qué campañas realmente generan ingresos.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-0">
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  P: ¿Qué es el "Radar de Mercado"?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  <strong className="text-gray-700">R:</strong> Es tu herramienta para eliminar el riesgo de inventario.
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>**El Problema:** Las PyMEs "adivinan" qué importar o fabricar, basándose en datos de mercado deficientes.</li>
                    <li>**La Solución:** Tu red de L2 y L3 ahora usa el botón "¿No encuentras lo que buscas?". Tu dashboard te muestra un informe agregado: "75 clientes de 40 revendedores distintos pidieron el 'Tornillo X' este mes".</li>
                    <li>**Beneficio:** Tomas decisiones de inventario basadas en **demanda real** de tu propia red, no en suposiciones.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        
        {/* --- Sección 4: Cierre (Por Qué Pagar) --- */}
        <Card className="shadow-lg overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 text-white">
          <CardHeader className="p-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-3xl text-white">¿Por Qué Pagar?</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 text-purple-100 text-lg space-y-4">
            <p>La versión gratuita es excelente para organizar tus productos. Pero las versiones de pago son las que **multiplican tus ingresos**:</p>
            <ul className="list-none space-y-3">
              <li className="flex items-start gap-3">
                <Badge className="bg-purple-300 text-purple-900 mt-1">Plan Cotizador</Badge>
                <span>Resuelve la "crisis de velocidad" y gana ventas 24/7.</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="bg-purple-300 text-purple-900 mt-1">Plan Ecosistema</Badge>
                <span>Activa el "Ecosistema de Red" y convierte a tus clientes en tus vendedores.</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="bg-purple-300 text-purple-900 mt-1">Plan Inteligencia</Badge>
                <span>Mide tu ROI con Píxeles y elimina el riesgo de inventario con el "Radar de Mercado".</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-black/10 p-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">La pregunta no es si puedes permitirte CatifyPro.</h2>
              <p className="text-xl text-purple-200 mb-6">
                La pregunta es: ¿cuánto dinero estás perdiendo *cada día* por responder 42 horas tarde, no poder medir tu marketing y adivinar tu inventario?
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-purple-700 hover:bg-gray-100 text-base font-bold px-8 py-6"
                onClick={() => navigate("/checkout")} // O '/pricing'
              >
                Ver Planes y Precios
              </Button>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
