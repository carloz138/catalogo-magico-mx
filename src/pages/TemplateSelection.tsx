// src/pages/TemplateSelection.tsx
// TEMPLATE SELECTION ACTUALIZADO - INTEGRA SISTEMA SIN CORTES V2.0

import React, { useState, useEffect, useCallback } from 'react';
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
import { initializeOptimizedTemplates } from '@/lib/templates/audited-templates-v2';

// Importar nuevos sistemas integrados
import { SmartTemplateSelector } from '@/components/templates/SmartTemplateSelector';
import { CatalogPreview } from '@/components/catalog/CatalogPreview';
import { 
  generateCatalog, 
  generateDynamicCatalog,
  generateClassicCatalog,
  generatePuppeteerCatalog,
  checkLimits 
} from '@/lib/catalog/unified-generator';
import { getDynamicTemplate } from '@/lib/templates/dynamic-mapper';
import { getTemplateById } from '@/lib/templates/industry-templates';
import { TemplateGenerator } from '@/lib/templates/css-generator';
import { TemplateAuditSystem } from '@/lib/templates/template-audit-system';
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
  Eye,
  Shield,
  Star,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  custom_description?: string;
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  features?: string[];
  tags?: string[];
  image_url: string;
  original_image_url?: string;
  processed_image_url?: string;
  hd_image_url?: string;
  video_url?: string;
  social_media_urls?: any;
  processing_status?: string;
  ai_description?: string;
  ai_tags?: string[];
  has_variants?: boolean;
  variant_count?: number;
  created_at?: string;
  updated_at?: string;
  specifications?: string;
}

interface UsageLimits {
  canGenerate: boolean;
  catalogsUsed: number;
  catalogsLimit: number | 'unlimited';
  remainingCatalogs: number;
  message: string;
}

type GenerationMethod = 'auto' | 'puppeteer' | 'dynamic' | 'classic';

interface TemplateQuality {
  score: number;
  status: 'perfect' | 'good' | 'needs_fix' | 'broken';
  issues: string[];
  recommendations: string[];
}

