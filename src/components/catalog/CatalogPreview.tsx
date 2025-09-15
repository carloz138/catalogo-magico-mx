// src/components/catalog/CatalogPreview.tsx
// 🔍 COMPONENTE PARA PREVIEW DE CATÁLOGOS ANTES DE GENERAR PDF

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  ExternalLink, 
  Code, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Copy,
  X
} from 'lucide-react';

interface CatalogPreviewProps {
  htmlContent: string;
  templateId: string;
  productCount: number;
  onGeneratePDF: () => void;
  onClose: () => void;
  loading?: boolean;
}

export const CatalogPreview: React.FC<CatalogPreviewProps> = ({
  htmlContent,
  templateId,
  productCount,
  onGeneratePDF,
  onClose,
  loading = false
}) => {
  const [previewMode, setPreviewMode] = useState<'iframe' | 'newWindow' | 'code'>('iframe');
  const [iframeHeight, setIframeHeight] = useState('600px');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);

  const openInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      setPreviewWindow(newWindow);
      setPreviewMode('newWindow');
    }
  };

  const downloadHTML = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalogo-preview-${templateId}-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyHTMLToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      // Aquí podrías agregar un toast de confirmación
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const analyzeHTMLContent = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const images = doc.querySelectorAll('img, [style*="background-image"]');
    const cards = doc.querySelectorAll('.product-card');
    const cssText = doc.querySelector('style')?.textContent || '';
    
    return {
      totalImages: images.length,
      totalCards: cards.length,
      hasObjectFit: cssText.includes('object-fit'),
      hasAspectRatio: cssText.includes('aspect-ratio'),
      hasBackgroundSize: cssText.includes('background-size'),
      cssLength: cssText.length
    };
  };

  const debugInfo = analyzeHTMLContent();

  useEffect(() => {
    return () => {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
    };
  }, [previewWindow]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Preview del Catálogo</h2>
              <p className="text-sm text-gray-600">
                Template: {templateId} • {productCount} productos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              <Code className="w-4 h-4 mr-2" />
              Debug Info
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Debug Info Panel */}
        {showDebugInfo && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{debugInfo.totalImages} imágenes</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{debugInfo.totalCards} productos</Badge>
              </div>
              <div className="flex items-center gap-2">
                {debugInfo.hasObjectFit ? (
                  <Badge variant="destructive">object-fit detectado</Badge>
                ) : (
                  <Badge variant="default">Sin object-fit</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {debugInfo.hasBackgroundSize ? (
                  <Badge variant="default">background-size OK</Badge>
                ) : (
                  <Badge variant="outline">Sin background-size</Badge>
                )}
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-600">
              CSS generado: {debugInfo.cssLength} caracteres
            </div>
            
            {debugInfo.hasObjectFit && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <strong>Advertencia:</strong> object-fit detectado en CSS - esto puede causar problemas en PDF
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode === 'iframe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('iframe')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            <Button
              variant={previewMode === 'newWindow' ? 'default' : 'outline'}
              size="sm"
              onClick={openInNewWindow}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Nueva Ventana
            </Button>
            <Button
              variant={previewMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('code')}
            >
              <Code className="w-4 h-4 mr-2" />
              Ver Código
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyHTMLToClipboard}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadHTML}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar HTML
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {previewMode === 'iframe' && (
            <div className="h-full p-4">
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full border border-gray-300 rounded"
                style={{ height: iframeHeight }}
                onLoad={() => {
                  // Auto-ajustar altura del iframe
                  const iframe = iframeRef.current;
                  if (iframe && iframe.contentWindow) {
                    try {
                      const contentHeight = iframe.contentWindow.document.body.scrollHeight;
                      setIframeHeight(`${Math.min(contentHeight + 50, 800)}px`);
                    } catch (e) {
                      // Cross-origin issues
                      console.log('No se pudo ajustar altura automáticamente');
                    }
                  }
                }}
              />
              
              <div className="mt-2 text-xs text-gray-600 text-center">
                Tip: Inspecciona este preview con las herramientas de desarrollador para ver exactamente cómo se renderizan las imágenes
              </div>
            </div>
          )}

          {previewMode === 'newWindow' && (
            <div className="h-full flex items-center justify-center">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Preview en Nueva Ventana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    El preview se abrió en una nueva ventana. Úsala para inspeccionar las imágenes 
                    con las herramientas de desarrollador del navegador.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInNewWindow}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reabrir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {previewMode === 'code' && (
            <div className="h-full p-4">
              <div className="h-full border border-gray-300 rounded overflow-hidden">
                <textarea
                  className="w-full h-full p-4 font-mono text-sm resize-none border-0 outline-none"
                  value={htmlContent}
                  readOnly
                  style={{ minHeight: '400px' }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Busca "object-fit", "aspect-ratio" o propiedades CSS que puedan causar problemas en PDF
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            HTML generado correctamente • Listo para generar PDF
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={onGeneratePDF}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Generar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función helper para generar preview sin PDF
export const generateHTMLPreview = (
  products: any[],
  businessInfo: any,
  templateId: string
): string => {
  // Importar las funciones necesarias
  const { getTemplateById } = require('@/lib/templates/industry-templates');
  const { TemplateGenerator } = require('@/lib/templates/css-generator');
  
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} no encontrado`);
  }
  
  return TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
};