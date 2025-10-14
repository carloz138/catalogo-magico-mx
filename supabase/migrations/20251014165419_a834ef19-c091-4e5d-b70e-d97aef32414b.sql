-- Cambiar el valor por defecto de enable_quotation a true
ALTER TABLE digital_catalogs 
ALTER COLUMN enable_quotation SET DEFAULT true;