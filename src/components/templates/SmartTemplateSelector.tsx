// src/components/templates/SmartTemplateSelector.tsx
// 🧠 SELECTOR INTELIGENTE ACTUALIZADO - USA TEMPLATES V2.0 OPTIMIZADOS

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ✅ NUEVO SISTEMA DE TEMPLATES AUDITADOS
import { 
  AuditedTemplate,
  AuditedTemplateManager,
  AUDITED_TEMPLATES_V2
} from '@/lib/templates/audited-templates-v2';

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

// Tipos actualizados
type IndustryType = AuditedTemplate['industry'];
type ProductDensity = AuditedTemplate['density'];
type MainTab = 'recommended' | 'all' | 'premium';
type QuickFilter = 'industry' | 'density' | null;

interface SmartTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  userPlan?: 'basic' | 'premium';
  userIndustry?: IndustryType;
  productCount?: number;
}

// Mapeo de industrias actualizado
const INDUSTRY_MAP = {
  joyeria: { name: 'Joyería', icon: '💎' },
  moda: { name: 'Moda', icon: '👗' },
  electronica: { name: 'Electrónicos', icon: '📱' },
  ferreteria: { name: 'Ferretería', icon: '🔧' },
  floreria: { name: 'Flores', icon: '🌸' },
  cosmeticos: { name: 'Cosméticos', icon: '💄' },
  decoracion: { name: 'Decoración', icon: '🏠' },
  muebles: { name: 'Muebles', icon: '🪑' },
  general: { name: 'General', icon: '📦' }
};

// Funciones helper actualizadas para usar el nuevo sistema
const getTemplatesByIndustry = (industry: IndustryType): AuditedTemplate[] => {
  return AuditedTemplateManager.getTemplatesByIndustry(industry);
};

const getTemplatesByDensity = (density: ProductDensity): AuditedTemplate[] => {
  return AUDITED_TEMPLATES_V2.filter(template => template.density === density);
};

const getFreeTemplates = (): AuditedTemplate[] => {
  return AUDITED_TEMPLATES_V2.filter(template => !template.isPremium);
};

const getPremiumTemplates = (): AuditedTemplate[] => {
  return AUDITED_TEMPLATES_V2.filter(template => template.isPremium);
};

const getRecommendedTemplatesByProductCount = (productCount: number): AuditedTemplate[] => {
  return AuditedTemplateManager.recommendTemplatesForProducts(productCount);
};

