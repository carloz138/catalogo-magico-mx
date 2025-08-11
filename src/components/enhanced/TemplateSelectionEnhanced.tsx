
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Download, Loader2, Zap, Palette, Layout, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  getAllEnhancedTemplates, 
  getAllReferenceTemplates, 
  EnhancedTemplateConfig 
} from '@/lib/templates/enhanced-config';
import { 
  downloadEnhancedCatalogPDF, 
  GenerationProgress, 
  PDFProduct, 
  PDFBusinessInfo 
} from '@/lib/enhancedPDFGenerator';

interface TemplateSelectionEnhancedProps {
  products: PDFProduct[];
  businessInfo: PDFBusinessInfo;
  userPlan: string;
  onTemplateSelect?: (templateId: string) => void;
}

const TemplateSelectionEnhanced: React.FC<TemplateSelectionEnhancedProps> = ({
  products,
  businessInfo,
  userPlan,
  onTemplateSelect
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [allTemplates, setAllTemplates] = useState<EnhancedTemplateConfig[]>([]);

  useEffect(() => {
    // Combine enhanced and reference-inspired templates
    const enhanced = getAllEnhancedTemplates();
    const reference = getAllReferenceTemplates();
    setAllTemplates([...enhanced, ...reference]);
  }, []);

  const handleGeneratePDF = async (template: EnhancedTemplateConfig) => {
    if (!products.length) {
      toast({
        title: "No hay productos",
        description: "Necesitas productos para generar el catálogo",
        variant: "destructive",
      });
      return;
    }

    if (template.isPremium && userPlan === 'basic') {
      toast({
        title: "Template Premium",
        description: "Actualiza tu plan para acceder a este template",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setSelectedTemplate(template.id);
    setProgress(null);

    try {
      const result = await downloadEnhancedCatalogPDF(
        products,
        businessInfo,
        template.id,
        `catalogo-${template.name}-${Date.now()}.pdf`,
        (progressData) => {
          setProgress(progressData);
        }
      );

      if (result.success) {
        toast({
          title: "🎉 ¡Catálogo generado!",
          description: `PDF profesional descargado exitosamente (${products.length} productos)`,
          variant: "default",
        });

        if (onTemplateSelect) {
          onTemplateSelect(template.id);
        }
      } else {
        throw new Error(result.error || 'Error generando PDF');
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error generando PDF",
        description: error instanceof Error ? error.message : "No se pudo generar el catálogo",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setSelectedTemplate(null);
      setProgress(null);
    }
  };

  const TemplateCard: React.FC<{ template: EnhancedTemplateConfig }> = ({ template }) => {
    const isLocked = template.isPremium && userPlan === 'basic';
    const isGenerating = generating && selectedTemplate === template.id;

    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${isLocked ? 'opacity-70' : ''}`}>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold truncate">
                {template.displayName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </p>
            </div>
            {template.isPremium && (
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Template Features */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Layout className="w-3 h-3" />
              {template.layout.productsPerPage} por página
            </div>
            <div className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              {template.imageSettings.quality} quality
            </div>
            <div className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              {template.layout.type} layout
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {template.category}
            </div>
          </div>

          {/* Color Palette Preview */}
          <div className="flex gap-1 mb-4">
            <div 
              className="w-4 h-4 rounded-full border" 
              style={{ backgroundColor: template.colors.primary }}
              title="Primary Color"
            />
            <div 
              className="w-4 h-4 rounded-full border" 
              style={{ backgroundColor: template.colors.secondary }}
              title="Secondary Color"
            />
            {template.colors.accent && (
              <div 
                className="w-4 h-4 rounded-full border" 
                style={{ backgroundColor: template.colors.accent }}
                title="Accent Color"
              />
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => handleGeneratePDF(template)}
            disabled={isLocked || generating}
            className="w-full"
            variant={isLocked ? "outline" : "default"}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : isLocked ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Requiere Premium
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generar PDF Profesional
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const freeTemplates = allTemplates.filter(t => !t.isPremium);
  const premiumTemplates = allTemplates.filter(t => t.isPremium);

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      {generating && progress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-blue-900">
                  {progress.message}
                </h3>
                <span className="text-sm text-blue-700">
                  {progress.currentProduct}/{progress.totalProducts} productos
                </span>
              </div>
              <Progress 
                value={(progress.currentProduct / progress.totalProducts) * 100} 
                className="h-2"
              />
              <div className="text-xs text-blue-600">
                Página {progress.currentPage} de {progress.totalPages} • 
                Fase: {progress.phase}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Templates */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Templates Gratuitos Profesionales</h2>
            <p className="text-muted-foreground">
              Calidad profesional disponible en todos los planes
            </p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {freeTemplates.length} templates
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freeTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>

      {/* Premium Templates */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Templates Premium Profesionales</h2>
            <p className="text-muted-foreground">
              {userPlan === 'basic' 
                ? 'Diseños avanzados • Requiere plan Premium' 
                : 'Diseños avanzados • Incluidos en tu plan Premium'
              }
            </p>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
            <Crown className="w-3 h-3 mr-1" />
            {premiumTemplates.length} templates
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default TemplateSelectionEnhanced;
