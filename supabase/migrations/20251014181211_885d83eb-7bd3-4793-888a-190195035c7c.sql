-- Agregar tallas numéricas para ropa
-- Obtener el ID del tipo de variante talla_ropa
DO $$
DECLARE
  talla_ropa_id uuid;
BEGIN
  SELECT id INTO talla_ropa_id
  FROM variant_types
  WHERE name = 'talla_ropa' AND category = 'ropa';

  -- Insertar tallas numéricas comunes para ropa
  IF talla_ropa_id IS NOT NULL THEN
    INSERT INTO variant_values (variant_type_id, value, display_value, sort_order, is_active)
    VALUES
      -- Tallas numéricas de niños/jóvenes
      (talla_ropa_id, '4', '4', 20, true),
      (talla_ropa_id, '6', '6', 21, true),
      (talla_ropa_id, '8', '8', 22, true),
      (talla_ropa_id, '10', '10', 23, true),
      (talla_ropa_id, '12', '12', 24, true),
      (talla_ropa_id, '14', '14', 25, true),
      (talla_ropa_id, '16', '16', 26, true),
      -- Tallas numéricas de adultos (cintura en pulgadas)
      (talla_ropa_id, '24', '24', 30, true),
      (talla_ropa_id, '26', '26', 31, true),
      (talla_ropa_id, '28', '28', 32, true),
      (talla_ropa_id, '30', '30', 33, true),
      (talla_ropa_id, '32', '32', 34, true),
      (talla_ropa_id, '34', '34', 35, true),
      (talla_ropa_id, '36', '36', 36, true),
      (talla_ropa_id, '38', '38', 37, true),
      (talla_ropa_id, '40', '40', 38, true),
      (talla_ropa_id, '42', '42', 39, true),
      (talla_ropa_id, '44', '44', 40, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;