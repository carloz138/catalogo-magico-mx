import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Manejo de CORS (para que no te de error al llamar desde el Dashboard)
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

    // 2. Obtener la cotización con TODOS los datos necesarios
    // IMPORTANTE: Traemos el tracking_token para armar la liga
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

    // 3. Construir la URL Correcta
    // Si estás probando en local, esto mandará al sitio real. 
    // Para producción SIEMPRE debe ser tu dominio real.
    const baseUrl = "https://catifypro.com"; // <--- ASEGÚRATE QUE ESTE SEA TU DOMINIO
    const trackingUrl = `${baseUrl}/track/${quote.tracking_token}`;

    // 4. Formatear dinero (de centavos a pesos)
    const total = (quote.total_amount || 0) / 100;
    const envio = (quote.shipping_cost || 0) / 100;
    const subtotal = total - envio;

    // 5. Enviar el Correo Bonito (HTML)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CatifyPro <noreply@catifypro.com>", // <--- Verifica que este remitente esté autorizado en Resend
        to: [quote.customer_email],
        subject: `Actualización: Costo de Envío Cotización #${quote.order_number || "Pendiente"}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                .header { background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 20px 0; }
                .price-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .btn { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Actualización de tu Pedido</h2>
                </div>
                
                <div class="content">
                  <p>Hola <strong>${quote.customer_name}</strong>,</p>
                  <p>Hemos calculado el costo de envío y la fecha estimada de entrega para tu cotización <strong>#${quote.order_number}</strong>.</p>
                  
                  <div class="price-box">
                    <p style="margin: 0; font-size: 14px; color: #666;">Fecha Estimada de Entrega:</p>
                    <p style="margin: 0 0 10px 0; font-weight: bold;">${quote.estimated_delivery_date || "Por definir"}</p>
                    <hr style="border: 0; border-top: 1px solid #dcfce7; margin: 10px 0;">
                    <p style="margin: 5px 0;">Subtotal Productos: <strong>$${subtotal.toFixed(2)}</strong></p>
                    <p style="margin: 5px 0;">Costo de Envío: <strong>$${envio.toFixed(2)}</strong></p>
                    <p style="margin: 10px 0; font-size: 18px; color: #15803d;"><strong>Total Final: $${total.toFixed(2)} MXN</strong></p>
                  </div>

                  <p>Para confirmar el pedido y realizar el pago, haz clic en el siguiente botón:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${trackingUrl}" class="btn">Ver Cotización y Pagar</a>
                  </div>
                  
                  <p style="font-size: 13px; color: #888;">Si el botón no funciona, copia y pega este enlace:<br>${trackingUrl}</p>
                </div>

                <div class="footer">
                  <p>Gracias por tu preferencia.</p>
                </div>
              </div>
            </body>
          </html>
        `
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
