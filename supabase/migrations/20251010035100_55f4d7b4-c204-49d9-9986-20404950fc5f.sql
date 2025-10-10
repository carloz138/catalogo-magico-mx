-- Agregar columnas para catálogos web
ALTER TABLE digital_catalogs 
ADD COLUMN IF NOT EXISTS web_template_id TEXT,
ADD COLUMN IF NOT EXISTS enable_quotation BOOLEAN DEFAULT false;

-- Índice para búsqueda por template
CREATE INDEX IF NOT EXISTS idx_digital_catalogs_web_template 
ON digital_catalogs(web_template_id);

-- Comentarios para documentación
COMMENT ON COLUMN digital_catalogs.web_template_id IS 'ID del template web seleccionado del catálogo expandido';
COMMENT ON COLUMN digital_catalogs.enable_quotation IS 'Permite que los clientes soliciten cotizaciones desde el catálogo público';