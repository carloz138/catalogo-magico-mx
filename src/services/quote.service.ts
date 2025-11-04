import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteItem, CreateQuoteDTO, QuoteStatus } from "@/types/digital-catalog";

interface CreateQuoteResponse {
  success: boolean;
  quoteId?: string;
  error?: string;
}

export class QuoteService {
  /**
   * Crear cotización (desde vista pública - cliente anónimo).
   */
  static async createQuote(quoteData: CreateQuoteDTO): Promise<Quote> {
    console.log("Invocando Edge Function 'create-anonymous-quote'...");

    const { data, error } = await supabase.functions.invoke<CreateQuoteResponse>("create-anonymous-quote", {
      body: quoteData,
    });

    if (error) {
      console.error("Error al invocar Edge Function:", error);
      const message =
        (error as any).context?.message || error.message || "Error al contactar el servidor de cotizaciones.";
      throw new Error(message);
    }

    if (data.error) {
      console.error("Error devuelto por la Edge Function:", data.error);
      throw new Error(`Error en el servidor: ${data.error}`);
    }

    if (!data.success || !data.quoteId) {
      console.error("La función no devolvió una respuesta exitosa:", data);
      throw new Error("La función no devolvió una respuesta exitosa.");
    }

    console.log(`Cotización creada exitosamente por Edge Function con ID: ${data.quoteId}`);

    const partialQuote: Quote = {
      id: data.quoteId,
      catalog_id: quoteData.catalog_id,
      user_id: "",
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

    return partialQuote as Quote;
  }

  // ✅ MODIFICADO: Obtener cotizaciones del usuario CON productos completos
  static async getUserQuotes(
    userId: string,
    filters?: {
      catalog_id?: string;
      status?: QuoteStatus;
      date_from?: string;
      date_to?: string;
      customer_search?: string;
    },
  ): Promise<Array<Quote & { items_count: number; total_amount: number; has_replicated_catalog: boolean }>> {
    let query = supabase
      .from("quotes")
      .select(
        `
        *,
        quote_items (
          *,
          products (
            name,
            sku,
            image_url
          )
        ),
        digital_catalogs (
          name,
          enable_distribution
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

    // ✅ NUEVO: Verificar catálogos replicados para cada cotización
    const quoteIds = data?.map((q: any) => q.id) || [];
    const { data: replicatedCatalogs } = await supabase
      .from("replicated_catalogs")
      .select("quote_id, is_active")
      .in("quote_id", quoteIds);

    const replicatedCatalogMap = new Map(replicatedCatalogs?.map((rc: any) => [rc.quote_id, rc]) || []);

    // Calcular totales y agregar info de catálogo replicado
    return (data || []).map((quote: any) => {
      const items = quote.quote_items || [];
      const total_amount = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
      const items_count = items.length;
      const replicaCatalog = replicatedCatalogMap.get(quote.id);

      const { quote_items, digital_catalogs, ...quoteData } = quote;

      return {
        ...quoteData,
        items_count,
        total_amount,
        has_replicated_catalog: !!replicaCatalog,
        catalog_activated: replicaCatalog?.is_active || false,
        catalog_name: digital_catalogs?.name,
      } as Quote & {
        items_count: number;
        total_amount: number;
        has_replicated_catalog: boolean;
        catalog_activated: boolean;
        catalog_name: string;
      };
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

    // Obtener items con productos completos
    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select(
        `
        *,
        products (
          name,
          sku,
          image_url
        )
      `,
      )
      .eq("quote_id", quoteId)
      .order("created_at");

    if (itemsError) throw itemsError;

    return {
      ...quote,
      items: items || [],
      catalog: quote.digital_catalogs,
    } as Quote & { items: QuoteItem[]; catalog: any };
  }

  // ✅ MODIFICADO: Actualizar estado y enviar email correcto
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

    // ✅ CAMBIO CRÍTICO: Enviar email de ACEPTACIÓN (no notificación genérica)
    if (status === "accepted") {
      try {
        console.log(`📧 Enviando email de cotización aceptada: ${quoteId}`);

        // Obtener datos del cliente para el email
        const { data: quote } = await supabase
          .from("quotes")
          .select("customer_email, customer_name")
          .eq("id", quoteId)
          .single();

        if (quote) {
          const { data: functionData, error: functionError } = await supabase.functions.invoke(
            "send-quote-accepted-email", // ✅ NUEVA FUNCIÓN
            {
              body: {
                quoteId,
                customerEmail: quote.customer_email,
                customerName: quote.customer_name,
              },
            },
          );

          if (functionError) {
            console.error("❌ Error al invocar la función de email:", functionError);
          } else {
            console.log("✅ Email enviado exitosamente:", functionData);
          }
        }
      } catch (notificationError) {
        console.error("❌ Error inesperado al intentar enviar email:", notificationError);
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
    shipped: number;
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
      shipped: 0,
      total_amount_accepted: 0,
    };

    quotes?.forEach((quote: any) => {
      if (quote.status === "pending") stats.pending++;
      if (quote.status === "accepted") stats.accepted++;
      if (quote.status === "rejected") stats.rejected++;
      if (quote.status === "shipped") stats.shipped++;

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
