import { RadarDeMercado } from "@/components/dashboard/RadarDeMercado";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function MarketRadar() {
  const { user } = useAuth();

  // TODO: Aquí validaremos el plan del usuario
  // Por ahora, permitimos acceso a todos los usuarios autenticados
  const hasAccess = true; // Cambiaremos esto después según el plan

  if (!hasAccess) {
    return (
      <div className="p-4 md:p-8">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Esta funcionalidad está disponible desde el Plan Básico IA ($299 MXN/mes).
            <a href="/checkout" className="underline ml-2">
              Actualizar plan
            </a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <RadarDeMercado />
    </div>
  );
}
