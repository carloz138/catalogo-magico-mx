// src/pages/TemplateSelection.tsx
// 🎨 NUEVA SELECCIÓN DE TEMPLATES INTEGRADA CON SISTEMA INTELIGENTE

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';

// Importar nuestro nuevo sistema
import { SmartTemplateSelector } from '@/components/templates/SmartTemplateSelector';
import { generateCatalog, checkLimits } from '@/lib/catalog/unified-generator';
import { IndustryType } from '@/lib/templates/industry-templates';

import { 
  ArrowLeft,
  ArrowRight,
  Palette,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Package
} from 'lucide-react';

console.log('🔍 DEBUG: SmartTemplateSelector importado:', SmartTemplateSelector);
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

const TemplateSelection = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();
  
  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados de límites
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  
  // Estados de UX
  const [userIndustry, setUserIndustry] = useState<IndustryType | undefined>();
  const [userPlan, setUserPlan] = useState<'basic' | 'premium'>('basic');

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
    // Cargar desde localStorage (como en el componente original)
    const productsData = localStorage.getItem('selectedProductsData');
    const productsIds = localStorage.getItem('selectedProducts');
    
    if (productsData) {
      const products = JSON.parse(productsData);
      setSelectedProducts(products);
      console.log('✅ Productos cargados:', products.length);
    } else if (productsIds) {
      // Fallback: solo IDs, necesitaríamos cargar datos completos
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

  const loadUserPlan = async () => {
    if (!user) return;
    
    try {
      // Consultar plan actual del usuario
      const { data: subscription } = await (window as any).supabase
        .from('subscriptions')
        .select(`
          status,
          credit_packages (
            package_type,
            name
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();
      
      if (subscription?.credit_packages?.package_type) {
        const packageType = subscription.credit_packages.package_type;
        setUserPlan(packageType === 'basic' || packageType === 'free' ? 'basic' : 'premium');
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      // Mantener 'basic' como default
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
        user.id
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">
                      ¡Template seleccionado!
                    </h4>
                    <p className="text-sm text-green-700">
                      Listo para generar tu catálogo con {selectedProducts.length} productos
                    </p>
                  </div>
                  <Button 
                    onClick={handleGenerateCatalog}
                    disabled={generating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Generar Ahora'
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

export default TemplateSelection;
