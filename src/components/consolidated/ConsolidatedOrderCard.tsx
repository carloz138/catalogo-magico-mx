import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConsolidatedOrderWithDetails } from "@/types/consolidated-order";
import {
  Package,
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConsolidatedOrderCardProps {
  order: ConsolidatedOrderWithDetails;
  onSync?: (orderId: string) => void;
  onClick?: (orderId: string) => void;
  syncing?: boolean;
}

export function ConsolidatedOrderCard({
  order,
  onSync,
  onClick,
  syncing = false,
}: ConsolidatedOrderCardProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: {
        label: "Borrador",
        icon: Clock,
        className: "bg-gray-100 text-gray-700",
      },
      sent: {
        label: "Enviado",
        icon: Send,
        className: "bg-blue-100 text-blue-700",
      },
      accepted: {
        label: "Aceptado",
        icon: CheckCircle,
        className: "bg-emerald-100 text-emerald-700",
      },
      rejected: {
        label: "Rechazado",
        icon: XCircle,
        className: "bg-red-100 text-red-700",
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer"
      onClick={() => onClick?.(order.id)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Info principal */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {order.supplier_business_name || order.supplier_name}
                </h3>
                <p className="text-sm text-muted-foreground">{order.catalog_name}</p>
              </div>
              <Badge className={statusConfig.className}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Estadísticas */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {order.items_count} producto{order.items_count !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {order.source_quotes_count} cotización{order.source_quotes_count !== 1 ? "es" : ""}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />$
                {(order.total_amount / 100).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}{" "}
                MXN
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(order.created_at), "d MMM yyyy", { locale: es })}
              </span>
            </div>

            {order.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                <strong>Nota:</strong> {order.notes}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex md:flex-col gap-2">
            {order.status === "draft" && onSync && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSync(order.id);
                }}
                disabled={syncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                Sincronizar
              </Button>
            )}
            <Button
              variant={order.status === "draft" ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(order.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver detalle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
