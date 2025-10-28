-- Fix: Actualizar función complete_catalog_activation para retornar JSON con información útil
DROP FUNCTION IF EXISTS public.complete_catalog_activation(text);

CREATE OR REPLACE FUNCTION public.complete_catalog_activation(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_catalog replicated_catalogs;
  v_current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario que está ejecutando esta función
  v_current_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, fallar
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Buscar el catálogo usando el token
  SELECT * INTO v_catalog
  FROM replicated_catalogs
  WHERE activation_token = p_token;

  -- Si no existe, fallar
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token inválido o catálogo no encontrado';
  END IF;

  -- Verificar que el usuario sea el dueño del catálogo
  IF v_catalog.reseller_id IS NULL OR v_catalog.reseller_id != v_current_user_id THEN
    RAISE EXCEPTION 'No autorizado: el usuario % no coincide con el reseller_id % del catálogo', v_current_user_id, v_catalog.reseller_id;
  END IF;

  -- Ya está activo? No hacer nada
  IF v_catalog.is_active THEN
    RETURN json_build_object(
      'success', true,
      'catalog_id', v_catalog.id,
      'is_active', true,
      'message', 'El catálogo ya estaba activo'
    );
  END IF;

  -- ACTUALIZAR EL CATÁLOGO A ACTIVO
  UPDATE replicated_catalogs
  SET 
    is_active = TRUE,
    activated_at = NOW(),
    updated_at = NOW()
  WHERE id = v_catalog.id;

  -- Log para debugging
  RAISE LOG 'Catálogo replicado % activado para usuario %', v_catalog.id, v_current_user_id;

  -- Retornar éxito con información
  RETURN json_build_object(
    'success', true,
    'catalog_id', v_catalog.id,
    'is_active', true,
    'activated_at', NOW(),
    'message', 'Catálogo activado correctamente'
  );
END;
$$;