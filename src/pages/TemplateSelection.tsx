import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, Download, Loader2 } from 'lucide-react';
import { downloadCatalogPDF, getPDFEstimates } from '@/lib/frontendPDFGenerator';
import { getFreeTemplates, getPremiumTemplates } from '@/lib/templates';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { toast } from '@/hooks/use-toast';

interface LocationState {
  products?: any[];
  businessInfo?: any;
}

const TemplateSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessInfo } = useBusinessInfo();
  
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pdfStats, setPdfStats] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<'basic' | 'premium'>('basic');

  const state = location.state as LocationState;

  useEffect(() => {
    if (state?.products) {
      setSelectedProducts(state.products);
      updateStats('minimalista-gris');
    } else {
      navigate('/image-review');
    }
  }, [state, navigate]);

  const updateStats = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      setPdfStats(getPDFEstimates(selectedProducts, template));
    }
  };

  const handleGeneratePDF = async (templateId: string) => {
    if (!selectedProducts.length || !businessInfo) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona productos y completa la información de tu negocio",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    try {
      const result = await downloadCatalogPDF(
        selectedProducts.map(p => ({
          ...p,
          image_url: p.image_url || p.original_image_url
        })),
        businessInfo,
        templateId,
        `catalogo-${businessInfo.business_name}-${templateId}.pdf`
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Catálogo generado",
        description: "El PDF se está descargando con tus imágenes PNG",
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Error al generar PDF",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo más tarde",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const TemplateCard = ({ template }: { template: any }) => {
    const isPremium = template.isPremium && userPlan === 'basic';
    
    return (
      <Card className="h-full flex flex-col">
        <div className="flex-1 p-4">
          <h3 className="font-bold text-lg mb-2">{template.displayName}</h3>
          <p className="text-sm text-gray-600 mb-4">{template.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div>📄 {pdfStats?.totalPages} páginas</div>
            <div>🖼️ {pdfStats?.productsPerPage}/página</div>
            <div>⚡ {pdfStats?.estimatedTime}</div>
            <div>💾 {pdfStats?.estimatedSize}</div>
          </div>
        </div>
        
        <CardContent>
          <Button
            onClick={() => !isPremium && handleGeneratePDF(template.id)}
            disabled={generating || isPremium}
            className="w-full"
            variant={isPremium ? "outline" : "default"}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isPremium ? (
              <Crown className="w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {generating ? 'Generando...' : isPremium ? 'Requiere Premium' : 'Descargar PDF'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate('/image-review')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold">Generar Catálogo</h1>
          <p className="text-gray-600">
            {selectedProducts.length} productos seleccionados • PNG con transparencia
          </p>
        </div>
        
        <div className="w-24"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFreeTemplates().map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
        
        {getPremiumTemplates().map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
};

export default TemplateSelection;
