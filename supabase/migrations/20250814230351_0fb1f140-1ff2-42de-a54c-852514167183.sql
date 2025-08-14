-- Drop existing policies for transactions table to recreate them with stronger security
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

-- Create stronger RLS policies for transactions table
-- These policies explicitly check for authentication and prevent any anonymous access

-- Policy for SELECT: Only authenticated users can view their own transactions
CREATE POLICY "authenticated_users_select_own_transactions" ON public.transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Policy for INSERT: Only authenticated users can insert their own transactions
CREATE POLICY "authenticated_users_insert_own_transactions" ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Policy for UPDATE: Only service role can update transactions (for payment processing)
-- This ensures only backend processes can update payment status, not users directly
CREATE POLICY "service_role_update_transactions" ON public.transactions
FOR UPDATE
TO service_role
USING (true);

-- Add additional security function to validate transaction access
CREATE OR REPLACE FUNCTION public.can_access_transaction(transaction_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    auth.uid() IS NOT NULL 
    AND auth.uid() = transaction_user_id
    AND auth.role() = 'authenticated';
$$;

-- Create a view for safe transaction access with additional validation
CREATE OR REPLACE VIEW public.user_transactions AS
SELECT 
  id,
  user_id,
  package_id,
  credits_purchased,
  amount_mxn,
  amount_usd,
  payment_method,
  payment_status,
  created_at,
  completed_at,
  expires_at
FROM public.transactions
WHERE public.can_access_transaction(user_id);

-- Grant access to the view for authenticated users
GRANT SELECT ON public.user_transactions TO authenticated;

-- Revoke direct access to transactions table from anon role (if any exists)
REVOKE ALL ON public.transactions FROM anon;

-- Ensure RLS is enabled (it should already be, but let's be explicit)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the security model
COMMENT ON TABLE public.transactions IS 'Financial transaction data with strict RLS. Only authenticated users can access their own transactions. Updates restricted to service role only.';