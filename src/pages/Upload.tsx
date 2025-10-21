import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProductFormWrapper } from "@/components/upload/ProductFormWrapper";
import { ImageAnalysisComponent } from "@/components/upload/ImageAnalysisComponent";
import { FinalStepComponent } from "@/components/upload/FinalStepComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon, Image, FileText, Package, PackageOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type UploadedFile = {
  id: string;
  file: File;
  preview: string;
  url?: string;
  analysis?: any;
  productData?: any;
};

const Upload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState<"upload" | "analyze" | "form" | "final">("upload");

  const handleFilesUploaded = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
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

  const getStepIcon = (step: string) => {
    switch (step) {
      case "upload":
        return UploadIcon;
      case "analyze":
        return Image;
      case "form":
        return FileText;
      case "final":
        return Package;
      default:
        return UploadIcon;
    }
  };

  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      {/* Stepper - Móvil: solo número de paso */}
      <div className="md:hidden flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
        <span className="text-sm font-medium text-gray-700">
          Paso {["upload", "analyze", "form", "final"].indexOf(currentStep) + 1}/4
        </span>
      </div>

      {/* Stepper - Desktop: completo */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
        <div className="flex items-center gap-1">
          {["upload", "analyze", "form", "final"].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${
                  currentStep === step
                    ? "bg-blue-600 text-white"
                    : index < ["upload", "analyze", "form", "final"].indexOf(currentStep)
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                }
              `}
              >
                {index < ["upload", "analyze", "form", "final"].indexOf(currentStep) ? "✓" : index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-4 h-0.5 ${
                    index < ["upload", "analyze", "form", "final"].indexOf(currentStep) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 ml-2">
          Paso {["upload", "analyze", "form", "final"].indexOf(currentStep) + 1} de 4
        </span>
      </div>

      {/* CTAs - Móvil: solo iconos importantes */}
      <div className="flex items-center gap-2 flex-1 md:flex-none justify-end">
        {files.length > 0 && (
          <Button onClick={resetUpload} variant="outline" size="sm" className="md:flex h-10">
            <span className="hidden sm:inline">Reiniciar</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        )}

        <Button
          onClick={() => navigate("/products/bulk-upload")}
          variant="outline"
          size="sm"
          className="hidden sm:flex h-10"
        >
          <PackageOpen className="h-4 w-4 mr-2" />
          Carga Masiva
        </Button>
      </div>
    </div>
  );

  return (
    <AppLayout actions={actions}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress visual móvil */}
          <div className="md:hidden mb-4 px-4">
            <div className="flex items-center justify-between mb-2">
              {["upload", "analyze", "form", "final"].map((step, index) => {
                const stepNames = ["Subir", "Analizar", "Formulario", "Finalizar"];
                const currentIndex = ["upload", "analyze", "form", "final"].indexOf(currentStep);
                const isActive = currentStep === step;
                const isCompleted = index < currentIndex;

                return (
                  <div key={step} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-1
                        ${
                          isActive
                            ? "bg-blue-600 text-white ring-2 ring-blue-200"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-500"
                        }
                      `}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      <span
                        className={`text-[10px] font-medium text-center ${
                          isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {stepNames[index]}
                      </span>
                    </div>
                    {index < 3 && (
                      <div className="absolute top-4 left-[calc(50%+16px)] right-[-50%] h-0.5 -translate-y-1/2">
                        <div className={`h-full ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {currentStep === "upload" && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <UploadIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Subir Imágenes de Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <FileUploader onFilesUploaded={handleFilesUploaded} />

                {/* 🆕 Botón de continuación - solo visible cuando hay archivos */}
                {files.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-700">
                        <p className="font-semibold mb-1">
                          ✅ {files.length} imagen{files.length > 1 ? "es" : ""} lista{files.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs">Revisa que todas las imágenes sean correctas antes de continuar</p>
                      </div>
                      <Button onClick={() => setCurrentStep("analyze")} size="lg" className="w-full sm:w-auto">
                        Continuar al Análisis →
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === "analyze" && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Image className="h-4 w-4 sm:h-5 sm:w-5" />
                  Análisis de Imágenes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ImageAnalysisComponent files={files} onAnalysisComplete={handleAnalysisComplete} />
              </CardContent>
            </Card>
          )}

          {currentStep === "form" && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  Información de Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ProductFormWrapper files={files} onComplete={handleProductDataComplete} />
              </CardContent>
            </Card>
          )}

          {currentStep === "final" && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  Opciones Finales
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <FinalStepComponent files={files} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Navigation Móvil */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-40 safe-bottom">
          <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto">
            {currentStep !== "upload" && (
              <Button
                onClick={() => {
                  const steps = ["upload", "analyze", "form", "final"];
                  const currentIndex = steps.indexOf(currentStep);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as any);
                  }
                }}
                variant="outline"
                size="sm"
                className="flex-1 h-11"
              >
                Atrás
              </Button>
            )}

            {files.length > 0 && (
              <Button onClick={resetUpload} variant="outline" size="sm" className="flex-1 h-11">
                Reiniciar
              </Button>
            )}

            <Button
              onClick={() => navigate("/products/bulk-upload")}
              variant="outline"
              size="sm"
              className="flex-1 h-11"
            >
              <PackageOpen className="h-4 w-4 mr-2" />
              Masiva
            </Button>
          </div>
        </div>

        {/* Spacer para bottom nav */}
        <div className="md:hidden h-20" />
      </AppLayout>
  );
};

export default Upload;