const TemplateSelection = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  
  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [catalogTitle, setCatalogTitle] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMethod, setGenerationMethod] = useState<GenerationMethod>('auto');
  
  // Estados de límites y calidad
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [templateQuality, setTemplateQuality] = useState<TemplateQuality | null>(null);
  
  // Estados de UX
  const [userIndustry, setUserIndustry] = useState<IndustryType | undefined>();
  const [userPlan, setUserPlan] = useState<'basic' | 'premium'>('basic');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoFix, setAutoFix] = useState(true);
  
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

      await initializeOptimizedTemplates();
      
      await Promise.all([
        loadSelectedProducts(),
        detectUserIndustry(),
        loadUserPlan(),
        loadCatalogLimits()
      ]);
      
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
    const catalogTitleFromStorage = localStorage.getItem('catalogTitle');
    
    // Cargar título personalizado si existe
    if (catalogTitleFromStorage) {
      console.log('🔍 DEBUG - Título cargado del localStorage:', catalogTitleFromStorage);
      setCatalogTitle(catalogTitleFromStorage);
    } else {
      console.log('🔍 DEBUG - No hay título en localStorage');
    }
    
    if (productsData) {
      const products = JSON.parse(productsData);
      setSelectedProducts(products);
      console.log('Productos cargados:', products.length);
    } else if (productsIds) {
      const ids = JSON.parse(productsIds);
      console.log('Solo IDs disponibles, redirigiendo a productos');
      toast({
        title: "Datos incompletos",
        description: "Regresa a seleccionar productos",
        variant: "destructive",
      });
      navigate('/products');
      return;
    } else {
      console.log('No hay productos seleccionados');
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
      
      // Lógica de detección de industria mejorada
      const industryKeywords = {
        joyeria: ['joyeria', 'jewelry', 'anillo', 'collar', 'pulsera', 'oro', 'plata'],
        moda: ['ropa', 'clothing', 'vestido', 'blusa', 'pantalon', 'fashion'],
        electronica: ['electronico', 'electronic', 'smartphone', 'laptop', 'tech'],
        ferreteria: ['ferreteria', 'hardware', 'herramienta', 'tool', 'tornillo'],
        floreria: ['flor', 'flower', 'planta', 'plant', 'jardin', 'ramo'],
        cosmeticos: ['cosmetico', 'cosmetic', 'maquillaje', 'makeup', 'belleza'],
        decoracion: ['decoracion', 'decoration', 'hogar', 'home', 'mueble'],
        muebles: ['mueble', 'furniture', 'silla', 'mesa', 'sofa']
      };

      for (const [industry, keywords] of Object.entries(industryKeywords)) {
        if (categories.some(c => keywords.some(k => c?.includes(k)))) {
          setUserIndustry(industry as IndustryType);
          break;
        }
      }
    }
    
    // Detectar por nombre del negocio si no se detectó por productos
    if (!userIndustry && businessInfo?.business_name) {
      const businessName = businessInfo.business_name.toLowerCase();
      
      if (businessName.includes('joyeria') || businessName.includes('jewelry')) {
        setUserIndustry('joyeria');
      } else if (businessName.includes('moda') || businessName.includes('fashion')) {
        setUserIndustry('moda');
      } // ... más detecciones
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

  // NUEVA FUNCIÓN: Auditar template al seleccionarlo
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    setSelectedTemplate(templateId);
    setTemplateQuality(null);
    
    console.log('Template seleccionado:', templateId);
    
    // Auditar calidad del template
    try {
      const template = getTemplateById(templateId);
      if (template) {
        console.log('Auditando calidad del template...');
        const auditResult = await TemplateAuditSystem.auditSingleTemplate(template);
        
        setTemplateQuality({
          score: auditResult.qualityScore,
          status: auditResult.status,
          issues: auditResult.issues.map(i => i.description),
          recommendations: auditResult.recommendations
        });
        
        // Mostrar advertencia si hay problemas críticos
        if (auditResult.status === 'broken') {
          toast({
            title: "Template con problemas críticos",
            description: "Este template requiere corrección antes de usarse",
            variant: "destructive",
          });
        } else if (auditResult.status === 'needs_fix') {
          toast({
            title: "Template con problemas menores",
            description: `Calidad: ${auditResult.qualityScore}/100. Se aplicarán correcciones automáticas`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Error auditando template:', error);
    }
  }, []);

  // FUNCIÓN MEJORADA: Generar preview HTML
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
      console.log('Generando preview HTML mejorado...');
      
      const businessData = {
        business_name: businessInfo.business_name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        website: businessInfo.website,
        address: businessInfo.address,
        social_media: businessInfo.social_media,
        logo_url: businessInfo.logo_url,
        primary_color: businessInfo.primary_color,
        secondary_color: businessInfo.secondary_color
      };
      
      console.log('🔍 DEBUG - businessData PREVIEW enviado:', businessData);
      
      const template = getTemplateById(selectedTemplate);
      if (!template) {
        throw new Error(`Template ${selectedTemplate} no encontrado`);
      }
      
      // Generar HTML con nuevo sistema robusto
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        selectedProducts,
        businessData,
        template
      );
      
      setPreviewHTML(htmlContent);
      setShowPreview(true);
      
      console.log('Preview HTML generado:', htmlContent.length, 'caracteres');
      
    } catch (error) {
      console.error('Error generando preview:', error);
      toast({
        title: "Error generando preview",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // FUNCIÓN MEJORADA: Generar catálogo con nuevo sistema
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
      console.log('Iniciando generación con sistema v2.0...');
      
      const onProgress = (progress: number) => {
        setGenerationProgress(progress);
        console.log(`Progreso: ${progress}%`);
      };
      
      const businessData = {
        business_name: businessInfo.business_name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        website: businessInfo.website,
        address: businessInfo.address,
        social_media: businessInfo.social_media,
        logo_url: businessInfo.logo_url,
        primary_color: businessInfo.primary_color,
        secondary_color: businessInfo.secondary_color
      };
      
      // Si no hay businessInfo, usar datos por defecto de CatifyPro
      if (!businessInfo || !businessInfo.business_name) {
        console.warn('⚠️ No hay business_info, usando datos por defecto de CatifyPro');
        businessData.business_name = "CatifyPro";
        businessData.phone = "Contact us for pricing";
        businessData.address = "Professional Catalog Service";
        businessData.social_media = { whatsapp: "+1-800-CATIFY" };
      }
      
      console.log('🔍 DEBUG - businessData FINAL enviado:', businessData);
      
      // Validar que social_media esté presente
      if (!businessData.social_media?.whatsapp) {
        console.warn('⚠️ WhatsApp no encontrado en businessData final');
      } else {
        console.log('✅ WhatsApp encontrado en businessData final:', businessData.social_media.whatsapp);
      }
      
      let result;
      
      // Seleccionar método de generación
      switch (generationMethod) {
        case 'puppeteer':
      console.log('🔍 DEBUG - Título desde TemplateSelection:', catalogTitle);
      console.log('Usando Puppeteer Service (mejor calidad)');
           result = await generatePuppeteerCatalog(
        selectedProducts,
        businessData,
        selectedTemplate,
        user.id,
        onProgress,
        catalogTitle
      );
          break;
          
        case 'dynamic':
          console.log('Usando Dynamic Engine');
          result = await generateDynamicCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress,
            catalogTitle
          );
          break;
          
        case 'classic':
          console.log('Usando Classic Engine');
          result = await generateClassicCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress,
            catalogTitle
          );
          break;
          
        case 'auto':
        default:
          console.log('Usando selección automática inteligente');
          result = await generateCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            {
              usePuppeteerService: true,
              useDynamicEngine: true,
              showProgress: true,
              onProgress,
              qualityCheck: true,
              autoFix: true,
              catalogTitle: catalogTitle // Use the custom title from state
            }
          );
          break;
      }
      
      if (result.success) {
        // Toast de éxito mejorado
        const methodEmoji = {
          puppeteer: '🚀',
          dynamic: '⚡',
          classic: '🎨',
          hybrid: '🧠'
        }[result.generationMethod || 'auto'];
        
        const methodName = {
          puppeteer: 'Puppeteer Service',
          dynamic: 'Dynamic Engine', 
          classic: 'Classic Engine',
          hybrid: 'Hybrid System'
        }[result.generationMethod || 'auto'];
        
        toast({
          title: `${methodEmoji} ¡Catálogo generado exitosamente!`,
          description: `${result.message || 'Completado'} (${result.stats?.generationTime}ms con ${methodName})`,
        });

        // Mostrar advertencias si las hay
        if (result.warnings && result.warnings.length > 0) {
          toast({
            title: "Generación completada con advertencias",
            description: `${result.warnings.length} advertencia(s) detectada(s). Ver detalles en el dashboard.`,
            variant: "default",
          });
        }

        console.log('Estadísticas de generación:', {
          productos: result.stats?.totalProducts,
          páginas: result.stats?.totalPages,
          método: result.generationMethod,
          tiempo: result.stats?.generationTime,
          calidad: result.stats?.templateQuality
        });

        // Limpiar datos
        localStorage.removeItem('selectedTemplate');
        localStorage.removeItem('selectedProducts');
        localStorage.removeItem('selectedProductsData');
        
        await loadCatalogLimits();
        setShowPreview(false);
        navigate('/catalogs');
        
      } else {
        // Manejo de errores mejorado
        const errorMessages = {
          'LIMIT_EXCEEDED': 'Has alcanzado tu límite de catálogos',
          'PREMIUM_REQUIRED': 'Este template requiere plan Premium',
          'TEMPLATE_NOT_FOUND': 'Template no encontrado',
          'TEMPLATE_BROKEN': 'Template tiene errores críticos',
          'GENERATION_ERROR': 'Error durante la generación',
          'DATABASE_ERROR': 'Error guardando en base de datos',
          'CLASSIC_ENGINE_ERROR': 'Error en engine clásico',
          'INVALID_PRODUCT_DATA': 'Datos de productos inválidos'
        };
        
        const userMessage = errorMessages[result.error as keyof typeof errorMessages] || 
                           result.message || 
                           'Error desconocido';
        
        toast({
          title: "Error al generar catálogo",
          description: userMessage,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error generando catálogo:', error);
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

  // Obtener información del template mejorada
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

  // Recomendar método de generación inteligente
  const getRecommendedMethod = (): GenerationMethod => {
    const productCount = selectedProducts.length;
    const templateScore = templateQuality?.score || 100;
    
    // Si hay problemas críticos en el template, usar clásico
    if (templateScore < 60) return 'classic';
    
    // Para alta calidad y volúmenes grandes, Puppeteer
    if (productCount > 50 || templateScore >= 90) return 'puppeteer';
    
    // Para volúmenes medianos, dinámico
    if (productCount >= 10 && productCount <= 50) return 'dynamic';
    
    return 'auto'; // Híbrido para casos generales
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando sistema de templates v2.0...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  // Header actions mejoradas
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
      
      {/* Selector de método mejorado */}
      {showAdvancedOptions && selectedTemplate && (
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-gray-500">Método:</span>
          <select 
            value={generationMethod}
            onChange={(e) => setGenerationMethod(e.target.value as GenerationMethod)}
            className="text-xs border rounded px-2 py-1"
            disabled={generating || previewLoading}
          >
            <option value="auto">Auto (Recomendado: {getRecommendedMethod()})</option>
            <option value="puppeteer">🚀 Puppeteer (Mejor calidad)</option>
            <option value="dynamic">⚡ Dynamic (Rápido)</option>
            <option value="classic">🎨 Classic (Compatible)</option>
          </select>
        </div>
      )}
      
      {/* Botón de Preview mejorado */}
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
              Preview v2.0
            </>
          )}
        </Button>
      )}
      
      <Button 
        onClick={handleGenerateCatalog}
        disabled={!selectedTemplate || generating || !limits?.canGenerate || templateQuality?.status === 'broken'}
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
          {/* Header con información mejorada */}
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
                <Badge variant="secondary" className="text-xs">
                  Sistema v2.0 - Sin Cortes
                </Badge>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Selecciona tu Template
                <Shield className="w-5 h-5 text-green-500" />
              </h1>
              <p className="text-gray-600">
                Elige el diseño perfecto para tu catálogo de {selectedProducts.length} productos
              </p>
            </div>
            
            {/* Info del plan en móvil */}
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

          {/* Alert de límites */}
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

          {/* Progress Bar mejorada */}
          {generating && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Generando catálogo con sistema v2.0...
                    </h4>
                    <p className="text-sm text-blue-700">
                      Método: {generationMethod === 'auto' ? 'Selección Automática' : 
                              generationMethod === 'puppeteer' ? '🚀 Puppeteer Service' :
                              generationMethod === 'dynamic' ? '⚡ Dynamic Engine' : 
                              '🎨 Classic Engine'} | 
                      Auto-corrección: {autoFix ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <div className="flex justify-between text-xs text-blue-600 mt-1">
                  <span>{generationProgress}% completado</span>
                  <span>{selectedProducts.length} productos | 0% cortes garantizado</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selector de templates */}
          <SmartTemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            userPlan={userPlan}
            userIndustry={userIndustry}
            productCount={selectedProducts.length}
          />

          {/* Información del template seleccionado mejorada */}
          {selectedTemplate && (
            <Card className={`border-2 ${
              templateQuality?.status === 'broken' ? 'border-red-200 bg-red-50' :
              templateQuality?.status === 'needs_fix' ? 'border-yellow-200 bg-yellow-50' :
              'border-green-200 bg-green-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {templateQuality?.status === 'broken' ? (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : templateQuality?.status === 'needs_fix' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      templateQuality?.status === 'broken' ? 'text-red-900' :
                      templateQuality?.status === 'needs_fix' ? 'text-yellow-900' :
                      'text-green-900'
                    }`}>
                      Template seleccionado
                      {templateQuality && (
                        <Badge variant="outline" className="ml-2">
                          {templateQuality.score}/100
                        </Badge>
                      )}
                    </h4>
                    <p className={`text-sm ${
                      templateQuality?.status === 'broken' ? 'text-red-700' :
                      templateQuality?.status === 'needs_fix' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {getTemplateInfo(selectedTemplate).recommendedFor} • 
                      {getTemplateInfo(selectedTemplate).productsPerPage} productos/página
                      {templateQuality && templateQuality.status === 'broken' && (
                        <span className="font-semibold"> • REQUIERE CORRECCIÓN</span>
                      )}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className={`${
                      templateQuality?.status === 'broken' ? 'text-red-700 hover:bg-red-100' :
                      templateQuality?.status === 'needs_fix' ? 'text-yellow-700 hover:bg-yellow-100' :
                      'text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mostrar issues si los hay */}
                {templateQuality && templateQuality.issues.length > 0 && (
                  <div className="mb-3 p-3 bg-white rounded border">
                    <h5 className="text-sm font-medium mb-2">Issues detectados:</h5>
                    <ul className="text-xs space-y-1">
                      {templateQuality.issues.slice(0, 3).map((issue, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-gray-400">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                      {templateQuality.issues.length > 3 && (
                        <li className="text-gray-500 italic">
                          +{templateQuality.issues.length - 3} más...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Opciones avanzadas */}
                {showAdvancedOptions && (
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-800">Método de Generación</label>
                        <select 
                          value={generationMethod}
                          onChange={(e) => setGenerationMethod(e.target.value as GenerationMethod)}
                          className="w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                          disabled={generating || previewLoading}
                        >
                          <option value="auto">🧠 Auto (Recomendado: {getRecommendedMethod()})</option>
                          <option value="puppeteer">🚀 Puppeteer (Mejor calidad)</option>
                          <option value="dynamic">⚡ Dynamic (Rápido)</option>
                          <option value="classic">🎨 Classic (Compatible)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-800">Auto-corrección</label>
                        <div className="mt-1">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={autoFix}
                              onChange={(e) => setAutoFix(e.target.checked)}
                              className="mr-2"
                              disabled={generating || previewLoading}
                            />
                            Corregir automáticamente
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-800">Layout</label>
                        <div className="text-sm text-gray-700 mt-1">
                          {getTemplateInfo(selectedTemplate).layout} • {getTemplateInfo(selectedTemplate).spacing}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-800">Compatibilidad</label>
                        <div className="text-sm text-gray-700 mt-1">
                          {getTemplateInfo(selectedTemplate).supportsDynamic ? (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              Avanzado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-blue-500" />
                              Estándar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                {limits?.canGenerate && templateQuality?.status !== 'broken' && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Listo para generar {selectedProducts.length} productos
                      {templateQuality && autoFix && templateQuality.status === 'needs_fix' && (
                        <span className="text-blue-600"> • Con auto-corrección</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handlePreviewCatalog}
                        disabled={generating || previewLoading}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        {previewLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Preview
                      </Button>
                      
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
                            {generationMethod === 'puppeteer' ? (
                              <Rocket className="w-4 h-4 mr-2" />
                            ) : generationMethod === 'dynamic' ? (
                              <Zap className="w-4 h-4 mr-2" />
                            ) : generationMethod === 'classic' ? (
                              <Palette className="w-4 h-4 mr-2" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Generar PDF v2.0
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
