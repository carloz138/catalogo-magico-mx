// ==========================================
// FUNCION: register-merchant
// DESCRIPCIÓN: Registra un usuario en Openpay y guarda su CLABE para recibir pagos
// ESTADO: V1.0 (CON HASHING PROTOCOL)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

// 1. HARDENING: Protocolo de Hashing
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helpers para Openpay
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
  // 2. Logging Inicial
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "register-merchant",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { business_name, rfc, clabe, email } = await req.json();
    
    // Validaciones básicas
    if (!clabe || clabe.length !== 18) throw new Error("La CLABE debe tener 18 dígitos");
    if (!business_name) throw new Error("El nombre del beneficiario es requerido");

    // Cliente Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Obtener el usuario autenticado (quien llama la función)
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Usuario no autenticado");

    console.log(`🏦 Registrando merchant para usuario: ${user.id}`);

    // --- PASO A: Crear Cliente en Openpay ---
    // Openpay requiere crear primero el "Customer"
    const createCustomerBody = {
      name: business_name,
      email: email || user.email,
      requires_account: false, // No necesitamos cuenta de saldo Openpay, solo registro
      external_id: user.id
    };

    console.log("Enviando a Openpay (Create Customer)...");
    const customerRes = await fetch(`${getOpenpayUrl()}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createCustomerBody)
    });

    if (!customerRes.ok) {
      const errorData = await customerRes.json();
      console.error("Error Openpay Customer:", errorData);
      throw new Error(`Error Openpay: ${errorData.description}`);
    }

    const customerData = await customerRes.json();
    const openpayCustomerId = customerData.id;
    console.log(`✅ Cliente Openpay creado: ${openpayCustomerId}`);

    // --- PASO B: Registrar Cuenta Bancaria (CLABE) ---
    const bankAccountBody = {
      clabe: clabe,
      alias: "Cuenta Principal",
      holder_name: business_name
    };

    console.log("Enviando a Openpay (Add Bank Account)...");
    const bankRes = await fetch(`${getOpenpayUrl()}/customers/${openpayCustomerId}/bankaccounts`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bankAccountBody)
    });

    if (!bankRes.ok) {
      const errorData = await bankRes.json();
      console.error("Error Openpay Bank:", errorData);
      // Rollback visual (opcional) o simplemente fallar
      throw new Error(`Error al registrar CLABE en Openpay: ${errorData.description}`);
    }

    console.log("✅ Cuenta bancaria vinculada en Openpay");

    // --- PASO C: Guardar en Supabase (Tabla merchants) ---
    const { error: dbError } = await supabaseAdmin
      .from('merchants')
      .upsert({
        user_id: user.id,
        openpay_id: openpayCustomerId,
        business_name: business_name,
        rfc: rfc || null,
        clabe_deposit: clabe, // Guardamos la CLABE visible para referencia
        status: 'active'
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error("Error DB:", dbError);
      throw new Error("Error guardando en base de datos local");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      openpay_id: openpayCustomerId,
      version: DEPLOY_VERSION 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error General:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      version: DEPLOY_VERSION
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
