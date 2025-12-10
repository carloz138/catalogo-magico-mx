-- =====================================================
-- PHASE 4: Catalog Marketplace & Analytics Routing
-- =====================================================

-- 1. Create catalog_subscriptions table for L2 marketplace subscriptions
CREATE TABLE public.catalog_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL, -- L2 user who subscribes
  original_catalog_id UUID NOT NULL REFERENCES public.digital_catalogs(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate subscriptions
  UNIQUE(subscriber_id, original_catalog_id)
);

-- Enable RLS on catalog_subscriptions
ALTER TABLE public.catalog_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalog_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.catalog_subscriptions
  FOR SELECT
  USING (subscriber_id = auth.uid());

CREATE POLICY "Users can create subscriptions"
  ON public.catalog_subscriptions
  FOR INSERT
  WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
  ON public.catalog_subscriptions
  FOR UPDATE
  USING (subscriber_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions"
  ON public.catalog_subscriptions
  FOR DELETE
  USING (subscriber_id = auth.uid());

-- Catalog owners can see who subscribes to their catalogs
CREATE POLICY "Catalog owners can view subscriptions to their catalogs"
  ON public.catalog_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_catalogs dc
      WHERE dc.id = catalog_subscriptions.original_catalog_id
      AND dc.user_id = auth.uid()
    )
  );

-- 2. Add related_vendor_ids to search_logs for analytics routing
ALTER TABLE public.search_logs 
ADD COLUMN IF NOT EXISTS related_vendor_ids UUID[] DEFAULT '{}';

-- 3. Create index for efficient vendor-based analytics queries
CREATE INDEX IF NOT EXISTS idx_search_logs_related_vendors 
ON public.search_logs USING GIN (related_vendor_ids);

-- 4. Create function to subscribe to a catalog (idempotent)
CREATE OR REPLACE FUNCTION public.subscribe_to_catalog(
  p_catalog_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_catalog_owner_id UUID;
  v_subscription_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get catalog owner
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
  
  RETURN json_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'message', 'Subscribed successfully'
  );
END;
$$;

-- 5. Create function to get marketplace catalogs (public catalogs from L1 vendors)
CREATE OR REPLACE FUNCTION public.get_marketplace_catalogs(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  catalog_id UUID,
  catalog_name TEXT,
  catalog_description TEXT,
  catalog_slug TEXT,
  vendor_id UUID,
  vendor_name TEXT,
  vendor_logo TEXT,
  product_count BIGINT,
  is_subscribed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    dc.id as catalog_id,
    dc.name as catalog_name,
    dc.description as catalog_description,
    dc.slug as catalog_slug,
    dc.user_id as vendor_id,
    COALESCE(bi.business_name, 'Proveedor') as vendor_name,
    bi.logo_url as vendor_logo,
    (SELECT COUNT(*) FROM catalog_products cp WHERE cp.catalog_id = dc.id) as product_count,
    EXISTS (
      SELECT 1 FROM catalog_subscriptions cs 
      WHERE cs.original_catalog_id = dc.id 
      AND cs.subscriber_id = v_user_id 
      AND cs.is_active = true
    ) as is_subscribed,
    dc.created_at
  FROM digital_catalogs dc
  LEFT JOIN business_info bi ON bi.user_id = dc.user_id
  WHERE dc.is_active = true
    AND dc.is_private = false
    AND dc.enable_distribution = true -- Only catalogs that allow distribution
    AND (dc.expires_at IS NULL OR dc.expires_at > now())
    AND dc.user_id != v_user_id -- Exclude own catalogs
  ORDER BY dc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 6. Create function to get vendor-filtered search logs (for L1 analytics)
CREATE OR REPLACE FUNCTION public.get_vendor_search_analytics(
  p_vendor_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  search_term TEXT,
  total_count BIGINT,
  zero_results_count BIGINT,
  last_searched TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.search_term,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE sl.results_count = 0) as zero_results_count,
    MAX(sl.created_at) as last_searched
  FROM search_logs sl
  WHERE 
    -- Include logs where vendor's products were in results
    (p_vendor_id = ANY(sl.related_vendor_ids))
    -- OR logs from user's own catalogs (legacy support)
    OR sl.user_id = p_vendor_id
    -- Time filter
    AND sl.created_at > now() - (p_days || ' days')::interval
  GROUP BY sl.search_term
  ORDER BY total_count DESC
  LIMIT 50;
END;
$$;

-- 7. Update trigger for updated_at on catalog_subscriptions
CREATE TRIGGER update_catalog_subscriptions_updated_at
  BEFORE UPDATE ON public.catalog_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();