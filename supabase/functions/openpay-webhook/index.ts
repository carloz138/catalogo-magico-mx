// ==========================================
// FUNCION: openpay-webhook
// ESTADO: FIX_ROBUSTEZ (Manejo de errores de JSON y Métodos)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

Deno.serve(async (req) => {
  // Log de inicio
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION }));

  // 1. FILTRO DE MÉTODO: Webhooks siempre son POST
  if (req.method !== 'POST') {
      console.log(`ℹ️ Método ignorado: ${req.method}`);
      return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 2. PARSEO SEGURO: Evitar "Unexpected end of JSON input"
    // Si falla al leer el JSON, devuelve null en lugar de tronar la función
    const body = await req.json().catch((err) => {
        console.error("⚠️ Error al leer cuerpo JSON:", err.message);
        return null;
    });

    if (!body) {
        return new Response(JSON.stringify({ error: "Empty body" }), { 
            headers: { "Content-Type": "application/json" },
            status: 400 
        });
    }

    // Loguear el payload para cazar el código de verificación
    console.log("📦 PAYLOAD RECIBIDO:", JSON.stringify(body));

    const type = body.type;

    // 3. MANEJO DE VERIFICACIÓN
    if (type === 'verification') {
        console.log(`✅ Código de verificación recibido: ${body.verification_code}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 4. FILTRADO DE EVENTOS
    if (type !== 'charge.succeeded') {
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    // --- Lógica de Pago (Igual que antes) ---
    const transaction = body.transaction;
    const openpayId = transaction?.id;

    if (!openpayId) {
        console.error("❌ Payload sin ID de transacción");
        return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
    }

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
        // Retornamos 200 para evitar reintentos infinitos de Openpay si es un error nuestro de datos
        return new Response(JSON.stringify({ error: "Not found locally" }), { status: 200 });
    }

    if (localTx.status === 'paid') {
        return new Response(JSON.stringify({ success: true, message: "Already paid" }), { status: 200 });
    }

    console.log(`✅ Pago confirmado para Quote: ${localTx.quote_id}`);

    // Actualizar DB
    await supabaseAdmin.from('payment_transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', localTx.id);
    await supabaseAdmin.from('quotes').update({ updated_at: new Date().toISOString() }).eq('id', localTx.quote_id);

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error('❌ Error Critico Webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});
