// ==========================================
// FUNCION: send-quote-notification
// ESTADO: FIX_V10 (FINAL - Estética Corregida y URL Acortada)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// 1. HARDENING: Leer el Hash de la variable de entorno para inmutabilidad
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH"; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// --- FUNCIÓN PRINCIPAL (Deno.serve) ---

Deno.serve(async (req) => {
  // Logging Inicial: Usamos el HASH como trazabilidad
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "send-quote-notification",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    if (!quoteId) throw new Error('Quote ID is required');

    // 2. CLIENTE ADMIN (CRÍTICO): Usamos Service Role
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
        { auth: { persistSession: false } }
    );

    // A. Obtener quote, items y catálogo
    const { data: quote, error: quoteError } = await supabaseAdmin.from('quotes').select(`
                *,
                quote_items (*),
                digital_catalogs (
                    name,
                    user_id
                )
            `).eq('id', quoteId).single();

    if (quoteError || !quote || !quote.digital_catalogs?.user_id) {
      console.error(`Error fetching quote/catalog: ${JSON.stringify(quoteError || 'No user_id')}`);
      throw new Error("Quote or Owner Catalog ID not found in database.");
    }

    // B. Obtener datos del Dueño (L1/L2)
    const ownerId = quote.digital_catalogs.user_id;
    let user = await getOwnerData(supabaseAdmin, ownerId);

    if (!user) {
        throw new Error("Owner user data (profile/email) not accessible.");
    }
    
    // C. Verificar Suscripción para WhatsApp
    const { data: subscription } = await supabaseAdmin.from('subscriptions').select('package_id, credit_packages(name)').eq('user_id', ownerId).eq('status', 'active').single();
    const packageName = subscription?.credit_packages?.name?.toLowerCase() || '';
    const hasWhatsApp = packageName.includes('medio') || packageName.includes('profesional') || packageName.includes('premium') || packageName.includes('empresarial');
    let emailSent = false;
    let whatsappSent = false;

    // D. Enviar Email (Resend)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Catálogos Digitales <noreply@catifypro.com>',
          to: [user.email],
          subject: `Nueva cotización de ${quote.customer_name}`,
          html: generateEmailTemplate(quote, user)
        })
      });
      if (res.ok) {
        emailSent = true;
        console.log(JSON.stringify({ event: "EMAIL_SENT", to: user.email }));
      } else {
        console.error('Resend Error:', await res.text());
      }
    }

    // E. Enviar WhatsApp (Twilio)
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    if (hasWhatsApp && twilioSid && twilioToken && user.phone) {
      try {
        const twilioAuth = btoa(`${twilioSid}:${twilioToken}`);
        const message = generateWhatsAppMessage(quote, user);
        
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: `whatsapp:${user.phone}`,
            From: `whatsapp:${twilioPhone}`,
            Body: message
          })
        });
        if (twilioRes.ok) {
          whatsappSent = true;
          console.log(JSON.stringify({ event: "WHATSAPP_SENT", to: user.phone }));
      } else {
        console.error('Twilio Error:', await twilioRes.text());
      }
      } catch (err) {
        console.error('Twilio Fetch Error:', err);
      }
    }

    return new Response(JSON.stringify({ success: true, emailSent, whatsappSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error(`FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});


// --- HELPERS REQUERIDOS ---

// Helper de búsqueda de usuario (reutilizado)
async function getOwnerData(supabaseAdmin: any, ownerId: string): Promise<any> {
    const tablesToTry = ['profiles', 'business_info', 'users']; 
    const selectFields = 'email, full_name, business_name, phone';

    for (const tableName of tablesToTry) {
        const { data } = await supabaseAdmin.from(tableName).select(selectFields).eq('id', ownerId).maybeSingle();
        if (data) return data;
    }
    return null;
}

// Helper de formato de moneda (corrige centavos)
function formatCurrency(valueInCents: number): string {
    const valueInUnits = valueInCents / 100;
    const formatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    return valueInUnits.toLocaleString('es-MX', formatOptions);
}

// Helper para el cuerpo del Email (HTML) - CORRECCIONES APLICADAS AQUÍ
function generateEmailTemplate(quote: any, user: any) {
    const items = quote.quote_items || [];
    const totalInCents = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const total = formatCurrency(totalInCents);
    const businessName = user.business_name || user.full_name || 'El proveedor';

    const itemsHTML = items.map((item: any) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
                ${item.product_name} 
                ${item.variant_description ? `<br><small style="color: #666; line-height: 1.2;">${item.variant_description}</small>` : ''}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${formatCurrency(item.unit_price)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>$${formatCurrency(item.subtotal)}</strong></td>
        </tr>
    `).join('');

    // La URL de tu Dashboard debe estar configurada en SITE_URL o una variable similar.
    const dashboardUrl = Deno.env.get('SITE_URL') || 'https://dashboard.catifypro.com';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <style>
                body { margin: 0; padding: 0; }
                p { margin: 0 0 8px 0; } /* Menos margen en párrafos */
            </style>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;"> 
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Nueva Cotización Recibida</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hola <strong>${businessName}</strong>,
                </p>
                
                <p style="font-size: 16px; margin-bottom: 30px;">
                    Has recibido una nueva cotización del catálogo <strong>${quote.digital_catalogs.name}</strong>.
                </p>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin-top: 0; margin-bottom: 10px;">Datos del Cliente</h2>
                    <p><strong>Nombre:</strong> ${quote.customer_name}</p>
                    <p><strong>Email:</strong> ${quote.customer_email}</p>
                    ${quote.customer_company ? `<p><strong>Empresa:</strong> ${quote.customer_company}</p>` : ''}
                    ${quote.customer_phone ? `<p><strong>Teléfono:</strong> ${quote.customer_phone}</p>` : ''}
                    ${quote.notes ? `<p style="margin-top: 10px;"><strong>Notas:</strong> ${quote.notes}</p>` : ''}
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #667eea; margin-top: 0; margin-bottom: 10px;">Productos Cotizados</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="padding: 8px; text-align: left;">Producto</th>
                                <th style="padding: 8px; text-align: center;">Cant.</th>
                                <th style="padding: 8px; text-align: right;">Precio Unit.</th>
                                <th style="padding: 8px; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right; font-size: 16px;">
                                    <strong>TOTAL:</strong>
                                </td>
                                <td style="padding: 10px; text-align: right; font-size: 16px; color: #667eea;">
                                    <strong>$${total} MXN</strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${dashboardUrl}/quotes/${quote.id}" 
                        style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Ver Cotización Completa
                    </a>
                </div>
                
                <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    Responde rápido para no perder la venta 🚀
                </p>
            </div>
        </body>
        </html>
    `;
}

// Helper para el cuerpo del WhatsApp
function generateWhatsAppMessage(quote: any, user: any) {
    const items = quote.quote_items || [];
    const totalInCents = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const total = formatCurrency(totalInCents);
    const businessName = user.business_name || user.full_name || 'El proveedor';

    return `🔔 *Nueva Cotización Recibida*
📦 Catálogo: ${quote.digital_catalogs.name}
👤 *Cliente:* ${quote.customer_name}
📧 Email: ${quote.customer_email}
${quote.customer_company ? `🏢 Empresa: ${quote.customer_company}\n` : ''}

💰 *Total:* $${total} MXN

Ver detalles completos en tu dashboard 👉`;
}
