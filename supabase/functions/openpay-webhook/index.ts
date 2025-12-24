// ==========================================
// FUNCION: openpay-webhook
// DESCRIPCIÓN: Procesa pagos de Openpay, actualiza inventario y notifica (Email + WhatsApp)
// INTEGRACIÓN: Meta WhatsApp Cloud API
// ==========================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// 1. HARDENING: Protocolo de Versionado
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "openpay-webhook",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const eventType = payload.type;
    const transaction = payload.transaction;

    // Solo nos interesan los cargos exitosos
    if (eventType !== "charge.succeeded" && eventType !== "payout.succeeded") {
        return new Response("Event ignored", { status: 200 });
    }

    console.log(`💰 Procesando pago ${transaction.id} para la orden: ${transaction.description}`);

    // 1. INICIAR SUPABASE
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. BUSCAR LA TRANSACCIÓN PENDIENTE EN NUESTRA BD
    // Openpay nos manda el ID de transacción, lo usamos para matchear
    const { data: localTx, error: txError } = await supabaseAdmin
        .from("payment_transactions")
        .select(`
            *,
            quotes (
                id,
                customer_name,
                customer_phone,
                customer_email,
                order_number,
                total_amount
            )
        `)
        .eq("provider_transaction_id", transaction.id)
        .maybeSingle();

    if (!localTx) {
        // A veces el webhook llega antes que nuestra BD se actualice, o es un pago desconocido
        console.warn("Transacción no encontrada en BD local:", transaction.id);
        return new Response("Transaction not found locally", { status: 200 });
    }

    if (localTx.status === 'paid') {
        console.log("Transacción ya procesada anteriormente.");
        return new Response("Already processed", { status: 200 });
    }

    // 3. ACTUALIZAR ESTADO A PAGADO Y GUARDAR METADATA
    const { error: updateError } = await supabaseAdmin
        .from("payment_transactions")
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            // Guardamos metadata útil de Openpay (ya arreglamos la columna en SQL)
            metadata: transaction,
            funds_held_by_platform: true // <--- ✅ ESTA ES LA ÚNICA LÍNEA NUEVA (Tu candado de seguridad)
        })
        .eq("id", localTx.id);

    if (updateError) throw updateError;

    // 4. DESCONTAR INVENTARIO (CORREGIDO)
    // El RPC espera 'quote_id', no 'quote_uuid'.
    // Al pasar el ID correcto, la función SQL se encarga de revisar si hay variantes o productos simples.
    const { error: stockError } = await supabaseAdmin.rpc('process_inventory_deduction', {
        quote_id: localTx.quote_id  // <--- Validado con tu SQL, esto estaba bien en tu código original
    });

    if (stockError) console.error("❌ Error descontando stock:", stockError);
    else console.log("✅ Stock descontado correctamente (Soportando variantes L1/L2)");

    // 5. NOTIFICACIONES (Email + WhatsApp)
    const quote = localTx.quotes;
    
    // --- EMAIL (Resend) ---
    if (quote.customer_email) {
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "CatifyPro Pagos <noreply@catifypro.com>",
                to: [quote.customer_email],
                subject: `Pago Confirmado - Pedido #${quote.order_number}`,
                html: `<h1>¡Gracias por tu compra!</h1><p>Hemos recibido tu pago de $${(transaction.amount).toFixed(2)}.</p>`
            }),
        });
    }

    // --- WHATSAPP (Meta Cloud API) ---
    if (quote.customer_phone && Deno.env.get("META_ACCESS_TOKEN")) {
        try {
            const phone = quote.customer_phone.replace(/\D/g, "");
            
            if (phone.length >= 10) {
                await fetch(`https://graph.facebook.com/v17.0/${Deno.env.get("META_PHONE_ID")}/messages`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${Deno.env.get("META_ACCESS_TOKEN")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: phone,
                        type: "template",
                        template: {
                            name: "payment_confirmed", 
                            language: { code: "es_MX" },
                            components: [
                                {
                                    type: "body",
                                    parameters: [
                                        { type: "text", text: quote.customer_name }, // {{1}}
                                        { type: "text", text: (transaction.amount).toFixed(2) }, // {{2}}
                                        { type: "text", text: quote.order_number } // {{3}}
                                    ]
                                }
                            ]
                        }
                    })
                });
                console.log("✅ WhatsApp de pago enviado");
            }
        } catch (waError) {
            console.error("Meta API Error:", waError);
        }
    }

    return new Response("Webhook Processed", { status: 200 });

  } catch (error) {
    console.error(`FATAL ERROR in ${DEPLOY_VERSION}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
