import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { createCatalog } from '@/lib/catalogService';
import { getFreeTemplates, getPremiumTemplates, getTemplateById, TemplateConfig } from '@/lib/templates';
import '@/styles/template-styles.css';

// ✅ FIX 1: Interface corregida
interface LocationState {
  products?: any[];        // ✅ CAMBIO: selectedProducts → products
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
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const state = location.state as LocationState;

  // ✅ FIX 2: useEffect corregido con debugging
  useEffect(() => {
    console.log('🔍 TemplateSelection montado');
    console.log('🔍 location.state recibido:', state);
    console.log('🔍 state?.products:', state?.products);
    console.log('🔍 state?.businessInfo:', state?.businessInfo);

    if (state?.products) {           // ✅ CAMBIO: selectedProducts → products
      console.log('✅ Productos encontrados:', state.products.length, 'productos');
      setSelectedProducts(state.products);  // ✅ CAMBIO: selectedProducts → products
    } else {
      console.log('❌ No hay productos en state, redirigiendo a /products');
      console.log('❌ Estructura completa del state:', JSON.stringify(state, null, 2));
      // If no products selected, redirect to products page
      navigate('/products');
      return;
    }

    fetchUserPlan();
  }, []);

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

  const handleTemplateSelect = async (templateId: string) => {
    if (!selectedProducts.length) {
      toast({
        title: "Error",
        description: "No hay productos seleccionados",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    setSelectedTemplate(templateId);

    try {
      console.log('🎨 Creando catálogo con template:', templateId);
      console.log('🎨 Productos:', selectedProducts.length);
      
      const result = await createCatalog(selectedProducts, businessInfo, templateId);
      
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: "Tu catálogo está siendo creado. Te notificaremos cuando esté listo.",
        });
        
        console.log('✅ Catálogo creado, navegando a /catalogs');
        navigate('/catalogs');
      } else {
        throw new Error(result.error || 'Error al crear el catálogo');
      }
    } catch (error) {
      console.error('Error creating catalog:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el catálogo",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
      setSelectedTemplate(null);
    }
  };

  const TemplatePreview = ({ template }: { template: TemplateConfig }) => {
    const isLocked = template.isPremium && userPlan === 'basic';
    const isCreating = creating && selectedTemplate === template.id;

    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${isLocked ? 'opacity-60' : ''}`}>
        <div className={`template-preview ${template.id} relative h-48 flex items-center justify-center`}>
          {/* Mock catalog preview */}
          <div className="catalog max-w-xs scale-75">
            <div className="header">
              <h1>Mi Catálogo</h1>
            </div>
            <div className="product">
              <div className="product-img bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                Producto
              </div>
              <h2 className="product-title text-sm">Producto Ejemplo</h2>
              <div className="product-price text-sm">$99.99</div>
              <p className="product-desc text-xs">Descripción del producto</p>
            </div>
          </div>
          
          {isLocked && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{template.displayName}</h3>
              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
            </div>
            {template.isPremium && (
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-3 space-y-1">
            <div>• {template.productsPerPage} productos por página</div>
            <div>• Diseño {template.layout}</div>
            <div>• Colores: {template.colors.primary}</div>
            <div>• Categoría: {template.category}</div>
          </div>

          <Button
            onClick={() => handleTemplateSelect(template.id)}
            disabled={isLocked || creating}
            className="w-full"
            variant={isLocked ? "outline" : "default"}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : isLocked ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Requiere Premium
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Usar Template
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
            <p className="text-neutral/60">Cargando templates...</p>
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
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/image-review')} // ✅ CAMBIO: Volver a image-review en lugar de products
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a Biblioteca</span> {/* ✅ CAMBIO: Texto más específico */}
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Seleccionar Template</h1>
                  <p className="text-gray-600">
                    {totalTemplates} templates disponibles • {selectedProducts.length} productos seleccionados
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
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* ✅ DEBUG INFO - Solo para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Debug Info:</h3>
              <p className="text-sm text-blue-700">Productos recibidos: {selectedProducts.length}</p>
              <p className="text-sm text-blue-700">Plan usuario: {userPlan}</p>
              <p className="text-sm text-blue-700">Business info: {businessInfo ? '✅' : '❌'}</p>
            </div>
          )}

          {/* Free Templates Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Templates Gratuitos</h2>
                <p className="text-gray-600">Disponibles en todos los planes</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {freeTemplates.length} templates
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
                <h2 className="text-xl font-semibold text-gray-900">Templates Premium</h2>
                <p className="text-gray-600">
                  {userPlan === 'basic' 
                    ? 'Requiere plan Premium para acceder' 
                    : 'Incluidos en tu plan Premium'
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
                <TemplatePreview key={template.id} template={template} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TemplateSelection;
