// ==========================================
// FUNCION: send-quote-notification
// DESCRIPCIÓN: Notifica al VENDEDOR con Email Detallado y WhatsApp
// ==========================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ✅ PROTOCOLO DE VERSIONADO INTACTO
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
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

    // 1. SUPABASE ADMIN
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
        { auth: { persistSession: false } }
    );

    // 2. OBTENER QUOTE Y SUS ITEMS
    const { data: quote, error: quoteError } = await supabaseAdmin
        .from('quotes')
        .select(`
            *,
            quote_items (*),
            digital_catalogs!quotes_catalog_id_fkey (name)
        `)
        .eq('id', quoteId)
        .single();

    if (quoteError || !quote) {
      console.error(`Error fetching quote: ${JSON.stringify(quoteError)}`);
      throw new Error("Quote not found.");
    }

    // 3. IDENTIFICAR AL VENDEDOR
    const ownerId = quote.user_id; 
    let user = await getOwnerDataReal(supabaseAdmin, ownerId);

    if (!user || !user.email) {
        throw new Error("Owner user data not found.");
    }
    
    // 4. PREPARACIÓN DE ENVÍO
    const hasWhatsApp = true; 
    let emailSent = false;
    let whatsappSent = false;

    // ---------------------------------------------------------
    // 📧 CANAL 1: EMAIL (Resend) - AHORA USA EL TEMPLATE MEJORADO
    // ---------------------------------------------------------
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
          subject: `Nueva venta de ${quote.customer_name} (${formatCurrency(quote.total_amount || 0)})`,
          html: generateEmailTemplate(quote, user) // <--- AQUÍ ESTÁ EL CAMBIO
        })
      });

      if (res.ok) emailSent = true;
    }

    // ---------------------------------------------------------
    // 🟢 CANAL 2: WHATSAPP (Meta Cloud API)
    // ---------------------------------------------------------
    const metaToken = Deno.env.get('META_ACCESS_TOKEN');
    const metaPhoneId = Deno.env.get('META_PHONE_ID');

    if (hasWhatsApp && metaToken && metaPhoneId && user.phone) {
      try {
        const cleanPhone = user.phone.replace(/\D/g, ''); 
        
        if (cleanPhone.length >= 10) {
            console.log(`📲 Enviando WhatsApp a dueño: ${cleanPhone}`);
            
            const metaRes = await fetch(`https://graph.facebook.com/v17.0/${metaPhoneId}/messages`, {
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
                    name: "new_quote_alert",
                    language: { code: "es_MX" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: user.business_name || "Vendedor" }, // {{1}}
                                { type: "text", text: quote.customer_name }, // {{2}}
                                { type: "text", text: formatCurrency(quote.total_amount || 0) } // {{3}}
                            ]
                        },
                        {
                            type: "button",
                            sub_type: "url",
                            index: 0,
                            parameters: [
                                { type: "text", text: quote.id }
                            ]
                        }
                    ]
                }
              })
            });

            if (metaRes.ok) {
              whatsappSent = true;
              console.log("✅ WhatsApp con botón enviado");
            } else {
              const errorData = await metaRes.text();
              console.error('Meta API Error:', errorData);
            }
        } else {
            console.log(`⚠️ Teléfono inválido: ${user.phone}`);
        }
      } catch (err) {
        console.error('Meta Fetch Error:', err);
      }
    }

    return new Response(JSON.stringify({ 
        success: true, 
        emailSent, 
        whatsappSent, 
        version: DEPLOY_VERSION 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error(`FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// --- HELPERS ---

async function getOwnerDataReal(supabaseAdmin: any, ownerId: string): Promise<any> {
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(ownerId);
    const email = authData?.user?.email;

    const { data: business } = await supabaseAdmin
        .from('business_info')
        .select('business_name, phone, social_media')
        .eq('user_id', ownerId)
        .maybeSingle();

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('full_name, phone')
        .eq('id', ownerId)
        .maybeSingle();

    const displayName = business?.business_name || profile?.full_name || "Vendedor";
    let phone = "";
    
    // Prioridad de teléfono
    if (business?.social_media && typeof business.social_media === 'object') {
        const social = business.social_media as any;
        if (social.whatsapp) phone = social.whatsapp;
    }
    if (!phone && business?.phone) phone = business.phone;
    if (!phone && profile?.phone) phone = profile.phone;
    if (!phone && authData?.user?.phone) phone = authData.user.phone;

    return {
        email: email,
        business_name: displayName,
        full_name: profile?.full_name || displayName,
        phone: phone
    };
}

function formatCurrency(valueInCents: number): string {
    const valueInUnits = valueInCents / 100;
    return `$${valueInUnits.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ✅ FUNCIÓN DE EMAIL ACTUALIZADA (CAMBIO ÚNICO Y NECESARIO)
function generateEmailTemplate(quote: any, user: any) {
    const total = formatCurrency(quote.total_amount || 0);
    const isPickup = quote.delivery_method === 'pickup';
    // Determina etiqueta visualmente clara
    const deliveryLabel = isPickup ? "📍 RECOLECCIÓN EN TIENDA" : "🚚 ENVÍO A DOMICILIO";
    
    // Si es envío, mostramos dirección. Si es pickup, ocultamos.
    const addressHtml = (!isPickup && quote.shipping_address) 
      ? `<p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">
           <strong>Destino:</strong> ${typeof quote.shipping_address === 'string' ? quote.shipping_address : (quote.shipping_address.street || 'Dirección en dashboard')}
         </p>` 
      : '';

    // Generar filas de la tabla de productos con variantes
    const itemsHtml = (quote.quote_items || []).map((item: any) => {
      const subtotal = formatCurrency(item.subtotal || 0);
      const variantInfo = item.variant_description 
        ? `<br><span style="color: #666; font-size: 12px; font-style: italic;">${item.variant_description}</span>` 
        : '';
      
      const imageCell = item.product_image_url 
        ? `<img src="${item.product_image_url}" width="40" height="40" style="border-radius: 4px; object-fit: cover;">`
        : '<span style="font-size: 20px;">📦</span>';

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 8px; width: 50px; text-align: center;">${imageCell}</td>
          <td style="padding: 12px 8px;">
            <div style="font-weight: bold; color: #334155;">${item.product_name}</div>
            ${variantInfo}
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #64748b;">${item.quantity}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #334155;">${subtotal}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px;">¡Nueva Venta Confirmada!</h2>
        </div>
        
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${user.business_name}</strong>,</p>
          <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
            Tienes un nuevo pedido de <strong>${quote.customer_name}</strong>.
          </p>
          
          <div style="background-color: ${isPickup ? '#fffbeb' : '#f1f5f9'}; border: 1px solid ${isPickup ? '#fcd34d' : '#e2e8f0'}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: bold; font-size: 15px; color: ${isPickup ? '#92400e' : '#334155'};">
              ${deliveryLabel}
            </p>
            ${addressHtml}
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px; text-align: center; color: #64748b; font-weight: 600;">#</th>
                <th style="padding: 8px; text-align: left; color: #64748b; font-weight: 600;">Producto</th>
                <th style="padding: 8px; text-align: center; color: #64748b; font-weight: 600;">Cant.</th>
                <th style="padding: 8px; text-align: right; color: #64748b; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 10px; padding-top: 10px; border-top: 2px solid #e2e8f0;">
            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #0f172a;">Total: ${total}</p>
          </div>

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://catifypro.com/quotes/${quote.id}" 
               style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Gestionar Pedido en Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding-top: 20px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            ID del Pedido: ${quote.id}
          </p>
        </div>
      </div>
    `;
}
