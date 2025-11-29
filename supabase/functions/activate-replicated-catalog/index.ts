// ==========================================
// FUNCION: activate-replicated-catalog
// DESCRIPCIÓN: Vincula usuario L2 (Busca por Token Directo o Token de Tracking)
// ESTADO: FIX_V3 (CON HASHING PROTOCOL & SMART SEARCH)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// 1. HARDENING: Leer el Hash de la variable de entorno
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 2. Logging Inicial Estructurado (Protocolo)
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "activate-replicated-catalog",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      throw new Error('Se requieren token y userId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`🚀 Procesando activación. Token: ${token} | Usuario: ${userId}`);

    let catalogIdToActivate = null;

    // --- ESTRATEGIA 1: Búsqueda Directa (activation_token) ---
    const { data: directCatalog } = await supabaseAdmin
      .from('replicated_catalogs')
      .select('id, is_active')
      .eq('activation_token', token)
      .maybeSingle();

    if (directCatalog) {
      console.log("✅ Encontrado por activation_token directo");
      catalogIdToActivate = directCatalog.id;
      if (directCatalog.is_active) throw new Error('Este catálogo ya ha sido activado previamente.');
    } 
    
    // --- ESTRATEGIA 2: Búsqueda Indirecta (quote_tracking_token) ---
    else {
      console.log("⚠️ No es token directo, buscando por tracking de cotización...");
      
      // 1. Buscar la cotización dueña del token
      const { data: trackingData } = await supabaseAdmin
        .from('quote_tracking_tokens')
        .select('quote_id')
        .eq('token', token)
        .maybeSingle();

      if (!trackingData) {
        throw new Error('Token inválido: No se encontró cotización ni catálogo asociado.');
      }

      // 2. Buscar el catálogo replicado asociado a esa cotización
      const { data: linkedCatalog } = await supabaseAdmin
        .from('replicated_catalogs')
        .select('id, is_active')
        .eq('quote_id', trackingData.quote_id)
        .maybeSingle();

      if (!linkedCatalog) {
        throw new Error('Esta cotización no tiene un catálogo replicable asociado.');
      }

      if (linkedCatalog.is_active) {
         console.log("El catálogo ya estaba activo. Bloqueando reactivación.");
         throw new Error('El negocio asociado a esta compra ya fue activado.');
      }

      catalogIdToActivate = linkedCatalog.id;
      console.log(`✅ Catálogo encontrado vía Quote ID: ${trackingData.quote_id}`);
    }

    // 3. EJECUTAR LA ACTIVACIÓN (EL "CASAMIENTO")
    const { error: updateError } = await supabaseAdmin
      .from('replicated_catalogs')
      .update({
        is_active: true,
        reseller_id: userId,
        activated_at: new Date().toISOString()
      })
      .eq('id', catalogIdToActivate);

    if (updateError) {
      console.error('Error DB:', updateError);
      throw new Error('Error técnico al activar el catálogo.');
    }

    console.log(`🎉 Activación exitosa para catálogo ${catalogIdToActivate}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Catálogo activado correctamente',
        catalogId: catalogIdToActivate,
        version: DEPLOY_VERSION // Protocolo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error en activación:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        version: DEPLOY_VERSION // Protocolo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
