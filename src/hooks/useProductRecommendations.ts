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

// Helper para limpiar IDs individuales
const cleanString = (val: string | null | undefined): string | null => {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
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

  // Clave para detectar cambios en el carrito
  const cartIdsKey = useMemo(() => JSON.stringify(currentCartProductIds.sort()), [currentCartProductIds]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // 1. LIMPIEZA DE ARRAY (CRÍTICO PARA EVITAR ERROR 400)
      // Filtramos IDs basura dentro del array
      const validProductIds = currentCartProductIds
        .map((id) => cleanString(id))
        .filter((id) => id !== null) as string[];

      // LOG DE DIAGNÓSTICO 🚨
      console.group("🔍 DIAGNÓSTICO RECOMENDADOR");
      console.log("1. IDs Originales:", currentCartProductIds);
      console.log("2. IDs Limpios:", validProductIds);
      console.log("3. Owner ID:", catalogOwnerId);
      console.log("4. Catalog ID:", currentCatalogId);

      if (!catalogOwnerId || validProductIds.length === 0) {
        console.log("❌ ABORTANDO: Faltan datos críticos.");
        console.groupEnd();
        setRecommendations([]);
        return;
      }

      setLoading(true);

      try {
        // Preparamos el paquete de datos
        const rpcPayload = {
          p_product_ids: validProductIds, // Enviamos solo los limpios
          p_scope: scope,
          p_catalog_id: cleanString(currentCatalogId),
          p_reseller_id: cleanString(resellerId),
          p_vendor_id: cleanString(vendorId),
          p_target_category: cleanString(targetCategory),
          p_limit: 5,
        };

        console.log("🚀 PAYLOAD FINAL A SUPABASE:", JSON.stringify(rpcPayload, null, 2));

        // Llamada RPC
        const { data, error } = await supabase.rpc("get_smart_recommendations", rpcPayload);

        if (error) {
          console.error("💥 ERROR SUPABASE (400/500):", error);
          console.error("Detalle:", error.message, error.details, error.hint);
          setRecommendations([]);
        } else {
          console.log("✅ ÉXITO. Datos recibidos:", data);
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
        console.error("💀 ERROR FATAL JS:", err);
        setRecommendations([]);
      } finally {
        console.groupEnd();
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartIdsKey, catalogOwnerId, currentCatalogId, scope, resellerId, vendorId, targetCategory]);

  return { recommendations, loading };
};
