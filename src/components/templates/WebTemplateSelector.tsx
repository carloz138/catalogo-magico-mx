// src/components/templates/WebTemplateSelector.tsx
// Selector de templates web con restricciones por plan

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Check, Sparkles, Crown, Zap, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WebTemplatePreviewModal } from './WebTemplatePreviewModal';

// Imports del sistema web-catalog
import { EXPANDED_WEB_TEMPLATES } from '@/lib/web-catalog/expanded-templates-catalog';
import { 
  getAvailableTemplatesForPlan, 
  getLockedTemplatesForPlan,
  getTemplateStatsByPlan,
  isTemplateAvailable,
  getTemplateBlockedMessage
} from '@/lib/web-catalog/template-filters';
import { 
  getUserPlanTier, 
  getPlanFeatures, 
  type PlanTier 
} from '@/lib/web-catalog/plan-restrictions';
import type { WebCatalogTemplate } from '@/lib/web-catalog/types';

interface WebTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  userPlanId?: string;
  userPlanName?: string;
  productCount?: number;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'basic': return Zap;
    case 'standard': return Sparkles;
    case 'seasonal': return Crown;
    default: return Sparkles;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'basic': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'standard': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'seasonal': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const WebTemplateSelector: React.FC<WebTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  userPlanId,
  userPlanName,
  productCount = 0
}) => {
  const [userTier, setUserTier] = useState<PlanTier>('free');
  const [availableTemplates, setAvailableTemplates] = useState<WebCatalogTemplate[]>([]);
  const [lockedTemplates, setLockedTemplates] = useState<WebCatalogTemplate[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WebCatalogTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadTemplatesForUser();
  }, [userPlanId, userPlanName]);

  const loadTemplatesForUser = () => {
    // Determinar el tier del usuario
    const tier = getUserPlanTier(userPlanId, userPlanName);
    setUserTier(tier);

    // Obtener features del plan
    const features = getPlanFeatures(tier);
    
    // Filtrar templates disponibles y bloqueados
    const available = getAvailableTemplatesForPlan(EXPANDED_WEB_TEMPLATES, tier);
    const locked = getLockedTemplatesForPlan(EXPANDED_WEB_TEMPLATES, tier);
    const templateStats = getTemplateStatsByPlan(EXPANDED_WEB_TEMPLATES, tier);

    setAvailableTemplates(available);
    setLockedTemplates(locked);
    setStats(templateStats);

    console.log('📊 Templates cargados:', {
      tier,
      features,
      disponibles: available.length,
      bloqueados: locked.length,
      stats: templateStats
    });
  };

  const handleSelectTemplate = (template: WebCatalogTemplate) => {
    const available = isTemplateAvailable(template, userTier);
    
    if (!available) {
      console.log('❌ Template bloqueado:', template.id);
      return;
    }

    onTemplateSelect(template.id);
  };

  const handleOpenPreview = (template: WebCatalogTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const renderTemplateCard = (template: WebCatalogTemplate, isLocked: boolean) => {
    const Icon = getCategoryIcon(template.category);
    const isSelected = selectedTemplate === template.id;

    return (
      <Card
        key={template.id}
        className={cn(
          'group cursor-pointer transition-all hover:shadow-lg border-2',
          isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50',
          isLocked && 'opacity-60 cursor-not-allowed'
        )}
        onClick={() => !isLocked && handleSelectTemplate(template)}
      >
        <CardContent className="p-4">
          {/* Preview Image */}
          <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-muted">
            {template.thumbnail ? (
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Preview
              </div>
            )}
            
            {/* Preview button overlay - aparece en hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg"
                onClick={(e) => handleOpenPreview(template, e)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
            </div>
            
            {/* Lock overlay */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center text-white">
                  <Lock className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs font-medium">Actualiza tu plan</p>
                </div>
              </div>
            )}

            {/* Selected indicator */}
            {isSelected && !isLocked && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                <Check className="h-4 w-4" />
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-2 left-2 z-10">
              <Badge 
                variant="secondary" 
                className={cn('text-xs', getCategoryColor(template.category))}
              >
                <Icon className="h-3 w-3 mr-1" />
                {template.category}
              </Badge>
            </div>
          </div>

          {/* Template info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm leading-tight">
                {template.name}
              </h4>
              {template.isPremium && (
                <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </p>

            {/* Features badges */}
            {template.features && template.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.features.slice(0, 2).map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Locked message */}
          {isLocked && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {getTemplateBlockedMessage(template, userTier)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Templates Web Disponibles</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona el diseño para tu catálogo digital de {productCount} productos
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <p className="text-sm font-medium">
              {stats.available.total} de {EXPANDED_WEB_TEMPLATES.length} disponibles
            </p>
            <p className="text-xs text-muted-foreground">
              Plan: {getPlanFeatures(userTier).displayName}
            </p>
          </div>
        )}
      </div>

      {/* Alert si hay templates bloqueados */}
      {lockedTemplates.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tienes {lockedTemplates.length} template{lockedTemplates.length > 1 ? 's' : ''} bloqueado{lockedTemplates.length > 1 ? 's' : ''}. 
            Actualiza tu plan para acceder a más diseños.
          </AlertDescription>
        </Alert>
      )}

      {/* Templates disponibles */}
      {availableTemplates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Disponibles en tu plan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTemplates.map(template => renderTemplateCard(template, false))}
          </div>
        </div>
      )}

      {/* Templates bloqueados (mostrar solo algunos para no saturar) */}
      {lockedTemplates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Templates Premium ({lockedTemplates.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedTemplates.slice(0, 6).map(template => renderTemplateCard(template, true))}
          </div>
          {lockedTemplates.length > 6 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Y {lockedTemplates.length - 6} templates más...
            </p>
          )}
        </div>
      )}

      {/* No hay templates disponibles (no debería pasar) */}
      {availableTemplates.length === 0 && lockedTemplates.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay templates disponibles. Por favor contacta a soporte.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Modal */}
      <WebTemplatePreviewModal
        template={previewTemplate}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onSelect={onTemplateSelect}
        isLocked={previewTemplate ? !isTemplateAvailable(previewTemplate, userTier) : false}
        isSelected={previewTemplate?.id === selectedTemplate}
      />
    </div>
  );
};

export default WebTemplateSelector;
