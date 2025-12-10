-- Smart Recommendations RPC Function
-- Supports 3 scopes: CATALOG (L1 strict), STORE (L2 replicated), GLOBAL (Network Effect)
-- Implements Vendor Loyalty (same vendor first) + Category Fallback (network discovery)

CREATE OR REPLACE FUNCTION public.get_smart_recommendations(
  p_product_ids UUID[],
  p_scope TEXT DEFAULT 'CATALOG',
  p_catalog_id UUID DEFAULT NULL,
  p_reseller_id UUID DEFAULT NULL,
  p_vendor_id UUID DEFAULT NULL,
  p_target_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price_retail INTEGER,
  processed_image_url TEXT,
  original_image_url TEXT,
  stock_quantity INTEGER,
  allow_backorder BOOLEAN,
  lead_time_days INTEGER,
  category TEXT,
  vendor_id UUID,
  recommendation_reason TEXT,
  confidence_score NUMERIC,
  source_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH cart_context AS (
    SELECT 
      array_agg(DISTINCT p.category) FILTER (WHERE p.category IS NOT NULL) as categories,
      array_agg(DISTINCT tag) FILTER (WHERE tag IS NOT NULL) as all_tags,
      array_agg(DISTINCT COALESCE(p.vendor_id, p.user_id)) as cart_owners
    FROM products p
    LEFT JOIN LATERAL unnest(p.tags) AS tag ON true
    WHERE p.id = ANY(p_product_ids)
  ),
  -- Step 1: MBA (Market Basket Analysis)
  mba_results AS (
    SELECT 
      p.id,
      p.name,
      p.price_retail,
      p.processed_image_url,
      p.original_image_url,
      p.stock_quantity,
      COALESCE(p.allow_backorder, false) as allow_backorder,
      COALESCE(p.lead_time_days, 0) as lead_time_days,
      p.category,
      p.vendor_id,
      (pa.co_occurrence_count || ' clientes también compraron esto')::TEXT as recommendation_reason,
      pa.confidence_score,
      'mba'::TEXT as source_type,
      1 as priority_tier
    FROM product_associations pa
    JOIN products p ON p.id = pa.product_b_id
    WHERE pa.product_a_id = ANY(p_product_ids)
      AND NOT (pa.product_b_id = ANY(p_product_ids))
      AND p.deleted_at IS NULL
      AND (p.stock_quantity > 0 OR p.allow_backorder = true)
      AND (
        p_scope = 'GLOBAL'
        OR (p_scope = 'CATALOG' AND p_catalog_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM catalog_products cp WHERE cp.catalog_id = p_catalog_id AND cp.product_id = p.id
        ))
        OR (p_scope = 'STORE' AND p_reseller_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM replicated_catalogs rc
          JOIN catalog_products cp ON cp.catalog_id = rc.original_catalog_id
          WHERE rc.reseller_id = p_reseller_id AND rc.is_active = true AND cp.product_id = p.id
        ))
      )
  ),
  -- Step 2: Similar Products (Category/Tag Match with Loyalty)
  similar_results AS (
    SELECT 
      p.id,
      p.name,
      p.price_retail,
      p.processed_image_url,
      p.original_image_url,
      p.stock_quantity,
      COALESCE(p.allow_backorder, false) as allow_backorder,
      COALESCE(p.lead_time_days, 0) as lead_time_days,
      p.category,
      p.vendor_id,
      'Porque es similar a lo que llevas'::TEXT as recommendation_reason,
      CASE 
        WHEN COALESCE(p.vendor_id, p.user_id) = ANY((SELECT cart_owners FROM cart_context)) THEN 0.9
        ELSE 0.5
      END::NUMERIC as confidence_score,
      'similar'::TEXT as source_type,
      2 as priority_tier
    FROM products p, cart_context cc
    WHERE p.deleted_at IS NULL
      AND NOT (p.id = ANY(p_product_ids))
      AND (p.stock_quantity > 0 OR p.allow_backorder = true)
      AND (
        p.category = ANY(cc.categories)
        OR (p.tags IS NOT NULL AND cc.all_tags IS NOT NULL AND p.tags && cc.all_tags)
        OR (p_target_category IS NOT NULL AND p.category = p_target_category)
      )
      AND (
        p_scope = 'GLOBAL'
        OR (p_scope = 'CATALOG' AND p_catalog_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM catalog_products cp WHERE cp.catalog_id = p_catalog_id AND cp.product_id = p.id
        ))
        OR (p_scope = 'STORE' AND p_reseller_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM replicated_catalogs rc
          JOIN catalog_products cp ON cp.catalog_id = rc.original_catalog_id
          WHERE rc.reseller_id = p_reseller_id AND rc.is_active = true AND cp.product_id = p.id
        ))
      )
  ),
  -- Step 3: Top Sold with Vendor Loyalty + Network Category Fallback
  top_sold_results AS (
    SELECT 
      p.id,
      p.name,
      p.price_retail,
      p.processed_image_url,
      p.original_image_url,
      p.stock_quantity,
      COALESCE(p.allow_backorder, false) as allow_backorder,
      COALESCE(p.lead_time_days, 0) as lead_time_days,
      p.category,
      p.vendor_id,
      CASE 
        WHEN COALESCE(p.vendor_id, p.user_id) = ANY((SELECT cart_owners FROM cart_context)) 
          THEN '¡Más vendido del proveedor!'
        WHEN p.category = ANY((SELECT categories FROM cart_context)) 
          THEN '¡Popular en esta categoría!'
        ELSE '¡Es uno de los más vendidos!'
      END::TEXT as recommendation_reason,
      CASE 
        WHEN COALESCE(p.vendor_id, p.user_id) = ANY((SELECT cart_owners FROM cart_context)) THEN 0.8
        WHEN p.category = ANY((SELECT categories FROM cart_context)) THEN 0.6
        ELSE 0.3
      END::NUMERIC as confidence_score,
      CASE 
        WHEN COALESCE(p.vendor_id, p.user_id) = ANY((SELECT cart_owners FROM cart_context)) THEN 'top_sold'
        ELSE 'category_network'
      END::TEXT as source_type,
      3 as priority_tier
    FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    JOIN products p ON qi.product_id = p.id
    CROSS JOIN cart_context cc
    WHERE q.status = 'accepted'
      AND p.deleted_at IS NULL
      AND NOT (p.id = ANY(p_product_ids))
      AND (p.stock_quantity > 0 OR p.allow_backorder = true)
      AND (
        p_scope = 'GLOBAL'
        OR (p_scope = 'CATALOG' AND p_catalog_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM catalog_products cp WHERE cp.catalog_id = p_catalog_id AND cp.product_id = p.id
        ))
        OR (p_scope = 'STORE' AND p_reseller_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM replicated_catalogs rc
          JOIN catalog_products cp ON cp.catalog_id = rc.original_catalog_id
          WHERE rc.reseller_id = p_reseller_id AND rc.is_active = true AND cp.product_id = p.id
        ))
      )
    GROUP BY p.id, p.name, p.price_retail, p.processed_image_url, p.original_image_url,
             p.stock_quantity, p.allow_backorder, p.lead_time_days, p.category, p.vendor_id, cc.cart_owners, cc.categories
  ),
  -- Combine all with priority ordering
  all_recommendations AS (
    SELECT * FROM mba_results
    UNION ALL
    SELECT * FROM similar_results
    UNION ALL
    SELECT * FROM top_sold_results
  ),
  -- Deduplicate and rank
  ranked AS (
    SELECT DISTINCT ON (ar.id)
      ar.id,
      ar.name,
      ar.price_retail,
      ar.processed_image_url,
      ar.original_image_url,
      ar.stock_quantity,
      ar.allow_backorder,
      ar.lead_time_days,
      ar.category,
      ar.vendor_id,
      ar.recommendation_reason,
      ar.confidence_score,
      ar.source_type,
      ar.priority_tier
    FROM all_recommendations ar
    ORDER BY ar.id, ar.priority_tier ASC, ar.confidence_score DESC
  )
  SELECT 
    r.id,
    r.name,
    r.price_retail,
    r.processed_image_url,
    r.original_image_url,
    r.stock_quantity,
    r.allow_backorder,
    r.lead_time_days,
    r.category,
    r.vendor_id,
    r.recommendation_reason,
    r.confidence_score,
    r.source_type
  FROM ranked r
  ORDER BY r.priority_tier ASC, r.confidence_score DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_smart_recommendations IS 
'Smart recommendation engine with 3 scopes: CATALOG (L1 strict), STORE (L2 reseller), GLOBAL (network discovery). 
Implements vendor loyalty (same vendor first) and category fallback (network effect for new vendors).';