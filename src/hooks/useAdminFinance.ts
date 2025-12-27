import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminFinancialSummary {
  total_sales_gross: number;
  total_earnings_saas: number;
  total_paid_out: number;
  pending_payout_balance: number;
}

interface PayoutQueueItem {
  merchant_id: string;
  business_name: string;
  clabe_deposit: string;
  contact_email: string;
  contact_phone: string | null;
  amount_to_pay: number;
  transactions_count: number;
  oldest_payment_date: string;
}

export function useAdminFinance() {
  const summaryQuery = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_financial_summary")
        .select("*")
        .single();
      
      if (error) {
        console.error("Error fetching admin financial summary:", error);
        return null;
      }
      
      return data as AdminFinancialSummary;
    },
  });

  const payoutQueueQuery = useQuery({
    queryKey: ["admin-payout-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_payout_queue")
        .select("*")
        .order("amount_to_pay", { ascending: false });
      
      if (error) {
        console.error("Error fetching payout queue:", error);
        return [];
      }
      
      return data as PayoutQueueItem[];
    },
  });

  return {
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    payoutQueue: payoutQueueQuery.data ?? [],
    isLoadingPayoutQueue: payoutQueueQuery.isLoading,
    refetch: () => {
      summaryQuery.refetch();
      payoutQueueQuery.refetch();
    },
  };
}
