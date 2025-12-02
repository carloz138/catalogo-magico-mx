// ==========================================
// FUNCION: tracking-events (META CAPI BRIDGE)
// ESTADO: PROD_V1 (Hashing SHA256 + Deduplicación)
// ==========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "INIT_CAPI_V1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --------------------------------------------------------------------------
// HELPER: Hashing SHA-256 (Requisito estricto de Meta)
// --------------------------------------------------------------------------
async function hashData(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// --------------------------------------------------------------------------
// HELPER: Normalización de Datos (Limpieza antes del Hash)
// --------------------------------------------------------------------------
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  // Solo números, sin símbolos ni espacios
  return phone.replace(/[^0-9]/g, '');
}

serve(async (req) => {
  // 1. Log de inicio (Para debug en Dashboard)
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "tracking-events",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  // 2. Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Extracción de datos del Payload (viene del Frontend Hook)
    const { 
      pixel_id, 
      access_token, 
      event_name, 
      event_id, 
      event_source_url, 
      user_data, 
      custom_data,
      test_event_code // Opcional: Para probar en el "Test Events" de FB
    } = body;

    // Validación Básica
    if (!pixel_id || !access_token) {
      // No lanzamos error 500 para no alarmar al frontend, pero logueamos el fallo.
      console.warn("⚠️ Falta Pixel ID o Token. Evento ignorado.");
      return new Response(JSON.stringify({ status: 'skipped', reason: 'missing_config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --------------------------------------------------------------------------
    // 3. PROCESAMIENTO DE DATOS DE USUARIO (HASHING)
    // --------------------------------------------------------------------------
    const userDataPayload: any = {
      client_user_agent: user_data?.client_user_agent,
      fbc: user_data?.fbc,
      fbp: user_data?.fbp,
      client_ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0", // IP del cliente
    };

    // Hashear Email si existe
    if (user_data?.email) {
      const normalizedEmail = normalizeEmail(user_data.email);
      userDataPayload.em = await hashData(normalizedEmail);
    }

    // Hashear Teléfono si existe
    if (user_data?.phone) {
      const normalizedPhone = normalizePhone(user_data.phone);
      userDataPayload.ph = await hashData(normalizedPhone);
    }

    // Hashear Nombre/Apellido si existen
    if (user_data?.firstName) userDataPayload.fn = await hashData(user_data.firstName.toLowerCase());
    if (user_data?.lastName) userDataPayload.ln = await hashData(user_data.lastName.toLowerCase());

    // --------------------------------------------------------------------------
    // 4. CONSTRUCCIÓN DEL PAYLOAD PARA FACEBOOK
    // --------------------------------------------------------------------------
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const fbPayload = {
      data: [
        {
          event_name: event_name,
          event_time: currentTimestamp,
          event_id: event_id, // CRÍTICO: Debe ser igual al del Pixel del navegador
          event_source_url: event_source_url,
          action_source: "website",
          user_data: userDataPayload,
          custom_data: custom_data,
        },
      ],
      // Si mandaron un código de prueba (ej. 'TEST1234'), lo agregamos
      ...(test_event_code ? { test_event_code } : {}),
    };

    console.log(`📤 Enviando evento '${event_name}' a Meta CAPI...`);

    // --------------------------------------------------------------------------
    // 5. ENVÍO A GRAPH API
    // --------------------------------------------------------------------------
    const response = await fetch(
      `https://graph.facebook.com/v16.0/${pixel_id}/events?access_token=${access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fbPayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Error de Meta CAPI:", result);
      // Aún así devolvemos 200 al frontend para no romper la experiencia, 
      // pero el log queda registrado para ti.
      return new Response(JSON.stringify({ success: false, meta_error: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      });
    }

    console.log("✅ Evento recibido por Meta:", result);

    return new Response(JSON.stringify({ success: true, fb_trace_id: result.fbtrace_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("🔥 Error crítico en Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
