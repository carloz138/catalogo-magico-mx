// src/components/enhanced/TemplateSelectionEnhanced.tsx
// 🎯 VERSIÓN ACTUALIZADA CON PRODUCTOS POR PÁGINA DINÁMICOS

import React, { useState, useEffect } from 'react';
import '@/styles/template-selection-mobile.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { supabase } from '@/integrations/supabase/client';
import { isPremiumPlan, getPlanLevel, getPlanPermissions } from '@/lib/utils/subscription-helpers';
import { initializeOptimizedTemplates } from '@/lib/templates/audited-templates-v2';

// ✅ SOLO NUESTRO SISTEMA NUEVO
import { SmartTemplateSelector } from '@/components/templates/SmartTemplateSelector';
import { generateCatalog, checkLimits } from '@/lib/catalog/unified-generator';
import { IndustryType } from '@/lib/templates/industry-templates';
import { BackgroundSelector } from './BackgroundSelector';

// 🆕 IMPORTAR SELECTOR DE PRODUCTOS POR PÁGINA
import { ProductsPerPageSelector } from '@/components/templates/ProductsPerPageSelector';

import { 
  ArrowLeft,
  ArrowRight,
  Palette,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Package,
  Crown,
  Settings,
  Grid3X3,
  Zap
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_quantity?: number;
  image_url: string;
  sku?: string;
  category?: string;
  specifications?: string;
  // 🎯 CAMPOS PARA URLs OPTIMIZADAS
  original_image_url?: string;
  catalog_image_url?: string;
  thumbnail_image_url?: string;
  luxury_image_url?: string;
  print_image_url?: string;
  processed_image_url?: string;
  hd_image_url?: string;
}

interface UsageLimits {
  canGenerate: boolean;
  catalogsUsed: number;
  catalogsLimit: number | 'unlimited';
  remainingCatalogs: number;
  message: string;
}

interface LocationState {
  products?: any[];
  businessInfo?: any;
  skipProcessing?: boolean;
}

interface SubscriptionData {
  status: string;
  credit_packages: {
    package_type: string;
    name: string;
    price_usd: number;
  };
}

