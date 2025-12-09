// ==========================================
// FUNCION: send-quote-update
// DESCRIPCIÓN: Notifica al CLIENTE con Link de Tracking GARANTIZADO
// ESTADO: FIX_V4.0 (AUTO-GENERATE TOKEN)
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
    function: "send-quote-update",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    if (!quoteId) throw new Error("quoteId es requerido");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 1. OBTENER QUOTE
    console.log(`🔍 Buscando cotización: ${quoteId}`);
    const { data: quote, error } = await supabaseAdmin
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        digital_catalogs!quotes_catalog_id_fkey (name)
      `)
      .eq('id', quoteId)
      .single();

    if (error || !quote) {
      console.error("❌ Cotización no encontrada", error);
      throw new Error("Quote not found");
    }

    // 2. IDENTIFICAR AL VENDEDOR
    const ownerId = quote.user_id;
    const ownerData = await getOwnerDataReal(supabaseAdmin, ownerId);
    const providerName = ownerData?.business_name || ownerData?.full_name || quote.digital_catalogs?.name || "El Vendedor";

    // 3. GENERAR LINK DE TRACKING (LÓGICA BLINDADA)
    // Intentamos buscar el token existente
    let { data: tokenData } = await supabaseAdmin
      .from('quote_tracking_tokens')
      .select('token')
      .eq('quote_id', quoteId)
      .maybeSingle();

    // 🔥 AUTO-REPARACIÓN: Si no hay token, lo creamos ahora mismo
    if (!tokenData) {
        console.log("⚠️ Token no encontrado. Generando uno nuevo on-the-fly...");
        // Insertamos y retornamos el token generado (asumiendo que tu tabla tiene un default gen_random_uuid() o trigger)
        // Si tu tabla requiere que le pases el token, usamos crypto.randomUUID()
        const newTokenValue = crypto.randomUUID();
        
        const { data: newToken, error: createError } = await supabaseAdmin
            .from('quote_tracking_tokens')
            .insert({ 
                quote_id: quoteId,
                token: newTokenValue, // Aseguramos que se cree
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días validez
            })
            .select('token')
            .single();
            
        if (createError || !newToken) {
            console.error("❌ Error fatal generando token fallback:", createError);
            throw new Error("No se pudo generar el enlace de rastreo.");
        }
        tokenData = newToken;
    }

    // Ahora estamos 100% seguros de que tokenData existe
    const trackingLink = `${Deno.env.get('SITE_URL')}/track/${tokenData.token}`;
    console.log(`🔗 Link generado: ${trackingLink}`);

    // 4. Formateo de fecha
    let deliveryDateStr = 'Por confirmar';
    if (quote.estimated_delivery_date) {
      const dateObj = new Date(quote.estimated_delivery_date);
      deliveryDateStr = dateObj.toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
      });
    }

    // 5. Enviar Email
    if (!Deno.env.get('RESEND_API_KEY')) throw new Error("RESEND_API_KEY falta");

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CatifyPro <noreply@catifypro.com>',
        to: [quote.customer_email],
        subject: `⚠️ Acción Requerida: Cotización #${quote.order_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #f59e0b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">Cotización Actualizada</h2>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Hola <strong>${quote.customer_name}</strong>,</p>
                <p>El proveedor <strong>${providerName}</strong> ha revisado tu solicitud y ha agregado los costos de envío.</p>
                
                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 5px 0;">🚚 <strong>Costo de Envío:</strong></td><td style="text-align: right;">$${(quote.shipping_cost / 100).toFixed(2)}</td></tr>
                    <tr><td style="padding: 5px 0;">📅 <strong>Entrega Estimada:</strong></td><td style="text-align: right;">${deliveryDateStr}</td></tr>
                    <tr><td style="padding: 10px 0; border-top: 1px solid #fcd34d; font-size: 18px;"><strong>💰 Total a Pagar:</strong></td><td style="padding: 10px 0; border-top: 1px solid #fcd34d; text-align: right; font-size: 18px; color: #d97706;"><strong>$${(quote.total_amount / 100).toFixed(2)}</strong></td></tr>
                  </table>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${trackingLink}" style="display: inline-block; background: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Ver y Aceptar Cotización
                    </a>
                </div>
            </div>
          </div>
        `
      })
    });

    if (!res.ok) {
        const txt = await res.text();
        console.error("Error Resend:", txt);
        throw new Error(txt);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

// --- HELPER (El mismo que en la otra función) ---
async function getOwnerDataReal(supabaseAdmin: any, ownerId: string): Promise<any> {
    const { data: business } = await supabaseAdmin.from('business_info').select('business_name').eq('user_id', ownerId).maybeSingle();
    const { data: profile } = await supabaseAdmin.from('users').select('full_name').eq('id', ownerId).maybeSingle();
    return {
        business_name: business?.business_name,
        full_name: profile?.full_name
    };
}
