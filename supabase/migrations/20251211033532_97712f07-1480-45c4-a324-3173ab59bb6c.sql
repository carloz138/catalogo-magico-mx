-- Function to process accepted quotes and create multi-vendor consolidated orders
CREATE OR REPLACE FUNCTION public.process_accepted_quote_multivendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_replicated_catalog RECORD;
  v_vendor RECORD;
  v_item RECORD;
  v_consolidated_order_id UUID;
  v_existing_item_id UUID;
  v_supplier_id UUID;
BEGIN
  -- Only process if status changed TO 'accepted' and it's from a replicated catalog (L2 sale)
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.replicated_catalog_id IS NOT NULL THEN
    
    -- Get the replicated catalog info (L2's catalog)
    SELECT rc.*, dc.user_id as original_owner_id
    INTO v_replicated_catalog
    FROM replicated_catalogs rc
    JOIN digital_catalogs dc ON rc.original_catalog_id = dc.id
    WHERE rc.id = NEW.replicated_catalog_id;
    
    IF NOT FOUND THEN
      -- No replicated catalog found, skip processing
      RETURN NEW;
    END IF;
    
    -- Find all unique vendors from this quote's items
    FOR v_vendor IN 
      SELECT DISTINCT COALESCE(p.vendor_id, p.user_id) as vendor_id
      FROM quote_items qi
      JOIN products p ON qi.product_id = p.id
      WHERE qi.quote_id = NEW.id
        AND qi.product_id IS NOT NULL  -- Safety: only process items linked to products
        AND COALESCE(p.vendor_id, p.user_id) IS NOT NULL
    LOOP
      v_supplier_id := v_vendor.vendor_id;
      
      -- Find or create consolidated order draft for this L2->L1 pair
      SELECT id INTO v_consolidated_order_id
      FROM consolidated_orders
      WHERE distributor_id = v_replicated_catalog.reseller_id
        AND supplier_id = v_supplier_id
        AND original_catalog_id = v_replicated_catalog.original_catalog_id
        AND status = 'draft';
      
      IF NOT FOUND THEN
        -- Create new draft consolidated order
        INSERT INTO consolidated_orders (
          distributor_id,
          supplier_id,
          original_catalog_id,
          replicated_catalog_id,
          status,
          created_at,
          updated_at
        ) VALUES (
          v_replicated_catalog.reseller_id,
          v_supplier_id,
          v_replicated_catalog.original_catalog_id,
          NEW.replicated_catalog_id,
          'draft',
          now(),
          now()
        ) RETURNING id INTO v_consolidated_order_id;
      END IF;
      
      -- Process each item from this vendor
      FOR v_item IN
        SELECT 
          qi.product_id,
          qi.variant_id,
          qi.product_name,
          qi.product_sku,
          qi.product_image_url,
          qi.variant_description,
          qi.quantity,
          COALESCE(
            CASE WHEN qi.variant_id IS NOT NULL 
              THEN (SELECT price_wholesale FROM product_variants WHERE id = qi.variant_id)
              ELSE (SELECT price_wholesale FROM products WHERE id = qi.product_id)
            END,
            qi.unit_price
          ) as wholesale_price
        FROM quote_items qi
        JOIN products p ON qi.product_id = p.id
        WHERE qi.quote_id = NEW.id
          AND qi.product_id IS NOT NULL
          AND COALESCE(p.vendor_id, p.user_id) = v_supplier_id
      LOOP
        -- Check if this product/variant combo already exists in the draft
        SELECT id INTO v_existing_item_id
        FROM consolidated_order_items
        WHERE consolidated_order_id = v_consolidated_order_id
          AND product_id = v_item.product_id
          AND (variant_id IS NOT DISTINCT FROM v_item.variant_id);
        
        IF FOUND THEN
          -- Update existing item: add quantity and append source quote
          UPDATE consolidated_order_items
          SET 
            quantity = quantity + v_item.quantity,
            subtotal = (quantity + v_item.quantity) * unit_price,
            source_quote_ids = array_append(
              COALESCE(source_quote_ids, ARRAY[]::uuid[]), 
              NEW.id
            ),
            updated_at = now()
          WHERE id = v_existing_item_id
            AND NOT (NEW.id = ANY(COALESCE(source_quote_ids, ARRAY[]::uuid[])));  -- Idempotency check
        ELSE
          -- Insert new item
          INSERT INTO consolidated_order_items (
            consolidated_order_id,
            product_id,
            variant_id,
            product_name,
            product_sku,
            product_image_url,
            variant_description,
            quantity,
            unit_price,
            subtotal,
            source_quote_ids,
            created_at,
            updated_at
          ) VALUES (
            v_consolidated_order_id,
            v_item.product_id,
            v_item.variant_id,
            v_item.product_name,
            v_item.product_sku,
            v_item.product_image_url,
            v_item.variant_description,
            v_item.quantity,
            v_item.wholesale_price,
            v_item.quantity * v_item.wholesale_price,
            ARRAY[NEW.id],
            now(),
            now()
          );
        END IF;
      END LOOP;
      
      -- Update the consolidated order timestamp
      UPDATE consolidated_orders
      SET updated_at = now()
      WHERE id = v_consolidated_order_id;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_process_accepted_quote_multivendor ON quotes;

-- Create the trigger
CREATE TRIGGER trigger_process_accepted_quote_multivendor
  AFTER UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION process_accepted_quote_multivendor();