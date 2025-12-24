// ==========================================
// FUNCION: send-quote-update
// DESCRIPCIÓN: Notifica al cliente costo de envío final (Email + WhatsApp)
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
      throw new Error("No se encontró la cotización o el ID es incorrecto");
    }

    // 3. Construir URL y Totales
    const baseUrl = "https://catifypro.com"; // TU DOMINIO REAL
    const trackingUrl = `${baseUrl}/track/${quote.tracking_token}`;

    const total = (quote.total_amount || 0) / 100;
    const envio = (quote.shipping_cost || 0) / 100;
    const subtotal = total - envio;
    const totalFormatted = `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    // 4. Enviar Email (Resend) - Tu lógica original (Intacta)
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
            subject: `Actualización: Costo de Envío Cotización #${quote.id.slice(0, 8)}`,
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: sans-serif; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                    <h2 style="text-align: center; color: #10b981;">¡Cotización Lista! 🚚</h2>
                    <p>Hola <strong>${quote.customer_name}</strong>,</p>
                    <p>Hemos calculado el envío para tu pedido <strong>#${quote.id.slice(0, 8)}</strong>.</p>
                    
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
                    <p style="font-size: 12px; color: #888; text-align: center;">${trackingUrl}</p>
                  </div>
                </body>
              </html>
            `
          }),
        });
        console.log("✅ Email de actualización enviado");
    } catch (emailError) {
        console.error("⚠️ Error enviando Email:", emailError);
    }

    // 5. Enviar WhatsApp (NUEVO) 🟢
    if (quote.customer_phone) {
        try {
            console.log("📲 Intentando enviar WhatsApp al cliente...");
            
            await supabaseAdmin.functions.invoke('send-whatsapp', {
                body: {
                    phone: quote.customer_phone,
                    templateName: "quote_shipping_update", // <--- PLANTILLA META
                    parameters: [
                        { type: "text", text: quote.customer_name },          // {{1}} Nombre
                        { type: "text", text: quote.id.slice(0, 8) },         // {{2}} Folio
                        { type: "text", text: totalFormatted },               // {{3}} Total
                        { type: "text", text: trackingUrl }                   // {{4}} Link de Pago
                    ]
                }
            });
            console.log("✅ WhatsApp de actualización enviado");
        } catch (waError) {
            console.error("⚠️ Error enviando WhatsApp:", waError);
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
