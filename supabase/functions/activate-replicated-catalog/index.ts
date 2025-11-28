// ==========================================
// FUNCION: activate-replicated-catalog
// DESCRIPCIÓN: Vincula un usuario NUEVO con un catálogo pre-generado
// ESTADO: V1.0 (ONBOARDING VIRAL)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      throw new Error('Se requieren token y userId');
    }

    // Usamos Service Role para poder escribir en la tabla aunque el usuario sea nuevo
    // y las políticas RLS aún no lo reconozcan como dueño.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`🚀 Intentando activar catálogo con token: ${token} para usuario: ${userId}`);

    // 1. BUSCAR EL CATÁLOGO HUÉRFANO
    const { data: catalog, error: fetchError } = await supabaseAdmin
      .from('replicated_catalogs')
      .select('id, is_active, original_catalog_id')
      .eq('activation_token', token)
      .single();

    if (fetchError || !catalog) {
      console.error('Catálogo no encontrado:', fetchError);
      throw new Error('El token de activación es inválido o no existe.');
    }

    // 2. VALIDAR QUE NO ESTÉ YA ACTIVO
    if (catalog.is_active) {
      throw new Error('Este catálogo ya ha sido activado previamente.');
    }

    // 3. ACTIVAR Y VINCULAR (EL "CASAMIENTO")
    const { error: updateError } = await supabaseAdmin
      .from('replicated_catalogs')
      .update({
        is_active: true,
        reseller_id: userId, // <--- Aquí vinculamos al nuevo usuario
        activated_at: new Date().toISOString()
      })
      .eq('id', catalog.id);

    if (updateError) {
      console.error('Error al actualizar:', updateError);
      throw new Error('Error técnico al activar el catálogo.');
    }

    // 4. (OPCIONAL) LOG O PREPARACIÓN DE PERFIL
    // Podríamos marcar en el perfil del usuario que ahora es "reseller", 
    // pero por ahora con tener el catálogo vinculado basta.

    console.log(`✅ Catálogo ${catalog.id} activado exitosamente para ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Catálogo activado correctamente',
        catalogId: catalog.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
