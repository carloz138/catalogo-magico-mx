import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteStatus } from "@/types/digital-catalog";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Eye,
  Rocket,
  Sparkles,
  ExternalLink,
  PackagePlus,
  Filter,
  ArrowRight,
  MoreHorizontal,
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

  // --- Lógica de Negocio (Intacta) ---
  const acceptedQuotesForConsolidation = useMemo(() => {
    if (userRole !== "L2" && userRole !== "BOTH") return null;
    const acceptedQuotes = quotes.filter((q) => q.status === "accepted" && (q as any).is_from_replicated);
    if (acceptedQuotes.length === 0) return null;
    const totalProducts = acceptedQuotes.reduce((sum, q) => sum + q.items_count, 0);
    return { totalQuotes: acceptedQuotes.length, totalProducts };
  }, [quotes, userRole]);

  const pendingActivations = useMemo(
    () => quotes.filter((q) => q.status === "accepted" && q.has_replicated_catalog && !q.catalog_activated),
    [quotes],
  );

  const highlightQuoteId = searchParams.get("highlight");

  const filteredQuotes = quotes.filter((quote) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quote.customer_name.toLowerCase().includes(query) ||
      quote.customer_email.toLowerCase().includes(query) ||
      quote.customer_company?.toLowerCase().includes(query)
    );
  });

  const handleActivateCatalog = async (quoteId: string) => {
    if (!user) return;
    setActivatingQuoteId(quoteId);
    try {
      const { data: replicaCatalog, error: findError } = await supabase
        .from("replicated_catalogs")
        .select("id")
        .eq("quote_id", quoteId)
        .single();

      if (findError) throw findError;
      if (!replicaCatalog) throw new Error("No se encontró el catálogo replicado");

      const { error: updateError } = await supabase
        .from("replicated_catalogs")
        .update({
          is_active: true,
          reseller_id: user.id,
          activated_at: new Date().toISOString(),
        })
        .eq("id", replicaCatalog.id);

      if (updateError) throw updateError;

      toast({
        title: "🎉 ¡Catálogo activado!",
        description: "Redirigiendo a tus catálogos...",
      });

      await refetch();
      setTimeout(() => {
        navigate("/catalogs");
      }, 2000);
    } catch (error: any) {
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

  // --- UI Helpers ---
  const getStatusConfig = (status: QuoteStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendiente",
          color: "bg-amber-100 text-amber-700 border-amber-200",
          icon: Clock,
          border: "border-l-amber-500",
        };
      case "accepted":
        return {
          label: "Aceptada",
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          border: "border-l-emerald-500",
        };
      case "rejected":
        return {
          label: "Rechazada",
          color: "bg-rose-100 text-rose-700 border-rose-200",
          icon: XCircle,
          border: "border-l-rose-500",
        };
      default:
        return {
          label: "Enviado",
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Package,
          border: "border-l-blue-500",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8 min-h-screen bg-slate-50/50">
      {/* --- HEADER & KPI STRIP --- */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cotizaciones</h1>
            <p className="text-slate-500">Gestiona y cierra las solicitudes de tus clientes.</p>
          </div>

          {/* KPI Strip Compacto */}
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 min-w-[140px] shadow-sm flex flex-col justify-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">Pendientes</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-amber-600">{stats.pending}</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 min-w-[140px] shadow-sm flex flex-col justify-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">Aceptadas</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-600">{stats.accepted}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 min-w-[160px] shadow-md flex flex-col justify-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Monto Total</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">
                  ${(stats.total_amount_accepted / 100).toLocaleString("es-MX")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- BANNERS DE ACCIÓN (L2) --- */}
        <AnimatePresence>
          {acceptedQuotesForConsolidation && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-gradient-to-r from-emerald-50 to-white border-emerald-200 shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <PackagePlus className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900">
                        Consolida tus pedidos ({acceptedQuotesForConsolidation.totalQuotes})
                      </h3>
                      <p className="text-sm text-emerald-700">
                        Tienes {acceptedQuotesForConsolidation.totalProducts} productos aprobados listos para pedir a
                        tus proveedores.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/reseller/consolidated-orders")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto shadow-md shadow-emerald-200"
                  >
                    Ver Pedidos Consolidados
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {pendingActivations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-purple-900">Activa tu Catálogo ({pendingActivations.length})</h3>
                      <p className="text-sm text-purple-700">
                        Tienes cotizaciones aprobadas que te permiten abrir tu propia tienda al instante.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto shadow-md shadow-purple-200"
                    onClick={() => {
                      const firstPending = pendingActivations[0];
                      document
                        .getElementById(`quote-${firstPending.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    Ir a Activar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- TOOLBAR & LISTA --- */}
      <div className="space-y-4">
        {/* Toolbar de Filtros */}
        <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar cliente, empresa o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-none shadow-none focus-visible:ring-0 bg-transparent"
            />
          </div>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <div className="w-full md:w-auto flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {/* Filtros rápidos estilo Pill */}
            <Button
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-4 h-8 text-xs ${statusFilter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-500"}`}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "pending" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("pending")}
              className={`rounded-full px-4 h-8 text-xs ${statusFilter === "pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "text-slate-500"}`}
            >
              Pendientes
            </Button>
            <Button
              variant={statusFilter === "accepted" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("accepted")}
              className={`rounded-full px-4 h-8 text-xs ${statusFilter === "accepted" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "text-slate-500"}`}
            >
              Aceptadas
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "secondary" : "ghost"}
              onClick={() => setStatusFilter("rejected")}
              className={`rounded-full px-4 h-8 text-xs ${statusFilter === "rejected" ? "bg-rose-100 text-rose-800 hover:bg-rose-200" : "text-slate-500"}`}
            >
              Rechazadas
            </Button>
          </div>
        </div>

        {/* Lista de Cotizaciones */}
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No se encontraron cotizaciones</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
              {searchQuery
                ? "Intenta con otro término de búsqueda o cambia los filtros."
                : "Tus cotizaciones aparecerán aquí cuando las recibas."}
            </p>
            {searchQuery && (
              <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2 text-indigo-600">
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredQuotes.map((quote) => {
              const statusConfig = getStatusConfig(quote.status);
              const StatusIcon = statusConfig.icon;
              const isHighlighted = quote.id === highlightQuoteId;
              const canActivate =
                quote.status === "accepted" && quote.has_replicated_catalog && !quote.catalog_activated;

              return (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    id={`quote-${quote.id}`}
                    className={`group overflow-hidden hover:shadow-md transition-all border-l-4 ${statusConfig.border} ${isHighlighted ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Section 1: Info Principal (Clickable) */}
                        <div className="flex-1 p-5 cursor-pointer" onClick={() => navigate(`/quotes/${quote.id}`)}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              {/* Avatar Placeholder */}
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                                {quote.customer_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {quote.customer_name}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  {format(new Date(quote.created_at), "d MMM, yyyy • HH:mm", { locale: es })}
                                </p>
                              </div>
                            </div>

                            {/* Price on Mobile (Top Right) */}
                            <div className="text-right md:hidden">
                              <span className="block font-bold text-slate-900">
                                ${(quote.total_amount / 100).toLocaleString("es-MX")}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm pl-[52px]">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Package className="w-4 h-4 text-slate-400" />
                              <span>{quote.items_count} productos</span>
                            </div>
                            {quote.customer_company && (
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span>{quote.customer_company}</span>
                              </div>
                            )}
                            {(quote as any).is_from_replicated && (
                              <Badge
                                variant="outline"
                                className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] px-2"
                              >
                                <Share2 className="w-3 h-3 mr-1" /> Red L2
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Section 2: Status & Price & Actions (Desktop Right Side) */}
                        <div className="border-t md:border-t-0 md:border-l border-slate-100 p-4 md:w-[320px] bg-slate-50/50 flex flex-col justify-center gap-3">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className={`${statusConfig.color} px-3 py-1`}>
                              <StatusIcon className="w-3 h-3 mr-1.5" /> {statusConfig.label}
                            </Badge>
                            <span className="font-bold text-lg text-slate-900 hidden md:block">
                              ${(quote.total_amount / 100).toLocaleString("es-MX")}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/quotes/${quote.id}`)}
                              className="bg-white hover:bg-slate-50"
                            >
                              <Eye className="w-4 h-4 mr-2 text-slate-500" /> Ver
                            </Button>

                            {canActivate ? (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-sm"
                                onClick={() => {
                                  setSelectedQuoteForActivation(quote.id);
                                  setShowActivationModal(true);
                                }}
                              >
                                <Rocket className="w-4 h-4 mr-2" /> Activar
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 cursor-default hover:bg-transparent hover:text-slate-400"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL DE ACTIVACIÓN (Mantenido funcionalmente igual) --- */}
      <Dialog open={showActivationModal} onOpenChange={setShowActivationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <Rocket className="w-5 h-5" />
              Activar Catálogo
            </DialogTitle>
            <DialogDescription className="pt-2">
              Al activar esta cotización, se creará una tienda digital única para ti basada en estos productos.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-purple-50 p-4 rounded-lg space-y-3 border border-purple-100">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <p className="text-sm text-purple-900">Obtienes un enlace único para compartir.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <p className="text-sm text-purple-900">Puedes editar tus precios de venta.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <p className="text-sm text-purple-900">Recibes pedidos directo en tu panel.</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setShowActivationModal(false);
                setSelectedQuoteForActivation(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
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
                  Confirmar Activación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
