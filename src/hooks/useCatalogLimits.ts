import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CatalogLimits {
  canGenerate: boolean;
  reason: string;
  message: string;
  catalogsUsed: number;
  catalogsLimit: number | "unlimited";
  remainingCatalogs: number;
  // 👇 NUEVO: Agregamos info de uploads
  maxUploads: number | "unlimited";
  planName?: string;
}

export const useCatalogLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<CatalogLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkLimits();
  }, [user]);

  const checkLimits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Obtenemos la info del RPC (Catálogos)
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc("can_generate_catalog", {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;
      const result = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;

      // 2. 👇 NUEVO: Obtenemos la info del Plan (Uploads) directamente
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("credit_packages(max_uploads)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      // Si no tiene plan, el default es 50. Si es enterprise (999999), lo tratamos como unlimited
      let maxUploadsRaw = subData?.credit_packages?.max_uploads || 50;
      const maxUploads = maxUploadsRaw > 10000 ? "unlimited" : maxUploadsRaw;

      setLimits({
        canGenerate: result.can_generate || false,
        reason: result.reason || "unknown",
        message: result.message || "Sin información",
        catalogsUsed: result.catalogs_used || 0,
        catalogsLimit: result.catalogs_limit === "unlimited" ? "unlimited" : result.catalogs_limit || 0,
        remainingCatalogs: result.remaining,
        planName: result.plan_name,
        // 👇 Exponemos el límite correcto
        maxUploads: maxUploads,
      });
    } catch (error) {
      console.error("Error checking limits:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    limits,
    loading,
    checkLimits,
    // Exponer helpers directos
    canGenerate: limits?.canGenerate || false,
    catalogsUsed: limits?.catalogsUsed || 0,
    maxUploads: limits?.maxUploads || 50, // Fallback visual
  };
};
