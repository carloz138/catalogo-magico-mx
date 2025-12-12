import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
export type RecommendationScope = "CATALOG" | "STORE" | "GLOBAL";

// ... (Mismos tipos de antes: SmartRecommendation, RecommendedProduct) ...
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
      // 🕵️ LOG 1: VERIFICAR ENTRADAS
      console.log("🔥 [Hook] Iniciando búsqueda...", {
        cartIds: currentCartProductIds,
        catalogOwnerId,
        currentCatalogId, // <--- OJO AQUÍ: Si esto es undefined/null en scope CATALOG, fallará.
        scope,
        resellerId,
      });

      if (!catalogOwnerId || currentCartProductIds.length === 0) {
        console.log("🔥 [Hook] Cancelado: Faltan datos (Owner o Carrito vacío)");
        setRecommendations([]);
        return;
      }

      setLoading(true);

      try {
        const rpcParams = {
          p_product_ids: currentCartProductIds,
          p_scope: scope,
          p_catalog_id: currentCatalogId ?? null,
          p_reseller_id: resellerId,
          p_vendor_id: vendorId,
          p_target_category: targetCategory,
          p_limit: 5,
        };

        console.log("🔥 [Hook] Enviando a RPC:", rpcParams);

        const { data, error } = await supabase.rpc("get_smart_recommendations", rpcParams);

        if (error) {
          console.error("🔥 [Hook] Error RPC:", error);
          setRecommendations([]);
        } else {
          const results = (data as unknown as SmartRecommendation[]) || [];
          console.log(`🔥 [Hook] Resultados recibidos: ${results.length}`, results); // <--- ¿Llega vacío aquí?

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
        console.error("🔥 [Hook] Error inesperado:", err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartIdsKey, catalogOwnerId, currentCatalogId, scope, resellerId, vendorId, targetCategory]);

  return { recommendations, loading };
};
