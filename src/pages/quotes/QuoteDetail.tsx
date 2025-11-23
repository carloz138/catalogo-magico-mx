import { useParams, useNavigate } from "react-router-dom";
import { useQuoteDetail } from "@/hooks/useQuoteDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Truck,
  Sparkles,
  MessageSquare,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuoteStatus } from "@/types/digital-catalog";
import { QuoteService } from "@/services/quote.service";
import { QuoteTrackingService } from "@/services/quote-tracking.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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

  // Estado para el input de envío (string para manejo fácil de decimales en UI)
  const [shippingCostInput, setShippingCostInput] = useState<string>("0");

  // Cargar costo de envío existente si ya existe
  useEffect(() => {
    if (quote?.shipping_cost) {
      setShippingCostInput((quote.shipping_cost / 100).toString());
    }
  }, [quote]);

  // --- HANDLERS ---

  // 1. FLUJO NEGOCIACIÓN: Guardar envío y notificar cambio
  const handleNegotiateQuote = async () => {
    if (!quote || !user?.id) return;

    const costValue = parseFloat(shippingCostInput);
    if (isNaN(costValue) || costValue < 0) {
      toast({
        title: "Monto inválido",
        description: "El costo de envío no puede ser negativo.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      // Cálculos en CENTAVOS
      const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingInCents = Math.round(costValue * 100);
      const newTotalInCents = itemsSubtotal + shippingInCents;

      await QuoteService.updateShippingAndNegotiate(quote.id, user.id, shippingInCents, newTotalInCents);

      toast({
        title: "✅ Cotización Actualizada",
        description: "Se agregó el envío. El estado ahora es 'Negociación'.",
      });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. FLUJO CIERRE: Aceptación final (Manual por el dueño)
  const handleForceAccept = async () => {
    if (!quote || !user?.id) return;
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "accepted");

      // Intentar obtener link de tracking para WhatsApp
      try {
        const trackingLink = await QuoteTrackingService.getTrackingLink(quote.id);
        setTrackingUrl(trackingLink);
        setShowWhatsAppButton(true);
      } catch (e) {
        console.error(e);
      }

      toast({ title: "✅ Venta Cerrada", description: "Cotización marcada como aceptada." });
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
        label: "Solicitud Nueva",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        bg: "bg-blue-50",
      },
      negotiation: {
        // Nuevo estado visual
        icon: AlertCircle,
        label: "Esperando confirmación",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        bg: "bg-amber-50",
      },
      accepted: {
        icon: CheckCircle,
        label: "Venta Cerrada",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        bg: "bg-emerald-50",
      },
      rejected: {
        icon: XCircle,
        label: "Rechazada",
        color: "bg-rose-100 text-rose-700 border-rose-200",
        bg: "bg-rose-50",
      },
      shipped: {
        icon: Truck,
        label: "Enviado",
        color: "bg-purple-100 text-purple-700 border-purple-200",
        bg: "bg-purple-50",
      },
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

  // Cálculos dinámicos para la UI
  const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
  const currentShippingCost = parseFloat(shippingCostInput || "0") * 100; // a centavos
  const grandTotal = itemsSubtotal + currentShippingCost;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- HEADER --- */}
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

          <div className="flex items-center gap-2">
            {quote.status === "accepted" && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
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
          {/* --- COLUMNA PRINCIPAL (Items y Totales) --- */}
          <div className="lg:col-span-2 space-y-6">
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
                    {/* Imagen */}
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
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-base leading-tight mb-1 line-clamp-2">
                          {item.product_name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 text-slate-600 border-slate-200"
                          >
                            {item.price_type === "mayoreo" ? "Mayoreo" : "Menudeo"}
                          </Badge>
                          {!item.is_in_stock && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200 gap-1"
                            >
                              <Clock className="w-3 h-3" /> Bajo Pedido
                            </Badge>
                          )}
                        </div>
                      </div>
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

                {/* --- SECCIÓN DE COSTOS --- */}
                <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal Productos</span>
                    <span className="text-slate-900 font-medium">${(itemsSubtotal / 100).toLocaleString("es-MX")}</span>
                  </div>

                  {/* Input de Envío */}
                  <div className="flex justify-between items-center gap-4 py-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <Label htmlFor="shipping" className="text-sm font-medium text-slate-700">
                        Costo de Envío / Flete
                      </Label>
                    </div>
                    <div className="relative w-32 md:w-40">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="shipping"
                        type="number"
                        min="0"
                        step="1"
                        disabled={
                          quote.status === "accepted" || quote.status === "shipped" || quote.status === "rejected"
                        }
                        value={shippingCostInput}
                        onChange={(e) => setShippingCostInput(e.target.value)}
                        className="pl-8 text-right font-medium bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Gran Total */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-slate-900">Total a Pagar</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-indigo-600">
                        ${(grandTotal / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      {quote.status === "negotiation" && (
                        <p className="text-[10px] text-amber-600 font-medium mt-1">Pendiente confirmación cliente</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
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

          {/* --- COLUMNA LATERAL (Acciones) --- */}
          <div className="space-y-6">
            {/* Panel de Control */}
            <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 1. Acciones para Solicitudes Nuevas o en Negociación */}
                {(quote.status === "pending" || quote.status === "negotiation") && (
                  <>
                    <Alert className="bg-white border-indigo-200 shadow-sm mb-2">
                      <AlertTitle className="text-xs font-bold text-indigo-700">Paso 1: Agregar Envío</AlertTitle>
                      <AlertDescription className="text-xs text-slate-600 mt-1">
                        Calcula el flete, ingrésalo en el campo "Costo de Envío" y actualiza la cotización.
                      </AlertDescription>
                    </Alert>

                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                      onClick={handleNegotiateQuote}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageSquare className="w-4 h-4 mr-2" />
                      )}
                      {quote.status === "negotiation" ? "Actualizar Costo Envío" : "Enviar con Flete (Negociar)"}
                    </Button>

                    <Separator className="my-2" />

                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      onClick={handleForceAccept}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Cerrar Venta Directamente
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs mt-2"
                      onClick={handleRejectQuote}
                      disabled={actionLoading}
                    >
                      Rechazar solicitud
                    </Button>
                  </>
                )}

                {/* 2. Visualización de Estado Cerrado */}
                {(quote.status === "accepted" || quote.status === "shipped") && (
                  <div className="text-center p-3 bg-emerald-50 rounded border border-emerald-100">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-emerald-800 font-bold">Venta Cerrada</p>
                    <p className="text-xs text-emerald-600 mt-1">El cliente aceptó la cotización.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datos del Cliente */}
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
                  {quote.shipping_address && (
                    <div className="flex items-start gap-3 text-slate-600">
                      <Truck className="w-4 h-4 text-slate-400 mt-0.5" />
                      <span className="text-xs">{quote.shipping_address}</span>
                    </div>
                  )}
                </div>
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
                      onClick={() => window.open(`https://wa.me/${quote.customer_phone!.replace(/\D/g, "")}`, "_blank")}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tracking (Solo visible si aceptada) */}
            {quote.status === "accepted" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Seguimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showWhatsAppButton && quote.customer_phone && trackingUrl && (
                    <div className="pt-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
