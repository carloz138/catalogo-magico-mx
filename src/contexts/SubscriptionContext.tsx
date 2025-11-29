import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useUserRole } from "./RoleContext"; // Importamos el contexto de roles
import { type Tables } from "@/integrations/supabase/types";

// Tipo base de la tabla credit_packages
export type Package = Tables<"credit_packages">;

// Tipo para el 'rol' L2 gratuito que no tiene un plan de pago real
type FreeL2Plan = {
  id: "free_l2";
  name: "Plan Revendedor";
  analytics_level: "basic";
  package_type: "free_reseller";
};

// Lo que nuestro Context va a "exponer"
type SubscriptionContextType = {
  paqueteUsuario: Package | FreeL2Plan | null;
  loading: boolean;
  hasAccess: (feature: "radar_inteligente" | "recomendaciones" | "predictivo") => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole(); // Consumimos el rol calculado

  const [paqueteUsuario, setPaqueteUsuario] = useState<Package | FreeL2Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      // Esperar a que tengamos usuario y rol definido
      if (!user || isLoadingRole) {
        if (!user) setLoading(false);
        return;
      }

      setLoading(true);

      // CASO 1: Revendedor Puro (L2) -> Plan Gratuito con Analytics Básico
      if (userRole === "L2") {
        setPaqueteUsuario({
          id: "free_l2",
          name: "Plan Revendedor",
          analytics_level: "basic",
          package_type: "free_reseller",
        });
        setLoading(false);
        return;
      }

      // CASO 2: Fabricante (L1) o Híbrido (BOTH) -> Buscar suscripción real
      if (userRole === "L1" || userRole === "BOTH") {
        try {
          const { data, error } = await supabase
            .from("subscriptions")
            .select("*, credit_packages:package_id(*)")
            .eq("user_id", user.id)
            .in("status", ["active", "trialing"])
            .maybeSingle();

          if (error) {
            console.error("Error fetching subscription:", error);
            setPaqueteUsuario(null);
          } else if (data && data.credit_packages) {
            setPaqueteUsuario(data.credit_packages as Package);
          } else {
            // Si es L1 pero no tiene suscripción activa (ej. expirada), degradar a null
            setPaqueteUsuario(null);
          }
        } catch (err) {
          console.error("Critical subscription error:", err);
          setPaqueteUsuario(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Rol NONE
        setPaqueteUsuario(null);
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, userRole, isLoadingRole]);

  // --- LÓGICA DE NEGOCIO (FEATURE GATING) ---
  const hasAccess = (feature: "radar_inteligente" | "recomendaciones" | "predictivo"): boolean => {
    if (!paqueteUsuario) return false;

    // Aseguramos tipado seguro aunque venga de FreeL2Plan
    const level = (paqueteUsuario as any).analytics_level || "none";
    const name = paqueteUsuario.name || "";

    switch (feature) {
      case "radar_inteligente":
        // Disponible para Advanced (Básico IA) y Pro (Profesional/Enterprise)
        return level === "advanced" || level === "pro";

      case "recomendaciones":
        // Disponible solo para Pro (Profesional IA)
        return level === "pro";

      case "predictivo":
        // Disponible solo para Enterprise (Plan más alto)
        return level === "pro" && name.toLowerCase().includes("empresarial");

      default:
        return false;
    }
  };

  return (
    <SubscriptionContext.Provider value={{ paqueteUsuario, loading: loading || isLoadingRole, hasAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription debe ser usado dentro de un SubscriptionProvider");
  }
  return context;
};
