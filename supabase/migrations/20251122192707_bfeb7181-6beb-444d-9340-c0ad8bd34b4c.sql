-- Actualizar función can_generate_catalog para manejar límites ilimitados correctamente
CREATE OR REPLACE FUNCTION public.can_generate_catalog(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_month integer;
  v_catalogs_used integer;
  v_catalogs_limit integer;
  v_plan_name text;
  v_result json;
  v_is_unlimited boolean;
BEGIN
  -- Calcular mes actual en formato YYYYMM
  v_current_month := (EXTRACT(YEAR FROM CURRENT_DATE)::text || 
                      LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::text, 2, '0'))::integer;
  
  -- Obtener límite del plan activo
  SELECT 
    cp.max_catalogs,
    cp.name
  INTO 
    v_catalogs_limit,
    v_plan_name
  FROM subscriptions s
  INNER JOIN credit_packages cp ON s.package_id = cp.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  LIMIT 1;
  
  -- Si no tiene suscripción activa
  IF v_catalogs_limit IS NULL THEN
    v_result := json_build_object(
      'can_generate', false,
      'reason', 'no_subscription',
      'message', 'No tienes una suscripción activa',
      'catalogs_used', 0,
      'catalogs_limit', 0,
      'remaining', 0,
      'plan_name', NULL
    );
    RETURN v_result;
  END IF;
  
  -- Obtener uso actual del mes
  SELECT COALESCE(catalogs_generated, 0)
  INTO v_catalogs_used
  FROM catalog_usage
  WHERE user_id = p_user_id
    AND usage_month = v_current_month;
  
  -- Si no hay registro, el uso es 0
  IF v_catalogs_used IS NULL THEN
    v_catalogs_used := 0;
  END IF;
  
  -- Determinar si es plan ilimitado (0, NULL o >= 999999)
  v_is_unlimited := (v_catalogs_limit = 0 OR v_catalogs_limit IS NULL OR v_catalogs_limit >= 999999);
  
  -- Si el límite es ilimitado
  IF v_is_unlimited THEN
    v_result := json_build_object(
      'can_generate', true,
      'reason', 'unlimited',
      'message', 'Catálogos ilimitados disponibles',
      'catalogs_used', v_catalogs_used,
      'catalogs_limit', 'unlimited',
      'remaining', 999,
      'plan_name', v_plan_name
    );
    RETURN v_result;
  END IF;
  
  -- Verificar si aún tiene catálogos disponibles
  IF v_catalogs_used < v_catalogs_limit THEN
    v_result := json_build_object(
      'can_generate', true,
      'reason', 'within_limit',
      'message', format('%s catálogos restantes este mes', v_catalogs_limit - v_catalogs_used),
      'catalogs_used', v_catalogs_used,
      'catalogs_limit', v_catalogs_limit,
      'remaining', v_catalogs_limit - v_catalogs_used,
      'plan_name', v_plan_name
    );
  ELSE
    v_result := json_build_object(
      'can_generate', false,
      'reason', 'limit_reached',
      'message', format('Has alcanzado el límite de %s catálogos este mes', v_catalogs_limit),
      'catalogs_used', v_catalogs_used,
      'catalogs_limit', v_catalogs_limit,
      'remaining', 0,
      'plan_name', v_plan_name
    );
  END IF;
  
  RETURN v_result;
END;
$function$;