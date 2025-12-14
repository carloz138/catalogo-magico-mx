import { useParams, useNavigate } from "react-router-dom";
import { useQuoteDetail } from "@/hooks/useQuoteDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Truck,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Map as MapIcon,
  Plane,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuoteStatus, ShippingAddressStructured } from "@/types/digital-catalog";
import { QuoteService } from "@/services/quote.service";
import { QuoteTrackingService } from "@/services/quote-tracking.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { WhatsAppShareButton } from "@/components/quotes/WhatsAppShareButton";
import { supabase } from "@/integrations/supabase/client"; // Necesario para Edge Functions

// --- COMPONENTE AUXILIAR PARA MOSTRAR DIRECCIÓN ---
const AddressDisplay = ({ address }: { address: string | ShippingAddressStructured | null }) => {
  if (!address) return null;

  if (typeof address === "object" && address !== null) {
    const addr = address as ShippingAddressStructured;
    return (
      <div className="text-xs text-slate-600 space-y-0.5 mt-1">
        <p className="font-medium text-slate-800">{addr.street}</p>
        <p>
          {addr.colony ? `Col. ${addr.colony}, ` : ""} C.P. {addr.zip_code}
        </p>
        <p>
          {addr.city}, {addr.state}
        </p>
        {addr.references && (
          <div className="mt-1.5 p-1.5 bg-slate-50 rounded border border-slate-100 flex gap-1 items-start">
            <MapIcon className="w-3 h-3 mt-0.5 text-slate-400 shrink-0" />
            <span className="italic">{addr.references}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback para strings viejos
  return <span className="text-xs">{address as string}</span>;
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quote, loading, refetch } = useQuoteDetail(id || null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [actionLoading, setActionLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);

  // Estados para cotización de envío
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);

  const [shippingCostInput, setShippingCostInput] = useState<string>("0");
  const [deliveryDateInput, setDeliveryDateInput] = useState<string>("");

  const paymentTx = (quote as any)?.payment_transactions?.find((tx: any) => tx.status === "paid");
  const isPaid = !!paymentTx;

  useEffect(() => {
    if (quote) {
      if (quote.shipping_cost !== null && quote.shipping_cost !== undefined) {
        setShippingCostInput((quote.shipping_cost / 100).toString());
      } else {
        const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
        const catalog = quote.catalog;
        const minAmountCents = (catalog?.free_shipping_min_amount || 0) * 100;

        if (catalog?.enable_free_shipping && itemsSubtotal >= minAmountCents) {
          setShippingCostInput("0");
        }
      }

      if (quote.estimated_delivery_date) {
        setDeliveryDateInput(quote.estimated_delivery_date);
      }

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

  // ✅ NUEVO: Función para llamar a la Edge Function de Envíos
  const handleGetShippingRates = async () => {
    if (!quote) return;
    setLoadingRates(true);
    setIsShippingModalOpen(true);
    setShippingRates([]); // Limpiar anteriores

    try {
      const { data, error } = await supabase.functions.invoke("get-shipping-rates", {
        body: { quoteId: quote.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setShippingRates(data.rates || []);
    } catch (err: any) {
      console.error("Error getting rates:", err);
      toast({
        title: "Error al cotizar",
        description: err.message || "Verifica que las direcciones de origen y destino estén completas (CP, Ciudad).",
        variant: "destructive",
      });
      setIsShippingModalOpen(false); // Cerrar si hay error fatal
    } finally {
      setLoadingRates(false);
    }
  };

  // ✅ NUEVO: Función Placeholder para comprar (siguiente paso)
  const handleBuyLabel = async (rate: any) => {
    // AQUÍ IRÁ LA LÓGICA DE COMPRA EN EL SIGUIENTE PASO
    // Por ahora solo mostramos qué seleccionó
    if (confirm(`¿Comprar guía de ${rate.carrier} por $${rate.finalPrice} MXN?`)) {
      toast({ title: "Próximamente", description: "En el siguiente paso conectaremos la compra real." });
    }
  };

  const handleManualPayment = async () => {
    if (!quote || !user?.id) return;

    setActionLoading(true);
    try {
      const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
      const shipping = quote.shipping_cost || 0;
      const total = quote.total_amount || itemsSubtotal + shipping;

      await QuoteService.markAsPaidManually(quote.id, user.id, total);

      toast({
        title: "✅ Pago Registrado",
        description: "El estatus de pago ha sido actualizado.",
      });
      refetch();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo registrar el pago.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNegotiateQuote = async () => {
    if (!quote || !user?.id) return;

    const costValue = parseFloat(shippingCostInput || "0");
    if (isNaN(costValue) || costValue < 0) {
      toast({ title: "Monto inválido", variant: "destructive" });
      return;
    }

    if (!deliveryDateInput) {
      toast({ title: "Falta Fecha", description: "Indica fecha estimada.", variant: "destructive" });
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

      toast({ title: "✅ Cotización Actualizada", description: "Cliente notificado." });
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
      toast({ title: "✅ Venta Cerrada Manualmente" });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!quote || !user?.id) return;
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "rejected");
      toast({ title: "Cotización rechazada" });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!quote || !user?.id) return;

    if (!isPaid && quote.status !== "shipped") {
      if (
        !window.confirm("Advertencia: Esta orden no aparece como pagada. ¿Seguro que deseas marcarla como enviada?")
      ) {
        return;
      }
    }

    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(quote.id, user.id, "shipped");
      toast({
        title: "✅ Enviado / Cerrado",
        description: "Si esta es una orden de revendedor, su stock se ha actualizado automáticamente.",
      });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status: QuoteStatus) => {
    if (status === "accepted" && isPaid) {
      return {
        icon: CheckCircle,
        label: "¡PAGO RECIBIDO!",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        bg: "bg-emerald-50",
      };
    }
    const config = {
      pending: {
        icon: Clock,
        label: "Solicitud Nueva",
        color: "bg-gray-100 text-slate-700 border-slate-200",
        bg: "bg-gray-50",
      },
      negotiation: {
        icon: AlertCircle,
        label: "Esperando Cliente",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        bg: "bg-amber-50",
      },
      accepted: {
        icon: Clock,
        label: "Esperando Pago",
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

  if (loading || !quote)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  const statusConfig = getStatusConfig(quote.status);
  const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
  const isPickup = quote.delivery_method === "pickup";
  const effectiveShipping = isPickup ? 0 : parseFloat(shippingCostInput || "0") * 100;
  const grandTotal = itemsSubtotal + effectiveShipping;

  const catalog = quote.catalog;
  const minAmountCents = (catalog?.free_shipping_min_amount || 0) * 100;
  const qualifiesForFreeShipping = catalog?.enable_free_shipping && itemsSubtotal >= minAmountCents;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* HEADER */}
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
            {(quote.status === "accepted" && isPaid) || quote.status === "shipped" ? (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleMarkAsShipped}
                disabled={actionLoading || quote.status === "shipped"}
              >
                {quote.status === "shipped" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" /> Orden Cerrada
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 mr-2" /> Marcar Enviado
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA: ITEMS */}
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
                    <div className="h-20 w-20 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0 overflow-hidden">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          className="h-full w-full object-cover"
                          alt={item.product_name}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
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

                  {qualifiesForFreeShipping && !isPickup && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      <Gift className="w-3 h-3" /> Envío Gratis Aplicado
                    </div>
                  )}

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

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">
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
                  <p className="text-xs text-emerald-600 mb-4">
                    Fecha Pago: {format(new Date(paymentTx.created_at), "dd/MM/yy HH:mm")}
                  </p>

                  {/* ✅ BOTÓN DE GENERAR GUÍA (Solo si no es pickup) */}
                  {quote.delivery_method === "shipping" && (
                    <>
                      <Separator className="my-4 bg-emerald-200/50" />
                      <Button
                        onClick={handleGetShippingRates}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
                      >
                        {loadingRates ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4 mr-2" />
                        )}
                        Generar Guía de Envío
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              // BOTÓN DE PAGO MANUAL CON MODAL
              quote.status === "accepted" && (
                <Card className="bg-amber-50 border-amber-200 shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 border border-amber-200">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-900">Esperando Pago</h3>
                    <p className="text-amber-700 text-sm mb-4">
                      El cliente aceptó. Esperando pago SPEI o confirmación manual.
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 bg-white"
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Registrar Pago Manual
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmar Pago Manual?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estás a punto de registrar que recibiste{" "}
                            <strong>${(quote.total_amount / 100).toFixed(2)}</strong> por fuera de la plataforma.
                            <br />
                            <br />
                            Esta acción marcará el pedido como <strong>PAGADO</strong> y habilitará la opción de envío.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleManualPayment}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Sí, Confirmar Pago
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )
            )}

            {/* Panel de Gestión (Logística) - Igual que antes */}
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
                            value={shippingCostInput}
                            onChange={(e) => setShippingCostInput(e.target.value)}
                          />
                        </div>
                        {qualifiesForFreeShipping && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">✨ Envío gratis sugerido</p>
                        )}
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

            {/* Tracking / WhatsApp Share */}
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
                      <div className="flex-1">
                        <AddressDisplay address={quote.shipping_address} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE RESULTADOS DE ENVÍO */}
      <Dialog open={isShippingModalOpen} onOpenChange={setIsShippingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Opciones de Envío</DialogTitle>
            <DialogDescription>Selecciona una paquetería para generar la guía.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {loadingRates ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500">Cotizando con paqueterías...</p>
              </div>
            ) : shippingRates.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">No se encontraron opciones</p>
                <p className="text-xs text-slate-400">Verifica la dirección de destino.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {shippingRates.map((rate: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border">
                        <Plane className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 capitalize">{rate.carrier}</h4>
                        <p className="text-xs text-slate-500">
                          {rate.service} • Llega: {rate.deliveryEstimate || "Pendiente"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block font-bold text-lg text-slate-900">${rate.finalPrice}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{rate.currency}</span>
                      </div>
                      <Button size="sm" onClick={() => handleBuyLabel(rate)}>
                        Comprar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
