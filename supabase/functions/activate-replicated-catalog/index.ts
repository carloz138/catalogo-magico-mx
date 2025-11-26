// ==========================================
// FUNCION: activate-replicated-catalog
// DESCRIPCIÓN: Vincula un catálogo replicado a un usuario (Flujo Híbrido o Directo)
// ESTADO: FIX_V5 (Soporte para Login Directo + HASH)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({ event: "FUNC_START", version: DEPLOY_VERSION }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { token, email, name, user_id, strategy } = await req.json();

    if (!token) throw new Error('Token requerido.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 1. VALIDAR EL CATÁLOGO
    const { data: replica, error: replicaError } = await supabaseAdmin
        .from('replicated_catalogs')
        .select('id, is_active')
        .eq('activation_token', token)
        .maybeSingle();

    if (replicaError || !replica) throw new Error('Token inválido.');
    
    // Si ya está activo, solo retornamos éxito (Idempotencia)
    if (replica.is_active) {
        return new Response(JSON.stringify({ success: true, message: 'Catálogo ya activo.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    let targetUserId = user_id;

    // 2. SI ES FLUJO "MAGIC LINK" (Antiguo/Fallback), CREAR USUARIO
    if (!targetUserId && email) {
        // ... (Lógica de crear usuario anterior, se mantiene por si acaso) ...
        // Para simplificar este ejemplo, asumimos que el nuevo front SIEMPRE manda user_id o usa el flujo directo
        // Si quisieras mantener el legacy, aquí iría el createUser.
        throw new Error("Flujo de email legacy no soportado en esta versión. Por favor inicia sesión.");
    }

    if (!targetUserId) throw new Error("Usuario no identificado.");

    // 3. VINCULAR (Activación)
    const { error: updateError } = await supabaseAdmin
        .from('replicated_catalogs')
        .update({
            is_active: true,
            reseller_id: targetUserId,
            activated_at: new Date().toISOString()
        })
        .eq('id', replica.id);

    if (updateError) throw updateError;

    // 4. (Opcional) Enviar correo de bienvenida
    // ...

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
