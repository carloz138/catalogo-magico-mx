-- Permitir inserciones anónimas en quotes
-- Los clientes pueden crear cotizaciones sin estar autenticados
DROP POLICY IF EXISTS "allow_anonymous_quote_insert" ON public.quotes;
CREATE POLICY "allow_anonymous_quote_insert"
ON public.quotes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir inserciones anónimas en quote_items
-- Los items se pueden crear junto con la cotización
DROP POLICY IF EXISTS "allow_anonymous_quote_items_insert" ON public.quote_items;
CREATE POLICY "allow_anonymous_quote_items_insert"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Los usuarios autenticados pueden ver sus propias cotizaciones
DROP POLICY IF EXISTS "users_view_own_quotes" ON public.quotes;
CREATE POLICY "users_view_own_quotes"
ON public.quotes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios autenticados pueden ver los items de sus cotizaciones
DROP POLICY IF EXISTS "users_view_own_quote_items" ON public.quote_items;
CREATE POLICY "users_view_own_quote_items"
ON public.quote_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id
    AND quotes.user_id = auth.uid()
  )
);

-- Los usuarios autenticados pueden actualizar sus propias cotizaciones
DROP POLICY IF EXISTS "users_update_own_quotes" ON public.quotes;
CREATE POLICY "users_update_own_quotes"
ON public.quotes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);