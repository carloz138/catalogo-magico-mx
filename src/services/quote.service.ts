import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteItem, CreateQuoteDTO, QuoteStatus, FulfillmentStatus } from "@/types/digital-catalog";

export class QuoteService {
  /**
   * Crear cotización
   */
  static async createQuote(quoteData: CreateQuoteDTO & { replicated_catalog_id?: string }): Promise<Quote> {
    console.log("🔍 DEBUG - Usando Edge Function para crear cotización");
    const { data, error } = await supabase.functions.invoke("create-quote", { body: quoteData });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Error al crear cotización");

    return { id: data.quote_id } as unknown as Quote;
  }

  /**
   * Obtener lista de cotizaciones con estatus de pago y logística
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
        payment_status?: string;
        fulfillment_status?: string;
      }
    >
  > {
    const selectQuery = `
        *,
        quote_items (count),
        digital_catalogs (name, enable_distribution),
        payment_transactions (status)
    `;

    let ownQuery = supabase
      .from("quotes")
      .select(selectQuery)
      .eq("user_id", userId)
      .is("replicated_catalog_id", null)
      .order("created_at", { ascending: false });

    let replicatedQuery = supabase
      .from("quotes")
      .select(selectQuery)
      .eq("user_id", userId)
      .not("replicated_catalog_id", "is", null)
      .order("created_at", { ascending: false });

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

    const processQuotes = (quotes: any[], isReplicated: boolean) => {
      return quotes.map((quote) => ({
        ...quote,
        items_count: quote.quote_items?.[0]?.count || 0,
        has_replicated_catalog: false,
        is_from_replicated: isReplicated,
        catalog_name: quote.digital_catalogs?.name,
        payment_status: quote.payment_transactions?.[0]?.status || "unpaid",
        fulfillment_status: quote.fulfillment_status || "unfulfilled",
      }));
    };

    const ownQuotes = processQuotes(ownResult.data || [], false);
    const replicatedQuotes = processQuotes(replicatedResult.data || [], true);

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

    return quotesWithMetadata as any;
  }

  /**
   * Obtener detalle
   */
  static async getQuoteDetail(
    quoteId: string,
    userId: string,
  ): Promise<Quote & { items: QuoteItem[]; catalog: any; payment_transactions?: any[] }> {
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(
        `
        *,
        digital_catalogs (
          id, name, slug, enable_distribution, enable_quotation,
          enable_free_shipping, free_shipping_min_amount
        ),
        payment_transactions (
          id, status, amount_total, created_at
        )
      `,
      )
      .eq("id", quoteId)
      .eq("user_id", userId)
      .single();

    if (quoteError) throw quoteError;
    if (!quote) throw new Error("Cotización no encontrada");

    const { data: items } = await supabase
      .from("quote_items")
      .select(`*, products (name, sku, image_url)`)
      .eq("quote_id", quoteId)
      .order("created_at");

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
        if (item.variant_id) isInStock = variantStockMap.get(item.variant_id) || false;
        else if (item.product_id) isInStock = productStockMap.get(item.product_id) || false;
        return { ...item, is_in_stock: isInStock };
      });
    } else {
      enrichedItems = enrichedItems.map((item: any) => ({ ...item, is_in_stock: true }));
    }

    return {
      ...quote,
      items: enrichedItems,
      catalog: quote.digital_catalogs,
    } as any;
  }

  static async updateShippingAndNegotiate(
    quoteId: string,
    userId: string,
    shippingCost: number,
    newTotal: number,
    deliveryDate: string,
  ): Promise<Quote> {
    const { data, error } = await supabase
      .from("quotes")
      .update({
        shipping_cost: shippingCost,
        total_amount: newTotal,
        estimated_delivery_date: deliveryDate,
        status: "negotiation",
      })
      .eq("id", quoteId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.functions.invoke("send-quote-update", { body: { quoteId: quoteId } });
    } catch (e) {
      console.error("⚠️ Error invocando función (no bloqueante):", e);
    }

    return data as unknown as Quote;
  }

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

    return updatedQuote as unknown as Quote;
  }

  static async updateFulfillmentStatus(
    quoteId: string,
    userId: string,
    status: FulfillmentStatus,
    trackingData?: { code?: string; carrier?: string },
  ): Promise<void> {
    const updates: any = { fulfillment_status: status };
    if (trackingData) {
      if (trackingData.code) updates.tracking_code = trackingData.code;
      if (trackingData.carrier) updates.carrier_name = trackingData.carrier;
    }
    const { error } = await supabase.from("quotes").update(updates).eq("id", quoteId).eq("user_id", userId);
    if (error) throw error;
  }

  /**
   * ✅ AQUI ESTÁ EL MÉTODO RECUPERADO: Registrar pago manual
   */
  static async markAsPaidManually(quoteId: string, userId: string, amount: number): Promise<void> {
    // 1. Crear transacción manual
    const { error: txError } = await supabase.from("payment_transactions").insert({
      quote_id: quoteId,
      amount_total: amount,
      commission_saas: 0,
      net_to_merchant: amount,
      cost_gateway: 0,
      payment_method: "manual",
      status: "paid",
      paid_at: new Date().toISOString(),
    });
    if (txError) throw txError;

    // 2. Actualizar Cotización
    const { error: quoteError } = await supabase
      .from("quotes")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", quoteId)
      .eq("user_id", userId);
    if (quoteError) throw quoteError;

    // 3. Descontar Stock
    await supabase.rpc("process_inventory_deduction", { p_quote_id: quoteId });
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
    return (data || []) as unknown as Quote[];
  }
}
