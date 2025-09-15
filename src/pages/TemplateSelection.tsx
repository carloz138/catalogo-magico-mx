// src/pages/TemplateSelection.tsx
// 🎨 TEMPLATE SELECTION CON SISTEMA DE PREVIEW INTEGRADO

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';

// Importar sistema híbrido y preview
import { SmartTemplateSelector } from '@/components/templates/SmartTemplateSelector';
import { CatalogPreview } from '@/components/catalog/CatalogPreview';
import { 
  generateCatalog, 
  generateDynamicCatalog,
  generateClassicCatalog,
  checkLimits 
} from '@/lib/catalog/unified-generator';
import { getDynamicTemplate } from '@/lib/templates/dynamic-mapper';
import { getTemplateById } from '@/lib/templates/industry-templates';
import { TemplateGenerator } from '@/lib/templates/css-generator';
import { IndustryType } from '@/lib/templates/industry-templates';

import { 
  ArrowLeft,
  ArrowRight,
  Palette,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Package,
  Zap,
  Info,
  Rocket,
  Clock,
  Eye
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
  image_url: string;
  sku?: string;
  category?: string;
  specifications?: string;
}

interface UsageLimits {
  canGenerate: boolean;
  catalogsUsed: number;
  catalogsLimit: number | 'unlimited';
  remainingCatalogs: number;
  message: string;
}

type GenerationMethod = 'auto' | 'dynamic' | 'classic';

