-- Agregar campo para controlar si se muestran variantes en el catálogo público
ALTER TABLE digital_catalogs
ADD COLUMN enable_variants boolean DEFAULT true;

COMMENT ON COLUMN digital_catalogs.enable_variants IS 'Si es true, los clientes pueden seleccionar variantes específicas al cotizar. Si es false, solo se muestra el producto base.';