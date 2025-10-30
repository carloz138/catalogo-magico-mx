import { supabase } from "@/integrations/supabase/client";

export interface TrackingQuoteData {
  id: string;
  order_number: string;
  status: "pending" | "accepted" | "rejected" | "shipped";
  created_at: string;
  updated_at: string;
  
  // Datos del cliente
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  notes: string | null;
  
  // Items
  items: Array<{
    id: string;
    product_name: string;
    product_sku: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    price_type: string;
  }>;
  
  // Total
  total: number;
  
  // Catálogo info
  catalog: {
    name: string;
    slug: string | null;
  } | null;
  
  // Business info (del vendedor)
  business_info: {
    business_name: string;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  } | null;
}

export class QuoteTrackingService {
  /**
   * Obtener cotización por token de tracking (público, sin auth)
   */
  static async getQuoteByToken(token: string): Promise<TrackingQuoteData> {
    // 1. Validar token y obtener quote_id
    const { data: trackingToken, error: tokenError } = await supabase
      .from("quote_tracking_tokens")
      .select("quote_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (tokenError) {
      console.error("Error validating token:", tokenError);
      throw new Error("Token inválido");
    }

    if (!trackingToken) {
      throw new Error("Token no encontrado");
    }

    // Verificar expiración
    if (trackingToken.expires_at && new Date(trackingToken.expires_at) < new Date()) {
      throw new Error("Este link de seguimiento ha expirado");
    }

    // 2. Actualizar last_accessed_at
    await supabase
      .from("quote_tracking_tokens")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("token", token);

    // 3. Obtener cotización completa
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        id,
        order_number,
        status,
        created_at,
        updated_at,
        customer_name,
        customer_email,
        customer_phone,
        customer_company,
        notes,
        catalog_id,
        user_id,
        quote_items (
          id,
          product_name,
          product_sku,
          product_image_url,
          quantity,
          unit_price,
          subtotal,
          price_type
        )
      `)
      .eq("id", trackingToken.quote_id)
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching quote:", quoteError);
      throw new Error("Cotización no encontrada");
    }

    // 4. Obtener info del catálogo
    let catalog = null;
    if (quote.catalog_id) {
      const { data: catalogData } = await supabase
        .from("digital_catalogs")
        .select("name, slug")
        .eq("id", quote.catalog_id)
        .single();
      
      catalog = catalogData;
    }

    // 5. Obtener business_info del vendedor
    let business_info = null;
    if (quote.user_id) {
      const { data: businessData } = await supabase
        .from("business_info")
        .select("business_name, phone, email, logo_url")
        .eq("user_id", quote.user_id)
        .single();
      
      business_info = businessData;
    }

    // 6. Calcular total
    const items = (quote as any).quote_items || [];
    const total = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

    return {
      id: quote.id,
      order_number: quote.order_number,
      status: quote.status,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      customer_company: quote.customer_company,
      notes: quote.notes,
      items,
      total,
      catalog,
      business_info,
    };
  }

  /**
   * Buscar cotización por order_number (público)
   */
  static async searchByOrderNumber(orderNumber: string): Promise<string | null> {
    // Limpiar el input (remover espacios, guiones extras, convertir a mayúsculas)
    const cleanOrderNumber = orderNumber.trim().toUpperCase().replace(/\s+/g, '');

    // Buscar la cotización
    const { data: quote } = await supabase
      .from("quotes")
      .select("id")
      .eq("order_number", cleanOrderNumber)
      .maybeSingle();

    if (!quote) {
      return null;
    }

    // Obtener el token de tracking
    const { data: trackingToken } = await supabase
      .from("quote_tracking_tokens")
      .select("token")
      .eq("quote_id", quote.id)
      .maybeSingle();

    return trackingToken?.token || null;
  }

  /**
   * Obtener tracking link completo
   */
  static async getTrackingLink(quoteId: string): Promise<string> {
    const { data: trackingToken } = await supabase
      .from("quote_tracking_tokens")
      .select("token")
      .eq("quote_id", quoteId)
      .single();

    if (!trackingToken) {
      throw new Error("No se encontró token de tracking");
    }

    return `${window.location.origin}/tracking/${trackingToken.token}`;
  }
}
