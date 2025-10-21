import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, Package } from "lucide-react";

export const UpsellBanner = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">
              ¡Crea tus propios catálogos!
            </h3>
          </div>
          <p className="text-gray-700">
            Actualmente estás revendiendo catálogos. Suscríbete para crear tus propios catálogos originales
            y lleva tu negocio al siguiente nivel.
          </p>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="h-4 w-4 text-blue-600" />
              <span>Catálogos ilimitados</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>Analytics avanzados</span>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/checkout')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold"
        >
          Ver Planes
        </Button>
      </div>
    </Card>
  );
};
