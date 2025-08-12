-- Drop the insecure user_statistics view
DROP VIEW IF EXISTS public.user_statistics;

-- Create a secure user_statistics view that only shows current user's data
CREATE VIEW public.user_statistics AS 
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.id = auth.uid();