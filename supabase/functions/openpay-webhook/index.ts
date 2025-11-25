// ==========================================
// FUNCION: openpay-webhook
// DESCRIPCIÓN: Recibe notificaciones de Openpay (Pagos SPEI recibidos)
// ESTADO: V1.0 (CON HASHING PROTOCOL)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "WEBHOOK_RECEIVED",
    function: "openpay-webhook",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  try {
    const body = await req.json();
    const type = body.type;
    
    console.log(`🔔 Evento recibido: ${type}`);

    // 1. MANEJO DE VERIFICACIÓN (Openpay a veces manda esto para probar la URL)
    if (type === 'verification') {
        console.log("✅ Verificación de Webhook exitosa");
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 2. FILTRADO: Solo nos interesa cuando el dinero cae (charge.succeeded)
    // También podríamos escuchar 'charge.refunded' en el futuro
    if (type !== 'charge.succeeded') {
        console.log("ℹ️ Evento ignorado (no es pago exitoso)");
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    const transaction = body.transaction;
    const openpayId = transaction.id; // El ID que empieza con 'tr...'

    if (!openpayId) throw new Error("Payload sin ID de transacción");

    // 3. CONECTAR A SUPABASE
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    );

    // 4. BUSCAR LA TRANSACCIÓN EN NUESTRA DB
    const { data: localTx, error: txError } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, quote_id, status')
        .eq('provider_transaction_id', openpayId)
        .maybeSingle();

    if (txError) {
        console.error("Error DB:", txError);
        throw txError;
    }

    if (!localTx) {
        console.error(`❌ Transacción no encontrada en sistema local: ${openpayId}`);
        // Retornamos 200 para que Openpay no siga reintentando un error que es nuestro
        return new Response(JSON.stringify({ error: "Transaction not found locally" }), { status: 200 });
    }

    if (localTx.status === 'paid') {
        console.log("ℹ️ La transacción ya estaba pagada. Idempotencia.");
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // 5. ACTUALIZAR ESTADOS (El momento de la verdad)
    console.log(`✅ Pago confirmado para Quote: ${localTx.quote_id}`);

    // A) Marcar transacción como PAGADA
    await supabaseAdmin
        .from('payment_transactions')
        .update({ 
            status: 'paid',
            paid_at: new Date().toISOString()
        })
        .eq('id', localTx.id);

    // B) Asegurar que la cotización esté en ACCEPTED (o moverla a un estado especial si quisieras)
    // Nota: Ya debería estar en 'accepted', pero esto confirma el flujo.
    // Podríamos cambiar el status a 'processing' si tuvieras ese estado.
    await supabaseAdmin
        .from('quotes')
        .update({ 
            // Opcional: Podrías agregar una columna 'payment_status' a quotes
            updated_at: new Date().toISOString() 
        })
        .eq('id', localTx.quote_id);

    // 6. NOTIFICACIÓN AL VENDEDOR (Opcional pero recomendado)
    // Aquí podrías invocar 'send-payment-notification' para avisarle al dueño que ya cobró.
    // Por ahora solo loggeamos.
    console.log("🚀 TODO: Enviar email de 'Dinero Recibido' al vendedor.");

    return new Response(JSON.stringify({ success: true }), { 
        headers: { "Content-Type": "application/json" },
        status: 200 
    });

  } catch (error) {
    console.error('❌ Error Webhook:', error);
    // En caso de error real de servidor, devolvemos 500 para que Openpay reintente
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { "Content-Type": "application/json" },
        status: 500 
    });
  }
});
