// lib/web-catalog/plan-restrictions.ts
// Sistema completo de restricción de features por plan

import { TemplateCategory } from './types';

export type PlanTier = 'free' | 'catalogs' | 'basic' | 'professional' | 'enterprise';

export interface PlanFeatures {
  tier: PlanTier;
  displayName: string;
  
  // Templates - NUEVO SISTEMA
  allowedTemplateCategories: TemplateCategory[]; // 🆕 Categorías permitidas
  canAccessAllTemplates: boolean;
  hasWatermark: boolean;
  
  // Catálogos
  maxActiveCatalogs: number; // 0 = ilimitado
  
  // Funcionalidades
  hasQuotation: boolean; // Puede cotizar o solo mostrar
  canCustomizeColors: boolean;
  canUsePrivateCatalogs: boolean;
  
  // Branding
  showPoweredBy: boolean; // "Creado con [TuApp]"
  canRemoveBranding: boolean;
  
  // Productos
  maxProductsPerCatalog: number; // 0 = ilimitado
  
  // Analytics
  analyticsLevel: 'none' | 'basic' | 'advanced' | 'pro';
}

// Mapeo de IDs de planes a tiers (precios en DB están en centavos)
export const PLAN_ID_TO_TIER: Record<string, PlanTier> = {
  '8d9c9971-53a4-4dfb-abe3-df531e31b1a3': 'free',           // Plan Gratis
  '43fae58b-bb42-4752-8722-36be3fc863c8': 'catalogs',       // Plan Catálogos - $4.95 USD / $99 MXN
  '7f4ea9f7-2ea4-4dd6-bfc0-b9ee7df1ae53': 'basic',          // Plan Básico IA - $14.95 USD / $299 MXN
  'b4fd4d39-8225-46c6-904f-20815e7c0b4e': 'professional',   // Plan Profesional IA - $29.95 USD / $599 MXN
  '0bacec4c-1316-4890-a309-44ebd357552b': 'enterprise'      // Plan Empresarial IA - $64.95 USD / $1,299 MXN
};

// También por nombre (backup)
export const PLAN_NAME_TO_TIER: Record<string, PlanTier> = {
  'Plan Gratis': 'free',
  'Plan Catálogos': 'catalogs',
  'Plan Básico IA': 'basic',
  'Plan Profesional IA': 'professional',
  'Plan Empresarial IA': 'enterprise'
};

// Configuración de features por plan
export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    tier: 'free',
    displayName: 'Plan Gratis',
    allowedTemplateCategories: ['basic'], // 🆕 Solo básico
    canAccessAllTemplates: false,
    hasWatermark: true,
    maxActiveCatalogs: 1,
    hasQuotation: false,
    canCustomizeColors: false,
    canUsePrivateCatalogs: false,
    showPoweredBy: true,
    canRemoveBranding: false,
    maxProductsPerCatalog: 50,
    analyticsLevel: 'none'
  },
  
  // Plan Catálogos - $4.95 USD - 1 catálogo, 30 uploads, 0 créditos IA
  catalogs: {
    tier: 'catalogs',
    displayName: 'Plan Catálogos',
    allowedTemplateCategories: ['basic'],
    canAccessAllTemplates: false,
    hasWatermark: true,
    maxActiveCatalogs: 1, // max_catalogs en DB
    hasQuotation: true, // has_quotation en DB
    canCustomizeColors: false,
    canUsePrivateCatalogs: false,
    showPoweredBy: true,
    canRemoveBranding: false,
    maxProductsPerCatalog: 30, // max_uploads en DB
    analyticsLevel: 'basic' // analytics_level en DB
  },
  
  // Plan Básico IA - $14.95 USD - 5 catálogos, 100 uploads, 30 créditos IA
  basic: {
    tier: 'basic',
    displayName: 'Plan Básico IA',
    allowedTemplateCategories: ['basic', 'standard'],
    canAccessAllTemplates: false,
    hasWatermark: false,
    maxActiveCatalogs: 5, // max_catalogs en DB
    hasQuotation: true, // has_quotation en DB
    canCustomizeColors: false,
    canUsePrivateCatalogs: false,
    showPoweredBy: false,
    canRemoveBranding: true,
    maxProductsPerCatalog: 100, // max_uploads en DB
    analyticsLevel: 'advanced' // analytics_level en DB
  },
  
  // Plan Profesional IA - $29.95 USD - 30 catálogos, 300 uploads, 100 créditos IA
  professional: {
    tier: 'professional',
    displayName: 'Plan Profesional IA',
    allowedTemplateCategories: ['basic', 'standard', 'seasonal'],
    canAccessAllTemplates: true,
    hasWatermark: false,
    maxActiveCatalogs: 30, // max_catalogs en DB
    hasQuotation: true, // has_quotation en DB
    canCustomizeColors: true,
    canUsePrivateCatalogs: true,
    showPoweredBy: false,
    canRemoveBranding: true,
    maxProductsPerCatalog: 300, // max_uploads en DB
    analyticsLevel: 'pro' // analytics_level en DB
  },
  
  // Plan Empresarial IA - $64.95 USD - ilimitados, 1000 uploads, 300 créditos IA
  enterprise: {
    tier: 'enterprise',
    displayName: 'Plan Empresarial IA',
    allowedTemplateCategories: ['basic', 'standard', 'seasonal'],
    canAccessAllTemplates: true,
    hasWatermark: false,
    maxActiveCatalogs: 0, // max_catalogs: 0 en DB = ilimitado
    hasQuotation: true, // has_quotation en DB
    canCustomizeColors: true,
    canUsePrivateCatalogs: true,
    showPoweredBy: false,
    canRemoveBranding: true,
    maxProductsPerCatalog: 1000, // max_uploads en DB
    analyticsLevel: 'pro' // analytics_level en DB
  }
};

