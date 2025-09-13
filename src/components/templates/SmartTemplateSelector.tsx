// src/components/templates/SmartTemplateSelector.tsx
// 🧠 SELECTOR INTELIGENTE CON UX SIMPLIFICADA Y MOBILE-FIRST

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles, 
  Crown, 
  Zap, 
  Filter,
  ChevronDown,
  Grid3X3,
  Grid2X2,
  Square,
  Search,
  X
} from 'lucide-react';

interface SmartTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  userPlan?: 'basic' | 'premium';
  userIndustry?: IndustryType;
  productCount?: number;
}

type MainTab = 'recommended' | 'all' | 'premium';
type QuickFilter = 'industry' | 'density' | null;

export const SmartTemplateSelector: React.FC<SmartTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  userPlan = 'basic',
  userIndustry,
  productCount = 6
}) => {
  // Estados principales simplificados
  const [activeTab, setActiveTab] = useState<MainTab>('recommended');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(userIndustry || null);
  const [selectedDensity, setSelectedDensity] = useState<ProductDensity | null>(null);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);

  // Calcular recomendaciones inteligentes (mismo algoritmo, más limpio)
  const recommendations = useMemo(() => {
    const suggestions: IndustryTemplate[] = [];
    
    // Priorizar por industria conocida
    if (userIndustry) {
      const industryTemplates = getTemplatesByIndustry(userIndustry);
      suggestions.push(...industryTemplates.slice(0, 3));
    }
    
    // Complementar con densidad recomendada
    const recommendedDensity: ProductDensity = 
      productCount <= 4 ? 'baja' : 
      productCount <= 8 ? 'media' : 'alta';
    
    const densityTemplates = getTemplatesByDensity(recommendedDensity)
      .filter(t => !suggestions.find(s => s.id === t.id))
      .slice(0, 2);
    suggestions.push(...densityTemplates);
    
    // Llenar con populares si faltan
    if (suggestions.length < 6) {
      const popular = [
        INDUSTRY_TEMPLATES['floreria-elegante-rosa'],
        INDUSTRY_TEMPLATES['moda-magazine-pro'], 
        INDUSTRY_TEMPLATES['joyeria-elegante'],
        INDUSTRY_TEMPLATES['electronica-tech']
      ].filter(t => t && !suggestions.find(s => s.id === t.id));
      suggestions.push(...popular);
    }
    
    return suggestions.slice(0, 6);
  }, [userIndustry, productCount]);

  // Obtener templates según tab activo y filtros
  const filteredTemplates = useMemo(() => {
    let baseTemplates: IndustryTemplate[] = [];
    
    // Templates base según tab principal
    switch (activeTab) {
      case 'recommended':
        baseTemplates = recommendations;
        break;
      case 'premium':
        baseTemplates = getPremiumTemplates();
        break;
      case 'all':
      default:
        baseTemplates = Object.values(INDUSTRY_TEMPLATES);
        break;
    }
    
    // Aplicar filtros secundarios
    if (selectedIndustry) {
      baseTemplates = baseTemplates.filter(t => t.industry === selectedIndustry);
    }
    
    if (selectedDensity) {
      baseTemplates = baseTemplates.filter(t => t.density === selectedDensity);
    }
    
    return baseTemplates;
  }, [activeTab, selectedIndustry, selectedDensity, recommendations]);

  // Verificar acceso a template premium
  const isTemplateAccessible = (template: IndustryTemplate) => {
    return !template.isPremium || userPlan === 'premium';
  };

  // Limpiar filtros activos
  const clearFilters = () => {
    setSelectedIndustry(userIndustry || null);
    setSelectedDensity(null);
    setQuickFilter(null);
  };

  // Contador de filtros activos
  const activeFiltersCount = [selectedIndustry, selectedDensity].filter(Boolean).length - (userIndustry ? 1 : 0);

  return (
    <div className="smart-template-selector space-y-6">
      {/* Selector de industria si no está definida */}
      {showIndustrySelector && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-blue-900">
                ¿Cuál es tu tipo de negocio?
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIndustrySelector(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(INDUSTRY_MAP).slice(0, 8).map(([key, industry]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center gap-1"
                  onClick={() => {
                    setSelectedIndustry(key as IndustryType);
                    setActiveTab('recommended');
                    setShowIndustrySelector(false);
                  }}
                >
                  <span className="text-lg">{industry.icon}</span>
                  <span className="text-xs">{industry.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema de Tabs Principal */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MainTab)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="recommended" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Recomendados</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Todos</span>
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>Premium</span>
            </TabsTrigger>
          </TabsList>

          {/* Contador de resultados y filtros */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{filteredTemplates.length} templates</span>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Quick Filters - Solo cuando sea relevante */}
        {activeTab !== 'recommended' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Filtros:</span>
            
            {/* Filtro por industria */}
            <div className="relative">
              <Button
                variant={selectedIndustry ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter(quickFilter === 'industry' ? null : 'industry')}
                className="flex items-center gap-2"
              >
                {selectedIndustry ? (
                  <>
                    <span>{INDUSTRY_MAP[selectedIndustry].icon}</span>
                    {INDUSTRY_MAP[selectedIndustry].name}
                    <X className="w-3 h-3 ml-1" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndustry(null);
                    }} />
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Industria
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </Button>
              
              {quickFilter === 'industry' && (
                <Card className="absolute top-full left-0 mt-1 z-10 w-64 max-h-48 overflow-y-auto">
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(INDUSTRY_MAP).map(([key, industry]) => (
                        <Button
                          key={key}
                          variant="ghost"
                          size="sm"
                          className="h-8 justify-start"
                          onClick={() => {
                            setSelectedIndustry(key as IndustryType);
                            setQuickFilter(null);
                          }}
                        >
                          <span className="mr-2">{industry.icon}</span>
                          <span className="text-xs">{industry.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Filtro por densidad */}
            <div className="relative">
              <Button
                variant={selectedDensity ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter(quickFilter === 'density' ? null : 'density')}
                className="flex items-center gap-2"
              >
                {selectedDensity ? (
                  <>
                    {selectedDensity === 'alta' && <Grid3X3 className="w-4 h-4" />}
                    {selectedDensity === 'media' && <Grid2X2 className="w-4 h-4" />}
                    {selectedDensity === 'baja' && <Square className="w-4 h-4" />}
                    {selectedDensity === 'alta' ? '12 productos' : selectedDensity === 'media' ? '6 productos' : '3 productos'}
                    <X className="w-3 h-3 ml-1" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDensity(null);
                    }} />
                  </>
                ) : (
                  <>
                    <Grid2X2 className="w-4 h-4" />
                    Densidad
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </Button>
              
              {quickFilter === 'density' && (
                <Card className="absolute top-full left-0 mt-1 z-10 w-40">
                  <CardContent className="p-2">
                    {(['alta', 'media', 'baja'] as ProductDensity[]).map(density => {
                      const Icon = density === 'alta' ? Grid3X3 : density === 'media' ? Grid2X2 : Square;
                      const label = density === 'alta' ? '12 productos' : density === 'media' ? '6 productos' : '3 productos';
                      
                      return (
                        <Button
                          key={density}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedDensity(density);
                            setQuickFilter(null);
                          }}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="text-xs capitalize">{label}</span>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Acceso rápido a industrias si no está definida */}
            {!selectedIndustry && !userIndustry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIndustrySelector(true)}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Encuentra tu industria</span>
                <span className="sm:hidden">Buscar</span>
              </Button>
            )}
          </div>
        )}

        {/* Contenido de tabs */}
        <TabsContent value="recommended" className="mt-4">
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Perfectos para ti
                </h3>
                <p className="text-sm text-gray-600">
                  {userIndustry && (
                    <>Basado en tu industria ({INDUSTRY_MAP[userIndustry].name}) y </>
                  )}
                  {productCount} productos seleccionados
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {recommendations.length} sugerencias
              </Badge>
            </div>
          </div>
          
          <TemplateGallery
            templates={filteredTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={(templateId) => {
              const template = filteredTemplates.find(t => t.id === templateId);
              if (template && isTemplateAccessible(template)) {
                onTemplateSelect(templateId);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-1">
              Todos los templates
            </h3>
            <p className="text-sm text-gray-600">
              Explora toda nuestra colección de diseños
            </p>
          </div>
          
          <TemplateGallery
            templates={filteredTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={(templateId) => {
              const template = filteredTemplates.find(t => t.id === templateId);
              if (template && isTemplateAccessible(template)) {
                onTemplateSelect(templateId);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="premium" className="mt-4">
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  Templates Premium
                </h3>
                <p className="text-sm text-gray-600">
                  Diseños exclusivos con características avanzadas
                </p>
              </div>
              {userPlan === 'basic' && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Actualización requerida
                </Badge>
              )}
            </div>
            
            {userPlan === 'basic' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Actualiza a Premium para acceder a estos templates
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Incluye diseños exclusivos, más opciones de personalización y soporte prioritario
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <TemplateGallery
            templates={filteredTemplates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={(templateId) => {
              const template = filteredTemplates.find(t => t.id === templateId);
              if (template && isTemplateAccessible(template)) {
                onTemplateSelect(templateId);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Click outside para cerrar dropdowns */}
      {quickFilter && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setQuickFilter(null)}
        />
      )}
    </div>
  );
};

export default SmartTemplateSelector;