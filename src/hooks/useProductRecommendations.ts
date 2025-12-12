import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
export type RecommendationScope = "CATALOG" | "STORE" | "GLOBAL";

// ... (Tipos sin cambios) ...
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
  source_type: string;
};

type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
  source_type?: string;
};

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

  const scope = options?.scope ?? "CATALOG";
  const resellerId = options?.resellerId ?? null;
  const vendorId = options?.vendorId ?? null;
  const targetCategory = options?.targetCategory ?? null;

  const cartIdsKey = useMemo(() => JSON.stringify(currentCartProductIds.sort()), [currentCartProductIds]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Validación estricta antes de enviar
      if (!catalogOwnerId || currentCartProductIds.length === 0) {
        setRecommendations([]);
        return;
      }

      setLoading(true);

      try {
        // ✅ ESTRATEGIA JSON: Empaquetamos todo en un solo objeto 'payload'
        const payloadObject = {
          product_ids: currentCartProductIds,
          scope: scope,
          catalog_id: currentCatalogId || null,
          reseller_id: resellerId || null,
          vendor_id: vendorId || null,
          target_category: targetCategory || null,
          limit: 5,
        };

        console.log("🚀 [Hook V2] Enviando Payload JSON:", payloadObject);

        // Llamamos a la nueva función V2
        const { data, error } = await supabase.rpc("get_smart_recommendations_v2", {
          payload: payloadObject, // Pasamos el objeto completo como un solo parámetro
        });

        if (error) {
          console.error("💥 [Hook V2] Error:", error);
          setRecommendations([]);
        } else {
          console.log("✅ [Hook V2] Éxito:", data);
          const results = (data as unknown as SmartRecommendation[]) || [];

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
                user_id: "",
                created_at: "",
                updated_at: "",
              }) as RecommendedProduct,
          );

          setRecommendations(formattedResults.slice(0, 3));
        }
      } catch (err) {
        console.error("💀 [Hook V2] Error JS:", err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartIdsKey, catalogOwnerId, currentCatalogId, scope, resellerId, vendorId, targetCategory]);

  return { recommendations, loading };
};
