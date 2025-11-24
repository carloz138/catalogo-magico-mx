import { supabase } from "@/integrations/supabase/client";

// Interfaz completa para el Frontend
export interface TrackingQuoteData {
  id: string;
  order_number: string;
  status: "pending" | "negotiation" | "accepted" | "rejected" | "shipped";
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  notes: string | null;
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
  // Campos nuevos
  shipping_cost: number;
  total_amount: number;
  total: number; // Legacy support
  estimated_delivery_date?: string | null;
  catalog: { name: string; slug: string | null } | null;
  business_info: { business_name: string; phone: string | null; email: string | null; logo_url: string | null } | null;
  replicated_catalogs?: { id: string; is_active: boolean } | null;
}

export class QuoteTrackingService {
  /**
   * ✅ CORREGIDO: Llama a la Edge Function para evitar bloqueos de RLS
   */
  static async getQuoteByToken(token: string): Promise<TrackingQuoteData> {
    console.log("🔍 Solicitando cotización vía Edge Function para token:", token);

    const { data, error } = await supabase.functions.invoke("get-quote-by-token", {
      body: { token: token }, // Enviamos 'token' que tu función ya sabe leer
    });

    if (error) {
      console.error("❌ Error invocando Edge Function:", error);
      throw new Error("Error de conexión con el servidor.");
    }

    if (!data.success || !data.quote) {
      console.error("❌ Respuesta de error de la función:", data);
      throw new Error(data.error || "Cotización no encontrada o expirada.");
    }

    const quote = data.quote;

    // --- MAPPING Y CÁLCULOS (Frontend) ---
    // Aseguramos que los datos vengan en el formato que la vista espera

    const items = quote.quote_items || [];
    const itemsSubtotal = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
    const shipping = quote.shipping_cost || 0;

    // Preferencia: Total guardado > Calculado
    const finalTotal = quote.total_amount || itemsSubtotal + shipping;

    // Extraer info anidada
    const catalog = quote.digital_catalogs
      ? {
          name: quote.digital_catalogs.name,
          slug: quote.digital_catalogs.slug || null,
        }
      : null;

    const businessInfo = quote.digital_catalogs?.users
      ? {
          business_name: quote.digital_catalogs.users.business_name || "Proveedor",
          phone: quote.digital_catalogs.users.phone || null,
          email: quote.digital_catalogs.users.email || null,
          logo_url: null,
        }
      : null;

    const replicaData = Array.isArray(quote.replicated_catalogs)
      ? quote.replicated_catalogs[0]
      : quote.replicated_catalogs;

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
      shipping_cost: shipping,
      total_amount: finalTotal,
      total: finalTotal, // ✅ Legacy fix
      estimated_delivery_date: quote.estimated_delivery_date,
      catalog,
      business_info: businessInfo,
      replicated_catalogs: replicaData,
    };
  }

  static async getTrackingLink(quoteId: string): Promise<string> {
    // Este sí puede ser directo porque lo llama el DUEÑO (que tiene permisos)
    const { data: trackingToken } = await supabase
      .from("quote_tracking_tokens")
      .select("token")
      .eq("quote_id", quoteId)
      .maybeSingle();

    if (!trackingToken) throw new Error("Token no encontrado");
    return `${window.location.origin}/track/${trackingToken.token}`;
  }
}
