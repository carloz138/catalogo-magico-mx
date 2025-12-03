// ==========================================
// FUNCION: fb-conversion (CAPI)
// ESTADO: PROD_V3 (Fix IP Formatting + Dedupe)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DEPLOY_VERSION = "FB_CAPI_V3_IP_FIX";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ------------------------------------------------------------------
// HELPER: Hashing SHA-256
// ------------------------------------------------------------------
async function hashData(data: string) {
  if (!data) return undefined;
  const msgBuffer = new TextEncoder().encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------------
// HELPER: Limpiar IP (El fix para Facebook)
// ------------------------------------------------------------------
function getClientIp(req: Request): string {
  const forwardedHeader = req.headers.get('x-forwarded-for');
  // Si hay múltiples IPs (ej: "client, proxy"), tomamos la primera
  if (forwardedHeader) {
    return forwardedHeader.split(',')[0].trim();
  }
  return '0.0.0.0';
}

// ------------------------------------------------------------------
// MAIN SERVER
// ------------------------------------------------------------------
Deno.serve(async (req) => {
  // LOG DE VERSIÓN
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "fb-conversion",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Leemos el body
    const { 
      event_name, 
      event_id,        
      user_email, 
      user_phone, 
      custom_data, 
      event_source_url 
    } = await req.json()
    
    const PIXEL_ID = Deno.env.get('FB_PIXEL_ID')
    const ACCESS_TOKEN = Deno.env.get('FB_ACCESS_TOKEN')

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error(`[${DEPLOY_VERSION}] Faltan Secrets`);
      throw new Error('Configuración incompleta en servidor')
    }

    // 1. OBTENER IP LIMPIA (FIX APLICADO AQUI)
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';

    const userData: any = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
    };

    if (user_email) userData.em = [await hashData(user_email)];
    if (user_phone) userData.ph = [await hashData(user_phone)];

    const payload = {
      data: [
        {
          event_name: event_name || 'Lead', 
          event_id: event_id,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: event_source_url,
          user_data: userData,
          custom_data: custom_data || {}
        }
      ]
    };

    console.log(`[${DEPLOY_VERSION}] Enviando evento '${event_name}' (IP: ${clientIp}) a FB...`);

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
      // Si falla, mostramos el error completo para debug
      console.error(`[${DEPLOY_VERSION}] Error FB:`, JSON.stringify(fbResult))
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
