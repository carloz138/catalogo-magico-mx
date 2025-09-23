// src/components/enhanced/TemplateSelectionEnhanced.tsx
// 🎯 VERSIÓN ACTUALIZADA CON URLS OPTIMIZADAS PARA PDFs LIGEROS

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

import { 
  ArrowLeft,
  ArrowRight,
  Palette,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Package,
  Crown
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
  // 🎯 NUEVOS CAMPOS PARA URLs OPTIMIZADAS
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
      tiene_processed: !!product.processed_image_url,
      tiene_catalog: !!product.catalog_image_url,
      processed_url: product.processed_image_url?.substring(0, 60) + '...',
      catalog_url: product.catalog_image_url?.substring(0, 60) + '...',
      decision: preferNoBackground && product.processed_image_url ? 'USAR SIN FONDO' : 'USAR CON FONDO'
    });
    
    // Si el usuario prefiere sin fondo Y existe processed_image_url
    if (preferNoBackground && product.processed_image_url) {
      console.log(`✅ USANDO IMAGEN SIN FONDO para "${product.name}": ${product.processed_image_url}`);
      return product.processed_image_url;
    }
    
    // Para catálogos: catalog_image_url (800x800, ~100KB) tiene prioridad
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
  
  // Estados de límites
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  
  // Estados de UX
  const [userIndustry, setUserIndustry] = useState<IndustryType | undefined>();
  const [userPlan, setUserPlan] = useState<'basic' | 'premium'>('basic');
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [backgroundPreference, setBackgroundPreference] = useState<'with' | 'without' | 'auto'>('auto');
  const [backgroundAnalysis, setBackgroundAnalysis] = useState<any>(null);

  const state = location.state as LocationState;

  useEffect(() => {
    initializeComponent();
  }, [user]);

  // 🆕 EFECTO PARA REACCIONAR A CAMBIOS EN PREFERENCIA DE FONDO
  useEffect(() => {
    if (selectedProducts.length > 0 && backgroundAnalysis) {
      console.log('🔄 RECALCULANDO URLs por cambio de preferencia:', {
        nuevaPreferencia: backgroundPreference,
        totalProductos: selectedProducts.length,
        timestamp: new Date().toISOString()
      });
      
      // Determinar preferencia de sin fondo
      const preferNoBackground = backgroundPreference === 'without' || 
                                (backgroundPreference === 'auto' && backgroundAnalysis.allHaveNoBackground);
      
      // Actualizar URLs de productos
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
  }, [backgroundPreference]); // Solo escuchar cambios en backgroundPreference

  const initializeComponent = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔍 TemplateSelectionEnhanced montado');

      await initializeOptimizedTemplates();
      
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

  // 🎯 FUNCIÓN ACTUALIZADA CON MAPEO DE URLs OPTIMIZADAS
  const loadSelectedProducts = async () => {
    let productsToUse: Product[] = [];
    
    // 1. PRIORIDAD: Buscar en localStorage (desde Products)
    try {
      const storedProducts = localStorage.getItem('selectedProductsData');
      if (storedProducts) {
        productsToUse = JSON.parse(storedProducts);
        console.log('✅ Productos encontrados en localStorage:', productsToUse.length);
      }
      
      // 🔧 CRÍTICO: Cargar título personalizado desde localStorage
      const catalogTitleFromStorage = localStorage.getItem('catalogTitle');
      if (catalogTitleFromStorage) {
        console.log('🔍 DEBUG - Título cargado del localStorage:', catalogTitleFromStorage);
        setCatalogTitle(catalogTitleFromStorage);
      } else {
        console.log('🔍 DEBUG - No hay título en localStorage');
      }
    } catch (error) {
      console.error('Error leyendo localStorage:', error);
    }
    
    // 2. FALLBACK: Buscar en router state
    if (productsToUse.length === 0 && state?.products && state.products.length > 0) {
      productsToUse = state.products;
      console.log('✅ Productos encontrados en router state:', productsToUse.length);
    }
    
    // 3. VALIDAR, MAPEAR URLs OPTIMIZADAS Y USAR
    if (productsToUse.length > 0) {
      
      // 🆕 ANÁLISIS DE FONDOS
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
      
      // 🎯 LOG DE DEPURACIÓN: Verificar que lleguen las URLs optimizadas
      console.log('🔍 PRODUCTOS RECIBIDOS EN TEMPLATE SELECTION:', {
        totalProductos: productsToUse.length,
        productosConCatalogUrl: productsToUse.filter(p => p.catalog_image_url).length,
        productosConFondoRemovido: productsToUse.filter(p => p.processed_image_url && p.processed_image_url !== p.original_image_url).length,
        detalleProductos: productsToUse.map(p => ({
          nombre: p.name,
          tiene_catalog_image_url: !!p.catalog_image_url,
          tiene_processed_image_url: !!p.processed_image_url,
          fondo_removido: !!(p.processed_image_url && p.processed_image_url !== p.original_image_url),
          catalog_url: p.catalog_image_url?.substring(0, 60) + '...',
          processed_url: p.processed_image_url?.substring(0, 60) + '...',
          original_url: p.original_image_url?.substring(0, 60) + '...'
        }))
      });
      
      // 🔍 LOG DE DEPURACIÓN: Verificar que lleguen las URLs optimizadas
      console.log('🔍 PRODUCTOS RECIBIDOS EN TEMPLATE SELECTION:', {
        totalProductos: productsToUse.length,
        productosConCatalogUrl: productsToUse.filter(p => p.catalog_image_url).length,
        productosConFondoRemovido: productsToUse.filter(p => p.processed_image_url && p.processed_image_url !== p.original_image_url).length,
        detalleProductos: productsToUse.map(p => ({
          nombre: p.name,
          tiene_catalog_image_url: !!p.catalog_image_url,
          tiene_processed_image_url: !!p.processed_image_url,
          fondo_removido: !!(p.processed_image_url && p.processed_image_url !== p.original_image_url),
          catalog_url: p.catalog_image_url?.substring(0, 60) + '...',
          processed_url: p.processed_image_url?.substring(0, 60) + '...',
          original_url: p.original_image_url?.substring(0, 60) + '...'
        }))
      });
      
      // 🎯 MAPEAR URLS SEGÚN PREFERENCIA DE FONDO
      const productsWithOptimizedUrls = productsToUse.map(product => {
        // Determinar preferencia de sin fondo
        const preferNoBackground = backgroundPreference === 'without' || 
                                  (backgroundPreference === 'auto' && analysis.allHaveNoBackground);
        
        console.log(`🎯 MAPEO PRODUCTO "${product.name}":`, {
          backgroundPreference,
          analysis_allHaveNoBackground: analysis.allHaveNoBackground,
          preferNoBackground,
          razonamiento: backgroundPreference === 'without' ? 'Usuario eligió SIN FONDO' :
                       backgroundPreference === 'auto' && analysis.allHaveNoBackground ? 'AUTO: Todos tienen sin fondo' :
                       'Usuario eligió CON FONDO o mixto'
        });
        
        // Usar función helper mejorada
        const optimizedImageUrl = getCatalogImageUrl(product, preferNoBackground);
        
        const hasNoBackground = hasBackgroundRemoved(product);
        const willUseNoBackground = preferNoBackground && hasNoBackground;
        
        console.log(`🔄 RESULTADO FINAL "${product.name}":`, {
          original: product.original_image_url ? 'Sí' : 'No',
          catalog: product.catalog_image_url ? 'Sí' : 'No',
          processed: product.processed_image_url ? 'Sí' : 'No',
          thumbnail: product.thumbnail_image_url ? 'Sí' : 'No',
          luxury: product.luxury_image_url ? 'Sí' : 'No',
          print: product.print_image_url ? 'Sí' : 'No',
          tiene_fondo_removido: hasNoBackground,
          preferencia_usuario: backgroundPreference,
          usara_sin_fondo: willUseNoBackground,
          usando: willUseNoBackground ? 'Processed (sin fondo)' : 'Catalog (optimizada con fondo)',
          url_final: optimizedImageUrl,
          tamaño_url: optimizedImageUrl?.length || 0
        });
        
        return {
          ...product,
          image_url: optimizedImageUrl  // Esta es la que usará el PDF
        };
      });
      
      const optimizedCount = productsWithOptimizedUrls.filter(p => p.catalog_image_url).length;
      
      setSelectedProducts(productsWithOptimizedUrls);
      console.log('✅ Productos cargados correctamente:', {
        total: productsWithOptimizedUrls.length,
        conVersionOptimizada: optimizedCount,
        reduccionEstimada: optimizedCount > 0 ? '~90% menos peso en PDF' : 'Sin optimización'
      });
      
      if (optimizedCount > 0) {
        console.log(`🚀 ${optimizedCount}/${productsWithOptimizedUrls.length} productos usarán versiones optimizadas para PDFs súper ligeros`);
      }
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
    // Intentar detectar industria desde las categorías de productos
    if (selectedProducts.length > 0) {
      const categories = selectedProducts
        .map(p => p.category?.toLowerCase())
        .filter(Boolean);
      
      // Lógica simple de detección por categorías de productos
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
    
    // También podríamos detectar desde el nombre del negocio
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

  // 🚀 FUNCIÓN loadUserPlan ACTUALIZADA CON NUEVA LÓGICA PREMIUM
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
        
        // 🎯 NUEVA LÓGICA PREMIUM
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
      console.log('🚀 Iniciando generación con nuevo sistema...');
      
      // Usar nuestro nuevo generador unificado
      const result = await generateCatalog(
        selectedProducts,
        {
          business_name: businessInfo.business_name,
          email: businessInfo.email,
          phone: businessInfo.phone,
          website: businessInfo.website,
          address: businessInfo.address
        },
        selectedTemplate,
        user.id,
        {
          catalogTitle: catalogTitle,
          qualityCheck: true,
          autoFix: true
        }
      );
      
      if (result.success) {
        toast({
          title: "🎉 ¡Catálogo generado exitosamente!",
          description: result.message,
        });

        // Limpiar localStorage
        localStorage.removeItem('selectedTemplate');
        localStorage.removeItem('selectedProducts');
        localStorage.removeItem('selectedProductsData');
        localStorage.removeItem('catalogTitle');
        
        // Actualizar límites
        await loadCatalogLimits();
        
        // Redirigir a catálogos
        navigate('/catalogs');
        
      } else {
        throw new Error(result.message || 'Error desconocido');
      }

    } catch (error) {
      console.error('❌ Error generando catálogo:', error);
      toast({
        title: "Error al generar catálogo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
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

  // 🎯 MOSTRAR INFORMACIÓN DE OPTIMIZACIÓN EN HEADER
  const optimizedCount = selectedProducts.filter(p => p.catalog_image_url).length;

  // Header actions
  const actions = (
    <div className="flex items-center gap-3">
      <div className="hidden md:block">
        <Badge variant="outline" className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {selectedProducts.length} productos
        </Badge>
      </div>
      
      {/* 🎯 NUEVO: Badge de optimización */}
      {optimizedCount > 0 && (
        <div className="hidden lg:block">
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            ⚡ {optimizedCount} optimizadas
          </Badge>
        </div>
      )}
      
      {/* Badge de plan premium */}
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
              
              {/* 🎯 NUEVA INFORMACIÓN DE OPTIMIZACIÓN */}
              {optimizedCount > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ⚡ <strong>{optimizedCount} productos optimizados</strong> - PDF será ~90% más ligero
                  </p>
                </div>
              )}
            </div>
            
            {/* Mostrar info del plan en móvil */}
            <div className="sm:hidden w-full">
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {selectedProducts.length} productos seleccionados
                    </span>
                    <div className="flex items-center gap-2">
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

          {/* 🎯 NUEVO: Banner de optimización si hay productos optimizados */}
          {optimizedCount > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>PDFs súper ligeros:</strong> {optimizedCount} de {selectedProducts.length} productos 
                tienen versiones optimizadas (800x800px). Tu PDF será ~90% más liviano manteniendo excelente calidad.
              </AlertDescription>
            </Alert>
          )}

          {/* 🆕 SELECTOR DE PREFERENCIA DE FONDO */}
          {backgroundAnalysis && (
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
          )}

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
                      {optimizedCount > 0 && ` (${optimizedCount} optimizadas para PDF ligero)`}
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
                    className="bg-white border-green-300 focus:border-green-500"
                  />
                  <p className="text-xs text-green-600">
                    Si no especificas un nombre, se generará automáticamente
                  </p>
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
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TemplateSelectionEnhanced;