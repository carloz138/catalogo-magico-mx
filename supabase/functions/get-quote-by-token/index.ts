import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_token } = await req.json();

    if (!tracking_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token no proporcionado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Crear cliente con Service Role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Buscando cotización con token:', tracking_token);

    // Query principal con todos los datos necesarios
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          id,
          product_id,
          product_name,
          product_sku,
          product_image_url,
          variant_id,
          variant_description,
          quantity,
          unit_price,
          subtotal,
          price_type
        ),
        digital_catalogs (
          id,
          name,
          slug,
          enable_distribution,
          user_id,
          users (
            business_name,
            full_name
          )
        ),
        replicated_catalogs (
          id,
          is_active,
          activated_at
        )
      `)
      .eq('tracking_token', tracking_token)
      .single();

    if (error) {
      console.error('❌ Error obteniendo cotización:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Cotización no encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('✅ Cotización encontrada:', quote.id);
    console.log('📦 Items:', quote.quote_items?.length || 0);
    console.log('🏢 Business name:', quote.digital_catalogs?.users?.business_name);

    return new Response(
      JSON.stringify({ success: true, quote }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
