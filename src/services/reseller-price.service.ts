import { supabase } from "@/integrations/supabase/client";

export interface ResellerProductPrice {
  id: string;
  replicated_catalog_id: string;
  product_id: string;
  custom_price_retail: number | null;
  custom_price_wholesale: number | null;
  is_in_stock: boolean;
  stock_quantity: number;
}

export interface ProductVariantWithCustomPrice {
  id: string;
  sku: string | null;
  variant_combination: Record<string, string>;
  original_price_retail: number;
  original_price_wholesale: number;
  custom_price_retail: number | null;
  custom_price_wholesale: number | null;
  is_in_stock: boolean;
  stock_quantity: number;
  is_purchased: boolean; // Si L2 compró esta variante en la cotización original
}

export interface ProductWithCustomPrice {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  
  // Precios originales (del fabricante)
  original_price_retail: number;
  original_price_wholesale: number;
  
  // Precios personalizados (del revendedor)
  custom_price_retail: number | null;
  custom_price_wholesale: number | null;
  
  // Control de inventario
  is_in_stock: boolean;
  stock_quantity: number;
  
  // Estado
  is_purchased: boolean; // Si L2 compró este producto en la cotización original
  has_variants: boolean;
  variants?: ProductVariantWithCustomPrice[]; // ✅ NUEVO
}

export class ResellerPriceService {
  /**
   * Obtener productos con sus precios personalizados y variantes
   */
  static async getProductsWithPrices(
    replicatedCatalogId: string,
    userId: string
  ): Promise<ProductWithCustomPrice[]> {
    // 1. Verificar que el usuario sea el dueño del catálogo replicado
    const { data: catalog, error: catalogError } = await supabase
      .from("replicated_catalogs")
      .select("original_catalog_id, quote_id, reseller_id")
      .eq("id", replicatedCatalogId)
      .eq("reseller_id", userId)
      .single();

    if (catalogError || !catalog) {
      throw new Error("Catálogo no encontrado o no autorizado");
    }

    // 2. Obtener IDs de productos y variantes comprados en la cotización original
    let purchasedProductIds: string[] = [];
    let purchasedVariantIds: string[] = [];
    if (catalog.quote_id) {
      const { data: quoteItems } = await supabase
        .from("quote_items")
        .select("product_id, variant_id")
        .eq("quote_id", catalog.quote_id);

      purchasedProductIds = quoteItems?.map(item => item.product_id) || [];
      purchasedVariantIds = quoteItems
        ?.map(item => item.variant_id)
        .filter(id => id !== null && id !== undefined) as string[];
    }

    // 3. Obtener todos los productos del catálogo original con sus variantes
    const { data: catalogProducts, error: productsError } = await supabase
      .from("catalog_products")
      .select(`
        products (
          id, name, sku, 
          price_retail, price_wholesale,
          processed_image_url, original_image_url,
          has_variants,
          product_variants (
            id, sku, variant_combination,
            price_retail, price_wholesale,
            stock_quantity, is_default
          )
        )
      `)
      .eq("catalog_id", catalog.original_catalog_id)
      .order("sort_order");

    if (productsError) throw productsError;

    const products = catalogProducts
      ?.map((cp: any) => cp.products)
      .filter(Boolean) || [];

    // 4. Obtener precios personalizados existentes (productos)
    const { data: customPrices } = await supabase
      .from("reseller_product_prices")
      .select("*")
      .eq("replicated_catalog_id", replicatedCatalogId);

    // 5. Obtener precios personalizados de variantes
    const { data: customVariantPrices } = await supabase
      .from("reseller_variant_prices")
      .select("*")
      .eq("replicated_catalog_id", replicatedCatalogId);

    // 6. Combinar todo
    const result: ProductWithCustomPrice[] = products.map((product: any) => {
      const customPrice = customPrices?.find(cp => cp.product_id === product.id);
      const isPurchased = purchasedProductIds.includes(product.id);
      
      // Procesar variantes si existen
      let variants: ProductVariantWithCustomPrice[] = [];
      if (product.has_variants && product.product_variants) {
        variants = product.product_variants.map((variant: any) => {
          const customVariantPrice = customVariantPrices?.find(cvp => cvp.variant_id === variant.id);
          const isVariantPurchased = purchasedVariantIds.includes(variant.id);
          
          return {
            id: variant.id,
            sku: variant.sku,
            variant_combination: variant.variant_combination,
            original_price_retail: variant.price_retail,
            original_price_wholesale: variant.price_wholesale,
            custom_price_retail: customVariantPrice?.custom_price_retail || null,
            custom_price_wholesale: customVariantPrice?.custom_price_wholesale || null,
            is_in_stock: customVariantPrice?.is_in_stock || isVariantPurchased,
            stock_quantity: customVariantPrice?.stock_quantity || 0,
            is_purchased: isVariantPurchased,
          };
        });
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        image_url: product.processed_image_url || product.original_image_url,
        
        original_price_retail: product.price_retail,
        original_price_wholesale: product.price_wholesale,
        
        custom_price_retail: customPrice?.custom_price_retail || null,
        custom_price_wholesale: customPrice?.custom_price_wholesale || null,
        
        is_in_stock: customPrice?.is_in_stock || isPurchased,
        stock_quantity: customPrice?.stock_quantity || 0,
        
        is_purchased: isPurchased,
        has_variants: product.has_variants,
        variants: variants.length > 0 ? variants : undefined,
      };
    });

    return result;
  }

