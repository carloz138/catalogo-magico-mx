
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { analyzeImageQuality, type ImageAnalysis } from './ImageAnalysis';
import { Brain, Zap, DollarSign, CheckCircle } from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  analysis?: ImageAnalysis;
}

interface ImageAnalysisComponentProps {
  files: UploadedFile[];
  onAnalysisComplete: (analysisResults: ImageAnalysis[]) => void;
}

export const ImageAnalysisComponent = ({ files, onAnalysisComplete }: ImageAnalysisComponentProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<ImageAnalysis[]>([]);

  useEffect(() => {
    if (files.length > 0) {
      analyzeImages();
    }
  }, [files]);

  const analyzeImages = async () => {
    setAnalyzing(true);
    setProgress(0);
    const results: ImageAnalysis[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.file.name);
      setProgress((i / files.length) * 100);

      try {
        const analysis = await analyzeImageQuality(file.file);
        results.push(analysis);
      } catch (error) {
        console.error(`Error analyzing ${file.file.name}:`, error);
        // Add fallback analysis
        results.push({
          complexityScore: 50,
          confidence: 60,
          recommendedApi: 'pixelcut',
          estimatedCredits: 1,
          estimatedCost: 0.20,
          reasoning: 'Análisis simplificado por error',
          tips: ['Utiliza fondo uniforme'],
          breakdown: { category: 50, semantic: 50, visual: 50, context: 50 },
          savingsVsRemoveBg: 95
        });
      }
    }

    setProgress(100);
    setAnalysisResults(results);
    setAnalyzing(false);
    onAnalysisComplete(results);
  };

  const totalCreditsNeeded = analysisResults.reduce((sum, analysis) => sum + analysis.estimatedCredits, 0);
  const totalCost = analysisResults.reduce((sum, analysis) => sum + analysis.estimatedCost, 0);

  return (
    <div className="space-y-4">
      {analyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Brain className="w-12 h-12 text-primary mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Analizando imágenes...</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Procesando: {currentFile}
                </p>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(progress)}% completado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!analyzing && analysisResults.length > 0 && (
        <div className="space-y-4">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Análisis Completado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{files.length}</div>
                  <div className="text-sm text-gray-600">Productos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{totalCreditsNeeded}</div>
                  <div className="text-sm text-gray-600">Créditos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">MXN</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-gray-600">Ahorro</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {analysisResults.map((analysis, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={files[index].preview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{files[index].file.name}</span>
                        <Badge variant={analysis.complexityScore >= 75 ? 'destructive' : 'secondary'}>
                          {analysis.complexityScore}/100
                        </Badge>
                        <Badge variant="outline">
                          {analysis.estimatedCredits} crédito{analysis.estimatedCredits > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{analysis.reasoning}</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.tips.map((tip, tipIndex) => (
                          <span key={tipIndex} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {tip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
