import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Límite por defecto para usuarios sin plan (Plan Gratis)
const DEFAULT_MAX_UPLOADS = 10;

export const useUploadTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados para la UI
  const [uploadsUsed, setUploadsUsed] = useState(0);
  const [maxUploads, setMaxUploads] = useState(DEFAULT_MAX_UPLOADS);
  const [loading, setLoading] = useState(true);

  // Lógica derivada
  const isUnlimited = maxUploads >= 10000;
  const remaining = isUnlimited ? 9999 : Math.max(0, maxUploads - uploadsUsed);
  const canUpload = isUnlimited || remaining > 0;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((uploadsUsed / maxUploads) * 100));

  // Calcular el mes actual en formato YYYYMM
  const getCurrentMonth = useCallback(() => {
    const now = new Date();
    return now.getFullYear() * 100 + (now.getMonth() + 1);
  }, []);

  // 1. CARGA INICIAL
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      console.log("📊 [UploadTracking] Fetching usage for user:", user.id);
      
      // Obtener suscripción activa del usuario
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("package_id, credit_packages(max_uploads, name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error("❌ [UploadTracking] Error fetching subscription:", subError);
      }

      // Determinar el límite de uploads
      let limit = DEFAULT_MAX_UPLOADS;
      
      if (subscription?.credit_packages?.max_uploads) {
        limit = subscription.credit_packages.max_uploads;
        console.log("✅ [UploadTracking] Plan encontrado:", subscription.credit_packages.name, "| Límite:", limit);
      } else {
        console.log("⚠️ [UploadTracking] Sin suscripción activa, usando límite por defecto:", DEFAULT_MAX_UPLOADS);
      }
      
      setMaxUploads(limit);

      // Obtener uso del mes actual
      const currentMonth = getCurrentMonth();
      console.log("📅 [UploadTracking] Buscando uso para mes:", currentMonth);
      
      const { data: usage, error: usageError } = await supabase
        .from("catalog_usage")
        .select("uploads_used")
        .eq("user_id", user.id)
        .eq("usage_month", currentMonth)
        .maybeSingle();

      if (usageError) {
        console.error("❌ [UploadTracking] Error fetching usage:", usageError);
      }

      const usedCount = usage?.uploads_used || 0;
      setUploadsUsed(usedCount);
      
      console.log("📊 [UploadTracking] Resultado:", {
        maxUploads: limit,
        uploadsUsed: usedCount,
        remaining: limit >= 10000 ? "Ilimitado" : limit - usedCount,
        month: currentMonth
      });
      
    } catch (error) {
      console.error("❌ [UploadTracking] Error general:", error);
      // En caso de error, permitir subir con límite por defecto
      setMaxUploads(DEFAULT_MAX_UPLOADS);
      setUploadsUsed(0);
    } finally {
      setLoading(false);
    }
  }, [user, getCurrentMonth]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // 2. VALIDACIÓN
  const checkUploadLimits = useCallback(async (filesToUpload: number = 1) => {
    if (loading) {
      await fetchUsage();
    }

    const currentRemaining = isUnlimited ? 9999 : maxUploads - uploadsUsed;

    if (currentRemaining < filesToUpload) {
      return {
        canUpload: false,
        reason: "limit_exceeded",
        uploadsRemaining: currentRemaining,
      };
    }
    return { canUpload: true, reason: "within_limit", uploadsRemaining: currentRemaining };
  }, [loading, fetchUsage, isUnlimited, maxUploads, uploadsUsed]);

  // 3. INCREMENTAR USO
  const incrementUploadUsage = useCallback(async (numberOfFiles: number) => {
    if (!user) return { success: false };
    
    try {
      const currentMonth = getCurrentMonth();

      const { data: existingUsage } = await supabase
        .from("catalog_usage")
        .select("id, uploads_used")
        .eq("user_id", user.id)
        .eq("usage_month", currentMonth)
        .maybeSingle();

      if (existingUsage) {
        const { error } = await supabase
          .from("catalog_usage")
          .update({ 
            uploads_used: existingUsage.uploads_used + numberOfFiles,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingUsage.id);
        
        if (error) throw error;
      } else {
        // Obtener package_id actual si existe
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("package_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
          
        const { error } = await supabase.from("catalog_usage").insert({
          user_id: user.id,
          usage_month: currentMonth,
          uploads_used: numberOfFiles,
          catalogs_generated: 0,
          subscription_plan_id: sub?.package_id || null,
        });
        
        if (error) throw error;
      }

      setUploadsUsed((prev) => prev + numberOfFiles);
      console.log("✅ [UploadTracking] Incrementado uso en:", numberOfFiles);
      return { success: true };
    } catch (error) {
      console.error("❌ [UploadTracking] Error incrementando uso:", error);
      return { success: false };
    }
  }, [user, getCurrentMonth]);

  const validateBeforeUpload = useCallback(async (filesToUpload: number) => {
    const result = await checkUploadLimits(filesToUpload);
    if (!result.canUpload) {
      toast({
        title: "Límite alcanzado",
        description: `Solo te quedan ${result.uploadsRemaining} uploads disponibles este mes.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [checkUploadLimits, toast]);

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    setLoading(true);
    fetchUsage();
  }, [fetchUsage]);

  return {
    uploadsUsed,
    maxUploads,
    percentage,
    isUnlimited,
    canUpload,
    loading,
    remaining,
    checkUploadLimits,
    incrementUploadUsage,
    validateBeforeUpload,
    refresh,
  };
};
