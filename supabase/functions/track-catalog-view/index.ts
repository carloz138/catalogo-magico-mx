import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store (in-memory, simple implementation)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { catalogId, metadata } = await req.json();
    
    if (!catalogId) {
      throw new Error('Catalog ID is required');
    }

    // Get IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Hash IP for privacy
    const ipHash = await hashIP(ip);

    // Check rate limit
    const rateLimitKey = `${catalogId}:${ipHash}`;
    const lastViewTime = rateLimitStore.get(rateLimitKey);
    
    if (lastViewTime && (Date.now() - lastViewTime) < RATE_LIMIT_WINDOW_MS) {
      console.log('Rate limit hit for:', rateLimitKey);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Rate limit: Please wait before viewing again',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Update rate limit store
    rateLimitStore.set(rateLimitKey, Date.now());

    // Clean up old entries (simple garbage collection)
    if (rateLimitStore.size > 10000) {
      const now = Date.now();
      for (const [key, time] of rateLimitStore.entries()) {
        if (now - time > RATE_LIMIT_WINDOW_MS) {
          rateLimitStore.delete(key);
        }
      }
    }

    // Get location from IP (optional, can be done client-side)
    let country = metadata?.country;
    let city = metadata?.city;
    
    if (!country && ip !== 'unknown') {
      try {
        const locationData = await getLocationFromIP(ip);
        country = locationData.country;
        city = locationData.city;
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Insert view record
    const { error: insertError } = await supabaseClient
      .from('catalog_views')
      .insert({
        catalog_id: catalogId,
        ip_address: ipHash,
        user_agent: metadata?.userAgent || req.headers.get('user-agent'),
        referrer: metadata?.referrer || req.headers.get('referer'),
        country,
        city,
      });

    if (insertError) {
      console.error('Error inserting view:', insertError);
      throw insertError;
    }

    // Increment view count
    const { error: updateError } = await supabaseClient.rpc(
      'increment_catalog_views',
      { p_catalog_id: catalogId }
    );

    if (updateError) {
      console.error('Error incrementing views:', updateError);
    }

    console.log('View tracked successfully for catalog:', catalogId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in track-catalog-view:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Hash IP using Web Crypto API
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get location from IP
async function getLocationFromIP(ip: string): Promise<{
  country?: string;
  city?: string;
}> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Supabase-Edge-Function',
      },
    });
    
    if (!response.ok) {
      return {};
    }
    
    const data = await response.json();
    return {
      country: data.country_name || undefined,
      city: data.city || undefined,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {};
  }
}
