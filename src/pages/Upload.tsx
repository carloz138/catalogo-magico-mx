import React, { useState } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProductFormWrapper } from "@/components/upload/ProductFormWrapper";
import { ImageAnalysisComponent } from "@/components/upload/ImageAnalysisComponent";
import { FinalStepComponent } from "@/components/upload/FinalStepComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Image, FileText, Package, PackageOpen } from "lucide-react";
// 👇 IMPORTAR useSearchParams
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileUploader, type UploadedFile } from "@/components/upload/FileUploader";

const Upload = () => {
  const navigate = useNavigate();
  // 👇 LEER EL PARÁMETRO DE LA URL
  const [searchParams] = useSearchParams();
  const prefilledName = searchParams.get("name");

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState<"upload" | "analyze" | "form" | "final">("upload");

  const handleFilesUploaded = (newFiles: UploadedFile[]) => {
    // 👇 MAGIA AQUÍ: Si hay un nombre pre-llenado (del Radar), se lo asignamos al primer archivo
    let processedFiles = newFiles;

    if (prefilledName && newFiles.length > 0) {
      processedFiles = newFiles.map((file, index) => {
        // Solo al primer archivo para no nombrar todo igual
        if (index === 0) {
          return {
            ...file,
            // Pre-inicializamos productData con el nombre
            productData: {
              ...file.productData,
              name: prefilledName,
            },
          };
        }
        return file;
      });
    }

    setFiles(processedFiles);
    if (newFiles.length > 0) {
      setCurrentStep("analyze");
    }
  };

  const handleAnalysisComplete = (analysisResults: any[]) => {
    const updatedFiles = files.map((file, index) => ({
      ...file,
      analysis: analysisResults[index],
    }));
    setFiles(updatedFiles);
    setCurrentStep("form");
  };

  const handleProductDataComplete = (productData: any[]) => {
    const updatedFiles = files.map((file, index) => ({
      ...file,
      productData: productData[index],
    }));
    setFiles(updatedFiles);
    setCurrentStep("final");
  };

  const resetUpload = () => {
    setFiles([]);
    setCurrentStep("upload");
  };

  // Header de Acciones (Stepper + Botones)
  const HeaderActions = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Stepper */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-1">
          {["upload", "analyze", "form", "final"].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                ${
                  currentStep === step
                    ? "bg-blue-600 text-white"
                    : index < ["upload", "analyze", "form", "final"].indexOf(currentStep)
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                }
              `}
              >
                {index < ["upload", "analyze", "form", "final"].indexOf(currentStep) ? "✓" : index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-4 h-0.5 ${
                    index < ["upload", "analyze", "form", "final"].indexOf(currentStep) ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 ml-2 hidden sm:inline">
          Paso {["upload", "analyze", "form", "final"].indexOf(currentStep) + 1} de 4
        </span>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {files.length > 0 && (
          <Button onClick={resetUpload} variant="outline" size="sm">
            Reiniciar
          </Button>
        )}
        <Button onClick={() => navigate("/products/bulk-upload")} variant="outline" size="sm" className="gap-2">
          <PackageOpen className="h-4 w-4" />
          Carga Masiva
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {prefilledName ? `Crear producto: ${prefilledName}` : "Subir Productos"}
        </h1>
        <p className="text-gray-500 mt-1">
          {prefilledName
            ? "Sube una imagen para atender esta solicitud del Radar."
            : "Sube imágenes y deja que nuestra IA haga el resto."}
        </p>
      </div>

      <HeaderActions />

      <div className="space-y-6">
        {currentStep === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                Subir Imágenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader onFilesUploaded={handleFilesUploaded} />
            </CardContent>
          </Card>
        )}

        {currentStep === "analyze" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Análisis de Imágenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageAnalysisComponent files={files} onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
          </Card>
        )}

        {currentStep === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información de Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductFormWrapper files={files} onComplete={handleProductDataComplete} />
            </CardContent>
          </Card>
        )}

        {currentStep === "final" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Finalizar Carga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FinalStepComponent files={files} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Upload;
