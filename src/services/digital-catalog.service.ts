import { supabase } from "@/integrations/supabase/client";
import {
  DigitalCatalog,
  CreateDigitalCatalogDTO,
  UpdateDigitalCatalogDTO,
  CatalogLimitInfo,
  PublicCatalogView,
} from "@/types/digital-catalog";
import bcrypt from "bcryptjs";

export class DigitalCatalogService {
  static async checkCatalogLimit(userId: string): Promise<CatalogLimitInfo> {
    const { data, error } = await supabase.rpc("check_catalog_limit", { p_user_id: userId });

    if (error) {
      console.error("Error checking catalog limit:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("No se pudo verificar límite de catálogos");
    }

    const limitData = Array.isArray(data) ? data[0] : data;

    return {
      can_create: limitData.can_create || false,
      current_count: limitData.current_count || 0,
      max_allowed: limitData.max_allowed || 1,
      message: limitData.message || "",
      plan_name: (limitData as any).plan_name || "Básico",
    };
  }

  static async canCreatePrivateCatalog(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("can_create_private_catalog", { p_user_id: userId });

    if (error) throw error;
    return data || false;
  }

  static async createCatalog(userId: string, catalogData: CreateDigitalCatalogDTO): Promise<DigitalCatalog> {
    const limitInfo = await this.checkCatalogLimit(userId);
    if (!limitInfo.can_create) {
      throw new Error(limitInfo.message);
    }

    if (catalogData.is_private) {
      const canCreate = await this.canCreatePrivateCatalog(userId);
      if (!canCreate) {
        throw new Error("Tu plan no permite crear catálogos privados. Actualiza a plan Profesional o Premium.");
      }
    }

    let hashedPassword = null;
    if (catalogData.is_private && catalogData.access_password) {
      hashedPassword = await bcrypt.hash(catalogData.access_password, 10);
    }

    const { data: slugData, error: slugError } = await supabase.rpc("generate_catalog_slug");

    if (slugError) throw slugError;
    const slug = slugData;

    const { data: catalog, error: catalogError } = await supabase
      .from("digital_catalogs")
      .insert({
        user_id: userId,
        name: catalogData.name,
        slug,
        description: catalogData.description || null,
        additional_info: catalogData.additional_info || null,
        template_id: catalogData.template_id || null,
        web_template_id: catalogData.web_template_id || null,
        price_display: catalogData.price_display,
        price_adjustment_menudeo: catalogData.price_adjustment_menudeo,
        price_adjustment_mayoreo: catalogData.price_adjustment_mayoreo,
        show_sku: catalogData.show_sku,
        show_tags: catalogData.show_tags,
        show_description: catalogData.show_description,
        show_stock: catalogData.show_stock ?? true,
        is_private: catalogData.is_private,
        access_password: hashedPassword,
        expires_at: catalogData.expires_at || null,
        enable_quotation: catalogData.enable_quotation ?? false,
        enable_variants: catalogData.enable_variants ?? true,
        enable_distribution: catalogData.enable_distribution ?? false,
        enable_free_shipping: catalogData.enable_free_shipping ?? false,
        free_shipping_min_amount: catalogData.free_shipping_min_amount || 0,
        background_pattern: catalogData.background_pattern || null,
        // Guardamos la configuración de tracking
        tracking_head_scripts: catalogData.tracking_head_scripts,
        tracking_body_scripts: catalogData.tracking_body_scripts,
        tracking_config: catalogData.tracking_config,
      })
      .select()
      .single();

    if (catalogError) throw catalogError;
    if (!catalog) throw new Error("Error al crear catálogo");

    if (catalogData.product_ids.length > 0) {
      const catalogProducts = catalogData.product_ids.map((productId, index) => ({
        catalog_id: catalog.id,
        product_id: productId,
        sort_order: index,
      }));

      const { error: productsError } = await supabase.from("catalog_products").insert(catalogProducts);

      if (productsError) throw productsError;
    }

    return catalog as unknown as DigitalCatalog;
  }

  static async getUserCatalogs(userId: string): Promise<DigitalCatalog[]> {
    const { data, error } = await supabase
      .from("digital_catalogs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as DigitalCatalog[];
  }

  // ✅ CORREGIDO: getCatalogById con relación explícita (Previene PGRST201)
  static async getCatalogById(catalogId: string, userId: string): Promise<DigitalCatalog & { products: any[] }> {
    const { data: catalog, error: catalogError } = await supabase
      .from("digital_catalogs")
      .select("*")
      .eq("id", catalogId)
      // Aquí sí dejamos user_id para asegurar que solo cargue si es tuyo al iniciar edición
      .eq("user_id", userId)
      .single();

    if (catalogError) throw catalogError;

    const { data: catalogProducts, error: productsError } = await supabase
      .from("catalog_products")
      .select(
        `
        product_id,
        sort_order,
        products!catalog_products_product_id_fkey (*)
      `,
      )
      .eq("catalog_id", catalogId)
      .order("sort_order");

    if (productsError) throw productsError;

    const products = catalogProducts?.map((cp: any) => cp.products) || [];

    return { ...catalog, products } as unknown as DigitalCatalog & { products: any[] };
  }

  // ✅ CORREGIDO: updateCatalog (Arregla el error 406/PGRST116)
  static async updateCatalog(
    catalogId: string,
    userId: string,
    updates: UpdateDigitalCatalogDTO,
  ): Promise<DigitalCatalog> {
    if (updates.is_private !== undefined && updates.is_private) {
      const canCreate = await this.canCreatePrivateCatalog(userId);
      if (!canCreate) {
        throw new Error("Tu plan no permite catálogos privados.");
      }
    }

    let hashedPassword = undefined;
    if (updates.is_private && updates.access_password) {
      hashedPassword = await bcrypt.hash(updates.access_password, 10);
    }

    const updateData: any = { ...updates };
    if (hashedPassword) {
      updateData.access_password = hashedPassword;
    }
    delete updateData.product_ids;

    // FIX PRINCIPAL: Eliminamos .eq('user_id', userId).
    // Confiamos en que las políticas RLS de Supabase ya filtran por 'auth.uid()'.
    // Esto evita el error "0 rows returned" si hay un conflicto menor en la sesión.
    const { data, error } = await supabase
      .from("digital_catalogs")
      .update(updateData)
      .eq("id", catalogId)
      .select()
      .single();

    if (error) throw error;

    if (updates.product_ids) {
      await supabase.from("catalog_products").delete().eq("catalog_id", catalogId);

      if (updates.product_ids.length > 0) {
        const catalogProducts = updates.product_ids.map((productId, index) => ({
          catalog_id: catalogId,
          product_id: productId,
          sort_order: index,
        }));

        await supabase.from("catalog_products").insert(catalogProducts);
      }
    }

    return data as unknown as DigitalCatalog;
  }

  static async deleteCatalog(catalogId: string, userId: string): Promise<void> {
    const { error } = await supabase.from("digital_catalogs").delete().eq("id", catalogId).eq("user_id", userId);

    if (error) throw error;
  }

  static async getPublicCatalog(slugOrToken: string): Promise<PublicCatalogView> {
    // 1. FLUJO DE RÉPLICA (L2)
    if (slugOrToken.startsWith("r-")) {
      const { data: replicatedCatalog, error: repError } = await supabase
        .from("replicated_catalogs")
        .select(
          `
          id, reseller_id, original_catalog_id, quote_id, is_active
        `,
        )
        .eq("slug", slugOrToken)
        .eq("is_active", true)
        .single();

      if (repError || !replicatedCatalog) {
        throw new Error("Catálogo no encontrado");
      }

      // Get original catalog
      const { data: originalCatalog, error: origError } = await supabase
        .from("digital_catalogs")
        .select("*")
        .eq("id", replicatedCatalog.original_catalog_id)
        .single();

      if (origError || !originalCatalog) {
        throw new Error("Catálogo original no encontrado");
      }

      // Get purchased products AND variants from quote
      let purchasedProductIds: string[] = [];
      let purchasedVariantIds: string[] = [];
      if (replicatedCatalog.quote_id) {
        const { data: quoteItems } = await supabase
          .from("quote_items")
          .select("product_id, variant_id")
          .eq("quote_id", replicatedCatalog.quote_id);

        if (quoteItems && quoteItems.length > 0) {
          purchasedProductIds = quoteItems
            .map((item: any) => item.product_id)
            .filter((id) => id !== null && id !== undefined);

          purchasedVariantIds = quoteItems
            .map((item: any) => item.variant_id)
            .filter((id) => id !== null && id !== undefined);
        }
      }

      // Get catalog products (CORREGIDO CON FK EXPLÍCITA)
      const { data: catalogProducts, error: productsError } = await supabase
        .from("catalog_products")
        .select(
          `
          products!catalog_products_product_id_fkey (
            id, name, sku, description, price_retail, price_wholesale,
            wholesale_min_qty, original_image_url, processed_image_url, tags, category, has_variants,
            product_variants (
              id, variant_combination, sku, price_retail, price_wholesale, stock_quantity, is_default
            )
          )
        `,
        )
        .eq("catalog_id", replicatedCatalog.original_catalog_id)
        .order("sort_order");

      if (productsError) throw productsError;

      // Obtener precios personalizados
      const { data: customProductPrices } = await supabase
        .from("reseller_product_prices")
        .select("*")
        .eq("replicated_catalog_id", replicatedCatalog.id);

      const { data: customVariantPrices } = await supabase
        .from("reseller_variant_prices")
        .select("*")
        .eq("replicated_catalog_id", replicatedCatalog.id);

      // Crear mapas para búsqueda O(1) en lugar de O(n) con find()
      const productPriceMap = new Map(
        (customProductPrices || []).map((p) => [p.product_id, p])
      );
      const variantPriceMap = new Map(
        (customVariantPrices || []).map((v) => [v.variant_id, v])
      );

      const products =
        catalogProducts
          ?.map((cp: any) => {
            const product = cp.products;
            if (!product) return null;
            
            const customPrice = productPriceMap.get(product.id);

            const processedVariants = (product.product_variants || []).map((variant: any) => {
              const customVariantPrice = variantPriceMap.get(variant.id);
              
              // Usar ?? para respetar valores 0, solo usar original si es null/undefined
              return {
                ...variant,
                price_retail: customVariantPrice?.custom_price_retail ?? variant.price_retail,
                price_wholesale: customVariantPrice?.custom_price_wholesale ?? variant.price_wholesale,
                stock_quantity: customVariantPrice?.stock_quantity ?? variant.stock_quantity,
                is_in_stock: customVariantPrice?.is_in_stock ?? (variant.stock_quantity > 0),
              };
            });

            return {
              ...product,
              // Usar ?? para que solo use original si custom es null/undefined
              price_retail: customPrice?.custom_price_retail ?? product.price_retail,
              price_wholesale: customPrice?.custom_price_wholesale ?? product.price_wholesale,
              image_url: product.processed_image_url || product.original_image_url,
              variants: processedVariants,
            };
          })
          .filter(Boolean) || [];

      const { data: businessInfo } = await supabase
        .from("business_info")
        .select("business_name, logo_url, phone, email, website, address")
        .eq("user_id", replicatedCatalog.reseller_id)
        .single();

      return {
        ...originalCatalog,
        user_id: replicatedCatalog.reseller_id,
        originalOwnerId: originalCatalog.user_id,
        products,
        business_info: businessInfo || {
          business_name: "Catálogo Digital",
          logo_url: null,
          phone: null,
          email: null,
          website: null,
          address: null,
        },
        purchasedProductIds,
        purchasedVariantIds,
        isReplicated: true,
        replicatedCatalogId: replicatedCatalog.id,
      } as unknown as PublicCatalogView;
    }

    // 2. FLUJO ORIGINAL (L1) - CORREGIDO
    const { data: catalog, error: catalogError } = await supabase
      .from("digital_catalogs")
      .select("*")
      .eq("slug", slugOrToken)
      .eq("is_active", true)
      .single();

    if (catalogError || !catalog) {
      throw new Error("Catálogo no encontrado");
    }

    if (catalog.expires_at && new Date(catalog.expires_at) < new Date()) {
      throw new Error("Catálogo expirado");
    }

    // Get catalog products (CORREGIDO CON FK EXPLÍCITA)
    const { data: catalogProducts, error: productsError } = await supabase
      .from("catalog_products")
      .select(
        `
        products!catalog_products_product_id_fkey (
          id, name, sku, description, price_retail, price_wholesale,
          wholesale_min_qty, original_image_url, processed_image_url, tags, category, has_variants,
          product_variants (
            id, variant_combination, sku, price_retail, price_wholesale, stock_quantity, is_default
          )
        )
      `,
      )
      .eq("catalog_id", catalog.id)
      .order("sort_order");

    if (productsError) throw productsError;

    const products =
      catalogProducts
        ?.map((cp: any) => ({
          ...cp.products,
          image_url: cp.products.processed_image_url || cp.products.original_image_url,
          variants: cp.products.product_variants || [],
        }))
        .filter(Boolean) || [];

    const { data: businessInfo } = await supabase
      .from("business_info")
      .select("business_name, logo_url, phone, email, website, address")
      .eq("user_id", catalog.user_id)
      .single();

    return {
      ...catalog,
      products,
      business_info: businessInfo || {
        business_name: "Catálogo Digital",
        logo_url: null,
        phone: null,
        email: null,
        website: null,
        address: null,
      },
      purchasedProductIds: [],
      isReplicated: false,
      replicatedCatalogId: null,
    } as unknown as PublicCatalogView;
  }

  static async verifyPrivateAccess(slug: string, password: string): Promise<boolean> {
    const { data: catalog, error } = await supabase
      .from("digital_catalogs")
      .select("access_password")
      .eq("slug", slug)
      .eq("is_private", true)
      .single();

    if (error || !catalog.access_password) return false;

    return await bcrypt.compare(password, catalog.access_password);
  }

  static async trackView(
    catalogId: string,
    metadata: {
      ip_address?: string;
      user_agent?: string;
      referrer?: string;
      country?: string;
      city?: string;
    },
  ): Promise<void> {
    await supabase.rpc("increment_catalog_views", { p_catalog_id: catalogId });

    await supabase.from("catalog_views").insert({
      catalog_id: catalogId,
      ...metadata,
    });
  }
}
