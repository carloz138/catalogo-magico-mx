-- Agregar campo para información adicional (FAQ, información importante, etc.)
ALTER TABLE public.digital_catalogs
ADD COLUMN additional_info TEXT;