// ==========================================
// FUNCIÓN: get-shipping-rates
// ESTADO: CORREGIDO (Parcels -> Packages + State Normalization)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

// ✅ MANTENIDO: Tu versión dinámica para GitHub
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "DEBUG_V1.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Live: https://api.envia.com/ship/rate/
// Sandbox: https://api-test.envia.com/ship/rate/
const ENVIA_URL = "https://api.envia.com/ship/rate/"; 

// --- HELPER: NORMALIZAR ESTADOS (CRÍTICO PARA ENVIA) ---
// Convierte códigos de 3 letras (NLE) o nombres sucios (N.) a ISO 2 letras (NL)
const mapStateToISO2 = (stateInput: any) => {
  if (!stateInput) return "MX";
  
  const code = String(stateInput).toUpperCase().trim().replace(".", ""); // Quita puntos
  
  // Mapa de conversión (Frontend 3 chars -> Envia 2 chars)
  const mapping: Record<string, string> = {
    "NLE": "NL", "NUEVO LEON": "NL", "NL": "NL", "N": "NL",
    "AGU": "AG", "BCN": "BC", "BCS": "BS", "CAM": "CM",
    "CHP": "CS", "CHH": "CH", "COA": "CO", "COL": "CL",
    "DIF": "DF", "CDMX": "DF", "CIUDAD DE MEXICO": "DF", "DUR": "DG", 
    "GUA": "GT", "GRO": "GR", "HID": "HG", "JAL": "JA", "MEX": "EM", "ESTADO DE MEXICO": "EM",
    "MIC": "MI", "MOR": "MO", "NAY": "NA", "OAX": "OA",
    "PUE": "PU", "QUE": "QT", "ROO": "QR", "SLP": "SL",
    "SIN": "SI", "SON": "SO", "TAB": "TB", "TAM": "TM",
    "TLA": "TL", "VER": "VE", "YUC": "YU", "ZAC": "ZA"
  };

  return mapping[code] || code.substring(0, 2); // Fallback: primeras 2 letras
};

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

    // 3. Preparar Datos
    const totalItems = quote.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const estimatedWeight = Math.max(1, totalItems * 0.5); // Peso mínimo 1kg

    // Helper para separar calle y número (Envia prefiere separado)
    const splitStreet = (fullStreet: string) => {
      const match = fullStreet?.match(/^(.+?)\s+(\d+\w*)$/);
      if (match) return { street: match[1], number: match[2] };
      return { street: fullStreet || "Calle Conocida", number: "S/N" };
    };

    const originSplit = splitStreet(originAddr.street);
    const destSplit = splitStreet(destinationAddr.street);

    // Validación preventiva
    if (!originAddr.zip_code || !destinationAddr.zip_code) {
        throw new Error(`Falta Código Postal: Origen(${originAddr.zip_code}) - Destino(${destinationAddr.zip_code})`);
    }

    // 4. CONSTRUIR PAYLOAD (CORREGIDO)
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
        state_code: mapStateToISO2(originAddr.state), // ✅ USO DE HELPER
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
        state_code: mapStateToISO2(destinationAddr.state), // ✅ USO DE HELPER
        country_code: "MX",
        postal_code: destinationAddr.zip_code,
        type: "residential",
        references: destinationAddr.references || ""
      },
      shipment: {
        carrier: "fedex", 
        type: 1, 
        // ✅ CORRECCIÓN CRÍTICA: 'packages' en lugar de 'parcels'
        packages: [ 
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

    console.log(`📤 Enviando Payload a Envia...`);

    // 5. Llamar API Envia
    const response = await fetch(ENVIA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('ENVIA_API_KEY')}`
      },
      body: JSON.stringify(enviaPayload)
    });

    const result = await response.json();
    
    // Loguear respuesta para debugging si falla
    if (!response.ok || result.meta === "error") {
       console.error("📦 Error RAW de Envia:", JSON.stringify(result));
       const errorMsg = result.error?.message || result.meta?.error?.message || "Error desconocido de Envia";
       throw new Error(`Envia.com dice: ${errorMsg}`);
    }

    // 6. Validación Robusta de Array
    let rates = [];
    if (Array.isArray(result.data)) {
        rates = result.data;
    } else if (Array.isArray(result)) {
        rates = result;
    } else {
        console.error("❌ Formato inesperado:", result);
        throw new Error("No se encontraron tarifas disponibles para esta ruta.");
    }

    // 7. Procesar y Añadir Margen
    const MARKUP_AMOUNT = 20; // Margen de ganancia $20 MXN
    
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
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
