import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useUploadTracking } from "@/hooks/useUploadTracking";

// 🎯 INTERFACE ACTUALIZADO
export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
  optimizedUrls?: {
    thumbnail: string;
    catalog: string;
    luxury: string;
    print: string;
  };
  analysis?: any;
  productData?: any;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

const validateFiles = (files: File[]) => {
  if (files.length > MAX_FILES) {
    return {
      valid: false,
      error: `Máximo ${MAX_FILES} archivos por lote.`,
    };
  }

  const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    return {
      valid: false,
      error: `${oversizedFiles.length} archivo(s) exceden 10MB.`,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `El tamaño total excede ${Math.round(MAX_TOTAL_SIZE / (1024 * 1024))}MB.`,
    };
  }

  return { valid: true };
};

export const FileUploader = ({ onFilesUploaded, maxFiles = MAX_FILES }: FileUploaderProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>("");

  const { validateBeforeUpload, incrementUploadUsage, checkUploadLimits } = useUploadTracking();
  const [uploadLimits, setUploadLimits] = useState<any>(null);

  React.useEffect(() => {
    checkUploadLimits().then(setUploadLimits);
  }, [uploadedFiles]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // 1. VALIDAR LÍMITES
      const canUpload = await validateBeforeUpload(acceptedFiles.length);
      if (!canUpload) return;

      const totalFiles = acceptedFiles.length + rejectedFiles.length;
      if (totalFiles > MAX_FILES) {
        setError(`Límite de ${MAX_FILES} archivos excedido.`);
        return;
      }

      const validation = validateFiles(acceptedFiles);
      if (!validation.valid) {
        setError(validation.error || "Error de validación");
        return;
      }

      setError("");

      const newFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
        progress: 0,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // 2. PROCESO DE UPLOAD
      const uploadPromises = newFiles.map(async (uploadFile) => {
        try {
          const fileExt = uploadFile.file.name.split(".").pop()?.toLowerCase();
          const fileName = `${uploadFile.id}.${fileExt}`;
          const filePath = `${Date.now()}_${fileName}`;

          let contentType = "image/jpeg";
          if (fileExt === "png") contentType = "image/png";
          else if (fileExt === "webp") contentType = "image/webp";
          else if (fileExt === "gif") contentType = "image/gif";

          // Upload Original
          const { error } = await supabase.storage.from("product-images").upload(filePath, uploadFile.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: contentType,
          });

          if (error) throw error;

          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);

          // Update Progress: 30%
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 30, url: urlData.publicUrl } : f)),
          );

          // Optimización Automática
          setUploadedFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f)));

          const originalBlob = uploadFile.file;
          const { uploadImageToSupabase } = await import("@/utils/imageProcessing");

          const optimizedUrls = await uploadImageToSupabase(
            supabase,
            uploadFile.id,
            originalBlob,
            uploadFile.file.name,
          );

          // Finalizar
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    uploading: false,
                    progress: 100,
                    url: urlData.publicUrl,
                    optimizedUrls: optimizedUrls,
                  }
                : f,
            ),
          );

          return {
            ...uploadFile,
            url: urlData.publicUrl,
            uploading: false,
            progress: 100,
            optimizedUrls: optimizedUrls,
          };
        } catch (error) {
          console.error(`Upload error:`, error);
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, uploading: false, error: "Error al subir" } : f)),
          );
          toast({ title: "Error", description: `Falló subida de ${uploadFile.file.name}`, variant: "destructive" });
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulFiles = results.filter((file) => file !== null && file.url);

      if (successfulFiles.length > 0) {
        await incrementUploadUsage(successfulFiles.length);
        checkUploadLimits().then(setUploadLimits);
      }

      const allSuccessfulFiles = uploadedFiles.filter((f) => f.url && !f.error).concat(successfulFiles);
      onFilesUploaded(allSuccessfulFiles);
    },
    [uploadedFiles, maxFiles, onFilesUploaded, validateBeforeUpload, incrementUploadUsage, checkUploadLimits],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: MAX_FILE_SIZE,
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: uploadedFiles.length >= maxFiles,
  });

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);
      const successfulFiles = newFiles.filter((f) => f.url && !f.error);
      onFilesUploaded(successfulFiles);
      return newFiles;
    });
  };

  const UploadLimitsDisplay = () => {
    if (!uploadLimits || uploadLimits.reason === "unlimited") return null;
    const isNearLimit = uploadLimits.uploadsRemaining <= 10;

    return (
      <div
        className={`text-xs px-3 py-2 rounded-lg mb-4 flex items-center justify-between ${
          isNearLimit
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-slate-50 text-slate-600 border border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          <span>
            Has usado{" "}
            <strong>
              {uploadLimits.uploadsUsed}/{uploadLimits.uploadsLimit}
            </strong>{" "}
            subidas este mes.
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <UploadLimitsDisplay />

      {uploadedFiles.length < maxFiles && (
        <Card className="border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors bg-slate-50/50">
          <CardContent {...getRootProps()} className="text-center py-10 cursor-pointer">
            <input {...getInputProps()} />
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                {isDragActive ? (
                  <p className="text-base font-medium text-blue-600">¡Suelta las imágenes aquí!</p>
                ) : (
                  <>
                    <p className="text-base font-medium text-slate-700">Arrastra fotos o haz clic</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP (Máx 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Lista de vistas previas SOLO si se están subiendo activamente */}
      {uploadedFiles.some((f) => f.uploading) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white"
            >
              <img src={file.preview} className="w-full h-full object-cover opacity-80" />
              {file.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
              {!file.uploading && (
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
