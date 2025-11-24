import { supabase } from "@/integrations/supabase/client";

export interface MerchantData {
  id: string;
  business_name: string;
  rfc: string | null;
  clabe_deposit: string;
  status: string;
  openpay_id: string;
}

export class MerchantService {
  /**
   * Obtener el estado actual del comerciante (Si ya está registrado)
   */
  static async getMerchantStatus(userId: string): Promise<MerchantData | null> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as MerchantData | null;
  }

  /**
   * Registrar nuevo comerciante en Openpay
   */
  static async registerMerchant(data: {
    business_name: string;
    rfc: string;
    clabe: string;
    email: string;
  }): Promise<MerchantData> {
    console.log("🏦 Iniciando registro de merchant en Openpay...");

    // Llamar a la Edge Function protegida
    const { data: responseData, error } = await supabase.functions.invoke("register-merchant", {
      body: data,
    });

    if (error) {
      console.error("Error Edge Function:", error);
      throw new Error("Error de conexión con el servidor de pagos.");
    }

    if (!responseData.success) {
      throw new Error(responseData.error || "No se pudo registrar la cuenta.");
    }

    // Retornar datos simulados o volver a consultar la DB para tener el objeto completo
    // Por eficiencia, devolvemos lo que sabemos
    return {
      id: "new", // Se actualizará al recargar
      business_name: data.business_name,
      rfc: data.rfc,
      clabe_deposit: data.clabe,
      status: "active",
      openpay_id: responseData.openpay_id,
    };
  }
}
