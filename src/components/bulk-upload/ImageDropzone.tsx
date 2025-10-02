import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { ImageFile } from '@/types/bulk-upload';

interface ImageDropzoneProps {
  onImagesSelected: (images: ImageFile[]) => void;
  images: ImageFile[];
}

export const ImageDropzone = ({ onImagesSelected, images }: ImageDropzoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles: ImageFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      cleanName: file.name.replace(/\.[^/.]+$/, '').toLowerCase()
    }));
    onImagesSelected([...images, ...imageFiles]);
  }, [images, onImagesSelected]);

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
