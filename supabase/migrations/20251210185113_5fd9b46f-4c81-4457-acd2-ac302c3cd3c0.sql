-- Function to get products from subscribed catalogs for a reseller
CREATE OR REPLACE FUNCTION get_subscribed_catalog_products(p_subscriber_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  product_description TEXT,
  price_retail INTEGER,
  price_wholesale INTEGER,
  category TEXT,
  image_url TEXT,
  vendor_id UUID,
  vendor_name TEXT,
  catalog_id UUID,
  catalog_name TEXT,
  is_subscribed BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.description AS product_description,
    p.price_retail,
    p.price_wholesale,
    p.category,
    COALESCE(p.processed_image_url, p.original_image_url) AS image_url,
    p.vendor_id,
    COALESCE(bi.business_name, 'Proveedor') AS vendor_name,
    dc.id AS catalog_id,
    dc.name AS catalog_name,
    true AS is_subscribed
  FROM catalog_subscriptions cs
  JOIN digital_catalogs dc ON dc.id = cs.original_catalog_id
  JOIN catalog_products cp ON cp.catalog_id = dc.id
  JOIN products p ON p.id = cp.product_id
  LEFT JOIN business_info bi ON bi.user_id = dc.user_id
  WHERE cs.subscriber_id = p_subscriber_id
    AND cs.is_active = true
    AND dc.is_active = true
    AND p.deleted_at IS NULL;
END;
$$;

-- Update search_logs RLS to allow vendors to see logs where they are related
CREATE POLICY "Vendors can view logs related to their products"
ON search_logs
FOR SELECT
USING (
  auth.uid() = ANY(related_vendor_ids)
  OR user_id = auth.uid()
);

-- Grant execute on new function
GRANT EXECUTE ON FUNCTION get_subscribed_catalog_products(UUID) TO authenticated;