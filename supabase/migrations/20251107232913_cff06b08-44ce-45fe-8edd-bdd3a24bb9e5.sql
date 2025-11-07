-- Crear tabla para gestionar precios y disponibilidad de variantes por revendedor
CREATE TABLE IF NOT EXISTS public.reseller_variant_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID NOT NULL REFERENCES public.replicated_catalogs(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  custom_price_retail INTEGER,
  custom_price_wholesale INTEGER,
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(replicated_catalog_id, variant_id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reseller_variant_prices_catalog 
  ON public.reseller_variant_prices(replicated_catalog_id);
CREATE INDEX IF NOT EXISTS idx_reseller_variant_prices_variant 
  ON public.reseller_variant_prices(variant_id);

-- RLS policies
ALTER TABLE public.reseller_variant_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers can manage their own variant prices" 
  ON public.reseller_variant_prices
  FOR ALL
  USING (
    replicated_catalog_id IN (
      SELECT id FROM replicated_catalogs 
      WHERE reseller_id = auth.uid()
    )
  );

CREATE POLICY "Public can view variant prices in active catalogs"
  ON public.reseller_variant_prices
  FOR SELECT
  USING (
    replicated_catalog_id IN (
      SELECT id FROM replicated_catalogs 
      WHERE is_active = true
    )
  );

COMMENT ON TABLE public.reseller_variant_prices IS 'Precios y disponibilidad personalizados por variante para revendedores L2';