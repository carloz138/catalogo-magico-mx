// ==========================================
// FUNCION: create-quote-payment
// DESCRIPCIÓN: Genera una ficha de pago SPEI en Openpay para una COTIZACIÓN
// ESTADO: V1.0 (CON HASHING PROTOCOL)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

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
  // Logging Inicial con el nuevo nombre
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

    // 1. Obtener Cotización y Vendedor
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        user_id
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) throw new Error("Cotización no encontrada");

    // 2. Obtener Datos del Vendedor (Merchant)
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('user_id', quote.user_id)
      .single();

    if (!merchant || !merchant.openpay_id) {
      throw new Error("El vendedor no ha configurado sus datos bancarios.");
    }

    // 3. IDEMPOTENCIA: Verificar si ya existe una transacción pendiente para esta cotización
    const { data: existingTx } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingTx) {
      console.log("🔄 Retornando transacción SPEI existente");
      return new Response(JSON.stringify({ 
        success: true, 
        payment_method: {
            clabe: existingTx.clabe_virtual_in,
            bank: 'STP' // Openpay usa STP por defecto
        },
        amount: existingTx.amount_total / 100, // Devolver a pesos
        version: DEPLOY_VERSION 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. CÁLCULO DE MONTOS Y COMISIONES
    // Si ya tiene total_amount guardado en DB, usamos ese. Si no, sumamos items + envío.
    let totalCents = quote.total_amount;
    if (!totalCents || totalCents === 0) {
        const itemsTotal = quote.quote_items.reduce((sum, i) => sum + i.subtotal, 0);
        totalCents = itemsTotal + (quote.shipping_cost || 0);
    }

    // Obtener regla de comisión activa
    const { data: rule } = await supabaseAdmin
        .from('commission_rules')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
    
    const commissionPercent = rule?.percentage_fee || 1.0; // Default 1%
    const commissionMin = rule?.fixed_fee_min || 1500;     // Default $15.00 MXN

    // Cálculo: Max( (Total * %), Mínimo )
    const percentageAmount = Math.round(totalCents * (commissionPercent / 100));
    const commissionSaas = Math.max(percentageAmount, commissionMin);
    const netToMerchant = totalCents - commissionSaas;

    console.log(`💰 Cálculo: Total: ${totalCents}, Comisión: ${commissionSaas}, Neto: ${netToMerchant}`);

    // 5. GENERAR CARGO EN OPENPAY (SPEI)
    const chargeRequest = {
        method: "bank_account",
        amount: totalCents / 100, // Openpay recibe decimales (pesos)
        currency: "MXN",
        description: `Pedido #${quote.order_number || quoteId.slice(0,8)}`,
        order_id: quote.id, // Usamos el UUID de la quote como referencia
        customer: {
            name: quote.customer_name,
            email: quote.customer_email,
            phone_number: quote.customer_phone || "5555555555"
        }
    };

    console.log("Enviando a Openpay Charges...");
    const openpayRes = await fetch(`${getOpenpayUrl()}/charges`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(chargeRequest)
    });

    const openpayData = await openpayRes.json();

    if (!openpayRes.ok) {
        console.error("Openpay Error:", openpayData);
        throw new Error(`Error Openpay: ${openpayData.description || 'No se pudo generar el pago'}`);
    }

    // Extraer CLABE (A veces es 'clabe', a veces 'reference' dependiendo de la versión de API)
    const clabe = openpayData.payment_method?.clabe || openpayData.payment_method?.reference; 

    // 6. GUARDAR EN DB (payment_transactions)
    const { error: insertError } = await supabaseAdmin
        .from('payment_transactions')
        .insert({
            quote_id: quoteId,
            merchant_id: merchant.id,
            amount_total: totalCents,
            commission_saas: commissionSaas,
            cost_gateway: 0, // Se actualizará post-pago o fijo
            net_to_merchant: netToMerchant,
            payment_method: 'SPEI',
            clabe_virtual_in: clabe,
            provider_transaction_id: openpayData.id,
            status: 'pending'
        });

    if (insertError) {
        console.error("Error guardando transacción:", insertError);
    }

    return new Response(JSON.stringify({ 
        success: true, 
        payment_method: {
            clabe: clabe,
            bank: 'STP'
        },
        amount: totalCents / 100,
        dueDate: openpayData.due_date,
        version: DEPLOY_VERSION 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error create-quote-payment:', error);
    return new Response(JSON.stringify({ 
        error: error.message,
        version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
