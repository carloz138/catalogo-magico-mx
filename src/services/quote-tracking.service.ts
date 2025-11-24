import { supabase } from "@/integrations/supabase/client";

// ✅ INTERFAZ HÍBRIDA (Soporta lo nuevo y lo viejo para no romper nada)
export interface TrackingQuoteData {
  id: string;
  order_number: string;
  status: "pending" | "negotiation" | "accepted" | "rejected" | "shipped";
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

  // ✅ CAMPOS NUEVOS
  shipping_cost: number;
  total_amount: number;
  estimated_delivery_date?: string | null;

  // ✅ CAMPO LEGACY (Para que no se rompa QuoteTracking.tsx)
  total: number;

  // Catálogo info
  catalog: {
    name: string;
    slug: string | null;
  } | null;

  // Business info
  business_info: {
    business_name: string;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  } | null;

  replicated_catalogs?: {
    id: string;
    is_active: boolean;
  } | null;
}

export class QuoteTrackingService {
  static async getQuoteByToken(token: string): Promise<TrackingQuoteData> {
    // 1. Validar token
    const { data: trackingToken, error: tokenError } = await supabase
      .from("quote_tracking_tokens")
      .select("quote_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (tokenError || !trackingToken) throw new Error("Token inválido");
    if (trackingToken.expires_at && new Date(trackingToken.expires_at) < new Date()) {
      throw new Error("Link expirado");
    }

    await supabase
      .from("quote_tracking_tokens")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("token", token);

    // 2. Obtener cotización (USANDO ANY PARA EVITAR ERRORES DE TIPOS DESACTUALIZADOS)
    // 🔴 FIX CRÍTICO: (supabase as any) permite pedir columnas que TS aún no conoce
    const { data: quote, error: quoteError } = await (supabase as any)
      .from("quotes")
      .select(
        `
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
        shipping_cost,
        total_amount,
        estimated_delivery_date,
        replicated_catalogs (id, is_active),
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
      `,
      )
      .eq("id", trackingToken.quote_id)
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching quote:", quoteError);
      throw new Error("Cotización no encontrada");
    }

    // 3. Helpers de datos extra
    let catalog = null;
    if (quote.catalog_id) {
      const { data } = await supabase.from("digital_catalogs").select("name, slug").eq("id", quote.catalog_id).single();
      catalog = data;
    }

    let business_info = null;
    if (quote.user_id) {
      const { data } = await supabase
        .from("business_info")
        .select("business_name, phone, email, logo_url")
        .eq("user_id", quote.user_id)
        .single();
      business_info = data;
    }

    // 4. Cálculos
    const items = (quote as any).quote_items || [];
    const itemsSubtotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    const shipping = quote.shipping_cost || 0;
    const finalTotal = quote.total_amount || itemsSubtotal + shipping;

    const replicaData = Array.isArray(quote.replicated_catalogs)
      ? quote.replicated_catalogs[0]
      : quote.replicated_catalogs;

    return {
      id: quote.id,
      order_number: quote.order_number,
      status: quote.status as any,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      customer_company: quote.customer_company,
      notes: quote.notes,
      items,
      shipping_cost: shipping,
      total_amount: finalTotal,
      total: finalTotal, // ✅ RETROCOMPATIBILIDAD: Mantenemos 'total' duplicado
      estimated_delivery_date: quote.estimated_delivery_date,
      catalog,
      business_info,
      replicated_catalogs: replicaData,
    };
  }

  static async searchByOrderNumber(orderNumber: string): Promise<string | null> {
    const cleanOrderNumber = orderNumber.trim().toUpperCase().replace(/\s+/g, "");
    const { data: quote } = await supabase
      .from("quotes")
      .select("id")
      .eq("order_number", cleanOrderNumber)
      .maybeSingle();
    if (!quote) return null;
    const { data: trackingToken } = await supabase
      .from("quote_tracking_tokens")
      .select("token")
      .eq("quote_id", quote.id)
      .maybeSingle();
    return trackingToken?.token || null;
  }

  static async getTrackingLink(quoteId: string): Promise<string> {
    const { data: trackingToken } = await supabase
      .from("quote_tracking_tokens")
      .select("token")
      .eq("quote_id", quoteId)
      .single();
    if (!trackingToken) throw new Error("Token no encontrado");
    return `${window.location.origin}/track/${trackingToken.token}`;
  }
}
