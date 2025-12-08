import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QuoteService } from "@/services/quote.service";
import { Quote, QuoteStatus, FulfillmentStatus } from "@/types/digital-catalog";
import { useToast } from "@/hooks/use-toast";

interface UseQuotesOptions {
  catalog_id?: string;
  status?: QuoteStatus;
  autoLoad?: boolean;
}

// ✅ CORREGIDO: QuoteWithMetadata hereda 'fulfillment_status' (Requerido) de Quote.
// Ya no lo re-declaramos como opcional para evitar el error TS2430.
export interface QuoteWithMetadata extends Quote {
  items_count: number;
  total_amount: number;
  has_replicated_catalog: boolean;
  is_from_replicated?: boolean;
  catalog_activated?: boolean;
  catalog_name?: string;

  // Este sí es nuevo y opcional porque no existe en la tabla 'quotes' física
  payment_status?: string;
}

export function useQuotes(options: UseQuotesOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<QuoteWithMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    shipped: 0,
    total_amount_accepted: 0,
  });

  const loadQuotes = async () => {
    console.log("🔍 [useQuotes] loadQuotes iniciado - user:", user?.id);
    if (!user) {
      console.log("⚠️ [useQuotes] No hay usuario, abortando carga");
      return;
    }

    setLoading(true);
    console.log("🔍 [useQuotes] Llamando a QuoteService.getUserQuotes...");
    try {
      const data = await QuoteService.getUserQuotes(user.id, {
        catalog_id: options.catalog_id,
        status: options.status,
      });
      console.log("✅ [useQuotes] Cotizaciones recibidas:", data?.length, data);
      // Casting seguro
      setQuotes(data as unknown as QuoteWithMetadata[]);
    } catch (error) {
      console.error("❌ [useQuotes] Error loading quotes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("🔍 [useQuotes] Carga finalizada");
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const statsData = await QuoteService.getQuoteStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading quote stats:", error);
    }
  };

  const updateStatus = async (quoteId: string, status: QuoteStatus) => {
    if (!user) return;

    try {
      await QuoteService.updateQuoteStatus(quoteId, user.id, status);

      // Actualizar en el estado local
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status } : q)));

      // Recargar stats
      await loadStats();

      toast({
        title: status === "accepted" ? "Cotización aceptada" : "Cotización rechazada",
        description: "El cliente será notificado del cambio",
      });
    } catch (error) {
      console.error("Error updating quote status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cotización",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (options.autoLoad !== false && user) {
      loadQuotes();
      loadStats();
    }
  }, [user, options.catalog_id, options.status]);

  return {
    quotes,
    stats,
    loading,
    loadQuotes,
    updateStatus,
    refetch: loadQuotes,
  };
}
