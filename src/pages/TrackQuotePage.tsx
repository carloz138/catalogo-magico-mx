import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
  Zap,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function TrackQuotePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [replicating, setReplicating] = useState(false);
  const [isCtaOpen, setIsCtaOpen] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      console.log("🔍 Cargando cotización con token:", token);

      const { data, error } = await supabase.functions.invoke("get-quote-by-token", {
        body: { tracking_token: token },
      });

      console.log("📊 Respuesta de Edge Function:", data);

      if (error) {
        console.error("❌ Error invocando función:", error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Error obteniendo cotización");
      }

      console.log("✅ Cotización cargada:", data.quote);
      console.log("📦 Items recibidos:", data.quote.quote_items?.length || 0);
      console.log("🔄 Catálogo replicado (borrador):", data.quote.replicated_catalogs);

      setQuote(data.quote);
    } catch (error: any) {
      console.error("❌ Error loading quote:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la cotización",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReplicate = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!quote) return;

    if (!quote.replicated_catalogs) {
      toast({
        title: "Error",
        description: "No hay un catálogo disponible para activar. Contacta al proveedor.",
        variant: "destructive",
      });
      return;
    }

    setReplicating(true);
    try {
      console.log("🔄 Activando réplica existente:", quote.replicated_catalogs.id);

      const { error } = await supabase
        .from("replicated_catalogs")
        .update({
          is_active: true,
          reseller_id: user.id,
          activated_at: new Date().toISOString(),
        })
        .eq("id", quote.replicated_catalogs.id);

      if (error) throw error;

      const { data: businessInfo } = await supabase
        .from("business_info")
        .select("business_name, phone")
        .eq("user_id", user.id)
        .single();

      console.log("📋 Business info del usuario:", businessInfo);

      const hasCompleteInfo = businessInfo && businessInfo.business_name && businessInfo.phone;

      toast({
        title: "🎉 ¡Catálogo activado exitosamente!",
        description: hasCompleteInfo
          ? "Redirigiendo a tus catálogos..."
          : "Por favor completa tu información de negocio",
      });

      if (hasCompleteInfo) {
        navigate("/catalogs");
      } else {
        navigate("/business-info?from=activation");
      }
    } catch (error: any) {
      console.error("❌ Error activando catálogo:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo activar el catálogo",
        variant: "destructive",
      });
    } finally {
      setReplicating(false);
    }
  };

  const formatVariant = (item: any) => {
    if (!item.product_variants) return "";
    const variant = item.product_variants;
    const parts = [];
    if (variant.size) parts.push(variant.size);
    if (variant.color) parts.push(variant.color);
    if (variant.material) parts.push(variant.material);
    return parts.join(" / ");
  };

  const getSku = (item: any) => {
    return item.product_variants?.sku || item.products?.sku || "N/A";
  };

  const getProductName = (item: any) => {
    return item.product_variants?.name || item.products?.name || "Producto";
  };

  const getProductImage = (item: any) => {
    return item.product_variants?.image_url || item.products?.image_url;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-20 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto py-20 text-center min-h-screen flex flex-col items-center justify-center px-4">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Cotización no encontrada</h1>
        <p className="text-muted-foreground">Verifica el link que recibiste por email</p>
      </div>
    );
  }

  const total = quote.quote_items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

  const isQuoteAccepted = quote.status === "accepted";
  const hasDistributionEnabled = quote.digital_catalogs?.enable_distribution;
  const replicaExists = !!quote.replicated_catalogs;
  const isReplicaActive = quote.replicated_catalogs?.is_active === true;

  const canReplicate = isQuoteAccepted && hasDistributionEnabled && (!replicaExists || !isReplicaActive);

  const alreadyReplicated = replicaExists && isReplicaActive;
  const providerName =
    quote.digital_catalogs?.users?.business_name ||
    quote.digital_catalogs?.users?.full_name ||
    quote.digital_catalogs?.name ||
    "tu proveedor";

  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pendiente",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    accepted: {
      icon: CheckCircle,
      label: "Aceptada",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    rejected: {
      icon: XCircle,
      label: "Rechazada",
      color: "bg-red-100 text-red-800 border-red-200",
    },
  };

  const status = statusConfig[quote.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-emerald-600" />
              <span className="font-semibold text-lg">Cotización #{quote.quote_number}</span>
            </div>
            <Badge className={`${status.color} border`}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Seguimiento de tu Cotización</h1>
          <p className="text-muted-foreground">Revisa los detalles y el estado de tu solicitud</p>
        </div>

        {canReplicate && (
          <Collapsible open={isCtaOpen} onOpenChange={setIsCtaOpen} className="mb-8">
            <CollapsibleTrigger className="w-full">
              <Alert className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-300 hover:border-emerald-400 transition-all cursor-pointer">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="text-left">
                    <span className="font-semibold text-emerald-900">
                      🎉 ¡Oportunidad! Este catálogo está disponible para distribución
                    </span>
                    <p className="text-sm text-emerald-700 mt-1">
                      Haz clic para ver cómo puedes vender estos productos con tu marca
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-emerald-600 transition-transform ${isCtaOpen ? "rotate-180" : ""}`}
                  />
                </AlertDescription>
              </Alert>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Card className="mt-4 border-2 border-emerald-200 shadow-lg bg-gradient-to-br from-white to-emerald-50">
                <CardHeader className="border-b border-emerald-100 bg-white/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <Rocket className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">Activa tu Catálogo Digital</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {providerName} te ofrece la oportunidad de revender estos productos
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-emerald-100">
                      <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Genera Ingresos</h4>
                        <p className="text-xs text-muted-foreground">
                          Define tus propios precios y márgenes de ganancia
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-emerald-100">
                      <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Sin Inventario</h4>
                        <p className="text-xs text-muted-foreground">Vende sin preocuparte por stock o logística</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-emerald-100">
                      <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Tu Marca</h4>
                        <p className="text-xs text-muted-foreground">Catálogo personalizado con tu identidad</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-sm mb-2 text-emerald-900">¿Cómo funciona?</h4>
                    <ol className="text-sm space-y-2 text-emerald-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">1.</span>
                        <span>Activa el catálogo y personalízalo con tu marca</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">2.</span>
                        <span>Comparte tu catálogo único con tus clientes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">3.</span>
                        <span>Recibe pedidos y coordina entregas con {providerName}</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    onClick={handleReplicate}
                    disabled={replicating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    {replicating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Activando catálogo...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Activar Catálogo Ahora
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Al activar, podrás gestionar precios, compartir tu catálogo y comenzar a vender
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {alreadyReplicated && (
          <Alert className="mb-8 bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              Ya tienes este catálogo activado. Puedes verlo en tu{" "}
              <button onClick={() => navigate("/catalogs")} className="font-semibold underline hover:text-emerald-900">
                panel de catálogos
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div id="quote-details">
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-xl">Detalles de la Cotización</CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha de Solicitud</p>
                  <p className="font-semibold">
                    {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Catálogo</p>
                  <p className="font-semibold">{quote.digital_catalogs?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Productos Cotizados</h3>
                {quote.quote_items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {getProductImage(item) && (
                      <img
                        src={getProductImage(item)}
                        alt={getProductName(item)}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1">{getProductName(item)}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        SKU: {getSku(item)}
                        {formatVariant(item) && ` • ${formatVariant(item)}`}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Cantidad: {item.quantity}</span>
                        <span>Precio: ${item.unit_price.toFixed(2)}</span>
                        <span className="font-semibold">Subtotal: ${item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total de la Cotización</span>
                  <span className="text-2xl font-bold text-emerald-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {quote.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{quote.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 py-8 border-t border-gray-100">
          <p className="text-sm text-muted-foreground">
            ¿Tienes dudas sobre tu cotización?{" "}
            <a href="mailto:soporte@tuapp.com" className="text-emerald-600 hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicia sesión para continuar</DialogTitle>
            <DialogDescription>Necesitas una cuenta para activar catálogos y comenzar a vender</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate("/sign-in")} className="w-full">
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/sign-up")} variant="outline" className="w-full">
              Crear Cuenta Nueva
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
