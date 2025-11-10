import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";

// Importamos los tipos desde tu ruta correcta
import { type Tables } from "@/integrations/supabase/types";

// Definimos nuestro tipo 'Product'
type Product = Tables<"products">;

// Tipo para el producto recomendado
type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
};

// Tipo para la respuesta de la BDD
// NOTA: Esta definición de tipo es nuestra "promesa" a TypeScript
type AssociationResponse = {
  product_b_id: string;
  confidence_score: number;
  co_occurrence_count: number;
  products: Product; // Le decimos que 'products' será un objeto Product
};

/**
 * Hook para obtener recomendaciones de productos...
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

        // 👇 --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
        // Cambiamos 'products:product_b_id' por 'products!product_b_id'
        // El '!' le dice a TypeScript: "Confía en mí, usa la relación 'product_b_id'"
        const { data: associations, error } = await supabase
          .from("product_associations")
          .select(
            `
            product_b_id,
            confidence_score,
            co_occurrence_count,
            products!product_b_id (
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

        // Ahora el 'data' (associations) debería tener el tipo correcto
        // y este 'reduce' no debería fallar.
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
