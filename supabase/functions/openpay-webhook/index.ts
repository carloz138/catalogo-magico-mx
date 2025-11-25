// ==========================================
// FUNCION: openpay-webhook
// DESCRIPCIÓN: Recibe notificaciones de Openpay
// ESTADO: DEBUG_MODE (Para ver el código de verificación)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

Deno.serve(async (req) => {
  // Log de inicio
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION }));

  try {
    // 1. Leer el cuerpo INMEDIATAMENTE
    const body = await req.json();

    // 🚨 ESTA ES LA LÍNEA IMPORTANTE: Imprimir todo lo que manda Openpay
    console.log("📦 PAYLOAD RECIBIDO (BUSCA EL CÓDIGO AQUÍ):", JSON.stringify(body));

    const type = body.type;

    // 2. MANEJO DE VERIFICACIÓN (Para poner el foquito en verde)
    if (type === 'verification') {
        console.log(`✅ Código de verificación recibido: ${body.verification_code}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 3. FILTRADO: Solo nos interesa pago exitoso
    if (type !== 'charge.succeeded') {
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    // ... Resto de la lógica de pago (se mantiene igual) ...
    const transaction = body.transaction;
    const openpayId = transaction.id;

    if (!openpayId) throw new Error("Payload sin ID de transacción");

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    );

    const { data: localTx, error: txError } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, quote_id, status')
        .eq('provider_transaction_id', openpayId)
        .maybeSingle();

    if (txError || !localTx) {
        console.error(`❌ Transacción no encontrada: ${openpayId}`);
        return new Response(JSON.stringify({ error: "Not found" }), { status: 200 });
    }

    if (localTx.status === 'paid') {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    console.log(`✅ Pago confirmado para Quote: ${localTx.quote_id}`);

    await supabaseAdmin.from('payment_transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', localTx.id);
    await supabaseAdmin.from('quotes').update({ updated_at: new Date().toISOString() }).eq('id', localTx.quote_id);

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error('❌ Error Webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});