const TemplateSelection = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  
  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMethod, setGenerationMethod] = useState<GenerationMethod>('auto');
  
  // Estados de límites
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  
  // Estados de UX
  const [userIndustry, setUserIndustry] = useState<IndustryType | undefined>();
  const [userPlan, setUserPlan] = useState<'basic' | 'premium'>('basic');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Estados del sistema de preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    initializeComponent();
  }, [user]);

  const initializeComponent = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 1. Cargar productos seleccionados desde localStorage
      await loadSelectedProducts();
      
      // 2. Detectar industria del usuario (si es posible)
      await detectUserIndustry();
      
      // 3. Verificar plan del usuario
      await loadUserPlan();
      
      // 4. Verificar límites de catálogos
      await loadCatalogLimits();
      
    } catch (error) {
      console.error('Error initializing template selection:', error);
      toast({
        title: "Error de inicialización",
        description: "Hubo un problema cargando la información",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedProducts = async () => {
    const productsData = localStorage.getItem('selectedProductsData');
    const productsIds = localStorage.getItem('selectedProducts');
    
    if (productsData) {
      const products = JSON.parse(productsData);
      setSelectedProducts(products);
      console.log('✅ Productos cargados:', products.length);
    } else if (productsIds) {
      const ids = JSON.parse(productsIds);
      console.log('⚠️ Solo IDs disponibles, redirigiendo a productos');
      toast({
        title: "Datos incompletos",
        description: "Regresa a seleccionar productos",
        variant: "destructive",
      });
      navigate('/products');
      return;
    } else {
      console.log('❌ No hay productos seleccionados');
      toast({
        title: "No hay productos seleccionados",
        description: "Selecciona productos primero",
        variant: "destructive",
      });
      navigate('/products');
      return;
    }
  };

  const detectUserIndustry = async () => {
    if (selectedProducts.length > 0) {
      const categories = selectedProducts
        .map(p => p.category?.toLowerCase())
        .filter(Boolean);
      
      if (categories.some(c => c?.includes('joyeria') || c?.includes('jewelry') || c?.includes('anillo') || c?.includes('collar'))) {
        setUserIndustry('joyeria');
      } else if (categories.some(c => c?.includes('ropa') || c?.includes('clothing') || c?.includes('vestido') || c?.includes('blusa'))) {
        setUserIndustry('moda');
      } else if (categories.some(c => c?.includes('electronico') || c?.includes('electronic') || c?.includes('smartphone') || c?.includes('laptop'))) {
        setUserIndustry('electronica');
      } else if (categories.some(c => c?.includes('ferreteria') || c?.includes('hardware') || c?.includes('herramienta') || c?.includes('tool'))) {
        setUserIndustry('ferreteria');
      } else if (categories.some(c => c?.includes('flor') || c?.includes('flower') || c?.includes('planta') || c?.includes('plant'))) {
        setUserIndustry('floreria');
      } else if (categories.some(c => c?.includes('cosmetico') || c?.includes('cosmetic') || c?.includes('maquillaje') || c?.includes('makeup'))) {
        setUserIndustry('cosmeticos');
      } else if (categories.some(c => c?.includes('decoracion') || c?.includes('decoration') || c?.includes('hogar') || c?.includes('home'))) {
        setUserIndustry('decoracion');
      } else if (categories.some(c => c?.includes('mueble') || c?.includes('furniture') || c?.includes('silla') || c?.includes('mesa'))) {
        setUserIndustry('muebles');
      }
    }
    
    if (!userIndustry && businessInfo?.business_name) {
      const businessName = businessInfo.business_name.toLowerCase();
      
      if (businessName.includes('joyeria') || businessName.includes('jewelry')) {
        setUserIndustry('joyeria');
      } else if (businessName.includes('moda') || businessName.includes('fashion') || businessName.includes('boutique')) {
        setUserIndustry('moda');
      } else if (businessName.includes('electronico') || businessName.includes('tech') || businessName.includes('digital')) {
        setUserIndustry('electronica');
      } else if (businessName.includes('ferreteria') || businessName.includes('hardware') || businessName.includes('construccion')) {
        setUserIndustry('ferreteria');
      } else if (businessName.includes('flor') || businessName.includes('flower') || businessName.includes('jardin')) {
        setUserIndustry('floreria');
      } else if (businessName.includes('beauty') || businessName.includes('belleza') || businessName.includes('cosmeticos')) {
        setUserIndustry('cosmeticos');
      } else if (businessName.includes('decoracion') || businessName.includes('hogar') || businessName.includes('home')) {
        setUserIndustry('decoracion');
      } else if (businessName.includes('muebles') || businessName.includes('furniture')) {
        setUserIndustry('muebles');
      }
    }
  };

  const loadUserPlan = async () => {
    if (!user) return;
    
    try {
      const { data: subscription } = await (window as any).supabase
        .from('subscriptions')
        .select(`
          status,
          credit_packages (
            package_type,
            name,
            price_usd
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();
      
      if (subscription?.credit_packages) {
        const packageData = subscription.credit_packages;
        const isPremium = packageData.package_type === 'monthly_plan' && packageData.price_usd >= 1250;
        setUserPlan(isPremium ? 'premium' : 'basic');
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
    }
  };

  const loadCatalogLimits = async () => {
    if (!user) return;
    
    try {
      const limitsData = await checkLimits(user.id);
      setLimits(limitsData);
    } catch (error) {
      console.error('Error loading catalog limits:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    console.log('🎨 Template seleccionado:', templateId);
  };

  // 🔍 NUEVA FUNCIÓN: GENERAR PREVIEW HTML
  const handlePreviewCatalog = async () => {
    if (!selectedTemplate || !user || !businessInfo) {
      toast({
        title: "Información faltante",
        description: "Selecciona un template y asegúrate de tener la información del negocio completa",
        variant: "destructive",
      });
      return;
    }

    setPreviewLoading(true);
    
    try {
      console.log('🔍 Generando preview HTML...');
      
      // Preparar datos del negocio
      const businessData = {
        business_name: businessInfo.business_name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        website: businessInfo.website,
        address: businessInfo.address
      };
      
      // Obtener template
      const template = getTemplateById(selectedTemplate);
      if (!template) {
        throw new Error(`Template ${selectedTemplate} no encontrado`);
      }
      
      // Generar HTML sin crear PDF
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        selectedProducts,
        businessData,
        template
      );
      
      setPreviewHTML(htmlContent);
      setShowPreview(true);
      
      console.log('✅ Preview HTML generado:', htmlContent.length, 'caracteres');
      
    } catch (error) {
      console.error('❌ Error generando preview:', error);
      toast({
        title: "Error generando preview",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // FUNCIÓN DE GENERACIÓN PDF (mejorada)
  const handleGenerateCatalog = async () => {
    if (!selectedTemplate || !user || !businessInfo) {
      toast({
        title: "Información faltante",
        description: "Selecciona un template y asegúrate de tener la información del negocio completa",
        variant: "destructive",
      });
      return;
    }

    if (!limits?.canGenerate) {
      toast({
        title: "Límite alcanzado",
        description: limits?.message || "No puedes generar más catálogos",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    
    try {
      console.log('🚀 Iniciando generación con sistema híbrido...');
      
      // Función de progreso
      const onProgress = (progress: number) => {
        setGenerationProgress(progress);
        console.log(`📊 Progreso: ${progress}%`);
      };
      
      // Preparar datos del negocio
      const businessData = {
        business_name: businessInfo.business_name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        website: businessInfo.website,
        address: businessInfo.address
      };
      
      let result;
      
      // Seleccionar método de generación
      switch (generationMethod) {
        case 'dynamic':
          console.log('🚀 Usando Dynamic Engine forzado');
          result = await generateDynamicCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress
          );
          break;
          
        case 'classic':
          console.log('🎨 Usando Classic Engine forzado');
          result = await generateClassicCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress
          );
          break;
          
        case 'auto':
        default:
          console.log('🧠 Usando selección automática híbrida');
          result = await generateCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            {
              useDynamicEngine: true, // Preferir dinámico
              showProgress: true,
              onProgress
            }
          );
          break;
      }
      
      if (result.success) {
        // Toast de éxito con información detallada
        const methodEmoji = result.generationMethod === 'dynamic' ? '🚀' : '🎨';
        const methodName = result.generationMethod === 'dynamic' ? 'Dynamic Engine' : 'Classic Engine';
        
        toast({
          title: `${methodEmoji} ¡Catálogo generado exitosamente!`,
          description: `${result.message} (${result.stats?.generationTime}ms con ${methodName})`,
        });

        console.log('📊 Estadísticas de generación:', {
          productos: result.stats?.totalProducts,
          páginas: result.stats?.totalPages,
          método: result.generationMethod,
          tiempo: result.stats?.generationTime
        });

        // Limpiar localStorage
        localStorage.removeItem('selectedTemplate');
        localStorage.removeItem('selectedProducts');
        localStorage.removeItem('selectedProductsData');
        
        // Actualizar límites
        await loadCatalogLimits();
        
        // Cerrar preview si está abierto
        setShowPreview(false);
        
        // Redirigir a catálogos
        navigate('/catalogs');
        
      } else {
        // Manejar diferentes tipos de errores
        const errorMessages = {
          'LIMIT_EXCEEDED': 'Has alcanzado tu límite de catálogos',
          'PREMIUM_REQUIRED': 'Este template requiere plan Premium',
          'TEMPLATE_NOT_FOUND': 'Template no encontrado',
          'GENERATION_ERROR': 'Error durante la generación',
          'DATABASE_ERROR': 'Error guardando en base de datos',
          'CLASSIC_ENGINE_ERROR': 'Error en engine clásico'
        };
        
        const userMessage = errorMessages[result.error as keyof typeof errorMessages] || result.message || 'Error desconocido';
        
        toast({
          title: "Error al generar catálogo",
          description: userMessage,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Error generando catálogo:', error);
      toast({
        title: "Error inesperado",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Obtener información del template dinámico
  const getTemplateInfo = (templateId: string) => {
    const dynamicTemplate = getDynamicTemplate(templateId);
    
    if (dynamicTemplate) {
      return {
        supportsDynamic: dynamicTemplate.supportsDynamic,
        productsPerPage: dynamicTemplate.productsPerPage,
        recommendedFor: dynamicTemplate.recommendedFor,
        layout: `${dynamicTemplate.layout.columns}×${dynamicTemplate.layout.rows}`,
        spacing: dynamicTemplate.layout.spacing,
        isPremium: dynamicTemplate.isPremium
      };
    }
    
    return {
      supportsDynamic: false,
      productsPerPage: 6,
      recommendedFor: 'catálogos estándar',
      layout: '3×2',
      spacing: 'normal',
      isPremium: false
    };
  };

  // Recomendar método de generación basado en cantidad de productos
  const getRecommendedMethod = (): GenerationMethod => {
    const productCount = selectedProducts.length;
    
    if (productCount <= 5) return 'dynamic';      // Mejor calidad para pocos productos
    if (productCount >= 50) return 'dynamic';     // Mejor performance para muchos productos
    if (productCount >= 20) return 'dynamic';     // Chunking inteligente
    
    return 'auto'; // Híbrido para casos medios
  };

  // Estados de carga
  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando sistema de templates...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  // Header actions
  const actions = (
    <div className="flex items-center gap-3">
      <div className="hidden md:block">
        <Badge variant="outline" className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {selectedProducts.length} productos
        </Badge>
      </div>
      
      {limits && (
        <div className="hidden lg:block text-sm text-gray-600">
          {limits.catalogsLimit === 'unlimited' 
            ? 'Catálogos ilimitados' 
            : `${limits.remainingCatalogs}/${limits.catalogsLimit} restantes`
          }
        </div>
      )}
      
      {/* Selector de método de generación */}
      {showAdvancedOptions && selectedTemplate && (
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-gray-500">Método:</span>
          <select 
            value={generationMethod}
            onChange={(e) => setGenerationMethod(e.target.value as GenerationMethod)}
            className="text-xs border rounded px-2 py-1"
            disabled={generating || previewLoading}
          >
            <option value="auto">Auto (Recomendado)</option>
            <option value="dynamic">🚀 Dynamic Engine</option>
            <option value="classic">🎨 Classic Engine</option>
          </select>
        </div>
      )}
      
      {/* NUEVO: Botón de Preview */}
      {selectedTemplate && (
        <Button 
          onClick={handlePreviewCatalog}
          disabled={generating || previewLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {previewLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Preview
            </>
          )}
        </Button>
      )}
      
      <Button 
        onClick={handleGenerateCatalog}
        disabled={!selectedTemplate || generating || !limits?.canGenerate}
        className="flex items-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Palette className="h-4 w-4" />
            Generar Catálogo
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="space-y-6">
          {/* Header con información */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/products')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a Productos
                </Button>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900">
                Selecciona tu Template
                <Sparkles className="w-6 h-6 inline ml-2 text-purple-500" />
              </h1>
              <p className="text-gray-600">
                Elige el diseño perfecto para tu catálogo de {selectedProducts.length} productos
              </p>
            </div>
            
            {/* Mostrar info del plan en móvil */}
            <div className="sm:hidden w-full">
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {selectedProducts.length} productos seleccionados
                    </span>
                    {limits && (
                      <Badge variant="outline">
                        {limits.catalogsLimit === 'unlimited' 
                          ? 'Ilimitados' 
                          : `${limits.remainingCatalogs} restantes`
                        }
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alert de límites si es necesario */}
          {limits && !limits.canGenerate && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Límite alcanzado:</strong> {limits.message}
                <Button 
                  variant="link" 
                  className="h-auto p-0 ml-2 text-red-600"
                  onClick={() => navigate('/pricing')}
                >
                  Ver planes
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar durante generación */}
          {generating && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Generando catálogo...
                    </h4>
                    <p className="text-sm text-blue-700">
                      Método: {generationMethod === 'auto' ? 'Híbrido Automático' : 
                              generationMethod === 'dynamic' ? '🚀 Dynamic Engine' : 
                              '🎨 Classic Engine'}
                    </p>
                  </div>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <div className="flex justify-between text-xs text-blue-600 mt-1">
                  <span>{generationProgress}% completado</span>
                  <span>{selectedProducts.length} productos</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selector inteligente de templates */}
          <SmartTemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            userPlan={userPlan}
            userIndustry={userIndustry}
            productCount={selectedProducts.length}
          />

          {/* Información del template seleccionado */}
          {selectedTemplate && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">
                      Template seleccionado
                    </h4>
                    <p className="text-sm text-green-700">
                      {getTemplateInfo(selectedTemplate).recommendedFor} • {getTemplateInfo(selectedTemplate).productsPerPage} productos/página
                    </p>
                  </div>
                  
                  {/* Botón de configuración avanzada */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="text-green-700 hover:bg-green-100"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>

                {/* Opciones avanzadas */}
                {showAdvancedOptions && (
                  <div className="border-t border-green-300 pt-3 mt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-green-800">Método de Generación</label>
                        <select 
                          value={generationMethod}
                          onChange={(e) => setGenerationMethod(e.target.value as GenerationMethod)}
                          className="w-full mt-1 text-sm border border-green-300 rounded px-2 py-1"
                          disabled={generating || previewLoading}
                        >
                          <option value="auto">🧠 Auto (Recomendado: {getRecommendedMethod()})</option>
                          <option value="dynamic">🚀 Dynamic Engine</option>
                          <option value="classic">🎨 Classic Engine</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-green-800">Layout</label>
                        <div className="text-sm text-green-700 mt-1">
                          {getTemplateInfo(selectedTemplate).layout} • {getTemplateInfo(selectedTemplate).spacing}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-green-800">Soporte</label>
                        <div className="text-sm text-green-700 mt-1">
                          {getTemplateInfo(selectedTemplate).supportsDynamic ? (
                            <span className="flex items-center gap-1">
                              <Rocket className="w-3 h-3" />
                              Dinámico
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Clásico
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                {limits?.canGenerate && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-green-700">
                      Listo para generar {selectedProducts.length} productos
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Botón Preview */}
                      <Button 
                        onClick={handlePreviewCatalog}
                        disabled={generating || previewLoading}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        {previewLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Preview HTML
                      </Button>
                      
                      {/* Botón Generar */}
                      <Button 
                        onClick={handleGenerateCatalog}
                        disabled={generating || previewLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Generando...
                          </>
                        ) : (
                          <>
                            {generationMethod === 'dynamic' ? (
                              <Rocket className="w-4 h-4 mr-2" />
                            ) : generationMethod === 'classic' ? (
                              <Palette className="w-4 h-4 mr-2" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            Generar PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Modal de Preview */}
        {showPreview && (
          <CatalogPreview
            htmlContent={previewHTML}
            templateId={selectedTemplate || ''}
            productCount={selectedProducts.length}
            onGeneratePDF={handleGenerateCatalog}
            onClose={() => setShowPreview(false)}
            loading={generating}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TemplateSelection;
