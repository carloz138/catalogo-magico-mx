// ==========================================
// FUNCION: openpay-webhook
// DESCRIPCIÓN: Procesa pagos, valida montos y descuenta inventario
// ESTADO: FIX_SEGURIDAD (Validación de Monto Agregada)
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

    // 1. Verificación
    if (type === 'verification') {
        console.log(`✅ Código: ${body.verification_code}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 2. Filtrado
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

    // 3. Buscar Transacción (TRAEMOS EL MONTO ESPERADO)
    const { data: localTx, error: txError } = await supabaseAdmin
        .from('payment_transactions')
        // ✅ IMPORTANTE: Pedimos amount_total para comparar
        .select('id, quote_id, status, amount_total') 
        .eq('provider_transaction_id', openpayId)
        .maybeSingle();

    if (txError || !localTx) {
        console.error(`❌ Transacción no encontrada: ${openpayId}`);
        return new Response(JSON.stringify({ error: "Not found locally" }), { status: 200 });
    }

    // 4. Idempotencia
    if (localTx.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: "Already paid" }), { status: 200 });
    }

    // 🚨 5. VALIDACIÓN DE SEGURIDAD (MONTO) 🚨
    // Openpay manda pesos (float), nosotros guardamos centavos (int)
    const receivedAmount = transaction.amount; // Ej: 100.00
    const expectedAmount = localTx.amount_total / 100; // Ej: 10000 / 100 = 100.00

    // Usamos un margen de error mínimo (0.10) por temas de punto flotante, aunque en SPEI suele ser exacto
    if (Math.abs(receivedAmount - expectedAmount) > 0.10) {
        console.error(`🚨 ALERTA DE FRAUDE: Monto recibido ($${receivedAmount}) no coincide con esperado ($${expectedAmount}). ID: ${openpayId}`);
        // Retornamos 200 para que Openpay deje de intentar (ya recibimos el aviso), 
        // pero NO marcamos como pagado en DB ni soltamos el producto.
        return new Response(JSON.stringify({ error: "Amount mismatch check logs" }), { status: 200 });
    }

    console.log(`✅ Pago validado y confirmado ($${receivedAmount}): ${localTx.quote_id}`);

    // 6. Actualizar DB
    await supabaseAdmin.from('payment_transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', localTx.id);
    await supabaseAdmin.from('quotes').update({ updated_at: new Date().toISOString() }).eq('id', localTx.quote_id);

    // 7. Descontar Stock
    console.log(`📦 Descontando stock...`);
    const { error: stockError } = await supabaseAdmin.rpc('process_inventory_deduction', {
        p_quote_id: localTx.quote_id
    });

    if (stockError) console.error("⚠️ Error stock:", stockError);

    // 8. Notificar Vendedor
    try {
        await supabaseAdmin.functions.invoke('send-payment-notification', { body: { transactionId: localTx.id } });
    } catch (e) { console.error(e); }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error('❌ Error Webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});
