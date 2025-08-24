
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
        .select('*')
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .order('created_at', { ascending: true });

      if (!creditUsage || creditUsage.length === 0) {
        return { total: 0, fromPlan: 0, fromPurchases: 0, breakdown: [] };
      }

      // For now, treat all credits the same since we don't have package relationship
      const total = creditUsage.reduce((sum, c) => sum + c.credits_remaining, 0);

      return {
        total,
        fromPlan: 0, // Will be implemented when package relationship is available
        fromPurchases: total,
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
      // Get user info from users table
      const { data: user } = await supabase
        .from('users')
        .select('current_plan, monthly_plan_credits')
        .eq('id', userId)
        .single();

      if (user) {
        return {
          planName: user.current_plan || 'Plan Gratuito',
          maxUploads: 10, // Default values
          maxCatalogs: 1,
          planCredits: user.monthly_plan_credits || 0,
          isActive: user.current_plan !== 'free'
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
            credits_used: creditEntry.credits_used + canConsume,
            credits_remaining: creditEntry.credits_remaining - canConsume
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
      const { data: creditPackage } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (!creditPackage) return false;

      const expiresAt = creditPackage.package_type === 'monthly_plan' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          credits_used: 0,
          credits_remaining: creditPackage.credits,
          usage_type: 'credit_purchase',
          description: `Compra de ${creditPackage.credits} créditos - ${creditPackage.name}`
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

    return (data || []).map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price_mxn: pkg.price_mxn,
      price_usd: pkg.price_usd || 0,
      is_active: pkg.is_active,
      package_type: 'addon' as const,
      max_uploads: pkg.max_uploads,
      max_catalogs: pkg.max_catalogs,
      duration_months: pkg.duration_months
    }));
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
