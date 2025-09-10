// src/components/templates/SmartTemplateSelector.tsx
// 🧠 SELECTOR INTELIGENTE DE TEMPLATES CON RECOMENDACIONES

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IndustryTemplate, 
  IndustryType,
  ProductDensity,
  INDUSTRY_TEMPLATES,
  INDUSTRY_MAP,
  getTemplatesByIndustry,
  getTemplatesByDensity,
  getFreeTemplates,
  getPremiumTemplates
} from '@/lib/templates/industry-templates';
import { TemplateGallery } from './TemplatePreview';
import { 
  Filter, 
  Crown, 
  Zap, 
  Grid3X3, 
  Grid2X2, 
  Square,
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface SmartTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  userPlan?: 'basic' | 'premium';
  userIndustry?: IndustryType;
  productCount?: number;
}

type FilterType = 'all' | 'recommended' | 'free' | 'premium' | IndustryType | ProductDensity;

export const SmartTemplateSelector: React.FC<SmartTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  userPlan = 'basic',
  userIndustry,
  productCount = 6
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('recommended');
  const [showIndustrySelector, setShowIndustrySelector] = useState(!userIndustry);

  // Calcular recomendaciones inteligentes
  const recommendations = useMemo(() => {
    const suggestions: IndustryTemplate[] = [];
    
    // Si conocemos la industria, priorizar templates de esa industria
    if (userIndustry) {
      const industryTemplates = getTemplatesByIndustry(userIndustry);
      suggestions.push(...industryTemplates);
    }
    
    // Recomendar por densidad según cantidad de productos
    const recommendedDensity: ProductDensity = 
      productCount <= 4 ? 'baja' : 
      productCount <= 8 ? 'media' : 'alta';
    
    const densityTemplates = getTemplatesByDensity(recommendedDensity)
      .filter(t => !suggestions.find(s => s.id === t.id));
    suggestions.push(...densityTemplates.slice(0, 2));
    
    // Si no hay suficientes, agregar populares
    if (suggestions.length < 4) {
      const popular = [
        INDUSTRY_TEMPLATES['moda-boutique'],
        INDUSTRY_TEMPLATES['joyeria-elegante'],
        INDUSTRY_TEMPLATES['electronica-tech']
      ].filter(t => t && !suggestions.find(s => s.id === t.id));
      suggestions.push(...popular);
    }
    
    return suggestions.slice(0, 6);
  }, [userIndustry, productCount]);

  // Filtrar templates según filtro activo
  const filteredTemplates = useMemo(() => {
    const allTemplates = Object.values(INDUSTRY_TEMPLATES);
    
    switch (activeFilter) {
      case 'recommended':
        return recommendations;
      case 'free':
        return getFreeTemplates();
      case 'premium':
        return getPremiumTemplates();
      case 'alta':
      case 'media':
      case 'baja':
        return getTemplatesByDensity(activeFilter as ProductDensity);
      case 'all':
        return allTemplates;
      default:
        // Filtrar por industria
        if (Object.keys(INDUSTRY_MAP).includes(activeFilter)) {
          return getTemplatesByIndustry(activeFilter as IndustryType);
        }
        return allTemplates;
    }
  }, [activeFilter, recommendations]);

  // Verificar si template es accesible según plan
  const isTemplateAccessible = (template: IndustryTemplate) => {
    return !template.isPremium || userPlan === 'premium';
  };

  const getDensityIcon = (density: ProductDensity) => {
    switch (density) {
      case 'alta': return Grid3X3;
      case 'media': return Grid2X2; 
      case 'baja': return Square;
    }
  };

  const getDensityLabel = (density: ProductDensity) => {
    switch (density) {
      case 'alta': return '12 productos';
      case 'media': return '6 productos';
      case 'baja': return '3 productos';
    }
  };

  return (
    <div className="smart-template-selector space-y-6">
      {/* Selector de industria si no está definida */}
      {showIndustrySelector && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">¿Cuál es tu tipo de negocio?</h3>
              <p className="text-gray-600 text-sm">
                Esto nos ayudará a recomendarte los mejores templates
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(INDUSTRY_MAP).map(([key, industry]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => {
                    setActiveFilter(key as IndustryType);
                    setShowIndustrySelector(false);
                  }}
                >
                  <span className="text-2xl">{industry.icon}</span>
                  <span className="text-xs font-medium">{industry.name}</span>
                </Button>
              ))}
            </div>
            
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIndustrySelector(false)}
              >
                Omitir por ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros inteligentes */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === 'recommended' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('recommended')}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Recomendados {userIndustry && `(${INDUSTRY_MAP[userIndustry].name})`}
        </Button>
        
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Todos
        </Button>
        
        <Button
          variant={activeFilter === 'free' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('free')}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Gratuitos
        </Button>
        
        <Button
          variant={activeFilter === 'premium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('premium')}
          className="flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Premium
        </Button>
      </div>

      {/* Filtros por densidad */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center mr-2">Por densidad:</span>
        
        {(['alta', 'media', 'baja'] as ProductDensity[]).map(density => {
          const Icon = getDensityIcon(density);
          return (
            <Button
              key={density}
              variant={activeFilter === density ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(density)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {getDensityLabel(density)}
            </Button>
          );
        })}
      </div>

      {/* Filtros por industria */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center mr-2">Por industria:</span>
        
        {Object.entries(INDUSTRY_MAP).slice(0, 4).map(([key, industry]) => (
          <Button
            key={key}
            variant={activeFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(key as IndustryType)}
            className="flex items-center gap-2"
          >
            <span>{industry.icon}</span>
            {industry.name}
          </Button>
        ))}
        
        {Object.keys(INDUSTRY_MAP).length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIndustrySelector(true)}
          >
            Ver todos...
          </Button>
        )}
      </div>

      {/* Información del filtro activo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">
              {activeFilter === 'recommended' && 'Templates Recomendados'}
              {activeFilter === 'all' && 'Todos los Templates'}
              {activeFilter === 'free' && 'Templates Gratuitos'}
              {activeFilter === 'premium' && 'Templates Premium'}
              {(['alta', 'media', 'baja'] as ProductDensity[]).includes(activeFilter as ProductDensity) && 
                `Templates de ${activeFilter} densidad`}
              {Object.keys(INDUSTRY_MAP).includes(activeFilter) && 
                `Templates para ${INDUSTRY_MAP[activeFilter as IndustryType].name}`}
            </h4>
            <p className="text-sm text-blue-700">
              {activeFilter === 'recommended' && (
                <>
                  Basado en tu industria {userIndustry && `(${INDUSTRY_MAP[userIndustry].name})`} 
                  y {productCount} productos. Perfectos para empezar.
                </>
              )}
              {activeFilter === 'free' && 'Templates incluidos en todos los planes, perfectos para comenzar.'}
              {activeFilter === 'premium' && userPlan === 'basic' && (
                <>Requieren plan Premium. <Button variant="link" className="h-auto p-0 text-blue-600">Actualizar plan</Button></>
              )}
              {activeFilter === 'premium' && userPlan === 'premium' && 'Templates con características avanzadas y diseños exclusivos.'}
              {Object.keys(INDUSTRY_MAP).includes(activeFilter) && 
                INDUSTRY_MAP[activeFilter as IndustryType].description}
            </p>
          </div>
          <Badge variant="outline" className="bg-white">
            {filteredTemplates.length} templates
          </Badge>
        </div>
      </div>

      {/* Galería de templates */}
      <div className="template-gallery-wrapper">
        {filteredTemplates.length > 0 ? (
          <TemplateGallery
            templates={filteredTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={(templateId) => {
              const template = filteredTemplates.find(t => t.id === templateId);
              if (template && isTemplateAccessible(template)) {
                onTemplateSelect(templateId);
              }
            }}
            scale={0.25}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No hay templates disponibles
            </h3>
            <p className="text-gray-500 mb-4">
              Intenta cambiar los filtros para ver más opciones
            </p>
            <Button
              variant="outline"
              onClick={() => setActiveFilter('all')}
            >
              Ver todos los templates
            </Button>
          </div>
        )}
      </div>

      {/* Template seleccionado */}
      {selectedTemplate && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">
                  Template seleccionado: {
                    filteredTemplates.find(t => t.id === selectedTemplate)?.displayName ||
                    Object.values(INDUSTRY_TEMPLATES).find(t => t.id === selectedTemplate)?.displayName
                  }
                </h4>
                <p className="text-sm text-green-700">
                  Perfecto para tu catálogo. Listo para generar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartTemplateSelector;