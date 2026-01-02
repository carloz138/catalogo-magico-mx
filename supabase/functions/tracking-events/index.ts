// ==========================================
// FUNCION: tracking-events (META CAPI BRIDGE)
// DESCRIPCIÓN: Proxy asíncrono para Meta CAPI con hashing y deduplicación
// ==========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ✅ TU PROTOCOLO DE VERSIONADO
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HELPERS DE HASHING (Requerido por Meta) ---
async function hashData(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function normalizePhone(phone: string) { return phone.replace(/[^0-9]/g, ''); }

serve(async (req) => {
  // ✅ TU LOG DE INICIO ESTÁNDAR
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "tracking-events",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || "0.0.0.0";

    // Validación mínima para no procesar basura
    if (!body.pixel_id || !body.access_token) {
        console.warn(`[${DEPLOY_VERSION}] Missing credentials. Skipping.`);
        return new Response(JSON.stringify({ status: 'skipped', reason: 'missing_config' }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
        });
    }

    // 🚀 LÓGICA BACKGROUND (Fire & Forget)
    const processEvent = async () => {
        try {
            console.log(`[${DEPLOY_VERSION}] Procesando evento background: ${body.event_name}`);
            const { pixel_id, access_token, user_data, ...rest } = body;

            // 1. Preparar User Data con Hashing
            const userDataPayload: any = {
                client_user_agent: user_data?.client_user_agent,
                fbc: user_data?.fbc,
                fbp: user_data?.fbp,
                client_ip_address: clientIp,
            };

            if (user_data?.email) userDataPayload.em = await hashData(normalizeEmail(user_data.email));
            if (user_data?.phone) userDataPayload.ph = await hashData(normalizePhone(user_data.phone));
            if (user_data?.firstName) userDataPayload.fn = await hashData(user_data.firstName.toLowerCase());
            if (user_data?.lastName) userDataPayload.ln = await hashData(user_data.lastName.toLowerCase());
            if (user_data?.city) userDataPayload.ct = await hashData(user_data.city.toLowerCase().trim());
            if (user_data?.state) userDataPayload.st = await hashData(user_data.state.toLowerCase().trim());
            if (user_data?.zip) userDataPayload.zp = await hashData(user_data.zip.trim());
            if (user_data?.country) userDataPayload.country = await hashData(user_data.country.toLowerCase().trim());

            // 2. Construir Payload Oficial
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const fbPayload = {
                data: [{
                    ...rest, // event_name, event_id, custom_data, etc.
                    event_time: currentTimestamp,
                    action_source: "website",
                    user_data: userDataPayload,
                }],
                ...(body.test_event_code ? { test_event_code: body.test_event_code } : {}),
            };

            // 3. Enviar a Meta Graph API
            const response = await fetch(
                `https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${access_token}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fbPayload),
                }
            );
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error(`[${DEPLOY_VERSION}] ❌ Meta CAPI Error:`, JSON.stringify(result));
            } else {
                console.log(`[${DEPLOY_VERSION}] ✅ Meta CAPI Success. Trace ID:`, result.fbtrace_id);
            }

        } catch (err) {
            console.error(`[${DEPLOY_VERSION}] 🔥 Background Task Exception:`, err);
        }
    };

    // 🔥 REGISTRO DE TAREA ASÍNCRONA (No bloquea la respuesta al cliente)
    // @ts-ignore
    EdgeRuntime.waitUntil(processEvent());

    // Respuesta inmediata 200 OK para que el frontend no espere
    return new Response(JSON.stringify({ 
        success: true, 
        status: 'queued', 
        version: DEPLOY_VERSION 
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error: any) {
    console.error(`FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
