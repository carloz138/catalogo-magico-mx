-- Fix get_distribution_network function to return correct types
-- The issue is that some columns are defined as varchar(255) but the function expects text

DROP FUNCTION IF EXISTS get_distribution_network(uuid);

CREATE OR REPLACE FUNCTION get_distribution_network(p_distributor_id uuid)
RETURNS TABLE (
  network_id uuid,
  catalog_id uuid,
  catalog_name text,
  reseller_id uuid,
  reseller_name text,
  reseller_email text,
  reseller_company text,
  is_active boolean,
  total_quotes bigint,
  conversion_rate numeric,
  created_at timestamptz,
  activated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dn.id as network_id,
    rc.id as catalog_id,
    dc.name::text as catalog_name,
    rc.reseller_id,
    COALESCE(u.full_name, rc.reseller_email)::text as reseller_name,
    rc.reseller_email::text as reseller_email,
    q.customer_company::text as reseller_company,
    rc.is_active,
    COALESCE(COUNT(q2.id), 0) as total_quotes,
    CASE 
      WHEN COUNT(q2.id) > 0 
      THEN ROUND((COUNT(CASE WHEN q2.status = 'accepted' THEN 1 END)::numeric / COUNT(q2.id)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    dn.created_at,
    rc.activated_at
  FROM distribution_network dn
  JOIN replicated_catalogs rc ON dn.replicated_catalog_id = rc.id
  JOIN digital_catalogs dc ON rc.original_catalog_id = dc.id
  LEFT JOIN quotes q ON rc.quote_id = q.id
  LEFT JOIN users u ON rc.reseller_id = u.id
  LEFT JOIN quotes q2 ON q2.catalog_id = dc.id AND q2.user_id = rc.reseller_id
  WHERE dn.distributor_id = p_distributor_id
  GROUP BY 
    dn.id, 
    rc.id, 
    dc.name, 
    rc.reseller_id,
    u.full_name,
    rc.reseller_email,
    q.customer_company,
    rc.is_active,
    dn.created_at,
    rc.activated_at
  ORDER BY dn.created_at DESC;
END;
$$;