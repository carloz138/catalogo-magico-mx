-- Create RPC function to subscribe with bulk margin pricing
CREATE OR REPLACE FUNCTION public.subscribe_with_margin(
  p_catalog_id UUID,
  p_margin_percentage NUMERIC DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_catalog_owner_id UUID;
  v_subscription_id UUID;
  v_products_processed INTEGER := 0;
  v_variants_processed INTEGER := 0;
  v_replicated_catalog_id UUID;
  v_margin_multiplier NUMERIC;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Calculate margin multiplier (e.g., 20% -> 1.20)
  v_margin_multiplier := 1 + (p_margin_percentage / 100);
  
  -- Get catalog owner and validate
  SELECT user_id INTO v_catalog_owner_id
  FROM digital_catalogs
  WHERE id = p_catalog_id AND is_active = true;
  
  IF v_catalog_owner_id IS NULL THEN
    RAISE EXCEPTION 'Catalog not found or inactive';
  END IF;
  
  -- Prevent self-subscription
  IF v_catalog_owner_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot subscribe to your own catalog';
  END IF;
  
  -- Upsert subscription (idempotent)
  INSERT INTO catalog_subscriptions (subscriber_id, original_catalog_id, is_active)
  VALUES (v_user_id, p_catalog_id, true)
  ON CONFLICT (subscriber_id, original_catalog_id)
  DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id INTO v_subscription_id;
  
  -- Check if user already has a replicated catalog for this original
  SELECT id INTO v_replicated_catalog_id
  FROM replicated_catalogs
  WHERE original_catalog_id = p_catalog_id
    AND reseller_id = v_user_id
    AND is_active = true
  LIMIT 1;
  
  -- If no replicated catalog exists, create one
  IF v_replicated_catalog_id IS NULL THEN
    INSERT INTO replicated_catalogs (
      original_catalog_id,
      distributor_id,
      reseller_id,
      is_active,
      slug,
      activation_token,
      activated_at
    )
    SELECT 
      p_catalog_id,
      v_catalog_owner_id,
      v_user_id,
      true,
      'sub-' || substring(md5(gen_random_uuid()::text) from 1 for 8) || '-' || dc.slug,
      encode(gen_random_bytes(16), 'hex'),
      now()
    FROM digital_catalogs dc
    WHERE dc.id = p_catalog_id
    RETURNING id INTO v_replicated_catalog_id;
  END IF;
  
  -- Bulk insert product prices with margin (for products without variants)
  INSERT INTO reseller_product_prices (
    replicated_catalog_id,
    product_id,
    custom_price_retail,
    custom_price_wholesale,
    is_in_stock,
    stock_quantity
  )
  SELECT 
    v_replicated_catalog_id,
    p.id,
    ROUND(COALESCE(p.price_retail, 0) * v_margin_multiplier)::INTEGER,
    ROUND(COALESCE(p.price_wholesale, 0) * v_margin_multiplier)::INTEGER,
    true,
    0 -- Default stock to 0, reseller manages their own
  FROM catalog_products cp
  JOIN products p ON cp.product_id = p.id
  WHERE cp.catalog_id = p_catalog_id
    AND p.deleted_at IS NULL
    AND (p.has_variants = false OR p.has_variants IS NULL)
  ON CONFLICT (replicated_catalog_id, product_id) 
  DO UPDATE SET
    custom_price_retail = EXCLUDED.custom_price_retail,
    custom_price_wholesale = EXCLUDED.custom_price_wholesale,
    updated_at = now();
  
  GET DIAGNOSTICS v_products_processed = ROW_COUNT;
  
  -- Bulk insert variant prices with margin
  INSERT INTO reseller_variant_prices (
    replicated_catalog_id,
    variant_id,
    custom_price_retail,
    custom_price_wholesale,
    is_in_stock,
    stock_quantity
  )
  SELECT 
    v_replicated_catalog_id,
    pv.id,
    ROUND(COALESCE(pv.price_retail, p.price_retail, 0) * v_margin_multiplier)::INTEGER,
    ROUND(COALESCE(pv.price_wholesale, p.price_wholesale, 0) * v_margin_multiplier)::INTEGER,
    true,
    0
  FROM catalog_products cp
  JOIN products p ON cp.product_id = p.id
  JOIN product_variants pv ON pv.product_id = p.id
  WHERE cp.catalog_id = p_catalog_id
    AND p.deleted_at IS NULL
    AND p.has_variants = true
    AND pv.is_active = true
  ON CONFLICT (replicated_catalog_id, variant_id)
  DO UPDATE SET
    custom_price_retail = EXCLUDED.custom_price_retail,
    custom_price_wholesale = EXCLUDED.custom_price_wholesale,
    updated_at = now();
  
  GET DIAGNOSTICS v_variants_processed = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'replicated_catalog_id', v_replicated_catalog_id,
    'products_processed', v_products_processed,
    'variants_processed', v_variants_processed,
    'margin_applied', p_margin_percentage,
    'message', 'Subscription created with margin pricing'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.subscribe_with_margin(UUID, NUMERIC) TO authenticated;