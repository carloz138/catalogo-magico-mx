import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Store, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";

export function BusinessInfoBanner() {
  const navigate = useNavigate();
  const { businessInfo, loading } = useBusinessInfo();

  if (loading) return null;

  // Verificar si la información está completa
  const isComplete = businessInfo && 
    businessInfo.business_name && 
    businessInfo.phone;

  if (isComplete) return null;

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertDescription className="ml-2 flex items-center justify-between">
        <div>
          <strong className="text-amber-900">Completa tu información de negocio</strong>
          <br />
          <span className="text-amber-700">
            Para que tus clientes puedan contactarte, necesitas configurar tu perfil de negocio
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate("/business-info")}
          className="ml-4 bg-amber-600 hover:bg-amber-700"
        >
          <Store className="w-4 h-4 mr-2" />
          Completar ahora
        </Button>
      </AlertDescription>
    </Alert>
  );
}
