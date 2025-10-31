import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteItem, CreateQuoteDTO, QuoteStatus } from "@/types/digital-catalog";

// Definir el tipo de respuesta esperado de nuestra nueva Edge Function
interface CreateQuoteResponse {
  success: boolean;
  quoteId?: string;
  error?: string;
}

// 👇 ¡AQUÍ ESTABA EL ERROR! Faltaba "export" 👇
export class QuoteService {
  /**
   * Crear cotización (desde vista pública - cliente anónimo).
   * AHORA LLAMA A LA EDGE FUNCTION 'create-anonymous-quote'
   */
  static async createQuote(quoteData: CreateQuoteDTO): Promise<Quote> {
    console.log("Invocando Edge Function 'create-anonymous-quote'...");

    // 1. Llamar a la nueva Edge Function segura
    const { data, error } = await supabase.functions.invoke<CreateQuoteResponse>("create-anonymous-quote", {
      body: quoteData, // Pasamos el DTO completo (que incluye los datos del form)
    });

    if (error) {
      console.error("Error al invocar Edge Function:", error);
      // Intenta extraer un mensaje de error más útil si es posible
      const message =
        (error as any).context?.message || error.message || "Error al contactar el servidor de cotizaciones.";
      throw new Error(message);
    }

    // 2. Manejar la respuesta de la Edge Function
    if (data.error) {
      console.error("Error devuelto por la Edge Function:", data.error);
      throw new Error(`Error en el servidor: ${data.error}`);
    }

    if (!data.success || !data.quoteId) {
      console.error("La función no devolvió una respuesta exitosa:", data);
      throw new Error("La función no devolvió una respuesta exitosa.");
    }

    console.log(`Cotización creada exitosamente por Edge Function con ID: ${data.quoteId}`);

    // 3. Devolver un objeto 'Quote' parcial para cumplir con el tipo
    const partialQuote: Quote = {
      id: data.quoteId,
      catalog_id: quoteData.catalog_id,
      user_id: "", // No lo necesitamos en el frontend en este punto
      customer_name: quoteData.customer_name,
      customer_email: quoteData.customer_email,
      customer_company: quoteData.customer_company || null,
      customer_phone: quoteData.customer_phone || null,
      notes: quoteData.notes || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      delivery_method: quoteData.delivery_method,
      shipping_address: quoteData.shipping_address,
      shipping_cost: 0,
    };

    return partialQuote as Quote; // Cumplimos el contrato de tipo Promise<Quote>
  }

  // Obtener cotizaciones del usuario (con filtros)
  static async getUserQuotes(
    userId: string,
    filters?: {
      catalog_id?: string;
      status?: QuoteStatus;
      date_from?: string;
      date_to?: string;
      customer_search?: string;
    },
  ): Promise<Array<Quote & { items_count: number; total_amount: number }>> {
    let query = supabase
      .from("quotes")
      .select(
        `
        *,
        quote_items (
          subtotal
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filters?.catalog_id) {
      query = query.eq("catalog_id", filters.catalog_id);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte("created_at", filters.date_to);
    }
    if (filters?.customer_search) {
      query = query.or(
        `customer_name.ilike.%${filters.customer_search}%,` +
          `customer_email.ilike.%${filters.customer_search}%,` +
          `customer_company.ilike.%${filters.customer_search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calcular totales
    return (data || []).map((quote: any) => {
      const items = quote.quote_items || [];
      const total_amount = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
      const items_count = items.length;
      const { quote_items, ...quoteData } = quote;
      return {
        ...quoteData,
        items_count,
        total_amount,
      } as Quote & { items_count: number; total_amount: number };
    });
  }

  // Obtener detalle completo de cotización
  static async getQuoteDetail(quoteId: string, userId: string): Promise<Quote & { items: QuoteItem[]; catalog: any }> {
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(
        `
        *,
        digital_catalogs (
          id, name, slug, enable_distribution, enable_quotation
        )
      `,
      )
      .eq("id", quoteId)
      .eq("user_id", userId)
      .single();

    if (quoteError) throw quoteError;
    if (!quote) throw new Error("Cotización no encontrada");

    // Obtener items
    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at");

    if (itemsError) throw itemsError;

    return {
      ...quote,
      items: items || [],
      catalog: quote.digital_catalogs,
    } as Quote & { items: QuoteItem[]; catalog: any };
  }

  // Actualizar estado de cotización
  static async updateQuoteStatus(
    quoteId: string,
    userId: string,
    status: QuoteStatus,
    activationLink?: string,
  ): Promise<Quote> {
    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", quoteId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    if (!updatedQuote) throw new Error("No se pudo actualizar la cotización");

    // Enviar notificación por email (solo cuando se acepta)
    if (status === "accepted") {
      try {
        console.log(`📧 Enviando notificación de cotización aceptada: ${quoteId}`);

        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          "send-quote-notification",
          {
            body: { quoteId, newStatus: status },
          },
        );

        if (functionError) {
          console.error("❌ Error al invocar la función de notificación:", functionError);
        } else {
          console.log("✅ Notificación enviada exitosamente:", functionData);
        }
      } catch (notificationError) {
        console.error("❌ Error inesperado al intentar notificar:", notificationError);
      }
    }

    return updatedQuote as Quote;
  }

  // Obtener estadísticas de cotizaciones
  static async getQuoteStats(userId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    total_amount_accepted: number;
    shipped: number; // <-- Añadido para el nuevo estado
  }> {
    const { data: quotes, error } = await supabase
      .from("quotes")
      .select(
        `
        status,
        quote_items (
          subtotal
        )
      `,
      )
      .eq("user_id", userId);

    if (error) throw error;

    const stats = {
      total: quotes?.length || 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      shipped: 0, // <-- Añadido
      total_amount_accepted: 0,
    };

    quotes?.forEach((quote: any) => {
      if (quote.status === "pending") stats.pending++;
      if (quote.status === "accepted") stats.accepted++;
      if (quote.status === "rejected") stats.rejected++;
      if (quote.status === "shipped") stats.shipped++; // <-- Añadido

      // Asume que 'shipped' se cuenta como 'accepted' para el total de monto
      if (quote.status === "accepted" || quote.status === "shipped") {
        const items = quote.quote_items || [];
        stats.total_amount_accepted += items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
      }
    });

    return stats;
  }

  // Obtener cotizaciones por catálogo
  static async getQuotesByCatalog(catalogId: string, userId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("catalog_id", catalogId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Quote[];
  }
}
