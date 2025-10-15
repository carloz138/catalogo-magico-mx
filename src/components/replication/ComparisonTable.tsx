import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

export function ComparisonTable() {
  const features = [
    {
      name: "Número de productos",
      free: "Máximo 50",
      paid: "Ilimitados",
    },
    {
      name: "Duración del catálogo",
      free: "30 días",
      paid: "Sin expiración",
    },
    {
      name: "Recibir cotizaciones",
      free: false,
      paid: true,
    },
    {
      name: "Panel de gestión de pedidos",
      free: false,
      paid: true,
    },
    {
      name: "Analytics de ventas",
      free: false,
      paid: true,
    },
    {
      name: "Logo personalizado",
      free: false,
      paid: true,
    },
    {
      name: "Notificaciones automáticas",
      free: false,
      paid: true,
    },
    {
      name: "Link personalizado",
      free: false,
      paid: true,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-1/3 font-semibold text-gray-900">
              Característica
            </TableHead>
            <TableHead className="w-1/3 text-center font-semibold text-gray-900 bg-gray-100">
              🆓 Catálogo Gratis
            </TableHead>
            <TableHead className="w-1/3 text-center font-semibold text-indigo-700 bg-indigo-50">
              ⭐ Catálogo Activo
              <div className="text-sm font-normal text-indigo-600 mt-1">
                $29 MXN (pago único)
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature, index) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell className="font-medium text-gray-900">
                {feature.name}
              </TableCell>
              <TableCell className="text-center bg-gray-50">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <Check className="inline-block h-5 w-5 text-green-600" />
                  ) : (
                    <X className="inline-block h-5 w-5 text-red-500" />
                  )
                ) : (
                  <span className="text-gray-700">{feature.free}</span>
                )}
              </TableCell>
              <TableCell className="text-center bg-indigo-50">
                {typeof feature.paid === "boolean" ? (
                  feature.paid ? (
                    <Check className="inline-block h-5 w-5 text-indigo-600 font-bold" />
                  ) : (
                    <X className="inline-block h-5 w-5 text-red-500" />
                  )
                ) : (
                  <span className="font-semibold text-indigo-600">
                    {feature.paid}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
