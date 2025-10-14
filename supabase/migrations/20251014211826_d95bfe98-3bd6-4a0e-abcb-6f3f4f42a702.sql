-- Agregar campo show_stock a digital_catalogs
ALTER TABLE public.digital_catalogs
ADD COLUMN show_stock boolean DEFAULT false;

COMMENT ON COLUMN public.digital_catalogs.show_stock IS 'Mostrar cantidad de stock disponible en las variantes';