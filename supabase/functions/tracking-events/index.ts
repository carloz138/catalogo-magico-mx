import { corsHeaders } from "../_shared/cors.ts";

const FACEBOOK_GRAPH_API_VERSION = "v21.0";

// Hash SHA256 helper (Facebook requiere esto para PII)
async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Normalizar email/phone antes de hashear
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizePhone(phone: string): string {
  // Remover espacios, guiones, paréntesis
  return phone.replace(/[\s\-()]/g, "");
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      provider,
      event_name,
      event_id,
      user_data = {},
      custom_data = {},
      pixel_id,
      access_token,
      test_code,
    } = await req.json();

    // Validación básica
    if (!provider || !event_name || !pixel_id) {
      console.error("Missing required fields:", { provider, event_name, pixel_id });
      // Retornamos 200 para no romper UX, pero loggeamos el error
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // META (FACEBOOK) CONVERSIONS API
    // ========================================
    if (provider === "meta") {
      if (!access_token) {
        console.warn("Meta CAPI: Missing access_token, skipping");
        return new Response(
          JSON.stringify({ success: false, error: "Missing access_token for Meta CAPI" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Hashear PII (Información Personal Identificable)
      const hashedUserData: any = {};

      if (user_data.email) {
        hashedUserData.em = await sha256Hash(normalizeEmail(user_data.email));
      }

      if (user_data.phone) {
        hashedUserData.ph = await sha256Hash(normalizePhone(user_data.phone));
      }

      if (user_data.fn) {
        hashedUserData.fn = await sha256Hash(user_data.fn.toLowerCase().trim());
      }

      if (user_data.ln) {
        hashedUserData.ln = await sha256Hash(user_data.ln.toLowerCase().trim());
      }

      if (user_data.ct) {
        hashedUserData.ct = await sha256Hash(user_data.ct.toLowerCase().trim());
      }

      if (user_data.st) {
        hashedUserData.st = await sha256Hash(user_data.st.toLowerCase().trim());
      }

      if (user_data.zp) {
        hashedUserData.zp = await sha256Hash(user_data.zp.toLowerCase().trim());
      }

      if (user_data.country) {
        hashedUserData.country = await sha256Hash(user_data.country.toLowerCase().trim());
      }

      // 2. Preparar el payload de Facebook
      const fbPayload = {
        data: [
          {
            event_name, // "PageView", "Purchase", "AddToCart", etc.
            event_time: Math.floor(Date.now() / 1000), // Unix timestamp
            event_id, // Para deduplicación con el Pixel browser-side
            action_source: "website", // o "email", "app", etc.
            user_data: hashedUserData,
            custom_data: {
              currency: custom_data.currency || "MXN",
              value: custom_data.value || 0,
              ...custom_data,
            },
          },
        ],
        ...(test_code && { test_event_code: test_code }), // Código de prueba opcional
      };

      // 3. Enviar a Facebook Graph API
      const facebookUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${pixel_id}/events?access_token=${access_token}`;

      console.log("Sending event to Meta CAPI:", {
        event_name,
        event_id,
        pixel_id,
        test_code,
      });

      const fbResponse = await fetch(facebookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fbPayload),
      });

      const fbResult = await fbResponse.json();

      if (!fbResponse.ok) {
        console.error("Meta CAPI Error:", fbResult);
        // Aún así retornamos 200 al frontend para no romper UX
        return new Response(
          JSON.stringify({
            success: false,
            provider: "meta",
            error: fbResult.error || "Unknown Facebook error",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Meta CAPI Success:", fbResult);

      return new Response(
        JSON.stringify({
          success: true,
          provider: "meta",
          facebook_response: fbResult,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // OTROS PROVIDERS (TikTok, Google, etc.)
    // ========================================
    // Placeholder para futura expansión
    console.warn(`Provider "${provider}" not implemented yet`);

    return new Response(
      JSON.stringify({ success: false, error: `Provider "${provider}" not supported` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tracking Events Error:", error);

    // CRÍTICO: Siempre retornar 200 al frontend para no romper la UX
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
