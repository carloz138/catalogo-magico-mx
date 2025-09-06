// src/hooks/useUploadTracking.ts
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUploadTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const checkUploadLimits = async (filesToUpload: number = 1) => {
    if (!user) return { canUpload: false, reason: 'not_authenticated' };

    try {
      // Obtener plan activo - using any to bypass TypeScript issues
      const { data: subscription, error: subError } = await (supabase as any)
        .from('subscriptions')
        .select(`
          *,
          credit_packages (
            max_uploads,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError) {
        return { canUpload: false, reason: 'no_active_subscription' };
      }

      const plan = subscription?.credit_packages;
      
      // Si es ilimitado
      if (!plan?.max_uploads || plan.max_uploads === 0) {
        return { canUpload: true, reason: 'unlimited' };
      }

      // Obtener uso del mes actual - using any to bypass TypeScript issues
      const currentMonth = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);
      
      const { data: usage } = await (supabase as any)
        .from('catalog_usage')
        .select('uploads_used')
        .eq('user_id', user.id)
        .eq('usage_month', currentMonth)
        .single();

      const uploadsUsed = usage?.uploads_used || 0;
      const uploadsRemaining = plan.max_uploads - uploadsUsed;

      if (uploadsRemaining < filesToUpload) {
        return {
          canUpload: false,
          reason: 'limit_exceeded',
          uploadsUsed,
          uploadsLimit: plan.max_uploads,
          uploadsRemaining: Math.max(0, uploadsRemaining),
          planName: plan.name
        };
      }

      return {
        canUpload: true,
        reason: 'within_limit',
        uploadsUsed,
        uploadsLimit: plan.max_uploads,
        uploadsRemaining,
        planName: plan.name
      };

    } catch (error) {
      console.error('Error checking upload limits:', error);
      return { canUpload: false, reason: 'error' };
    }
  };

  const incrementUploadUsage = async (numberOfFiles: number) => {
    if (!user) return { success: false };

    try {
      const currentMonth = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);
      
      // Primero verificar límites
      const limitCheck = await checkUploadLimits(numberOfFiles);
      if (!limitCheck.canUpload) {
        toast({
          title: "Límite de uploads alcanzado",
          description: `No puedes subir más imágenes este mes. ${limitCheck.reason}`,
          variant: "destructive",
        });
        return { success: false, reason: limitCheck.reason };
      }

      // Obtener o crear registro de uso - using any to bypass TypeScript issues
      const { data: existingUsage } = await (supabase as any)
        .from('catalog_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_month', currentMonth)
        .single();

      if (existingUsage) {
        // Actualizar existente
        const { error } = await (supabase as any)
          .from('catalog_usage')
          .update({
            uploads_used: (existingUsage.uploads_used || 0) + numberOfFiles,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUsage.id);

        if (error) throw error;
      } else {
        // Crear nuevo registro
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('package_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        const { error } = await (supabase as any)
          .from('catalog_usage')
          .insert({
            user_id: user.id,
            usage_month: currentMonth,
            uploads_used: numberOfFiles,
            subscription_plan_id: subscription?.package_id
          });

        if (error) throw error;
      }

      return { success: true, uploadsAdded: numberOfFiles };

    } catch (error) {
      console.error('Error incrementing upload usage:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el contador de uploads",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const validateBeforeUpload = async (filesToUpload: number) => {
    setLoading(true);
    try {
      const result = await checkUploadLimits(filesToUpload);
      
      if (!result.canUpload) {
        let message = "No puedes subir más imágenes";
        
        switch (result.reason) {
          case 'not_authenticated':
            message = "Debes iniciar sesión para subir imágenes";
            break;
          case 'no_active_subscription':
            message = "Necesitas una suscripción activa para subir imágenes";
            break;
          case 'limit_exceeded':
            message = `Has alcanzado el límite de ${result.uploadsLimit} uploads mensuales. Te quedan ${result.uploadsRemaining} uploads.`;
            break;
        }
        
        toast({
          title: "Límite alcanzado",
          description: message,
          variant: "destructive",
        });
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating upload:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkUploadLimits,
    incrementUploadUsage,
    validateBeforeUpload,
    loading
  };
};