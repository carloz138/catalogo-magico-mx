import { useParams, useNavigate } from "react-router-dom";
import { useQuoteDetail } from "@/hooks/useQuoteDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuoteStatus } from "@/types/digital-catalog";
import { QuoteService } from "@/services/quote.service";
import { ReplicationService } from "@/services/replication.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ShareCatalogModal } from "@/components/replication/ShareCatalogModal";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quote, loading, refetch } = useQuoteDetail(id || null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activationLink, setActivationLink] = useState("");

  const handleAcceptQuote = async () => {
    if (!quote || !user?.id) return;

    setActionLoading(true);
    let generatedLink: string | null = null; // Variable para guardar el link

    try {
      // 1. Crear la réplica y obtener el link SI la distribución está habilitada
      if (quote.catalog?.enable_distribution) {
        const replicatedCatalog = await ReplicationService.createReplica({
          original_catalog_id: quote.catalog_id,
          quote_id: quote.id,
          distributor_id: user.id,
        });
        generatedLink = await ReplicationService.getActivationLink(replicatedCatalog.id); // Guardar el link
        setActivationLink(generatedLink); // Actualizar estado para el modal si aún lo usas
        setShowShareModal(true); // Mostrar el modal
      }

      // 2. Actualizar el estado de la cotización, PASANDO el link generado (o null)
      await QuoteService.updateQuoteStatus(quote.id, user.id, "accepted", generatedLink ?? undefined); // 🔥 PASAR EL LINK AQUÍ 🔥

      // 3. Mostrar notificaciones Toast
      if (generatedLink) {
        toast({
          title: "✅ Cotización aceptada",
          description: "Se creó un catálogo para tu cliente y se envió el link de activación por correo.",
        });
      } else {
        toast({
          title: "✅ Cotización aceptada",
          description: "La cotización fue aceptada y se notificó al cliente por correo.",
        });
      }

      refetch(); // Recargar datos de la cotización
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la cotización",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!quote || !user?.id) return;

    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "rejected");
      toast({
        title: "Cotización rechazada",
        description: "La cotización ha sido rechazada",
      });
      refetch();
    } catch (error: any) {
      console.error("Error rejecting quote:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la cotización",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status: QuoteStatus) => {
    const config = {
      pending: {
        icon: Clock,
        label: "Pendiente",
        color: "bg-yellow-50 text-yellow-600 border-yellow-200",
      },
      accepted: {
        icon: CheckCircle,
        label: "Aceptada",
        color: "bg-green-50 text-green-600 border-green-200",
      },
      rejected: {
        icon: XCircle,
        label: "Rechazada",
        color: "bg-red-50 text-red-600 border-red-200",
      },
    };

    return config[status];
  };

  if (loading || !quote) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;
  const total = quote.items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/quotes")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a cotizaciones
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cotización #{quote.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">
              Recibida el {format(new Date(quote.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          <Badge className={`${statusConfig.color} px-4 py-2 text-base`}>
            <StatusIcon className="w-5 h-5 mr-2" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{quote.customer_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${quote.customer_email}`} className="font-semibold text-blue-600 hover:underline">
                    {quote.customer_email}
                  </a>
                </div>
              </div>

              {quote.customer_company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-semibold">{quote.customer_company}</p>
                  </div>
                </div>
              )}

              {quote.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <a href={`tel:${quote.customer_phone}`} className="font-semibold text-blue-600 hover:underline">
                      {quote.customer_phone}
                    </a>
                  </div>
                </div>
              )}

              {quote.notes && (
                <>
                  <Separator className="my-4" />
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Notas del cliente</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">{quote.notes}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos Solicitados ({quote.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.items.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex gap-4">
                      {item.product_image_url && (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1">{item.product_name}</h4>
                        {item.product_sku && <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span>
                            Cantidad: <strong>{item.quantity}</strong>
                          </span>
                          <span>
                            Precio: <strong>${(item.unit_price / 100).toFixed(2)}</strong>
                          </span>
                          // ✅ CORRECTO
                          <Badge variant="secondary">{item.price_type === "menudeo" ? "Menudeo" : "Mayoreo"}</Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold">${(item.subtotal / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${(total / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catálogo Origen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                  <p className="font-semibold">{quote.catalog?.name || "Sin nombre"}</p>
                </div>
                {quote.catalog?.slug && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`/c/${quote.catalog.slug}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver catálogo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {quote.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote.catalog?.enable_distribution && (
                  <Alert className="bg-indigo-50 border-indigo-200">
                    <Copy className="h-4 w-4 text-indigo-600" />
                    <AlertDescription className="text-indigo-900">
                      <strong>Distribución habilitada:</strong> Al aceptar, se creará automáticamente un catálogo
                      GRATUITO para tu cliente.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleAcceptQuote}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Aceptar Cotización
                </Button>

                <Button variant="destructive" className="w-full" onClick={handleRejectQuote} disabled={actionLoading}>
                  <XCircle className="w-4 w-4 mr-2" />
                  Rechazar Cotización
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exportar</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Cotización recibida</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(quote.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {quote.status !== "pending" && (
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        quote.status === "accepted" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-sm">
                        Cotización {quote.status === "accepted" ? "aceptada" : "rechazada"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(quote.updated_at), "d 'de' MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ShareCatalogModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        activationLink={activationLink}
        customerName={quote?.customer_name || ""}
      />
    </div>
  );
}
