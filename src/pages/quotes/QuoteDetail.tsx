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
  Truck,
  Sparkles,
  Rocket,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuoteStatus } from "@/types/digital-catalog";
import { QuoteService } from "@/services/quote.service";
import { QuoteTrackingService } from "@/services/quote-tracking.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { WhatsAppShareButton } from "@/components/quotes/WhatsAppShareButton";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quote, loading, refetch } = useQuoteDetail(id || null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);

  // --- HANDLERS (Lógica de Negocio Intacta) ---
  const handleAcceptQuote = async () => {
    if (!quote || !user?.id) return;
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "accepted");
      try {
        const trackingLink = await QuoteTrackingService.getTrackingLink(quote.id);
        setTrackingUrl(trackingLink);
        setShowWhatsAppButton(true);
      } catch (error) {
        console.error("Error getting tracking link:", error);
      }
      toast({ title: "✅ Cotización aceptada", description: "Cliente notificado." });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!quote || !user?.id) return;
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "rejected");
      toast({ title: "Cotización rechazada", description: "Estado actualizado." });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!quote || !user?.id) return;
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "shipped");
      toast({ title: "✅ Pedido enviado", description: "Cliente notificado." });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  // --- UI CONFIG ---
  const getStatusConfig = (status: QuoteStatus) => {
    const config = {
      pending: {
        icon: Clock,
        label: "Pendiente de Revisión",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        bg: "bg-amber-50",
      },
      accepted: {
        icon: CheckCircle,
        label: "Aceptada",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        bg: "bg-emerald-50",
      },
      rejected: {
        icon: XCircle,
        label: "Rechazada",
        color: "bg-rose-100 text-rose-700 border-rose-200",
        bg: "bg-rose-50",
      },
      shipped: { icon: Truck, label: "Enviado", color: "bg-blue-100 text-blue-700 border-blue-200", bg: "bg-blue-50" },
    };
    return config[status] || config.pending;
  };

  if (loading || !quote) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;
  const total = quote.items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- HEADER SUPERIOR (Sticky en Móvil) --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Cotización #{quote.id.slice(0, 8)}
                <Badge
                  variant="outline"
                  className={`hidden sm:flex ${statusConfig.color} text-xs font-medium border px-2 py-0.5`}
                >
                  {statusConfig.label}
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {format(new Date(quote.created_at), "d MMM, yyyy • HH:mm", { locale: es })}
              </p>
            </div>
          </div>

          {/* Acciones Principales Header */}
          <div className="flex items-center gap-2">
            {quote.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hidden sm:flex"
                  onClick={handleRejectQuote}
                  disabled={actionLoading}
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  onClick={handleAcceptQuote}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aceptar"}
                </Button>
              </div>
            )}
            {quote.status === "accepted" && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleMarkAsShipped}
                disabled={actionLoading}
              >
                <Truck className="w-4 h-4 mr-2" /> Marcar Enviado
              </Button>
            )}
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Download className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </div>
        {/* Mobile Status Bar */}
        <div
          className={`sm:hidden h-8 flex items-center justify-center text-xs font-medium ${statusConfig.bg} ${statusConfig.color.split(" ")[1]}`}
        >
          {statusConfig.label}
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* --- COLUMNA PRINCIPAL: DETALLE DEL PEDIDO --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumen de Productos (Estilo Factura) */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Detalle de Productos
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">
                    {quote.items.length} ítems
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {quote.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-6 flex gap-4 ${index !== 0 ? "border-t border-slate-100" : ""}`}
                  >
                    {/* Imagen del Producto */}
                    <div className="h-20 w-20 sm:h-24 sm:w-24 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0 overflow-hidden">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Info del Producto */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-base leading-tight mb-1 line-clamp-2">
                          {item.product_name}
                        </h4>
                        {item.product_sku && (
                          <p className="text-xs text-slate-500 font-mono mb-2">SKU: {item.product_sku}</p>
                        )}

                        {/* Badges de Estado del Item */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {!item.is_in_stock && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200 gap-1"
                            >
                              <Clock className="w-3 h-3" /> Bajo Pedido
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 text-slate-600 border-slate-200"
                          >
                            {item.price_type === "mayoreo" ? "Mayoreo" : "Menudeo"}
                          </Badge>
                        </div>
                      </div>

                      {/* Precios y Cantidad (Mobile Optimized) */}
                      <div className="flex justify-between items-end mt-2">
                        <div className="text-sm text-slate-600">
                          <span className="font-medium text-slate-900">{item.quantity}</span> x $
                          {(item.unit_price / 100).toFixed(2)}
                        </div>
                        <div className="font-bold text-slate-900 text-lg">${(item.subtotal / 100).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Footer de Totales */}
                <div className="bg-slate-50 p-6 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-sm">Subtotal</span>
                    <span className="text-slate-900 font-medium">${(total / 100).toLocaleString("es-MX")}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
                    <span className="text-lg font-bold text-slate-900">Total a Pagar</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ${(total / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas Adicionales */}
            {quote.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Notas del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800 italic">
                    "{quote.notes}"
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* --- COLUMNA LATERAL: INFO CLIENTE Y ACCIONES --- */}
          <div className="space-y-6">
            {/* Tarjeta Cliente */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Datos del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {quote.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{quote.customer_name}</p>
                    <p className="text-xs text-slate-500">{quote.customer_company || "Particular"}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a
                      href={`mailto:${quote.customer_email}`}
                      className="hover:text-indigo-600 hover:underline truncate"
                    >
                      {quote.customer_email}
                    </a>
                  </div>
                  {quote.customer_phone && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${quote.customer_phone}`} className="hover:text-indigo-600 hover:underline">
                        {quote.customer_phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Acciones Rápidas de Contacto */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => (window.location.href = `mailto:${quote.customer_email}`)}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </Button>
                  {quote.customer_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`https://wa.me/${quote.customer_phone.replace(/\D/g, "")}`, "_blank")}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Acciones de Catálogo / Distribución */}
            {quote.status === "pending" && (
              <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Opciones de Venta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quote.catalog?.enable_distribution ? (
                    <Alert className="bg-white border-indigo-200 shadow-sm">
                      <Copy className="h-4 w-4 text-indigo-600" />
                      <AlertDescription className="text-xs text-slate-600 mt-1">
                        Este cliente recibirá un catálogo replicado automáticamente al aceptar.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <p className="text-xs text-slate-500">Esta es una venta directa estándar.</p>
                  )}

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 shadow-md shadow-green-200"
                    onClick={handleAcceptQuote}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Aprobar y Procesar
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                    onClick={handleRejectQuote}
                    disabled={actionLoading}
                  >
                    Rechazar solicitud
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tracking & Notificaciones */}
            {quote.status === "accepted" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Seguimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleMarkAsShipped}
                    disabled={actionLoading}
                  >
                    <Truck className="w-4 h-4 mr-2" /> Confirmar Envío
                  </Button>

                  {showWhatsAppButton && quote.customer_phone && trackingUrl && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2 text-center">Compartir tracking con cliente:</p>
                      <WhatsAppShareButton
                        customerName={quote.customer_name}
                        customerPhone={quote.customer_phone}
                        orderNumber={quote.id.slice(0, 8)}
                        trackingUrl={trackingUrl}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Info del Catálogo Origen */}
            <Card className="bg-slate-50 border-dashed border-slate-200">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Fuente</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {quote.catalog?.name || "Catálogo General"}
                  </span>
                  {quote.catalog?.slug && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-indigo-600"
                      onClick={() => window.open(`/c/${quote.catalog.slug}`, "_blank")}
                    >
                      Ver <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full text-slate-500">
              <Download className="w-4 h-4 mr-2" /> Descargar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
