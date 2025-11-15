import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ No signature found');
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`✅ Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💳 Processing checkout.session.completed:', session.id);

        // Buscar transacción por user_id + subscription_plan_id + pending status
        const userId = session.client_reference_id || session.metadata?.user_id;
        const packageId = session.metadata?.package_id;
        
        if (!userId || !packageId) {
          console.error('❌ Missing user_id or package_id in session metadata');
          return new Response('Invalid session metadata', { status: 400 });
        }

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .update({
            payment_status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_charge_id: session.id,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('subscription_plan_id', packageId)
          .eq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .select()
          .single();

        if (txError || !transaction) {
          console.error('❌ Error updating transaction:', txError);
          return new Response('Transaction not found', { status: 404 });
        }

        console.log('✅ Transaction updated:', transaction.id);

        // Crear suscripción
        const subscriptionData = {
          user_id: transaction.user_id,
          package_id: transaction.package_id,
          stripe_subscription_id: session.subscription as string || null,
          stripe_customer_id: session.customer as string,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (subError) {
          console.error('❌ Error creating subscription:', subError);
          return new Response('Subscription error', { status: 500 });
        }

        console.log(`✅ Subscription created for user ${transaction.user_id}`);

        // Inicializar contador de catalog_usage
        const currentMonth = parseInt(
          new Date().getFullYear().toString() + 
          (new Date().getMonth() + 1).toString().padStart(2, '0')
        );

        console.log(`📊 Inicializando catalog_usage para mes ${currentMonth}`);

        const { error: usageError } = await supabase
          .from('catalog_usage')
          .insert({
            user_id: transaction.user_id,
            usage_month: currentMonth,
            subscription_plan_id: transaction.package_id,
            catalogs_generated: 0,
            uploads_used: 0
          });

        if (usageError) {
          // Si el registro ya existe (código 23505), actualizar el plan
          if (usageError.code === '23505') {
            console.log('📝 Registro existente, actualizando subscription_plan_id');
            const { error: updateError } = await supabase
              .from('catalog_usage')
              .update({ subscription_plan_id: transaction.package_id })
              .eq('user_id', transaction.user_id)
              .eq('usage_month', currentMonth);

            if (updateError) {
              console.error('❌ Error actualizando catalog_usage:', updateError);
            } else {
              console.log('✅ catalog_usage actualizado');
            }
          } else {
            console.error('❌ Error insertando catalog_usage:', usageError);
          }
        } else {
          console.log('✅ catalog_usage inicializado correctamente');
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`🔄 Processing ${event.type}:`, subscription.id);

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('❌ Error updating subscription:', error);
        } else {
          console.log('✅ Subscription updated');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Processing subscription deletion:', subscription.id);

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('❌ Error canceling subscription:', error);
        } else {
          console.log('✅ Subscription canceled');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💰 Processing invoice.payment_succeeded:', invoice.id);

        if (invoice.billing_reason === 'subscription_cycle') {
          // Renovación mensual
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('user_id, package_id')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .single();

          if (subscription) {
            // Resetear contador mensual
            const currentMonth = parseInt(
              new Date().getFullYear().toString() + 
              (new Date().getMonth() + 1).toString().padStart(2, '0')
            );

            const { error: usageError } = await supabase
              .from('catalog_usage')
              .insert({
                user_id: subscription.user_id,
                usage_month: currentMonth,
                subscription_plan_id: subscription.package_id,
                catalogs_generated: 0,
                uploads_used: 0
              });

            if (usageError && usageError.code !== '23505') {
              console.error('❌ Error resetting monthly usage:', usageError);
            } else {
              console.log('✅ Monthly usage reset for renewal');
            }
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
