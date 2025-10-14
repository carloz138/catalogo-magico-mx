-- Agregar soporte de variantes a las cotizaciones

-- 1. Agregar columna variant_id a quote_items
ALTER TABLE quote_items
ADD COLUMN variant_id uuid REFERENCES product_variants(id);

-- 2. Agregar índice para mejor rendimiento
CREATE INDEX idx_quote_items_variant_id ON quote_items(variant_id);

-- 3. Agregar columna variant_description para guardar la descripción de la variante (ej: "Color: Rojo, Talla: M")
ALTER TABLE quote_items
ADD COLUMN variant_description text;

-- 4. Modificar la unicidad para permitir mismo producto con diferentes variantes
-- El mismo producto con diferentes variantes son partidas separadas
COMMENT ON COLUMN quote_items.variant_id IS 'ID de la variante específica del producto, permite diferenciar entre combinaciones de variantes del mismo producto';