import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Rocket, Lock } from "lucide-react";
// 👇 Usamos 'react-router-dom' como en tu App.tsx
import { Link } from "react-router-dom";

interface UpsellBannerProps {
  featureName: string;
  description: string;
  requiredPlan: string;
  linkToPlans?: string;
  icon?: "lock" | "rocket";
}

export const UpsellBanner = ({
  featureName,
  description,
  requiredPlan,
  linkToPlans = "/checkout", // Tu ruta a la página de planes/pago
  icon = "rocket",
}: UpsellBannerProps) => {
  const Icon = icon === "lock" ? Lock : Rocket;

  return (
    <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-900">
      <Icon className="h-5 w-5 text-blue-600" />
      <AlertTitle className="font-semibold text-blue-900">¡Desbloquea {featureName}!</AlertTitle>
      <AlertDescription className="text-blue-800">
        <p className="mb-3">{description}</p>
        <p className="text-xs mb-4">
          Esta función está incluida en nuestro plan <span className="font-semibold">{requiredPlan}</span> y superiores.
        </p>{" "}
        {/* <--- ¡CORREGIDO! */}
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to={linkToPlans}>
            Ver Planes y Precios
            <Rocket className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};
