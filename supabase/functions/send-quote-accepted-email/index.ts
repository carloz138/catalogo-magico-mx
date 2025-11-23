// ==========================================
// FUNCION: send-quote-accepted-email
// ESTADO: FIX_V11.0 (SOPORTE PARA ENVÍO Y NEGOCIACIÓN)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "send-quote-accepted-email",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quoteId, customerEmail, customerName } = await req.json();

    if (!quoteId || !customerEmail) {
      throw new Error('Quote ID and customer email are required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // A. Obtener detalles (Ahora traemos shipping_cost y total_amount)
    const { data: quote, error: quoteError } = await supabaseAdmin.from('quotes').select(`
        *,
        quote_items (*),
        digital_catalogs!inner (
            name,
            user_id,
            enable_distribution
        )
    `).eq('id', quoteId).single();

    if (quoteError || !quote) throw quoteError || new Error("Quote not found.");

    const isDistributable = quote.digital_catalogs.enable_distribution;
    let invitationLink = null;

    // 1. LÓGICA DE REPLICACIÓN (Intacta)
    if (isDistributable) {
      const activationToken = crypto.randomUUID();
      const { data: existingReplica } = await supabaseAdmin
        .from('replicated_catalogs')
        .select('id, activation_token')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (existingReplica) {
        invitationLink = `${Deno.env.get('SITE_URL')}/track?token=${existingReplica.activation_token}`;
      } else {
        const { error: insertError } = await supabaseAdmin.from('replicated_catalogs').insert({
          original_catalog_id: quote.catalog_id,
          reseller_id: null,
          quote_id: quoteId,
          activation_token: activationToken,
          is_active: false,
          distributor_id: quote.digital_catalogs.user_id
        });

        if (insertError) {
          console.error('❌ Error al crear replicated_catalogs:', insertError);
        }
        invitationLink = `${Deno.env.get('SITE_URL')}/track?token=${activationToken}`;
      }
    }

    // 2. ACTUALIZACIÓN DEL ESTADO (Aseguramos que esté en accepted)
    // Nota: A veces la función accept-quote-public ya lo puso en accepted, pero esto refuerza.
    await supabaseAdmin.from('quotes').update({ status: 'accepted' }).eq('id', quoteId);

    // 3. Obtener info del dueño
    const ownerId = quote.digital_catalogs.user_id;
    let userData = await getOwnerData(supabaseAdmin, ownerId);

    // 4. Envío del Email
    if (!Deno.env.get('RESEND_API_KEY')) {
      throw new Error('Email service not configured');
    }

    // Usamos el tracking normal si no hay link de activación
    // Intentamos buscar el token de tracking público si no es distribuible
    let trackingLink = invitationLink;
    if (!trackingLink) {
        const { data: tToken } = await supabaseAdmin.from('quote_tracking_tokens').select('token').eq('quote_id', quoteId).maybeSingle();
        if (tToken) {
            trackingLink = `${Deno.env.get('SITE_URL')}/track/${tToken.token}`; // OJO: Ajusta esta ruta a tu routing frontend
        } else {
            trackingLink = `${Deno.env.get('SITE_URL')}/track/order/${quote.order_number}`;
        }
    }

    const template = generateAcceptedEmailTemplate(quote, trackingLink, customerName, isDistributable, userData);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CatifyPro <noreply@catifypro.com>',
        to: [customerEmail],
        subject: `✅ Pedido Confirmado #${quote.order_number || ''}`,
        html: template
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in send-quote-accepted-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// --- HELPERS ---

async function getOwnerData(supabaseAdmin, ownerId) {
  const tablesToTry = ['profiles', 'business_info', 'users'];
  for (const tableName of tablesToTry) {
    const { data } = await supabaseAdmin.from(tableName).select('email, full_name, business_name, phone').eq('id', ownerId).maybeSingle();
    if (data) return data;
  }
  return null;
}

function formatCurrency(valueInCents) {
  return (valueInCents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateAcceptedEmailTemplate(quote, linkToSend, customerName, isDistributable, userData) {
  const items = quote.quote_items || [];
  
  // ✅ CÁLCULOS CORREGIDOS PARA INCLUIR ENVÍO
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingCost = quote.shipping_cost || 0;
  // Si existe total_amount en DB úsalo, si no, calcúlalo
  const totalInCents = quote.total_amount || (itemsSubtotal + shippingCost);

  const businessName = userData?.business_name || userData?.full_name || 'El proveedor';
  
  const itemsHTML = items.map((item) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${item.product_name}
                ${item.variant_description ? `<br><small style="color: #666;">${item.variant_description}</small>` : ''}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${formatCurrency(item.unit_price)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>$${formatCurrency(item.subtotal)}</strong></td>
        </tr>
    `).join('');

  // ✅ FILA DE ENVÍO (Solo si existe)
  const shippingHTML = shippingCost > 0 ? `
    <tr>
        <td colspan="3" style="padding: 10px; text-align: right; color: #666;">Envío / Flete:</td>
        <td style="padding: 10px; text-align: right;">$${formatCurrency(shippingCost)}</td>
    </tr>
  ` : '';

  const activationCTA = isDistributable ? `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <h3 style="color: white; margin-top: 0; margin-bottom: 15px;">🎁 Bono: ¡Vende estos productos!</h3>
            <p style="color: white; margin-bottom: 20px; font-size: 15px;">
                Puedes activar tu propia réplica del catálogo de **${businessName}**.
            </p>
            <a href="${linkToSend}" style="display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold;">Activar Mi Catálogo</a>
        </div>
    ` : '';

    const trackingCTA = !isDistributable && linkToSend ? `
        <div style="text-align: center; margin-bottom: 30px;">
            <a href="${linkToSend}" style="display: inline-block; padding: 15px 40px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Estado del Pedido</a>
        </div>
    ` : '';

  return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
            <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Pedido Confirmado</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Hola <strong>${customerName}</strong>,</p>
                <p>**${businessName}** ha recibido tu confirmación.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h2 style="color: #10b981; margin-top: 0;">Resumen</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="text-align: left; padding: 10px;">Producto</th>
                                <th style="text-align: center;">Cant.</th>
                                <th style="text-align: right;">Precio</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHTML}</tbody>
                        <tfoot>
                            <tr><td colspan="4" style="border-top: 1px solid #ddd;"></td></tr>
                            ${shippingHTML}
                            <tr>
                                <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>TOTAL:</strong></td>
                                <td style="padding: 15px; text-align: right; font-size: 18px; color: #10b981;"><strong>$${formatCurrency(totalInCents)} MXN</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                ${trackingCTA}
                ${activationCTA}
            </div>
        </body>
        </html>
    `;
}
