// ==========================================
// FUNCION: create-quote-payment
// DESCRIPCIÓN: Genera una ficha de pago SPEI en Openpay para una COTIZACIÓN
// ESTADO: V1.2 (CON DEMO PATCH & HASHING ENV)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// RECOMENDACIÓN: Cambié el fallback a "DEMO_PATCH_ACTIVE" por si la var de entorno no existe
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "DEMO_PATCH_ACTIVE";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helpers Openpay
const getOpenpayUrl = () => {
  const isSandbox = Deno.env.get('OPENPAY_SANDBOX_MODE') === 'true';
  const merchantId = Deno.env.get('OPENPAY_MERCHANT_ID');
  return isSandbox 
    ? `https://sandbox-api.openpay.mx/v1/${merchantId}`
    : `https://api.openpay.mx/v1/${merchantId}`;
};

const getAuthHeader = () => {
  const privateKey = Deno.env.get('OPENPAY_PRIVATE_KEY') || '';
  return `Basic ${btoa(privateKey + ':')}`;
};

Deno.serve(async (req) => {
  // Logging Inicial
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "create-quote-payment",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { quoteId } = await req.json();
    if (!quoteId) throw new Error("Quote ID requerido");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // =================================================================
    // 🚧 DETECTOR DE MODO DEMO (PARCHE TEMPORAL)
    // =================================================================
    const DEMO_ID = "00000000-0000-0000-0000-000000000000";
    const isDemo = quoteId === DEMO_ID;

    if (isDemo) {
        console.log(`🧹 [${DEPLOY_VERSION}] MODO DEMO: Limpiando transacciones previas...`);
        // Borrado preventivo para evitar unique constraint errors en la BD
        await supabaseAdmin.from('payment_transactions').delete().eq('quote_id', quoteId);
    }
    // =================================================================

    // 1. Obtener Cotización y Vendedor
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select(`*, quote_items (*), user_id`)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) throw new Error("Cotización no encontrada");

    // 2. Obtener Datos del Vendedor
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('user_id', quote.user_id)
      .single();

    if (!merchant || !merchant.openpay_id) {
      throw new Error("El vendedor no ha configurado sus datos bancarios.");
    }

    // 3. IDEMPOTENCIA
    // (Solo verificamos si NO es demo, porque si es demo ya lo borramos arriba)
    if (!isDemo) {
        const { data: existingTx } = await supabaseAdmin
        .from('payment_transactions')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('status', 'pending')
        .maybeSingle();

        if (existingTx) {
            console.log("🔄 Retornando transacción existente");
            return new Response(JSON.stringify({ 
                success: true, 
                payment_method: { clabe: existingTx.clabe_virtual_in, bank: 'STP' },
                amount: existingTx.amount_total / 100, 
                version: DEPLOY_VERSION 
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    // 4. CÁLCULO DE MONTOS
    let totalCents = quote.total_amount;
    if (!totalCents || totalCents === 0) {
        const itemsTotal = quote.quote_items.reduce((sum, i) => sum + i.subtotal, 0);
        totalCents = itemsTotal + (quote.shipping_cost || 0);
    }

    const { data: rule } = await supabaseAdmin
        .from('commission_rules')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
    
    const commissionPercent = rule?.percentage_fee || 1.0; 
    const commissionMin = rule?.fixed_fee_min || 1500;     
    const commissionSaas = Math.max(Math.round(totalCents * (commissionPercent / 100)), commissionMin);
    const netToMerchant = totalCents - commissionSaas;

    // 5. GENERAR CARGO OPENPAY
    // 🔥 PARCHE DEMO: ID DINÁMICO
    const orderIdToSend = isDemo ? `${quote.id}-${Date.now()}` : quote.id;

    if(isDemo) console.log(`🧪 [${DEPLOY_VERSION}] Usando Order ID Dinámico: ${orderIdToSend}`);

    const chargeRequest = {
        method: "bank_account",
        amount: totalCents / 100, 
        currency: "MXN",
        description: `Pedido #${quote.order_number || quoteId.slice(0,8)}`,
        order_id: orderIdToSend, // <--- ID Dinámico
        customer: {
            name: quote.customer_name,
            email: quote.customer_email,
            phone_number: quote.customer_phone || "5555555555"
        }
    };

    const openpayRes = await fetch(`${getOpenpayUrl()}/charges`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(chargeRequest)
    });

    const openpayData = await openpayRes.json();

    if (!openpayRes.ok) {
        console.error(`Openpay Error [${DEPLOY_VERSION}]:`, openpayData);
        throw new Error(`Error Openpay: ${openpayData.description || 'No se pudo generar el pago'}`);
    }

    const clabe = openpayData.payment_method?.clabe || openpayData.payment_method?.reference; 

    // 6. GUARDAR EN DB
    const { error: insertError } = await supabaseAdmin
        .from('payment_transactions')
        .insert({
            quote_id: quoteId,
            merchant_id: merchant.id,
            amount_total: totalCents,
            commission_saas: commissionSaas,
            cost_gateway: 0, 
            net_to_merchant: netToMerchant,
            payment_method: 'SPEI',
            clabe_virtual_in: clabe,
            provider_transaction_id: openpayData.id,
            status: 'pending'
        });

    if (insertError) {
        console.error("Error guardando transacción:", insertError);
        // Si es demo, ignoramos el error de insert para no romper la UI
        if (!isDemo) throw insertError;
    }

    return new Response(JSON.stringify({ 
        success: true, 
        payment_method: { clabe: clabe, bank: 'STP' },
        amount: totalCents / 100,
        dueDate: openpayData.due_date,
        version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error(`❌ Error [${DEPLOY_VERSION}]:`, error);
    return new Response(JSON.stringify({ 
        error: error.message,
        version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
