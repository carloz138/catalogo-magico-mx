import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { QuoteService } from "@/services/quote.service";
import { Quote, QuoteStatus } from "@/types/digital-catalog";
import { useToast } from "@/hooks/use-toast";

interface UseQuotesOptions {
  catalog_id?: string;
  status?: QuoteStatus;
  autoLoad?: boolean;
}

// ✅ NUEVO: Tipo extendido para incluir info de catálogo replicado
export interface QuoteWithMetadata extends Quote {
  items_count: number;
  total_amount: number;
  has_replicated_catalog: boolean;
  catalog_activated: boolean;
  catalog_name?: string;
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
    if (!user) return;

    setLoading(true);
    try {
      const data = await QuoteService.getUserQuotes(user.id, {
        catalog_id: options.catalog_id,
        status: options.status,
      });
      setQuotes(data as QuoteWithMetadata[]);
    } catch (error) {
      console.error("Error loading quotes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
