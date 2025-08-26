// src/lib/subscriptionService.ts - VERSIÓN FINAL SIN ERRORES
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
  
      async getAvailableCredits(userId: string): Promise<number> {
      try {
        console.log('🔍 Getting credits for user:', userId);
        
        // CAMBIO: Obtener la entrada más reciente por fecha (último saldo conocido)
        const { data, error } = await supabase
          .from('credit_usage')
          .select('credits_remaining')
          .eq('user_id', userId)
          .gt('credits_remaining', 0)
          .order('created_at', { ascending: false }) // Más reciente primero
          .limit(1); // Solo la entrada más reciente
    
        if (error) {
          console.error('❌ Error fetching credits:', error);
          return 0;
        }
    
        // CAMBIO: Tomar solo el saldo más reciente, no sumar todas las entradas
        const total = data?.[0]?.credits_remaining || 0;
        console.log('💳 Latest credit balance found:', total);
        
        return total;
      } catch (error) {
        console.error('❌ Error getting credits:', error);
        return 0;
      }
    }

  async validateUsage(userId: string): Promise<UsageValidation> {
    try {
      console.log('🔎 Validating usage for user:', userId);

      const credits = await this.getAvailableCredits(userId);

      const validation: UsageValidation = {
        canUpload: true, 
        canProcessBackground: credits > 0,
        canCreateCatalog: true,
        remainingUploads: 10, // Por simplicidad, valor fijo por ahora
        remainingBgCredits: credits,
        remainingCatalogs: 999, // Por simplicidad
        currentPlan: credits > 0 ? 'Plan con Créditos' : 'Plan Gratuito',
        suggestCreditPurchase: credits < 5,
        upgradeRequired: credits === 0 
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

      // Obtener créditos disponibles
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
      console.log(`💳 Simulating purchase for user ${userId}, package ${packageId}`);

      // Obtener info del paquete
      const { data: packageInfo, error: packageError } = await supabase
        .from('credit_packages')
        .select('credits, price_mxn')
        .eq('id', packageId)
        .single();

      if (packageError || !packageInfo) {
        console.error('❌ Package not found:', packageError);
        return false;
      }

      // Insertar en credit_usage
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
          source_type: 'addon',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) {
        console.error('❌ Error inserting credit usage:', error);
        return false;
      }

      console.log('✅ Purchase simulated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in simulate purchase:', error);
      return false;
    }
  }

  async getAvailableCreditPacks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('id, name, credits, price_mxn')
        .eq('is_active', true)
        .lte('price_mxn', 500)
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

export const testSubscriptionService = async (userId: string) => {
  console.log('🧪 TESTING SUBSCRIPTION SERVICE');
  console.log('User ID:', userId);
  
  const validation = await subscriptionService.validateUsage(userId);
  console.log('✅ Validation:', validation);
  
  const creditPacks = await subscriptionService.getAvailableCreditPacks();
  console.log('📦 Available Packs:', creditPacks);
  
  return { validation, creditPacks };
};