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
    const { quoteId, customerEmail, customerName } = await req.json();
    
    if (!quoteId || !customerEmail) {
      throw new Error('Quote ID and customer email are required');
    }

    console.log('📧 Enviando email de cotización aceptada:', { quoteId, customerEmail });

    // Initialize Supabase client with SERVICE ROLE
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get tracking token
    const { data: trackingToken, error: tokenError } = await supabaseClient
      .from('quote_tracking_tokens')
      .select('token')
      .eq('quote_id', quoteId)
      .single();

    if (tokenError) {
      console.error('❌ Error obteniendo token:', tokenError);
      throw tokenError;
    }

    if (!trackingToken?.token) {
      throw new Error('No tracking token found for quote');
    }

    const trackingUrl = `${Deno.env.get('SITE_URL')}/track/${trackingToken.token}`;
    console.log('🔗 Tracking URL:', trackingUrl);

    // Get quote details
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        digital_catalogs (
          name,
          user_id,
          users (
            business_name,
            full_name
          )
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError) throw quoteError;

    // Send email using Resend
    if (!Deno.env.get('RESEND_API_KEY')) {
      console.warn('⚠️ RESEND_API_KEY no configurado');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Catálogos Digitales <notifications@catalogify.app>',
        to: [customerEmail],
        subject: '✅ Tu cotización ha sido aceptada',
        html: generateAcceptedEmailTemplate(quote, trackingUrl, customerName),
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log('✅ Email enviado exitosamente a:', customerEmail);

    return new Response(
      JSON.stringify({ 
        success: true,
        trackingUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in send-quote-accepted-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateAcceptedEmailTemplate(quote: any, trackingUrl: string, customerName: string): string {
  const items = quote.quote_items || [];
  const total = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const businessName = quote.digital_catalogs?.users?.business_name || 
                       quote.digital_catalogs?.users?.full_name || 
                       'El proveedor';

  const itemsHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product_name}
        ${item.variant_description ? `<br><small style="color: #666;">${item.variant_description}</small>` : ''}
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
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Cotización Aceptada</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hola <strong>${customerName}</strong>,
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px;">
          ¡Excelentes noticias! <strong>${businessName}</strong> ha aceptado tu cotización.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #10b981; margin-top: 0;">Productos Confirmados</h2>
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
                <td style="padding: 15px; text-align: right; font-size: 18px; color: #10b981;">
                  <strong>$${total.toLocaleString('es-MX')} MXN</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${trackingUrl}" 
             style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Ver Estado del Pedido
          </a>
        </div>

        <!-- CTA para activar catálogo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <h3 style="color: white; margin-top: 0; margin-bottom: 15px;">🎁 Bono Especial</h3>
          <p style="color: white; margin-bottom: 20px; font-size: 15px;">
            Como cliente, puedes activar tu propio catálogo digital GRATIS y empezar a vender los mismos productos con tus propios precios.
          </p>
          <a href="${trackingUrl}" 
             style="display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Activar Mi Catálogo Gratis
          </a>
        </div>
        
        <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          Si tienes alguna pregunta, responde a este email para contactar a ${businessName}
        </p>
      </div>
    </body>
    </html>
  `;
}
