import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Truck,
  CreditCard,
  Copy,
  Landmark,
  Box,
  Phone,
  Mail,
  Gift,
  ArrowRight,
  Zap, // Nuevo
  BrainCircuit, // Nuevo
  LayoutDashboard, // Nuevo
  Share2, // Nuevo
  Search, // Nuevo
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuoteTrackingService, TrackingQuoteData } from "@/services/quote-tracking.service";

// 🚨 SWITCH MAESTRO DE PAGOS 🚨
const ENABLE_ONLINE_PAYMENTS = true;

export default function TrackQuotePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<TrackingQuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados para Onboarding Viral
  const [showViralOfferModal, setShowViralOfferModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authForm, setAuthForm] = useState({ email: "", password: "", fullName: "" });
  const [replicating, setReplicating] = useState(false);
  const [isCtaOpen, setIsCtaOpen] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{ clabe: string; bank: string; amount: number } | null>(null);

  useEffect(() => {
    if (token) loadQuote();
  }, [token]);

  // ✅ AUTO-ACTIVACIÓN (MAGIA VIRAL)
  useEffect(() => {
    if (user && quote?.replicated_catalogs && !quote.replicated_catalogs.is_active && !replicating) {
      console.log("🔄 Usuario detectado post-login. Auto-activando catálogo...");
      activateCatalog(user.id);
    }
  }, [user, quote]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const data = await QuoteTrackingService.getQuoteByToken(token!);
      setQuote(data);
      if (data.customer_email) {
        setAuthForm((prev) => ({ ...prev, email: data.customer_email, fullName: data.customer_name }));
      }
      return data;
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Enlace no válido o expirado", variant: "destructive" });
      return null;
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

      const freshQuote = await loadQuote();

      // Abrir modal viral si aplica
      if (freshQuote?.replicated_catalogs && !freshQuote.replicated_catalogs.is_active) {
        setShowViralOfferModal(true);
      } else {
        toast({ title: "¡Pedido Confirmado!", description: "Gracias por tu compra." });
      }
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

  // --- LÓGICA DE ACTIVACIÓN ---

  const handleStartBusiness = () => {
    setShowViralOfferModal(false);
    if (user) {
      activateCatalog(user.id);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleReplicateClick = () => {
    if (user) {
      activateCatalog(user.id);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setReplicating(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setReplicating(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplicating(true);
    try {
      let userId = null;
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { data: { full_name: authForm.fullName } },
        });
        if (error) throw error;
        userId = data.user?.id;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
        userId = data.user?.id;
      }

      if (userId) {
        await activateCatalog(userId);
        setShowAuthModal(false);
      }
    } catch (error: any) {
      toast({ title: "Error de autenticación", description: error.message, variant: "destructive" });
      setReplicating(false);
    }
  };

  const activateCatalog = async (userId: string) => {
    setReplicating(true);
    toast({ title: "⏳ Activando tu negocio...", description: "Configurando tu catálogo personal." });

    try {
      const { data, error } = await supabase.functions.invoke("activate-replicated-catalog", {
        body: {
          token: token,
          userId: userId,
        },
      });

      if (error || !data.success) throw new Error(data?.message || "Error al activar catálogo");

      toast({
        title: "🎉 ¡Negocio Activado!",
        description: "Te estamos redirigiendo a tu panel de control...",
        duration: 3000,
        variant: "default",
      });

      setTimeout(() => {
        navigate("/catalogs");
      }, 1500);
    } catch (error: any) {
      console.error("Error activando:", error);
      if (error.message?.includes("ya fue activado")) {
        toast({ title: "¡Ya tienes tu negocio!", description: "Redirigiendo..." });
        setTimeout(() => navigate("/catalogs"), 1000);
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setReplicating(false);
      }
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

  const isAccepted = quote.status === "accepted" || quote.status === "shipped";
  const isNegotiation = quote.status === "negotiation";
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
        {/* BANNER NEGOCIACIÓN */}
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
                    )}
                    Aceptar y Confirmar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BANNER PAGO */}
        {isAccepted && !isLogisticsActive && (
          <Card className="mb-8 border-indigo-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-800">Pago Pendiente</span>
            </div>
            <CardContent className="p-6">
              {ENABLE_ONLINE_PAYMENTS ? (
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
                      className="bg-indigo-600"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Landmark className="w-5 h-5 mr-2" />
                      )}
                      Pagar con Transferencia
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Pedido Confirmado</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Tu orden ha sido apartada. Para completar el pago, contacta al proveedor.
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

        {/* LOGÍSTICA */}
        {isLogisticsActive && (
          <Card
            className={`mb-8 border-2 shadow-lg overflow-hidden ${isShipped ? "border-purple-200 bg-purple-50" : "border-indigo-200 bg-indigo-50"}`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={`p-4 rounded-full ${isShipped ? "bg-purple-100" : "bg-indigo-100"}`}>
                  {isShipped ? (
                    <Truck className="w-8 h-8 text-purple-600" />
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Guía:</span>{" "}
                        <span className="font-mono bg-white px-2 border rounded">
                          {quote.tracking_code || "Pendiente"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-700">Tu paquete está listo en mostrador.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Hola, {quote.customer_name.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500">
            Detalle de solicitud con {quote.business_info?.business_name || "tu proveedor"}.
          </p>
        </div>

        {/* Botón flotante si ya aceptó pero no activó */}
        {canReplicate && !showViralOfferModal && (
          <div className="mb-8">
            <Button
              onClick={() => setShowViralOfferModal(true)}
              variant="outline"
              className="w-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Activar beneficio de reventa
            </Button>
          </div>
        )}

        {/* LISTA DE PRODUCTOS */}
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

      {/* ✅ 1. MODAL "VIRAL OFFER" REDISEÑADO */}
      <Dialog open={showViralOfferModal} onOpenChange={setShowViralOfferModal}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Columna Izquierda: Visual */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Sparkles className="w-40 h-40" />
              </div>
              <div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
                  <Gift className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">¡Gracias por tu compra!</h2>
                <p className="text-indigo-100 text-sm">Tu pedido ha sido confirmado exitosamente.</p>
              </div>
              <div className="mt-8">
                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-2">
                  Beneficio desbloqueado
                </p>
                <h3 className="text-lg font-semibold leading-tight">Vende estos productos sin invertir en stock.</h3>
              </div>
            </div>

            {/* Columna Derecha: Beneficios y Acción */}
            <div className="p-6 md:p-8 bg-white flex flex-col">
              <div className="space-y-5 flex-1">
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Catálogo Completo</h5>
                    <p className="text-xs text-slate-500">
                      Vende todo el inventario del proveedor, no solo lo que compraste.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600 mt-0.5">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">IA de Ventas</h5>
                    <p className="text-xs text-slate-500">
                      Tu tienda incluye recomendaciones inteligentes para vender más.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 mt-0.5">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Centro de Comando</h5>
                    <p className="text-xs text-slate-500">Gestiona pedidos, rastrea envíos y ve tus ganancias.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-pink-50 p-2 rounded-lg text-pink-600 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Conexión Social</h5>
                    <p className="text-xs text-slate-500">Conecta tu catálogo a Facebook e Instagram en un clic.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <Button
                  size="lg"
                  onClick={handleStartBusiness}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-white"
                >
                  Activar mi Negocio Gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViralOfferModal(false)}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs"
                >
                  No me interesa, gracias
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ 2. MODAL AUTH (Login/Register con Google) */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {authMode === "signup" ? "Crea tu cuenta gratis" : "Bienvenido de nuevo"}
            </DialogTitle>
            <DialogDescription className="text-center">
              Accede a tu panel para gestionar tus ventas y precios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={replicating}
              className="w-full"
            >
              {replicating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
              )}
              Continuar con Google
            </Button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O con tu correo</span>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input
                  placeholder="Ej. Juan Pérez"
                  required
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="******"
                required
                minLength={6}
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={replicating}>
              {replicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {authMode === "signup" ? "Registrar y Activar" : "Ingresar y Activar"}
            </Button>
          </form>

          <DialogFooter className="sm:justify-center border-t pt-4 mt-2">
            <Button
              variant="link"
              className="text-slate-500 text-xs"
              onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}
            >
              {authMode === "signup" ? "¿Ya tienes cuenta? Inicia sesión" : "¿Nuevo aquí? Crea una cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL PAGO */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Datos de Transferencia</DialogTitle>
          </DialogHeader>
          {paymentData && (
            <div className="space-y-6 py-4">
              <div className="bg-indigo-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-indigo-700">${paymentData.amount.toLocaleString("es-MX")}</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between border p-3 rounded">
                  <span>Banco</span>
                  <span className="font-bold">{paymentData.bank}</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-100 p-3 rounded font-mono text-center font-bold">
                    {paymentData.clabe}
                  </div>
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(paymentData.clabe)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
