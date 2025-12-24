// ==========================================
// FUNCION: send-quote-update
// DESCRIPCIÓN: Notifica costo de envío con BOTÓN DE PAGO en WhatsApp
// ==========================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "send-quote-update",
    version: DEPLOY_VERSION
  }));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    
    // 1. Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Obtener la cotización
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq("id", quoteId)
      .single();

    if (error || !quote) {
      throw new Error("No se encontró la cotización");
    }

    // 3. Cálculos
    const baseUrl = "https://catifypro.com";
    // tracking_token es vital para la URL pública
    const trackingToken = quote.tracking_token; 
    const trackingUrl = `${baseUrl}/track/${trackingToken}`;

    const total = (quote.total_amount || 0) / 100;
    const envio = (quote.shipping_cost || 0) / 100;
    const subtotal = total - envio;
    const totalFormatted = `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    // 4. Enviar Email (Resend)
    try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "CatifyPro <noreply@catifypro.com>", 
            to: [quote.customer_email],
            subject: `Total Actualizado: Cotización #${quote.id.slice(0, 8)}`,
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: sans-serif; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                    <h2 style="text-align: center; color: #10b981;">¡Envío Calculado! 🚚</h2>
                    <p>Hola <strong>${quote.customer_name}</strong>,</p>
                    <p>Ya puedes proceder al pago de tu pedido <strong>#${quote.id.slice(0, 8)}</strong>.</p>
                    
                    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #bbf7d0;">
                      <p>Subtotal: $${subtotal.toFixed(2)}</p>
                      <p>Envío: $${envio.toFixed(2)}</p>
                      <h3 style="color: #15803d; margin-top: 10px;">Total Final: ${totalFormatted} MXN</h3>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${trackingUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Pagar Ahora
                      </a>
                    </div>
                  </div>
                </body>
              </html>
            `
          }),
        });
        console.log("✅ Email enviado");
    } catch (emailError) {
        console.error("⚠️ Error Email:", emailError);
    }

    // 5. Enviar WhatsApp con BOTÓN (NUEVO) 🟢
    if (quote.customer_phone) {
        try {
            console.log("📲 Enviando WhatsApp con botón de pago...");
            
            await supabaseAdmin.functions.invoke('send-whatsapp', {
                body: {
                    phone: quote.customer_phone,
                    templateName: "quote_shipping_update",
                    parameters: [
                        // A. CUERPO DEL MENSAJE (TEXTO)
                        { type: "text", text: quote.customer_name },          // {{1}} Nombre
                        { type: "text", text: quote.id.slice(0, 8) },         // {{2}} Folio
                        { type: "text", text: totalFormatted }                // {{3}} Total Dinero
                    ],
                    // B. PARÁMETRO DEL BOTÓN (URL SUFFIX)
                    // Como en send-whatsapp ya preparamos la lógica para botones, 
                    // solo necesitamos asegurarnos de que la función maestra lo soporte.
                    // Si usaste mi código de 'send-whatsapp' anterior, necesitamos ajustar 
                    // la llamada aquí para que coincida con la estructura de Meta.
                }
            });
            
            // NOTA: Para que esto funcione, tu función 'send-whatsapp' debe ser capaz de recibir 
            // un array de componentes. Si usaste la versión simple, aquí te dejo la llamada directa 
            // a Meta para asegurar que el botón funcione sin depender de la versión de send-whatsapp.
            
            const metaToken = Deno.env.get('META_ACCESS_TOKEN');
            const metaPhoneId = Deno.env.get('META_PHONE_ID');
            const cleanPhone = quote.customer_phone.replace(/\D/g, '');

            await fetch(`https://graph.facebook.com/v17.0/${metaPhoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${metaToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: cleanPhone,
                    type: "template",
                    template: {
                        name: "quote_shipping_update",
                        language: { code: "es_MX" },
                        components: [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: quote.customer_name },
                                    { type: "text", text: quote.id.slice(0, 8) },
                                    { type: "text", text: totalFormatted }
                                ]
                            },
                            {
                                type: "button",
                                sub_type: "url",
                                index: 0,
                                parameters: [
                                    { type: "text", text: trackingToken } // Se pega a https://catifypro.com/track/
                                ]
                            }
                        ]
                    }
                })
            });

            console.log("✅ WhatsApp con botón de pago enviado");

        } catch (waError) {
            console.error("⚠️ Error WhatsApp:", waError);
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`FATAL ERROR:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
