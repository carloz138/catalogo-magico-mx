// ==========================================
// FUNCION: accept-quote-public
// DESCRIPCIÓN: Permite a un cliente aceptar la cotización vía Token Público
// ESTADO: FIX_V2.0 (SILENT MODE - Sin Email de Confirmación)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// 1. HARDENING: Leer el Hash de la variable de entorno
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // 2. Logging Inicial Estructurado
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "accept-quote-public",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) throw new Error("Token es requerido");

    // Cliente Admin para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`🔍 Procesando aceptación para token: ${token.slice(0, 8)}...`);

    // 1. Validar Token de Tracking
    const { data: trackingToken, error: tokenError } = await supabaseAdmin
      .from('quote_tracking_tokens')
      .select('quote_id, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !trackingToken) {
      console.error("❌ Token inválido o no encontrado");
      throw new Error("Token inválido o no encontrado");
    }

    // 2. Obtener cotización actual
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select('id, status, customer_email, customer_name, total_amount')
      .eq('id', trackingToken.quote_id)
      .single();

    if (quoteError || !quote) throw new Error("Cotización no encontrada");

    // Idempotencia: Si ya estaba aceptada, retornamos éxito sin error
    if (quote.status === 'accepted' || quote.status === 'shipped') {
      console.log("ℹ️ La cotización ya estaba aceptada previamente.");
      return new Response(JSON.stringify({
        success: true,
        message: "La cotización ya estaba aceptada",
        version: DEPLOY_VERSION
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 3. Actualizar estado a ACCEPTED
    const { error: updateError } = await supabaseAdmin
      .from('quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', quote.id);

    if (updateError) throw updateError;

    console.log(`✅ Cotización ${quote.id} actualizada a ACCEPTED`);

    // 4. NOTIFICACIÓN SILENCIADA (Cambio Solicitado)
    // Se eliminó la invocación a 'send-quote-accepted-email' para evitar
    // duplicidad con el flujo viral del Modal en Frontend.
    console.log("🔕 Email de confirmación silenciado para priorizar Modal Viral.");

    return new Response(JSON.stringify({
      success: true,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    return new Response(JSON.stringify({
      error: error.message,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
