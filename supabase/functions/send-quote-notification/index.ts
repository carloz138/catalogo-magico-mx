// ==========================================
// FUNCION: send-quote-notification
// DESCRIPCIÓN: Notifica al VENDEDOR (Dueño) de una nueva venta
// INTEGRACIÓN: Meta WhatsApp + Resend + Complex Owner Lookup
// ==========================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// 1. HARDENING: Protocolo de Versionado
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

    // 2. OBTENER QUOTE
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
    
    // Helper robusto para buscar datos del dueño
    let user = await getOwnerDataReal(supabaseAdmin, ownerId);

    if (!user || !user.email) {
        throw new Error("Owner user data not found.");
    }
    
    // 4. VERIFICAR SUSCRIPCIÓN (Solo planes pro tienen whats)
    const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('package_id, credit_packages(name)')
        .eq('user_id', ownerId)
        .eq('status', 'active')
        .maybeSingle();
        
    const packageName = subscription?.credit_packages?.name?.toLowerCase() || '';
    const hasWhatsApp = packageName.includes('medio') || packageName.includes('profesional') || packageName.includes('premium') || packageName.includes('empresarial');
    
    let emailSent = false;
    let whatsappSent = false;

    // ---------------------------------------------------------
    // 📧 CANAL 1: EMAIL (Resend)
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
          subject: `Nueva cotización de ${quote.customer_name}`,
          html: generateEmailTemplate(quote, user)
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
                    name: "new_quote_alert", // <--- PLANTILLA META
                    language: { code: "es_MX" },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: user.business_name || "Vendedor" }, // {{1}}
                                { type: "text", text: quote.customer_name }, // {{2}}
                                { type: "text", text: formatCurrency(quote.total_amount || 0) } // {{3}}
                            ]
                        }
                    ]
                }
              })
            });

            if (metaRes.ok) {
              whatsappSent = true;
              console.log("✅ WhatsApp enviado al vendedor");
            } else {
              console.error('Meta API Error:', await metaRes.text());
            }
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

// --- HELPERS OBLIGATORIOS ---

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
    
    // Cascada de teléfonos
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

function generateEmailTemplate(quote: any, user: any) {
    // HTML simple para no saturar el código aquí
    const total = formatCurrency(quote.total_amount || 0);
    return `
      <div style="font-family: Arial;">
        <h2>¡Nueva Venta! 🚀</h2>
        <p>Hola <strong>${user.business_name}</strong>,</p>
        <p>El cliente <strong>${quote.customer_name}</strong> ha creado una cotización.</p>
        <h3>Total: ${total}</h3>
        <a href="https://catifypro.com/quotes/${quote.id}">Ver en Dashboard</a>
      </div>
    `;
}
