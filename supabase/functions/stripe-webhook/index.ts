// ==========================================
// FUNCION: stripe-webhook
// ESTADO: FIX_V1 (Inmutabilidad HASH y Fix Imports/JWT)
// ==========================================
import { serve } from "https://deno.land/std@0.207.0/http/server.ts"; // ⬅️ Uso de versión estable de serve
import { createClient } from "jsr:@supabase/supabase-js@2.49.8"; // ⬅️ Uso de versión estable de Supabase JS
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

// 1. HARDENING: Leer el Hash de la variable de entorno
const DEPLOY_VERSION = Deno.env.get('FUNCTION_HASH') || "UNKNOWN_HASH"; 

// Configuración de Stripe para Deno (con httpClient)
const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(), // 👈 VITAL para Deno/Edge
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');

// El cliente de Supabase usa el Service Role, lo cual es correcto.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
};

serve(async (req) => {
    // Logging Inicial con HASH como trazabilidad
    console.log(JSON.stringify({
        event: "FUNC_START",
        function: "stripe-webhook",
        version: DEPLOY_VERSION, // ⬅️ HASH INMUTABLE
        timestamp: new Date().toISOString()
    }));

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return new Response('No signature', { status: 400 });

    const body = await req.text();
    let event;

    try {
      // ✅ CORRECCIÓN 1: USAR ASYNC (Evita que Deno explote)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`✅ Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Processing checkout.session.completed for Session ID:', session.id);

        // ✅ CORRECCIÓN 2: BUSCAR POR SESSION ID (Infalible)
        // Primero intentamos la búsqueda exacta
        let { data: transaction, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('stripe_session_id', session.id) 
          .maybeSingle();

        // Si falla, usamos el plan de respaldo (metadata)
        if (txError || !transaction) {
          console.error('❌ Primary lookup failed. Trying fallback...', txError);
          const userId = session.metadata?.user_id;
          const packageId = session.metadata?.package_id;
          
          if (userId && packageId) {
             const { data: txFallback } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .eq('package_id', packageId)
                .eq('payment_status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
             
             if(txFallback) transaction = txFallback;
          }
        }

        if (!transaction) {
           console.error('❌ FATAL: Transaction not found for session:', session.id);
           return new Response('Transaction not found', { status: 404 });
        }

        console.log('✅ Transaction found:', transaction.id);

        // 1. Actualizar Transacción
        await supabase.from('transactions').update({
            payment_status: 'completed',
            stripe_payment_intent_id: session.payment_intent,
            stripe_charge_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
            completed_at: new Date().toISOString()
          }).eq('id', transaction.id);

        // 2. Actualizar Usuario (Feature flags inmediatas)
        // Asegúrate que estos IDs coincidan con tu DB real
        const isPro = transaction.package_id === 'b4fd4d39-8225-46c6-904f-20815e7c0b4e'; 
        const isEnterprise = transaction.package_id === '0bacec4c-1316-4890-a309-44ebd357552b';
        
        await supabase.from('users').update({
            plan_type: isEnterprise ? 'enterprise' : (isPro ? 'pro' : 'basic'),
            current_plan: transaction.package_id
        }).eq('id', transaction.user_id);

        // 3. Crear/Actualizar Suscripción
        const subscriptionData = {
          user_id: transaction.user_id,
          package_id: transaction.package_id,
          stripe_subscription_id: session.subscription || null,
          stripe_customer_id: session.customer,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        // ✅ CORRECCIÓN 3: USAR UPSERT (Evita errores si Stripe reenvía el evento)
        const { error: subError } = await supabase
            .from('subscriptions')
            .upsert(subscriptionData, { onConflict: 'user_id' });

        if (subError) console.error('❌ Error creating subscription:', subError);
        else console.log(`✅ Subscription active for user ${transaction.user_id}`);

        // 4. Inicializar uso del mes
        const currentMonth = parseInt(new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0'));
        
        await supabase.from('catalog_usage').upsert({
                user_id: transaction.user_id,
                usage_month: currentMonth,
                subscription_plan_id: transaction.package_id,
                catalogs_generated: 0,
                uploads_used: 0
            }, { onConflict: 'user_id, usage_month' });
        
        break;
      }

      // Mantenemos los otros casos (invoice, updated, deleted) tal cual
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await supabase.from('subscriptions').update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        }).eq('stripe_subscription_id', subscription.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', subscription.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle') {
           const { data: sub } = await supabase.from('subscriptions').select('user_id, package_id').eq('stripe_subscription_id', invoice.subscription).single();
           if(sub) {
             const currentMonth = parseInt(new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0'));
             await supabase.from('catalog_usage').upsert({
               user_id: sub.user_id,
               usage_month: currentMonth,
               subscription_plan_id: sub.package_id,
               catalogs_generated: 0,
               uploads_used: 0
             }, { onConflict: 'user_id, usage_month' });
           }
        }
        break;
      }
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // Logging del error incluyendo el HASH
    console.error(`❌ Webhook global error [${DEPLOY_VERSION}]:`, error); 
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
