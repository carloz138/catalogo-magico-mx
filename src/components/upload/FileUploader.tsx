
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

export const FileUploader = ({ onFilesUploaded, maxFiles = 10 }: FileUploaderProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length).map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to Supabase Storage
    for (const uploadFile of newFiles) {
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
      }
    }

    const successfulFiles = uploadedFiles.filter(f => f.url && !f.error);
    onFilesUploaded(successfulFiles);
  }, [uploadedFiles, maxFiles, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: uploadedFiles.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      onFilesUploaded(newFiles.filter(f => f.url && !f.error));
      return newFiles;
    });
  };

  return (
    <div className="space-y-4">
      {uploadedFiles.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
          {isDragActive ? (
            <p className="text-lg">Suelta las imágenes aquí...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Arrastra tus fotos aquí o haz clic para seleccionar</p>
              <p className="text-sm text-neutral/60">
                Formatos: JPG, PNG, WEBP • Máximo 10MB por imagen • Hasta {maxFiles} imágenes
              </p>
            </div>
          )}
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
    </div>
  );
};
