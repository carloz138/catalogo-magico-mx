-- Agregar política RLS para permitir ver productos en catálogos públicos
CREATE POLICY "Anyone can view products in public catalogs"
ON public.products
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM digital_catalogs dc
    INNER JOIN catalog_products cp ON dc.id = cp.catalog_id
    WHERE cp.product_id = products.id
      AND dc.is_active = true
      AND (dc.expires_at IS NULL OR dc.expires_at > now())
      AND (dc.is_private = false OR dc.is_private IS NULL)
  )
);