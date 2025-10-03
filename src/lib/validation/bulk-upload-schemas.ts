import { z } from 'zod';

// Validación de archivos de imagen
export const imageFileSchema = z.instanceof(File)
  .refine(file => file.size <= 5000000, {
    message: 'Las imágenes deben ser menores a 5MB'
  })
  .refine(
    file => ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type),
    { message: 'Solo se aceptan archivos JPG, PNG o WEBP' }
  );

// Validación de archivo CSV
export const csvFileSchema = z.instanceof(File)
  .refine(file => file.size <= 10000000, {
    message: 'El archivo CSV debe ser menor a 10MB'
  })
  .refine(
    file => file.type === 'text/csv' || file.name.endsWith('.csv'),
    { message: 'Solo se aceptan archivos CSV' }
  );

// Validación de producto del CSV
export const csvProductSchema = z.object({
  sku: z.string()
    .min(1, 'SKU es requerido')
    .max(50, 'SKU debe tener máximo 50 caracteres'),
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre debe tener máximo 200 caracteres'),
  precio: z.string()
    .min(1, 'Precio es requerido')
    .refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
      message: 'El precio debe ser un número positivo'
    }),
  descripcion: z.string().optional(),
  categoria: z.string().optional()
});

// Validación del batch completo
export const bulkUploadSchema = z.object({
  images: z.array(imageFileSchema)
    .min(1, 'Debes subir al menos 1 imagen')
    .max(500, 'Máximo 500 imágenes por carga'),
  products: z.array(csvProductSchema)
    .min(1, 'El CSV debe contener al menos 1 producto')
    .max(1000, 'Máximo 1000 productos por carga')
});

// Tipos TypeScript inferidos
export type ImageFile = z.infer<typeof imageFileSchema>;
export type CSVProduct = z.infer<typeof csvProductSchema>;
export type BulkUpload = z.infer<typeof bulkUploadSchema>;
