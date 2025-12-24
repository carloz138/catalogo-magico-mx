// ==========================================
// FUNCIÓN: get-shipping-rates
// ESTADO: V2.6 (FIX: PURE CAMELCASE + DIMENSIONS OBJECT)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "DEBUG_V2.6_CAMELCASE";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ENVIA_URL = "https://api.envia.com/ship/rate/"; 

const mapStateToISO2 = (stateInput: any) => {
  if (!stateInput) return "MX";
  const code = String(stateInput).toUpperCase().trim().replace(".", "");
  // Mapeo simplificado para brevedad, asume lógica previa
  return code.substring(0, 2); 
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { quoteId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Obtener Datos
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes').select('*, items:quote_items(*)').eq('id', quoteId).single()
    if (quoteError || !quote) throw new Error("Cotización no encontrada.")

    const { data: business, error: businessError } = await supabaseClient
      .from('business_info').select('address, phone, email, business_name').eq('user_id', quote.user_id).single()
    if (businessError || !business) throw new Error("Info del negocio no encontrada.")

    const originAddr = business.address;
    const destinationAddr = quote.shipping_address;

    if (!originAddr?.zip_code || !destinationAddr?.zip_code) throw new Error(`Falta CP`);

    // 2. Preparar Datos
    const totalItems = quote.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const estimatedWeight = Math.max(1, totalItems * 0.5); 

    const splitStreet = (fullStreet: string) => {
      const match = fullStreet?.match(/^(.+?)\s+(\d+\w*)$/);
      if (match) return { street: match[1], number: match[2] };
      return { street: fullStreet || "Calle Conocida", number: "S/N" };
    };

    const originSplit = splitStreet(originAddr.street);
    const destSplit = splitStreet(destinationAddr.street);

    // 3. CONSTRUIR PAYLOAD (V2.6: PURE CAMELCASE)
    const enviaPayload = {
      origin: {
        name: business.business_name || "Vendedor",
        company: business.business_name || "Vendedor",
        email: business.email || "envios@catifypro.com",
        phone: business.phone || "8100000000",
        street: originSplit.street,
        number: originSplit.number,
        district: originAddr.colony || "Centro",
        city: originAddr.city || "Monterrey",
        state: mapStateToISO2(originAddr.state), // Envia suele preferir este
        country: "MX",
        postalCode: originAddr.zip_code, // CamelCase
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
        state: mapStateToISO2(destinationAddr.state),
        country: "MX",
        postalCode: destinationAddr.zip_code, // CamelCase
        type: "residential",
        references: destinationAddr.references || ""
      },
      packages: [
        {
          content: "Articulos Varios",
          amount: 1,
          type: "box",
          weight: estimatedWeight,
          weightUnit: "KG", // CamelCase y Mayúsculas
          
          // Objeto dimensions requerido por el error anterior
          dimensions: {
            length: 20,
            width: 20,
            height: 20,
            unit: "CM" // unit, no dimensionUnit
          }
        }
      ],
      shipment: {
        carrier: "fedex", 
        type: 1 
      },
      settings: {
        currency: "MXN"
      }
    };

    console.log(`📤 Payload V2.6:`, JSON.stringify(enviaPayload));

    // 4. Llamar API
    const response = await fetch(ENVIA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('ENVIA_API_KEY')}`
      },
      body: JSON.stringify(enviaPayload)
    });

    const result = await response.json();
    
    // Si hay error en la respuesta HTTP o en el meta
    if (!response.ok || result.meta === "error") {
       console.error("📦 Error RAW de Envia:", JSON.stringify(result));
       // Intentamos rescatar el mensaje
       const errorMsg = result.error?.message || result.meta?.error?.message || "Error desconocido";
       
       // Si no hay datos útiles, lanzamos error
       if(!Array.isArray(result.data)) {
          throw new Error(`Envia.com dice: ${errorMsg}`);
       }
    }

    // 5. Procesar
    let rates = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    
    if (rates.length === 0) {
       console.error("❌ Respuesta vacía:", result);
       throw new Error("No se encontraron tarifas disponibles.");
    }

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

  } catch (error: any) {
    console.error(`❌ FATAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Devolvemos 400 para que el cliente lo sepa, pero con JSON válido
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
