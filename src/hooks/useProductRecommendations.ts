import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Tables } from "@/integrations/supabase/types";

// Definimos nuestros tipos
type Product = Tables<"products">;

// Tipo para el plan del dueño
type OwnerPlan = {
  name: string;
  analytics_level: "basic" | "advanced" | "pro";
};

type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
};

type AssociationResponse = {
  product_b_id: string;
  confidence_score: number;
  co_occurrence_count: number;
  products: Product;
};

interface UseProductRecommendationsOptions {
  currentCartProductIds?: string[];
  catalogOwnerId: string | null;
  currentCatalogId?: string | null;
}

// Extended Product type with backorder fields
type ProductWithBackorder = Product & {
  allow_backorder?: boolean;
  lead_time_days?: number;
};

// Helper function to filter valid products (Reality Filter)
// Updated to support Make-to-Order (Backorder) logic
const isValidProduct = (product: ProductWithBackorder | null): product is ProductWithBackorder => {
  if (!product) return false;
  // Check 1: Not Deleted
  if (product.deleted_at !== null) return false;
  // Check 2: Active (is_processed check - product was successfully processed)
  // Check 3: In Stock OR allows backorder
  const hasStock = (product.stock_quantity ?? 0) > 0;
  const allowsBackorder = product.allow_backorder === true;
  if (!hasStock && !allowsBackorder) return false;
  return true;
};

