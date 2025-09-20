-- PASO 1: Agregar columna de soft delete a productos
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP NULL;

-- Crear índice para performance
CREATE INDEX idx_products_deleted_at ON products(deleted_at);

-- PASO 2: Crear tabla de archivo histórico
CREATE TABLE product_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id UUID NOT NULL,
  product_data JSONB NOT NULL,
  deleted_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT NOW(),
  user_id UUID NOT NULL,
  deletion_reason TEXT DEFAULT 'User deletion'
);

-- Índices para la tabla de archivo
CREATE INDEX idx_product_archive_original_id ON product_archive(original_product_id);
CREATE INDEX idx_product_archive_user_id ON product_archive(user_id);

-- PASO 3: Función de soft delete
CREATE OR REPLACE FUNCTION soft_delete_product(
  product_id UUID,
  requesting_user_id UUID,
  reason TEXT DEFAULT 'User deletion'
) RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el usuario es propietario del producto
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = product_id AND user_id = requesting_user_id AND deleted_at IS NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Marcar como eliminado
  UPDATE products 
  SET deleted_at = NOW() 
  WHERE id = product_id AND user_id = requesting_user_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Función de restauración
CREATE OR REPLACE FUNCTION restore_product(
  product_id UUID,
  requesting_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el usuario es propietario del producto eliminado
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = product_id AND user_id = requesting_user_id AND deleted_at IS NOT NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Restaurar producto
  UPDATE products 
  SET deleted_at = NULL 
  WHERE id = product_id AND user_id = requesting_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Función de archivo automático
CREATE OR REPLACE FUNCTION archive_old_deleted_products() 
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  product_record RECORD;
BEGIN
  -- Archivar productos eliminados hace más de 30 días
  FOR product_record IN 
    SELECT * FROM products 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Insertar en archivo
    INSERT INTO product_archive (
      original_product_id, 
      product_data, 
      deleted_at, 
      user_id, 
      deletion_reason
    ) VALUES (
      product_record.id,
      row_to_json(product_record),
      product_record.deleted_at,
      product_record.user_id,
      'Automatic archive after 30 days'
    );
    
    -- Eliminar definitivamente
    DELETE FROM products WHERE id = product_record.id;
    archived_count := archived_count + 1;
  END LOOP;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Crear vista para productos activos
CREATE VIEW active_products AS 
SELECT * FROM products WHERE deleted_at IS NULL;

-- PASO 7: Función para obtener productos eliminados del usuario
CREATE OR REPLACE FUNCTION get_deleted_products(requesting_user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  deleted_at TIMESTAMP,
  original_image_url TEXT,
  processed_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.deleted_at,
    p.original_image_url,
    p.processed_image_url
  FROM products p
  WHERE p.user_id = requesting_user_id 
    AND p.deleted_at IS NOT NULL
  ORDER BY p.deleted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 8: Función para eliminación permanente
CREATE OR REPLACE FUNCTION permanently_delete_product(
  product_id UUID,
  requesting_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el usuario es propietario y el producto está eliminado
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = product_id AND user_id = requesting_user_id AND deleted_at IS NOT NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Archivar antes de eliminar permanentemente
  INSERT INTO product_archive (
    original_product_id, 
    product_data, 
    deleted_at, 
    user_id, 
    deletion_reason
  ) 
  SELECT 
    id,
    row_to_json(products.*),
    deleted_at,
    user_id,
    'Manual permanent deletion'
  FROM products 
  WHERE id = product_id;
  
  -- Eliminar definitivamente
  DELETE FROM products WHERE id = product_id AND user_id = requesting_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 9: Actualizar políticas RLS para incluir soft delete
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" 
ON products FOR SELECT 
USING (auth.uid() = user_id);

-- Política para vista de productos activos
CREATE POLICY "Users can view own active products" 
ON products FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS para tabla de archivo
ALTER TABLE product_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archived products" 
ON product_archive FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert archived products" 
ON product_archive FOR INSERT 
WITH CHECK (true);