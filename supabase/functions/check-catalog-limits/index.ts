import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Count active catalogs
    const { data: catalogs, error: catalogsError } = await supabaseClient
      .from('digital_catalogs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (catalogsError) throw catalogsError;

    const currentCount = catalogs?.length || 0;

    // Get user's subscription plan
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('package_id, credit_packages(name, max_catalogs)')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      throw subscriptionError;
    }

    // Determine plan type and limits
    let planType: 'basic' | 'medium' | 'premium' = 'basic';
    let maxAllowed = 1; // Default for basic/no plan
    let isUnlimited = false;

    if (subscription?.credit_packages) {
      const packageName = subscription.credit_packages.name.toLowerCase();
      const dbMaxCatalogs = subscription.credit_packages.max_catalogs;
      
      // Si el límite es >= 999999, es ilimitado
      if (dbMaxCatalogs && dbMaxCatalogs >= 999999) {
        isUnlimited = true;
        maxAllowed = 999999;
      } else if (packageName.includes('básico') || packageName.includes('starter')) {
        planType = 'basic';
        maxAllowed = dbMaxCatalogs || 1;
      } else if (packageName.includes('medio') || packageName.includes('profesional')) {
        planType = 'medium';
        maxAllowed = dbMaxCatalogs || 30;
      } else if (packageName.includes('premium') || packageName.includes('empresarial')) {
        planType = 'premium';
        maxAllowed = dbMaxCatalogs || 999999;
        isUnlimited = true;
      }
    }

    const canCreate = isUnlimited || currentCount < maxAllowed;

    return new Response(
      JSON.stringify({
        canCreate,
        currentCount,
        maxAllowed: isUnlimited ? 'unlimited' : maxAllowed,
        planType,
        message: canCreate 
          ? isUnlimited 
            ? 'Catálogos ilimitados disponibles' 
            : `Puedes crear ${maxAllowed - currentCount} catálogo(s) más`
          : `Has alcanzado tu límite de ${maxAllowed} catálogo(s) activos`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in check-catalog-limits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
