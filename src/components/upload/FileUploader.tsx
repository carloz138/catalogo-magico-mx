
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

const validateFiles = (files: File[]) => {
  if (files.length > MAX_FILES) {
    return {
      valid: false,
      error: `Máximo ${MAX_FILES} archivos por lote. Seleccionaste ${files.length} archivos.`
    };
  }
  
  const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    return {
      valid: false,
      error: `${oversizedFiles.length} archivo(s) exceden 10MB. Reduce el tamaño de las imágenes.`
    };
  }
  
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `El tamaño total excede 100MB. Selecciona menos archivos.`
    };
  }
  
  return { valid: true };
};

export const FileUploader = ({ onFilesUploaded, maxFiles = MAX_FILES }: FileUploaderProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Validate file count and size
    const validation = validateFiles(acceptedFiles);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    // Clear any previous errors
    setError('');

    const newFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length).map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to Supabase Storage
    const uploadPromises = newFiles.map(async (uploadFile) => {
      try {
        const fileExt = uploadFile.file.name.split('.').pop();
        const fileName = `${uploadFile.id}.${fileExt}`;
        const filePath = `${Date.now()}_${fileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, uploadFile.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, uploading: false, progress: 100, url: urlData.publicUrl }
            : f
        ));

        return { ...uploadFile, url: urlData.publicUrl, uploading: false, progress: 100 };
      } catch (error) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, uploading: false, error: 'Error al subir archivo' }
            : f
        ));
        toast({
          title: "Error",
          description: `No se pudo subir ${uploadFile.file.name}`,
          variant: "destructive",
        });
        return null;
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    const successfulFiles = results.filter(file => file !== null && file.url);
    
    // Call onFilesUploaded with all successful files (including previously uploaded ones)
    const allSuccessfulFiles = uploadedFiles.filter(f => f.url && !f.error).concat(successfulFiles);
    onFilesUploaded(allSuccessfulFiles);
  }, [uploadedFiles, maxFiles, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: uploadedFiles.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      const successfulFiles = newFiles.filter(f => f.url && !f.error);
      onFilesUploaded(successfulFiles);
      return newFiles;
    });
  };

  return (
    <div className="space-y-4">
      {uploadedFiles.length < maxFiles && (
        <Card>
          <CardContent 
            {...getRootProps()}
            className={`text-center py-12 cursor-pointer transition-colors border-2 border-dashed rounded-lg ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                {isDragActive ? (
                  <p className="text-lg">Suelta las imágenes aquí...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg mb-2">Arrastra tus fotos aquí o haz clic para seleccionar</p>
                    <p className="text-neutral/70 mb-2">
                      Formatos aceptados: JPG, PNG, WEBP
                    </p>
                    <p className="text-sm text-neutral/60">
                      Máximo {MAX_FILES} archivos • 10MB por imagen • 100MB total
                    </p>
                  </div>
                )}
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                Seleccionar archivos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Archivos rechazados:</span>
          </div>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-destructive/80">
              {file.name}: {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700">
            ✅ {uploadedFiles.length} de {MAX_FILES} archivos seleccionados
          </p>
          {uploadedFiles.length >= MAX_FILES && (
            <p className="text-orange-600 text-sm mt-1">
              Has alcanzado el límite máximo de archivos por lote.
            </p>
          )}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="relative border rounded-lg overflow-hidden">
              <img
                src={file.preview}
                alt="Preview"
                className="w-full h-32 object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={() => removeFile(file.id)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {file.uploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2">
                  <Progress value={file.progress} className="w-full" />
                </div>
              )}
              
              {file.error && (
                <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-white p-2 text-xs">
                  {file.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">¿Tienes muchos productos?</h4>
        <div className="text-blue-700 space-y-2">
          <p>• Procesa en lotes de máximo {MAX_FILES} productos para mejor rendimiento</p>
          <p>• Guarda cada lote en tu biblioteca</p>
          <p>• Después puedes combinar productos de diferentes lotes en un solo catálogo</p>
        </div>
      </div>
    </div>
  );
};
