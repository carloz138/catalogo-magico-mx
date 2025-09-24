import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId, isSubscription } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener datos de la transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        credit_packages (
          name,
          credits,
          price_mxn,
          package_type
        )
      `)
      .eq('id', transactionId)
      .single()

    if (transactionError || !transaction) {
      throw new Error('Transacción no encontrada')
    }

    const stripe = new (await import('https://esm.sh/stripe@12.17.0')).Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      { apiVersion: '2023-10-16' }
    )

    const baseUrl = req.headers.get('origin') || 'https://tu-dominio.com'
    
    let checkoutUrl = ''

    if (isSubscription && transaction.credit_packages.package_type === 'monthly_plan') {
      // Crear suscripción
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: 'mxn',
            product_data: {
              name: transaction.credit_packages.name,
              description: `${transaction.credit_packages.credits} créditos mensuales`,
            },
            unit_amount: transaction.amount_mxn,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        metadata: {
          transaction_id: transactionId,
          user_id: transaction.user_id,
          package_id: transaction.package_id,
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout`,
      })
      checkoutUrl = session.url
    } else {
      // Pago único
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'mxn',
            product_data: {
              name: transaction.credit_packages.name,
              description: `${transaction.credit_packages.credits} créditos`,
            },
            unit_amount: transaction.amount_mxn,
          },
          quantity: 1,
        }],
        metadata: {
          transaction_id: transactionId,
          user_id: transaction.user_id,
          package_id: transaction.package_id,
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout`,
      })
      checkoutUrl = session.url
    }

    // Actualizar transacción con session ID
    await supabase
      .from('transactions')
      .update({ 
        stripe_session_id: checkoutUrl.split('/').pop(),
        payment_status: 'processing' 
      })
      .eq('id', transactionId)

    return new Response(
      JSON.stringify({ checkoutUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})