// ==========================================
// FUNCION: fb-conversion (CAPI)
// ESTADO: PROD_V2 (Soporte Deduplicación + Hashing)
// ==========================================

// CONTROL DE VERSION - Actualiza esto cuando hagas cambios para verlos en logs
const DEPLOY_VERSION = "FB_CAPI_V2_DEDUPE";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ------------------------------------------------------------------
// HELPER: Hashing SHA-256 (Protocolo de privacidad de FB)
// ------------------------------------------------------------------
async function hashData(data: string) {
  if (!data) return undefined;
  // Normalización: minúsculas y sin espacios extra antes del hash
  const msgBuffer = new TextEncoder().encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------------
// MAIN SERVER
// ------------------------------------------------------------------
Deno.serve(async (req) => {
  // 1. LOG DE INICIO
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "fb-conversion",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  // 2. MANEJO DE CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Leemos el body incluyendo event_id
    const { 
      event_name, 
      event_id,        // <--- IMPORTANTE: ID para deduplicación
      user_email, 
      user_phone, 
      custom_data, 
      event_source_url 
    } = await req.json()
    
    // 3. OBTENER SECRETOS
    const PIXEL_ID = Deno.env.get('FB_PIXEL_ID')
    const ACCESS_TOKEN = Deno.env.get('FB_ACCESS_TOKEN')

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error(`[${DEPLOY_VERSION}] Faltan variables de entorno (FB_PIXEL_ID o FB_ACCESS_TOKEN)`);
      throw new Error('Configuración incompleta en servidor')
    }

    // 4. PREPARAR DATOS DE USUARIO (HASHING)
    const clientIp = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';

    const userData: any = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    };

    // Aplicamos hashing antes de enviar
    if (user_email) userData.em = [await hashData(user_email)];
    if (user_phone) userData.ph = [await hashData(user_phone)];

    // 5. CONSTRUIR PAYLOAD DE FACEBOOK
    const payload = {
      data: [
        {
          event_name: event_name || 'Lead', 
          event_id: event_id, // <--- Enviamos el mismo ID que el Pixel
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: event_source_url,
          user_data: userData,
          custom_data: custom_data || {}
        }
      ]
    };

    console.log(`[${DEPLOY_VERSION}] Enviando evento '${event_name}' (ID: ${event_id || 'N/A'}) a FB...`);

    // 6. ENVIAR A META GRAPH API (v19.0)
    const fbResponse = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const fbResult = await fbResponse.json()

    if (!fbResponse.ok) {
      console.error(`[${DEPLOY_VERSION}] Error FB:`, fbResult)
      return new Response(JSON.stringify({ error: fbResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log(`[${DEPLOY_VERSION}] Éxito. FB Trace ID:`, fbResult.fbtrace_id);

    return new Response(JSON.stringify({ success: true, fb_id: fbResult.fbtrace_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error(`[${DEPLOY_VERSION}] CRITICAL ERROR:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
