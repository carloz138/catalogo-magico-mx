import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QuoteTrackingService, TrackingQuoteData } from "@/services/quote-tracking.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Phone,
  Mail,
  Building2,
  Calendar,
  FileText,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function QuoteTracking() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<TrackingQuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await QuoteTrackingService.getQuoteByToken(token);
      setQuote(data);
    } catch (err: any) {
      console.error("Error loading quote:", err);
      setError(err.message || "No se pudo cargar la cotización");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        label: "Pendiente",
        color: "bg-yellow-50 text-yellow-600 border-yellow-200",
        description: "Tu cotización está siendo revisada",
      },
      accepted: {
        icon: CheckCircle,
        label: "Aceptada",
        color: "bg-green-50 text-green-600 border-green-200",
        description: "¡Buenas noticias! Tu cotización fue aceptada",
      },
      rejected: {
        icon: XCircle,
        label: "Rechazada",
        color: "bg-red-50 text-red-600 border-red-200",
        description: "Esta cotización no pudo ser procesada",
      },
      shipped: {
        icon: Truck,
        label: "Enviado",
        color: "bg-blue-50 text-blue-600 border-blue-200",
        description: "¡Tu pedido está en camino!",
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const handleWhatsAppContact = () => {
    if (!quote?.business_info?.phone) return;

    const phone = quote.business_info.phone.replace(/[\s\-\(\)\+]/g, "");
    const finalPhone = phone.startsWith("52") ? phone : `52${phone}`;
    
    const message = `Hola, consulto por mi pedido #${quote.order_number}`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || "Cotización no encontrada"}</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header con Branding */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">CatifyPro</h1>
              <p className="text-xs text-gray-500">Seguimiento de Pedido</p>
            </div>
          </div>
          
          {quote.business_info?.logo_url && (
            <img
              src={quote.business_info.logo_url}
              alt="Logo"
              className="h-12 w-auto object-contain"
            />
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Status Hero Card */}
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
                <StatusIcon className="w-10 h-10 text-purple-600" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold mb-2">Pedido #{quote.order_number}</h2>
                <Badge className={`${statusConfig.color} px-4 py-2 text-base`}>
                  {statusConfig.label}
                </Badge>
                <p className="text-gray-600 mt-2">{statusConfig.description}</p>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA (si está aceptado/enviado) */}
        {(quote.status === "accepted" || quote.status === "shipped") && quote.business_info?.phone && (
          <Alert className="bg-green-50 border-green-200">
            <MessageCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-green-900">
                <strong>¿Dudas sobre tu pedido?</strong> Contáctanos por WhatsApp
              </span>
              <Button
                size="sm"
                onClick={handleWhatsAppContact}
                className="bg-green-600 hover:bg-green-700 ml-4"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Grid de Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Datos del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Datos del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-semibold">{quote.customer_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{quote.customer_email}</p>
              </div>

              {quote.customer_phone && (
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-semibold">{quote.customer_phone}</p>
                </div>
              )}

              {quote.customer_company && (
                <div>
                  <p className="text-sm text-gray-500">Empresa</p>
                  <p className="font-semibold">{quote.customer_company}</p>
                </div>
              )}

              {quote.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notas</p>
                    <p className="text-sm bg-gray-50 p-3 rounded">{quote.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info del Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.business_info ? (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Negocio</p>
                    <p className="font-semibold">{quote.business_info.business_name}</p>
                  </div>

                  {quote.business_info.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      
                        href={`tel:${quote.business_info.phone}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {quote.business_info.phone}
                      </a>
                    </div>
                  )}

                  {quote.business_info.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      
                        href={`mailto:${quote.business_info.email}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {quote.business_info.email}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Información no disponible</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos ({quote.items.length})
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
                      <h4 className="font-semibold">{item.product_name}</h4>
                      {item.product_sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span>Cantidad: <strong>{item.quantity}</strong></span>
                        <span>Precio: <strong>${(item.unit_price / 100).toFixed(2)}</strong></span>
                        <Badge variant="secondary">
                          {item.price_type === "menudeo" ? "Menudeo" : "Mayoreo"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">
                        ${(item.subtotal / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total</span>
              <span className="text-2xl font-bold text-purple-600">
                ${(quote.total / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CTA de Conversión - BRANDING */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  ¿Te gustaría tener tu propio catálogo como este?
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Crea catálogos digitales profesionales, recibe cotizaciones y gestiona tu negocio desde un solo lugar.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span>Configuración en 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span>+500 negocios en LATAM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span>Prueba gratis</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg"
              >
                Crear Mi Catálogo Gratis
              </Button>

              <p className="text-xs text-gray-500">
                No se requiere tarjeta de crédito • Cancela cuando quieras
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Branding */}
        <div className="text-center py-6 text-sm text-gray-500">
          <p>
            Powered by{" "}
            <button
              onClick={() => navigate("/")}
              className="font-semibold text-purple-600 hover:underline"
            >
              CatifyPro
            </button>
          </p>
          <p className="mt-1">La plataforma de catálogos digitales para tu negocio</p>
        </div>
      </div>
    </div>
  );
}
