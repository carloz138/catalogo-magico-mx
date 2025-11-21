import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess } from "@/hooks/useFeatureAccess"; // <--- Tu hook maestro
import { Radar } from "lucide-react";

export const MarketRadarWidget = () => {
  // 1. Usamos el Hook para preguntar por la feature "radar_inteligente"
  const { isAllowed, loading, UpsellComponent } = useFeatureAccess("radar_inteligente");

  // 2. Estado de carga inicial (mientras Supabase verifica el plan)
  if (loading) {
    return <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl" />;
  }

  // 3. BLOQUEO: Si no tiene permiso, renderizamos el componente de venta
  if (!isAllowed) {
    return (
      <div className="h-full min-h-[300px]">
        {UpsellComponent}
      </div>
    );
  }

  // 4. ACCESO CONCEDIDO: Aquí va la lógica real del componente
  // (Por ahora pondremos datos dummy para probar que el desbloqueo funciona)
  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Radar className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Radar de Mercado
          </CardTitle>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          En vivo
        </Badge>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* TABLA DUMMY PARA PROBAR VISUALIZACIÓN */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Producto Buscado</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">Tubería PVC 4"</td>
                  <td className="px-4 py-3">50 pzas</td>
                  <td className="px-4 py-3 text-gray-500">Hace 2 min</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">Cemento Gris</td>
                  <td className="px-4 py-3">2 ton</td>
                  <td className="px-4 py-3 text-gray-500">Hace 15 min</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Estos son leads reales de clientes que no encontraron productos en tu catálogo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
