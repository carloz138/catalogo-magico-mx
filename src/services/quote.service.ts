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
   * Llama a la Edge Function 'create-quote'.
   */
  static async createQuote(quoteData: CreateQuoteDTO & { replicated_catalog_id?: string }): Promise<Quote> {
    console.log("🔍 DEBUG - Usando Edge Function para crear cotización");

    const { data, error } = await supabase.functions.invoke("create-quote", {
      body: {
        catalog_id: quoteData.catalog_id,
        user_id: quoteData.user_id || null,
        replicated_catalog_id: quoteData.replicated_catalog_id || null,
        customer_name: quoteData.customer_name,
        customer_email: quoteData.customer_email,
        customer_company: quoteData.customer_company || null,
        customer_phone: quoteData.customer_phone || null,
        notes: quoteData.notes || null,
        delivery_method: quoteData.delivery_method,
        shipping_address: quoteData.shipping_address || null,
        items: quoteData.items,
      },
    });

    if (error) {
      console.error("❌ Error al invocar Edge Function:", error);
      throw error;
    }

    if (!data.success) {
      console.error("❌ Edge Function respondió con error:", data.error);
      throw new Error(data.error || "Error al crear cotización");
    }

    console.log("✅ Cotización creada exitosamente:", data.quote_id);

    return { id: data.quote_id } as unknown as Quote;
  }

  /**
   * Obtener lista de cotizaciones del usuario.
   */
  static async getUserQuotes(
    userId: string,
    filters?: {
      catalog_id?: string;
      status?: QuoteStatus;
      date_from?: string;
      date_to?: string;
      customer_search?: string;
    },
  ): Promise<
    Array<
      Quote & {
        items_count: number;
        total_amount: number;
        has_replicated_catalog: boolean;
        is_from_replicated: boolean;
        catalog_name?: string;
      }
    >
  > {
    // 1. Cotizaciones Propias (L1)
    let ownQuery = supabase
      .from("quotes")
      .select(
        `
        *,
        quote_items (count),
        digital_catalogs (name, enable_distribution)
      `,
      )
      .eq("user_id", userId)
      .is("replicated_catalog_id", null)
      .order("created_at", { ascending: false });

    // 2. Cotizaciones de Revendedor (L2)
    let replicatedQuery = supabase
      .from("quotes")
      .select(
        `
        *,
        quote_items (count),
        digital_catalogs (name, enable_distribution)
      `,
      )
      .eq("user_id", userId)
      .not("replicated_catalog_id", "is", null)
      .order("created_at", { ascending: false });

    // Filtros...
    if (filters?.catalog_id) {
      ownQuery = ownQuery.eq("catalog_id", filters.catalog_id);
      replicatedQuery = replicatedQuery.eq("catalog_id", filters.catalog_id);
    }
    if (filters?.status) {
      ownQuery = ownQuery.eq("status", filters.status);
      replicatedQuery = replicatedQuery.eq("status", filters.status);
    }
    if (filters?.date_from) {
      ownQuery = ownQuery.gte("created_at", filters.date_from);
      replicatedQuery = replicatedQuery.gte("created_at", filters.date_from);
    }
    if (filters?.date_to) {
      ownQuery = ownQuery.lte("created_at", filters.date_to);
      replicatedQuery = replicatedQuery.lte("created_at", filters.date_to);
    }
    if (filters?.customer_search) {
      const searchFilter = `customer_name.ilike.%${filters.customer_search}%,customer_email.ilike.%${filters.customer_search}%,customer_company.ilike.%${filters.customer_search}%`;
      ownQuery = ownQuery.or(searchFilter);
      replicatedQuery = replicatedQuery.or(searchFilter);
    }

    const [ownResult, replicatedResult] = await Promise.all([ownQuery, replicatedQuery]);

    if (ownResult.error) throw ownResult.error;
    if (replicatedResult.error) throw replicatedResult.error;

    // Procesar resultados
    const ownQuotes = (ownResult.data || []).map((quote: any) => ({
      ...quote,
      items_count: quote.quote_items?.[0]?.count || 0,
      has_replicated_catalog: false,
      is_from_replicated: false,
      catalog_name: quote.digital_catalogs?.name,
    }));

    const replicatedQuotes = (replicatedResult.data || []).map((quote: any) => ({
      ...quote,
      items_count: quote.quote_items?.[0]?.count || 0,
      has_replicated_catalog: false,
      is_from_replicated: true,
      catalog_name: quote.digital_catalogs?.name,
    }));

    const allQuotes = [...ownQuotes, ...replicatedQuotes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const quotesWithMetadata = await Promise.all(
      allQuotes.map(async (quote) => {
        if (quote.is_from_replicated) return quote;

        const { data: replicatedCatalog } = await supabase
          .from("replicated_catalogs")
          .select("id")
          .eq("quote_id", quote.id)
          .eq("is_active", true)
          .single();

        return {
          ...quote,
          has_replicated_catalog: !!replicatedCatalog,
        };
      }),
    );

    // Casting seguro para el array de retorno
    return quotesWithMetadata as unknown as Array<
      Quote & {
        items_count: number;
        total_amount: number;
        has_replicated_catalog: boolean;
        is_from_replicated: boolean;
        catalog_name?: string;
      }
    >;
  }

  /**
   * Obtener detalle completo de cotización
   */
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

    // Obtener items con productos
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

    // Enriquecer items
    let enrichedItems = items || [];

    if (quote.replicated_catalog_id) {
      const replicatedCatalogId = quote.replicated_catalog_id;

      const { data: productPrices } = await supabase
        .from("reseller_product_prices")
        .select("product_id, is_in_stock")
        .eq("replicated_catalog_id", replicatedCatalogId);

      const { data: variantPrices } = await supabase
        .from("reseller_variant_prices")
        .select("variant_id, is_in_stock")
        .eq("replicated_catalog_id", replicatedCatalogId);

      const productStockMap = new Map((productPrices || []).map((p) => [p.product_id, p.is_in_stock]));
      const variantStockMap = new Map((variantPrices || []).map((v) => [v.variant_id, v.is_in_stock]));

      enrichedItems = enrichedItems.map((item: any) => {
        let isInStock = false;
        if (item.variant_id) {
          isInStock = variantStockMap.get(item.variant_id) || false;
        } else if (item.product_id) {
          isInStock = productStockMap.get(item.product_id) || false;
        }
        return { ...item, is_in_stock: isInStock };
      });
    } else {
      enrichedItems = enrichedItems.map((item: any) => ({
        ...item,
        is_in_stock: true,
      }));
    }

    // 🔴 SOLUCIÓN 1: Casting explícito aquí
    return {
      ...quote,
      items: enrichedItems,
      catalog: quote.digital_catalogs,
    } as unknown as Quote & { items: QuoteItem[]; catalog: any };
  }

  /**
/**
   * ✅ ACTUALIZADO: Actualizar costo, FECHA y pasar a negociación.
   * Además dispara el email de "send-quote-update".
   */
  static async updateShippingAndNegotiate(
    quoteId: string,
    userId: string,
    shippingCost: number, // en centavos
    newTotal: number, // en centavos
    deliveryDate: string, // YYYY-MM-DD
  ): Promise<Quote> {
    console.log("🚀 Iniciando negociación...");

    // 1. Actualizar Base de Datos
    const { data, error } = await supabase
      .from("quotes")
      .update({
        shipping_cost: shippingCost,
        total_amount: newTotal,
        estimated_delivery_date: deliveryDate, // Guardamos la fecha
        status: "negotiation",
      })
      .eq("id", quoteId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    // 2. Disparar Edge Function de Notificación
    try {
      console.log("📧 Invocando send-quote-update...");
      const { error: funcError } = await supabase.functions.invoke("send-quote-update", {
        body: { quoteId: quoteId },
      });

      if (funcError) console.error("❌ Error al enviar email de actualización:", funcError);
      else console.log("✅ Email de actualización enviado.");
    } catch (e) {
      console.error("⚠️ Error invocando función (no bloqueante):", e);
    }

    return data as unknown as Quote;
  }
  /**
   * Actualizar estado general.
   */
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

    if (status === "accepted") {
      try {
        const { data: quote } = await supabase
          .from("quotes")
          .select("customer_email, customer_name")
          .eq("id", quoteId)
          .single();

        if (quote) {
          await supabase.functions.invoke("send-quote-accepted-email", {
            body: {
              quoteId,
              customerEmail: quote.customer_email,
              customerName: quote.customer_name,
            },
          });
        }
      } catch (notificationError) {
        console.error("❌ Error enviando email:", notificationError);
      }
    }

    // 🔴 SOLUCIÓN 3: Casting porque faltan los items en el objeto de retorno
    return updatedQuote as unknown as Quote;
  }

  static async getQuoteStats(userId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    total_amount_accepted: number;
    shipped: number;
  }> {
    const { data: quotes, error } = await supabase.from("quotes").select("status, total_amount").eq("user_id", userId);

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
        stats.total_amount_accepted += quote.total_amount || 0;
      }
    });

    return stats;
  }

  static async getQuotesByCatalog(catalogId: string, userId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("catalog_id", catalogId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🔴 SOLUCIÓN 4: Casting para el array
    return (data || []) as unknown as Quote[];
  }
}
