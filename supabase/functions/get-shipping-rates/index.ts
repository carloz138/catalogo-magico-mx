// ==========================================
// FUNCIÓN: get-shipping-rates
// DESCRIPCIÓN: Cotiza envíos usando Envia.com
// ESTADO: V1.1 (HARDENING + HASHING PROTOCOL)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

// 1. HARDENING: Leer el Hash de la variable de entorno para trazabilidad
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL de Envia.com (Usa 'api-test.envia.com' para pruebas o 'api.envia.com' para producción)
const ENVIA_URL = "https://api.envia.com/ship/rate/"; 

Deno.serve(async (req) => {
  // 2. LOGGING ESTRUCTURADO: Registrar inicio de ejecución con versión
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "get-shipping-rates",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quoteId } = await req.json()
    
    // Inicializar Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Obtener datos de la Cotización (Destino)
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) throw new Error("Cotización no encontrada")

    const destinationAddr = quote.shipping_address;
    if (!destinationAddr || typeof destinationAddr !== 'object') {
      throw new Error("La dirección de destino no es válida o es formato antiguo. Edita la orden para corregir.")
    }

    // 2. Obtener datos del Negocio (Origen)
    const sellerId = quote.user_id; 
    const { data: business, error: businessError } = await supabaseClient
      .from('business_info')
      .select('address, phone, email, business_name')
      .eq('user_id', sellerId)
      .single()

    if (businessError || !business) throw new Error("No se encontró la información del negocio para el origen.")

    const originAddr = business.address;
    if (!originAddr || typeof originAddr !== 'object') {
      throw new Error("Tu dirección de origen no está configurada. Ve a Configuración > Info del Negocio.")
    }

    // 3. Preparar Payload para Envia.com
    
    // Cálculo de peso estimado (Fallback: 1kg o 0.5kg por item)
    const totalItems = quote.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const estimatedWeight = Math.max(1, totalItems * 0.5); 

    // Helper para separar calle y número
    const splitStreet = (fullStreet: string) => {
      const match = fullStreet.match(/^(.+?)\s+(\d+\w*)$/);
      if (match) return { street: match[1], number: match[2] };
      return { street: fullStreet, number: "S/N" };
    };

    const originSplit = splitStreet(originAddr.street || "Calle Conocida");
    const destSplit = splitStreet(destinationAddr.street || "Calle Conocida");

    const enviaPayload = {
      origin: {
        name: business.business_name || "Vendedor",
        company: business.business_name || "Vendedor",
        email: business.email || "envios@catifypro.com",
        phone: business.phone || "8100000000",
        street: originSplit.street,
        number: originSplit.number,
        district: originAddr.colony || "Centro",
        city: originAddr.city,
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
        city: destinationAddr.city,
        state_code: (destinationAddr.state || "MX").substring(0, 2).toUpperCase(),
        country_code: "MX",
        postal_code: destinationAddr.zip_code,
        type: "residential",
        references: destinationAddr.references || ""
      },
      shipment: {
        carrier: "fedex", // Opcional: Quitar para cotizar todas
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

    console.log(`📤 [${DEPLOY_VERSION}] Enviando payload a Envia.com`);

    // 4. Llamar a la API de Envia
    const response = await fetch(ENVIA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('ENVIA_API_KEY')}`
      },
      body: JSON.stringify(enviaPayload)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error(`❌ [${DEPLOY_VERSION}] Error Envia:`, result);
        throw new Error(result.meta?.error?.message || "Error al conectar con paquetería");
    }

    // 5. Procesar respuesta y aplicar Markup
    const MARKUP_AMOUNT = 20; 
    const rates = Array.isArray(result.data) ? result.data : result;

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
    console.error(`❌ FATAL ERROR in ${DEPLOY_VERSION}:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
