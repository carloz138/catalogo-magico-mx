import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessInfo } from "@/types/business";

export const useBusinessInfo = () => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-load on mount
  useEffect(() => {
    loadBusinessInfo();
  }, []);

  const loadBusinessInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuario no autenticado");
        return;
      }

      // 1. Cargar Info de Negocio
      const { data: businessData, error: businessError } = await (supabase as any)
        .from("business_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (businessError && businessError.code !== "PGRST116") {
        console.error("Error fetching business info:", businessError);
      }
      setBusinessInfo(businessData as BusinessInfo);

      // 2. ✅ Cargar Info Bancaria (Merchants)
      const { data: merchantData, error: merchantError } = await (supabase as any)
        .from("merchants")
        .select("id, status, openpay_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (merchantError && merchantError.code !== "PGRST116") {
        console.error("Error fetching merchant info:", merchantError);
      }
      setMerchantInfo(merchantData);
    } catch (err) {
      console.error("Error loading info:", err);
      setError("Error al cargar información");
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessInfo = async (updates: Partial<BusinessInfo>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await (supabase as any).from("business_info").upsert(
        {
          user_id: user.id,
          ...updates,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;

      await loadBusinessInfo();
      return true;
    } catch (err) {
      console.error("Error updating business info:", err);
      setError("Error al actualizar información");
      return false;
    }
  };

  return {
    businessInfo,
    merchantInfo, // ✅ Exportamos esto
    loading,
    error,
    loadBusinessInfo,
    updateBusinessInfo,
    hasBusinessInfo: !!(businessInfo && businessInfo.business_name?.trim()),
    hasMerchantAccount: !!(merchantInfo && merchantInfo.openpay_id), // ✅ Helper útil
  };
};
