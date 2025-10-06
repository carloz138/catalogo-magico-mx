-- =====================================================
-- SISTEMA DE CATÁLOGOS DIGITALES PÚBLICOS
-- Coexiste con sistema de PDFs existente
-- =====================================================

-- 1. TABLA: digital_catalogs
-- Almacena catálogos digitales públicos compartibles
CREATE TABLE digital_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Identificación
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Configuración de precios
  price_display TEXT CHECK (price_display IN ('menudeo_only', 'mayoreo_only', 'both')) DEFAULT 'both',
  price_adjustment_menudeo NUMERIC DEFAULT 0,
  price_adjustment_mayoreo NUMERIC DEFAULT 0,
  
  -- Configuración de visibilidad
  show_sku BOOLEAN DEFAULT true,
  show_tags BOOLEAN DEFAULT true,
  show_description BOOLEAN DEFAULT true,
  
  -- Privacidad (solo planes medio/premium)
  is_private BOOLEAN DEFAULT false,
  access_password TEXT,
  
  -- Control
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para digital_catalogs
CREATE INDEX idx_catalogs_user ON digital_catalogs(user_id);
CREATE INDEX idx_catalogs_slug ON digital_catalogs(slug);
CREATE INDEX idx_catalogs_active ON digital_catalogs(is_active) WHERE is_active = true;
CREATE INDEX idx_catalogs_expires ON digital_catalogs(expires_at) WHERE expires_at IS NOT NULL;

-- 2. TABLA: catalog_products
-- Relación many-to-many entre catálogos y productos
CREATE TABLE catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID REFERENCES digital_catalogs ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(catalog_id, product_id)
);

-- Índices para catalog_products
CREATE INDEX idx_catalog_products_catalog ON catalog_products(catalog_id);
CREATE INDEX idx_catalog_products_product ON catalog_products(product_id);

-- 3. TABLA: quotes
-- Cotizaciones generadas por clientes desde catálogo público
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID REFERENCES digital_catalogs ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Datos del cliente (anónimo)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  notes TEXT,
  
  -- Control
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para quotes
CREATE INDEX idx_quotes_catalog ON quotes(catalog_id);
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);

-- 4. TABLA: quote_items
-- Items individuales de cada cotización con snapshot de precios
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE SET NULL,
  
  -- Snapshot de datos del momento de la cotización
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  price_type TEXT CHECK (price_type IN ('menudeo', 'mayoreo')),
  subtotal NUMERIC NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para quote_items
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_id);

-- 5. TABLA: catalog_views
-- Analytics: trackea vistas de catálogos
CREATE TABLE catalog_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID REFERENCES digital_catalogs ON DELETE CASCADE NOT NULL,
  
  -- Metadata del visitante (anónimo)
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para catalog_views
CREATE INDEX idx_catalog_views_catalog ON catalog_views(catalog_id);
CREATE INDEX idx_catalog_views_date ON catalog_views(viewed_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Aplicar trigger updated_at a digital_catalogs
CREATE TRIGGER update_digital_catalogs_updated_at
  BEFORE UPDATE ON digital_catalogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger updated_at a quotes
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- digital_catalogs: Usuario solo ve sus propios catálogos
ALTER TABLE digital_catalogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own catalogs"
  ON digital_catalogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own catalogs"
  ON digital_catalogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catalogs"
  ON digital_catalogs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own catalogs"
  ON digital_catalogs FOR DELETE
  USING (auth.uid() = user_id);

-- Vista pública: Cualquiera puede ver catálogo activo no expirado
CREATE POLICY "Anyone can view active public catalogs"
  ON digital_catalogs FOR SELECT
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- catalog_products: Heredan permisos del catálogo
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own catalog products"
  ON catalog_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM digital_catalogs
      WHERE digital_catalogs.id = catalog_products.catalog_id
      AND digital_catalogs.user_id = auth.uid()
    )
  );

-- quotes: Usuario solo ve cotizaciones de sus catálogos
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id);

-- Cualquiera puede crear cotización (cliente anónimo)
CREATE POLICY "Anyone can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (true);

-- quote_items: Heredan permisos de la cotización
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quote items"
  ON quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create quote items"
  ON quote_items FOR INSERT
  WITH CHECK (true);

-- catalog_views: Solo inserción pública, lectura por owner
ALTER TABLE catalog_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track views"
  ON catalog_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own catalog analytics"
  ON catalog_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_catalogs
      WHERE digital_catalogs.id = catalog_views.catalog_id
      AND digital_catalogs.user_id = auth.uid()
    )
  );