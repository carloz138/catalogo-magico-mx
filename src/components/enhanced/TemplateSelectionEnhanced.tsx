// src/components/enhanced/TemplateSelectionEnhanced.tsx
// 🚀 COMPONENTE MEJORADO DE SELECCIÓN DE TEMPLATES

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Crown, Check, Loader2, Download, Zap, FileText, 
  Image, Timer, Sparkles, Palette, Layout, Filter 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ✅ IMPORTAR TODOS LOS SISTEMAS DE TEMPLATES
import { 
  getFreeTemplates, 
  getPremiumTemplates, 
  getTemplateById, 
  TemplateConfig 
} from '@/lib/templates';

import { 
  ENHANCED_TEMPLATES, 
  EnhancedTemplateConfig,
  getTemplateRecommendations,
  getTemplatesByCategory
} from '@/lib/templates/enhanced-config';

import { 
  REFERENCE_TEMPLATES
} from '@/lib/templates/reference-inspired';

import { 
  generateCatalogWithProgress,
  GenerationProgress 
} from '@/lib/enhancedPDFGenerator';

interface LocationState {
  products?: any[];
  businessInfo?: any;
  skipProcessing?: boolean;
}

type TemplateCategory = 'all' | 'free' | 'premium' | 'professional' | 'reference';

