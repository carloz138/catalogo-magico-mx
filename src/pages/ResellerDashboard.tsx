import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReplicationService } from "@/services/replication.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  ExternalLink,
  FileText,
  AlertCircle,
  Lock,
  Mail,
  CheckCircle,
  Package,
  Clock,
  DollarSign,
} from "lucide-react";
import type { ResellerDashboardData } from "@/types/digital-catalog";

export default function ResellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const catalogId = searchParams.get("catalog_id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResellerDashboardData | null>(null);

  useEffect(() => {
    if (!user || !catalogId) {
      navigate("/");
      return;
    }
    loadDashboard();
  }, [user, catalogId]);

  const loadDashboard = async () => {
    if (!user?.id || !catalogId) return;

    setLoading(true);
    try {
      const dashboardData = await ReplicationService.getResellerDashboard(catalogId, user.id);
      setData(dashboardData);
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (data?.catalog.public_url) {
      navigator.clipboard.writeText(data.catalog.public_url);
      toast({
        title: "✅ Link copiado",
        description: "Compártelo con tus clientes",
      });
    }
  };

  const shareWhatsApp = () => {
    if (data?.catalog.public_url) {
      const message = `🎉 ¡Mira mi catálogo de productos!\n\n${data.catalog.public_url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">No se pudo cargar el dashboard</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con Banner de Upgrade */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                🎉 ¡Tu catálogo está activo!
              </h1>
              <p className="text-blue-100">
                {data.catalog.name} • {data.catalog.product_count} productos
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate("/reset-password")}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Lock className="w-4 h-4 mr-2" />
              Crear contraseña
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <Mail className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Acceso temporal por email:</strong> Revisa tu bandeja de entrada para acceder
            en el futuro. Para acceso permanente, crea una contraseña.
          </AlertDescription>
        </Alert>

        {/* Grid Principal */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tu Catálogo Público */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Tu Catálogo Público
              </CardTitle>
              <CardDescription>Comparte este link con tus clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300">
                <p className="text-sm text-gray-600 mb-2">Link público:</p>
                <p className="font-mono text-sm text-blue-600 break-all mb-3">
                  {data.catalog.public_url}
                </p>
                <div className="flex gap-2">
                  <Button onClick={copyLink} variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={shareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                    WhatsApp
                  </Button>
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => window.open(data.catalog.public_url, "_blank")}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver catálogo
                </Button>
                
                <Button
                  onClick={() => navigate(`/reseller/edit-prices?catalog_id=${catalogId}`)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Editar Precios
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tu Cotización Original */}
          {data.original_quote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Tu Cotización Original
                </CardTitle>
                <CardDescription>La cotización que generaste</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {data.original_quote.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="font-bold text-lg">
                    ${data.original_quote.total_amount.toLocaleString("es-MX")} MXN
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Productos:</span>
                  <span>{data.original_quote.items_count} items</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Ver detalle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.total_quotes}</p>
                  <p className="text-sm text-gray-600">Cotizaciones totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.pending_quotes}</p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.accepted_quotes}</p>
                  <p className="text-sm text-gray-600">Aceptadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cotizaciones Recibidas */}
        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones de tus Clientes</CardTitle>
            <CardDescription>
              Cuando tus clientes generen cotizaciones, aparecerán aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.received_quotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">Aún no hay cotizaciones</p>
                <p className="text-sm text-gray-500">
                  Comparte tu catálogo para empezar a recibir solicitudes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.received_quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    {/* Aquí irían los detalles de cada cotización */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
