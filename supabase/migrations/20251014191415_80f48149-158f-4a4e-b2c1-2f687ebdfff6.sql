-- Agregar política RLS para permitir ver catalog_products en catálogos públicos
CREATE POLICY "Anyone can view products in public catalogs"
ON public.catalog_products
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM digital_catalogs dc
    WHERE dc.id = catalog_products.catalog_id
      AND dc.is_active = true
      AND (dc.expires_at IS NULL OR dc.expires_at > now())
  )
);