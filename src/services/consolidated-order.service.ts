import { supabase } from "@/integrations/supabase/client";
import {
  ConsolidatedOrder,
  ConsolidatedOrderItem,
  ConsolidatedOrderWithDetails,
  ConsolidatedOrderItemInput,
  CreateDraftResponse,
  SendConsolidatedOrderDTO,
  ProductAggregation,
  ConsolidatedOrderStatus,
} from "@/types/consolidated-order";

export class ConsolidatedOrderService {
  /**
   * Obtener o crear borrador para un proveedor específico
   * Si ya existe un borrador activo, lo retorna
   * Si no existe, lo crea y lo sincroniza con cotizaciones aceptadas
   */
  static async getOrCreateDraft(
    distributorId: string,
    supplierId: string,
    originalCatalogId: string,
    replicatedCatalogId: string,
  ): Promise<CreateDraftResponse> {
    console.log("📦 getOrCreateDraft:", { distributorId, supplierId });

    try {
      // 1. Buscar borrador existente
      const { data: existingDraft, error: searchError } = await supabase
        .from("consolidated_orders")
        .select(
          `
          *,
          consolidated_order_items (*)
        `,
        )
        .eq("distributor_id", distributorId)
        .eq("supplier_id", supplierId)
        .eq("status", "draft")
        .maybeSingle();

      if (searchError) throw searchError;

      // Si ya existe un borrador, retornarlo
      if (existingDraft) {
        console.log("✅ Borrador existente encontrado:", existingDraft.id);
        return {
          consolidated_order: existingDraft as ConsolidatedOrder,
          is_new: false,
          items: (existingDraft.consolidated_order_items || []) as ConsolidatedOrderItem[],
        };
      }

      // 2. Crear nuevo borrador
      const { data: newDraft, error: createError } = await supabase
        .from("consolidated_orders")
        .insert({
          distributor_id: distributorId,
          supplier_id: supplierId,
          original_catalog_id: originalCatalogId,
          replicated_catalog_id: replicatedCatalogId,
          status: "draft",
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!newDraft) throw new Error("No se pudo crear el borrador");

      console.log("✅ Nuevo borrador creado:", newDraft.id);

      // 3. Sincronizar con cotizaciones aceptadas (usar replicatedCatalogId, no originalCatalogId)
      await this.syncDraftWithQuotes(newDraft.id, distributorId, replicatedCatalogId);

      // 4. Obtener items creados
      const { data: items, error: itemsError } = await supabase
        .from("consolidated_order_items")
        .select("*")
        .eq("consolidated_order_id", newDraft.id);

      if (itemsError) throw itemsError;

      return {
        consolidated_order: newDraft as ConsolidatedOrder,
        is_new: true,
        items: (items || []) as ConsolidatedOrderItem[],
      };
    } catch (error) {
      console.error("❌ Error en getOrCreateDraft:", error);
      throw error;
    }
  }

  /**
   * Sincronizar borrador con cotizaciones aceptadas
   * Agrupa productos de todas las cotizaciones aceptadas del mismo catálogo replicado
   * ACTUALIZADO: Soporta Super Tiendas buscando por origin_replicated_catalog_id en los items
   */
  static async syncDraftWithQuotes(
    consolidatedOrderId: string,
    distributorId: string,
    replicatedCatalogId: string,
  ): Promise<void> {
    console.log("🔄 Sincronizando borrador con cotizaciones...", {
      consolidatedOrderId,
      distributorId,
      replicatedCatalogId,
    });

    try {
      // 1. Obtener Items de cotizaciones aceptadas que pertenezcan a este catálogo replicado
      // FIX: Buscamos en quote_items para soportar pedidos híbridos (Super Tienda)
      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select(
          `
            product_id,
            variant_id,
            product_name,
            product_sku,
            variant_description,
            product_image_url,
            quantity,
            unit_price,
            quotes!inner (
                id,
                status,
                user_id
            )
        `,
        )
        .eq("origin_replicated_catalog_id", replicatedCatalogId) // 👈 Clave para detectar origen Super Tienda
        .eq("quotes.status", "accepted")
        .eq("quotes.user_id", distributorId); // Cotizaciones que L2 recibió de sus clientes

      if (itemsError) throw itemsError;

      console.log(`📊 Encontrados ${items?.length || 0} items pendientes de procesar`);

      if (!items || items.length === 0) {
        console.log("⚠️ No hay items aceptados para sincronizar");
        return;
      }

      // Transformamos los items planos a la estructura que espera aggregateProducts
      // (Simulamos una estructura de 'quotes' para reutilizar tu lógica de agregación)
      const quotesFormat = items.map((item) => ({
        id: (item.quotes as any).id,
        quote_items: [
          {
            ...item,
            quantity: Number(item.quantity), // Asegurar numérico
          },
        ],
      }));

      // 2. Agrupar productos (sumar cantidades de items duplicados)
      const aggregatedProducts = this.aggregateProducts(quotesFormat);

      console.log(`📦 Productos agrupados: ${aggregatedProducts.length}`);

      // 3. Obtener items actuales del borrador
      const { data: currentItems } = await supabase
        .from("consolidated_order_items")
        .select("product_id, variant_id")
        .eq("consolidated_order_id", consolidatedOrderId);

      const currentItemsSet = new Set(
        (currentItems || []).map((item) => `${item.product_id}-${item.variant_id || "null"}`),
      );

      // 4. Insertar solo items nuevos (que no existen ya en el borrador)
      const newItems = aggregatedProducts
        .filter((product) => {
          const key = `${product.product_id}-${product.variant_id || "null"}`;
          return !currentItemsSet.has(key);
        })
        .map((product) => ({
          consolidated_order_id: consolidatedOrderId,
          product_id: product.product_id,
          variant_id: product.variant_id,
          product_name: product.product_name,
          product_sku: product.product_sku,
          variant_description: product.variant_description,
          product_image_url: product.product_image_url,
          quantity: product.total_quantity,
          unit_price: product.unit_price,
          subtotal: product.total_quantity * product.unit_price,
          source_quote_ids: product.source_quote_ids,
        }));

      if (newItems.length > 0) {
        const { error: insertError } = await supabase.from("consolidated_order_items").insert(newItems);

        if (insertError) throw insertError;

        console.log(`✅ ${newItems.length} nuevos items agregados al borrador`);
      } else {
        console.log("ℹ️ No hay nuevos items para agregar");
      }
    } catch (error) {
      console.error("❌ Error en syncDraftWithQuotes:", error);
      throw error;
    }
  }

  /**
   * Agrupar productos de múltiples cotizaciones
   * Suma cantidades de productos duplicados (respetando variantes)
   */
  private static aggregateProducts(quotes: any[]): ProductAggregation[] {
    const aggregationMap = new Map<string, ProductAggregation>();

    quotes.forEach((quote) => {
      const items = quote.quote_items || [];

      items.forEach((item: any) => {
        // Crear key única: product_id + variant_id (para agrupar correctamente variantes)
        const key = `${item.product_id}-${item.variant_id || "null"}`;

        if (aggregationMap.has(key)) {
          // Producto/variante ya existe, sumar cantidad
          const existing = aggregationMap.get(key)!;
          existing.total_quantity += item.quantity;
          if (!existing.source_quote_ids.includes(quote.id)) {
            existing.source_quote_ids.push(quote.id);
          }
          // Actualizar imagen si no la tenía
          if (!existing.product_image_url && item.product_image_url) {
            existing.product_image_url = item.product_image_url;
          }
        } else {
          // Producto/variante nuevo
          aggregationMap.set(key, {
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            variant_description: item.variant_description,
            product_image_url: item.product_image_url || null,
            total_quantity: item.quantity,
            unit_price: item.unit_price,
            source_quote_ids: [quote.id],
          });
        }
      });
    });

    return Array.from(aggregationMap.values());
  }

  /**
   * Obtener borrador activo para un proveedor
   */
  static async getDraftForSupplier(
    distributorId: string,
    supplierId: string,
  ): Promise<ConsolidatedOrderWithDetails | null> {
    try {
      // 1. Obtener el borrador con catálogo
      const { data, error } = await supabase
        .from("consolidated_orders")
        .select(
          `
          *,
          consolidated_order_items (*)
        `,
        ) // Corrección en la referencia de la relación si fuera necesaria, aquí la dejé simple como estaba
        // Nota: Asegúrate que la relación en Supabase sea correcta. Si falla, usa digital_catalogs!fk...
        .select(
          `
            *,
            consolidated_order_items (*),
            digital_catalogs!consolidated_orders_original_catalog_id_fkey (
                name,
                user_id
            )
        `,
        )
        .eq("distributor_id", distributorId)
        .eq("supplier_id", supplierId)
        .eq("status", "draft")
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // 2. Obtener info del proveedor desde business_info
      const { data: businessInfo } = await supabase
        .from("business_info")
        .select("business_name")
        .eq("user_id", supplierId)
        .maybeSingle();

      // Calcular totales
      const items = (data.consolidated_order_items || []) as ConsolidatedOrderItem[];
      const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const source_quotes_count = new Set(items.flatMap((item) => item.source_quote_ids)).size;

      const catalog = data.digital_catalogs as any;

      return {
        ...data,
        items,
        items_count: items.length,
        total_amount,
        supplier_name: businessInfo?.business_name || "Proveedor",
        supplier_business_name: businessInfo?.business_name,
        catalog_name: catalog?.name || "Catálogo",
        source_quotes_count,
      } as ConsolidatedOrderWithDetails;
    } catch (error) {
      console.error("❌ Error en getDraftForSupplier:", error);
      throw error;
    }
  }

  /**
   * Listar todos los consolidados de un distribuidor
   */
  static async getConsolidatedOrders(
    distributorId: string,
    filters?: {
      status?: ConsolidatedOrderStatus;
      supplier_id?: string;
    },
  ): Promise<ConsolidatedOrderWithDetails[]> {
    console.log("📋 getConsolidatedOrders called with:", { distributorId, filters });

    try {
      // 1. Obtener los pedidos consolidados con catálogos
      let query = supabase
        .from("consolidated_orders")
        .select(
          `
          *,
          consolidated_order_items (*),
          digital_catalogs!consolidated_orders_original_catalog_id_fkey (
            name,
            user_id
          )
        `,
        )
        .eq("distributor_id", distributorId)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.supplier_id) {
        query = query.eq("supplier_id", filters.supplier_id);
      }

      const { data, error } = await query;

      console.log("📋 getConsolidatedOrders result:", { count: data?.length || 0, error, data });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // 2. Obtener IDs únicos de proveedores
      const supplierIds = [...new Set(data.map((order: any) => order.supplier_id))];

      // 3. Obtener info de todos los proveedores en una sola query
      const { data: businessInfos } = await supabase
        .from("business_info")
        .select("user_id, business_name")
        .in("user_id", supplierIds);

      // Crear mapa para búsqueda rápida
      const businessInfoMap = new Map((businessInfos || []).map((info) => [info.user_id, info]));

      return data.map((order: any) => {
        const items = (order.consolidated_order_items || []) as ConsolidatedOrderItem[];
        const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
        const source_quotes_count = new Set(items.flatMap((item) => item.source_quote_ids || [])).size;

        const catalog = order.digital_catalogs;
        const supplierInfo = businessInfoMap.get(order.supplier_id);

        return {
          ...order,
          items,
          items_count: items.length,
          total_amount,
          supplier_name: supplierInfo?.business_name || "Proveedor",
          supplier_business_name: supplierInfo?.business_name,
          catalog_name: catalog?.name || "Catálogo",
          source_quotes_count,
        } as ConsolidatedOrderWithDetails;
      });
    } catch (error) {
      console.error("❌ Error en getConsolidatedOrders:", error);
      throw error;
    }
  }

