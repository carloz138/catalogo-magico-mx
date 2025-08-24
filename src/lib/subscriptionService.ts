
// src/lib/subscriptionService.ts
import { supabase } from '@/integrations/supabase/client';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_mxn: number;
  price_usd: number;
  is_active: boolean;
  package_type: 'monthly_plan' | 'addon';
  max_uploads?: number;
  max_catalogs?: number;
  duration_months?: number;
}

export interface UsageValidation {
  canUpload: boolean;
  canProcessBackground: boolean;
  canCreateCatalog: boolean;
  remainingUploads: number;
  remainingBgCredits: number;
  remainingCatalogs: number;
  currentPlan: string;
  upgradeRequired?: string;
  suggestCreditPurchase?: boolean;
}

class SubscriptionService {
  
  async getAvailableCredits(userId: string): Promise<{
    total: number;
    fromPlan: number;
    fromPurchases: number;
    breakdown: any[];
  }> {
    try {
      const { data: creditUsage } = await supabase
        .from('credit_usage')
        .select(`
          *,
          package:credit_packages(name, package_type)
        `)
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .order('created_at', { ascending: true });

      if (!creditUsage || creditUsage.length === 0) {
        return { total: 0, fromPlan: 0, fromPurchases: 0, breakdown: [] };
      }

      const fromPlan = creditUsage
        .filter(c => c.package?.package_type === 'monthly_plan')
        .reduce((sum, c) => sum + c.credits_remaining, 0);

      const fromPurchases = creditUsage
        .filter(c => c.package?.package_type === 'addon')
        .reduce((sum, c) => sum + c.credits_remaining, 0);

      return {
        total: fromPlan + fromPurchases,
        fromPlan,
        fromPurchases,
        breakdown: creditUsage
      };
    } catch (error) {
      console.error('❌ Error getting credits:', error);
      return { total: 0, fromPlan: 0, fromPurchases: 0, breakdown: [] };
    }
  }

  async getCurrentUserPlan(userId: string): Promise<{
    planName: string;
    maxUploads: number;
    maxCatalogs: number;
    planCredits: number;
    isActive: boolean;
  }> {
    try {
      const { data: planUsage } = await supabase
        .from('credit_usage')
        .select(`
          *,
          package:credit_packages(*)
        `)
        .eq('user_id', userId)
        .is('expired_at', null)
        .order('created_at', { ascending: false });

      const monthlyPlan = planUsage?.find(u => u.package?.package_type === 'monthly_plan');

      if (monthlyPlan && monthlyPlan.package) {
        return {
          planName: monthlyPlan.package.name,
          maxUploads: monthlyPlan.package.max_uploads || 10,
          maxCatalogs: monthlyPlan.package.max_catalogs || 1,
          planCredits: monthlyPlan.credits_remaining,
          isActive: true
        };
      }

      return {
        planName: 'Plan Gratuito',
        maxUploads: 10,
        maxCatalogs: 1,
        planCredits: 0,
        isActive: false
      };
    } catch (error) {
      console.error('❌ Error getting user plan:', error);
      return {
        planName: 'Error',
        maxUploads: 0,
        maxCatalogs: 0,
        planCredits: 0,
        isActive: false
      };
    }
  }

  async validateUsage(userId: string): Promise<UsageValidation> {
    try {
      const plan = await this.getCurrentUserPlan(userId);
      const credits = await this.getAvailableCredits(userId);

      const currentUploads = 0; // TODO: Implementar tracking
      const currentCatalogs = 0; // TODO: Implementar tracking

      return {
        canUpload: currentUploads < plan.maxUploads,
        canProcessBackground: credits.total > 0,
        canCreateCatalog: plan.maxCatalogs === 0 || currentCatalogs < plan.maxCatalogs,
        remainingUploads: Math.max(0, plan.maxUploads - currentUploads),
        remainingBgCredits: credits.total,
        remainingCatalogs: plan.maxCatalogs === 0 ? 999 : Math.max(0, plan.maxCatalogs - currentCatalogs),
        currentPlan: plan.planName,
        suggestCreditPurchase: credits.total < 5,
        upgradeRequired: !plan.isActive && credits.total === 0 
          ? 'Necesitas un plan o créditos para procesar imágenes' 
          : undefined
      };
    } catch (error) {
      console.error('❌ Error validating usage:', error);
      return {
        canUpload: false,
        canProcessBackground: false,
        canCreateCatalog: false,
        remainingUploads: 0,
        remainingBgCredits: 0,
        remainingCatalogs: 0,
        currentPlan: 'Error',
        upgradeRequired: 'Error de sistema'
      };
    }
  }

  async consumeBackgroundRemovalCredit(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    try {
      console.log(`🔥 Consuming ${creditsNeeded} credits for user ${userId}`);

      const { data: availableCredits } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .is('expired_at', null)
        .order('created_at', { ascending: true });

      if (!availableCredits || availableCredits.length === 0) {
        console.log('❌ No credits available');
        return false;
      }

      let creditsStillNeeded = creditsNeeded;

      for (const creditEntry of availableCredits) {
        if (creditsStillNeeded <= 0) break;

        const canConsume = Math.min(creditsStillNeeded, creditEntry.credits_remaining);
        
        const { error } = await supabase
          .from('credit_usage')
          .update({ 
            credits_used: creditEntry.credits_used + canConsume 
          })
          .eq('id', creditEntry.id);

        if (error) throw error;

        creditsStillNeeded -= canConsume;
        console.log(`✅ Consumed ${canConsume} credits, ${creditsStillNeeded} remaining`);
      }

      return creditsStillNeeded === 0;
    } catch (error) {
      console.error('❌ Error consuming credits:', error);
      return false;
    }
  }

  async simulateCreditPurchase(userId: string, packageId: string): Promise<boolean> {
    try {
      const { data: package } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (!package) return false;

      const expiresAt = package.package_type === 'monthly_plan' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          package_id: packageId,
          credits_purchased: package.credits,
          credits_used: 0,
          credits_remaining: package.credits,
          amount_paid: package.price_mxn * 100,
          expires_at: expiresAt.toISOString()
        });

      return !error;
    } catch (error) {
      console.error('❌ Error simulating purchase:', error);
      return false;
    }
  }

  async getAvailableCreditPacks(): Promise<CreditPackage[]> {
    const { data } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .eq('package_type', 'addon')
      .lte('price_mxn', 500)
      .order('price_mxn', { ascending: true });

    return data || [];
  }
}

export const subscriptionService = new SubscriptionService();

export const testSubscriptionService = async (userId: string) => {
  console.log('🧪 TESTING SUBSCRIPTION SERVICE');
  
  const validation = await subscriptionService.validateUsage(userId);
  console.log('📊 Validation:', validation);
  
  const credits = await subscriptionService.getAvailableCredits(userId);
  console.log('💳 Credits:', credits);
  
  const plan = await subscriptionService.getCurrentUserPlan(userId);
  console.log('📋 Plan:', plan);
  
  return { validation, credits, plan };
};
