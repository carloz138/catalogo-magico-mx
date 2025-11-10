import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext'; // Importamos nuestro hook del Paso 3
// Asumo que tienes un tipo Product en esta ruta. Si no, ajusta la importación.
import { type Product } from '@/types/product'; 

// Tipo para el producto recomendado que devolveremos
// Asumo que tu tipo 'Product' ya tiene: id, name, price_retail, processed_image_url
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

/**
 * Hook para obtener recomendaciones de productos basadas en el carrito actual
 * y el plan de suscripción del usuario.
 */
export const useProductRecommendations = (
  // Solo necesitamos los IDs de los productos en el carrito
  currentCartProductIds: string[] = [] 
) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 1. Obtenemos la lógica de acceso y el estado de carga del plan
  const { hasAccess, loading: loadingSubscription } = useSubscription();
  
  // Verificamos si el usuario tiene acceso a esta feature
  const canShowRecommendations = hasAccess('recomendaciones');

  useEffect(() => {
    // 2. Lógica de Gating:
    // No hacer nada si la suscripción está cargando o si no tiene acceso
    if (loadingSubscription || !canShowRecommendations) {
      setRecommendations([]);
      return;
    }

    // No hacer nada si el carrito está vacío
    if (!currentCartProductIds || currentCartProductIds.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const cartIds = currentCartProductIds;

        const { data: associations, error } = await supabase
          .from('product_associations')
          .select(`
            product_b_id,
            confidence_score,
            co_occurrence_count,
            products:product_b_id (
              id,
              name,
              price_retail,
              processed_image_url
            )
          `)
          .in('product_a_id', cartIds)
          // 3. CORRECCIÓN: Excluir productos que YA están en el carrito
          .not('product_b_id', 'in', `(${cartIds.join(',')})`) // Tu sintaxis original estaba bien
          .order('confidence_score', { ascending: false })
          .order('co_occurrence_count', { ascending: false })
          .limit(5); // Traemos máximo 5

        if (error) throw error;

        // 4. Tu lógica para des-duplicar (¡que es muy buena!)
        //    (Evita que 'Producto C' aparezca dos veces si es recomendado
        //    por 'Producto A' y 'Producto B' que están en el carrito)
        const uniqueRecommendations = (associations as AssociationResponse[]).reduce(
          (acc: RecommendedProduct[], item) => {
            // Asegurarnos de que el producto anidado exista
            if (item.products && !acc.find(r => r.id === item.products.id)) {
              acc.push({
                ...item.products,
                reason: `${item.co_occurrence_count} clientes también compraron esto`,
                confidence: item.confidence_score,
              });
            }
            return acc;
          },
          []
        );

        setRecommendations(uniqueRecommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
    
  }, [
      // 5. Dependencias:
      // Re-ejecutar si el carrito cambia (convertido a string para comparación estable)
      JSON.stringify(currentCartProductIds), 
      // Re-ejecutar si el acceso a la feature cambia (ej. de 'false' a 'true')
      canShowRecommendations, 
      // Re-ejecutar cuando la suscripción termine de cargar
      loadingSubscription
  ]); 

  return { recommendations, loading };
};
