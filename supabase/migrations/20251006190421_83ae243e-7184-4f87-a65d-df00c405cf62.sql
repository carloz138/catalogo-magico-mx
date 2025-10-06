-- =====================================================
-- FUNCIONES AUXILIARES PARA CATÁLOGOS DIGITALES
-- =====================================================

-- 1. Función para generar slug único de 9 caracteres
CREATE OR REPLACE FUNCTION generate_catalog_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..9 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM digital_catalogs WHERE slug = result) INTO slug_exists;
    
    IF NOT slug_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para calcular precio ajustado
CREATE OR REPLACE FUNCTION calculate_adjusted_price(
  base_price NUMERIC,
  adjustment_percentage NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  -- adjustment_percentage: -10 = 10% descuento, +10 = 10% incremento
  RETURN ROUND(base_price * (1 + adjustment_percentage / 100));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Función para verificar límites de catálogo según plan
CREATE OR REPLACE FUNCTION check_catalog_limit(p_user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  message TEXT
) AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER := 1;
  v_package_name TEXT;
  v_can_create BOOLEAN;
  v_message TEXT;
BEGIN
  -- Contar catálogos activos del usuario
  SELECT COUNT(*) INTO v_current_count
  FROM digital_catalogs
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Determinar límite según plan
  SELECT cp.name INTO v_package_name
  FROM subscriptions s
  JOIN credit_packages cp ON s.package_id = cp.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Asignar límites según el nombre del paquete
  IF v_package_name IS NULL THEN
    v_max_allowed := 1;
  ELSIF v_package_name ILIKE '%básico%' OR v_package_name ILIKE '%starter%' THEN
    v_max_allowed := 1;
  ELSIF v_package_name ILIKE '%profesional%' OR v_package_name ILIKE '%medio%' THEN
    v_max_allowed := 3;
  ELSIF v_package_name ILIKE '%premium%' OR v_package_name ILIKE '%empresarial%' THEN
    v_max_allowed := 10;
  ELSE
    v_max_allowed := 1;
  END IF;
  
  -- Determinar si puede crear
  v_can_create := v_current_count < v_max_allowed;
  
  IF v_can_create THEN
    v_message := 'Puedes crear ' || (v_max_allowed - v_current_count)::TEXT || ' catálogo(s) más';
  ELSE
    v_message := 'Has alcanzado tu límite de ' || v_max_allowed::TEXT || ' catálogo(s) activos';
  END IF;
  
  RETURN QUERY SELECT v_can_create, v_current_count, v_max_allowed, v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para verificar si usuario puede hacer catálogos privados
CREATE OR REPLACE FUNCTION can_create_private_catalog(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_package_name TEXT;
BEGIN
  SELECT cp.name INTO v_package_name
  FROM subscriptions s
  JOIN credit_packages cp ON s.package_id = cp.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Solo planes medio y premium pueden crear catálogos privados
  IF v_package_name IS NULL THEN
    RETURN false;
  ELSIF v_package_name ILIKE '%básico%' OR v_package_name ILIKE '%starter%' THEN
    RETURN false;
  ELSE
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para incrementar vista de catálogo
CREATE OR REPLACE FUNCTION increment_catalog_views(p_catalog_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE digital_catalogs
  SET view_count = view_count + 1
  WHERE id = p_catalog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;