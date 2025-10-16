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

    // Tu función RPC retorna un RECORD, mapeamos los campos correctamente
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
        background_pattern: catalogData.background_pattern || null,
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

  static async getCatalogById(catalogId: string, userId: string): Promise<DigitalCatalog & { products: any[] }> {
    const { data: catalog, error: catalogError } = await supabase
      .from("digital_catalogs")
      .select("*")
      .eq("id", catalogId)
      .eq("user_id", userId)
      .single();

    if (catalogError) throw catalogError;

    const { data: catalogProducts, error: productsError } = await supabase
      .from("catalog_products")
      .select(
        `
        product_id,
        sort_order,
        products (*)
      `,
      )
      .eq("catalog_id", catalogId)
      .order("sort_order");

    if (productsError) throw productsError;

    const products = catalogProducts?.map((cp: any) => cp.products) || [];

    return { ...catalog, products } as unknown as DigitalCatalog & { products: any[] };
  }

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

    const { data, error } = await supabase
      .from("digital_catalogs")
      .update(updateData)
      .eq("id", catalogId)
      .eq("user_id", userId)
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

  static async getPublicCatalog(slug: string): Promise<PublicCatalogView> {
    const { data: catalog, error: catalogError } = await supabase
      .from("digital_catalogs")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (catalogError) {
      if (catalogError.code === "PGRST116") {
        throw new Error("Catálogo no encontrado");
      }
      throw catalogError;
    }

    if (catalog.expires_at && new Date(catalog.expires_at) < new Date()) {
      throw new Error("Catálogo expirado");
    }

    const { data: catalogProducts, error: productsError } = await supabase
      .from("catalog_products")
      .select(
        `
        products (
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
      .select("business_name, logo_url, phone, email, website")
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
      },
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
