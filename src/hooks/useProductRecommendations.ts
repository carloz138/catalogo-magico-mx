import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
export type RecommendationScope = "CATALOG" | "STORE" | "GLOBAL";

// Estructura que devuelve la Base de Datos (V2)
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

// Estructura que usa el Frontend
type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
  source_type?: string;
};

// Helper para limpiar strings vacíos o undefined
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

  // Clave para detectar cambios en el carrito y evitar re-renders infinitos
  const cartIdsKey = useMemo(() => JSON.stringify(currentCartProductIds.sort()), [currentCartProductIds]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // 1. Limpieza de IDs del carrito (Filtrar nulos/vacíos)
      const validProductIds = currentCartProductIds
        .map((id) => cleanString(id))
        .filter((id) => id !== null) as string[];

      // Validación básica: Si no hay dueño o productos, no hay recomendaciones
      if (!catalogOwnerId || validProductIds.length === 0) {
        setRecommendations([]);
        return;
      }

      setLoading(true);

      try {
        // 2. Construcción del Payload JSON (Para la función V2)
        const payloadObject = {
          product_ids: validProductIds,
          scope: scope,
          catalog_id: cleanString(currentCatalogId),
          reseller_id: cleanString(resellerId),
          vendor_id: cleanString(vendorId),
          target_category: cleanString(targetCategory),
          limit: 5,
        };

        console.log("🚀 [Hook V2] Enviando Payload:", payloadObject);

        // 3. Llamada RPC a la versión V2 (Usamos 'as any' para evitar error de tipos de TS)
        const { data, error } = await supabase.rpc("get_smart_recommendations_v2" as any, {
          payload: payloadObject,
        });

        if (error) {
          console.error("💥 [Hook V2] Error Supabase:", error);
          setRecommendations([]);
        } else {
          console.log("✅ [Hook V2] Recomendaciones recibidas:", data);

          const results = (data as unknown as SmartRecommendation[]) || [];

          // Mapeo de snake_case (DB) a camelCase (Frontend)
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
                user_id: "", // Defaults necesarios para el tipo Product
                created_at: "",
                updated_at: "",
              }) as RecommendedProduct,
          );

          setRecommendations(formattedResults.slice(0, 3)); // Mostrar máx 3
        }
      } catch (err) {
        console.error("💀 [Hook V2] Error inesperado JS:", err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartIdsKey, catalogOwnerId, currentCatalogId, scope, resellerId, vendorId, targetCategory]);

  return { recommendations, loading };
};
