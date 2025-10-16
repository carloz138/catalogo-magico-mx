-- Crear función RPC para completar activación de catálogos replicados
CREATE OR REPLACE FUNCTION public.complete_catalog_activation(
  p_token TEXT,
  p_reseller_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_catalog_id UUID;
  v_distributor_id UUID;
BEGIN
  -- Buscar catálogo activo pero sin reseller asignado
  SELECT id, distributor_id INTO v_catalog_id, v_distributor_id
  FROM replicated_catalogs
  WHERE activation_token = p_token
    AND is_active = true
    AND reseller_id IS NULL;
  
  IF v_catalog_id IS NULL THEN
    RAISE EXCEPTION 'Catálogo no encontrado';
  END IF;
  
  -- Asignar reseller
  UPDATE replicated_catalogs
  SET reseller_id = p_reseller_id
  WHERE id = v_catalog_id;
  
  -- Crear registro en network
  INSERT INTO distribution_network (
    distributor_id,
    reseller_id,
    replicated_catalog_id
  ) VALUES (
    v_distributor_id,
    p_reseller_id,
    v_catalog_id
  ) ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;