export const useProductRecommendations = (
  currentCartProductIds: string[] = [],
  catalogOwnerId: string | null,
  currentCatalogId?: string | null
) => {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerPlan, setOwnerPlan] = useState<OwnerPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Definimos esta variable AFUERA para usarla en las dependencias
  const cartIdsKey = JSON.stringify(currentCartProductIds);

  // 1. OBTENER EL PLAN DEL DUEÑO
  useEffect(() => {
    if (!catalogOwnerId) {
      setOwnerPlan(null);
      setLoadingPlan(false);
      return;
    }

    const fetchOwnerPlan = async () => {
      setLoadingPlan(true);
      // Usamos 'as any' para evitar errores si los tipos de Supabase no se han regenerado
      const { data, error } = await supabase.rpc("fn_get_owner_plan_details" as any, {
        p_owner_id: catalogOwnerId,
      });

      if (error) {
        console.error("Error fetching owner plan:", error);
        setOwnerPlan(null);
      } else {
        // Forzamos el tipo de respuesta
        setOwnerPlan(data as unknown as OwnerPlan);
      }
      setLoadingPlan(false);
    };
    fetchOwnerPlan();
  }, [catalogOwnerId]);

  // 2. LÓGICA DE RECOMENDACIÓN EN CASCADA
  useEffect(() => {
    const fetchRecommendations = async () => {
      // Validaciones iniciales
      if (loadingPlan || !ownerPlan || !catalogOwnerId || currentCartProductIds.length === 0) {
        setRecommendations([]);
        return;
      }

      const level = ownerPlan.analytics_level;
      const isEmpresarial = ownerPlan.name.includes("Empresarial");

      // Si no tiene al menos 'pro', no hacemos nada
      if (level !== "pro") {
        setRecommendations([]);
        return;
      }

      setLoading(true);

      // --- HELPER: Validate product is in current catalog ---
      const validateCatalogContext = async (productIds: string[]): Promise<Set<string>> => {
        if (!currentCatalogId || productIds.length === 0) {
          return new Set(productIds); // No catalog filter, allow all
        }
        
        const { data: catalogProducts } = await supabase
          .from("catalog_products")
          .select("product_id")
          .eq("catalog_id", currentCatalogId)
          .in("product_id", productIds);
        
        return new Set((catalogProducts || []).map(cp => cp.product_id));
      };

      // --- INICIA LA CASCADA ---

      // 1. Intento #1: MBA (Ventas Pasadas) with Reality Filter
      const { data: mbaResults, error: mbaError } = await supabase
        .from("product_associations")
        .select(
          `
          product_b_id,
          confidence_score,
          co_occurrence_count,
          products!product_b_id (
            id, name, price_retail, processed_image_url, original_image_url,
            deleted_at, stock_quantity, is_processed
          )
        `,
        )
        .in("product_a_id", currentCartProductIds)
        .not("product_b_id", "in", `(${currentCartProductIds.join(",")})`)
        .order("confidence_score", { ascending: false })
        .order("co_occurrence_count", { ascending: false })
        .limit(10); // Fetch more to filter zombies

      if (mbaError) console.error("Error en Cascada (Paso 1 - MBA):", mbaError);

      if (mbaResults && mbaResults.length > 0) {
        // Apply Reality Filter
        const validAssociations = (mbaResults as unknown as AssociationResponse[])
          .filter(item => isValidProduct(item.products));
        
        // Apply Catalog Context Filter
        const productIds = validAssociations.map(a => a.products.id);
        const validInCatalog = await validateCatalogContext(productIds);
        
        const formattedResults = validAssociations
          .filter(item => validInCatalog.has(item.products.id))
          .slice(0, 3) // Limit to 3 after filtering
          .reduce((acc: RecommendedProduct[], item) => {
            if (!acc.find((r) => r.id === item.products.id)) {
              acc.push({
                ...item.products,
                reason: `${item.co_occurrence_count} clientes también compraron esto`,
                confidence: item.confidence_score,
              });
            }
            return acc;
          }, []);

        if (formattedResults.length > 0) {
          setRecommendations(formattedResults);
          setLoading(false);
          return; // ¡Éxito!
        }
      }

      // 2. Revisión: Si NO es Empresarial, nos detenemos
      if (!isEmpresarial) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // --- INICIA CASCADA "EMPRESARIAL" ---

      // 3. Intento #2: "Similares"
      const { data: similarData, error: similarError } = await supabase.rpc("fn_get_similar_products" as any, {
        p_owner_id: catalogOwnerId,
        product_ids_in_cart: currentCartProductIds,
        p_limit: 10, // Fetch more to filter zombies
      });

      if (similarError) console.error("Error en Cascada (Paso 2 - Similares):", similarError);

      const similarProducts = ((similarData as unknown as Product[]) || [])
        .filter(isValidProduct);
      
      if (similarProducts.length > 0) {
        const productIds = similarProducts.map(p => p.id);
        const validInCatalog = await validateCatalogContext(productIds);
        
        const formattedResults = similarProducts
          .filter(p => validInCatalog.has(p.id))
          .slice(0, 3)
          .map((product) => ({
            ...product,
            reason: "Porque es similar a lo que llevas",
            confidence: 0,
          }));
        
        if (formattedResults.length > 0) {
          setRecommendations(formattedResults);
          setLoading(false);
          return; // ¡Éxito!
        }
      }

      // 4. Intento #3: "Más Vendidos"
      const { data: topSoldData, error: topSoldError } = await supabase.rpc("fn_get_top_sold_products" as any, {
        p_owner_id: catalogOwnerId,
        p_limit: 10, // Fetch more to filter zombies
      });

      if (topSoldError) console.error("Error en Cascada (Paso 3 - Más Vendidos):", topSoldError);

      const topSoldProducts = ((topSoldData as unknown as Product[]) || [])
        .filter(isValidProduct);

      if (topSoldProducts.length > 0) {
        const productIds = topSoldProducts.map(p => p.id);
        const validInCatalog = await validateCatalogContext(productIds);
        
        const formattedResults = topSoldProducts
          .filter(p => validInCatalog.has(p.id))
          .slice(0, 3)
          .map((product) => ({
            ...product,
            reason: "¡Es uno de los más vendidos!",
            confidence: 0,
          }));
        
        if (formattedResults.length > 0) {
          setRecommendations(formattedResults);
          setLoading(false);
          return; // ¡Éxito!
        }
      }

      // 5. Cascada Fallida
      setRecommendations([]);
      setLoading(false);
    };

    fetchRecommendations();
  }, [cartIdsKey, catalogOwnerId, ownerPlan, loadingPlan, currentCatalogId]);

  return { recommendations, loading };
};
