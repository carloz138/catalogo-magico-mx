// ==========================================
// FUNCION: send-quote-notification
// DESCRIPCIÓN: Notifica al VENDEDOR (L1 o L2) de una nueva venta
// ESTADO: FIX_V12 (URL DASHBOARD CORREGIDA)
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
  // Logging Inicial
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

    // 2. CLIENTE ADMIN
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
        { auth: { persistSession: false } }
    );

    // A. Obtener quote
    const { data: quote, error: quoteError } = await supabaseAdmin.from('quotes').select(`
                *,
                quote_items (*),
                digital_catalogs (name)
            `).eq('id', quoteId).single();

    if (quoteError || !quote) {
      console.error(`Error fetching quote: ${JSON.stringify(quoteError)}`);
      throw new Error("Quote not found in database.");
    }

    // B. IDENTIFICAR AL DESTINATARIO (FIX MULTI-TENANT)
    // Usamos quote.user_id para asegurar que le llegue al Revendedor L2 si aplica
    const ownerId = quote.user_id; 

    console.log(`🔔 Notificando al Vendedor ID: ${ownerId}`);

    let user = await getOwnerData(supabaseAdmin, ownerId);

    if (!user) {
        throw new Error("Owner user data not accessible.");
    }
    
    // C. Verificar Suscripción WhatsApp
    const { data: subscription } = await supabaseAdmin.from('subscriptions').select('package_id, credit_packages(name)').eq('user_id', ownerId).eq('status', 'active').maybeSingle();
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


// --- HELPERS ---

async function getOwnerData(supabaseAdmin: any, ownerId: string): Promise<any> {
    const tablesToTry = ['profiles', 'business_info']; 
    const selectFields = 'email, full_name, business_name, phone';

    for (const tableName of tablesToTry) {
        const { data } = await supabaseAdmin.from(tableName).select(selectFields).eq('user_id', ownerId).maybeSingle(); 
        if (data) return data;
    }
    const { data } = await supabaseAdmin.from('profiles').select('email, full_name, phone').eq('id', ownerId).maybeSingle();
    return data;
}

function formatCurrency(valueInCents: number): string {
    const valueInUnits = valueInCents / 100;
    return valueInUnits.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 📧 TEMPLATE EMAIL CORREGIDO
function generateEmailTemplate(quote: any, user: any) {
    const items = quote.quote_items || [];
    const totalInCents = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const total = formatCurrency(totalInCents);
    const businessName = user.business_name || user.full_name || 'Vendedor';

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

    // ✅ CORRECCIÓN 1: URL Base limpia
    // Asumimos que SITE_URL es "https://catifypro.com" sin slash al final
    const siteUrl = Deno.env.get('SITE_URL') || 'https://catifypro.com';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <style>
                body { margin: 0; padding: 0; }
                p { margin: 0 0 8px 0; }
            </style>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.3; color: #333; max-width: 600px; margin: 0 auto; padding: 0;"> 
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">¡Nueva Venta! 🚀</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hola <strong>${businessName}</strong>,
                </p>
                <p style="font-size: 16px; margin-bottom: 30px;">
                    Tienes una nueva cotización generada desde tu catálogo <strong>${quote.digital_catalogs?.name || 'Digital'}</strong>.
                </p>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin-top: 0; margin-bottom: 10px;">Datos del Cliente</h2>
                    <p><strong>Nombre:</strong> ${quote.customer_name}</p>
                    <p><strong>Email:</strong> ${quote.customer_email}</p>
                    ${quote.customer_phone ? `<p><strong>Teléfono:</strong> ${quote.customer_phone}</p>` : ''}
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #667eea; margin-top: 0; margin-bottom: 10px;">Resumen</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tbody>${itemsHTML}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right; font-size: 16px;"><strong>TOTAL:</strong></td>
                                <td style="padding: 10px; text-align: right; font-size: 16px; color: #667eea;"><strong>$${total} MXN</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${siteUrl}/quotes/${quote.id}" 
                        style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Gestionar Venta en Dashboard
                    </a>
                </div>
            </div>
        </body>
        </html>
    `;
}

// 📱 TEMPLATE WHATSAPP CORREGIDO
function generateWhatsAppMessage(quote: any, user: any) {
    const items = quote.quote_items || [];
    const totalInCents = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const total = formatCurrency(totalInCents);
    
    // ✅ CORRECCIÓN 3: URL WhatsApp
    // Hardcoded para asegurar la estructura exacta que pediste
    return `🔔 *Nueva Cotización Recibida*
📦 Catálogo: ${quote.digital_catalogs?.name || 'Tu Catálogo'}
👤 *Cliente:* ${quote.customer_name}
💰 *Total:* $${total} MXN

Ingresa a tu dashboard para responder:
https://catifypro.com/quotes/${quote.id}`;
}
