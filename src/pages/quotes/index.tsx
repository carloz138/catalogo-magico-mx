import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteStatus } from "@/types/digital-catalog";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Package,
  Eye,
  PackagePlus,
  Share2,
  DollarSign,
  Calendar,
  ExternalLink,
  XCircle,
  Search,
  ArrowRight,
  Store,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";

// --- COMPONENTES UI ---

const StatusBadge = ({ status, isPaid }: { status: QuoteStatus; isPaid?: boolean }) => {
  if (status === "accepted" && isPaid) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit bg-emerald-100 text-emerald-700 border border-emerald-200">
        <DollarSign className="w-3.5 h-3.5" />
        ¡PAGO RECIBIDO!
      </div>
    );
  }

  const config = {
    pending: { label: "Solicitud Nueva", bg: "bg-slate-100", text: "text-slate-600", icon: Clock },
    negotiation: { label: "Enviada al Cliente", bg: "bg-blue-100", text: "text-blue-700", icon: ExternalLink },
    accepted: { label: "Esperando Pago", bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
    rejected: { label: "Rechazada", bg: "bg-rose-50", text: "text-rose-700", icon: XCircle },
    shipped: { label: "Enviado / Cerrado", bg: "bg-purple-100", text: "text-purple-700", icon: Package },
  }[status] || { label: status, bg: "bg-gray-50", text: "text-gray-500", icon: Package };

  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${config.bg} ${config.text} border border-transparent`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
};

// --- TIPOS ---

interface BackorderAlert {
  supplier_id: string;
  supplier_name: string;
  total_items_needed: number;
  total_units_needed: number;
}

// --- PÁGINA PRINCIPAL ---

export default function QuotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { userRole } = useUserRole(); // Rol del contexto
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [backorderAlerts, setBackorderAlerts] = useState<BackorderAlert[]>([]);

  // Hook existente para cargar la tabla de cotizaciones
  const { quotes, stats, loading } = useQuotes({
    status: statusFilter === "all" ? undefined : statusFilter,
    autoLoad: true,
  });

  // --- LÓGICA DE ALERTAS BLINDADA (Anti-Error 400) ---
  useEffect(() => {
    // 1. Verificación estricta antes de intentar llamar a la BD
    if ((userRole === "L2" || userRole === "BOTH") && user && user.id) {
      const fetchAlerts = async () => {
        try {
          // Llamada RPC para obtener proveedores con deuda de stock
          const { data, error } = await supabase.rpc("get_backorder_alerts", {
            p_reseller_id: user.id,
          });

          if (error) {
            console.warn("⚠️ No se pudieron cargar alertas de stock (Posible error de red/sesión):", error.message);
            return; // Salimos silenciosamente para no romper la página
          }

          if (data) {
            // Casteo seguro para TypeScript
            setBackorderAlerts(data as unknown as BackorderAlert[]);
          }
        } catch (err) {
          console.error("🔥 Error crítico al buscar alertas:", err);
        }
      };

      fetchAlerts();
    }
  }, [user, userRole]);

  // Manejador del botón "Generar Pedido Consolidado"
  const handleConsolidateClick = async (supplierId: string) => {
    try {
      // Buscamos el ID del catálogo original para navegar correctamente
      const { data } = await supabase
        .from("replicated_catalogs")
        .select("original_catalog_id")
        .eq("distributor_id", supplierId)
        .eq("reseller_id", user?.id)
        .limit(1)
        .maybeSingle();

      if (data?.original_catalog_id) {
        navigate(`/reseller/consolidate/${data.original_catalog_id}`);
      } else {
        console.error("No se encontró catálogo enlace para este proveedor");
      }
    } catch (error) {
      console.error("Error al navegar:", error);
    }
  };

  const highlightQuoteId = searchParams.get("highlight");

  // Filtros de búsqueda en cliente
  const filteredQuotes = quotes.filter((quote) => {
    if (statusFilter !== "all" && quote.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      quote.customer_name.toLowerCase().includes(query) ||
      quote.customer_email.toLowerCase().includes(query) ||
      quote.customer_company?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-900 pb-20">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cotizaciones</h1>
            <p className="text-slate-500 mt-1">Gestiona el flujo comercial y cierra ventas.</p>
          </div>

          {/* KPI Cards */}
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[160px] flex flex-col">
              <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Pendientes
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.pending}</span>
            </div>
          </div>
        </div>

        {/* --- ACTION BANNERS DINÁMICOS (Basados en STOCK REAL) --- */}
        <AnimatePresence>
          {backorderAlerts.map((alert) => (
            <motion.div
              key={alert.supplier_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                {/* Icono decorativo */}
                <div className="absolute -right-4 -top-4 opacity-5">
                  <Store className="w-32 h-32 text-purple-900" />
                </div>

                <div className="flex items-start gap-4 z-10">
                  <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm">
                    <PackagePlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      Reponer Stock: {alert.supplier_name}
                    </h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Tienes <strong>{alert.total_units_needed} unidades</strong> (en {alert.total_items_needed}{" "}
                      productos) pendientes de entrega.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleConsolidateClick(alert.supplier_id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200/50 z-10 group"
                >
                  Generar Pedido Consolidado
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* --- TOOLBAR & TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {(["all", "pending", "accepted", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {{ all: "Todos", pending: "Pendientes", accepted: "Confirmadas", rejected: "Rechazadas" }[status]}
                </button>
              ))}
            </div>
          </div>

          {/* TABLA DE DATOS */}
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium">Sin resultados</h3>
              <p className="text-slate-500 text-sm mt-1">No hay cotizaciones que coincidan con tu búsqueda.</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2 text-indigo-600">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header de Tabla (Solo Desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2">Fecha</div>
                <div className="col-span-2 text-center">Estado</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-right">Acciones</div>
              </div>

              {filteredQuotes.map((quote) => {
                const isHighlighted = quote.id === highlightQuoteId;
                const isPaid = (quote as any).payment_status === "paid";

                return (
                  <div
                    key={quote.id}
                    id={`quote-${quote.id}`}
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className={`group relative md:grid md:grid-cols-12 md:gap-4 p-4 md:px-6 md:py-4 items-center hover:bg-slate-50 transition-colors cursor-pointer ${isHighlighted ? "bg-indigo-50/50" : ""}`}
                  >
                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {quote.customer_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{quote.customer_name}</h3>
                          <p className="text-xs text-slate-500">
                            {format(new Date(quote.created_at), "d MMM", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={quote.status} isPaid={isPaid} />
                    </div>

                    {/* DESKTOP VIEW */}
                    {/* Col 1: Cliente */}
                    <div className="md:col-span-4 mb-2 md:mb-0 flex items-center gap-3">
                      <div className="hidden md:flex h-9 w-9 rounded-lg bg-slate-100 text-slate-600 items-center justify-center font-bold text-xs">
                        {quote.customer_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {quote.customer_name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          {quote.customer_company && <span>{quote.customer_company}</span>}
                          {(quote as any).is_from_replicated && (
                            <span className="flex items-center gap-1 text-violet-600 bg-violet-50 px-1.5 rounded">
                              <Share2 className="w-3 h-3" /> Red
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Fecha */}
                    <div className="hidden md:block col-span-2 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {format(new Date(quote.created_at), "d MMM, HH:mm", { locale: es })}
                      </div>
                    </div>

                    {/* Col 3: Estado */}
                    <div className="hidden md:flex col-span-2 justify-center">
                      <StatusBadge status={quote.status} isPaid={isPaid} />
                    </div>

                    {/* Col 4: Total */}
                    <div className="md:col-span-2 flex justify-between md:justify-end items-center md:text-right">
                      <span className="md:hidden text-sm text-slate-500 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" /> {quote.items_count} items
                      </span>
                      <span className="font-mono font-medium text-slate-900">
                        ${(quote.total_amount / 100).toLocaleString("es-MX")}
                      </span>
                    </div>

                    {/* Col 5: Actions */}
                    <div className="md:col-span-2 flex justify-end gap-2 mt-3 md:mt-0 border-t md:border-none border-slate-100 pt-3 md:pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden md:flex h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="md:hidden w-full h-8 text-xs">
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
