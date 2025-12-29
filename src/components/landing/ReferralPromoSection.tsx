import { Link } from "react-router-dom";
import { UserPlus, QrCode, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: UserPlus,
    title: "Regístrate Gratis",
    description: "Crea tu cuenta en segundos y accede a tu panel.",
  },
  {
    icon: QrCode,
    title: "Obtén tu Código Único",
    description: "Copia tu link de afiliado desde el Dashboard.",
  },
  {
    icon: Wallet,
    title: "Recibe Pagos Semanales",
    description: "Depositamos tus ganancias cada semana directamente a tu cuenta.",
  },
];

export const ReferralPromoSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tu Nueva Fuente de Ingresos: Programa de Partners 💸
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Sin inversión inicial. Tú compartes, nosotros pagamos.
          </p>
        </div>

        {/* La Oferta Irresistible */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="text-5xl md:text-6xl font-extrabold text-emerald-600 mb-2">
                50%
              </div>
              <p className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                de la venta
              </p>
              <p className="text-lg text-muted-foreground font-medium">
                el 1er Mes
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="text-5xl md:text-6xl font-extrabold text-indigo-600 mb-2">
                +50%
              </div>
              <p className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                ADICIONAL
              </p>
              <p className="text-lg text-muted-foreground font-medium">
                si renuevan el 2do Mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cómo Funciona */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Cómo Funciona
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <Card 
                key={index} 
                className="bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Paso {index + 1}
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
            <Link to="/login">
              Quiero mi Código de Afiliado
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReferralPromoSection;
