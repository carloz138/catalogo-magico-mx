import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Rocket,
  Package,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Truck,
  CreditCard,
  Copy,
  Landmark,
  Box,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuoteTrackingService, TrackingQuoteData } from "@/services/quote-tracking.service";

// 🚨 SWITCH MAESTRO DE PAGOS 🚨
// false = Modo Manual (Muestra datos de contacto para pagar)
// true = Modo Openpay (Muestra botón de SPEI automático)
const ENABLE_ONLINE_PAYMENTS = false;

export default function TrackQuotePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<TrackingQuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [replicating, setReplicating] = useState(false);
  const [isCtaOpen, setIsCtaOpen] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{ clabe: string; bank: string; amount: number } | null>(null);

  useEffect(() => {
    if (token) loadQuote();
  }, [token]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const data = await QuoteTrackingService.getQuoteByToken(token!);
      setQuote(data);
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Enlace no válido o expirado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerAccept = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-quote-public", { body: { token: token } });
      if (error || !data.success) throw new Error("Error al procesar");
      toast({ title: "¡Pedido Confirmado!", description: "Procede al pago." });
      await loadQuote();
    } catch (error) {
      toast({ title: "Error", description: "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePayment = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-quote-payment", { body: { quoteId: quote.id } });
      if (error || data.error) throw new Error(data.error || "Error generando pago");
      setPaymentData({
        clabe: data.payment_method.clabe,
        bank: data.payment_method.bank || "STP",
        amount: data.amount,
      });
      setShowPaymentModal(true);
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo generar la ficha de pago.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplicate = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!quote?.replicated_catalogs) return;
    setReplicating(true);
    try {
      await supabase
        .from("replicated_catalogs")
        .update({ is_active: true, reseller_id: user.id, activated_at: new Date().toISOString() })
        .eq("id", quote.replicated_catalogs.id);
      toast({ title: "¡Catálogo activado!", description: "Redirigiendo..." });
      navigate("/catalogs");
    } catch (e) {
      toast({ title: "Error", description: "Error activando", variant: "destructive" });
    } finally {
      setReplicating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Dato copiado al portapapeles" });
  };

  const getDeliveryDateLabel = (dateStr?: string | null) => {
    if (!dateStr) return "Por confirmar";
    return format(new Date(dateStr), "EEEE d 'de' MMMM", { locale: es });
  };

  if (loading)
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  if (!quote) return <div className="container mx-auto py-20 text-center">Cotización no encontrada</div>;

  const subtotal = quote.items.reduce((sum, i) => sum + i.subtotal, 0);
  const shipping = quote.shipping_cost || 0;
  const total = quote.total_amount || subtotal + shipping;

  // Lógica de Estados
  const isAccepted = quote.status === "accepted" || quote.status === "shipped";
  const isNegotiation = quote.status === "negotiation";

  // Lógica Logística (Prioridad sobre el pago)
  const isShipped = quote.status === "shipped" || quote.fulfillment_status === "shipped";
  const isReadyPickup = quote.fulfillment_status === "ready_for_pickup";
  const isLogisticsActive = isShipped || isReadyPickup;

  const canReplicate = isAccepted && quote.replicated_catalogs && !quote.replicated_catalogs.is_active;

  const statusConfig = {
    pending: { icon: Clock, label: "En Revisión", color: "bg-gray-100 text-gray-800 border-gray-200" },
    negotiation: {
      icon: AlertCircle,
      label: "Acción Requerida",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
    accepted: { icon: CheckCircle, label: "Confirmada", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    rejected: { icon: XCircle, label: "Cancelada", color: "bg-red-100 text-red-800 border-red-200" },
    shipped: { icon: Truck, label: "En Camino", color: "bg-blue-100 text-blue-800 border-blue-200" },
  };
  const statusInfo = statusConfig[quote.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-900 hidden sm:inline">Cotización</span>
            <span className="font-mono text-slate-500">#{quote.order_number}</span>
          </div>
          <Badge className={`${statusInfo.color} border px-3 py-1`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* --- 1. BANNER NEGOCIACIÓN --- */}
        {isNegotiation && (
          <Card className="mb-8 border-amber-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-amber-100 px-6 py-3 border-b border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-800">Actualización del Proveedor</span>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <p className="text-slate-600">Se han calculado los costos finales:</p>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Envío</p>
                      <p className="text-lg font-semibold text-slate-900">${(shipping / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Entrega</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {getDeliveryDateLabel(quote.estimated_delivery_date)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto text-center">
                  <p className="text-xs text-slate-500 uppercase mb-2">Total a Pagar</p>
                  <p className="text-3xl font-bold text-emerald-600 mb-4">${(total / 100).toLocaleString("es-MX")}</p>
                  <Button
                    onClick={handleCustomerAccept}
                    disabled={actionLoading}
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}{" "}
                    Aceptar y Confirmar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- 2. BANNER PAGO (HÍBRIDO) --- */}
        {/* Solo mostramos pago si NO se ha enviado ni está listo para recoger */}
        {isAccepted && !isLogisticsActive && (
          <Card className="mb-8 border-indigo-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-800">Pago Pendiente</span>
            </div>
            <CardContent className="p-6">
              {ENABLE_ONLINE_PAYMENTS ? (
                // MODO OPENPAY
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">¡Todo listo para tu pedido!</h3>
                    <p className="text-slate-600 text-sm">
                      Realiza tu pago vía transferencia SPEI para que comience el proceso de envío.
                    </p>
                  </div>
                  <div className="text-center">
                    <Button
                      onClick={handleGeneratePayment}
                      disabled={actionLoading}
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full md:w-auto"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Landmark className="w-5 h-5 mr-2" />
                      )}{" "}
                      Pagar con Transferencia
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">Procesado seguro por Openpay (BBVA)</p>
                  </div>
                </div>
              ) : (
                // MODO MANUAL (Contacto)
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Pedido Confirmado</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Tu orden ha sido apartada. Para completar el pago y envío, por favor ponte en contacto con el
                      proveedor.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {quote.business_info?.phone && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            window.open(`https://wa.me/${quote.business_info?.phone?.replace(/\D/g, "")}`, "_blank")
                          }
                        >
                          <Phone className="w-4 h-4 text-green-600" /> WhatsApp
                        </Button>
                      )}
                      {quote.business_info?.email && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(`mailto:${quote.business_info?.email}`, "_blank")}
                        >
                          <Mail className="w-4 h-4 text-blue-600" /> Correo
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-center min-w-[150px]">
                    <p className="text-xs text-slate-500 uppercase mb-1">Total a Pagar</p>
                    <p className="text-2xl font-bold text-indigo-700">${(total / 100).toLocaleString("es-MX")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* --- 3. BANNER LOGÍSTICA (POST-ENVÍO) --- */}
        {isLogisticsActive && (
          <Card
            className={`mb-8 border-2 shadow-lg overflow-hidden ${isShipped ? "border-purple-200 bg-purple-50" : "border-indigo-200 bg-indigo-50"}`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={`p-4 rounded-full ${isShipped ? "bg-purple-100" : "bg-indigo-100"}`}>
                  {isShipped ? (
                    <Truck className={`w-8 h-8 ${isShipped ? "text-purple-600" : "text-indigo-600"}`} />
                  ) : (
                    <Box className="w-8 h-8 text-indigo-600" />
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {isShipped ? "¡Tu pedido está en camino!" : "¡Listo para recoger!"}
                  </h3>
                  {isShipped ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="font-semibold">Paquetería:</span>
                        <span>{quote.carrier_name || "Logística Propia"}</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="font-semibold">Guía de Rastreo:</span>
                        <span className="font-mono font-bold bg-white px-3 py-1 rounded border border-purple-200 select-all text-purple-800">
                          {quote.tracking_code || "Pendiente"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(quote.tracking_code || "")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-700 space-y-2">
                      <p>
                        Tu paquete ya está listo en mostrador. Puedes pasar a recogerlo en la dirección del proveedor:
                      </p>
                      {quote.business_info?.phone && (
                        <p className="text-xs text-slate-500">Teléfono: {quote.business_info.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header Info y Resto de componentes */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Hola, {quote.customer_name.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500">
            Detalle de solicitud con {quote.business_info?.business_name || "tu proveedor"}.
          </p>
        </div>

        {canReplicate && (
          <Collapsible open={isCtaOpen} onOpenChange={setIsCtaOpen} className="mb-8">
            <CollapsibleTrigger className="w-full">
              <Alert className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 hover:shadow-md transition-all cursor-pointer">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <div className="text-left ml-2">
                    <span className="font-semibold text-emerald-900 block">¿Quieres vender estos productos?</span>
                    <span className="text-xs text-emerald-600">Haz clic para activar tu propio catálogo</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-400 transition-transform ${isCtaOpen ? "rotate-180" : ""}`}
                  />
                </AlertDescription>
              </Alert>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 bg-white border border-emerald-100 rounded-b-lg shadow-sm mt-[-1px]">
                <Button onClick={handleReplicate} disabled={replicating} className="w-full bg-emerald-600">
                  {replicating ? "Activando..." : "Activar mi Negocio Ahora"}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-base font-semibold flex justify-between items-center">
              <span>Productos</span>
              <span className="text-sm font-normal text-slate-500">{quote.items.length} ítems</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {quote.items.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border-b border-slate-50 last:border-0">
                <div className="w-16 h-16 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden border border-slate-100">
                  {item.product_image_url ? (
                    <img src={item.product_image_url} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-full h-full p-4 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{item.product_name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.quantity} x ${(item.unit_price / 100).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 text-sm">${(item.subtotal / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
            <div className="bg-slate-50/50 p-6 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              {(shipping > 0 || isNegotiation || isAccepted) && (
                <div className="flex justify-between text-sm text-slate-800 font-medium">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" /> Envío
                  </span>
                  <span>{shipping > 0 ? `$${(shipping / 100).toFixed(2)}` : "Por confirmar"}</span>
                </div>
              )}
              <div className="border-t border-slate-200 my-2 pt-3 flex justify-between items-end">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-indigo-700">
                  ${(total / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-8 pb-10">
          <p className="text-xs text-slate-400">Powered by CatifyPro • {format(new Date(), "yyyy")}</p>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-indigo-900">Datos de Transferencia</DialogTitle>
            <DialogDescription className="text-center">Realiza el pago exacto.</DialogDescription>
          </DialogHeader>
          {paymentData && (
            <div className="space-y-6 py-4">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center space-y-1">
                <p className="text-xs font-bold text-indigo-400 uppercase">Monto Exacto</p>
                <p className="text-3xl font-bold text-indigo-700">
                  ${paymentData.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md bg-white">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Banco</p>
                    <p className="font-semibold text-slate-900">{paymentData.bank}</p>
                  </div>
                  <Landmark className="text-slate-300 h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase ml-1">CLABE (Única)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-slate-100 rounded-md border border-slate-200 font-mono text-lg tracking-widest text-center font-bold text-slate-800">
                      {paymentData.clabe}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(paymentData.clabe)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  <strong>Importante:</strong> Esta CLABE es única para este pedido.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicia sesión</DialogTitle>
            <DialogDescription>Para activar este catálogo necesitas una cuenta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 mt-4">
            <Button onClick={() => navigate("/sign-in")}>Ingresar</Button>
            <Button variant="outline" onClick={() => navigate("/sign-up")}>
              Registrarme
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
