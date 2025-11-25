// ==========================================
// FUNCION: get-quote-by-token (FASE C - FIX AMBIGÜEDAD)
// ESTADO: FIX_V7 (Relación explícita corregida)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

async function getOwnerData(supabaseAdmin: any, ownerId: string): Promise<any> {
    const tablesToTry = ['profiles', 'business_info', 'users']; 
    const selectFields = 'business_name, full_name';
    for (const tableName of tablesToTry) {
        const { data } = await supabaseAdmin.from(tableName).select(selectFields).eq('id', ownerId).maybeSingle();
        if (data) return data;
    }
    return null;
}

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "get-quote-by-token",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const token = body.token || body.tracking_token;

    if (!token) throw new Error('Token no proporcionado');

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    );
    
    console.log('🔍 Analizando token:', token);

    let quoteId = null;
    let replicaData = null;

    // 1. Intento A: Tracking
    const { data: trackingData } = await supabaseAdmin
        .from('quote_tracking_tokens')
        .select('quote_id')
        .eq('token', token)
        .maybeSingle();

    if (trackingData) {
        console.log("✅ Es un Token de Tracking válido.");
        quoteId = trackingData.quote_id;
    } else {
        // 2. Intento B: Activación
        const { data: activationData } = await supabaseAdmin
            .from('replicated_catalogs')
            .select('id, quote_id, is_active')
            .eq('activation_token', token)
            .maybeSingle();

        if (activationData) {
            console.log("✅ Es un Token de Activación válido.");
            quoteId = activationData.quote_id;
            replicaData = activationData;
        }
    }

    if (!quoteId) {
        throw new Error('Link inválido o expirado.');
    }

    // 3. Buscar Cotización (FIX: Relación Explícita)
    // Usamos !replicated_catalogs_quote_id_fkey para decirle a Supabase cuál relación usar
    const { data: quote, error: quoteError } = await supabaseAdmin.from('quotes').select(`
        *,
        quote_items (*),
        digital_catalogs (
          id, name, enable_distribution, user_id
        ),
        replicated_catalogs!replicated_catalogs_quote_id_fkey (id, is_active) 
      `).eq('id', quoteId).single(); 

    if (quoteError) {
        console.error("❌ Error al obtener cotización:", quoteError);
        throw quoteError;
    }
    
    // 4. Datos Extra
    let businessInfo = null;
    if (quote.digital_catalogs?.user_id) {
      businessInfo = await getOwnerData(supabaseAdmin, quote.digital_catalogs.user_id);
    }
    
    if (quote.digital_catalogs) {
      quote.digital_catalogs.users = businessInfo;
    }
    
    if (replicaData) {
        quote.replicated_catalogs = replicaData;
    } else if (Array.isArray(quote.replicated_catalogs)) {
        quote.replicated_catalogs = quote.replicated_catalogs[0];
    }
    
    return new Response(JSON.stringify({
      success: true,
      quote: quote,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
