-- =============================================
-- PHASE 2: Hybrid Variant Standardization
-- Update RPC function with new return type
-- =============================================

-- 1. Drop the existing function first
DROP FUNCTION IF EXISTS public.get_variant_types_by_category(text);

-- 2. Recreate with updated return type including is_global and allow_custom_values
CREATE OR REPLACE FUNCTION public.get_variant_types_by_category(category_name text)
RETURNS TABLE(
  id uuid, 
  name character varying, 
  display_name character varying, 
  input_type character varying, 
  is_required boolean, 
  is_global boolean,
  allow_custom_values boolean,
  variant_values jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        vt.id,
        vt.name,
        vt.display_name,
        vt.input_type,
        vt.is_required,
        COALESCE(vt.is_global, true) as is_global,
        COALESCE(vt.allow_custom_values, false) as allow_custom_values,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', vv.id,
                    'value', vv.value,
                    'display_value', vv.display_value,
                    'hex_color', vv.hex_color
                ) ORDER BY vv.sort_order
            ) FILTER (WHERE vv.id IS NOT NULL),
            '[]'::jsonb
        ) as variant_values
    FROM variant_types vt
    LEFT JOIN variant_values vv ON vt.id = vv.variant_type_id AND vv.is_active = true
    WHERE vt.category = category_name 
       OR (vt.is_global = true AND vt.category IS NULL)
    GROUP BY vt.id, vt.name, vt.display_name, vt.input_type, vt.is_required, vt.is_global, vt.allow_custom_values, vt.sort_order
    ORDER BY vt.sort_order;
END;
$function$;