// Helper para obtener el tier del usuario
export function getUserPlanTier(
  planId?: string, 
  planName?: string
): PlanTier {
  if (planId && PLAN_ID_TO_TIER[planId]) {
    return PLAN_ID_TO_TIER[planId];
  }
  
  if (planName && PLAN_NAME_TO_TIER[planName]) {
    return PLAN_NAME_TO_TIER[planName];
  }
  
  // Default: free
  return 'free';
}

// Helper para obtener features del plan
export function getPlanFeatures(tier: PlanTier): PlanFeatures {
  return PLAN_FEATURES[tier];
}

// 🆕 NUEVO: Verificar si el usuario puede usar un template por categoría
export function canUseTemplate(
  templateCategory: TemplateCategory,
  userTier: PlanTier
): boolean {
  const features = PLAN_FEATURES[userTier];
  
  // Si puede acceder a todos, return true
  if (features.canAccessAllTemplates) {
    return true;
  }
  
  // Verificar si la categoría está permitida
  return features.allowedTemplateCategories.includes(templateCategory);
}

// 🆕 NUEVO: Obtener conteo de templates disponibles por plan
export function getTemplateCountForPlan(tier: PlanTier): {
  basic: number;
  standard: number;
  seasonal: number;
  total: number;
} {
  const features = PLAN_FEATURES[tier];
  const counts = {
    basic: features.allowedTemplateCategories.includes('basic') ? 1 : 0,
    standard: features.allowedTemplateCategories.includes('standard') ? 8 : 0,
    seasonal: features.allowedTemplateCategories.includes('seasonal') ? 7 : 0,
    total: 0
  };
  
  counts.total = counts.basic + counts.standard + counts.seasonal;
  return counts;
}

// Verificar si puede crear más catálogos
export function canCreateMoreCatalogs(
  currentActiveCatalogs: number,
  userTier: PlanTier
): { allowed: boolean; message?: string } {
  const features = PLAN_FEATURES[userTier];
  
  // Ilimitado
  if (features.maxActiveCatalogs === 0) {
    return { allowed: true };
  }
  
  // Verificar límite
  if (currentActiveCatalogs >= features.maxActiveCatalogs) {
    return {
      allowed: false,
      message: `Has alcanzado el límite de ${features.maxActiveCatalogs} catálogo(s) activo(s). Actualiza tu plan para crear más.`
    };
  }
  
  return { allowed: true };
}

