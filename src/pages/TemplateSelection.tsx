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
import '@/styles/template-styles.css'; // ✅ RE-IMPORTAMOS EL CSS

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

  // ✅ AGREGAR ESTILOS DINÁMICOS PARA TEMPLATES
  useEffect(() => {
    // Crear estilos CSS para cada template en contenedores aislados
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Estilos para previews de templates aislados */
      .template-body-minimalista-gris { background: #f8f9fa; color: #495057; }
      .template-body-minimalista-gris .catalog { font-family: 'Inter', sans-serif; }
      .template-body-minimalista-gris .header h1 { color: #6c757d; font-weight: 200; letter-spacing: 4px; text-transform: uppercase; }
      .template-body-minimalista-gris .product { background: #fff; border: 1px solid #e9ecef; }
      .template-body-minimalista-gris .product-title { color: #343a40; font-weight: 300; }
      .template-body-minimalista-gris .product-price { color: #495057; font-weight: 600; }

      .template-body-profesional-corporativo { background: #e9ecef; }
      .template-body-profesional-corporativo .catalog { font-family: 'Roboto', sans-serif; }
      .template-body-profesional-corporativo .header h1 { color: #2c3e50; font-weight: 300; border-bottom: 2px solid #3498db; }
      .template-body-profesional-corporativo .product { background: #fff; border-left: 5px solid #3498db; }
      .template-body-profesional-corporativo .product-title { color: #2c3e50; font-weight: 500; }
      .template-body-profesional-corporativo .product-price { color: #e74c3c; font-weight: 700; }

      .template-body-naturaleza-organico { background: #f1f8e9; }
      .template-body-naturaleza-organico .product { background: #e8f5e9; border-radius: 0 20px; }
      .template-body-naturaleza-organico .header h1 { color: #1b5e20; border-bottom: 2px solid #a5d6a7; }
      .template-body-naturaleza-organico .product-title { color: #2e7d32; font-family: 'Merriweather', serif; }
      .template-body-naturaleza-organico .product-price { color: #43a047; }

      .template-body-rustico-campestre { 
        background: #f4f1e8;
        background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b996' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20s-20-8.954-20-20 8.954-20 20-20 20 8.954 20 20zm-30 0c0 5.523 4.477 10 10 10s10-4.477 10-10-4.477-10-10-10-10 4.477-10 10z'/%3E%3C/g%3E%3C/svg%3E");
      }
      .template-body-rustico-campestre .catalog { font-family: 'Cabin', sans-serif; }
      .template-body-rustico-campestre .header h1 { color: #6b4423; font-weight: 700; border-bottom: 4px solid #8b4513; }
      .template-body-rustico-campestre .product { background: #fff; border: 2px solid #d2b48c; box-shadow: 5px 5px 0 #deb887; }
      .template-body-rustico-campestre .product-title { color: #8b4513; font-weight: 600; text-transform: uppercase; }
      .template-body-rustico-campestre .product-price { background: #8b4513; color: #fff; padding: 8px 16px; font-weight: 700; }

      .template-body-verano-tropical { background: #e1f5fe; }
      .template-body-verano-tropical .product { background: #fff; border-radius: 20px 0; }
      .template-body-verano-tropical .product::before { 
        content: ""; height: 5px; 
        background: linear-gradient(90deg, #ff5252, #ffab40, #ffd740); 
        display: block; margin-bottom: 20px; 
      }
      .template-body-verano-tropical .product-title { color: #0097a7; }
      .template-body-verano-tropical .product-price { color: #ff5252; }

      .template-body-fiesta-mexicana { background: #f8f0e0; }
      .template-body-fiesta-mexicana .product { background: rgba(255,255,255,0.9); border: 3px solid #e30613; }
      .template-body-fiesta-mexicana .header h1 { color: #e30613; text-shadow: 2px 2px 0 #f9e300; font-family: 'Cinzel', serif; }
      .template-body-fiesta-mexicana .product-title { color: #006847; }
      .template-body-fiesta-mexicana .product-price { color: #ce1126; }

      .template-body-halloween { background: #2c1b47; color: #e0c3ff; }
      .template-body-halloween .product { background: #4a235a; border: 2px dashed #ff6b00; }
      .template-body-halloween .header h1 { color: #ff6b00; text-transform: uppercase; font-family: 'Creepster', cursive; }
      .template-body-halloween .product-title { color: #ff9e44; }
      .template-body-halloween .product-price { color: #ff3c38; }

      .template-body-elegante-oro { background: #faf5e9; }
      .template-body-elegante-oro .product { background: #fffdf6; border: 1px solid #e8d8b6; }
      .template-body-elegante-oro .product-title { color: #8e6c3a; font-weight: 300; }
      .template-body-elegante-oro .product-price { color: #d4af37; font-size: 28px; }

      .template-body-lujo-negro-oro { background: #1a1a1a; color: #f5f5f5; }
      .template-body-lujo-negro-oro .catalog { font-family: 'Playfair Display', serif; }
      .template-body-lujo-negro-oro .header h1 { color: #ffd700; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }
      .template-body-lujo-negro-oro .product { background: #2a2a2a; border: 2px solid #ffd700; }
      .template-body-lujo-negro-oro .product-title { color: #f5f5f5; font-weight: 400; }
      .template-body-lujo-negro-oro .product-price { background: linear-gradient(45deg, #ffd700, #ffed4e); color: #1a1a1a; padding: 10px 20px; font-weight: 700; }
    `;
    
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

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

    // ✅ CREAR PREVIEW REAL CON CSS DEL TEMPLATE
    const RealTemplatePreview = () => (
      <div className={`template-preview-container ${template.id} relative h-48 overflow-hidden`}>
        {/* ✅ APLICAMOS LA CLASE BODY DEL TEMPLATE AL CONTENEDOR */}
        <div 
          className={`template-body-${template.id}`}
          style={{ 
            height: '100%', 
            transform: 'scale(0.4)', 
            transformOrigin: 'top left',
            width: '250%'  // Compensar el scale para que se vea completo
          }}
        >
          {/* ✅ MINI CATÁLOGO CON ESTILOS REALES */}
          <div className="catalog">
            <div className="header">
              <h1>Mi Catálogo</h1>
            </div>
            <div className="product">
              <div className="product-img bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="product-title">Producto Ejemplo</h2>
              <div className="product-price">$99.99</div>
              <p className="product-desc">Descripción del producto aquí. Texto de ejemplo para mostrar cómo se ve el template.</p>
            </div>
          </div>
        </div>
        
        {/* Template name badge */}
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
      </div>
    );

    return (
      <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${isLocked ? 'opacity-70' : ''}`}>
        <RealTemplatePreview />
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

          <div className="text-xs text-gray-500 mb-4 grid grid-cols-2 gap-1">
            <div>• {template.productsPerPage} por página</div>
            <div>• Diseño {template.layout}</div>
            <div>• {template.colors.primary}</div>
            <div>• {template.category}</div>
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

        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-2"> {/* ✅ Prevenir overflow */}
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

          {/* ✅ SPECS EN GRID PARA MEJOR LAYOUT */}
          <div className="text-xs text-gray-500 mb-4 grid grid-cols-2 gap-1">
            <div>• {template.productsPerPage} por página</div>
            <div>• Diseño {template.layout}</div>
            <div>• {template.colors.primary}</div>
            <div>• {template.category}</div>
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
