
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Palette, 
  Zap, 
  Crown, 
  Sparkles,
  ArrowRight,
  Eye
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

  const handleGenerateCatalog = () => {
    if (!selectedTemplate) {
      toast({
        title: "Selecciona un template",
        description: "Debes seleccionar un template para continuar",
        variant: "destructive",
      });
      return;
    }

    // Store template selection and navigate to generation
    localStorage.setItem('selectedTemplate', selectedTemplate);
    
    toast({
      title: "Generando catálogo...",
      description: "Tu catálogo se está generando. Te notificaremos cuando esté listo.",
    });

    // Navigate to catalogs page
    navigate('/catalogs');
  };

  const actions = (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">
        {selectedProducts.length} productos seleccionados
      </span>
      
      <Button 
        onClick={handleGenerateCatalog}
        disabled={!selectedTemplate}
        className="flex items-center gap-2"
      >
        <Palette className="h-4 w-4" />
        Generar Catálogo
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="space-y-6">
          {/* Template categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
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
