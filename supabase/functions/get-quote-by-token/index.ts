// ==========================================
// FUNCION: get-quote-by-token
// DESCRIPCIÓN: Obtiene datos seguros (Estrategia Multi-Query para evitar fallos de JOIN)
// ESTADO: FIX_V8 (INFALIBLE)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Logging Inicial
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "get-quote-by-token",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) throw new Error("Token requerido");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`🔍 Analizando token: ${token}`);

    // 1. Resolver Token (Tracking o Activación)
    let quoteId = null;
    
    // Intento A: Tracking
    const { data: trackingData } = await supabaseAdmin
      .from('quote_tracking_tokens')
      .select('quote_id')
      .eq('token', token)
      .maybeSingle();

    if (trackingData) {
       quoteId = trackingData.quote_id;
    } else {
       // Intento B: Activación directa
       const { data: activationData } = await supabaseAdmin
         .from('replicated_catalogs')
         .select('quote_id')
         .eq('activation_token', token)
         .maybeSingle();
       
       if (activationData) quoteId = activationData.quote_id;
    }

    if (!quoteId) {
       throw new Error("Token inválido o expirado");
    }

    // 2. Obtener Cotización (Query Limpia sin Joins complicados)
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        digital_catalogs (
            name, slug, user_id
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching quote:", quoteError);
      throw new Error("No se pudo cargar la cotización");
    }

    // 3. Obtener Info de Negocio (Dueño)
    if (quote.digital_catalogs?.user_id) {
        const { data: businessInfo } = await supabaseAdmin
            .from('business_info')
            .select('business_name, phone, email, logo_url')
            .eq('user_id', quote.digital_catalogs.user_id)
            .maybeSingle();
        
        // Inyectamos la info en la estructura que espera el frontend
        if (quote.digital_catalogs) {
            quote.digital_catalogs.users = businessInfo; 
        }
    }

    // 4. Obtener Catálogo Replicado (Query Manual Infalible)
    // Buscamos directamente en la tabla usando el ID de la cotización
    const { data: replica } = await supabaseAdmin
        .from('replicated_catalogs')
        .select('id, is_active')
        .eq('quote_id', quoteId)
        .maybeSingle();
    
    // Inyectamos manualmente la relación
    quote.replicated_catalogs = replica;

    console.log(`✅ Cotización cargada. Tiene réplica: ${!!replica}`);

    return new Response(JSON.stringify({
      success: true,
      quote: quote,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
