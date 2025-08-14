
import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { FileUploader } from '@/components/upload/FileUploader';
import { ProductForm } from '@/components/upload/ProductForm';
import { ImageAnalysis } from '@/components/upload/ImageAnalysis';
import { CostCalculator } from '@/components/upload/CostCalculator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload as UploadIcon, Image, FileText, Calculator } from 'lucide-react';

export type UploadedFile = {
  file: File;
  preview: string;
  analysis?: any;
  productData?: any;
};

const Upload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'form' | 'cost'>('upload');

  const handleFilesSelected = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setCurrentStep('analyze');
    }
  };

  const handleAnalysisComplete = (analysisResults: any[]) => {
    const updatedFiles = files.map((file, index) => ({
      ...file,
      analysis: analysisResults[index]
    }));
    setFiles(updatedFiles);
    setCurrentStep('form');
  };

  const handleProductDataComplete = (productData: any[]) => {
    const updatedFiles = files.map((file, index) => ({
      ...file,
      productData: productData[index]
    }));
    setFiles(updatedFiles);
    setCurrentStep('cost');
  };

  const resetUpload = () => {
    setFiles([]);
    setCurrentStep('upload');
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'upload': return UploadIcon;
      case 'analyze': return Image;
      case 'form': return FileText;
      case 'cost': return Calculator;
      default: return UploadIcon;
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      {/* Progress Steps */}
      <div className="hidden md:flex items-center gap-2">
        {['upload', 'analyze', 'form', 'cost'].map((step, index) => {
          const StepIcon = getStepIcon(step);
          const isActive = currentStep === step;
          const isCompleted = ['upload', 'analyze', 'form', 'cost'].indexOf(currentStep) > index;
          
          return (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isActive 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-gray-300 bg-gray-50 text-gray-400'
              }`}>
                <StepIcon className="w-4 h-4" />
              </div>
              {index < 3 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden">
        <Badge variant="outline">
          Paso {['upload', 'analyze', 'form', 'cost'].indexOf(currentStep) + 1} de 4
        </Badge>
      </div>

      {files.length > 0 && (
        <Button variant="outline" onClick={resetUpload}>
          Reiniciar
        </Button>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="max-w-4xl mx-auto">
          {currentStep === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  Subir Imágenes de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader onFilesSelected={handleFilesSelected} />
              </CardContent>
            </Card>
          )}

          {currentStep === 'analyze' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Análisis de Imágenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageAnalysis 
                  files={files} 
                  onAnalysisComplete={handleAnalysisComplete} 
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductForm 
                  files={files} 
                  onComplete={handleProductDataComplete} 
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'cost' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cálculo de Costos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CostCalculator files={files} />
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Upload;
