// ==========================================
// FUNCION: create-quote
// DESCRIPCIÓN: Crea la cotización asignando correctamente el dueño (L1 o L2)
// ESTADO: V2.2 (SOPORTE VIRAL L2)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// 1. HARDENING: Leer el Hash de la variable de entorno
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  // Logging Inicial
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "create-quote",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let newQuoteId = null;

  try {
    const payload = await req.json();

    // 1. Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // =================================================================
    // A. DETERMINAR EL DUEÑO DE LA VENTA (CRÍTICO PARA MODELO L2)
    // =================================================================
    let saleOwnerUserId = null;

    if (payload.replicated_catalog_id) {
      // CASO 1: Venta a través de un Revendedor (L2)
      console.log(`🔗 Procesando venta de réplica: ${payload.replicated_catalog_id}`);
      
      const { data: replica, error: replicaError } = await supabaseAdmin
        .from('replicated_catalogs')
        .select('reseller_id')
        .eq('id', payload.replicated_catalog_id)
        .single();

      if (replicaError || !replica) {
        throw new Error("El catálogo replicado no existe o no es válido.");
      }
      
      // La venta pertenece al Revendedor
      saleOwnerUserId = replica.reseller_id;

    } else {
      // CASO 2: Venta Directa del Fabricante (L1)
      console.log(`🏭 Procesando venta directa del catálogo: ${payload.catalog_id}`);

      const { data: catalogOwner, error: ownerError } = await supabaseAdmin
        .from('digital_catalogs')
        .select('user_id')
        .eq('id', payload.catalog_id)
        .single();

      if (ownerError || !catalogOwner) {
        throw new Error("Catálogo original no encontrado o ID de dueño no válido.");
      }

      // La venta pertenece al Dueño del Catálogo Original
      saleOwnerUserId = catalogOwner.user_id;
    }

    if (!saleOwnerUserId) {
        throw new Error("No se pudo determinar el propietario de la venta.");
    }

    // =================================================================
    // B. INSERTAR COTIZACIÓN
    // =================================================================
    
    // Calcular total (Backend validation siempre es buena práctica)
    const totalAmount = payload.items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);

    const quoteToInsert = {
      catalog_id: payload.catalog_id,            // Siempre apunta al origen de los productos
      user_id: saleOwnerUserId,                  // <--- AQUÍ ESTÁ LA MAGIA (L1 o L2)
      replicated_catalog_id: payload.replicated_catalog_id || null, // Guardamos la trazabilidad
      
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_company: payload.customer_company,
      customer_phone: payload.customer_phone,
      notes: payload.notes,
      
      delivery_method: payload.delivery_method,
      shipping_address: payload.shipping_address,
      
      total_amount: totalAmount,
      items_count: payload.items.length,
      status: 'pending'
    };

    const { data: newQuote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert(quoteToInsert)
      .select()
      .single();

    if (quoteError || !newQuote) {
      console.error('Error insertando quote:', quoteError);
      throw new Error(`Error al registrar cabecera: ${quoteError?.message}`);
    }

    newQuoteId = newQuote.id;

    // 3. Insertar los ITEMS (tabla 'quote_items')
    const itemsToInsert = payload.items.map((item: any) => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_image_url: item.product_image_url,
        variant_description: item.variant_description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price_type: item.price_type,
        subtotal: item.unit_price * item.quantity,
        origin_replicated_catalog_id: item.origin_replicated_catalog_id || null
      }));

    const { error: itemsError } = await supabaseAdmin
      .from("quote_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // ROLLBACK MANUAL
      console.error('Error insertando items. Iniciando Rollback:', itemsError);
      await supabaseAdmin.from('quotes').delete().eq('id', newQuote.id);
      throw new Error("Error al registrar los ítems. Rollback ejecutado.");
    }

    // 4. Disparar Notificación (Async)
    try {
      await supabaseAdmin.functions.invoke('send-quote-notification', {
        body: { quoteId: newQuote.id }
      });
      console.log('📨 Notificación de nueva cotización disparada.');
    } catch (e) {
      console.error('⚠️ Error al invocar email function (no bloqueante):', e);
    }

    // 5. Retorno Exitoso
    return new Response(JSON.stringify({
      success: true,
      quote_id: newQuote.id,
      owner_id: saleOwnerUserId // Útil para debugging en frontend
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error(`❌ FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response(JSON.stringify({
      error: error.message || "Error desconocido al registrar cotización."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
