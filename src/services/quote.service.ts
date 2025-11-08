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
  static async createQuote(quoteData: CreateQuoteDTO & { replicated_catalog_id?: string }): Promise<Quote> {
    // Create quote directly in database
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        catalog_id: quoteData.catalog_id,
        user_id: quoteData.user_id,
        customer_name: quoteData.customer_name,
        customer_email: quoteData.customer_email,
        customer_phone: quoteData.customer_phone,
        customer_company: quoteData.customer_company,
        notes: quoteData.notes,
        delivery_method: quoteData.delivery_method,
        shipping_address: quoteData.shipping_address,
        replicated_catalog_id: quoteData.replicated_catalog_id || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      throw error;
    }

      // Create quote items
    if (quoteData.items && quoteData.items.length > 0) {
      const items = quoteData.items.map(item => ({
        quote_id: quote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
        product_image_url: item.product_image_url,
        variant_description: item.variant_description,
        price_type: item.price_type
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(items);

      if (itemsError) {
        console.error('Error creating quote items:', itemsError);
        // Rollback quote if items fail
        await supabase.from('quotes').delete().eq('id', quote.id);
        throw itemsError;
      }
    }

    return quote as Quote;
  }

  static async getUserQuotes(
    userId: string,
    filters?: {
      catalog_id?: string;
      status?: QuoteStatus;
      date_from?: string;
      date_to?: string;
      customer_search?: string;
    },
  ): Promise<Array<Quote & { items_count: number; total_amount: number; has_replicated_catalog: boolean; is_from_replicated: boolean }>> {
    // Get quotes owned by the user (from their original catalogs)
    let ownQuery = supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          *,
          products (name, sku, image_url)
        ),
        digital_catalogs (name, enable_distribution)
      `)
      .eq('user_id', userId)
      .is('replicated_catalog_id', null)
      .order('created_at', { ascending: false });

    // Get quotes from replicated catalogs where user is the reseller
    let replicatedQuery = supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          *,
          products (name, sku, image_url)
        ),
        digital_catalogs (name, enable_distribution)
      `)
      .eq('user_id', userId)
      .not('replicated_catalog_id', 'is', null)
      .order('created_at', { ascending: false });

    // Apply filters to both queries
    if (filters?.catalog_id) {
      ownQuery = ownQuery.eq('catalog_id', filters.catalog_id);
      replicatedQuery = replicatedQuery.eq('catalog_id', filters.catalog_id);
    }
    if (filters?.status) {
      ownQuery = ownQuery.eq('status', filters.status);
      replicatedQuery = replicatedQuery.eq('status', filters.status);
    }
    if (filters?.date_from) {
      ownQuery = ownQuery.gte('created_at', filters.date_from);
      replicatedQuery = replicatedQuery.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      ownQuery = ownQuery.lte('created_at', filters.date_to);
      replicatedQuery = replicatedQuery.lte('created_at', filters.date_to);
    }
    if (filters?.customer_search) {
      const searchFilter = `customer_name.ilike.%${filters.customer_search}%,customer_email.ilike.%${filters.customer_search}%,customer_company.ilike.%${filters.customer_search}%`;
      ownQuery = ownQuery.or(searchFilter);
      replicatedQuery = replicatedQuery.or(searchFilter);
    }

    const [ownResult, replicatedResult] = await Promise.all([
      ownQuery,
      replicatedQuery
    ]);

    if (ownResult.error) throw ownResult.error;
    if (replicatedResult.error) throw replicatedResult.error;

    // Process own quotes
    const ownQuotes = (ownResult.data || []).map((quote: any) => {
      const items = quote.quote_items || [];
      const { quote_items, digital_catalogs, ...quoteData } = quote;
      return {
        ...quoteData,
        items_count: items.length,
        total_amount: items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0),
        has_replicated_catalog: false,
        is_from_replicated: false,
        catalog_name: digital_catalogs?.name
      };
    });

    // Process replicated quotes
    const replicatedQuotes = (replicatedResult.data || []).map((quote: any) => {
      const items = quote.quote_items || [];
      const { quote_items, digital_catalogs, ...quoteData } = quote;
      return {
        ...quoteData,
        items_count: items.length,
        total_amount: items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0),
        has_replicated_catalog: false,
        is_from_replicated: true,
        catalog_name: digital_catalogs?.name
      };
    });

    // Combine and sort by created_at
    const allQuotes = [...ownQuotes, ...replicatedQuotes].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Check for replicated catalogs for own quotes
    const quotesWithMetadata = await Promise.all(
      allQuotes.map(async (quote) => {
        if (quote.is_from_replicated) {
          return quote; // Already marked
        }
        
        const { data: replicatedCatalog } = await supabase
          .from('replicated_catalogs')
          .select('id')
          .eq('quote_id', quote.id)
          .eq('is_active', true)
          .single();

        return {
          ...quote,
          has_replicated_catalog: !!replicatedCatalog
        };
      })
    );

    return quotesWithMetadata;
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

    // ✅ Si la cotización es de un catálogo replicado, enriquecer items con info de stock
    let enrichedItems = items || [];
    
    if (quote.replicated_catalog_id) {
      const replicatedCatalogId = quote.replicated_catalog_id;

      // Obtener información de stock de productos y variantes
      const { data: productPrices } = await supabase
        .from("reseller_product_prices")
        .select("product_id, is_in_stock")
        .eq("replicated_catalog_id", replicatedCatalogId);

      const { data: variantPrices } = await supabase
        .from("reseller_variant_prices")
        .select("variant_id, is_in_stock")
        .eq("replicated_catalog_id", replicatedCatalogId);

      // Crear mapas para búsqueda rápida
      const productStockMap = new Map(
        (productPrices || []).map((p) => [p.product_id, p.is_in_stock])
      );
      const variantStockMap = new Map(
        (variantPrices || []).map((v) => [v.variant_id, v.is_in_stock])
      );

      // Enriquecer items con información de stock
      enrichedItems = enrichedItems.map((item: any) => {
        let isInStock = false;

        if (item.variant_id) {
          // Si tiene variante, buscar en variant_prices
          isInStock = variantStockMap.get(item.variant_id) || false;
        } else if (item.product_id) {
          // Si no tiene variante, buscar en product_prices
          isInStock = productStockMap.get(item.product_id) || false;
        }

        return {
          ...item,
          is_in_stock: isInStock,
        };
      });
    } else {
      // Si no es catálogo replicado, todos están "en stock" por defecto
      enrichedItems = enrichedItems.map((item: any) => ({
        ...item,
        is_in_stock: true,
      }));
    }

    return {
      ...quote,
      items: enrichedItems,
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
