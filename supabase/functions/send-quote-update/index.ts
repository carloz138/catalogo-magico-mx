// ==========================================
// FUNCION: send-quote-update
// DESCRIPCIÓN: Notifica al CLIENTE que el vendedor (L1/L2) actualizó costos/fecha
// ESTADO: FIX_V3.0 (REAL DATA TABLES + AMBIGUOUS FK FIX)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// 1. HARDENING
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

    // 2. OBTENER QUOTE (Con Fix de Ambigüedad)
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

    // 3. IDENTIFICAR AL VENDEDOR (Dueño de la cotización)
    const ownerId = quote.user_id;
    console.log(`🏢 Buscando datos del vendedor ID: ${ownerId}`);

    // 🔥 USAMOS LA FUNCIÓN ROBUSTA CON TUS TABLAS REALES
    const ownerData = await getOwnerDataReal(supabaseAdmin, ownerId);
    
    // Nombre a mostrar en el correo (Negocio > Nombre > Catálogo)
    const providerName = ownerData?.business_name || ownerData?.full_name || quote.digital_catalogs?.name || "El Vendedor";

    console.log(`✅ Proveedor identificado: ${providerName}`);

    // 4. Generar Link de Tracking
    const { data: tokenData } = await supabaseAdmin
      .from('quote_tracking_tokens')
      .select('token')
      .eq('quote_id', quoteId)
      .maybeSingle(); // maybeSingle es más seguro aquí

    const trackingLink = tokenData 
      ? `${Deno.env.get('SITE_URL')}/track/${tokenData.token}` 
      : `${Deno.env.get('SITE_URL')}/track/order/${quote.order_number}`;

    // 5. Formateo de fecha
    let deliveryDateStr = 'Por confirmar';
    if (quote.estimated_delivery_date) {
      const dateObj = new Date(quote.estimated_delivery_date);
      deliveryDateStr = dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    }

    // 6. Enviar Email al CLIENTE
    if (!Deno.env.get('RESEND_API_KEY')) {
      throw new Error("RESEND_API_KEY no configurada");
    }

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
                <p>El proveedor <strong>${providerName}</strong> ha revisado tu solicitud y ha agregado los costos de envío y la fecha estimada de entrega.</p>
                
                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0;">🚚 <strong>Costo de Envío:</strong></td>
                        <td style="text-align: right;">$${(quote.shipping_cost / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;">📅 <strong>Entrega Estimada:</strong></td>
                        <td style="text-align: right;">${deliveryDateStr}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #fcd34d; font-size: 18px;"><strong>💰 Total a Pagar:</strong></td>
                        <td style="padding: 10px 0; border-top: 1px solid #fcd34d; text-align: right; font-size: 18px; color: #d97706;"><strong>$${(quote.total_amount / 100).toFixed(2)}</strong></td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 14px; color: #666;">Para proceder con tu pedido, por favor revisa los detalles y confirma la aceptación.</p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${trackingLink}" style="display: inline-block; background: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Ver y Aceptar Cotización
                    </a>
                </div>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
                Reference ID: ${quoteId} | Ver: ${DEPLOY_VERSION}
            </p>
          </div>
        `
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error enviando email:", errorText);
      throw new Error(`Error Resend: ${errorText}`);
    }

    console.log(`✅ Email de actualización enviado a ${quote.customer_email}`);

    return new Response(JSON.stringify({
      success: true,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(JSON.stringify({
      error: error.message,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// --- HELPERS (Adaptados a tus tablas reales) ---

async function getOwnerDataReal(supabaseAdmin: any, ownerId: string): Promise<any> {
    // 1. Obtener Datos de Negocio (Prioridad 1)
    const { data: business } = await supabaseAdmin
        .from('business_info')
        .select('business_name')
        .eq('user_id', ownerId)
        .maybeSingle();

    // 2. Obtener Datos Personales (Respaldo)
    const { data: profile } = await supabaseAdmin
        .from('users') // TABLA REAL QUE ME PASASTE
        .select('full_name')
        .eq('id', ownerId)
        .maybeSingle();

    // LÓGICA DE EXTRACCIÓN
    const businessName = business?.business_name;
    const fullName = profile?.full_name;

    return {
        business_name: businessName,
        full_name: fullName
    };
}
