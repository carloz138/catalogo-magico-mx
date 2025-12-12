import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

type OwnerPlan = {
  name: string;
  analytics_level: "basic" | "advanced" | "pro";
};

// Recommendation scope types
export type RecommendationScope = "CATALOG" | "STORE" | "GLOBAL";

// Smart recommendation result from RPC
type SmartRecommendation = {
  id: string;
  name: string;
  price_retail: number | null;
  processed_image_url: string | null;
  original_image_url: string | null;
  stock_quantity: number | null;
  allow_backorder: boolean;
  lead_time_days: number;
  category: string | null;
  vendor_id: string | null;
  recommendation_reason: string;
  confidence_score: number;
  source_type: string; // 'mba', 'similar', 'top_sold', 'category_network'
};

type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
  source_type?: string;
};

interface UseProductRecommendationsOptions {
  currentCartProductIds?: string[];
  catalogOwnerId: string | null;
  currentCatalogId?: string | null;
  scope?: RecommendationScope;
  resellerId?: string | null;
  vendorId?: string | null;
  targetCategory?: string | null;
}

export const useProductRecommendations = (
  currentCartProductIds: string[] = [],
  catalogOwnerId: string | null,
  currentCatalogId?: string | null,
  options?: {
    scope?: RecommendationScope;
    resellerId?: string | null;
    vendorId?: string | null;
    targetCategory?: string | null;
  },
) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerPlan, setOwnerPlan] = useState<OwnerPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Extract options with defaults
  const scope = options?.scope ?? "CATALOG";
  const resellerId = options?.resellerId ?? null;
  const vendorId = options?.vendorId ?? null;
  const targetCategory = options?.targetCategory ?? null;

  // Memoized cart IDs key for dependency tracking
  const cartIdsKey = useMemo(() => JSON.stringify(currentCartProductIds.sort()), [currentCartProductIds]);

  // 1. FETCH OWNER PLAN
  useEffect(() => {
    if (!catalogOwnerId) {
      setOwnerPlan(null);
      setLoadingPlan(false);
      return;
    }

    const fetchOwnerPlan = async () => {
      setLoadingPlan(true);
      const { data, error } = await supabase.rpc("fn_get_owner_plan_details" as any, {
        p_owner_id: catalogOwnerId,
      });

      if (error) {
        console.error("Error fetching owner plan:", error);
        setOwnerPlan(null);
      } else {
        setOwnerPlan(data as unknown as OwnerPlan);
      }
      setLoadingPlan(false);
    };
    fetchOwnerPlan();
  }, [catalogOwnerId]);

  // 2. FETCH SMART RECOMMENDATIONS
  useEffect(() => {
    const fetchRecommendations = async () => {
      // Validation
      if (loadingPlan || !ownerPlan || !catalogOwnerId || currentCartProductIds.length === 0) {
        setRecommendations([]);
        return;
      }

      /* const level = ownerPlan.analytics_level;

      // Only 'pro' level gets recommendations
      if (level !== "pro") {
        setRecommendations([]);
        return;
      } */

      setLoading(true);

      try {
        // Call the smart recommendations RPC
        const { data, error } = await supabase.rpc("get_smart_recommendations" as any, {
          p_product_ids: currentCartProductIds,
          p_scope: scope,
          p_catalog_id: currentCatalogId ?? null,
          p_reseller_id: resellerId,
          p_vendor_id: vendorId,
          p_target_category: targetCategory,
          p_limit: 5,
        });

        if (error) {
          console.error("Error fetching smart recommendations:", error);
          setRecommendations([]);
          setLoading(false);
          return;
        }

        const results = (data as unknown as SmartRecommendation[]) || [];

        // Transform to RecommendedProduct format
        const formattedResults: RecommendedProduct[] = results.map(
          (rec) =>
            ({
              id: rec.id,
              name: rec.name,
              price_retail: rec.price_retail,
              processed_image_url: rec.processed_image_url,
              original_image_url: rec.original_image_url,
              stock_quantity: rec.stock_quantity,
              allow_backorder: rec.allow_backorder,
              lead_time_days: rec.lead_time_days,
              category: rec.category,
              vendor_id: rec.vendor_id,
              reason: rec.recommendation_reason,
              confidence: rec.confidence_score,
              source_type: rec.source_type,
              // Fill in required Product fields with defaults
              user_id: "",
              created_at: "",
              updated_at: "",
            }) as RecommendedProduct,
        );

        setRecommendations(formattedResults.slice(0, 3)); // Show max 3 in UI
      } catch (err) {
        console.error("Unexpected error in recommendations:", err);
        setRecommendations([]);
      }

      setLoading(false);
    };

    fetchRecommendations();
  }, [
    cartIdsKey,
    catalogOwnerId,
    ownerPlan,
    loadingPlan,
    currentCatalogId,
    scope,
    resellerId,
    vendorId,
    targetCategory,
  ]);

  return { recommendations, loading };
};
