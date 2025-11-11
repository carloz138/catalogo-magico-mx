import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext"; // Para saber el 'user'
// 👇 1. CORRECCIÓN: Importamos el hook con el nombre correcto
import { useUserRole } from "./RoleContext"; // Para saber el 'role' (L1/L2/BOTH)
import { type Tables } from "@/integrations/supabase/types";

// Este es el tipo de tu objeto 'packages' del JSON que me pasaste
export type Package = Tables<"credit_packages">;

// Tipo para el 'rol' L2 gratuito que no tiene un plan de paga
type FreeL2Plan = {
  id: "free_l2";
  name: "Plan Revendedor";
  analytics_level: "basic"; // L2 gratuito ve el Radar Básico, según tu tabla
};

// Lo que nuestro Context va a "exponer" al resto de la app
type SubscriptionContextType = {
  paqueteUsuario: Package | FreeL2Plan | null;
  loading: boolean;
  hasAccess: (feature: "radar_inteligente" | "recomendaciones" | "predictivo") => boolean;
};

// Creamos el Context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// --- El "Proveedor" (Provider) ---
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Obtenemos el 'user' del AuthContext
  // 👇 2. CORRECCIÓN: Usamos el hook y la variable con el nombre correcto
  const { userRole } = useUserRole(); // Obtenemos el 'userRole' del RoleContext

  const [paqueteUsuario, setPaqueteUsuario] = useState<Package | FreeL2Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      // Si no hay usuario, no hay plan
      if (!user) {
        setLoading(false);
        setPaqueteUsuario(null);
        return;
      }

      // 👇 3. CORRECCIÓN: Usamos 'userRole' en la lógica
      // 1. Manejar el caso especial del L2 gratuito
      if (userRole === "L2") {
        setPaqueteUsuario({
          id: "free_l2",
          name: "Plan Revendedor",
          analytics_level: "basic", // L2 gratuito ve el Radar Básico
        });
        setLoading(false);
        return;
      }

      // 2. Es L1 o BOTH, buscar su plan de paga
      if (userRole === "L1" || userRole === "BOTH") {
        try {
          // Asumo que tienes una tabla 'subscriptions' que linkea 'user_id' con 'package_id'
          // y tiene un campo 'status'
          const { data, error } = await supabase
            .from("subscriptions") // <--- Revisa si tu tabla se llama así
            .select("*, credit_packages:package_id(*)") // Carga el paquete anidado
            .eq("user_id", user.id)
            .eq("status", "active") // ¡Solo suscripciones activas!
            .single();

          if (error) {
            console.warn("No active subscription found for L1/BOTH user.");
            setPaqueteUsuario(null);
          } else if (data && data.credit_packages) {
            setPaqueteUsuario(data.credit_packages as Package);
          }
        } catch (error) {
          console.error("Error fetching subscription:", error);
          setPaqueteUsuario(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Rol 'NONE', 'LOADING' o cualquier otro caso
        setLoading(false);
        setPaqueteUsuario(null);
      }
    };

    fetchSubscription();
    // 👇 4. CORRECCIÓN: El useEffect depende de 'user' y 'userRole'
  }, [user, userRole]);

  // 3. La función de lógica de negocio (el "guardia de seguridad")
  const hasAccess = (feature: "radar_inteligente" | "recomendaciones" | "predictivo"): boolean => {
    if (!paqueteUsuario) return false;

    const level = paqueteUsuario.analytics_level;
    const name = paqueteUsuario.name;

    switch (feature) {
      case "radar_inteligente":
        return level === "advanced" || level === "pro";
      case "recomendaciones":
        return level === "pro";
      case "predictivo":
        return level === "pro" && name.includes("Empresarial");
      default:
        return false;
    }
  };

  return (
    <SubscriptionContext.Provider value={{ paqueteUsuario, loading, hasAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// --- El "Consumidor" (Hook) ---
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription debe ser usado dentro de un SubscriptionProvider");
  }
  return context;
};
