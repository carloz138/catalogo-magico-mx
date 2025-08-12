-- Drop the current insecure view
DROP VIEW IF EXISTS public.user_statistics;

-- Create a security definer function to get current user stats
CREATE OR REPLACE FUNCTION public.get_current_user_stats()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.updated_at
  FROM auth.users u
  WHERE u.id = auth.uid();
$$;

-- Create a secure view that uses the security definer function
CREATE VIEW public.user_statistics AS 
SELECT * FROM public.get_current_user_stats();