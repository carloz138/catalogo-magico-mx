// ==========================================
// FUNCION: get-quote-by-token (FASE C)
// ESTADO: FIX_V3 (FINAL - Ambigüedad PGRST201 Resuelta)
// ==========================================
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
const DEPLOY_VERSION = "2025.11.19_v3.0_PHASE_C_FINAL";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper de búsqueda de usuario (reutilizado de las Fases A/B)
async function getOwnerData(supabaseAdmin: any, ownerId: string): Promise<any> {
  const tablesToTry = ["profiles", "business_info", "users"];
  const selectFields = "business_name, full_name";
  for (const tableName of tablesToTry) {
    const { data } = await supabaseAdmin.from(tableName).select(selectFields).eq("id", ownerId).maybeSingle();
    if (data) return data;
  }
  return null;
}

Deno.serve(async (req) => {
  // Logging Inicial
  console.log(
    JSON.stringify({
      event: "FUNC_START",
      function: "get-quote-by-token",
      version: DEPLOY_VERSION,
      timestamp: new Date().toISOString(),
    }),
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Recibimos el token de activación del Frontend (L2 ANÓNIMO)
    const { token } = await req.json();
    if (!token) throw new Error("Token no proporcionado"); // Crear cliente con Service Role para bypass RLS

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    console.log("🔍 Buscando token de ACTIVACIÓN:", token); // 2. CRÍTICO: Buscar en replicated_catalogs (Vínculo y Validación)

    const { data: replica, error: replicaError } = await supabaseAdmin
      .from("replicated_catalogs")
      .select("id, quote_id, is_active")
      .eq("activation_token", token)
      .maybeSingle();

    if (replicaError) throw replicaError;

    if (!replica) {
      console.error("❌ Token Inválido o inexistente en replicated_catalogs.");
      throw new Error("Link de activación inválido o expirado.");
    }

    // Validación de Token Usado (si is_active es TRUE, fallar)
    if (replica.is_active) {
      throw new Error("Este catálogo ya fue activado previamente.");
    }

    const quoteId = replica.quote_id; // 3. Buscar la Cotización Completa para la vista previa - FIX DE AMBIGÜEDAD

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select(
        `
        *,
        quote_items (*),
        digital_catalogs (
          id,
          name,
          enable_distribution,
          user_id
        ),
        replicated_catalogs!replicated_catalogs_quote_id_fkey (id) // ⬅️ FIX DE AMBIGÜEDAD PGRST201
      `,
      )
      .eq("id", quoteId)
      .single();

    if (quoteError) throw quoteError;

    // 4. Obtener business info del proveedor (quién te invita)
    let businessInfo = null;
    if (quote.digital_catalogs?.user_id) {
      businessInfo = await getOwnerData(supabaseAdmin, quote.digital_catalogs.user_id);
    } // 5. Ensamblar la respuesta (preparando el objeto para el renderizado del frontend)
    if (quote.digital_catalogs) {
      quote.digital_catalogs.users = businessInfo;
    }
    quote.replicated_catalogs = replica;
    return new Response(
      JSON.stringify({
        success: true,
        quote: quote,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("❌ Error inesperado en Fase C:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});
