import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
export type RecommendationScope = "CATALOG" | "STORE" | "GLOBAL";

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

// 🧼 HELPER: Limpia UUIDs para evitar Error 400
// Si recibe "", undefined o strings raros, devuelve null
const cleanUUID = (id: string | null | undefined): string | null => {
  if (!id) return null;
  if (id.trim() === "") return null;
  // Validación básica de formato UUID (8-4-4-4-12 caracteres)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
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
      // Validación básica
      if (!catalogOwnerId || currentCartProductIds.length === 0) {
        setRecommendations([]);
        return;
      }

      setLoading(true);

      try {
        // 🧼 SANITIZACIÓN DE DATOS (Aquí arreglamos el Error 400)
        // Convertimos cualquier "undefined" o string vacío a NULL explícito
        const safeParams = {
          p_product_ids: currentCartProductIds,
          p_scope: scope,
          p_catalog_id: cleanUUID(currentCatalogId),
          p_reseller_id: cleanUUID(resellerId),
          p_vendor_id: cleanUUID(vendorId),
          p_target_category: targetCategory || null, // Strings vacíos a null
          p_limit: 5,
        };

        console.log("🔥 [Hook] Enviando Params Limpios:", safeParams);

        const { data, error } = await supabase.rpc("get_smart_recommendations", safeParams);

        if (error) {
          console.error("🔥 [Hook] Error RPC:", error);
          setRecommendations([]);
        } else {
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
