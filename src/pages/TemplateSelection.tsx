import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, Check, Loader2, Download, Zap, FileText, Image, Timer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFreeTemplates, getPremiumTemplates, getTemplateById, TemplateConfig } from '@/lib/templates';

// ✅ IMPORTAR LA VERSIÓN OPTIMIZADA
import { 
  downloadOptimizedCatalogPDF, 
  previewOptimizedCatalogPDF, 
  getOptimizedPDFEstimates 
} from '@/lib/optimizedPDFGenerator';

import type { GenerationProgress } from '@/lib/optimizedPDFGenerator';
import '@/styles/template-styles.css';

interface LocationState {
  products?: any[];
  businessInfo?: any;
  skipProcessing?: boolean;
}

const TemplateSelection = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [userPlan, setUserPlan] = useState<string>('basic');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfStats, setPdfStats] = useState<any>(null);
  
  // ✅ ESTADOS PARA PROGRESO OPTIMIZADO
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showProgressDetails, setShowProgressDetails] = useState(false);

  const state = location.state as LocationState;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Estilos para previews de templates */
      .template-preview-container { 
        border-radius: 8px; 
        overflow: hidden; 
        background: #f8f9fa;
      }
      
      .template-body-minimalista-gris { 
        background: #f8f9fa; 
        color: #495057; 
        font-family: 'Inter', sans-serif;
      }
      
      .template-body-profesional-corporativo { 
        background: #e9ecef; 
        font-family: 'Roboto', sans-serif;
      }
      
      .template-body-lujo-negro-oro { 
        background: #1a1a1a; 
        color: #f5f5f5; 
        font-family: 'Playfair Display', serif;
      }
      
      .template-body-naturaleza-organico { 
        background: #f1f8e9; 
      }
      
      .template-body-rustico-campestre { 
        background: #f4f1e8;
        background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b996' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20zm-30 0c0 5.523 4.477 10 10 10s10-4.477 10-10-4.477-10-10-10-10 4.477-10 10z'/%3E%3C/g%3E%3C/svg%3E");
      }
      
      .preview-product { 
        background: #fff; 
        padding: 15px; 
        margin: 10px; 
        border-radius: 8px; 
        text-align: center;
      }
      
      /* Estilos para progreso */
      .progress-bar {
        background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
        height: 4px;
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      
      .progress-container {
        background: #e5e7eb;
        height: 4px;
        border-radius: 2px;
        overflow: hidden;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔍 TemplateSelection montado');
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

  // ✅ FUNCIÓN PRINCIPAL OPTIMIZADA: Generar PDF con progreso
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
      console.log('🚀 GENERANDO PDF OPTIMIZADO:', templateId);
      
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error('Template no encontrado');
      }

      // ✅ VALIDAR PLAN PREMIUM
      if (template.isPremium && userPlan === 'basic') {
        toast({
          title: "Template Premium",
          description: "Actualiza tu plan para acceder a este template",
          variant: "destructive",
        });
        return;
      }

      // ✅ PREPARAR DATOS OPTIMIZADOS
      const pdfProducts = selectedProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || product.custom_description || `Descripción de ${product.name}`,
        category: product.category || 'General',
        price_retail: product.price_retail || 0,
        image_url: product.image_url || product.original_image_url, // ✅ IMAGEN REAL
        sku: product.sku || `SKU-${product.id.slice(-6)}`,
        brand: product.brand
      }));

      const pdfBusinessInfo = {
        business_name: businessInfo.business_name || 'Mi Empresa',
        logo_url: businessInfo.logo_url,
        primary_color: businessInfo.primary_color || template.colors.primary,
        secondary_color: businessInfo.secondary_color || template.colors.secondary,
        phone: businessInfo.phone,
        email: businessInfo.email,
        address: businessInfo.address
      };

      // ✅ MOSTRAR PROGRESO DESPUÉS DE 1 SEGUNDO
      setTimeout(() => {
        setShowProgressDetails(true);
      }, 1000);

      // ✅ GENERAR Y DESCARGAR PDF OPTIMIZADO CON PROGRESO
      const result = await downloadOptimizedCatalogPDF(
        pdfProducts, 
        pdfBusinessInfo, 
        templateId,
        `catalogo-optimizado-${template.displayName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        (progress) => {
          console.log(`📊 Progreso: ${progress.phase} - ${progress.message}`);
          setGenerationProgress(progress);
        }
      );
      
      if (result.success) {
        toast({
          title: "🎉 ¡Catálogo optimizado generado!",
          description: `PDF con imágenes reales descargado exitosamente (${pdfProducts.length} productos)`,
          variant: "default",
        });

        // ✅ OPCIONAL: Guardar registro en BD
        await saveCatalogRecord(templateId);
        
        console.log('✅ PDF optimizado generado y descargado exitosamente');
      } else {
        throw new Error(result.error || 'Error generando PDF optimizado');
      }

    } catch (error) {
      console.error('❌ Error generando PDF optimizado:', error);
      toast({
        title: "Error generando PDF",
        description: error instanceof Error ? error.message : "No se pudo generar el catálogo optimizado",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setSelectedTemplate(null);
      setGenerationProgress(null);
      setShowProgressDetails(false);
    }
  };

  // ✅ FUNCIÓN: Guardar registro (simplificada)
  const saveCatalogRecord = async (templateId: string) => {
    try {
      if (!user) return;
      
      const template = getTemplateById(templateId);
      
      // ✅ MAPEAR TEMPLATE ID A VALORES VÁLIDOS EN BD
      const validTemplateStyles: { [key: string]: string } = {
        'minimalista-gris': 'modern',
        'profesional-corporativo': 'professional', 
        'lujo-negro-oro': 'luxury',
        'naturaleza-organico': 'nature',
        'rustico-campestre': 'rustic',
        // Agregar más mappings según sea necesario
      };
      
      const dbTemplateStyle = validTemplateStyles[templateId] || 'modern';
      
      console.log(`💾 Guardando catálogo optimizado: ${templateId} -> ${dbTemplateStyle}`);
      
      const catalogData = {
        user_id: user.id,
        name: `Catálogo Optimizado ${template?.displayName || templateId} - ${new Date().toLocaleDateString('es-MX')}`,
        product_ids: selectedProducts.map(p => p.id),
        template_style: dbTemplateStyle,
        brand_colors: {
          primary: businessInfo?.primary_color || template?.colors.primary || '#3B82F6',
          secondary: businessInfo?.secondary_color || template?.colors.secondary || '#1F2937'
        },
        logo_url: businessInfo?.logo_url || null,
        show_retail_prices: true,
        show_wholesale_prices: false,
        total_products: selectedProducts.length,
        credits_used: 0, // PDF optimizado es gratis
        generation_method: 'optimized_frontend' // Nuevo campo para identificar método
      };
      
      const { error } = await supabase.from('catalogs').insert(catalogData);
      
      if (error) {
        console.warn('⚠️ No se pudo guardar registro (esto no afecta la descarga):', error.message);
      } else {
        console.log('✅ Registro de catálogo optimizado guardado exitosamente');
      }
    } catch (error) {
      console.warn('⚠️ Error guardando registro (esto no afecta la descarga):', error);
    }
  };

  // ✅ FUNCIÓN: Calcular stats optimizados cuando cambie template
  const updateStatsForTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template && selectedProducts.length > 0) {
      const stats = getOptimizedPDFEstimates(selectedProducts, template);
      setPdfStats(stats);
    }
  };

  const TemplatePreview = ({ template }: { template: TemplateConfig }) => {
    const isLocked = template.isPremium && userPlan === 'basic';
    const isGenerating = generating && selectedTemplate === template.id;

    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-xl ${isLocked ? 'opacity-70' : ''}`}>
        {/* ✅ PREVIEW VISUAL */}
        <div className={`template-preview-container ${template.id} relative h-48 overflow-hidden`}>
          <div 
            className={`template-body-${template.id}`}
            style={{ 
              height: '100%', 
              transform: 'scale(0.4)', 
              transformOrigin: 'top left',
              width: '250%'
            }}
          >
            <div className="catalog" style={{ padding: '20px' }}>
              <div className="header" style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Mi Catálogo</h1>
              </div>
              <div className="preview-product">
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: '#f0f0f0', 
                  margin: '0 auto 10px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '14px', margin: '0 0 5px 0' }}>Producto</h2>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>$99.99</div>
              </div>
            </div>
          </div>
          
          {/* Template badges */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700">
              {template.category}
            </Badge>
          </div>
          
          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          )}

          {/* ✅ OPTIMIZED BADGES */}
          <div className="absolute top-2 right-2 space-y-1">
            <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs flex items-center gap-1">
              <Image className="w-3 h-3" />
              Imágenes Reales
            </Badge>
            <Badge className="bg-purple-500 text-white text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Ultra Optimizado
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

          {/* ✅ STATS OPTIMIZADOS */}
          <div className="text-xs text-gray-500 mb-4 grid grid-cols-2 gap-1">
            <div>• {template.productsPerPage} por página</div>
            <div>• Diseño {template.layout}</div>
            <div>• Imágenes HD reales</div>
            <div>• Cache inteligente</div>
          </div>

          {/* ✅ BOTÓN PRINCIPAL: GENERAR PDF OPTIMIZADO */}
          <Button
            onClick={() => handleGeneratePDF(template.id)}
            disabled={isLocked || generating}
            className="w-full"
            variant={isLocked ? "outline" : "default"}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando PDF Optimizado...
              </>
            ) : isLocked ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Requiere Premium
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generar PDF Optimizado
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
            <p className="text-gray-600">Preparando generador PDF optimizado...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const freeTemplates = getFreeTemplates();
  const premiumTemplates = getPremiumTemplates();
  const totalTemplates = userPlan === 'basic' ? freeTemplates.length : freeTemplates.length + premiumTemplates.length;

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
                  <h1 className="text-2xl font-bold">Generar Catálogo PDF Optimizado</h1>
                  <p className="text-gray-600">
                    {totalTemplates} templates • {selectedProducts.length} productos • 
                    <span className="text-green-600 font-semibold ml-1">
                      <Image className="w-4 h-4 inline mr-1" />
                      Con imágenes reales HD
                    </span>
                  </p>
                </div>
              </div>
              
              {/* ✅ STATS PANEL OPTIMIZADO */}
              {pdfStats && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                    <FileText className="w-4 h-4" />
                    Estimado Optimizado
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-green-700">
                    <div>📄 {pdfStats.totalPages} páginas</div>
                    <div>⚡ {pdfStats.estimatedTime}</div>
                    <div>💾 {pdfStats.estimatedSize}</div>
                    <div>🖼️ Imágenes reales HD</div>
                  </div>
                </div>
              )}
              
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
        
        {/* ✅ BARRA DE PROGRESO OPTIMIZADA */}
        {generating && generationProgress && showProgressDetails && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm text-blue-800 font-medium mb-1">
                    {generationProgress.message}
                  </div>
                  <div className="progress-container mb-2">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${(generationProgress.currentProduct / generationProgress.totalProducts) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>
                      {generationProgress.phase === 'processing' ? 'Optimizando imágenes...' :
                       generationProgress.phase === 'generating' ? 'Generando PDF...' :
                       generationProgress.phase === 'complete' ? '¡Completado!' : 'Iniciando...'}
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
          {/* ✅ BENEFITS BANNER OPTIMIZADO */}
          <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  PDF Optimizado con Imágenes Reales
                </h3>
                <p className="text-green-100 mb-2">
                  Catálogos profesionales con imágenes HD reales. Cache inteligente, compresión automática.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="bg-white/20 px-2 py-1 rounded">🚀 Carga en lotes</span>
                  <span className="bg-white/20 px-2 py-1 rounded">🗜️ Compresión automática</span>
                  <span className="bg-white/20 px-2 py-1 rounded">💾 Cache inteligente</span>
                  <span className="bg-white/20 px-2 py-1 rounded">📱 Móvil optimizado</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">0 créditos</div>
                <div className="text-green-100 text-sm">¡Completamente gratis!</div>
                <div className="text-xs text-green-200 mt-1">
                  <Timer className="w-3 h-3 inline mr-1" />
                  Progreso en tiempo real
                </div>
              </div>
            </div>
          </div>

          {/* Free Templates Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Templates Gratuitos Optimizados</h2>
                <p className="text-gray-600">PDF con imágenes reales • Cache inteligente • Disponibles en todos los planes</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Image className="w-3 h-3 mr-1" />
                {freeTemplates.length} templates HD
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeTemplates.map(template => (
                <TemplatePreview key={template.id} template={template} />
              ))}
            </div>
          </section>

          {/* Premium Templates Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Templates Premium Optimizados</h2>
                <p className="text-gray-600">
                  {userPlan === 'basic' 
                    ? 'PDF con imágenes reales HD • Cache inteligente • Requiere plan Premium' 
                    : 'PDF con imágenes reales HD • Cache inteligente • Incluidos en tu plan Premium'
                  }
                </p>
              </div>
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                <Crown className="w-3 h-3 mr-1" />
                {premiumTemplates.length} templates HD
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumTemplates.map(template => (
                <TemplatePreview key={template.id} template={template} />
              ))}
            </div>
          </section>
        </main>

        {/* ✅ FLOATING ACTION BAR OPTIMIZADO */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{selectedProducts.length} productos con imágenes HD listos</span>
                  </div>
                </div>
                <div className="text-sm font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  🎯 PDF optimizado • Imágenes reales • Cache inteligente • Sin costos
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default TemplateSelection;