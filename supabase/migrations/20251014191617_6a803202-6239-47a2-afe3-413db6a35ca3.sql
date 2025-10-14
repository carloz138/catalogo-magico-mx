-- Agregar política RLS para permitir ver variantes en productos de catálogos públicos
CREATE POLICY "Anyone can view variants in public catalogs"
ON public.product_variants
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM products p
    INNER JOIN catalog_products cp ON p.id = cp.product_id
    INNER JOIN digital_catalogs dc ON cp.catalog_id = dc.id
    WHERE p.id = product_variants.product_id
      AND dc.is_active = true
      AND (dc.expires_at IS NULL OR dc.expires_at > now())
  )
);