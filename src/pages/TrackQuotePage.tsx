import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// {/* MODIFICADO: Añadimos ChevronDown */}
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
// {/* NUEVO: Importamos Collapsible */}
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
  // {/* NUEVO: Estado para controlar el Collapsible */}
  const [isCtaOpen, setIsCtaOpen] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
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
      console.log("🔄 Catálogo replicado:", data.quote.replicated_catalogs);

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

    // Validar que existe una réplica para activar
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
      
      // Solo activar la réplica existente
      const { error } = await supabase
        .from("replicated_catalogs")
        .update({
          is_active: true,
          reseller_id: user.id,
          activated_at: new Date().toISOString(),
        })
        .eq("id", quote.replicated_catalogs.id);

      if (error) throw error;

      toast({
        title: "🎉 ¡Catálogo activado exitosamente!",
        description: "Ahora puedes verlo en 'Mis Catálogos'",
      });

      // Recargar datos para actualizar el estado
      await loadQuote();
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

  // ... (Todas las funciones helper como formatVariant, getSku, etc., se mantienen exactamente igual)
  const formatVariant = (item: any) => {
    if (!item.product_variants?.variant_combination) return null;

    const combination = item.product_variants.variant_combination;
    const parts = [];

    const labelMap: Record<string, string> = {
      color: "Color",
      color_calzado: "Color",
      color_electronico: "Color",
      color_fiesta: "Color",
      talla_ropa: "Talla",
      talla_calzado: "Talla",
      material: "Material",
      capacidad: "Capacidad",
      tamano: "Tamaño",
      tamano_arreglo: "Tamaño",
      tipo_flor: "Tipo de Flor",
    };

    for (const [key, value] of Object.entries(combination)) {
      const label = labelMap[key] || key;
      parts.push(`${label}: ${value}`);
    }

    return parts.join(", ");
  };

  const getSku = (item: any) => {
    const variantSku = item.product_variants?.sku;
    const productSku = item.products?.sku;
    const quoteSku = item.product_sku;

    if (variantSku && variantSku.trim()) return variantSku;
    if (productSku && productSku.trim()) return productSku;
    if (quoteSku && quoteSku.trim()) return quoteSku;

    return "Sin SKU";
  };

  const getProductName = (item: any) => {
    return item.products?.name || item.product_name || "Producto";
  };

  const getProductImage = (item: any) => {
    if (item.product_variants?.variant_images?.[0]) {
      return item.product_variants.variant_images[0];
    }
    return item.products?.image_url || item.product_image_url;
  };


  if (loading) {
    // ... (El estado de Loading se mantiene igual)
    return (
      <div className="container mx-auto py-20 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!quote) {
    // ... (El estado de Not Found se mantiene igual)
    return (
      <div className="container mx-auto py-20 text-center min-h-screen flex flex-col items-center justify-center px-4">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Cotización no encontrada</h1>
        <p className="text-muted-foreground">Verifica el link que recibiste por email</p>
      </div>
    );
  }

  const total = quote.quote_items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

  // ... (La lógica de canReplicate, alreadyReplicated, etc., se mantiene igual)
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

  // ... (statusConfig se mantiene igual)
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pendiente",
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
      description: "Tu cotización está siendo revisada",
    },
    accepted: {
      icon: CheckCircle,
      label: "Aceptada",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      description: "¡Tu cotización fue aceptada!",
    },
    rejected: {
      icon: XCircle,
      label: "Rechazada",
      color: "bg-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      description: "Tu cotización fue rechazada",
    },
  };

  const status = statusConfig[quote.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimalista (se mantiene igual) */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-gray-900">CatifyPro</span>
          </div>
          <Badge className={`${status.color} text-white border-0`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section (se mantiene igual) */}
        <div className="text-center mb-12">
          {quote.status === "accepted" ? (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">🎉 {status.description}</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Gracias por tu compra con <strong>{providerName}</strong>. Ya está en proceso. Aquí podrás ver el avance
                y los detalles cuando quieras.
              </p>
            </>
          ) : quote.status === "pending" ? (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">⏳ Tu cotización está en revisión</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                <strong>{providerName}</strong> está revisando tu cotización. Te notificaremos por email cuando haya
                novedades.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">Cotización #{quote.id.slice(0, 8)}</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {status.description}. Contacta a <strong>{providerName}</strong> para más información.
              </p>
            </>
          )}
        </div>

        {/* // ===================================================================
        // MODIFICACIÓN PRINCIPAL: Aquí está la nueva estructura Collapsible
        // ===================================================================
        */}
        {canReplicate && (
          <Collapsible
            open={isCtaOpen}
            onOpenChange={setIsCtaOpen}
            className="mb-8" // El margen se aplica al contenedor
          >
            {/* 1. EL GANCHO (TRIGGER) */}
            <CollapsibleTrigger className="w-full">
              <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 cursor-pointer hover:bg-emerald-100 transition-colors group text-left">
                <Rocket className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="ml-2 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <strong className="font-semibold">¡Oportunidad! Activa tu catálogo y empieza a vender.</strong>
                    <p className="text-sm text-emerald-800">
                      Porque compraste con <strong>{providerName}</strong>, tienes un beneficio especial.
                    </p>
                  </div>
                  <div className="flex items-center text-sm font-medium text-emerald-700 mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                    {isCtaOpen ? "Cerrar beneficios" : "Ver beneficios y activar"}
                    <ChevronDown
                      className={`w-4 h-4 ml-1 transition-transform duration-200 ${isCtaOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </AlertDescription>
              </Alert>
            </CollapsibleTrigger>

            {/* 2. EL CONTENIDO (EL CARD ORIGINAL) */}
            <CollapsibleContent>
              {/* El Card original, pero con un `mt-6` para darle espacio */}
              <Card className="mt-6 border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <CardContent className="p-6 sm:p-8 md:p-12">
                  {/* El contenido interno del Card se mantiene igual */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                      <Rocket className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                      Activa tu catálogo y empieza a vender
                    </h2>
                    <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
                      Porque compraste con <strong>{providerName}</strong>, ahora tienes acceso a:
                    </p>
                  </div>

                  {/* Beneficios (se mantiene igual) */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
                    <div className="flex items-start gap-3 bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Tu propio catálogo digital</p>
                        <p className="text-sm text-gray-600">Personalizado con tu marca</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Cotizador para tus clientes</p>
                        <p className="text-sm text-gray-600">Automatizado 24/7</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Posibilidad de revender</p>
                        <p className="text-sm text-gray-600">Los mismos productos</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/80 backdrop-blur rounded-lg p-3 sm:p-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Activación en 1 clic</p>
                        <p className="text-sm text-gray-600">Sin configuraciones</p>
                      </div>
                    </div>
                  </div>

                  {/* Info box (se mantiene igual) */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 sm:p-6 mb-8 max-w-2xl mx-auto">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 mb-1">💡 ¿Sabías esto?</p>
                        <p className="text-blue-700 text-sm leading-relaxed">
                          Puedes compartir tu catálogo, recibir cotizaciones y dar seguimiento desde tu panel. Así empiezan
                          muchas tiendas y distribuidores 📈
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons (Botón "Tal vez más tarde" modificado) */}
                  <div className="text-center space-y-3">
                    <Button
                      size="lg"
                      onClick={handleReplicate}
                      disabled={replicating}
                      className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      {replicating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Activando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Activar mi catálogo gratis
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">Se replica automáticamente. Estará listo en segundos.</p>
                    <Button
                      variant="link"
                      className="text-gray-500 hover:text-gray-700 text-sm"
                      onClick={() => {
                        // {/* MODIFICADO: Ahora también cierra el Collapsible */}
                        setIsCtaOpen(false);
                        document.getElementById("quote-details")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Tal vez más tarde
                    </Button>
                  </div>

                  {/* Microcopy inspiracional (se mantiene igual) */}
                  <div className="text-center mt-8 pt-8 border-t border-emerald-100">
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      Herramienta impulsada por CatifyPro — tú haces el negocio, nosotros la tecnología
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
        {/* ===================================================================
        // FIN DE LA MODIFICACIÓN
        // ===================================================================
        */}


        {/* Mensaje de catálogo ya activado (se mantiene igual) */}
        {alreadyReplicated && (
          <Alert className="mb-8 bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertDescription className="ml-2">
              <strong className="text-emerald-900">¡Catálogo activado exitosamente!</strong>
              <br />
              <Button
                variant="link"
                className="p-0 h-auto text-emerald-700 hover:text-emerald-800 font-medium"
                onClick={() => navigate("/catalogs")}
              >
                Ver mis catálogos →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Detalles de la cotización (se mantiene igual y ahora es visible) */}
        <div id="quote-details">
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Detalles de tu cotización
                </CardTitle>
                <span className="text-sm text-gray-500">#{quote.id.slice(0, 8)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                📅 {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </CardHeader>

            <CardContent className="p-6">
              {/* Info del cliente (se mantiene igual) */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3 text-sm">Información de contacto</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Nombre:</span>
                    <p className="font-medium text-gray-900">{quote.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-900">{quote.customer_email}</p>
                  </div>
                  {quote.customer_company && (
                    <div>
                      <span className="text-gray-500">Empresa:</span>
                      <p className="font-medium text-gray-900">{quote.customer_company}</p>
                    </div>
                  )}
                  {quote.customer_phone && (
                    <div>
                      <span className="text-gray-500">Teléfono:</span>
                      <p className="font-medium text-gray-900">{quote.customer_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos (se mantiene igual) */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium text-gray-900 mb-3 text-sm">Productos ({quote.quote_items?.length || 0})</h3>
                {quote.quote_items && quote.quote_items.length > 0 ? (
                  quote.quote_items.map((item: any) => {
                    const variantText = formatVariant(item);
                    const sku = getSku(item);
                    const productName = getProductName(item);
                    const imageUrl = getProductImage(item);

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={imageUrl}
                              alt={productName}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border border-gray-200"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{productName}</p>
                          {sku !== "Sin SKU" && <p className="text-xs text-gray-500 mt-1">SKU: {sku}</p>}
                          {variantText && (
                            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                              <span>📦</span> {variantText}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-2">
                            {item.quantity} × ${(item.unit_price / 100).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold text-gray-900">${(item.subtotal / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No hay productos en esta cotización</p>
                )}
              </div>

              {/* Total (se mantiene igual) */}
              {quote.quote_items && quote.quote_items.length > 0 && (
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    ${(total / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer inspiracional (se mantiene igual) */}
        <div className="text-center mt-12 py-8 border-t border-gray-100">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              🌱 <strong>Tu compra no sólo trae producto. Trae una oportunidad de negocio.</strong>
            </p>
            <p className="text-xs sm:text-sm text-gray-500">CatifyPro te da la herramienta, tú el impulso.</p>
            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Zap className="w-3 h-3" />
              <span>Powered by CatifyPro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Auth (se mantiene igual) */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Crea tu cuenta para continuar</DialogTitle>
            <DialogDescription className="text-base">
              Necesitas una cuenta gratuita para activar tu catálogo y empezar a vender.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button
              className="w-full py-6 text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => navigate("/login?redirect=/track/" + token)}
            >
              <Zap className="w-4 h-4 mr-2" />
              Crear cuenta / Iniciar sesión
            </Button>
            <p className="text-xs text-center text-gray-500">Es gratis y toma menos de 1 minuto ⚡</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