  /**
   * Actualizar cantidad de un item
   */
  static async updateItemQuantity(
    itemId: string,
    quantity: number,
    distributorId: string,
  ): Promise<ConsolidatedOrderItem> {
    if (quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    try {
      // Obtener el item para calcular nuevo subtotal
      const { data: item, error: getError } = await supabase
        .from("consolidated_order_items")
        .select(
          `
          *,
          consolidated_orders!inner (distributor_id, status)
        `,
        )
        .eq("id", itemId)
        .single();

      if (getError) throw getError;
      if (!item) throw new Error("Item no encontrado");

      // Verificar permisos y que sea borrador
      const order = (item as any).consolidated_orders;
      if (order.distributor_id !== distributorId) {
        throw new Error("No tienes permiso para modificar este item");
      }
      if (order.status !== "draft") {
        throw new Error("Solo se pueden modificar borradores");
      }

      // Actualizar
      const newSubtotal = quantity * item.unit_price;

      const { data: updated, error: updateError } = await supabase
        .from("consolidated_order_items")
        .update({
          quantity,
          subtotal: newSubtotal,
        })
        .eq("id", itemId)
        .select()
        .single();

      if (updateError) throw updateError;

      return updated as ConsolidatedOrderItem;
    } catch (error) {
      console.error("❌ Error en updateItemQuantity:", error);
      throw error;
    }
  }

  /**
   * Eliminar un item del consolidado
   */
  static async removeItem(itemId: string, distributorId: string): Promise<void> {
    try {
      // Verificar permisos
      const { data: item, error: getError } = await supabase
        .from("consolidated_order_items")
        .select(
          `
          *,
          consolidated_orders!inner (distributor_id, status)
        `,
        )
        .eq("id", itemId)
        .single();

      if (getError) throw getError;
      if (!item) throw new Error("Item no encontrado");

      const order = (item as any).consolidated_orders;
      if (order.distributor_id !== distributorId) {
        throw new Error("No tienes permiso para eliminar este item");
      }
      if (order.status !== "draft") {
        throw new Error("Solo se pueden modificar borradores");
      }

      // Eliminar
      const { error: deleteError } = await supabase.from("consolidated_order_items").delete().eq("id", itemId);

      if (deleteError) throw deleteError;

      console.log("✅ Item eliminado:", itemId);
    } catch (error) {
      console.error("❌ Error en removeItem:", error);
      throw error;
    }
  }

  /**
   * Agregar producto manualmente al consolidado
   */
  static async addProduct(
    consolidatedOrderId: string,
    productData: ConsolidatedOrderItemInput,
    distributorId: string,
  ): Promise<ConsolidatedOrderItem> {
    try {
      // Verificar permisos
      const { data: order, error: getError } = await supabase
        .from("consolidated_orders")
        .select("distributor_id, status")
        .eq("id", consolidatedOrderId)
        .single();

      if (getError) throw getError;
      if (!order) throw new Error("Consolidado no encontrado");
      if (order.distributor_id !== distributorId) {
        throw new Error("No tienes permiso para modificar este consolidado");
      }
      if (order.status !== "draft") {
        throw new Error("Solo se pueden modificar borradores");
      }

      // Verificar si el producto ya existe
      const { data: existing } = await supabase
        .from("consolidated_order_items")
        .select("id, quantity, unit_price")
        .eq("consolidated_order_id", consolidatedOrderId)
        .eq("product_id", productData.product_id)
        .eq("variant_id", productData.variant_id || null)
        .maybeSingle();

      if (existing) {
        // Si ya existe, sumar cantidad
        const newQuantity = existing.quantity + productData.quantity;
        return await this.updateItemQuantity(existing.id, newQuantity, distributorId);
      }

      // Insertar nuevo item
      const subtotal = productData.quantity * productData.unit_price;

      const { data: newItem, error: insertError } = await supabase
        .from("consolidated_order_items")
        .insert({
          consolidated_order_id: consolidatedOrderId,
          product_id: productData.product_id,
          variant_id: productData.variant_id,
          product_name: productData.product_name,
          product_sku: productData.product_sku,
          variant_description: productData.variant_description,
          product_image_url: productData.product_image_url,
          quantity: productData.quantity,
          unit_price: productData.unit_price,
          subtotal,
          source_quote_ids: productData.source_quote_ids || [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("✅ Producto agregado manualmente:", newItem.id);

      return newItem as ConsolidatedOrderItem;
    } catch (error) {
      console.error("❌ Error en addProduct:", error);
      throw error;
    }
  }

  /**
   * Enviar pedido consolidado (convertir a cotización)
   */
  static async sendOrder(data: SendConsolidatedOrderDTO, distributorId: string): Promise<string> {
    try {
      // 1. Obtener consolidado con items
      const { data: order, error: getError } = await supabase
        .from("consolidated_orders")
        .select(
          `
          *,
          consolidated_order_items (*)
        `,
        )
        .eq("id", data.consolidated_order_id)
        .eq("distributor_id", distributorId)
        .eq("status", "draft")
        .single();

      if (getError) throw getError;
      if (!order) throw new Error("Borrador no encontrado");

      const items = order.consolidated_order_items as ConsolidatedOrderItem[];

      if (!items || items.length === 0) {
        throw new Error("No hay productos en el consolidado");
      }

      // 2. Obtener info del distribuidor (L2)
      const { data: distributor } = await supabase
        .from("users")
        .select("full_name, email, business_name, phone")
        .eq("id", distributorId)
        .single();

      // 3. Crear cotización para L1
      const { data: newQuote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          catalog_id: order.original_catalog_id,
          user_id: order.supplier_id, // L1 es el dueño de la cotización
          customer_name: distributor?.full_name || "Distribuidor",
          customer_email: distributor?.email || "",
          customer_company: distributor?.business_name,
          customer_phone: distributor?.phone,
          customer_user_id: distributorId,
          notes: `Pedido consolidado\n${data.notes || ""}`,
          status: "pending",
          delivery_method: "pickup",
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 4. Crear quote_items
      const quoteItems = items.map((item) => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        variant_description: item.variant_description,
        product_image_url: item.product_image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        price_type: "mayoreo",
      }));

      const { error: itemsError } = await supabase.from("quote_items").insert(quoteItems);

      if (itemsError) throw itemsError;

      // 5. Actualizar consolidado
      const { error: updateError } = await supabase
        .from("consolidated_orders")
        .update({
          status: "sent",
          quote_id: newQuote.id,
          sent_at: new Date().toISOString(),
          notes: data.notes,
        })
        .eq("id", data.consolidated_order_id);

      if (updateError) throw updateError;

      console.log("✅ Pedido consolidado enviado. Quote ID:", newQuote.id);

      // 6. TODO: Enviar email a L1 (notificar nueva cotización)

      return newQuote.id;
    } catch (error) {
      console.error("❌ Error en sendOrder:", error);
      throw error;
    }
  }

  /**
   * Actualizar notas del consolidado
   */
  static async updateNotes(consolidatedOrderId: string, notes: string, distributorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("consolidated_orders")
        .update({ notes })
        .eq("id", consolidatedOrderId)
        .eq("distributor_id", distributorId)
        .eq("status", "draft");

      if (error) throw error;
    } catch (error) {
      console.error("❌ Error en updateNotes:", error);
      throw error;
    }
  }
}
