
-- Verificar la restricción actual y actualizarla para incluir los valores correctos
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_service_type_check;

-- Crear nueva restricción que incluya todos los valores válidos
ALTER TABLE products ADD CONSTRAINT products_service_type_check 
CHECK (service_type IN ('basic', 'premium', 'pixelcut', 'removebg', 'advanced'));
