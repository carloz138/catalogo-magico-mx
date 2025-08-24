
// src/lib/subscriptionService.ts
import { supabase } from '@/integrations/supabase/client';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_mxn: number;
  price_usd: number;
  is_active: boolean;
  package_type?: 'monthly_plan' | 'addon';
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
      console.log('🔍 Getting credits for user:', userId);
      
      const { data: creditUsage, error } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching credits:', error);
        return { total: 0, fromPlan: 0, fromPurchases: 0, breakdown: [] };
      }

      if (!creditUsage || creditUsage.length === 0) {
        console.log('📭 No credits found for user');
        return { total: 0, fromPlan: 0, fromPurchases: 0, breakdown: [] };
      }

      // For now, treat all credits as purchases since we don't have package relation
      const total = creditUsage.reduce((sum, c) => sum + c.credits_remaining, 0);
      
      console.log(`💳 Total credits found: ${total}`);
      
      return {
        total,
        fromPlan: 0, // TODO: Implement when package relation is available
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
      // Since we don't have package relations yet, check user preferences or use defaults
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // For now, return free plan defaults
      console.log('🆓 Using free plan (no package system implemented yet)');
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
      console.log('🔎 Validating usage for user:', userId);

      const credits = await this.getAvailableCredits(userId);
      const plan = await this.getCurrentUserPlan(userId);

      // Get current usage counts
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', userId);

      const { data: catalogs } = await supabase
        .from('catalogs')
        .select('id')
        .eq('user_id', userId);

      const currentUploads = products?.length || 0;
      const currentCatalogs = catalogs?.length || 0;

      const validation: UsageValidation = {
        canUpload: currentUploads < plan.maxUploads,
        canProcessBackground: credits.total > 0,
        canCreateCatalog: plan.maxCatalogs === 0 || currentCatalogs < plan.maxCatalogs,
        remainingUploads: Math.max(0, plan.maxUploads - currentUploads),
        remainingBgCredits: credits.total,
        remainingCatalogs: plan.maxCatalogs === 0 ? 999 : Math.max(0, plan.maxCatalogs - currentCatalogs),
        currentPlan: plan.planName,
        suggestCreditPurchase: !plan.isActive && credits.total < 5,
        upgradeRequired: !plan.isActive && credits.total === 0 
          ? 'Necesitas comprar créditos o un plan para procesar imágenes'
          : undefined
      };

      console.log('✅ Validation complete:', validation);
      return validation;
    } catch (error) {
      console.error('❌ Error validating usage:', error);
      return {
        canUpload: false,
        canProcessBackground: false,
        canCreateCatalog: false,
        remainingUploads: 0,
        remainingBgCredits: 0,
        remainingCatalogs: 0,
        currentPlan: 'Error'
      };
    }
  }

  async consumeBackgroundRemovalCredit(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    try {
      console.log(`🔥 Consuming ${creditsNeeded} credits for user ${userId}`);

      const { data: availableCredits, error } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .order('created_at', { ascending: true });

      if (error || !availableCredits || availableCredits.length === 0) {
        console.log('❌ No credits available');
        return false;
      }

      let creditsStillNeeded = creditsNeeded;

      for (const creditEntry of availableCredits) {
        if (creditsStillNeeded <= 0) break;

        const canConsume = Math.min(creditsStillNeeded, creditEntry.credits_remaining);
        
        const { error: updateError } = await supabase
          .from('credit_usage')
          .update({ 
            credits_used: (creditEntry.credits_used || 0) + canConsume,
            credits_remaining: creditEntry.credits_remaining - canConsume
          })
          .eq('id', creditEntry.id);

        if (updateError) {
          console.error('❌ Error updating credits:', updateError);
          return false;
        }

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
      console.log(`💳 Simulating purchase for user ${userId}, package ${packageId}`);

      const { data: packageInfo, error: packageError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (packageError || !packageInfo) {
        console.error('❌ Package not found');
        return false;
      }

      // Create credit usage record
      const { error: insertError } = await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          credits_used: 0,
          credits_remaining: packageInfo.credits,
          usage_type: 'credit_purchase',
          description: `Compra de ${packageInfo.credits} créditos - ${packageInfo.name}`
        });

      if (insertError) {
        console.error('❌ Error inserting credit usage:', insertError);
        return false;
      }

      console.log(`✅ Successfully simulated purchase of ${packageInfo.credits} credits`);
      return true;
    } catch (error) {
      console.error('❌ Error simulating purchase:', error);
      return false;
    }
  }

  async getAvailableCreditPacks(): Promise<CreditPackage[]> {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_mxn', { ascending: true });

      if (error) {
        console.error('❌ Error fetching credit packages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting credit packs:', error);
      return [];
    }
  }
}

export const subscriptionService = new SubscriptionService();

export const testSubscriptionService = async (userId: string) => {
  console.log('🧪 TESTING SUBSCRIPTION SERVICE');
  
  const credits = await subscriptionService.getAvailableCredits(userId);
  console.log('💳 Credits:', credits);
  
  const plan = await subscriptionService.getCurrentUserPlan(userId);
  console.log('📋 Plan:', plan);
  
  const validation = await subscriptionService.validateUsage(userId);
  console.log('✅ Validation:', validation);
  
  return { credits, plan, validation };
};
