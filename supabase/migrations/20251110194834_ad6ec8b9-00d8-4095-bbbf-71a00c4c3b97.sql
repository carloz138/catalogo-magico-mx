-- ============================================
-- FIX: Políticas RLS para cotizaciones públicas
-- ============================================

-- 1. Eliminar políticas duplicadas y conflictivas
DROP POLICY IF EXISTS "Permitir creación de cotizaciones públicas" ON quotes;
DROP POLICY IF EXISTS "Permitir creación pública de cotizaciones" ON quotes;
DROP POLICY IF EXISTS "Permitir inserción pública de items" ON quote_items;

-- 2. Crear política correcta para INSERT en quotes (usuarios anónimos Y autenticados)
CREATE POLICY "allow_public_quote_creation" 
ON quotes 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 3. Crear política correcta para INSERT en quote_items (usuarios anónimos Y autenticados)
CREATE POLICY "allow_public_quote_items_creation" 
ON quote_items 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 4. Asegurar que usuarios anónimos puedan leer productos en catálogos públicos
-- (ya existe pero verificamos que esté correcta)
DROP POLICY IF EXISTS "Anyone can view products in public catalogs" ON products;
CREATE POLICY "allow_public_product_view" 
ON products 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM digital_catalogs dc
    JOIN catalog_products cp ON dc.id = cp.catalog_id
    WHERE cp.product_id = products.id
      AND dc.is_active = true
      AND (dc.expires_at IS NULL OR dc.expires_at > now())
  )
);