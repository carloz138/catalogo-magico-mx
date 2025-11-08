// src/lib/utils/subscription-helpers.ts
export interface PackageData {
  package_type: string;
  name: string;
  price_usd: number;
}

export type PlanLevel = 'free' | 'starter' | 'basic' | 'professional' | 'enterprise';

export const isPremiumPlan = (packageData: PackageData | null): boolean => {
  if (!packageData) return false;
  
  // Precios en centavos: >= $12.50 USD es premium
  return packageData.package_type === 'monthly_plan' && 
         packageData.price_usd >= 1250;
};

export const getPlanLevel = (packageData: PackageData | null): PlanLevel => {
  if (!packageData || packageData.package_type !== 'monthly_plan') return 'free';
  
  // Precios en centavos en la DB
  const priceInCents = packageData.price_usd;
  
  // Plan Empresarial IA: $64.95+ USD (6495+ centavos)
  if (priceInCents >= 6495) return 'enterprise';
  
  // Plan Profesional IA: $29.95+ USD (2995+ centavos)
  if (priceInCents >= 2995) return 'professional'; 
  
  // Plan Básico IA: $14.95+ USD (1495+ centavos)
  if (priceInCents >= 1495) return 'basic';
  
  // Plan Catálogos: $4.95+ USD (495+ centavos)
  if (priceInCents >= 495) return 'starter';
  
  return 'free';
};

export const getPlanPermissions = (packageData: PackageData | null) => {
  const level = getPlanLevel(packageData);
  
  return {
    basicTemplates: true,
    premiumTemplates: level !== 'free' && level !== 'starter',
    seasonalTemplates: ['professional', 'enterprise'].includes(level),
    exclusiveTemplates: level === 'enterprise',
    customBranding: ['professional', 'enterprise'].includes(level),
    animatedElements: level === 'enterprise',
    prioritySupport: level === 'enterprise'
  };
};