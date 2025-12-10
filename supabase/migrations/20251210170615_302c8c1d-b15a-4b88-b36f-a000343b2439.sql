-- =====================================================
-- PHASE 1: Multi-Vendor Architecture & Backorder Logic
-- =====================================================

-- 1. CREATE VENDORS TABLE
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Public can view active vendors"
ON public.vendors FOR SELECT
USING (is_active = true);

CREATE POLICY "Owners can manage their vendors"
ON public.vendors FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. UPDATE PRODUCTS TABLE
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0;

-- Add index for vendor lookups
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);

-- 3. UPDATE VARIANT_TYPES TABLE
ALTER TABLE public.variant_types
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_custom_values BOOLEAN DEFAULT false;

-- 4. ADD BACKORDER STATUS TO QUOTES
-- Add production_status to quote_items for backorder tracking
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS production_status TEXT DEFAULT 'ready';
-- Values: 'ready', 'waiting_for_supplier', 'in_production', 'ready_to_ship'

-- Create index for production queue queries
CREATE INDEX IF NOT EXISTS idx_quote_items_production_status 
ON public.quote_items(production_status) 
WHERE production_status = 'waiting_for_supplier';

-- 5. CREATE FUNCTION TO GET PRODUCTION QUEUE
CREATE OR REPLACE FUNCTION public.get_production_queue(p_vendor_user_id UUID)
RETURNS TABLE (
  product_id UUID,
  variant_id UUID,
  product_name TEXT,
  product_sku TEXT,
  product_image_url TEXT,
  variant_description TEXT,
  total_quantity BIGINT,
  order_count BIGINT,
  oldest_order_date TIMESTAMP WITH TIME ZONE,
  quote_item_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qi.product_id,
    qi.variant_id,
    qi.product_name,
    qi.product_sku,
    qi.product_image_url,
    qi.variant_description,
    SUM(qi.quantity)::BIGINT as total_quantity,
    COUNT(DISTINCT qi.quote_id)::BIGINT as order_count,
    MIN(qi.created_at) as oldest_order_date,
    ARRAY_AGG(qi.id) as quote_item_ids
  FROM quote_items qi
  JOIN quotes q ON qi.quote_id = q.id
  WHERE q.user_id = p_vendor_user_id
    AND qi.production_status = 'waiting_for_supplier'
    AND q.status IN ('pending', 'accepted', 'negotiation')
  GROUP BY qi.product_id, qi.variant_id, qi.product_name, qi.product_sku, qi.product_image_url, qi.variant_description
  ORDER BY oldest_order_date ASC;
END;
$$;

-- 6. CREATE FUNCTION TO MARK BATCH AS READY
CREATE OR REPLACE FUNCTION public.mark_production_batch_ready(
  p_quote_item_ids UUID[],
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Verify ownership and update items
  UPDATE quote_items qi
  SET production_status = 'ready_to_ship',
      updated_at = now()
  FROM quotes q
  WHERE qi.id = ANY(p_quote_item_ids)
    AND qi.quote_id = q.id
    AND q.user_id = p_user_id
    AND qi.production_status = 'waiting_for_supplier';
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$;

-- 7. CREATE FUNCTION TO CHECK PENDING BACKORDERS
CREATE OR REPLACE FUNCTION public.get_pending_backorders(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  pending_count BIGINT,
  total_quantity BIGINT,
  quote_item_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(qi.quantity), 0)::BIGINT,
    ARRAY_AGG(qi.id)
  FROM quote_items qi
  JOIN quotes q ON qi.quote_id = q.id
  WHERE qi.product_id = p_product_id
    AND (p_variant_id IS NULL OR qi.variant_id = p_variant_id)
    AND qi.production_status = 'waiting_for_supplier'
    AND q.status IN ('pending', 'accepted', 'negotiation');
END;
$$;

-- 8. CREATE FUNCTION TO ALLOCATE STOCK TO BACKORDERS
CREATE OR REPLACE FUNCTION public.allocate_stock_to_backorders(
  p_product_id UUID,
  p_variant_id UUID,
  p_new_stock INTEGER,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_remaining_stock INTEGER := p_new_stock;
  v_fulfilled_count INTEGER := 0;
  v_fulfilled_quantity INTEGER := 0;
BEGIN
  -- Process backorders in FIFO order
  FOR v_item IN 
    SELECT qi.id, qi.quantity, qi.quote_id
    FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    WHERE qi.product_id = p_product_id
      AND (p_variant_id IS NULL OR qi.variant_id = p_variant_id)
      AND qi.production_status = 'waiting_for_supplier'
      AND q.user_id = p_user_id
      AND q.status IN ('pending', 'accepted', 'negotiation')
    ORDER BY qi.created_at ASC
  LOOP
    IF v_remaining_stock >= v_item.quantity THEN
      -- Can fulfill this order
      UPDATE quote_items 
      SET production_status = 'ready_to_ship'
      WHERE id = v_item.id;
      
      v_remaining_stock := v_remaining_stock - v_item.quantity;
      v_fulfilled_count := v_fulfilled_count + 1;
      v_fulfilled_quantity := v_fulfilled_quantity + v_item.quantity;
    ELSE
      EXIT; -- No more stock to allocate
    END IF;
  END LOOP;
  
  -- Update the product stock with remaining
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants 
    SET stock_quantity = v_remaining_stock
    WHERE id = p_variant_id AND user_id = p_user_id;
  ELSE
    UPDATE products 
    SET stock_quantity = v_remaining_stock
    WHERE id = p_product_id AND user_id = p_user_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'fulfilled_orders', v_fulfilled_count,
    'fulfilled_quantity', v_fulfilled_quantity,
    'remaining_stock', v_remaining_stock
  );
END;
$$;

-- Add trigger to update vendors updated_at
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comment on new columns
COMMENT ON COLUMN public.products.allow_backorder IS 'If true, product can be sold even when stock_quantity is 0 (Make-to-Order)';
COMMENT ON COLUMN public.products.lead_time_days IS 'Days required to manufacture/source if out of stock';
COMMENT ON COLUMN public.products.vendor_id IS 'Reference to vendor entity for multi-vendor marketplace';
COMMENT ON COLUMN public.quote_items.production_status IS 'Tracks backorder fulfillment: ready, waiting_for_supplier, in_production, ready_to_ship';