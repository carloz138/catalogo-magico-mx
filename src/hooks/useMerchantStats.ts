import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MerchantStats {
  user_id: string;
  balance_pending: number;
  balance_paid: number;
  total_earnings: number;
  total_sales_count: number;
}

interface PaymentTransaction {
  id: string;
  quote_id: string;
  amount_total: number;
  commission_saas: number;
  net_to_merchant: number;
  status: string;
  payment_method: string;
  paid_at: string;
  payout_status: string | null;
  payout_date: string | null;
  payout_reference: string | null;
  funds_held_by_platform: boolean; // <--- 1. AGREGADO: Dato vital
}

export function useMerchantStats() {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ["merchant-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("my_merchant_stats").select("*").single();

      if (error) {
        console.error("Error fetching merchant stats:", error);
        return null;
      }

      return data as MerchantStats;
    },
    enabled: !!user,
  });

  const transactionsQuery = useQuery({
    queryKey: ["merchant-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(
          `
          id, 
          quote_id, 
          amount_total, 
          commission_saas, 
          net_to_merchant, 
          status, 
          payment_method, 
          paid_at, 
          payout_status, 
          payout_date, 
          payout_reference,
          funds_held_by_platform  
        `,
        ) // <--- 2. AGREGADO: Pedimos la columna a la BD
        .eq("status", "paid")
        .order("paid_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        return [];
      }

      return data as PaymentTransaction[];
    },
    enabled: !!user,
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    transactions: transactionsQuery.data ?? [],
    isLoadingTransactions: transactionsQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      transactionsQuery.refetch();
    },
  };
}
