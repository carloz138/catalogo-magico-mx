// ==========================================
// FUNCION: send-quote-accepted-email
// ESTADO: FIX_V6 (FINAL - Integridad DB, UUID Nativo, HASH)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
// 🚫 ELIMINAMOS EL IMPORT DE UUID: Usamos crypto.randomUUID()

// 1. HARDENING: Leer el Hash de la variable de entorno
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH"; 

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Tipo genérico para la info del dueño del catálogo
interface OwnerUserInfo {
    email: string;
    full_name: string;
    business_name: string;
    phone: string | null;
}

Deno.serve(async (req) => {
    // Logging Inicial: Usamos el HASH como trazabilidad
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

        // Initialize Supabase client with SERVICE ROLE
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '', 
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        // A. Obtener detalles de la cotización y del Dueño (L1)
        const { data: quote, error: quoteError } = await supabaseAdmin
            .from('quotes')
            .select(`
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
        
        // 1. LÓGICA DE REPLICACIÓN (Si la distribución está habilitada)
        if (isDistributable) {
            
            // FIX DEFINITIVO: Usamos la API Web nativa
            const activationToken = crypto.randomUUID(); 

            // 1.1. Inserción Defensiva en replicated_catalogs (Checar si ya existe una réplica para esta quote)
            const { data: existingReplica } = await supabaseAdmin
                .from('replicated_catalogs')
                .select('id, activation_token')
                .eq('quote_id', quoteId)
                .maybeSingle();
            
            if (existingReplica) {
                // ⬅️ URL CANÓNICA: Se usa ?token=
                invitationLink = `${Deno.env.get('SITE_URL')}/activate?token=${existingReplica.activation_token}`;
                console.warn(`WARN: Replica already exists for quote ${quoteId}. Reusing token.`);
            } else {
                
                // 1.2. Crear la fila en replicated_catalogs
                const { error: insertError } = await supabaseAdmin
                    .from('replicated_catalogs')
                    .insert({
                        original_catalog_id: quote.catalog_id,
                        reseller_id: null,
                        quote_id: quoteId,
                        activation_token: activationToken,
                        is_active: false,
                        // ⬅️ CRÍTICO: FIX DE INTEGRIDAD. distributor_id es el dueño del catálogo
                        distributor_id: quote.digital_catalogs.user_id 
                    });
                
                if (insertError) {
                    console.error('❌ Error al crear replicated_catalogs:', insertError);
                    throw new Error("Failed to register replication link in DB.");
                }

                // 1.3. Construir el Magic Link (Fase C) - ⬅️ URL CANÓNICA: Se usa ?token=
                invitationLink = `${Deno.env.get('SITE_URL')}/activate?token=${activationToken}`;
                console.log(`🔗 Magic Link creado: ${invitationLink}`);
            }
        } else {
            console.log(`INFO: Distribution disabled for catalog ${quote.catalog_id}. Skipping replication.`);
        }

        // 2. ACTUALIZACIÓN DEL ESTADO (Atomicidad de la Cotización)
        const { error: statusError } = await supabaseAdmin
            .from('quotes')
            .update({ status: 'accepted' })
            .eq('id', quoteId);

        if (statusError) {
            console.error('❌ Error al actualizar el estado de la cotización:', statusError);
        }

        // 3. Obtener info del usuario L1/L2 (Dueño) para el email
        const ownerId = quote.digital_catalogs.user_id;
        let userData = await getOwnerData(supabaseAdmin, ownerId);
        
        // 4. Envío del Email
        if (!Deno.env.get('RESEND_API_KEY')) {
            console.warn('⚠️ RESEND_API_KEY no configurado');
            throw new Error('Email service not configured');
        }

        const linkToSend = invitationLink || `${Deno.env.get('SITE_URL')}/track/${quoteId}`;
        const template = generateAcceptedEmailTemplate(quote, linkToSend, customerName, isDistributable, userData);
        
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Catálogos Digitales <noreply@catifypro.com>',
                to: [customerEmail],
                subject: '✅ Tu cotización ha sido aceptada',
                html: template
            })
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('❌ Resend error:', errorText);
            throw new Error(`Failed to send email: ${errorText}`);
        }

        console.log('✅ Email enviado exitosamente a:', customerEmail);

        return new Response(JSON.stringify({
            success: true,
            statusUpdated: !statusError,
            replicationAttempted: isDistributable,
            invitationLink: invitationLink
        }), {
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

// --- HELPER DE BÚSQUEDA ---
async function getOwnerData(supabaseAdmin: any, ownerId: string): Promise<any> {
    const tablesToTry = ['profiles', 'business_info', 'users']; 
    const selectFields = 'email, full_name, business_name, phone';

    for (const tableName of tablesToTry) {
        const { data } = await supabaseAdmin.from(tableName).select(selectFields).eq('id', ownerId).maybeSingle();
        if (data) return data;
    }
    return null;
}

// --- HELPER DE FORMATO DE MONEDA ---
function formatCurrency(valueInCents: number): string {
    const valueInUnits = valueInCents / 100;
    const formatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    };
    return valueInUnits.toLocaleString('es-MX', formatOptions);
}

// --- HELPER DE TEMPLATE DE ACEPTACIÓN ---
function generateAcceptedEmailTemplate(quote: any, linkToSend: string, customerName: string, isDistributable: boolean, userData: any) {
    const items = quote.quote_items || [];
    const totalInCents = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const total = formatCurrency(totalInCents);
    
    const businessName = userData?.business_name || userData?.full_name || 'El proveedor';

    const itemsHTML = items.map((item: any) => `
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

    const activationCTA = isDistributable ? `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <h3 style="color: white; margin-top: 0; margin-bottom: 15px;">🎁 Bono Especial: ¡Activa tu Catálogo Gratis!</h3>
            <p style="color: white; margin-bottom: 20px; font-size: 15px;">
                Como cliente, puedes activar tu propia réplica del catálogo digital de **${businessName}** y empezar a vender los mismos productos.
            </p>
            <a href="${linkToSend}" 
                style="display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Activar Mi Catálogo Gratis
            </a>
        </div>
    ` : '';
    
    const trackingCTA = !isDistributable ? `
        <div style="text-align: center; margin-bottom: 30px;">
            <a href="${linkToSend}" 
                style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ver Estado del Pedido
            </a>
        </div>
    ` : '';


    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <style>
                body { margin: 0; padding: 0; }
                p { margin: 0 0 10px 0; }
            </style>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Cotización Aceptada</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Hola <strong>${customerName}</strong>,
                </p>
                <p style="font-size: 16px; margin-bottom: 30px;">
                    ¡Excelentes noticias! **${businessName}** ha aceptado tu cotización.
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
                        <tbody>${itemsHTML}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>TOTAL:</strong></td>
                                <td style="padding: 15px; text-align: right; font-size: 18px; color: #10b981;"><strong>$${total} MXN</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                ${trackingCTA}
                ${activationCTA}

                <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    Si tienes alguna pregunta, responde a este email para contactar a **${businessName}**.
                </p>
            </div>
        </body>
        </html>
    `;
}
