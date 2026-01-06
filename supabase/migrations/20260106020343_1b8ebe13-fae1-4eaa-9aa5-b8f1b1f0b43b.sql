
-- RPC para obtener productos de un catálogo con precios inteligentes para Super Tiendas
-- Aplica la jerarquía: custom_price > original_price

CREATE OR REPLACE FUNCTION get_super_catalog_products(p_catalog_id UUID, p_catalog_owner_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  description TEXT,
  price_retail INTEGER,
  price_wholesale INTEGER,
  wholesale_min_qty INTEGER,
  original_image_url TEXT,
  processed_image_url TEXT,
  tags TEXT[],
  category TEXT,
  has_variants BOOLEAN,
  vendor_id UUID,
  user_id UUID,
  is_own_product BOOLEAN,
  source_vendor_name TEXT,
  replicated_catalog_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH catalog_product_list AS (
    -- Paso 1: Obtener todos los productos del catálogo
    SELECT 
      p.id AS product_id,
      p.name,
      p.sku,
      p.description,
      p.price_retail AS original_price_retail,
      p.price_wholesale AS original_price_wholesale,
      p.wholesale_min_qty,
      p.original_image_url,
      p.processed_image_url,
      p.tags,
      p.category,
      p.has_variants,
      p.vendor_id,
      p.user_id AS product_owner_id,
      cp.sort_order
    FROM catalog_products cp
    JOIN products p ON p.id = cp.product_id
    WHERE cp.catalog_id = p_catalog_id
      AND p.deleted_at IS NULL
  ),
  replicated_relations AS (
    -- Paso 2: Buscar catálogos replicados activos entre el owner y cada proveedor
    SELECT DISTINCT
      rc.id AS replicated_catalog_id,
      dc.user_id AS supplier_id,
      bi.business_name AS vendor_name
    FROM replicated_catalogs rc
    JOIN digital_catalogs dc ON dc.id = rc.original_catalog_id
    LEFT JOIN business_info bi ON bi.user_id = dc.user_id
    WHERE rc.reseller_id = p_catalog_owner_id
      AND rc.is_active = TRUE
  ),
  products_with_pricing AS (
    -- Paso 3: Combinar productos con precios personalizados
    SELECT 
      cpl.product_id,
      cpl.name,
      cpl.sku,
      cpl.description,
      -- Lógica de precios:
      -- Si es producto propio -> usar precio original
      -- Si es externo y hay custom_price -> usar custom_price
      -- Si es externo sin custom_price -> usar precio original
      CASE 
        WHEN cpl.product_owner_id = p_catalog_owner_id THEN cpl.original_price_retail
        WHEN rpp.custom_price_retail IS NOT NULL THEN rpp.custom_price_retail
        ELSE cpl.original_price_retail
      END AS final_price_retail,
      CASE 
        WHEN cpl.product_owner_id = p_catalog_owner_id THEN cpl.original_price_wholesale
        WHEN rpp.custom_price_wholesale IS NOT NULL THEN rpp.custom_price_wholesale
        ELSE cpl.original_price_wholesale
      END AS final_price_wholesale,
      cpl.wholesale_min_qty,
      cpl.original_image_url,
      cpl.processed_image_url,
      cpl.tags,
      cpl.category,
      cpl.has_variants,
      cpl.vendor_id,
      cpl.product_owner_id,
      (cpl.product_owner_id = p_catalog_owner_id) AS is_own,
      rr.vendor_name,
      rr.replicated_catalog_id,
      cpl.sort_order
    FROM catalog_product_list cpl
    LEFT JOIN replicated_relations rr ON rr.supplier_id = cpl.product_owner_id
    LEFT JOIN reseller_product_prices rpp ON rpp.replicated_catalog_id = rr.replicated_catalog_id 
      AND rpp.product_id = cpl.product_id
  )
  SELECT 
    pwp.product_id AS id,
    pwp.name,
    pwp.sku,
    pwp.description,
    pwp.final_price_retail AS price_retail,
    pwp.final_price_wholesale AS price_wholesale,
    pwp.wholesale_min_qty,
    pwp.original_image_url,
    pwp.processed_image_url,
    pwp.tags,
    pwp.category,
    pwp.has_variants,
    pwp.vendor_id,
    pwp.product_owner_id AS user_id,
    pwp.is_own AS is_own_product,
    pwp.vendor_name AS source_vendor_name,
    pwp.replicated_catalog_id
  FROM products_with_pricing pwp
  ORDER BY pwp.sort_order;
END;
$$;

-- Función auxiliar para obtener variantes con precios personalizados
CREATE OR REPLACE FUNCTION get_super_catalog_variants(p_product_id UUID, p_replicated_catalog_id UUID)
RETURNS TABLE (
  id UUID,
  variant_combination JSONB,
  sku VARCHAR,
  price_retail NUMERIC,
  price_wholesale NUMERIC,
  stock_quantity INTEGER,
  is_default BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.variant_combination,
    pv.sku,
    -- Si hay precio personalizado, usarlo; si no, usar el original
    COALESCE(rvp.custom_price_retail::NUMERIC, pv.price_retail) AS price_retail,
    COALESCE(rvp.custom_price_wholesale::NUMERIC, pv.price_wholesale) AS price_wholesale,
    COALESCE(rvp.stock_quantity, pv.stock_quantity) AS stock_quantity,
    pv.is_default
  FROM product_variants pv
  LEFT JOIN reseller_variant_prices rvp ON rvp.variant_id = pv.id 
    AND rvp.replicated_catalog_id = p_replicated_catalog_id
  WHERE pv.product_id = p_product_id
    AND pv.is_active = TRUE
  ORDER BY pv.is_default DESC, pv.created_at;
END;
$$;
