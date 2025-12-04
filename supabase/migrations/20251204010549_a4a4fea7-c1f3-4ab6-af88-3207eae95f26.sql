-- Agregar política INSERT para payment_transactions
-- Permite a usuarios crear transacciones para cotizaciones que les pertenecen

CREATE POLICY "Users can insert transactions for own quotes"
ON public.payment_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_id 
    AND quotes.user_id = auth.uid()
  )
);

-- También agregar política UPDATE por si se necesita actualizar el status
CREATE POLICY "Users can update transactions for own quotes"
ON public.payment_transactions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = payment_transactions.quote_id 
    AND quotes.user_id = auth.uid()
  )
);