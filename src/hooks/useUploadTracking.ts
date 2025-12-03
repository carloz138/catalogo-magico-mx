// src/hooks/useUploadTracking.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useUploadTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados para la UI (Barra de progreso)
  const [uploadsUsed, setUploadsUsed] = useState(0);
  const [maxUploads, setMaxUploads] = useState(0);
  const [loading, setLoading] = useState(true);

  // Lógica derivada
  const isUnlimited = maxUploads > 10000; // Asumimos >10k como infinito
  const remaining = Math.max(0, maxUploads - uploadsUsed);
  const canUpload = isUnlimited || remaining > 0;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((uploadsUsed / maxUploads) * 100));

  // 1. CARGA INICIAL (Para pintar la barra en el Dashboard)
  const fetchUsage = async () => {
    if (!user) return;
    try {
      // a. Obtener Plan
      const { data: subscription } = await (supabase as any)
        .from("subscriptions")
        .select("credit_packages(max_uploads)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const limit = subscription?.credit_packages?.max_uploads || 0;
      setMaxUploads(limit);

      // b. Obtener Uso
      const currentMonth = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);
      const { data: usage } = await (supabase as any)
        .from("catalog_usage")
        .select("uploads_used")
        .eq("user_id", user.id)
        .eq("usage_month", currentMonth)
        .maybeSingle();

      setUploadsUsed(usage?.uploads_used || 0);
    } catch (error) {
      console.error("Error fetching tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  // 2. VALIDACIÓN (Lógica original tuya, mantenida para Upload)
  const checkUploadLimits = async (filesToUpload: number = 1) => {
    // Reutilizamos el estado si ya cargó, para no llamar a DB doble vez si no es necesario
    // Pero por seguridad, recalculamos "remaining" en caliente si es crítico
    if (loading) await fetchUsage();

    // Si sigue cargando o falló, validación estricta manual (tu lógica original simplificada)
    // Para simplificar, usamos los valores del estado que acabamos de asegurar
    const updatedRemaining = isUnlimited ? 9999 : maxUploads - uploadsUsed;

    if (updatedRemaining < filesToUpload) {
      return {
        canUpload: false,
        reason: "limit_exceeded",
        uploadsRemaining: updatedRemaining,
      };
    }
    return { canUpload: true, reason: "within_limit" };
  };

  // 3. INCREMENTAR (Tu lógica original mantenida)
  const incrementUploadUsage = async (numberOfFiles: number) => {
    if (!user) return { success: false };
    try {
      const currentMonth = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);

      // Upsert simple
      const { data: existingUsage } = await (supabase as any)
        .from("catalog_usage")
        .select("id, uploads_used")
        .eq("user_id", user.id)
        .eq("usage_month", currentMonth)
        .maybeSingle();

      if (existingUsage) {
        await (supabase as any)
          .from("catalog_usage")
          .update({ uploads_used: existingUsage.uploads_used + numberOfFiles })
          .eq("id", existingUsage.id);
      } else {
        // Crear si no existe
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("package_id")
          .eq("user_id", user.id)
          .maybeSingle();
        await (supabase as any).from("catalog_usage").insert({
          user_id: user.id,
          usage_month: currentMonth,
          uploads_used: numberOfFiles,
          subscription_plan_id: sub?.package_id,
        });
      }

      // Actualizamos el estado local para reflejar el cambio en la UI sin recargar
      setUploadsUsed((prev) => prev + numberOfFiles);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  const validateBeforeUpload = async (filesToUpload: number) => {
    const result = await checkUploadLimits(filesToUpload);
    if (!result.canUpload) {
      toast({
        title: "Límite alcanzado",
        description: `Solo te quedan ${result.uploadsRemaining} uploads disponibles.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return {
    // Datos para UI (Products.tsx)
    uploadsUsed,
    maxUploads,
    percentage,
    isUnlimited,
    canUpload, // Booleano simple para deshabilitar botones
    loading,

    // Métodos (Upload.tsx)
    checkUploadLimits,
    incrementUploadUsage,
    validateBeforeUpload,
  };
};
