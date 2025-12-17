// ==========================================
// FUNCION: send-quote-update
// DESCRIPCIÓN: Notifica al CLIENTE de cambios en su cotización (Flete/Negociación)
// INTEGRACIÓN: Meta WhatsApp + Resend
// ==========================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// 1. HARDENING: Protocolo de Versionado
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // LOG DE INICIO
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "send-quote-update",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { quoteId } = await req.json();
    
    // 1. Iniciar Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Buscar la cotización
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .select("*, customer_name, customer_email, customer_phone, total_amount, tracking_token, order_number")
      .eq("id", quoteId)
      .single();

    if (error || !quote) throw new Error("Cotización no encontrada");

    // Variables de reporte
    let emailSent = false;
    let whatsappSent = false;

    // --- ZONA 1: EMAIL (Resend) ---
    if (quote.customer_email) {
       const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CatifyPro <noreply@catifypro.com>",
          to: [quote.customer_email],
          subject: `Actualización Cotización #${quote.order_number}`,
          html: `
            <h1>Hola ${quote.customer_name}</h1>
            <p>Hemos actualizado tu cotización con los costos de envío.</p>
            <p><strong>Total a pagar: $${(quote.total_amount / 100).toFixed(2)} MXN</strong></p>
            <a href="https://catifypro.com/track/${quote.tracking_token}">Ver y Pagar</a>
          `
        }),
      });
      
      if (emailRes.ok) emailSent = true;
    }

    // --- ZONA 2: WHATSAPP (Meta Cloud API) ---
    if (quote.customer_phone && Deno.env.get("META_ACCESS_TOKEN")) {
      try {
          // Limpiar teléfono (solo números)
          const phone = quote.customer_phone.replace(/\D/g, "");
          
          // Validación: Si es número de prueba, Meta solo permite el tuyo.
          // Si es Prod, permite cualquiera.
          if (phone.length >= 10) {
              const waRes = await fetch(
                `https://graph.facebook.com/v17.0/${Deno.env.get("META_PHONE_ID")}/messages`,
                {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${Deno.env.get("META_ACCESS_TOKEN")}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: phone, 
                    type: "template",
                    template: {
                      name: "quote_update", // <--- PLANTILLA META
                      language: { code: "es_MX" },
                      components: [
                        {
                          type: "body",
                          parameters: [
                            { type: "text", text: quote.customer_name || "Cliente" }, // {{1}}
                            { type: "text", text: (quote.total_amount / 100).toFixed(2) }, // {{2}}
                            { type: "text", text: `https://catifypro.com/track/${quote.tracking_token}` } // {{3}}
                          ]
                        }
                      ]
                    }
                  }),
                }
              );

              if (waRes.ok) {
                  whatsappSent = true;
                  console.log("✅ WhatsApp enviado al cliente");
              } else {
                  console.error("❌ Error Meta:", await waRes.text());
              }
          }
      } catch (err) {
          console.error("Meta Fetch Error:", err);
      }
    }

    return new Response(JSON.stringify({ 
        success: true, 
        emailSent, 
        whatsappSent, 
        version: DEPLOY_VERSION 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
