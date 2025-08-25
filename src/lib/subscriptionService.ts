// src/lib/subscriptionService.ts - VERSIÓN CORREGIDA PARA TU ESTRUCTURA
import { supabase } from '@/integrations/supabase/client';

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
  }> {
    try {
      console.log('🔍 Getting credits for user:', userId);
      
      const { data: creditUsage, error } = await supabase
        .from('credit_usage')
        .select('credits_remaining, package_id, source_type')
        .eq('user_id', userId)
        .gt('credits_remaining', 0);

      if (error) {
        console.error('❌ Error fetching credits:', error);
        return { total: 0, fromPlan: 0, fromPurchases: 0 };
      }

      if (!creditUsage || creditUsage.length === 0) {
        console.log('📭 No credits found');
        return { total: 0, fromPlan: 0, fromPurchases: 0 };
      }

      let fromPlan = 0;
      let fromPurchases = 0;

      // Obtener info de packages para determinar tipo
      const packageIds = creditUsage.map(c => c.package_id).filter(Boolean);
      let packageTypes: any = {};
      
      if (packageIds.length > 0) {
        const { data: packages } = await supabase
          .from('credit_packages')
          .select('id, package_type')
          .in('id', packageIds);
        
        packages?.forEach(pkg => {
          packageTypes[pkg.id] = pkg.package_type;
        });
      }

      creditUsage.forEach(entry => {
        const remaining = entry.credits_remaining || 0;
        const packageType = packageTypes[entry.package_id] || 'addon';
        
        if (packageType === 'monthly_plan') {
          fromPlan += remaining;
        } else {
          fromPurchases += remaining;
        }
      });

      const total = fromPlan + fromPurchases;
      console.log(`💳 Credits - Total: ${total}, Plan: ${fromPlan}, Purchased: ${fromPurchases}`);
      
      return { total, fromPlan, fromPurchases };
    } catch (error) {
      console.error('❌ Error getting credits:', error);
      return { total: 0, fromPlan: 0, fromPurchases: 0 };
    }
  }

  async getCurrentUserPlan(userId: string): Promise<{
    planName: string;
    maxUploads: number;
    maxCatalogs: number;
    isActive: boolean;
  }> {
    try {
      // Buscar plan mensual activo más reciente
      const { data: planUsage } = await supabase
        .from('credit_usage')
        .select('package_id, created_at')
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .order('created_at', { ascending: false });

      if (planUsage && planUsage.length > 0) {
        // Obtener info del package
        const { data: packages } = await supabase
          .from('credit_packages')
          .select('name, package_type, max_uploads, max_catalogs')
          .in('id', planUsage.map(p => p.package_id).filter(Boolean));

        const monthlyPlan = packages?.find(pkg => pkg.package_type === 'monthly_plan');

        if (monthlyPlan) {
          console.log('📋 Found monthly plan:', monthlyPlan.name);
          return {
            planName: monthlyPlan.name,
            maxUploads: monthlyPlan.max_uploads || 50,
            maxCatalogs: monthlyPlan.max_catalogs || 3,
            isActive: true
          };
        }
      }

      console.log('🆓 Using free plan');
      return {
        planName: 'Plan Gratuito',
        maxUploads: 10,
        maxCatalogs: 1,
        isActive: false
      };
    } catch (error) {
      console.error('❌ Error getting plan:', error);
      return {
        planName: 'Error',
        maxUploads: 0,
        maxCatalogs: 0,
        isActive: false
      };
    }
  }

  async validateUsage(userId: string): Promise<UsageValidation> {
    try {
      console.log('🔎 Validating usage for user:', userId);

      const credits = await this.getAvailableCredits(userId);
      const plan = await this.getCurrentUserPlan(userId);

      const validation: UsageValidation = {
        canUpload: true, // Por simplicidad, siempre puede subir
        canProcessBackground: credits.total > 0,
        canCreateCatalog: true, // Por simplicidad
        remainingUploads: plan.maxUploads,
        remainingBgCredits: credits.total,
        remainingCatalogs: plan.maxCatalogs === 0 ? 999 : plan.maxCatalogs,
        currentPlan: plan.planName,
        suggestCreditPurchase: !plan.isActive && credits.total < 5,
        upgradeRequired: !plan.isActive && credits.total === 0 
          ? 'Necesitas comprar créditos para procesar imágenes'
          : undefined
      };

      console.log('✅ Validation result:', validation);
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
        .select('id, credits_remaining, credits_used')
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
        
        const newCreditsUsed = (creditEntry.credits_used || 0) + canConsume;
        const newCreditsRemaining = creditEntry.credits_remaining - canConsume;

        const { error: updateError } = await supabase
          .from('credit_usage')
          .update({ 
            credits_used: newCreditsUsed,
            credits_remaining: newCreditsRemaining
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
      const { data: packageInfo } = await supabase
        .from('credit_packages')
        .select('credits, price_mxn, package_type')
        .eq('id', packageId)
        .single();

      if (!packageInfo) {
        console.error('❌ Package not found');
        return false;
      }

      const expiresAt = packageInfo.package_type === 'monthly_plan' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          package_id: packageId,
          credits_purchased: packageInfo.credits,
          credits_used: 0,
          credits_remaining: packageInfo.credits,
          amount_paid: packageInfo.price_mxn,
          usage_type: 'purchase',
          source_type: packageInfo.package_type,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('❌ Error simulating purchase:', error);
        return false;
      }

      console.log('✅ Purchase simulated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in simulate purchase:', error);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();

export const testSubscriptionService = async (userId: string) => {
  console.log('🧪 TESTING SUBSCRIPTION SERVICE');
  console.log('User ID:', userId);
  
  const validation = await subscriptionService.validateUsage(userId);
  console.log('✅ Validation:', validation);
  
  const credits = await subscriptionService.getAvailableCredits(userId);
  console.log('💳 Credits:', credits);
  
  return { validation, credits };
};