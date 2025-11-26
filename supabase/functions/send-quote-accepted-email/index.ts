// ==========================================
// FUNCION: send-quote-accepted-email
// ESTADO: FIX_V12.0 (LINKS SEPARADOS: TRACKING Y ACTIVACIÓN)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { quoteId, customerEmail, customerName } = await req.json();

    if (!quoteId || !customerEmail) throw new Error('Datos incompletos');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 1. Obtener datos
    const { data: quote, error: quoteError } = await supabaseAdmin.from('quotes').select(`
        *,
        quote_items (*),
        digital_catalogs!inner (name, user_id, enable_distribution)
    `).eq('id', quoteId).single();

    if (quoteError || !quote) throw new Error("Quote not found.");

    // 2. Generar Links
    const siteUrl = Deno.env.get('SITE_URL');
    
    // A) Link de Tracking (SIEMPRE EXISTE)
    // Buscamos el token público
    let trackingToken = "";
    const { data: tToken } = await supabaseAdmin
        .from('quote_tracking_tokens')
        .select('token')
        .eq('quote_id', quoteId)
        .maybeSingle();
    
    if (tToken) {
        trackingToken = tToken.token;
    } else {
        // Fallback de emergencia si no hay token (no debería pasar)
        trackingToken = quote.order_number || quote.id;
    }
    
    const trackingUrl = `${siteUrl}/track/${trackingToken}`;

    // B) Link de Activación (SOLO SI APLICA)
    let activationUrl = null;
    const isDistributable = quote.digital_catalogs.enable_distribution;

    if (isDistributable) {
        // Buscar o crear token de activación
        const { data: existingReplica } = await supabaseAdmin
            .from('replicated_catalogs')
            .select('activation_token')
            .eq('quote_id', quoteId)
            .maybeSingle();

        if (existingReplica) {
            activationUrl = `${siteUrl}/track?token=${existingReplica.activation_token}`;
        } else {
            const newToken = crypto.randomUUID();
            await supabaseAdmin.from('replicated_catalogs').insert({
                original_catalog_id: quote.catalog_id,
                quote_id: quoteId,
                activation_token: newToken,
                is_active: false,
                distributor_id: quote.digital_catalogs.user_id
            });
            activationUrl = `${siteUrl}/track?token=${newToken}`;
        }
    }

    // 3. Enviar Email
    if (!Deno.env.get('RESEND_API_KEY')) throw new Error('Email service not configured');
    
    const ownerData = await getOwnerData(supabaseAdmin, quote.digital_catalogs.user_id);
    
    // Usamos la nueva función generadora que acepta ambos links
    const template = generateAcceptedEmailTemplate(
        quote, 
        trackingUrl, 
        activationUrl, 
        customerName, 
        ownerData
    );

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

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

// --- HELPERS ---

async function getOwnerData(supabaseAdmin, ownerId) {
  const tablesToTry = ['profiles', 'business_info', 'users'];
  for (const tableName of tablesToTry) {
    const { data } = await supabaseAdmin.from(tableName).select('business_name, full_name').eq('id', ownerId).maybeSingle();
    if (data) return data;
  }
  return null;
}

function formatCurrency(val) {
  return (val / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

function generateAcceptedEmailTemplate(quote, trackingUrl, activationUrl, customerName, userData) {
  const items = quote.quote_items || [];
  const totalInCents = quote.total_amount || items.reduce((s, i) => s + i.subtotal, 0) + (quote.shipping_cost || 0);
  const businessName = userData?.business_name || 'El proveedor';

  const itemsHTML = items.map(i => `
    <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.product_name}</td>
        <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${i.quantity}</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">$${formatCurrency(i.subtotal)}</td>
    </tr>
  `).join('');

  // ✅ AQUI ESTÁ EL ARREGLO VISUAL: DOS BOTONES
  // 1. Botón Principal: Ver Pedido (Tracking)
  const trackingButton = `
    <div style="text-align:center; margin: 30px 0;">
        <a href="${trackingUrl}" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
            📦 Ver Estado del Pedido
        </a>
        <p style="font-size:12px;color:#666;margin-top:10px;">Haz clic aquí para ver la guía de envío y pagar.</p>
    </div>
  `;

  // 2. Botón Secundario: Activar Negocio (Solo si existe activationUrl)
  const activationSection = activationUrl ? `
    <div style="background:#f5f3ff;padding:20px;border-radius:8px;border:1px solid #ddd6fe;margin-top:30px;text-align:center;">
        <h3 style="color:#5b21b6;margin-top:0;">¿Quieres vender esto?</h3>
        <p style="font-size:14px;color:#4b5563;">Activa tu propio catálogo con estos productos y gana dinero.</p>
        <a href="${activationUrl}" style="background:#7c3aed;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;display:inline-block;">
            🚀 Activar mi Negocio Gratis
        </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:#10b981;padding:20px;text-align:center;border-radius:8px 8px 0 0;color:white;">
            <h1 style="margin:0;">¡Pedido Confirmado!</h1>
        </div>
        <div style="padding:20px;border:1px solid #eee;border-top:none;">
            <p>Hola <strong>${customerName}</strong>,</p>
            <p><strong>${businessName}</strong> ha confirmado tu orden.</p>
            
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <thead style="background:#f9fafb;">
                    <tr><th style="text-align:left;padding:8px;">Producto</th><th>Cant.</th><th style="text-align:right;">Total</th></tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align:right;padding:10px;font-weight:bold;">Total:</td>
                        <td style="text-align:right;padding:10px;font-weight:bold;color:#10b981;">$${formatCurrency(totalInCents)}</td>
                    </tr>
                </tfoot>
            </table>

            ${trackingButton}
            ${activationSection}
        </div>
    </body>
    </html>
  `;
}
