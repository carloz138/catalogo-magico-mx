// ==========================================
// FUNCION: send-quote-notification
// ESTADO: FIX_V1 (Service Role + Logging + Deno Native)
// ==========================================

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// 1. FINGERPRINT: Cambia esto en cada deploy para confirmar actualización
const DEPLOY_VERSION = "2025.11.18_v2.0_FIX_RLS_NOTIFICATIONS";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 2. LOGGING INICIAL: Huella digital para detectar "Ghost Code"
  console.log(
    JSON.stringify({
      event: "FUNC_START",
      function: "send-quote-notification",
      version: DEPLOY_VERSION,
      timestamp: new Date().toISOString(),
    }),
  );

  // Manejo de CORS (Preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { quoteId } = payload;

    if (!quoteId) throw new Error("Quote ID is required");

    // 3. CLIENTE ADMIN (CRÍTICO): Usamos Service Role para poder leer
    // los datos del usuario L1 (Dueño) aunque quien llame sea L3 (Anónimo).
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // A. Obtener cotización y datos del catálogo
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        *,
        quote_items (*),
        digital_catalogs (
          name,
          user_id
        )
      `,
      )
      .eq("id", quoteId)
      .single();

    if (quoteError) {
      console.error(`Error fetching quote: ${JSON.stringify(quoteError)}`);
      throw new Error("Quote not found or database error");
    }

    // B. Obtener datos del Dueño (L1) - Ahora sí funcionará gracias al Service Role
    const { data: user, error: userError } = await supabaseAdmin
      .from("users") // Ojo: Asegúrate que tus datos de perfil estén en 'users' o 'profiles' según tu esquema
      .select("email, full_name, business_name, phone") // Agregué phone aquí explícito
      .eq("id", quote.digital_catalogs.user_id)
      .single();

    if (userError) {
      console.error(`Error fetching owner user: ${JSON.stringify(userError)}`);
      throw new Error("Owner user not found");
    }

    // C. Verificar Suscripción
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("package_id, credit_packages(name)")
      .eq("user_id", quote.digital_catalogs.user_id)
      .eq("status", "active")
      .single();

    const packageName = subscription?.credit_packages?.name?.toLowerCase() || "";
    const hasWhatsApp =
      packageName.includes("medio") ||
      packageName.includes("profesional") ||
      packageName.includes("premium") ||
      packageName.includes("empresarial");

    let emailSent = false;
    let whatsappSent = false;

    // D. Enviar Email (Resend)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "CatifyPro Notificaciones <noreply@catifypro.com>", // TIP: Cambia esto a tu dominio verificado cuando puedas
          to: [user.email],
          subject: `Nueva cotización de ${quote.customer_name}`,
          html: generateEmailTemplate(quote, user),
        }),
      });

      if (res.ok) {
        emailSent = true;
        console.log(JSON.stringify({ event: "EMAIL_SENT", to: user.email }));
      } else {
        console.error("Resend Error:", await res.text());
      }
    }

    // E. Enviar WhatsApp (Twilio)
    // Validamos que tenga teléfono y credenciales antes de intentar
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (hasWhatsApp && twilioSid && twilioToken && user.phone) {
      try {
        const twilioAuth = btoa(`${twilioSid}:${twilioToken}`);
        const message = generateWhatsAppMessage(quote, user);

        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `whatsapp:${user.phone}`, // Asegúrate que user.phone tenga formato E.164 o limpio
            From: `whatsapp:${twilioPhone}`,
            Body: message,
          }),
        });

        if (twilioRes.ok) {
          whatsappSent = true;
          console.log(JSON.stringify({ event: "WHATSAPP_SENT", to: user.phone }));
        } else {
          console.error("Twilio Error:", await twilioRes.text());
        }
      } catch (err) {
        console.error("Twilio Fetch Error:", err);
      }
    }

    return new Response(JSON.stringify({ success: true, emailSent, whatsappSent }), {
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

// --- HELPERS (Sin cambios lógicos, solo limpieza) ---

function generateEmailTemplate(quote: any, user: any) {
  const items = quote.quote_items || [];
  const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

  const itemsHTML = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toLocaleString("es-MX")}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>$${item.subtotal.toLocaleString("es-MX")}</strong></td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Nueva Cotización Recibida</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hola <strong>${user.business_name || user.full_name}</strong>,</p>
        <p>Has recibido una cotización del catálogo <strong>${quote.digital_catalogs.name}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #667eea; margin: 0;">Datos del Cliente</h3>
          <p style="margin: 5px 0;"><strong>Nombre:</strong> ${quote.customer_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${quote.customer_email}</p>
          ${quote.customer_phone ? `<p style="margin: 5px 0;"><strong>Tel:</strong> ${quote.customer_phone}</p>` : ""}
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background: #f0f0f0;"><th align="left">Prod</th><th>Cant</th><th>$$</th><th>Sub</th></tr></thead>
            <tbody>${itemsHTML}</tbody>
            <tfoot><tr><td colspan="4" align="right" style="padding-top:10px; font-size:18px;"><strong>Total: $${total.toLocaleString("es-MX")}</strong></td></tr></tfoot>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL")}/quotes/${quote.id}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWhatsAppMessage(quote: any, user: any) {
  const items = quote.quote_items || [];
  const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  return `🔔 *Nueva Cotización Recibida*\n\n📦 Catálogo: ${quote.digital_catalogs.name}\n\n👤 *Cliente:* ${quote.customer_name}\n📧 Email: ${quote.customer_email}\n💰 *Total:* $${total.toLocaleString("es-MX")} MXN\n\nVer detalles en tu dashboard 👉`;
}
