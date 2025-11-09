import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteStatus } from "@/types/digital-catalog";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Eye,
  Rocket,
  Sparkles,
  HelpCircle,
  ExternalLink,
  PackagePlus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";

export default function QuotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [activatingQuoteId, setActivatingQuoteId] = useState<string | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedQuoteForActivation, setSelectedQuoteForActivation] = useState<string | null>(null);

  const { quotes, stats, loading, refetch } = useQuotes({
    status: statusFilter === "all" ? undefined : statusFilter,
    autoLoad: true,
  });

  // NUEVO: Calcular productos de cotizaciones aceptadas para L2
  const acceptedQuotesForConsolidation = useMemo(() => {
    if (userRole !== "L2" && userRole !== "BOTH") return null;
    
    const acceptedQuotes = quotes.filter((q) => q.status === "accepted" && (q as any).is_from_replicated);
    if (acceptedQuotes.length === 0) return null;

    const totalProducts = acceptedQuotes.reduce((sum, q) => sum + q.items_count, 0);
    
    return {
      totalQuotes: acceptedQuotes.length,
      totalProducts,
    };
  }, [quotes, userRole]);

  // ✅ NUEVO: Detectar si hay cotizaciones con catálogo pendiente
  const pendingActivations = useMemo(
    () => quotes.filter((q) => q.status === "accepted" && q.has_replicated_catalog && !q.catalog_activated),
    [quotes],
  );

  // ✅ NUEVO: Resaltar cotización si viene del email
  const highlightQuoteId = searchParams.get("highlight");

  // Filtrado local por búsqueda
  const filteredQuotes = quotes.filter((quote) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      quote.customer_name.toLowerCase().includes(query) ||
      quote.customer_email.toLowerCase().includes(query) ||
      quote.customer_company?.toLowerCase().includes(query)
    );
  });

  // ✅ NUEVO: Función para activar catálogo
  const handleActivateCatalog = async (quoteId: string) => {
    if (!user) return;

    setActivatingQuoteId(quoteId);
    try {
      console.log("🚀 Activando catálogo para cotización:", quoteId);

      // Buscar el catálogo replicado
      const { data: replicaCatalog, error: findError } = await supabase
        .from("replicated_catalogs")
        .select("id")
        .eq("quote_id", quoteId)
        .single();

      if (findError) throw findError;
      if (!replicaCatalog) throw new Error("No se encontró el catálogo replicado");

      // Activar el catálogo
      const { error: updateError } = await supabase
        .from("replicated_catalogs")
        .update({
          is_active: true,
          reseller_id: user.id,
          activated_at: new Date().toISOString(),
        })
        .eq("id", replicaCatalog.id);

      if (updateError) throw updateError;

      console.log("✅ Catálogo activado exitosamente");

      toast({
        title: "🎉 ¡Catálogo activado!",
        description: "Ya puedes empezar a vender estos productos. Te redirigimos a tus catálogos...",
      });

      // Refrescar la lista
      await refetch();

      // Redirect después de 2 segundos
      setTimeout(() => {
        navigate("/catalogs");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error activando catálogo:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo activar el catálogo",
        variant: "destructive",
      });
    } finally {
      setActivatingQuoteId(null);
      setShowActivationModal(false);
      setSelectedQuoteForActivation(null);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const config = {
      pending: {
        label: "Pendiente",
        color: "text-yellow-600 bg-yellow-50",
      },
      accepted: {
        label: "Aceptada",
        color: "text-green-600 bg-green-50",
      },
      rejected: {
        label: "Rechazada",
        color: "text-red-600 bg-red-50",
      },
      shipped: {
        label: "Enviado",
        color: "text-blue-600 bg-blue-50",
      },
    };

    const { label, color } = config[status] || config.pending;

    return <Badge className={color}>{label}</Badge>;
  };

  // Actions para el header
  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="md:hidden flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 text-sm"
          />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="accepted">Aceptadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout
        title="Cotizaciones"
        subtitle="Gestiona las solicitudes de cotización de tus clientes"
        actions={actions}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Cotizaciones" subtitle="Gestiona las solicitudes de cotización de tus clientes" actions={actions}>
      <div className="space-y-6">
        {/* NUEVO: Banner de pedidos consolidados para L2 */}
        {acceptedQuotesForConsolidation && (
          <Alert className="bg-emerald-50 border-emerald-200 shadow-md">
            <PackagePlus className="h-5 w-5 text-emerald-600" />
            <AlertDescription>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-900 mb-1">
                    💡 Tienes {acceptedQuotesForConsolidation.totalProducts} productos de{" "}
                    {acceptedQuotesForConsolidation.totalQuotes} cotización
                    {acceptedQuotesForConsolidation.totalQuotes > 1 ? "es" : ""} aceptada
                    {acceptedQuotesForConsolidation.totalQuotes > 1 ? "s" : ""} que necesitas pedir a tus proveedores
                  </h3>
                  <p className="text-sm text-emerald-700">
                    Agrupa tus pedidos por proveedor para optimizar tu logística y costos de envío.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => navigate("/reseller/consolidated-orders")}
                >
                  <PackagePlus className="w-4 h-4 mr-2" />
                  Ver Pedidos Consolidados
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ NUEVO: Banner de catálogos pendientes */}
        {pendingActivations.length > 0 && (
          <Alert className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-md">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <AlertDescription>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-purple-900 mb-1">
                    🎉 Tienes {pendingActivations.length} catálogo{pendingActivations.length > 1 ? "s" : ""} listo
                    {pendingActivations.length > 1 ? "s" : ""} para activar
                  </h3>
                  <p className="text-sm text-purple-700">
                    Empieza a vender sin inventario. Encuentra tu{pendingActivations.length > 1 ? "s" : ""} cotización
                    {pendingActivations.length > 1 ? "es" : ""} aceptada{pendingActivations.length > 1 ? "s" : ""} abajo
                    y haz clic en "Activar Catálogo".
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={() => {
                    const firstPending = pendingActivations[0];
                    document.getElementById(`quote-${firstPending.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Cotización
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aceptadas</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monto Aceptado</p>
                  <p className="text-2xl font-bold">${(stats.total_amount_accepted / 100).toLocaleString("es-MX")}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs por estado */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
            <TabsTrigger value="accepted">Aceptadas ({stats.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazadas ({stats.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Lista de cotizaciones */}
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">No hay cotizaciones</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No se encontraron cotizaciones con ese criterio"
                  : "Las cotizaciones aparecerán aquí cuando los clientes las soliciten"}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Limpiar búsqueda
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => {
              const isHighlighted = quote.id === highlightQuoteId;
              const canActivate =
                quote.status === "accepted" && quote.has_replicated_catalog && !quote.catalog_activated;

              return (
                <Card
                  key={quote.id}
                  id={`quote-${quote.id}`}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    isHighlighted ? "ring-2 ring-purple-500 shadow-xl" : ""
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{quote.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{quote.customer_email}</p>
                            {quote.customer_company && (
                              <p className="text-sm text-muted-foreground">{quote.customer_company}</p>
                            )}
                          </div>
                          {getStatusBadge(quote.status)}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {quote.items_count} {quote.items_count === 1 ? "producto" : "productos"}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />${(quote.total_amount / 100).toLocaleString("es-MX")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                          {(quote as any).is_from_replicated && (
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                              Catálogo Replicado
                            </Badge>
                          )}
                        </div>

                        {quote.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            <strong>Nota:</strong> {quote.notes}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/quotes/${quote.id}`)}
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalle
                        </Button>

                        {/* ✅ NUEVO: Botón de activación */}
                        {canActivate && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                  onClick={() => {
                                    setSelectedQuoteForActivation(quote.id);
                                    setShowActivationModal(true);
                                  }}
                                  disabled={activatingQuoteId === quote.id}
                                >
                                  {activatingQuoteId === quote.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Activando...
                                    </>
                                  ) : (
                                    <>
                                      <Rocket className="w-4 h-4 mr-2" />
                                      Activar Catálogo
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">💡 ¿Por qué activar?</p>
                                  <ul className="text-xs space-y-1">
                                    <li>✅ Comparte con tus clientes al instante</li>
                                    <li>✅ Recibe cotizaciones automáticas 24/7</li>
                                    <li>✅ Personaliza precios y márgenes</li>
                                    <li>✅ Panel de control para todo</li>
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ NUEVO: Modal de confirmación */}
      <Dialog open={showActivationModal} onOpenChange={setShowActivationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-600" />
              Activar Catálogo para Revender
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-3">
              <p>Al activar este catálogo podrás:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Compartir tu propio link con tus clientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Recibir cotizaciones automáticas 24/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Personalizar tus precios y márgenes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Gestionar todo desde tu panel de control</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                💡 Tu catálogo estará listo en segundos y podrás empezar a vender inmediatamente.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActivationModal(false);
                setSelectedQuoteForActivation(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
              onClick={() => {
                if (selectedQuoteForActivation) {
                  handleActivateCatalog(selectedQuoteForActivation);
                }
              }}
              disabled={!!activatingQuoteId}
            >
              {activatingQuoteId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Sí, Activar Ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