const TemplateSelectionEnhanced = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [userPlan, setUserPlan] = useState<string>('basic');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  // ✅ ESTADOS PARA PROGRESO MEJORADO
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showProgressDetails, setShowProgressDetails] = useState(false);

  const state = location.state as LocationState;

  useEffect(() => {
    console.log('🔍 TemplateSelectionEnhanced montado');
    console.log('🔍 state?.products:', state?.products?.length || 0);

    if (state?.products && state.products.length > 0) {
      console.log('✅ Productos encontrados:', state.products.length);
      setSelectedProducts(state.products);
    } else {
      console.log('❌ No hay productos, redirigiendo...');
      navigate('/image-review');
      return;
    }

    fetchUserPlan();
  }, [state, navigate]);

  const fetchUserPlan = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan_type')
        .eq('id', user.id)
        .single();

      if (!error && data?.plan_type) {
        setUserPlan(data.plan_type);
        console.log('✅ Plan de usuario:', data.plan_type);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ COMBINAR TODOS LOS TEMPLATES
  const getAllTemplates = (): (TemplateConfig | EnhancedTemplateConfig)[] => {
    const basicTemplates = Object.values({
      ...getFreeTemplates().reduce((acc, t) => ({ ...acc, [t.id]: t }), {}),
      ...getPremiumTemplates().reduce((acc, t) => ({ ...acc, [t.id]: t }), {})
    });
    
    const enhancedTemplates = Object.values(ENHANCED_TEMPLATES);
    const referenceTemplates = Object.values(REFERENCE_TEMPLATES);
    
    return [...basicTemplates, ...enhancedTemplates, ...referenceTemplates];
  };

  // ✅ FILTRAR TEMPLATES POR CATEGORÍA
  const getFilteredTemplates = (): (TemplateConfig | EnhancedTemplateConfig)[] => {
    const allTemplates = getAllTemplates();
    
    switch (activeCategory) {
      case 'free':
        return allTemplates.filter(t => !t.isPremium);
      case 'premium':
        return allTemplates.filter(t => t.isPremium);
      case 'professional':
        return Object.values(ENHANCED_TEMPLATES);
      case 'reference':
        return Object.values(REFERENCE_TEMPLATES);
      default:
        return allTemplates;
    }
  };

  // ✅ OBTENER RECOMENDACIONES
  const getRecommendedTemplates = (): EnhancedTemplateConfig[] => {
    if (!selectedProducts.length) return [];
    
    const businessType = businessInfo?.industry || 'general';
    return getTemplateRecommendations(selectedProducts, businessType).slice(0, 3);
  };

  // ✅ FUNCIÓN PRINCIPAL MEJORADA: Generar PDF
  const handleGeneratePDF = async (templateId: string) => {
    if (!selectedProducts.length) {
      toast({
        title: "No hay productos",
        description: "No se encontraron productos para el catálogo",
        variant: "destructive",
      });
      return;
    }

    if (!businessInfo) {
      toast({
        title: "Configura tu negocio",
        description: "Ve a configuración para completar la información",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setSelectedTemplate(templateId);
    setGenerationProgress(null);
    setShowProgressDetails(false);

    try {
      console.log('🚀 GENERANDO PDF MEJORADO:', templateId);
      
      // ✅ VERIFICAR TIPO DE TEMPLATE
      const isReferenceTemplate = REFERENCE_TEMPLATES[templateId];
      const isEnhancedTemplate = ENHANCED_TEMPLATES[templateId];
      const isBasicTemplate = getTemplateById(templateId);
      
      let templateType = 'basic';
      if (isReferenceTemplate) templateType = 'reference';
      else if (isEnhancedTemplate) templateType = 'professional';
      
      console.log(`✨ Tipo de template: ${templateType}`);

      // ✅ VALIDAR PLAN PREMIUM
      const template = isReferenceTemplate || isEnhancedTemplate || isBasicTemplate;
      if (template?.isPremium && userPlan === 'basic') {
        toast({
          title: "Template Premium",
          description: "Actualiza tu plan para acceder a este template",
          variant: "destructive",
        });
        return;
      }

      // ✅ MOSTRAR PROGRESO DESPUÉS DE 1 SEGUNDO
      setTimeout(() => {
        setShowProgressDetails(true);
      }, 1000);

      // ✅ GENERAR Y DESCARGAR PDF CON SISTEMA MEJORADO
      const result = await generateCatalogWithProgress(
        selectedProducts,
        businessInfo,
        templateId,
        (progress) => {
          console.log(`📊 Progreso: ${progress.phase} - ${progress.message}`);
          setGenerationProgress(progress);
        }
      );
      
      if (result.success) {
        toast({
          title: "🎉 ¡Catálogo profesional generado!",
          description: `PDF ${templateType} descargado exitosamente (${selectedProducts.length} productos)`,
          variant: "default",
        });

        // ✅ OPCIONAL: Guardar registro en BD
        await saveCatalogRecord(templateId, templateType);
        
        console.log('✅ PDF mejorado generado exitosamente:', result);
      } else {
        throw new Error(result.error || 'Error generando PDF mejorado');
      }

    } catch (error) {
      console.error('❌ Error generando PDF mejorado:', error);
      toast({
        title: "Error generando PDF",
        description: error instanceof Error ? error.message : "No se pudo generar el catálogo",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setSelectedTemplate(null);
      setGenerationProgress(null);
      setShowProgressDetails(false);
    }
  };

  // ✅ FUNCIÓN: Guardar registro
  const saveCatalogRecord = async (templateId: string, templateType: string) => {
    try {
      if (!user) return;
      
      const template = ENHANCED_TEMPLATES[templateId] || REFERENCE_TEMPLATES[templateId] || getTemplateById(templateId);
      
      console.log(`💾 Guardando catálogo: ${templateId} (${templateType})`);
      
      const catalogData = {
        user_id: user.id,
        name: `Catálogo ${template?.displayName || templateId} - ${new Date().toLocaleDateString('es-MX')}`,
        product_ids: selectedProducts.map(p => p.id),
        template_style: templateId,
        template_type: templateType,
        brand_colors: {
          primary: businessInfo?.primary_color || template?.colors?.primary || '#3B82F6',
          secondary: businessInfo?.secondary_color || template?.colors?.secondary || '#1F2937'
        },
        logo_url: businessInfo?.logo_url || null,
        show_retail_prices: true,
        show_wholesale_prices: false,
        total_products: selectedProducts.length,
        credits_used: 0
      };
      
      const { error } = await supabase.from('catalogs').insert(catalogData);
      
      if (error) {
        console.warn('⚠️ No se pudo guardar registro:', error.message);
      } else {
        console.log('✅ Registro de catálogo guardado exitosamente');
      }
    } catch (error) {
      console.warn('⚠️ Error guardando registro:', error);
    }
  };

  // ✅ COMPONENTE DE TEMPLATE CARD MEJORADO
  const TemplateCard = ({ template }: { template: TemplateConfig | EnhancedTemplateConfig }) => {
    const isLocked = template.isPremium && userPlan === 'basic';
    const isGenerating = generating && selectedTemplate === template.id;
    
    // Determinar tipo de template
    const isReference = REFERENCE_TEMPLATES[template.id];
    const isEnhanced = ENHANCED_TEMPLATES[template.id];
    const templateType = isReference ? 'reference' : isEnhanced ? 'professional' : 'basic';

    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-xl ${isLocked ? 'opacity-70' : ''}`}>
        {/* ✅ PREVIEW VISUAL MEJORADO */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Template preview placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {templateType === 'reference' ? '🎯' : 
                 templateType === 'professional' ? '✨' : '📄'}
              </div>
              <div className="text-sm text-gray-600">{template.displayName}</div>
            </div>
          </div>
          
          {/* Template badges */}
          <div className="absolute top-2 left-2 space-y-1">
            <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700">
              {template.category}
            </Badge>
            {templateType === 'reference' && (
              <Badge className="bg-purple-500 text-white text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Inspirado en Referencias
              </Badge>
            )}
            {templateType === 'professional' && (
              <Badge className="bg-blue-500 text-white text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Profesional
              </Badge>
            )}
          </div>
          
          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          )}

          {/* ✅ QUALITY BADGES */}
          <div className="absolute top-2 right-2 space-y-1">
            <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs flex items-center gap-1">
              <Image className="w-3 h-3" />
              PNG HD
            </Badge>
            <Badge className="bg-purple-500 text-white text-xs flex items-center gap-1">
              <FileText className="w-3 h-3" />
              300 DPI
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-lg truncate">{template.displayName}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{template.description}</p>
            </div>
            {template.isPremium && (
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none shrink-0">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          {/* ✅ STATS ESPECÍFICOS POR TIPO */}
          <div className="text-xs text-gray-500 mb-4 grid grid-cols-2 gap-1">
            {'layout' in template ? (
              <>
                <div>• {template.layout.productsPerPage} por página</div>
                <div>• {template.layout.type} layout</div>
                <div>• {templateType} quality</div>
                <div>• Elementos {template.elements?.geometricShapes ? 'gráficos' : 'básicos'}</div>
              </>
            ) : (
              <>
                <div>• {template.productsPerPage} por página</div>
                <div>• {template.layout} diseño</div>
                <div>• Calidad estándar</div>
                <div>• Estilo clásico</div>
              </>
            )}
          </div>

          {/* ✅ BOTÓN PRINCIPAL */}
          <Button
            onClick={() => handleGeneratePDF(template.id)}
            disabled={isLocked || generating}
            className="w-full"
            variant={isLocked ? "outline" : "default"}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando {templateType === 'reference' ? 'Referencia' : templateType === 'professional' ? 'Profesional' : 'Básico'}...
              </>
            ) : isLocked ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Requiere Premium
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generar PDF {templateType === 'reference' ? '🎯' : templateType === 'professional' ? '✨' : '📄'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Preparando sistema de templates mejorado...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const filteredTemplates = getFilteredTemplates();
  const recommendedTemplates = getRecommendedTemplates();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* ✅ HEADER MEJORADO */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/image-review')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Biblioteca</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    Sistema de Templates Profesionales
                    <span className="ml-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded">
                      ✨ MEJORADO
                    </span>
                  </h1>
                  <p className="text-gray-600">
                    {filteredTemplates.length} templates • {selectedProducts.length} productos • 
                    <span className="text-green-600 font-semibold ml-1">
                      <Image className="w-4 h-4 inline mr-1" />
                      PNG sin fondo + 300 DPI
                    </span>
                  </p>
                </div>
              </div>
              
              {userPlan === 'basic' && (
                <Button 
                  onClick={() => navigate('/checkout')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Actualizar a Premium
                </Button>
              )}
            </div>
          </div>
        </header>
        
        {/* ✅ BARRA DE PROGRESO PROFESIONAL */}
        {generating && generationProgress && showProgressDetails && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm text-blue-800 font-medium mb-1">
                    {generationProgress.message}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(generationProgress.currentProduct / generationProgress.totalProducts) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>
                      {generationProgress.phase === 'processing' ? '🔄 Optimizando imágenes HD...' :
                       generationProgress.phase === 'generating' ? '📄 Generando PDF profesional...' :
                       generationProgress.phase === 'complete' ? '✅ ¡PDF completado!' : '🚀 Iniciando generación...'}
                    </span>
                    <span>
                      {generationProgress.currentProduct}/{generationProgress.totalProducts} productos • 
                      Página {generationProgress.currentPage}/{generationProgress.totalPages}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* ✅ FILTROS DE CATEGORÍA */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { key: 'all', label: 'Todos', icon: Layout },
                { key: 'reference', label: 'Inspirados en Referencias', icon: Sparkles },
                { key: 'professional', label: 'Profesionales', icon: Zap },
                { key: 'premium', label: 'Premium', icon: Crown },
                { key: 'free', label: 'Gratuitos', icon: Check }
              ] as const).map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* ✅ RECOMENDACIONES INTELIGENTES */}
          {showRecommendations && recommendedTemplates.length > 0 && activeCategory === 'all' && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Recomendado para tu Negocio
                  </h2>
                  <p className="text-gray-600">Templates perfectos para tu tipo de productos</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecommendations(false)}
                >
                  Ocultar
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedTemplates.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </section>
          )}

          {/* ✅ TEMPLATES FILTRADOS */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeCategory === 'reference' ? '🎯 Templates Inspirados en Referencias' :
                   activeCategory === 'professional' ? '✨ Templates Profesionales' :
                   activeCategory === 'premium' ? '👑 Templates Premium' :
                   activeCategory === 'free' ? '🆓 Templates Gratuitos' :
                   '🎨 Todos los Templates'}
                </h2>
                <p className="text-gray-600">
                  {filteredTemplates.length} templates disponibles • PDF 300 DPI • PNG sin fondo negro
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <FileText className="w-3 h-3 mr-1" />
                {filteredTemplates.length} disponibles
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </section>
        </main>

        {/* ✅ FLOATING ACTION BAR MEJORADO */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{selectedProducts.length} productos PNG listos</span>
                  </div>
                </div>
                <div className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  🚀 Sistema Mejorado • Templates Profesionales • PNG HD • 300 DPI
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default TemplateSelectionEnhanced;
