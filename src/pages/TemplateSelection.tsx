import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { createCatalog } from '@/lib/catalogService'; // NUEVO: Importar servicio modificado
import { useCatalogLimits, getCatalogUsageDisplay } from '@/hooks/useCatalogLimits'; // NUEVO: Hook de límites
import { 
  Palette, 
  Zap, 
  Crown, 
  Sparkles,
  ArrowRight,
  Eye,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'basic' | 'professional' | 'premium';
  features: string[];
  price: number;
}

const templates: Template[] = [
  {
    id: 'modern-clean',
    name: 'Moderno Limpio',
    description: 'Diseño minimalista y elegante, perfecto para productos de alta gama',
    preview: '/placeholder.svg',
    category: 'basic',
    features: ['Diseño limpio', 'Responsive', 'Colores personalizables'],
    price: 0
  },
  {
    id: 'professional-grid',
    name: 'Rejilla Profesional',
    description: 'Layout en rejilla profesional ideal para catálogos extensos',
    preview: '/placeholder.svg',
    category: 'professional',
    features: ['Layout en rejilla', 'Filtros avanzados', 'Búsqueda integrada', 'Branding personalizado'],
    price: 50
  },
  {
    id: 'luxury-magazine',
    name: 'Revista de Lujo',
    description: 'Estilo revista premium con efectos visuales avanzados',
    preview: '/placeholder.svg',
    category: 'premium',
    features: ['Efectos visuales', 'Animaciones', 'Múltiples layouts', 'Integración social', 'Analytics'],
    price: 100
  }
];

const TemplateSelection = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false); // NUEVO: Estado de generación
  
  // NUEVO: Hook para validar límites de catálogos
  const { 
    validateBeforeGeneration, 
    canGenerate, 
    validation,
    catalogsUsed,
    catalogsLimit 
  } = useCatalogLimits();

  useEffect(() => {
    // Load selected products from localStorage
    const products = localStorage.getItem('selectedProducts');
    if (products) {
      setSelectedProducts(JSON.parse(products));
    } else {
      toast({
        title: "No hay productos seleccionados",
        description: "Selecciona productos primero desde tu biblioteca",
        variant: "destructive",
      });
      navigate('/products');
    }
  }, [navigate]);

  const getCategoryBadge = (category: string) => {
    const configs = {
      basic: { color: 'bg-blue-100 text-blue-800', icon: Zap, text: 'Básico' },
      professional: { color: 'bg-purple-100 text-purple-800', icon: Sparkles, text: 'Profesional' },
      premium: { color: 'bg-yellow-100 text-yellow-800', icon: Crown, text: 'Premium' },
    };
    
    const config = configs[category as keyof typeof configs] || configs.basic;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  // NUEVO: Función modificada para validar límites antes de generar
  const handleGenerateCatalog = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Selecciona un template",
        description: "Debes seleccionar un template para continuar",
        variant: "destructive",
      });
      return;
    }

    // VALIDAR LÍMITES ANTES DE GENERAR
    const canProceed = await validateBeforeGeneration();
    if (!canProceed) {
      return; // El error ya se mostró en validateBeforeGeneration
    }

    setGenerating(true);
    
    try {
      // Obtener productos completos del localStorage
      const productsData = localStorage.getItem('selectedProductsData');
      const businessData = localStorage.getItem('businessInfo');
      
      let products = [];
      let businessInfo = {};
      
      if (productsData) {
        products = JSON.parse(productsData);
      }
      
      if (businessData) {
        businessInfo = JSON.parse(businessData);
      }

      // Crear catálogo usando el servicio modificado (que incluye tracking)
      const result = await createCatalog(products, businessInfo, selectedTemplate);
      
      if (result.success) {
        toast({
          title: "Catálogo generado exitosamente",
          description: "Tu catálogo se está procesando. Te notificaremos cuando esté listo.",
        });

        // Limpiar localStorage
        localStorage.removeItem('selectedTemplate');
        localStorage.removeItem('selectedProducts');
        localStorage.removeItem('selectedProductsData');
        
        // Navegar a catálogos
        navigate('/catalogs');
      } else {
        throw new Error(result.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error generating catalog:', error);
      toast({
        title: "Error al generar catálogo",
        description: error instanceof Error ? error.message : "Error desconocido al generar catálogo",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // NUEVO: Componente para mostrar estado de límites
  const CatalogLimitsAlert = () => {
    if (!validation) return null;

    const isUnlimited = validation.catalogs_limit === 'unlimited' || validation.catalogs_limit === 0;
    const isNearLimit = !isUnlimited && validation.remaining !== undefined && validation.remaining <= 2;
    const isAtLimit = !canGenerate;

    if (isAtLimit) {
      return (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Límite alcanzado</h3>
                <p className="text-sm text-red-700 mt-1">
                  {validation.message}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/pricing')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Mejorar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isNearLimit) {
      return (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Pocos catálogos restantes</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Te quedan {validation.remaining} catálogos este mes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const actions = (
    <div className="flex items-center gap-3">
      {/* NUEVO: Mostrar uso de catálogos */}
      <div className="hidden md:block">
        <span className="text-sm text-gray-600">
          {validation ? getCatalogUsageDisplay(validation) : ''}
        </span>
      </div>
      
      <span className="text-sm text-gray-600">
        {selectedProducts.length} productos seleccionados
      </span>
      
      <Button 
        onClick={handleGenerateCatalog}
        disabled={!selectedTemplate || generating || !canGenerate}
        className="flex items-center gap-2"
      >
        <Palette className="h-4 w-4" />
        {generating ? 'Generando...' : 'Generar Catálogo'}
        {!generating && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="space-y-6">
          {/* NUEVO: Alerta de límites */}
          <CatalogLimitsAlert />

          {/* NUEVO: Uso de catálogos en mobile */}
          <div className="md:hidden">
            <Card>
              <CardContent className="p-4">
                <span className="text-sm text-gray-600">
                  {validation ? getCatalogUsageDisplay(validation) : ''}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Template categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                } ${!canGenerate ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => canGenerate && handleTemplateSelect(template.id)}
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    {getCategoryBadge(template.category)}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button size="sm" variant="outline" className="bg-white/80">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <span className="font-bold text-primary">
                      {template.price === 0 ? 'Gratis' : `$${template.price}`}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Características:</p>
                    <ul className="space-y-1">
                      {template.features.map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center">
                          <div className="w-1 h-1 bg-blue-500 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedTemplate === template.id && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge className="bg-blue-100 text-blue-800 w-full justify-center">
                        Seleccionado
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Template comparison */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comparación de Templates</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Característica</th>
                      <th className="text-center py-2">Básico</th>
                      <th className="text-center py-2">Profesional</th>
                      <th className="text-center py-2">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="py-2">Productos ilimitados</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Personalización de colores</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Branding personalizado</td>
                      <td className="text-center">-</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Efectos visuales avanzados</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr>
                      <td className="py-2">Soporte prioritario</td>
                      <td className="text-center">-</td>
                      <td className="text-center">-</td>
                      <td className="text-center">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TemplateSelection;
