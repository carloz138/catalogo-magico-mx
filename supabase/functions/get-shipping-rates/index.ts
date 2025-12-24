// ==========================================
// FUNCIÓN: get-shipping-rates
// ESTADO: V1.5 (FIX: Estrategia Doble Llave + Content)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "DEBUG_V1.5_DOUBLE_KEY";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Live: https://api.envia.com/ship/rate/
const ENVIA_URL = "https://api.envia.com/ship/rate/"; 

// --- HELPER: NORMALIZAR ESTADOS ---
const mapStateToISO2 = (stateInput: any) => {
  if (!stateInput) return "MX";
  const code = String(stateInput).toUpperCase().trim().replace(".", "");
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
  return mapping[code] || code.substring(0, 2);
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION, timestamp: new Date().toISOString() }));

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

    if (!originAddr?.zip_code || !destinationAddr?.zip_code) {
        throw new Error(`Falta Código Postal: Origen(${originAddr?.zip_code}) - Destino(${destinationAddr?.zip_code})`);
    }

    // 2. Preparar Datos
    const totalItems = quote.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const estimatedWeight = Math.max(1, totalItems * 0.5); // Peso mínimo

    const splitStreet = (fullStreet: string) => {
      const match = fullStreet?.match(/^(.+?)\s+(\d+\w*)$/);
      if (match) return { street: match[1], number: match[2] };
      return { street: fullStreet || "Calle Conocida", number: "S/N" };
    };

    const originSplit = splitStreet(originAddr.street);
    const destSplit = splitStreet(destinationAddr.street);

    // Definimos el array de paquetes una vez
    const packagesArray = [
      {
        content: "Articulos Varios", // ✅ A veces requerido
        amount: 1,
        type: "box",
        quantity: 1,
        weight: estimatedWeight,
        weight_unit: "KG",
        length: 20,
        height: 20,
        width: 20,
        dimension_unit: "CM"
      }
    ];

    // 3. CONSTRUIR PAYLOAD (HACK DE DOBLE LLAVE)
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
        state_code: mapStateToISO2(originAddr.state),
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
        state_code: mapStateToISO2(destinationAddr.state),
        country_code: "MX",
        postal_code: destinationAddr.zip_code,
        type: "residential",
        references: destinationAddr.references || ""
      },
      shipment: {
        type: 1, // 1 = Paquete
        content: "Mercancía General", // ✅ Descripción global
        
        // 🔥 EL TRUCO FINAL: Enviamos ambas llaves por si acaso
        packages: packagesArray,
        parcels: packagesArray
      },
      settings: {
        currency: "MXN",
        print_format: "PDF",
        label_format: "PDF"
      }
    };

    console.log(`📤 Payload Blindado:`, JSON.stringify(enviaPayload));

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
    
    if (!response.ok || result.meta === "error") {
       console.error("📦 Error RAW de Envia:", JSON.stringify(result));
       const errorMsg = result.error?.message || result.meta?.error?.message || "Error desconocido de Envia";
       throw new Error(`Envia.com dice: ${errorMsg}`);
    }

    // 5. Validación Robusta
    let rates = [];
    if (Array.isArray(result.data)) {
        rates = result.data;
    } else if (Array.isArray(result)) {
        rates = result;
    } else {
        console.error("❌ Formato inesperado:", result);
        throw new Error("No se encontraron tarifas.");
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

  } catch (error: any) {
    console.error(`❌ FATAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
