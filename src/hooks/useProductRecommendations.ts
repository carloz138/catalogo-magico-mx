import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";

// --- 👇 1. CORRECCIÓN DE TIPOS ---
// Importamos el "helper" de tipos de Supabase.
// ¡AJUSTA ESTA RUTA SI TU ARCHIVO se llama diferente o está en otro lugar!
import { type Tables } from "@/types/supabase";

// Definimos nuestro tipo 'Product' usando los tipos generados de la tabla 'products'
// Esto nos da autocompletado y seguridad de tipos.
type Product = Tables<"products">;

// Tipo para el producto recomendado que devolveremos
type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
};

// Tipo para la respuesta de la base de datos (con el producto anidado)
type AssociationResponse = {
  product_b_id: string;
  confidence_score: number;
  co_occurrence_count: number;
  products: Product; // El objeto 'products' anidado
};
// --- FIN DE CORRECCIÓN DE TIPOS ---

/**
 * Hook para obtener recomendaciones de productos basadas en el carrito actual
 * y el plan de suscripción del usuario.
 */
export const useProductRecommendations = (currentCartProductIds: string[] = []) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const { hasAccess, loading: loadingSubscription } = useSubscription();
  const canShowRecommendations = hasAccess("recomendaciones");

  useEffect(() => {
    if (loadingSubscription || !canShowRecommendations) {
      setRecommendations([]);
      return;
    }

    if (!currentCartProductIds || currentCartProductIds.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const cartIds = currentCartProductIds;

        const { data: associations, error } = await supabase
          .from("product_associations")
          .select(
            `
            product_b_id,
            confidence_score,
            co_occurrence_count,
            products:product_b_id (
              id,
              name,
              price_retail,
              processed_image_url
            )
          `,
          )
          .in("product_a_id", cartIds)
          .not("product_b_id", "in", `(${cartIds.join(",")})`)
          .order("confidence_score", { ascending: false })
          .order("co_occurrence_count", { ascending: false })
          .limit(5);

        if (error) throw error;

        const uniqueRecommendations = (associations as AssociationResponse[]).reduce(
          (acc: RecommendedProduct[], item) => {
            if (item.products && !acc.find((r) => r.id === item.products.id)) {
              acc.push({
                ...item.products,
                reason: `${item.co_occurrence_count} clientes también compraron esto`,
                confidence: item.confidence_score,
              });
            }
            return acc;
          },
          [],
        );

        setRecommendations(uniqueRecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [JSON.stringify(currentCartProductIds), canShowRecommendations, loadingSubscription]);

  return { recommendations, loading };
};