const TemplateSelectionEnhanced = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Helper functions
  const hasBackgroundRemoved = (product: Product): boolean => {
    return !!(product.processed_image_url && product.processed_image_url !== product.original_image_url);
  };
  
  const getCatalogImageUrl = (product: Product, preferNoBackground: boolean = false): string => {
    console.log(`🔍 SELECCIÓN DE IMAGEN para "${product.name}":`, {
      preferNoBackground,
      backgroundPreference_actual: backgroundPreference,
      tiene_processed: !!product.processed_image_url,
      tiene_catalog: !!product.catalog_image_url,
      decision: preferNoBackground && product.processed_image_url ? 'USAR SIN FONDO' : 'USAR CON FONDO'
    });
    
    if (preferNoBackground && product.processed_image_url) {
      console.log(`✅ USANDO IMAGEN SIN FONDO para "${product.name}": ${product.processed_image_url}`);
      return product.processed_image_url;
    }
    
    const finalUrl = product.catalog_image_url || 
           product.processed_image_url || 
           product.hd_image_url || 
           product.image_url || 
           product.original_image_url;
    
    console.log(`📸 USANDO IMAGEN CON FONDO para "${product.name}": ${finalUrl?.substring(0, 60)}...`);
    return finalUrl;
  };

  const analyzeBackgroundStatus = (products: Product[]) => {
    const withoutBackground = products.filter(p => hasBackgroundRemoved(p)).length;
    const withBackground = products.length - withoutBackground;
    
    return {
      total: products.length,
      withBackground,
      withoutBackground,
      hasNoBackgroundOptions: withoutBackground > 0,
      allHaveNoBackground: withoutBackground === products.length,
      mixed: withBackground > 0 && withoutBackground > 0
    };
  };
  
  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogTitle, setCatalogTitle] = useState(''); 
  
  // 🆕 ESTADO PARA PRODUCTOS POR PÁGINA
  const [productsPerPage, setProductsPerPage] = useState<4 | 6 | 9>(6);
  
  // Estado para control de precios de mayoreo
  const [showWholesalePrices, setShowWholesalePrices] = useState(true);
  
  // Estados de límites
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  
  // Estados de UX
  const [userIndustry, setUserIndustry] = useState<IndustryType | undefined>();
  const [userPlan, setUserPlan] = useState<'basic' | 'premium'>('basic');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [backgroundPreference, setBackgroundPreference] = useState<'with' | 'without'>('without');
  const [backgroundAnalysis, setBackgroundAnalysis] = useState<any>(null);

  const state = location.state as LocationState;

  useEffect(() => {
    initializeComponent();
  }, [user]);

  useEffect(() => {
    console.log('🔥 useEffect ejecutado - backgroundPreference cambió:', {
      backgroundPreference,
      selectedProductsLength: selectedProducts.length,
      backgroundAnalysisExists: !!backgroundAnalysis,
      timestamp: new Date().toISOString()
    });
    
    if (selectedProducts.length > 0 && backgroundAnalysis) {
      console.log('🔄 RECALCULANDO URLs por cambio de preferencia:', {
        nuevaPreferencia: backgroundPreference,
        totalProductos: selectedProducts.length,
        backgroundAnalysis,
        timestamp: new Date().toISOString()
      });
      
      const preferNoBackground = backgroundPreference === 'without';
      
      const updatedProducts = selectedProducts.map(product => {
        const optimizedImageUrl = getCatalogImageUrl(product, preferNoBackground);
        
        console.log(`🔄 RECALCULANDO "${product.name}":`, {
          preferencia: backgroundPreference,
          preferNoBackground,
          urlAnterior: product.image_url?.substring(0, 60) + '...',
          urlNueva: optimizedImageUrl?.substring(0, 60) + '...',
          cambio: product.image_url !== optimizedImageUrl ? 'SÍ' : 'NO'
        });
        
        return {
          ...product,
          image_url: optimizedImageUrl
        };
      });
      
      setSelectedProducts(updatedProducts);
    }
  }, [backgroundPreference]);

  const initializeComponent = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔍 TemplateSelectionEnhanced montado');

      await initializeOptimizedTemplates();
      
      await loadSelectedProducts();
      await detectUserIndustry();
      await loadUserPlan();
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
    let productsToUse: Product[] = [];
    
    try {
      const storedProducts = localStorage.getItem('selectedProductsData');
      if (storedProducts) {
        productsToUse = JSON.parse(storedProducts);
        console.log('✅ Productos encontrados en localStorage:', productsToUse.length);
      }
      
      const catalogTitleFromStorage = localStorage.getItem('catalogTitle');
      if (catalogTitleFromStorage) {
        console.log('🔍 DEBUG - Título cargado del localStorage:', catalogTitleFromStorage);
        setCatalogTitle(catalogTitleFromStorage);
      }
    } catch (error) {
      console.error('Error leyendo localStorage:', error);
    }
    
    if (productsToUse.length === 0 && state?.products && state.products.length > 0) {
      productsToUse = state.products;
      console.log('✅ Productos encontrados en router state:', productsToUse.length);
    }
    
    if (productsToUse.length > 0) {
      
      const withoutBackground = productsToUse.filter(p => p.processed_image_url && p.processed_image_url !== p.original_image_url).length;
      const withBackground = productsToUse.length - withoutBackground;
      const analysis = {
        total: productsToUse.length,
        withBackground,
        withoutBackground,
        hasNoBackgroundOptions: withoutBackground > 0,
        allHaveNoBackground: withoutBackground === productsToUse.length,
        mixed: withBackground > 0 && withoutBackground > 0
      };
      setBackgroundAnalysis(analysis);
      
      console.log('🔍 ANÁLISIS DE FONDOS:', analysis);
      
      // 🆕 SUGERIR PRODUCTOS POR PÁGINA BASADO EN CANTIDAD
      if (productsToUse.length <= 12) {
        setProductsPerPage(4); // Pocos productos, usar layout grande
        console.log('🎯 Sugerencia automática: 4 productos/página (pocos productos)');
      } else if (productsToUse.length >= 60) {
        setProductsPerPage(9); // Muchos productos, usar layout compacto
        console.log('🎯 Sugerencia automática: 9 productos/página (muchos productos)');
      } else {
        setProductsPerPage(6); // Cantidad media, usar layout estándar
        console.log('🎯 Sugerencia automática: 6 productos/página (cantidad estándar)');
      }
      
      const productsWithOptimizedUrls = productsToUse.map(product => {
        const preferNoBackground = backgroundPreference === 'without';
        const optimizedImageUrl = getCatalogImageUrl(product, preferNoBackground);
        
        return {
          ...product,
          image_url: optimizedImageUrl
        };
      });
      
      const optimizedCount = productsWithOptimizedUrls.filter(p => p.catalog_image_url).length;
      
      setSelectedProducts(productsWithOptimizedUrls);
      console.log('✅ Productos cargados correctamente:', {
        total: productsWithOptimizedUrls.length,
        conVersionOptimizada: optimizedCount,
        productsPerPageSugerido: productsToUse.length <= 12 ? 4 : productsToUse.length >= 60 ? 9 : 6
      });
      
    } else {
      console.log('❌ No hay productos, redirigiendo...');
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
    
    if (!userIndustry && businessInfo?.business_name) {
      const businessName = businessInfo.business_name.toLowerCase();
      
      if (businessName.includes('joyeria') || businessName.includes('jewelry')) {
        setUserIndustry('joyeria');
      } else if (businessName.includes('moda') || businessName.includes('fashion')) {
        setUserIndustry('moda');
      }
    }
  };

  // 🚀 FUNCIÓN loadUserPlan ACTUALIZADA
  const loadUserPlan = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Verificando plan de usuario...');
      
      const { data: subscription, error } = await supabase
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

      if (error) {
        console.error('Error loading user plan:', error);
        setUserPlan('basic');
        return;
      }

      if (subscription?.credit_packages) {
        const packageData = subscription.credit_packages;
        setSubscriptionData(subscription as SubscriptionData);
        
        const isPremium = isPremiumPlan(packageData);
        const planLevel = getPlanLevel(packageData);
        const permissions = getPlanPermissions(packageData);
        
        setUserPlan(isPremium ? 'premium' : 'basic');
        
        console.log('✅ Plan determinado:', {
          package_type: packageData.package_type,
          price_usd: packageData.price_usd,
          name: packageData.name,
          planLevel,
          access: isPremium ? 'premium' : 'basic',
          permissions
        });
      } else {
        setUserPlan('basic');
        console.log('📝 Sin suscripción activa - Plan básico');
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      setUserPlan('basic');
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

  // 🆕 FUNCIÓN: Manejar cambio de productos por página
  const handleProductsPerPageChange = (count: 4 | 6 | 9) => {
    setProductsPerPage(count);
    console.log(`📋 Productos por página cambiado a: ${count}`);
    
    const pages = Math.ceil(selectedProducts.length / count);
    const layoutName = count === 4 ? 'Cards Grandes' : count === 6 ? 'Balanceado' : 'Compacto';
    
    toast({
      title: `Layout actualizado: ${layoutName}`,
      description: `${count} productos/página = ${pages} página${pages !== 1 ? 's' : ''} totales`,
    });
  };

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
    
    try {
      console.log(`🚀 Iniciando generación con sistema mejorado (${productsPerPage}/página)...`);
      
      console.log('🔍 PRODUCTOS ANTES DE ENVIAR AL GENERADOR:', {
        backgroundPreference,
        productsPerPage,
        totalProductos: selectedProducts.length,
        expectedPages: Math.ceil(selectedProducts.length / productsPerPage),
        urls: selectedProducts.map(p => ({
          nombre: p.name,
          image_url_actual: p.image_url,
          tiene_processed: !!p.processed_image_url,
          processed_url: p.processed_image_url,
          catalog_url: p.catalog_image_url,
          es_catalog: p.image_url?.includes('_catalog.jpg'),
          es_processed: p.image_url === p.processed_image_url
        }))
      });
      
      // 🆕 USAR NUESTRO GENERADOR UNIFICADO CON PRODUCTOS POR PÁGINA
      const result = await generateCatalog(
        selectedProducts,
        {
          business_name: businessInfo.business_name,
          email: businessInfo.email,
          phone: businessInfo.phone,
          website: businessInfo.website,
          address: businessInfo.address,
          social_media: businessInfo.social_media
        },
        selectedTemplate,
        user.id,
        {
          catalogTitle: catalogTitle,
          qualityCheck: true,
          autoFix: true,
          productsPerPage: productsPerPage, // 🔧 PASAR PRODUCTOS POR PÁGINA
          showWholesalePrices: showWholesalePrices // 🆕 AGREGAR ESTA LÍNEA
        }
      );
      
      if (result.success) {
        const layoutEmoji = productsPerPage === 4 ? '🔳' : productsPerPage === 6 ? '📋' : '🗃️';
        const layoutName = productsPerPage === 4 ? 'Layout Grande' : productsPerPage === 6 ? 'Layout Balanceado' : 'Layout Compacto';
        
        toast({
          title: `${layoutEmoji} ¡Catálogo generado exitosamente!`,
          description: `${result.message} (${layoutName}: ${productsPerPage}/página, ${result.stats?.totalPages} páginas)`,
        });

        if (result.warnings && result.warnings.length > 0) {
          toast({
            title: "Generación completada con advertencias",
            description: `${result.warnings.length} advertencia(s) detectada(s) para layout ${productsPerPage}/página.`,
            variant: "default",
          });
        }

        console.log(`Estadísticas de generación (${productsPerPage}/página):`, {
          productos: result.stats?.totalProducts,
          páginas: result.stats?.totalPages,
          método: result.generationMethod,
          tiempo: result.stats?.generationTime,
          calidad: result.stats?.templateQuality,
          productsPerPage: result.stats?.productsPerPage,
          layoutOptimization: result.stats?.layoutOptimization
        });

        localStorage.removeItem('selectedTemplate');
        localStorage.removeItem('selectedProducts');
        localStorage.removeItem('selectedProductsData');
        localStorage.removeItem('catalogTitle');
        
        await loadCatalogLimits();
        navigate('/catalogs');
        
      } else {
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
      console.error('❌ Error generando catálogo:', error);
      toast({
        title: "Error inesperado",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

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

  const optimizedCount = selectedProducts.filter(p => p.catalog_image_url).length;

  // Header actions mejoradas
  const actions = (
    <div className="hidden lg:flex items-center gap-3">
      <div className="flex items-center gap-3 border-r pr-3">
        <Badge variant="outline" className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {selectedProducts.length} productos
        </Badge>
      </div>
      
      {/* 🆕 BADGE DE PRODUCTOS POR PÁGINA */}
      <div className="hidden lg:block">
        <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
          <Grid3X3 className="w-3 h-3" />
          {productsPerPage}/página
        </Badge>
      </div>
      
      {optimizedCount > 0 && (
        <div className="hidden lg:block">
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            ⚡ {optimizedCount} optimizadas
          </Badge>
        </div>
      )}
      
      <div className="hidden lg:block">
        <Badge 
          variant={userPlan === 'premium' ? 'default' : 'outline'} 
          className={`flex items-center gap-1 ${
            userPlan === 'premium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' : ''
          }`}
        >
          {userPlan === 'premium' ? <Crown className="w-3 h-3" /> : null}
          {subscriptionData?.credit_packages?.name || (userPlan === 'premium' ? 'Premium' : 'Básico')}
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
                  Sistema v2.0 - Layouts Dinámicos
                </Badge>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900">
                Selecciona tu Template
                <Sparkles className="w-6 h-6 inline ml-2 text-purple-500" />
              </h1>
              <p className="text-gray-600">
                Elige el diseño perfecto para tu catálogo de {selectedProducts.length} productos
                ({Math.ceil(selectedProducts.length / productsPerPage)} página{Math.ceil(selectedProducts.length / productsPerPage) !== 1 ? 's' : ''} con {productsPerPage}/página)
              </p>
              
            </div>
            
            {/* Mostrar info del plan en móvil */}
            <div className="lg:hidden w-full">
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      {selectedProducts.length} productos seleccionados
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-600 text-xs">
                        {productsPerPage}/pág
                      </Badge>
                      {optimizedCount > 0 && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          ⚡ {optimizedCount}
                        </Badge>
                      )}
                      <Badge 
                        variant={userPlan === 'premium' ? 'default' : 'outline'}
                        className={userPlan === 'premium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' : ''}
                      >
                        {userPlan === 'premium' ? <Crown className="w-3 h-3 mr-1" /> : null}
                        {subscriptionData?.credit_packages?.name || (userPlan === 'premium' ? 'Premium' : 'Básico')}
                      </Badge>
                      {limits && (
                        <Badge variant="outline">
                          {limits.catalogsLimit === 'unlimited' 
                            ? 'Ilimitados' 
                            : `${limits.remainingCatalogs} restantes`
                          }
                        </Badge>
                      )}
                    </div>
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

          {/* 🆕 SELECTOR DE PRODUCTOS POR PÁGINA */}
          <ProductsPerPageSelector
            selectedCount={productsPerPage}
            onCountChange={handleProductsPerPageChange}
            totalProducts={selectedProducts.length}
            disabled={generating}
          />

          {/* Selector de Precios */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  Opciones de Precios
                  <Badge variant="outline" className="text-xs">
                    {selectedProducts.filter(p => p.price_wholesale).length} con mayoreo
                  </Badge>
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Elige qué precios mostrar en tu catálogo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowWholesalePrices(true)}
                  disabled={generating}
                  className={`
                    relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                    ${showWholesalePrices 
                      ? 'border-purple-600 bg-purple-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${generating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${showWholesalePrices ? 'bg-purple-100' : 'bg-gray-100'}
                  `}>
                    <Package className={`w-5 h-5 ${showWholesalePrices ? 'text-purple-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="text-sm font-medium text-center">Mayoreo</div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    Con precios al por mayor
                  </div>
                  {showWholesalePrices && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowWholesalePrices(false)}
                  disabled={generating}
                  className={`
                    relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                    ${!showWholesalePrices 
                      ? 'border-purple-600 bg-purple-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${generating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${!showWholesalePrices ? 'bg-purple-100' : 'bg-gray-100'}
                  `}>
                    <Zap className={`w-5 h-5 ${!showWholesalePrices ? 'text-purple-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="text-sm font-medium text-center">Retail</div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    Solo precio al público
                  </div>
                  {!showWholesalePrices && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>


          {/* SELECTOR DE PREFERENCIA DE FONDO */}
          {(() => {
            console.log('🔍 EVALUANDO BACKGROUND SELECTOR:', {
              backgroundAnalysis: backgroundAnalysis,
              hasNoBackgroundOptions: backgroundAnalysis?.hasNoBackgroundOptions,
              conditionResult: !!(backgroundAnalysis && backgroundAnalysis.hasNoBackgroundOptions),
              timestamp: new Date().toISOString()
            });
            return backgroundAnalysis && backgroundAnalysis.hasNoBackgroundOptions ? (
              <BackgroundSelector
                products={selectedProducts}
                backgroundPreference={backgroundPreference}
                onPreferenceChange={(preference) => {
                  console.log('🔄 CAMBIO DE PREFERENCIA:', { 
                    anterior: backgroundPreference, 
                    nueva: preference,
                    timestamp: new Date().toISOString()
                  });
                  setBackgroundPreference(preference);
                }}
              />
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <p className="text-sm text-blue-600">
                  ℹ️ No hay productos con fondo removido disponibles. Todos los productos usarán sus imágenes originales.
                </p>
              </div>
            );
          })()}

          {/* Selector inteligente de templates */}
          <SmartTemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            userPlan={userPlan}
            userIndustry={userIndustry}
            productCount={selectedProducts.length}
          />

          {/* Template seleccionado */}
          {selectedTemplate && limits?.canGenerate && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">
                      ¡Template seleccionado!
                    </h4>
                    <p className="text-sm text-green-700">
                      Listo para generar tu catálogo con {selectedProducts.length} productos
                      ({Math.ceil(selectedProducts.length / productsPerPage)} páginas con {productsPerPage}/página)
                    </p>
                  </div>
                </div>
                
                {/* Campo para el título del catálogo */}
                <div className="space-y-2">
                  <Label htmlFor="catalogTitle" className="text-green-900 font-medium">
                    Nombre del catálogo (opcional)
                  </Label>
                  <Input
                    id="catalogTitle"
                    value={catalogTitle}
                    onChange={(e) => setCatalogTitle(e.target.value)}
                    placeholder="Ej: Catálogo Primavera 2024, Productos Nuevos..."
                    className="bg-white border-green-300 focus:border-green-500 text-base h-12"
                    disabled={generating}
                    style={{ fontSize: '16px' }}
                  />
                  <p className="text-xs text-green-600">
                    Si no especificas un nombre, se generará automáticamente
                  </p>
                </div>

                {/* 🆕 INFORMACIÓN DE LAYOUT */}
                <div className="bg-white p-3 rounded border border-green-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        Layout configurado:
                      </span>
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        {productsPerPage === 4 ? '2×2 Cards Grandes' : 
                         productsPerPage === 6 ? '3×2 Balanceado' : 
                         '3×3 Compacto'}
                      </Badge>
                    </div>
                    <div className="text-green-700">
                      {Math.ceil(selectedProducts.length / productsPerPage)} página{Math.ceil(selectedProducts.length / productsPerPage) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerateCatalog}
                    disabled={generating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Generar Catálogo'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 📱 BOTTOM ACTION BAR - SOLO MÓVIL/TABLET */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
          <div className="px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              {/* Generate Button - Ocupa más espacio */}
              <Button 
                onClick={handleGenerateCatalog}
                disabled={!selectedTemplate || generating || !limits?.canGenerate}
                className="flex-1 h-12 text-base font-medium bg-purple-600 hover:bg-purple-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Palette className="h-5 w-5 mr-2" />
                    Generar PDF
                  </>
                )}
              </Button>
            </div>

            {/* Info contextual compacta */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {selectedProducts.length} productos
              </span>
              <span className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                {productsPerPage}/página
              </span>
              {limits && (
                <span>
                  {limits.catalogsLimit === 'unlimited' 
                    ? '∞ catálogos' 
                    : `${limits.remainingCatalogs} rest.`
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Spacer para evitar que contenido quede detrás de bottom bar */}
        <div className="lg:hidden h-28" />
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TemplateSelectionEnhanced;