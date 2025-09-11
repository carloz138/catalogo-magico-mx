// src/lib/utils/subscription-helpers.ts
export interface PackageData {
  package_type: string;
  name: string;
  price_usd: number;
}

export type PlanLevel = 'free' | 'starter' | 'basic' | 'professional' | 'enterprise';

export const isPremiumPlan = (packageData: PackageData | null): boolean => {
  if (!packageData) return false;
  
  return packageData.package_type === 'monthly_plan' && 
         packageData.price_usd >= 1250;
};

export const getPlanLevel = (packageData: PackageData | null): PlanLevel => {
  if (!packageData || packageData.package_type !== 'monthly_plan') return 'free';
  
  const price = packageData.price_usd;
  
  if (price >= 4500) return 'enterprise';
  if (price >= 2500) return 'professional'; 
  if (price >= 1250) return 'basic';
  if (price >= 500) return 'starter';
  
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