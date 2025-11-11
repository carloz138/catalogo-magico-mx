import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
// ❌ Ya no importamos useSubscription

// Importamos los tipos desde tu ruta correcta
import { type Tables } from "@/integrations/supabase/types";

// Definimos nuestros tipos
type Product = Tables<"products">;
type OwnerPlan = {
  name: string;
  analytics_level: "basic" | "advanced" | "pro";
};

// Tipo para el producto recomendado
type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
};

// Tipo para la respuesta de la BDD (Asociaciones)
type AssociationResponse = {
  product_b_id: string;
  confidence_score: number;
  co_occurrence_count: number;
  products: Product;
};

/**
 * Hook AVANZADO para obtener recomendaciones de productos.
 * Implementa "Efecto Red" (revisa el plan del DUEÑO) y
 * "Cascada de Fallback" (para planes Empresariales).
 */
export const useProductRecommendations = (
  currentCartProductIds: string[] = [],
  catalogOwnerId: string | null, // <-- ¡NUEVA PROP! El ID del dueño del catálogo
) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerPlan, setOwnerPlan] = useState<OwnerPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // 1. OBTENER EL PLAN DEL DUEÑO
  useEffect(() => {
    if (!catalogOwnerId) {
      setOwnerPlan(null);
      setLoadingPlan(false);
      return;
    }

    const fetchOwnerPlan = async () => {
      setLoadingPlan(true);
      const { data, error } = await supabase.rpc("fn_get_owner_plan_details", {
        p_owner_id: catalogOwnerId,
      });

      if (error) {
        console.error("Error fetching owner plan:", error);
        setOwnerPlan(null);
      } else {
        setOwnerPlan(data); // ej. { name: 'Plan Profesional IA', analytics_level: 'pro' }
      }
      setLoadingPlan(false);
    };
    fetchOwnerPlan();
  }, [catalogOwnerId]);

  // 2. LÓGICA DE RECOMENDACIÓN EN CASCADA
  useEffect(() => {
    // Convertimos los IDs a string para una dependencia estable en el useEffect
    const cartIdsKey = JSON.stringify(currentCartProductIds);

    const fetchRecommendations = async () => {
      // Validaciones iniciales
      if (loadingPlan || !ownerPlan || !catalogOwnerId || currentCartProductIds.length === 0) {
        setRecommendations([]);
        return;
      }

      // --- LÓGICA DE GATING (basada en el plan del DUEÑO) ---
      const level = ownerPlan.analytics_level;
      const isEmpresarial = ownerPlan.name.includes("Empresarial");

      // Si no tiene al menos 'pro' (Plan Profesional), no hacemos nada
      if (level !== "pro") {
        setRecommendations([]);
        return;
      }

      setLoading(true);

      // --- INICIA LA CASCADA ---

      // 1. Intento #1: MBA (Ventas Pasadas - Plan Profesional y Empresarial)
      const { data: mbaResults, error: mbaError } = await supabase
        .from("product_associations")
        .select(
          `
          product_b_id,
          confidence_score,
          co_occurrence_count,
          products!product_b_id (
            id, name, price_retail, processed_image_url
          )
        `,
        )
        .in("product_a_id", currentCartProductIds)
        .not("product_b_id", "in", `(${currentCartProductIds.join(",")})`)
        .order("confidence_score", { ascending: false })
        .order("co_occurrence_count", { ascending: false })
        .limit(3); // Traemos 3 de este

      if (mbaError) console.error("Error en Cascada (Paso 1 - MBA):", mbaError);

      if (mbaResults && mbaResults.length > 0) {
        const formattedResults = (mbaResults as AssociationResponse[]).reduce((acc: RecommendedProduct[], item) => {
          if (item.products && !acc.find((r) => r.id === item.products.id)) {
            acc.push({
              ...item.products,
              reason: `${item.co_occurrence_count} clientes también compraron esto`,
              confidence: item.confidence_score,
            });
          }
          return acc;
        }, []);

        setRecommendations(formattedResults);
        setLoading(false);
        return; // ¡Éxito! Encontramos el más relevante.
      }

      // 2. Revisión de Plan: Si NO es Empresarial, nos detenemos aquí.
      //    El plan Pro ($599) solo tiene el MBA (Paso 1).
      if (!isEmpresarial) {
        setRecommendations([]); // No hay MBA y no es Empresarial
        setLoading(false);
        return; // Fin del "Recomendador Simple"
      }

      // --- INICIA CASCADA "EMPRESARIAL" ---

      // 3. Intento #2: "Similares" (Plan Empresarial $1,299)
      const { data: similarResults, error: similarError } = await supabase.rpc("fn_get_similar_products", {
        p_owner_id: catalogOwnerId,
        product_ids_in_cart: currentCartProductIds,
        p_limit: 3,
      });

      if (similarError) console.error("Error en Cascada (Paso 2 - Similares):", similarError);

      if (similarResults && similarResults.length > 0) {
        const formattedResults = similarResults.map((product) => ({
          ...(product as Product),
          reason: "Porque es similar a lo que llevas",
          confidence: 0, // No aplica, pero el tipo lo requiere
        }));
        setRecommendations(formattedResults);
        setLoading(false);
        return; // ¡Éxito!
      }

      // 4. Intento #3: "Más Vendidos" (Plan Empresarial $1,299)
      const { data: topSoldResults, error: topSoldError } = await supabase.rpc("fn_get_top_sold_products", {
        p_owner_id: catalogOwnerId,
        p_limit: 3,
      });

      if (topSoldError) console.error("Error en Cascada (Paso 3 - Más Vendidos):", topSoldError);

      if (topSoldResults && topSoldResults.length > 0) {
        const formattedResults = topSoldResults.map((product) => ({
          ...(product as Product),
          reason: "¡Es uno de los más vendidos!",
          confidence: 0,
        }));
        setRecommendations(formattedResults);
        setLoading(false);
        return; // ¡Éxito!
      }

      // 5. Cascada Fallida (No encontramos nada)
      setRecommendations([]);
      setLoading(false);
    };

    fetchRecommendations();
  }, [
    cartIdsKey, // <-- Usamos la clave estable
    catalogOwnerId,
    ownerPlan,
    loadingPlan,
  ]);

  return { recommendations, loading };
};
