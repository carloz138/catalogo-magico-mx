import { supabase } from '@/integrations/supabase/client';
import {
  DigitalCatalog,
  CreateDigitalCatalogDTO,
  UpdateDigitalCatalogDTO,
  CatalogLimitInfo,
  PublicCatalogView,
} from '@/types/digital-catalog';
import bcrypt from 'bcryptjs';

export class DigitalCatalogService {
  
  // Verificar límites del usuario
  static async checkCatalogLimit(userId: string): Promise<CatalogLimitInfo> {
    const { data, error } = await supabase
      .rpc('check_catalog_limit', { p_user_id: userId });
    
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No se pudo verificar límite de catálogos');
    }
    
    return data[0];
  }
  
  // Verificar si puede crear catálogos privados
  static async canCreatePrivateCatalog(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_create_private_catalog', { p_user_id: userId });
    
    if (error) throw error;
    return data || false;
  }
  
  // Crear catálogo digital
  static async createCatalog(
    userId: string,
    catalogData: CreateDigitalCatalogDTO
  ): Promise<DigitalCatalog> {
    // Verificar límites
    const limitInfo = await this.checkCatalogLimit(userId);
    if (!limitInfo.can_create) {
      throw new Error(limitInfo.message);
    }
    
    // Verificar privacidad
    if (catalogData.is_private) {
      const canCreate = await this.canCreatePrivateCatalog(userId);
      if (!canCreate) {
        throw new Error('Tu plan no permite crear catálogos privados. Actualiza a plan Profesional o Premium.');
      }
    }
    
    // Hashear password si es privado
    let hashedPassword = null;
    if (catalogData.is_private && catalogData.access_password) {
      hashedPassword = await bcrypt.hash(catalogData.access_password, 10);
    }
    
    // Generar slug
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_catalog_slug');
    
    if (slugError) throw slugError;
    const slug = slugData;
    
    // Crear catálogo
    const { data: catalog, error: catalogError } = await supabase
      .from('digital_catalogs')
      .insert({
        user_id: userId,
        name: catalogData.name,
        slug,
        description: catalogData.description || null,
        price_display: catalogData.price_display,
        price_adjustment_menudeo: catalogData.price_adjustment_menudeo,
        price_adjustment_mayoreo: catalogData.price_adjustment_mayoreo,
        show_sku: catalogData.show_sku,
        show_tags: catalogData.show_tags,
        show_description: catalogData.show_description,
        is_private: catalogData.is_private,
        access_password: hashedPassword,
        expires_at: catalogData.expires_at || null,
      })
      .select()
      .single();
    
    if (catalogError) throw catalogError;
    if (!catalog) throw new Error('Error al crear catálogo');
    
    // Agregar productos
    if (catalogData.product_ids.length > 0) {
      const catalogProducts = catalogData.product_ids.map((productId, index) => ({
        catalog_id: catalog.id,
        product_id: productId,
        sort_order: index,
      }));
      
      const { error: productsError } = await supabase
        .from('catalog_products')
        .insert(catalogProducts);
      
      if (productsError) throw productsError;
    }
    
    return catalog as DigitalCatalog;
  }
  
  // Obtener catálogos del usuario
  static async getUserCatalogs(userId: string): Promise<DigitalCatalog[]> {
    const { data, error } = await supabase
      .from('digital_catalogs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as DigitalCatalog[];
  }
  
  // Obtener catálogo por ID (con productos)
  static async getCatalogById(
    catalogId: string,
    userId: string
  ): Promise<DigitalCatalog & { products: any[] }> {
    const { data: catalog, error: catalogError } = await supabase
      .from('digital_catalogs')
      .select('*')
      .eq('id', catalogId)
      .eq('user_id', userId)
      .single();
    
    if (catalogError) throw catalogError;
    
    const { data: catalogProducts, error: productsError } = await supabase
      .from('catalog_products')
      .select(`
        product_id,
        sort_order,
        products (*)
      `)
      .eq('catalog_id', catalogId)
      .order('sort_order');
    
    if (productsError) throw productsError;
    
    const products = catalogProducts?.map((cp: any) => cp.products) || [];
    
    return { ...catalog, products } as DigitalCatalog & { products: any[] };
  }
  
  // Actualizar catálogo
  static async updateCatalog(
    catalogId: string,
    userId: string,
    updates: UpdateDigitalCatalogDTO
  ): Promise<DigitalCatalog> {
    // Verificar privacidad si está cambiando
    if (updates.is_private !== undefined && updates.is_private) {
      const canCreate = await this.canCreatePrivateCatalog(userId);
      if (!canCreate) {
        throw new Error('Tu plan no permite catálogos privados.');
      }
    }
    
    // Hashear nueva contraseña si aplica
    let hashedPassword = undefined;
    if (updates.is_private && updates.access_password) {
      hashedPassword = await bcrypt.hash(updates.access_password, 10);
    }
    
    const updateData: any = { ...updates };
    if (hashedPassword) {
      updateData.access_password = hashedPassword;
    }
    delete updateData.product_ids; // No actualizar productos aquí
    
    const { data, error } = await supabase
      .from('digital_catalogs')
      .update(updateData)
      .eq('id', catalogId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Actualizar productos si se proporcionaron
    if (updates.product_ids) {
      // Eliminar productos actuales
      await supabase
        .from('catalog_products')
        .delete()
        .eq('catalog_id', catalogId);
      
      // Insertar nuevos
      if (updates.product_ids.length > 0) {
        const catalogProducts = updates.product_ids.map((productId, index) => ({
          catalog_id: catalogId,
          product_id: productId,
          sort_order: index,
        }));
        
        await supabase
          .from('catalog_products')
          .insert(catalogProducts);
      }
    }
    
    return data as DigitalCatalog;
  }
  
  // Eliminar catálogo
  static async deleteCatalog(catalogId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('digital_catalogs')
      .delete()
      .eq('id', catalogId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
  
  // Obtener catálogo público por slug
  static async getPublicCatalog(slug: string): Promise<PublicCatalogView> {
    const { data: catalog, error: catalogError } = await supabase
      .from('digital_catalogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (catalogError) throw catalogError;
    
    // Verificar expiración
    if (catalog.expires_at && new Date(catalog.expires_at) < new Date()) {
      throw new Error('Este catálogo ha expirado');
    }
    
    // Obtener productos
    const { data: catalogProducts, error: productsError } = await supabase
      .from('catalog_products')
      .select(`
        products (
          id, name, sku, description, price_retail, price_wholesale,
          wholesale_min_qty, original_image_url, processed_image_url, tags, category
        )
      `)
      .eq('catalog_id', catalog.id)
      .order('sort_order');
    
    if (productsError) throw productsError;
    
    const products = catalogProducts?.map((cp: any) => ({
      ...cp.products,
      image_url: cp.products.processed_image_url || cp.products.original_image_url
    })).filter(Boolean) || [];
    
    // Obtener info del negocio
    const { data: businessInfo } = await supabase
      .from('business_info')
      .select('business_name, logo_url, phone, email, website')
      .eq('user_id', catalog.user_id)
      .single();
    
    return {
      ...catalog,
      products,
      business_info: businessInfo || {
        business_name: 'Catálogo Digital',
        logo_url: null,
        phone: null,
        email: null,
        website: null,
      },
    } as PublicCatalogView;
  }
  
  // Verificar acceso a catálogo privado
  static async verifyPrivateAccess(
    slug: string,
    password: string
  ): Promise<boolean> {
    const { data: catalog, error } = await supabase
      .from('digital_catalogs')
      .select('access_password')
      .eq('slug', slug)
      .eq('is_private', true)
      .single();
    
    if (error || !catalog.access_password) return false;
    
    return await bcrypt.compare(password, catalog.access_password);
  }
  
  // Registrar vista
  static async trackView(
    catalogId: string,
    metadata: {
      ip_address?: string;
      user_agent?: string;
      referrer?: string;
      country?: string;
      city?: string;
    }
  ): Promise<void> {
    // Incrementar contador usando función RPC
    await supabase.rpc('increment_catalog_views', { p_catalog_id: catalogId });
    
    // Registrar vista detallada
    await supabase
      .from('catalog_views')
      .insert({
        catalog_id: catalogId,
        ...metadata,
      });
  }
}
