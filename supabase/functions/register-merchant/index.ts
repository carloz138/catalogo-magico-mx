// ==========================================
// FUNCION: register-merchant
// ESTADO: FIX_V2.0 (Manejo de "Usuario ya existe" + HASH)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helpers
const getOpenpayUrl = () => {
  const isSandbox = Deno.env.get('OPENPAY_SANDBOX_MODE') === 'true';
  const merchantId = Deno.env.get('OPENPAY_MERCHANT_ID');
  return isSandbox 
    ? `https://sandbox-api.openpay.mx/v1/${merchantId}`
    : `https://api.openpay.mx/v1/${merchantId}`;
};

const getAuthHeader = () => {
  const privateKey = Deno.env.get('OPENPAY_PRIVATE_KEY') || '';
  return `Basic ${btoa(privateKey + ':')}`;
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "register-merchant",
    version: DEPLOY_VERSION
  }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { business_name, rfc, clabe, email } = await req.json();
    
    // Validaciones
    if (!clabe || clabe.length !== 18) throw new Error("La CLABE debe tener 18 dígitos");
    if (!business_name) throw new Error("Nombre requerido");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verificar Usuario
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Usuario no autenticado");

    console.log(`🏦 Procesando merchant para: ${user.id}`);

    // --- PASO A: Crear o Recuperar Cliente Openpay ---
    let openpayCustomerId = "";

    const createCustomerBody = {
      name: business_name,
      email: email || user.email,
      requires_account: false,
      external_id: user.id
    };

    console.log("1. Intentando crear cliente...");
    const createRes = await fetch(`${getOpenpayUrl()}/customers`, {
      method: 'POST',
      headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(createCustomerBody)
    });

    if (createRes.ok) {
        const data = await createRes.json();
        openpayCustomerId = data.id;
        console.log(`✅ Cliente creado nuevo: ${openpayCustomerId}`);
    } else {
        const errorData = await createRes.json();
        // 🚨 MANEJO DEL ERROR 2003/409 (Ya existe)
        if (errorData.http_code === 409 || errorData.error_code === 2003) {
            console.log("⚠️ El cliente ya existe en Openpay. Buscándolo...");
            
            // Buscar cliente por external_id
            const searchRes = await fetch(`${getOpenpayUrl()}/customers?external_id=${user.id}`, {
                headers: { 'Authorization': getAuthHeader() }
            });
            
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.length > 0) {
                    openpayCustomerId = searchData[0].id;
                    console.log(`✅ Cliente recuperado: ${openpayCustomerId}`);
                } else {
                    throw new Error("Openpay dice que existe, pero no lo encontramos.");
                }
            } else {
                throw new Error("Error buscando cliente existente en Openpay");
            }
        } else {
            throw new Error(`Error Openpay Customer: ${errorData.description}`);
        }
    }

    // --- PASO B: Registrar Cuenta Bancaria ---
    // Nota: Si la cuenta ya existe, Openpay puede dar error, lo manejamos.
    const bankAccountBody = {
      clabe: clabe,
      alias: "Cuenta Principal",
      holder_name: business_name
    };

    console.log(`2. Vinculando CLABE a ${openpayCustomerId}...`);
    const bankRes = await fetch(`${getOpenpayUrl()}/customers/${openpayCustomerId}/bankaccounts`, {
      method: 'POST',
      headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(bankAccountBody)
    });

    if (!bankRes.ok) {
        const bankError = await bankRes.json();
        // Si dice que ya existe la cuenta, no es error, es éxito (idempotencia)
        if (bankError.error_code === 2008 || bankError.description?.includes("already registered")) {
             console.log("ℹ️ La cuenta bancaria ya estaba registrada.");
        } else {
             console.error("Error Banco:", bankError);
             throw new Error(`Error CLABE: ${bankError.description}`);
        }
    } else {
        console.log("✅ Cuenta bancaria agregada exitosamente");
    }

    // --- PASO C: Guardar en DB ---
    const { error: dbError } = await supabaseAdmin
      .from('merchants')
      .upsert({
        user_id: user.id,
        openpay_id: openpayCustomerId,
        business_name: business_name,
        rfc: rfc || null,
        clabe_deposit: clabe,
        status: 'active'
      }, { onConflict: 'user_id' });

    if (dbError) throw new Error("Error DB local");

    return new Response(JSON.stringify({ 
      success: true, 
      openpay_id: openpayCustomerId,
      version: DEPLOY_VERSION 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
    });
  }
});