// Verificar si puede agregar más productos
export function canAddMoreProducts(
  currentProductCount: number,
  userTier: PlanTier
): { allowed: boolean; message?: string } {
  const features = PLAN_FEATURES[userTier];
  
  // Ilimitado
  if (features.maxProductsPerCatalog === 0) {
    return { allowed: true };
  }
  
  if (currentProductCount >= features.maxProductsPerCatalog) {
    return {
      allowed: false,
      message: `Este catálogo ha alcanzado el límite de ${features.maxProductsPerCatalog} productos. Actualiza tu plan para agregar más.`
    };
  }
  
  return { allowed: true };
}

// Obtener mensaje de upgrade
export function getUpgradeMessage(
  currentTier: PlanTier,
  feature: 'templates' | 'seasonal_templates' | 'quotation' | 'catalogs' | 'products' | 'branding'
): string {
  const upgradeToTier = currentTier === 'basic' || currentTier === 'catalogs' || currentTier === 'free' 
    ? 'professional' 
    : 'enterprise';
  
  const messages = {
    templates: `Actualiza al Plan ${PLAN_FEATURES[upgradeToTier].displayName} para acceder a más templates`,
    seasonal_templates: `Los templates de temporada están disponibles en Plan Profesional y Empresarial`,
    quotation: `Actualiza al Plan ${PLAN_FEATURES[upgradeToTier].displayName} para habilitar el sistema de cotización`,
    catalogs: `Actualiza tu plan para crear más catálogos activos`,
    products: `Actualiza tu plan para agregar más productos por catálogo`,
    branding: `Actualiza al Plan ${PLAN_FEATURES[upgradeToTier].displayName} para remover el branding`
  };
  
  return messages[feature];
}

// Comparador de planes
export function getPlanComparison() {
  return {
    free: PLAN_FEATURES.free,
    catalogs: PLAN_FEATURES.catalogs,
    basic: PLAN_FEATURES.basic,
    professional: PLAN_FEATURES.professional,
    enterprise: PLAN_FEATURES.enterprise
  };
}

// Para mostrar en el UI qué features tiene cada plan
export function getPlanFeaturesList(tier: PlanTier) {
  const features = PLAN_FEATURES[tier];
  const templateCounts = getTemplateCountForPlan(tier);
  
  return [
    {
      feature: 'Catálogos activos',
      value: features.maxActiveCatalogs === 0 
        ? 'Ilimitados' 
        : `${features.maxActiveCatalogs}`,
      icon: 'BookOpen'
    },
    {
      feature: 'Templates disponibles',
      value: features.canAccessAllTemplates 
        ? `Todos (${templateCounts.total})`
        : `${templateCounts.total} templates`,
      icon: 'Palette'
    },
    {
      feature: 'Sistema de cotización',
      value: features.hasQuotation ? 'Incluido' : 'No disponible',
      icon: features.hasQuotation ? 'CheckCircle' : 'XCircle',
      enabled: features.hasQuotation
    },
    {
      feature: 'Productos por catálogo',
      value: features.maxProductsPerCatalog === 0 
        ? 'Ilimitados' 
        : `Hasta ${features.maxProductsPerCatalog}`,
      icon: 'Package'
    },
    {
      feature: 'Marca de agua',
      value: features.hasWatermark ? 'Sí' : 'No',
      icon: features.hasWatermark ? 'Droplet' : 'Droplets',
      enabled: !features.hasWatermark
    },
    {
      feature: 'Catálogos privados',
      value: features.canUsePrivateCatalogs ? 'Sí' : 'No',
      icon: features.canUsePrivateCatalogs ? 'Lock' : 'Unlock',
      enabled: features.canUsePrivateCatalogs
    },
    {
      feature: 'Personalización de colores',
      value: features.canCustomizeColors ? 'Sí' : 'No',
      icon: 'Palette',
      enabled: features.canCustomizeColors
    },
    {
      feature: 'Branding',
      value: features.showPoweredBy ? 'Incluye "Creado con..."' : 'Sin branding',
      icon: 'Award',
      enabled: !features.showPoweredBy
    },
    {
      feature: 'Analytics',
      value: features.analyticsLevel === 'none' ? 'Sin analytics' :
             features.analyticsLevel === 'basic' ? 'Analytics básicas' :
             features.analyticsLevel === 'advanced' ? 'Analytics avanzadas' :
             'Analytics profesionales',
      icon: 'BarChart',
      enabled: features.analyticsLevel !== 'none'
    }
  ];
}
