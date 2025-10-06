import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    
    if (!quoteId) {
      throw new Error('Quote ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get quote details with items and catalog info
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        digital_catalogs (
          name,
          user_id
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;

    // Get user/business info
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('email, full_name, business_name')
      .eq('id', quote.digital_catalogs.user_id)
      .single();

    if (userError) throw userError;

    // Get user's subscription to check plan
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('package_id, credit_packages(name)')
      .eq('user_id', quote.digital_catalogs.user_id)
      .eq('status', 'active')
      .single();

    const packageName = subscription?.credit_packages?.name?.toLowerCase() || '';
    const hasWhatsApp = 
      packageName.includes('medio') || 
      packageName.includes('profesional') ||
      packageName.includes('premium') ||
      packageName.includes('empresarial');

    let emailSent = false;
    let whatsappSent = false;

    // Send email notification using Resend
    if (Deno.env.get('RESEND_API_KEY')) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Catálogos Digitales <notifications@yourdomain.com>',
            to: [user.email],
            subject: `Nueva cotización de ${quote.customer_name}`,
            html: generateEmailTemplate(quote, user),
          }),
        });

        if (resendResponse.ok) {
          emailSent = true;
          console.log('Email sent successfully');
        } else {
          console.error('Resend error:', await resendResponse.text());
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // Send WhatsApp notification (only for medio/premium plans)
    if (hasWhatsApp && Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN')) {
      try {
        const twilioAuth = btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`);
        
        const message = generateWhatsAppMessage(quote, user);
        
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: `whatsapp:${user.phone || ''}`,
              From: `whatsapp:${Deno.env.get('TWILIO_PHONE_NUMBER') || ''}`,
              Body: message,
            }),
          }
        );

        if (twilioResponse.ok) {
          whatsappSent = true;
          console.log('WhatsApp sent successfully');
        } else {
          console.error('Twilio error:', await twilioResponse.text());
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp:', whatsappError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        emailSent,
        whatsappSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-quote-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateEmailTemplate(quote: any, user: any): string {
  const items = quote.quote_items || [];
  const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  
  const itemsHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product_name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.unit_price.toLocaleString('es-MX')}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        <strong>$${item.subtotal.toLocaleString('es-MX')}</strong>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Nueva Cotización Recibida</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola <strong>${user.business_name || user.full_name}</strong>,
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px;">
          Has recibido una nueva cotización del catálogo <strong>${quote.digital_catalogs.name}</strong>.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #667eea; margin-top: 0;">Datos del Cliente</h2>
          <p><strong>Nombre:</strong> ${quote.customer_name}</p>
          <p><strong>Email:</strong> ${quote.customer_email}</p>
          ${quote.customer_company ? `<p><strong>Empresa:</strong> ${quote.customer_company}</p>` : ''}
          ${quote.customer_phone ? `<p><strong>Teléfono:</strong> ${quote.customer_phone}</p>` : ''}
          ${quote.notes ? `<p><strong>Notas:</strong> ${quote.notes}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #667eea; margin-top: 0;">Productos Cotizados</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cantidad</th>
                <th style="padding: 10px; text-align: right;">Precio Unit.</th>
                <th style="padding: 10px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;">
                  <strong>TOTAL:</strong>
                </td>
                <td style="padding: 15px; text-align: right; font-size: 18px; color: #667eea;">
                  <strong>$${total.toLocaleString('es-MX')} MXN</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get('SUPABASE_URL')}/dashboard/quotes/${quote.id}" 
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

function generateWhatsAppMessage(quote: any, user: any): string {
  const items = quote.quote_items || [];
  const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  
  return `🔔 *Nueva Cotización Recibida*

📦 Catálogo: ${quote.digital_catalogs.name}

👤 *Cliente:* ${quote.customer_name}
📧 Email: ${quote.customer_email}
${quote.customer_company ? `🏢 Empresa: ${quote.customer_company}\n` : ''}

💰 *Total:* $${total.toLocaleString('es-MX')} MXN

Ver detalles completos en tu dashboard 👉`;
}
