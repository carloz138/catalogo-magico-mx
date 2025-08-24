// src/lib/subscriptionService.ts - VERSIÓN COMPATIBLE
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
  
  // 1. OBTENER CRÉDITOS DISPONIBLES DEL USUARIO
  async getAvailableCredits(userId: string): Promise<{
    total: number;
    fromPlan: number;
    fromPurchases: number;
  }> {
    try {
      console.log('🔍 Getting credits for user:', userId);
      
      // Obtener todas las entradas de credit_usage para el usuario
      const { data: creditUsage, error } = await supabase
        .from('credit_usage')
        .select(`
          credits_remaining,
          credits_used,
          credits_purchased,
          package_id,
          package:credit_packages(name, package_type)
        `)
        .eq('user_id', userId)
        .gt('credits_remaining', 0);

      if (error) {
        console.error('❌ Error fetching credits:', error);
        return { total: 0, fromPlan: 0, fromPurchases: 0 };
      }

      if (!creditUsage || creditUsage.length === 0) {
        console.log('📭 No credits found for user');
        return { total: 0, fromPlan: 0, fromPurchases: 0 };
      }

      // Separar créditos de plan vs comprados
      let fromPlan = 0;
      let fromPurchases = 0;

      creditUsage.forEach(entry => {
        const remaining = entry.credits_remaining || 0;
        
        if (entry.package?.package_type === 'monthly_plan') {
          fromPlan += remaining;
        } else {
          fromPurchases += remaining;
        }
      });

      const total = fromPlan + fromPurchases;
      
      console.log(`💳 Credits found - Total: ${total}, Plan: ${fromPlan}, Purchased: ${fromPurchases}`);
      
      return { total, fromPlan, fromPurchases };
    } catch (error) {
      console.error('❌ Error getting credits:', error);
      return { total: 0, fromPlan: 0, fromPurchases: 0 };
    }
  }

  // 2. OBTENER PLAN ACTUAL DEL USUARIO
  async getCurrentUserPlan(userId: string): Promise<{
    planName: string;
    maxUploads: number;
    maxCatalogs: number;
    isActive: boolean;
  }> {
    try {
      // Buscar si tiene un plan mensual activo
      const { data: planUsage, error } = await supabase
        .from('credit_usage')
        .select(`
          *,
          package:credit_packages(name, max_uploads, max_catalogs, package_type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching plan:', error);
        return { planName: 'Error', maxUploads: 0, maxCatalogs: 0, isActive: false };
      }

      // Buscar el plan mensual más reciente
      const monthlyPlan = planUsage?.find(entry => 
        entry.package?.package_type === 'monthly_plan'
      );

      if (monthlyPlan && monthlyPlan.package) {
        console.log('📋 Found monthly plan:', monthlyPlan.package.name);
        return {
          planName: monthlyPlan.package.name,
          maxUploads: monthlyPlan.package.max_uploads || 50,
          maxCatalogs: monthlyPlan.package.max_catalogs || 3,
          isActive: true
        };
      }

      // Default: Plan gratuito
      console.log('🆓 Using free plan');
      return {
        planName: 'Plan Gratuito',
        maxUploads: 10,
        maxCatalogs: 1,
        isActive: false
      };
    } catch (error) {
      console.error('❌ Error getting plan:', error);
      return { planName: 'Error', maxUploads: 0, maxCatalogs: 0, isActive: false };
    }
  }

  // 3. VALIDACIÓN PRINCIPAL
  async validateUsage(userId: string): Promise<UsageValidation> {
    try {
      console.log('🔎 Validating usage for user:', userId);

      const credits = await this.getAvailableCredits(userId);
      const plan = await this.getCurrentUserPlan(userId);

      // Por simplicidad, asumimos 0 uso actual (puedes implementar tracking después)
      const currentUploads = 0;
      const currentCatalogs = 0;

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

  // 4. CONSUMIR CRÉDITOS
  async consumeBackgroundRemovalCredit(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    try {
      console.log(`🔥 Attempting to consume ${creditsNeeded} credits for user ${userId}`);

      const { data: availableCredits, error } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', userId)
        .gt('credits_remaining', 0)
        .order('created_at', { ascending: true }); // FIFO

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
            credits_used: (creditEntry.credits_used || 0) + canConsume 
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

  // 5. SIMULAR COMPRA DE CRÉDITOS (para testing)
  async simulateCreditPurchase(userId: string, packageId: string): Promise<boolean> {
    try {
      console.log(`💳 Simulating purchase of package ${packageId} for user ${userId}`);

      // Obtener info del paquete
      const { data: packageInfo, error: packageError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (packageError || !packageInfo) {
        console.error('❌ Package not found:', packageError);
        return false;
      }

      // Fecha de expiración
      const expiresAt = packageInfo.package_type === 'monthly_plan' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 año

      // Insertar en credit_usage
      const { error: insertError } = await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          package_id: packageId,
          credits_purchased: packageInfo.credits,
          credits_used: 0,
          credits_remaining: packageInfo.credits,
          amount_paid: packageInfo.price_mxn * 100, // centavos
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('❌ Error inserting credit usage:', insertError);
        return false;
      }

      console.log(`✅ Successfully simulated purchase of ${packageInfo.name}`);
      return true;
    } catch (error) {
      console.error('❌ Error simulating purchase:', error);
      return false;
    }
  }

  // 6. OBTENER PACKS DISPONIBLES
  async getAvailableCreditPacks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .eq('package_type', 'addon')
        .lte('price_mxn', 500) // Solo packs razonables
        .order('price_mxn', { ascending: true });

      if (error) {
        console.error('❌ Error getting credit packs:', error);
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

// 🧪 FUNCIÓN DE TESTING
export const testSubscriptionService = async (userId: string) => {
  console.log('🧪 =================================');
  console.log('🧪 TESTING SUBSCRIPTION SERVICE');
  console.log('🧪 =================================');
  
  const credits = await subscriptionService.getAvailableCredits(userId);
  console.log('💳 Available Credits:', credits);
  
  const plan = await subscriptionService.getCurrentUserPlan(userId);
  console.log('📋 Current Plan:', plan);
  
  const validation = await subscriptionService.validateUsage(userId);
  console.log('✅ Usage Validation:', validation);
  
  console.log('🧪 =================================');
  return { credits, plan, validation };
};

