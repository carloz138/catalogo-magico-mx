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

// 🎯 INTERFACE ACTUALIZADO CON URLs OPTIMIZADAS
interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
  progress: number;
  error?: string;
  // 🎯 NUEVO: URLs optimizadas generadas automáticamente
  optimizedUrls?: {
    thumbnail: string;
    catalog: string;
    luxury: string;
    print: string;
  };
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

// LÍMITES AUMENTADOS - Opción 1
const MAX_FILES = 50; // Aumentado de 10 a 50
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file (sin cambio)
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total (aumentado de 100MB)

const validateFiles = (files: File[]) => {
  if (files.length > MAX_FILES) {
    return {
      valid: false,
      error: `Máximo ${MAX_FILES} archivos por lote. Seleccionaste ${files.length} archivos.`,
    };
  }

  const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    return {
      valid: false,
      error: `${oversizedFiles.length} archivo(s) exceden 10MB. Reduce el tamaño de las imágenes.`,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `El tamaño total excede ${Math.round(MAX_TOTAL_SIZE / (1024 * 1024))}MB. Selecciona menos archivos o reduce su tamaño.`,
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

  // 🎯 FUNCIÓN onDrop COMPLETAMENTE ACTUALIZADA CON OPTIMIZACIÓN AUTOMÁTICA
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // 1. VALIDAR LÍMITES DE PLAN ANTES DE PROCESAR
      const canUpload = await validateBeforeUpload(acceptedFiles.length);
      if (!canUpload) {
        return;
      }

      // Check if too many files were selected
      const totalFiles = acceptedFiles.length + rejectedFiles.length;
      if (totalFiles > MAX_FILES) {
        setError(
          `Recuerda que la cantidad máxima para subir archivos es de ${MAX_FILES}. Seleccionaste ${totalFiles} archivos.`,
        );
        return;
      }

      // Validate file count and size
      const validation = validateFiles(acceptedFiles);
      if (!validation.valid) {
        setError(validation.error);
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

      // 🎯 NUEVO: UPLOAD CON GENERACIÓN AUTOMÁTICA DE VERSIONES OPTIMIZADAS
      const uploadPromises = newFiles.map(async (uploadFile) => {
        try {
          const fileExt = uploadFile.file.name.split(".").pop()?.toLowerCase();
          const fileName = `${uploadFile.id}.${fileExt}`;
          const filePath = `${Date.now()}_${fileName}`;

          // DETERMINAR CONTENT-TYPE CORRECTO
          let contentType = "image/jpeg";
          if (fileExt === "png") {
            contentType = "image/png";
          } else if (fileExt === "webp") {
            contentType = "image/webp";
          } else if (fileExt === "gif") {
            contentType = "image/gif";
          }

          console.log(`📁 Uploading original: ${fileName} (${uploadFile.file.type}) as ${contentType}`);

          // PASO 1: SUBIR IMAGEN ORIGINAL
          const { data, error } = await supabase.storage.from("product-images").upload(filePath, uploadFile.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: contentType,
            metadata: {
              originalType: uploadFile.file.type,
              originalName: uploadFile.file.name,
              preserveFormat: "true",
            },
          });

          if (error) throw error;

          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);

          // Actualizar progreso: 30% - imagen original subida
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 30, url: urlData.publicUrl } : f)),
          );

          // 🎯 PASO 2: GENERAR VERSIONES OPTIMIZADAS AUTOMÁTICAMENTE
          console.log(`🔄 Generating optimized versions for: ${uploadFile.file.name}`);

          // Actualizar progreso: 50% - iniciando optimización
          setUploadedFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f)));

          // Crear blob de la imagen original
          const originalBlob = uploadFile.file;

          // Importar función de imageProcessing
          const { uploadImageToSupabase } = await import("@/utils/imageProcessing");

          // Generar versiones optimizadas
          const optimizedUrls = await uploadImageToSupabase(
            supabase,
            uploadFile.id,
            originalBlob,
            uploadFile.file.name,
          );

          console.log(`🎯 UPLOAD VALIDATION - ${uploadFile.file.name}:`, {
            productId: uploadFile.id,
            originalSize: originalBlob.size,
            optimizedUrls: {
              thumbnail: optimizedUrls?.thumbnail ? "✅ Generated" : "❌ Missing",
              catalog: optimizedUrls?.catalog ? "✅ Generated" : "❌ Missing",
              luxury: optimizedUrls?.luxury ? "✅ Generated" : "❌ Missing",
              print: optimizedUrls?.print ? "✅ Generated" : "❌ Missing",
            },
            thumbnailUrl: optimizedUrls?.thumbnail?.substring(0, 80) + "...",
            catalogUrl: optimizedUrls?.catalog?.substring(0, 80) + "...",
            urlsComplete: !!(
              optimizedUrls?.thumbnail &&
              optimizedUrls?.catalog &&
              optimizedUrls?.luxury &&
              optimizedUrls?.print
            ),
          });

          // Actualizar progreso: 100% - versiones optimizadas generadas
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    uploading: false,
                    progress: 100,
                    url: urlData.publicUrl,
                    // 🎯 NUEVO: Agregar URLs optimizadas al objeto
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
          console.error(`💥 Upload error for ${uploadFile.file.name}:`, error);
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, uploading: false, error: "Error al subir archivo" } : f)),
          );
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
      const successfulFiles = results.filter((file) => file !== null && file.url);

      // 2. INCREMENTAR CONTADOR SOLO SI UPLOADS FUERON EXITOSOS
      if (successfulFiles.length > 0) {
        const trackingResult = await incrementUploadUsage(successfulFiles.length);

        if (trackingResult.success) {
          toast({
            title: "Imágenes procesadas",
            description: `${successfulFiles.length} imagen(es) subida(s) y optimizada(s) automáticamente`,
          });

          checkUploadLimits().then(setUploadLimits);
        } else {
          toast({
            title: "Advertencia",
            description: "Imágenes subidas pero no se pudo actualizar el contador",
            variant: "destructive",
          });
        }
      }

      const allSuccessfulFiles = uploadedFiles.filter((f) => f.url && !f.error).concat(successfulFiles);
      onFilesUploaded(allSuccessfulFiles);
    },
    [uploadedFiles, maxFiles, onFilesUploaded, validateBeforeUpload, incrementUploadUsage, checkUploadLimits],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
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
    const isAtLimit = uploadLimits.uploadsRemaining <= 0;

    return (
      <div
        className={`text-sm p-3 rounded-lg mb-4 ${
          isAtLimit
            ? "bg-red-50 text-red-700 border border-red-200"
            : isNearLimit
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}
      >
        <div className="flex items-center gap-2">
          {isAtLimit ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          <span>
            <strong>Uploads este mes:</strong> {uploadLimits.uploadsUsed}/{uploadLimits.uploadsLimit}(
            {uploadLimits.uploadsRemaining} restantes)
          </span>
        </div>
        {isNearLimit && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Plan: {uploadLimits.planName}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <UploadLimitsDisplay />

      {uploadedFiles.length < maxFiles && (
        <Card>
          <CardContent
            {...getRootProps()}
            className={`text-center py-12 cursor-pointer transition-colors border-2 border-dashed rounded-lg ${
              isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
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
                    <p className="text-neutral/70 mb-2">Formatos aceptados: JPG, PNG, WEBP, GIF</p>
                    <p className="text-sm text-neutral/60">
                      Máximo {MAX_FILES} archivos • 10MB por imagen • {Math.round(MAX_TOTAL_SIZE / (1024 * 1024))}MB
                      total
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      ✅ PNG se mantiene para transparencia • 🚀 Optimización automática para PDFs
                    </p>
                  </div>
                )}
              </div>
              <Button className="bg-primary hover:bg-primary/90">Seleccionar archivos</Button>
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
              {file.name}:{" "}
              {errors
                .map((e) => {
                  if (e.code === "too-many-files") {
                    return `Recuerda que la cantidad máxima para subir archivos es de ${MAX_FILES}`;
                  }
                  return e.message;
                })
                .join(", ")}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-semibold flex items-center gap-2">
                ✅ {uploadedFiles.filter((f) => f.url && !f.uploading).length} imagen
                {uploadedFiles.filter((f) => f.url && !f.uploading).length > 1 ? "es" : ""} subida
                {uploadedFiles.filter((f) => f.url && !f.uploading).length > 1 ? "s" : ""} correctamente
              </p>
              {uploadedFiles.some((f) => f.uploading) && (
                <p className="text-blue-600 text-sm mt-1">
                  ⏳ Subiendo {uploadedFiles.filter((f) => f.uploading).length} imagen(es)...
                </p>
              )}
              {uploadedFiles.length >= MAX_FILES && (
                <p className="text-orange-600 text-sm mt-1">⚠️ Límite alcanzado ({MAX_FILES} archivos)</p>
              )}
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              {uploadedFiles.length}/{MAX_FILES}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Revisa las imágenes abajo. Puedes eliminar las que no necesites antes de continuar.
          </p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles.map((file) => {
            const fileExt = file.file.name.split(".").pop()?.toLowerCase();
            const isPng = fileExt === "png";

            return (
              <div key={file.id} className="relative border rounded-lg overflow-hidden">
                <img src={file.preview} alt="Preview" className="w-full h-32 object-cover" />

                <div className="absolute top-2 left-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      isPng ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
                    }`}
                  >
                    {fileExt?.toUpperCase()}
                  </span>
                </div>

                {/* 🎯 NUEVO: Mostrar indicador de optimización */}
                {file.optimizedUrls && (
                  <div className="absolute top-2 right-8">
                    <span className="text-xs px-2 py-1 rounded font-medium bg-green-500 text-white">📐 4 tamaños</span>
                  </div>
                )}

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
                    <div className="text-xs text-center mt-1">
                      {file.progress < 30 && "Subiendo original..."}
                      {file.progress >= 30 && file.progress < 50 && "Procesando..."}
                      {file.progress >= 50 && file.progress < 100 && "Optimizando..."}
                      {file.progress === 100 && "¡Listo!"}
                    </div>
                  </div>
                )}

                {file.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-white p-2 text-xs">
                    {file.error}
                  </div>
                )}

                {file.url && !file.uploading && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded text-center">
                      ✅ {file.optimizedUrls ? "Optimizado" : "Subido"}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">🚀 Optimización automática:</h4>
        <div className="text-blue-700 space-y-2 text-sm">
          <p>
            • <strong>Original:</strong> Se mantiene para remove background y descargas
          </p>
          <p>
            • <strong>Catálogo (800x800):</strong> Perfecto para PDFs - reduce peso 90%
          </p>
          <p>
            • <strong>Thumbnail (300x300):</strong> Para vistas previas rápidas
          </p>
          <p>
            • <strong>PNG:</strong> Mantiene transparencia en todos los tamaños
          </p>
          <p>• Proceso 100% automático - ¡no necesitas hacer nada!</p>
        </div>
      </div>

      <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">🎯 Tips para mejores resultados:</h4>
        <div className="text-yellow-700 space-y-2 text-sm">
          <p>
            • Usa <strong>PNG</strong> si tu producto tiene bordes complejos o transparencias
          </p>
          <p>• Asegúrate de que el fondo contraste bien con tu producto</p>
          <p>• Evita fondos muy texturizados o con patrones complicados</p>
          <p>• Los PDFs ahora usan la versión optimizada automáticamente</p>
        </div>
      </div>
    </div>
  );
};
