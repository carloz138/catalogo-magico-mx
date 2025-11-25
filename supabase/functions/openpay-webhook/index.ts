// ==========================================
// FUNCION: openpay-webhook
// DESCRIPCIÓN: Procesa pagos y descuenta inventario
// ESTADO: FIX_INVENTARIO (V2.0)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

Deno.serve(async (req) => {
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION }));

  if (req.method !== 'POST') return new Response("Method Not Allowed", { status: 405 });

  try {
    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Empty body" }), { status: 400 });

    const type = body.type;

    if (type === 'verification') {
        console.log(`✅ Código: ${body.verification_code}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (type !== 'charge.succeeded') {
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    const transaction = body.transaction;
    const openpayId = transaction?.id;

    if (!openpayId) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

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
        return new Response(JSON.stringify({ error: "Not found locally" }), { status: 200 });
    }

    // Idempotencia: Si ya estaba pagada, no hacemos nada (ni descontamos stock doble)
    if (localTx.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: "Already paid" }), { status: 200 });
    }

    console.log(`✅ Pago confirmado: ${localTx.quote_id}. Procesando...`);

    // 1. Actualizar Transacción
    await supabaseAdmin.from('payment_transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', localTx.id);
    
    // 2. Actualizar Cotización (Updated At)
    await supabaseAdmin.from('quotes').update({ updated_at: new Date().toISOString() }).eq('id', localTx.quote_id);

    // 3. 📦 DESCONTAR INVENTARIO (NUEVO)
    console.log(`📦 Descontando stock para Quote: ${localTx.quote_id}`);
    const { error: stockError } = await supabaseAdmin.rpc('process_inventory_deduction', {
        p_quote_id: localTx.quote_id
    });

    if (stockError) {
        console.error("⚠️ Error descontando stock (No crítico para el cobro):", stockError);
    }

    // 4. Enviar Notificación (Ya lo teníamos)
    try {
        await supabaseAdmin.functions.invoke('send-payment-notification', { body: { transactionId: localTx.id } });
    } catch (e) { console.error(e); }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error('❌ Error Webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});
