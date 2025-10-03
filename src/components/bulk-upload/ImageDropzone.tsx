import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { ImageFile } from '@/types/bulk-upload';
import { imageFileSchema } from '@/lib/validation/bulk-upload-schemas';
import { useToast } from '@/hooks/use-toast';

interface ImageDropzoneProps {
  onImagesSelected: (images: ImageFile[]) => void;
  images: ImageFile[];
}

export const ImageDropzone = ({ onImagesSelected, images }: ImageDropzoneProps) => {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: ImageFile[] = [];
    const rejectedFiles: { name: string; reason: string }[] = [];

    // Validar cada archivo
    acceptedFiles.forEach(file => {
      const validation = imageFileSchema.safeParse(file);
      
      if (validation.success) {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          cleanName: file.name.replace(/\.[^/.]+$/, '').toLowerCase()
        });
      } else {
        const errorMessage = validation.error.issues[0]?.message || 'Error de validación';
        rejectedFiles.push({ name: file.name, reason: errorMessage });
      }
    });

    // Mostrar toast con archivos rechazados
    if (rejectedFiles.length > 0) {
      const reasons = [...new Set(rejectedFiles.map(f => f.reason))].join(', ');
      toast({
        title: `${rejectedFiles.length} archivo${rejectedFiles.length > 1 ? 's' : ''} rechazado${rejectedFiles.length > 1 ? 's' : ''}`,
        description: reasons,
        variant: "destructive"
      });
    }

    // Solo agregar archivos válidos
    if (validFiles.length > 0) {
      onImagesSelected([...images, ...validFiles]);
      toast({
        title: "Imágenes agregadas",
        description: `${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''} válida${validFiles.length > 1 ? 's' : ''}`,
      });
    }
  }, [images, onImagesSelected, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra imágenes o haz clic'}
        </p>
        <p className="text-sm text-muted-foreground">
          Soporta JPG, PNG, WEBP. Puedes subir hasta 500 imágenes.
        </p>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">{images.length} imágenes cargadas</span>
            </div>
            <button
              onClick={() => onImagesSelected([])}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpiar todo
            </button>
          </div>
          
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={img.preview}
                  alt={img.file.name}
                  className="w-full h-full object-cover rounded border"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
