// ==========================================
// FUNCION: create-payment-intent
// ESTADO: FIX_V2 (Inmutabilidad HASH y Estabilidad de Imports)
// ==========================================
import { serve } from "https://deno.land/std@0.207.0/http/server.ts"; // ⬅️ Uso de versión estable de serve
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8'; // ⬅️ Uso de versión estable de Supabase JS
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'; // ⬅️ Uso de versión estable de Stripe

// 1. HARDENING: Leer el Hash de la variable de entorno para inmutabilidad
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH"; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
    // Logging Inicial con HASH como trazabilidad
    console.log(JSON.stringify({
        event: "FUNC_START",
        function: "create-payment-intent",
        version: DEPLOY_VERSION, // ⬅️ HASH INMUTABLE
        timestamp: new Date().toISOString()
    }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';

    const { transactionId, isSubscription } = await req.json();

    if (!transactionId) throw new Error('Falta el transactionId');

    // Inicialización de clientes (Usamos versiones estables de los imports)
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const stripe = new Stripe(stripeKey, { 
      apiVersion: '2023-10-16', 
      httpClient: Stripe.createFetchHttpClient() 
    });

    // 1. CORRECCIÓN DE BASE DE DATOS (PGRST201)
    // Usamos la relación explícita !transactions_package_id_fkey
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        credit_packages:credit_packages!transactions_package_id_fkey (
          name, credits, price_mxn, package_type, stripe_price_id
        )
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
        throw new Error(`Error buscando transacción: ${JSON.stringify(transactionError)}`);
    }

    // Usamos SITE_URL si está disponible en el entorno
    const baseUrl = req.headers.get('origin') || Deno.env.get('SITE_URL') || 'https://catifypro.com';
    
    const packageData = transaction.credit_packages;
    // @ts-ignore
    const stripePriceId = packageData.stripe_price_id;
    let session;

    // 2. CORRECCIÓN DE LÓGICA DE STRIPE (Cupones + Price ID)
    if (isSubscription && packageData.package_type === 'monthly_plan') {
      const lineItem = stripePriceId 
        ? { price: stripePriceId, quantity: 1 } // Usa el ID oficial si existe
        : {
            price_data: {
              currency: 'mxn',
              product_data: { 
                  name: packageData.name, 
                  description: `${packageData.credits} créditos mensuales` 
              },
              unit_amount: transaction.amount_mxn,
              recurring: { interval: 'month' }
            },
            quantity: 1
          };

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        allow_promotion_codes: true, // ✅ Permite cupones (SOCIOVIP)
        line_items: [lineItem],
        metadata: { 
            transaction_id: transactionId, 
            user_id: transaction.user_id, 
            package_id: transaction.package_id 
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout`
      });
    } else {
      // Pago Único
       session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
            price_data: {
              currency: 'mxn',
              product_data: { 
                  name: packageData.name, 
                  description: `${packageData.credits} créditos` 
              },
              unit_amount: transaction.amount_mxn
            },
            quantity: 1
          }],
        metadata: { 
            transaction_id: transactionId, 
            user_id: transaction.user_id, 
            package_id: transaction.package_id 
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout`
      });
    }

    // 3. CORRECCIÓN DE SESSION ID
    // Guardamos session.id para que el webhook lo encuentre
    await supabase.from('transactions').update({
        stripe_session_id: session.id, 
        payment_status: 'processing'
      }).eq('id', transactionId);

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // Logging del error incluyendo el HASH
    console.error(`❌ Global Error [${DEPLOY_VERSION}]:`, error); 
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
