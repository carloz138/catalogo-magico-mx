// ==========================================
// FUNCIÓN: get-shipping-rates
// DESCRIPCIÓN: Cotiza envíos usando Envia.com
// ESTADO: V1.2 (DEBUGGING MEJORADO + ERROR HANDLING)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "DEBUG_V1.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Asegúrate de que esta URL sea la correcta según tus credenciales (Sandbox vs Live)
// Live: https://api.envia.com/ship/rate/
// Sandbox: https://api-test.envia.com/ship/rate/
const ENVIA_URL = "https://api.envia.com/ship/rate/"; 

Deno.serve(async (req) => {
  // LOGGING INICIAL
  console.log(JSON.stringify({
    event: "FUNC_START",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quoteId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Obtener Cotización (Destino)
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) throw new Error("Cotización no encontrada en DB.")

    const destinationAddr = quote.shipping_address;
    if (!destinationAddr || typeof destinationAddr !== 'object') {
      throw new Error("Dirección de destino inválida o formato antiguo.")
    }

    // 2. Obtener Negocio (Origen)
    const sellerId = quote.user_id; 
    const { data: business, error: businessError } = await supabaseClient
      .from('business_info')
      .select('address, phone, email, business_name')
      .eq('user_id', sellerId)
      .single()

    if (businessError || !business) throw new Error("Info del negocio (origen) no encontrada.")

    const originAddr = business.address;
    if (!originAddr || typeof originAddr !== 'object') {
      throw new Error("Dirección de origen no configurada. Ve a Configuración del Negocio.")
    }

    // 3. Preparar Payload
    const totalItems = quote.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const estimatedWeight = Math.max(1, totalItems * 0.5); 

    const splitStreet = (fullStreet: string) => {
      const match = fullStreet?.match(/^(.+?)\s+(\d+\w*)$/);
      if (match) return { street: match[1], number: match[2] };
      return { street: fullStreet || "Calle Conocida", number: "S/N" };
    };

    const originSplit = splitStreet(originAddr.street);
    const destSplit = splitStreet(destinationAddr.street);

    // Validación preventiva de datos críticos
    if (!originAddr.zip_code || !destinationAddr.zip_code) {
        throw new Error(`Falta Código Postal: Origen(${originAddr.zip_code}) - Destino(${destinationAddr.zip_code})`);
    }

    const enviaPayload = {
      origin: {
        name: business.business_name || "Vendedor",
        company: business.business_name || "Vendedor",
        email: business.email || "envios@catifypro.com",
        phone: business.phone || "8100000000",
        street: originSplit.street,
        number: originSplit.number,
        district: originAddr.colony || "Centro",
        city: originAddr.city || "Monterrey", // Fallback para evitar error fatal
        state_code: (originAddr.state || "MX").substring(0, 2).toUpperCase(),
        country_code: "MX",
        postal_code: originAddr.zip_code,
        type: "business"
      },
      destination: {
        name: quote.customer_name,
        company: quote.customer_company || "-",
        email: quote.customer_email,
        phone: quote.customer_phone || "8100000000",
        street: destSplit.street,
        number: destSplit.number,
        district: destinationAddr.colony || "Centro",
        city: destinationAddr.city || "Ciudad",
        state_code: (destinationAddr.state || "MX").substring(0, 2).toUpperCase(),
        country_code: "MX",
        postal_code: destinationAddr.zip_code,
        type: "residential",
        references: destinationAddr.references || ""
      },
      shipment: {
        carrier: "fedex", 
        type: 1, 
        parcels: [
          {
            quantity: 1,
            weight: estimatedWeight,
            weight_unit: "KG",
            length: 20,
            height: 20,
            width: 20,
            dimension_unit: "CM"
          }
        ]
      },
      settings: {
        currency: "MXN"
      }
    };

    console.log(`📤 Enviando Payload:`, JSON.stringify(enviaPayload));

    // 4. Llamar API Envia
    const response = await fetch(ENVIA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('ENVIA_API_KEY')}`
      },
      body: JSON.stringify(enviaPayload)
    });

    const result = await response.json();
    
    // 🔥 LOG CRÍTICO: Ver qué respondió exactamente Envia
    console.log("📦 Respuesta RAW de Envia:", JSON.stringify(result));

    if (!response.ok) {
        throw new Error(result.meta?.error?.message || "Error HTTP al conectar con Envia.");
    }

    // 5. Validación Robusta de Array
    // Envia a veces devuelve { data: [...] } y a veces solo el objeto de error en data.
    let rates = [];
    
    if (Array.isArray(result.data)) {
        rates = result.data;
    } else if (Array.isArray(result)) {
        rates = result;
    } else {
        // Si no es array, es un error lógico de negocio (ej: CP no válido)
        // aunque el HTTP status haya sido 200/201
        console.error("❌ La respuesta no contiene un array de tarifas:", result);
        const errorMsg = result.meta?.error?.message || "No se encontraron tarifas para esta ruta.";
        throw new Error(errorMsg);
    }

    // 6. Procesar
    const MARKUP_AMOUNT = 20; 
    const processedRates = rates.map((rate: any) => ({
      carrier: rate.carrier,
      service: rate.service,
      deliveryEstimate: rate.deliveryDate,
      originalPrice: rate.totalPrice,
      finalPrice: rate.totalPrice + MARKUP_AMOUNT, 
      currency: rate.currency
    }));

    return new Response(JSON.stringify({ success: true, rates: processedRates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(`❌ FATAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
