// ==========================================
// FUNCION: create-quote
// ESTADO: FIX_V3 (NUEVO ESTÁNDAR: Inmutabilidad por HASH)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
// 1. HARDENING: Leer el Hash de la variable de entorno
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  // Logging Inicial: Usamos el HASH como trazabilidad
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "create-quote",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  let newQuoteId = null;
  try {
    const payload = await req.json();
    // 1. Inicializar Supabase con Service Role (ADMIN)
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: {
        persistSession: false
      }
    });
    // A. Obtener Dueño del Catálogo
    const { data: catalogOwner, error: ownerError } = await supabaseAdmin.from('digital_catalogs').select('user_id').eq('id', payload.catalog_id).single();
    if (ownerError || !catalogOwner) {
      throw new Error("Catálogo no encontrado o ID de dueño no válido.");
    }
    // 2. Insertar la CABECERA de la cotización (tabla 'quotes')
    const totalAmount = payload.items.reduce((sum, item)=>sum + item.unit_price * item.quantity, 0);
    const quoteToInsert = {
      catalog_id: payload.catalog_id,
      user_id: catalogOwner.user_id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_company: payload.customer_company,
      customer_phone: payload.customer_phone,
      notes: payload.notes,
      delivery_method: payload.delivery_method,
      shipping_address: payload.shipping_address,
      total_amount: totalAmount,
      // Si items_count no existe en la DB, omite esta línea.
      items_count: payload.items.length,
      status: 'pending',
      replicated_catalog_id: payload.replicated_catalog_id
    };
    const { data: newQuote, error: quoteError } = await supabaseAdmin.from("quotes").insert(quoteToInsert).select().single();
    if (quoteError || !newQuote) {
      console.error('Error insertando quote:', quoteError);
      throw new Error(`Error al registrar cabecera: ${quoteError?.message}`);
    }
    newQuoteId = newQuote.id;
    // 3. Insertar los ITEMS de la cotización (tabla 'quote_items')
    const itemsToInsert = payload.items.map((item)=>({
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
        subtotal: item.unit_price * item.quantity
      }));
    const { error: itemsError } = await supabaseAdmin.from("quote_items").insert(itemsToInsert);
    if (itemsError) {
      // ROLLBACK: Borramos la cabecera si fallan los items.
      console.error('Error insertando items. Iniciando Rollback:', itemsError);
      await supabaseAdmin.from('quotes').delete().eq('id', newQuote.id);
      throw new Error("Error al registrar los ítems de la cotización. Rollback ejecutado.");
    }
    // 4. Disparar la Edge Function de NOTIFICACIÓN (async)
    try {
      await supabaseAdmin.functions.invoke('send-quote-notification', {
        body: {
          quoteId: newQuote.id
        }
      });
      console.log('Notificación de cotización disparada.');
    } catch (e) {
      console.error('Error al invocar email function (no bloqueante):', e);
    }
    return new Response(JSON.stringify({
      success: true,
      quote_id: newQuote.id
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error(`FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response(JSON.stringify({
      error: error.message || "Error desconocido al registrar cotización."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
