import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { FileUploader } from '@/components/upload/FileUploader';
import { ProductFormWrapper } from '@/components/upload/ProductFormWrapper';
import { ImageAnalysisComponent } from '@/components/upload/ImageAnalysisComponent';
import { FinalStepComponent } from '@/components/upload/FinalStepComponent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload as UploadIcon, Image, FileText, Package, PackageOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'form' | 'final'>('upload');

  const handleFilesUploaded = (newFiles: UploadedFile[]) => {
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
    setCurrentStep('final');
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
      case 'final': return Package;
      default: return UploadIcon;
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      {/* Indicador de paso actual - más claro */}
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
        <div className="flex items-center gap-1">
          {['upload', 'analyze', 'form', 'final'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${currentStep === step 
                  ? 'bg-blue-600 text-white' 
                  : index < ['upload', 'analyze', 'form', 'final'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }
              `}>
                {index < ['upload', 'analyze', 'form', 'final'].indexOf(currentStep) 
                  ? '✓' 
                  : index + 1
                }
              </div>
              {index < 3 && (
                <div className={`w-6 h-0.5 ${
                  index < ['upload', 'analyze', 'form', 'final'].indexOf(currentStep)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700 ml-2">
          Paso {['upload', 'analyze', 'form', 'final'].indexOf(currentStep) + 1} de 4
        </span>
      </div>

      {/* CTAs claros */}
      <Button 
        onClick={() => navigate('/products/bulk-upload')}
        variant="outline"
        size="sm"
      >
        <PackageOpen className="h-4 w-4 mr-2" />
        Carga Masiva
      </Button>

      {files.length > 0 && (
        <Button 
          onClick={resetUpload}
          variant="outline"
          size="sm"
        >
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
                <FileUploader onFilesUploaded={handleFilesUploaded} />
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
                <ImageAnalysisComponent 
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
                <ProductFormWrapper 
                  files={files} 
                  onComplete={handleProductDataComplete} 
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 'final' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Opciones Finales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinalStepComponent files={files} />
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Upload;
