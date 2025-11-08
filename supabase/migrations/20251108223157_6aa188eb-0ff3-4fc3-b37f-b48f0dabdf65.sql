-- Enable RLS on solicitudes_mercado
ALTER TABLE public.solicitudes_mercado ENABLE ROW LEVEL SECURITY;

-- Policy for L1 (Fabricantes): Can view all requests related to their catalogs
CREATE POLICY "Fabricantes can view all requests for their catalogs"
ON public.solicitudes_mercado
FOR SELECT
TO authenticated
USING (
  fabricante_id = auth.uid()
);

-- Policy for L2 (Revendedores): Can only view requests from their own clients (L3)
CREATE POLICY "Revendedores can view requests from their clients"
ON public.solicitudes_mercado
FOR SELECT
TO authenticated
USING (
  revendedor_id = auth.uid()
);

-- Policy for inserting new requests (from L3 clients or L2)
CREATE POLICY "Anyone can insert market requests"
ON public.solicitudes_mercado
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for L1 to update status
CREATE POLICY "Fabricantes can update their requests status"
ON public.solicitudes_mercado
FOR UPDATE
TO authenticated
USING (fabricante_id = auth.uid())
WITH CHECK (fabricante_id = auth.uid());

-- Policy for L2 to update status
CREATE POLICY "Revendedores can update their requests status"
ON public.solicitudes_mercado
FOR UPDATE
TO authenticated
USING (revendedor_id = auth.uid())
WITH CHECK (revendedor_id = auth.uid());