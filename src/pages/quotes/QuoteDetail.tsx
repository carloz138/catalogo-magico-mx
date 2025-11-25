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
  Calendar as CalendarIcon,
  MapPin,
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

  // Estados para Inputs de Negociación
  const [shippingCostInput, setShippingCostInput] = useState<string>("0");
  const [deliveryDateInput, setDeliveryDateInput] = useState<string>("");

  // ✅ LÓGICA DE PAGO: Verificar si existe una transacción pagada
  // (El servicio ya trae payment_transactions gracias al cambio anterior)
  const paymentTx = (quote as any)?.payment_transactions?.find((tx: any) => tx.status === "paid");
  const isPaid = !!paymentTx;

  // Cargar datos existentes
  useEffect(() => {
    if (quote) {
      if (quote.shipping_cost) setShippingCostInput((quote.shipping_cost / 100).toString());
      if (quote.estimated_delivery_date) setDeliveryDateInput(quote.estimated_delivery_date);

      // Si ya está aceptada, generamos el link de tracking para el botón de WhatsApp
      if (quote.status === "accepted" || quote.status === "shipped") {
        QuoteTrackingService.getTrackingLink(quote.id)
          .then((url) => {
            setTrackingUrl(url);
            setShowWhatsAppButton(true);
          })
          .catch(console.error);
      }
    }
  }, [quote]);

  // --- HANDLERS ---

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

    if (!deliveryDateInput) {
      toast({
        title: "Falta Fecha",
        description: "Debes indicar una fecha estimada de entrega.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingInCents = Math.round(costValue * 100);
      const newTotalInCents = itemsSubtotal + shippingInCents;

      await QuoteService.updateShippingAndNegotiate(
        quote.id,
        user.id,
        shippingInCents,
        newTotalInCents,
        deliveryDateInput,
      );

      toast({ title: "✅ Cotización Actualizada", description: "Cliente notificado con costos y fecha de entrega." });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceAccept = async () => {
    if (!quote || !user?.id) return;
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "accepted");
      toast({ title: "✅ Venta Cerrada Manualmente", description: "Cotización marcada como aceptada." });
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

  // --- UI CONFIG MEJORADA (Aquí está el arreglo del texto) ---
  const getStatusConfig = (status: QuoteStatus) => {
    // Prioridad 1: Si ya pagaron
    if (status === "accepted" && isPaid) {
      return {
        icon: CheckCircle,
        label: "¡PAGO RECIBIDO!",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        bg: "bg-emerald-50",
      };
    }

    // Prioridad 2: Estados normales
    const config = {
      pending: {
        icon: Clock,
        label: "Solicitud Nueva",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        bg: "bg-blue-50",
      },
      negotiation: {
        icon: AlertCircle,
        label: "Esperando al Cliente", // Ya enviaste precio, falta que acepten
        color: "bg-amber-100 text-amber-700 border-amber-200",
        bg: "bg-amber-50",
      },
      accepted: {
        icon: Clock, // Reloj porque estamos esperando el dinero
        label: "Esperando Pago", // Antes decía Venta Cerrada
        color: "bg-orange-100 text-orange-700 border-orange-200",
        bg: "bg-orange-50",
      },
      rejected: {
        icon: XCircle,
        label: "Rechazada",
        color: "bg-rose-100 text-rose-700 border-rose-200",
        bg: "bg-rose-50",
      },
      shipped: {
        icon: Truck,
        label: "Enviado / Cerrado",
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

  const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
  const isPickup = quote.delivery_method === "pickup";
  const effectiveShipping = isPickup ? 0 : parseFloat(shippingCostInput || "0") * 100;
  const grandTotal = itemsSubtotal + effectiveShipping;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")} className="text-slate-500">
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
            {/* Botón Marcar Enviado: Solo si YA PAGARON o es venta cerrada manual */}
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
          {/* --- COLUMNA IZQUIERDA: ITEMS --- */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Productos Solicitados
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

                {/* --- TOTALES --- */}
                <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900 font-medium">${(itemsSubtotal / 100).toLocaleString("es-MX")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      {isPickup ? <MapPin className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                      {isPickup ? "Recolección (Sin costo)" : "Envío"}
                    </span>
                    <span className="text-slate-900 font-medium">
                      {isPickup ? "$0.00" : `$${(effectiveShipping / 100).toLocaleString("es-MX")}`}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total Estimado</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ${(grandTotal / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
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

          {/* --- COLUMNA DERECHA: ACCIONES Y LOGÍSTICA --- */}
          <div className="space-y-6">
            {/* ✅ TARJETA DE ESTATUS FINANCIERO (NUEVO) */}
            {isPaid ? (
              <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 border border-emerald-200">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">¡Pago Recibido!</h3>
                  <p className="text-emerald-700 text-sm mb-4">
                    El cliente ha pagado el total de <strong>${(paymentTx.amount_total / 100).toFixed(2)}</strong>.
                    <br />
                    Ya puedes realizar el envío.
                  </p>
                  <p className="text-xs text-emerald-600">
                    Fecha Pago: {format(new Date(paymentTx.created_at), "dd/MM/yy HH:mm")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              // Si está aceptada pero NO pagada, mostramos alerta
              quote.status === "accepted" && (
                <Card className="bg-amber-50 border-amber-200 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 border border-amber-200">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-900">Esperando Pago</h3>
                    <p className="text-amber-700 text-sm">
                      La cotización fue aceptada, pero aún no detectamos el pago SPEI.
                    </p>
                  </CardContent>
                </Card>
              )
            )}

            {/* Panel de Gestión (Logística) */}
            {/* Solo mostramos edición si NO está pagado y NO está enviado */}
            {(quote.status === "pending" || quote.status === "negotiation") && (
              <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Gestión de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 p-3 bg-white rounded-lg border border-indigo-100">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Fecha Estimada Entrega *</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          className="pl-9 text-sm"
                          value={deliveryDateInput}
                          onChange={(e) => setDeliveryDateInput(e.target.value)}
                        />
                      </div>
                    </div>

                    {!isPickup ? (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Costo de Envío *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            type="number"
                            className="pl-9 text-sm"
                            placeholder="0.00"
                            value={shippingCostInput}
                            onChange={(e) => setShippingCostInput(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <Alert className="py-2 bg-slate-50">
                        <MapPin className="h-3 w-3" />
                        <AlertDescription className="text-xs text-slate-500 ml-1">
                          Recoge en tienda ($0)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md"
                    onClick={handleNegotiateQuote}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    {quote.status === "negotiation" ? "Actualizar y Re-enviar" : "Enviar Cotización con Flete"}
                  </Button>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 text-xs"
                      onClick={handleForceAccept}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Cerrar Directo
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs"
                      onClick={handleRejectQuote}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracking / WhatsApp Share (Solo si aceptada/pagada) */}
            {(quote.status === "accepted" || quote.status === "shipped") && showWhatsAppButton && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Compartir Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <WhatsAppShareButton
                    customerName={quote.customer_name}
                    customerPhone={quote.customer_phone}
                    orderNumber={quote.id.slice(0, 8)}
                    trackingUrl={trackingUrl}
                  />
                </CardContent>
              </Card>
            )}

            {/* Datos Cliente */}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
