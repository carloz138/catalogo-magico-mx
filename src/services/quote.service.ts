import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteItem, CreateQuoteDTO, QuoteStatus } from "@/types/digital-catalog";

export class QuoteService {
  // Crear cotización (desde vista pública - cliente anónimo)
  static async createQuote(quoteData: CreateQuoteDTO): Promise<Quote> {
    // 1. Obtener user_id del catálogo
    const { data: catalog, error: catalogError } = await supabase
      .from("digital_catalogs")
      .select("user_id")
      .eq("id", quoteData.catalog_id)
      .single();

    if (catalogError) throw catalogError;
    if (!catalog) throw new Error("Catálogo no encontrado");

    // 2. Crear cotización
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        catalog_id: quoteData.catalog_id,
        user_id: catalog.user_id,
        customer_name: quoteData.customer_name,
        customer_email: quoteData.customer_email,
        customer_company: quoteData.customer_company || null,
        customer_phone: quoteData.customer_phone || null,
        notes: quoteData.notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (quoteError) throw quoteError;
    if (!quote) throw new Error("Error al crear cotización");

    // 3. Crear items de la cotización
    const quoteItems = quoteData.items.map((item) => ({
      quote_id: quote.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      product_image_url: item.product_image_url,
      quantity: item.quantity,
      unit_price: item.unit_price,
      price_type: item.price_type,
      subtotal: item.quantity * item.unit_price,
      variant_id: item.variant_id || null,
      variant_description: item.variant_description || null,
    }));

    const { error: itemsError } = await supabase.from("quote_items").insert(quoteItems);

    if (itemsError) throw itemsError;

    // 4. Enviar notificación por email/WhatsApp
    try {
      await supabase.functions.invoke("send-quote-notification", {
        body: { quoteId: quote.id },
      });
    } catch (notificationError) {
      // No bloqueamos la cotización si falla la notificación
      console.error("Error enviando notificación:", notificationError);
    }

    return quote as Quote;
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

      // Eliminar quote_items del objeto final
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
    // Obtener cotización
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
  static async updateQuoteStatus(quoteId: string, userId: string, status: QuoteStatus): Promise<Quote> {
    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", quoteId)
      .eq("user_id", userId)
      .select() // Asegúrate de seleccionar los datos necesarios para la notificación
      .single();

    if (error) throw error;
    if (!updatedQuote) throw new Error("No se pudo actualizar la cotización");

    // --- INICIO CÓDIGO AÑADIDO ---
    // Enviar notificación al cliente SOLO si la actualización fue exitosa
    if (updatedQuote) {
      try {
        console.log(`Intentando invocar send-quote-notification para quote ${quoteId} con status ${status}`);
        // Asegúrate de que tu Edge Function 'send-quote-notification'
        // esté diseñada para manejar estos datos en el body.
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          "send-quote-notification",
          {
            body: {
              quoteId: updatedQuote.id,
              newStatus: status, // 'accepted' or 'rejected'
              customerEmail: updatedQuote.customer_email, // Necesitas el email del cliente
              customerName: updatedQuote.customer_name, // Y su nombre para personalizar
              activationLink: activationLink || null, //
              // Puedes añadir más datos si tu función los necesita,
              // por ejemplo, el nombre del catálogo o un link directo.
            },
          },
        );

        if (functionError) {
          // No lanzar un error fatal, pero sí registrarlo
          console.error("Error al invocar la función de notificación:", functionError);
        } else {
          console.log("Función de notificación invocada con éxito:", functionData);
        }
      } catch (notificationError) {
        // Captura cualquier otro error durante la invocación
        console.error("Error inesperado al intentar notificar:", notificationError);
      }
    }
    // --- FIN CÓDIGO AÑADIDO ---

    return updatedQuote as Quote;
  }

  // Obtener estadísticas de cotizaciones
  static async getQuoteStats(userId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    total_amount_accepted: number;
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
      total_amount_accepted: 0,
    };

    quotes?.forEach((quote: any) => {
      if (quote.status === "pending") stats.pending++;
      if (quote.status === "accepted") stats.accepted++;
      if (quote.status === "rejected") stats.rejected++;

      if (quote.status === "accepted") {
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
