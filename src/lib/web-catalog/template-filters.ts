// lib/web-catalog/template-filters.ts
// Funciones para filtrar templates según el plan del usuario

import { WebCatalogTemplate, TemplateCategory } from './types';
import { PlanTier, getPlanFeatures } from './plan-restrictions';

// 🆕 NUEVO: Filtrar templates según el plan del usuario
export function getAvailableTemplatesForPlan(
  allTemplates: WebCatalogTemplate[],
  userTier: PlanTier
): WebCatalogTemplate[] {
  const features = getPlanFeatures(userTier);
  
  // Si puede acceder a todos, retornar todos
  if (features.canAccessAllTemplates) {
    return allTemplates;
  }
  
  // Filtrar por categorías permitidas
  return allTemplates.filter(template => 
    features.allowedTemplateCategories.includes(template.category)
  );
}

// Obtener templates bloqueados (para mostrar en el selector)
export function getLockedTemplatesForPlan(
  allTemplates: WebCatalogTemplate[],
  userTier: PlanTier
): WebCatalogTemplate[] {
  const features = getPlanFeatures(userTier);
  
  // Si puede acceder a todos, no hay bloqueados
  if (features.canAccessAllTemplates) {
    return [];
  }
  
  // Retornar templates que NO están en las categorías permitidas
  return allTemplates.filter(template => 
    !features.allowedTemplateCategories.includes(template.category)
  );
}

// Obtener templates por categoría
export function getTemplatesByCategory(
  allTemplates: WebCatalogTemplate[],
  category: TemplateCategory
): WebCatalogTemplate[] {
  return allTemplates.filter(t => t.category === category);
}

// Obtener estadísticas de templates por plan
export function getTemplateStatsByPlan(
  allTemplates: WebCatalogTemplate[],
  userTier: PlanTier
) {
  const available = getAvailableTemplatesForPlan(allTemplates, userTier);
  const locked = getLockedTemplatesForPlan(allTemplates, userTier);
  
  // Contar por categoría
  const basicCount = available.filter(t => t.category === 'basic').length;
  const standardCount = available.filter(t => t.category === 'standard').length;
  const seasonalCount = available.filter(t => t.category === 'seasonal').length;
  
  const lockedSeasonalCount = locked.filter(t => t.category === 'seasonal').length;
  
  return {
    available: {
      total: available.length,
      basic: basicCount,
      standard: standardCount,
      seasonal: seasonalCount
    },
    locked: {
      total: locked.length,
      seasonal: lockedSeasonalCount
    },
    templates: {
      available,
      locked
    }
  };
}

// Verificar si un template específico está disponible
export function isTemplateAvailable(
  template: WebCatalogTemplate,
  userTier: PlanTier
): boolean {
  const features = getPlanFeatures(userTier);
  
  if (features.canAccessAllTemplates) {
    return true;
  }
  
  return features.allowedTemplateCategories.includes(template.category);
}

// Obtener el plan mínimo requerido para un template
export function getMinimumPlanForTemplate(
  template: WebCatalogTemplate
): PlanTier {
  switch (template.category) {
    case 'basic':
      return 'free'; // Disponible para todos
    case 'standard':
      return 'basic'; // Requiere Plan Básico IA o superior
    case 'seasonal':
      return 'professional'; // Requiere Plan Profesional o superior
    default:
      return 'free';
  }
}

// Obtener mensaje de por qué está bloqueado un template
export function getTemplateBlockedMessage(
  template: WebCatalogTemplate,
  userTier: PlanTier
): string {
  const minPlan = getMinimumPlanForTemplate(template);
  
  if (template.category === 'seasonal') {
    return '🎨 Los templates de temporada están disponibles en Plan Profesional y Empresarial';
  }
  
  if (template.category === 'standard') {
    return '✨ Actualiza a Plan Básico IA o superior para acceder a este template';
  }
  
  return 'Este template no está disponible en tu plan actual';
}

// Para el UI: agrupar templates disponibles y bloqueados
export function groupTemplatesForDisplay(
  allTemplates: WebCatalogTemplate[],
  userTier: PlanTier
) {
  const stats = getTemplateStatsByPlan(allTemplates, userTier);
  
  return {
    basic: {
      available: stats.templates.available.filter(t => t.category === 'basic'),
      locked: []
    },
    standard: {
      available: stats.templates.available.filter(t => t.category === 'standard'),
      locked: stats.templates.locked.filter(t => t.category === 'standard')
    },
    seasonal: {
      available: stats.templates.available.filter(t => t.category === 'seasonal'),
      locked: stats.templates.locked.filter(t => t.category === 'seasonal')
    },
    stats
  };
}
