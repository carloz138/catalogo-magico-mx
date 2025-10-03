import { useState } from 'react';
import imageCompression from 'browser-image-compression';

interface CompressionProgress {
  total: number;
  current: number;
  fileName: string;
  percentage: number;
}

export const useImageCompression = () => {
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImages = async (files: File[]): Promise<File[]> => {
    setIsCompressing(true);
    const compressedFiles: File[] = [];

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.8
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setProgress({
        total: files.length,
        current: i + 1,
        fileName: file.name,
        percentage: Math.round(((i + 1) / files.length) * 100)
      });

      try {
        // Solo comprimir si es mayor a 1MB
        if (file.size > 1000000) {
          const compressed = await imageCompression(file, options);
          
          // Crear File object con nombre original pero extensión .webp
          const newFileName = file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          const webpFile = new File([compressed], newFileName, { 
            type: 'image/webp' 
          });
          
          compressedFiles.push(webpFile);
        } else {
          // Si es pequeña, no comprimir
          compressedFiles.push(file);
        }
      } catch (error) {
        console.error(`Error compressing ${file.name}:`, error);
        // Si falla la compresión, usar archivo original
        compressedFiles.push(file);
      }
    }

    setIsCompressing(false);
    setProgress(null);
    return compressedFiles;
  };

  return {
    compressImages,
    progress,
    isCompressing
  };
};
