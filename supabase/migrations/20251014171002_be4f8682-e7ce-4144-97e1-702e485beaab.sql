-- Cambiar el valor por defecto de enable_quotation a false (se determinará por plan)
ALTER TABLE digital_catalogs 
ALTER COLUMN enable_quotation SET DEFAULT false;