  /**
   * Actualizar precio e inventario de un producto
   */
  static async updateProductPrice(
    replicatedCatalogId: string,
    productId: string,
    userId: string,
    data: {
      custom_price_retail?: number;
      custom_price_wholesale?: number;
      is_in_stock?: boolean;
      stock_quantity?: number;
    }
  ): Promise<void> {
    // 1. Verificar autorización
    const { data: catalog, error: catalogError } = await supabase
      .from("replicated_catalogs")
      .select("reseller_id, original_catalog_id")
      .eq("id", replicatedCatalogId)
      .eq("reseller_id", userId)
      .single();

    if (catalogError || !catalog) {
      throw new Error("No autorizado");
    }

    // 2. Obtener precio original del producto
    const { data: product } = await supabase
      .from("catalog_products")
      .select(`
        products (price_retail, price_wholesale)
      `)
      .eq("catalog_id", catalog.original_catalog_id)
      .eq("product_id", productId)
      .single();

    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const originalProduct = (product as any).products;

    // 3. Validar que NO esté bajando los precios
    if (data.custom_price_retail !== undefined) {
      if (data.custom_price_retail < originalProduct.price_retail) {
        throw new Error(
          `No puedes bajar el precio de menudeo. Mínimo: $${(originalProduct.price_retail / 100).toFixed(2)}`
        );
      }
    }

    if (data.custom_price_wholesale !== undefined) {
      if (data.custom_price_wholesale < originalProduct.price_wholesale) {
        throw new Error(
          `No puedes bajar el precio de mayoreo. Mínimo: $${(originalProduct.price_wholesale / 100).toFixed(2)}`
        );
      }
    }

    // 4. Upsert en reseller_product_prices
    const { error: upsertError } = await supabase
      .from("reseller_product_prices")
      .upsert({
        replicated_catalog_id: replicatedCatalogId,
        product_id: productId,
        custom_price_retail: data.custom_price_retail || null,
        custom_price_wholesale: data.custom_price_wholesale || null,
        is_in_stock: data.is_in_stock ?? false,
        stock_quantity: data.stock_quantity ?? 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'replicated_catalog_id,product_id'
      });

    if (upsertError) {
      console.error("Error updating price:", upsertError);
      throw new Error(`Error al actualizar: ${upsertError.message}`);
    }
  }

  /**
   * Actualizar precio e inventario de una variante
   */
  static async updateVariantPrice(
    replicatedCatalogId: string,
    variantId: string,
    userId: string,
    data: {
      custom_price_retail?: number;
      custom_price_wholesale?: number;
      is_in_stock?: boolean;
      stock_quantity?: number;
    }
  ): Promise<void> {
    // 1. Verificar autorización
    const { data: catalog, error: catalogError } = await supabase
      .from("replicated_catalogs")
      .select("reseller_id")
      .eq("id", replicatedCatalogId)
      .eq("reseller_id", userId)
      .single();

    if (catalogError || !catalog) {
      throw new Error("No autorizado");
    }

    // 2. Obtener precio original de la variante
    const { data: variant } = await supabase
      .from("product_variants")
      .select("price_retail, price_wholesale")
      .eq("id", variantId)
      .single();

    if (!variant) {
      throw new Error("Variante no encontrada");
    }

    // 3. Validar que NO esté bajando los precios
    if (data.custom_price_retail !== undefined) {
      if (data.custom_price_retail < variant.price_retail) {
        throw new Error(
          `No puedes bajar el precio de menudeo. Mínimo: $${(variant.price_retail / 100).toFixed(2)}`
        );
      }
    }

    if (data.custom_price_wholesale !== undefined) {
      if (data.custom_price_wholesale < variant.price_wholesale) {
        throw new Error(
          `No puedes bajar el precio de mayoreo. Mínimo: $${(variant.price_wholesale / 100).toFixed(2)}`
        );
      }
    }

    // 4. Upsert en reseller_variant_prices
    const { error: upsertError } = await supabase
      .from("reseller_variant_prices")
      .upsert({
        replicated_catalog_id: replicatedCatalogId,
        variant_id: variantId,
        custom_price_retail: data.custom_price_retail || null,
        custom_price_wholesale: data.custom_price_wholesale || null,
        is_in_stock: data.is_in_stock ?? false,
        stock_quantity: data.stock_quantity ?? 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'replicated_catalog_id,variant_id'
      });

    if (upsertError) {
      console.error("Error updating variant price:", upsertError);
      throw new Error(`Error al actualizar variante: ${upsertError.message}`);
    }
  }

  /**
   * Actualizar múltiples productos y variantes de una vez (batch)
   */
  static async batchUpdatePrices(
    replicatedCatalogId: string,
    userId: string,
    updates: Array<{
      product_id?: string;
      variant_id?: string;
      custom_price_retail?: number;
      custom_price_wholesale?: number;
      is_in_stock?: boolean;
      stock_quantity?: number;
    }>
  ): Promise<void> {
    // Procesar uno por uno (podría optimizarse, pero es más seguro así)
    for (const update of updates) {
      if (update.variant_id) {
        await this.updateVariantPrice(
          replicatedCatalogId,
          update.variant_id,
          userId,
          update
        );
      } else if (update.product_id) {
        await this.updateProductPrice(
          replicatedCatalogId,
          update.product_id,
          userId,
          update
        );
      }
    }
  }
}
