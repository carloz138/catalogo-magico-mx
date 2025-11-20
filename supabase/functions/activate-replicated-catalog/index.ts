// ==========================================
// FUNCION: activate-replicated-catalog (FASE D)
// ESTADO: FIX_V2 (Activación segura, Token quemado y HASH)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';
const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "UNKNOWN_HASH";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
    // Logging Inicial
    console.log(JSON.stringify({
        event: "FUNC_START",
        function: "activate-replicated-catalog",
        version: DEPLOY_VERSION,
        timestamp: new Date().toISOString()
    }));

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // El frontend debe enviar el token (del Magic Link) y el user_id (del usuario L2 logueado)
        const { activation_token, user_id } = await req.json();

        if (!activation_token || !user_id) {
            throw new Error('Token de activación y User ID son requeridos.');
        }

        // 1. Cliente Admin (Service Role para escritura crítica)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        // 2. Validación de Token y Status
        const { data: replica, error: selectError } = await supabaseAdmin
            .from('replicated_catalogs')
            .select('id, is_active')
            .eq('activation_token', activation_token)
            .maybeSingle();

        if (selectError) throw selectError;

        if (!replica) {
            throw new Error('Token inválido o catálogo no encontrado.');
        }

        if (replica.is_active) {
            // El usuario L2 hizo doble clic, no es un error crítico.
            console.warn(`WARN: Token ${activation_token} ya activo.`);
        }

        // 3. Activación Segura (Quemar Token)
        const { error: updateError } = await supabaseAdmin
            .from('replicated_catalogs')
            .update({
                is_active: true,
                reseller_id: user_id, // Asignamos el dueño L2
                activation_token: null, // 🔥 Quemamos el token por seguridad
                activated_at: new Date().toISOString()
            })
            .eq('id', replica.id);

        if (updateError) {
            console.error('❌ Error al actualizar la réplica:', updateError);
            throw new Error('Fallo al actualizar la base de datos.');
        }

        console.log(`✅ Catálogo Réplica ${replica.id} activado por usuario ${user_id}. Token quemado.`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Catálogo activado exitosamente.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('❌ Error en activate-replicated-catalog:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