// Helper para convertir AuditedTemplate a formato compatible con TemplateGallery
const convertToIndustryTemplate = (auditedTemplate: AuditedTemplate): any => {
  return {
    id: auditedTemplate.id,
    name: auditedTemplate.displayName,
    description: auditedTemplate.description || 'Template optimizado V2.0',
    industry: auditedTemplate.industry || 'general',
    density: auditedTemplate.density || 'media',
    isPremium: auditedTemplate.isPremium || false,
    planLevel: auditedTemplate.planLevel || 'free',
    colors: auditedTemplate.colors || {
      primary: '#007BFF',
      secondary: '#0056B3', 
      accent: '#CCE5FF',
      background: '#FFFFFF',
      text: '#2C3E50',
      cardBackground: '#F8F9FA'
    },
    productsPerPage: auditedTemplate.productsPerPage || 6,
    gridColumns: auditedTemplate.gridColumns || 3,
    tags: auditedTemplate.tags || [],
    qualityScore: auditedTemplate.qualityScore || 95,
    previewUrl: `/templates/${auditedTemplate.id}/preview.png`,
    category: auditedTemplate.category || 'modern', // ✅ AGREGADO: Esta propiedad faltaba
    
    // ✅ AGREGADOS: Propiedades que podrían estar faltando
    borderRadius: auditedTemplate.design?.borderRadius || 8,
    shadows: auditedTemplate.design?.shadows || true,
    spacing: auditedTemplate.design?.spacing || 'normal',
    typography: auditedTemplate.design?.typography || 'modern',
    
    // ✅ AGREGADO: Información que podría necesitar el preview
    showInfo: auditedTemplate.showInfo || {
      category: true,
      description: true,
      sku: false,
      specifications: false
    }
  };
};

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

  // Calcular recomendaciones inteligentes mejoradas
  const recommendations = useMemo(() => {
    const suggestions: AuditedTemplate[] = [];
    
    // 1. Priorizar por industria conocida
    if (userIndustry) {
      const industryTemplates = getTemplatesByIndustry(userIndustry);
      suggestions.push(...industryTemplates.slice(0, 3));
    }
    
    // 2. Usar recomendaciones por cantidad de productos
    const productRecommendations = getRecommendedTemplatesByProductCount(productCount)
      .filter(t => !suggestions.find(s => s.id === t.id))
      .slice(0, 3);
    suggestions.push(...productRecommendations);
    
    // 3. Agregar templates populares de alta calidad
    const highQualityTemplates = AUDITED_TEMPLATES_V2
      .filter(t => t.qualityScore >= 95 && !suggestions.find(s => s.id === t.id))
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 2);
    suggestions.push(...highQualityTemplates);
    
    return suggestions.slice(0, 6);
  }, [userIndustry, productCount]);

  // Obtener templates según tab activo y filtros
  const filteredTemplates = useMemo(() => {
    let baseTemplates: AuditedTemplate[] = [];
    
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
        baseTemplates = AuditedTemplateManager.getAllAuditedTemplates();
        break;
    }
    
    // Aplicar filtros secundarios
    if (selectedIndustry) {
      baseTemplates = baseTemplates.filter(t => 
        t.industry === selectedIndustry || t.industry === 'general'
      );
    }
    
    if (selectedDensity) {
      baseTemplates = baseTemplates.filter(t => t.density === selectedDensity);
    }
    
    // Convertir a formato compatible y ordenar por calidad
    return baseTemplates
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .map(convertToIndustryTemplate);
  }, [activeTab, selectedIndustry, selectedDensity, recommendations]);

  // Verificar acceso a template premium
  const isTemplateAccessible = (template: any) => {
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
            <Badge variant="outline" className="bg-green-50 text-green-700">
              V2.0 Optimizados
            </Badge>
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
                    {selectedDensity === 'alta' ? 'Alta densidad' : selectedDensity === 'media' ? 'Media densidad' : 'Baja densidad'}
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
                <Card className="absolute top-full left-0 mt-1 z-10 w-48">
                  <CardContent className="p-2">
                    {(['alta', 'media', 'baja'] as ProductDensity[]).map(density => {
                      const Icon = density === 'alta' ? Grid3X3 : density === 'media' ? Grid2X2 : Square;
                      const label = density === 'alta' ? 'Alta densidad' : density === 'media' ? 'Media densidad' : 'Baja densidad';
                      const desc = density === 'alta' ? '12+ productos' : density === 'media' ? '6-8 productos' : '3-4 productos';
                      
                      return (
                        <Button
                          key={density}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-auto p-2"
                          onClick={() => {
                            setSelectedDensity(density);
                            setQuickFilter(null);
                          }}
                        >
                          <div className="flex items-center w-full">
                            <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                            <div className="text-left">
                              <div className="text-xs font-medium capitalize">{label}</div>
                              <div className="text-xs text-gray-500">{desc}</div>
                            </div>
                          </div>
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {recommendations.length} sugerencias
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Score 95+
                </Badge>
              </div>
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
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Todos los templates
                </h3>
                <p className="text-sm text-gray-600">
                  Toda nuestra colección optimizada V2.0 - Sin cortes garantizado
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {AuditedTemplateManager.getAuditedTemplateStats().totalTemplates} disponibles
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {AuditedTemplateManager.getAuditedTemplateStats().perfectTemplates} perfectos
                </Badge>
              </div>
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

        <TabsContent value="premium" className="mt-4">
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  Templates Premium
                </h3>
                <p className="text-sm text-gray-600">
                  Diseños exclusivos con máxima calidad y características avanzadas
                </p>
              </div>
              <div className="flex items-center gap-2">
                {userPlan === 'basic' && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Actualización requerida
                  </Badge>
                )}
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Calidad 98+
                </Badge>
              </div>
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