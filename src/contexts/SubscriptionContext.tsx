import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext"; // CORRECTO: Para saber el 'user'
import { useRole } from "./RoleContext"; // AÑADIDO: Para saber el 'role' (L1/L2/BOTH)

// Este es el tipo de tu objeto 'packages' del JSON que me pasaste
export type Package = {
  id: string;
  name: string;
  analytics_level: "basic" | "advanced" | "pro";
  // ...puedes añadir otros campos de tu JSON aquí si los necesitas en el frontend
};

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
  // 👇 CORRECCIÓN CLAVE AQUÍ:
  const { user } = useAuth(); // Obtenemos el 'user' del AuthContext
  const { role } = useRole(); // Obtenemos el 'role' del RoleContext

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

      // 1. Manejar el caso especial del L2 gratuito
      // (Tu prompt dice: L2 gratis si solo replican)
      if (role === "L2") {
        setPaqueteUsuario({
          id: "free_l2",
          name: "Plan Revendedor",
          analytics_level: "basic", // L2 gratuito ve el Radar Básico
        });
        setLoading(false);
        return;
      }

      // 2. Es L1 o BOTH, buscar su plan de paga
      // (Tu prompt dice: L1 o L2 pagan si quieren crear)
      if (role === "L1" || role === "BOTH") {
        try {
          // Asumo que tienes una tabla 'subscriptions' que linkea 'user_id' con 'package_id'
          // y tiene un campo 'status'
          const { data, error } = await supabase
            .from("subscriptions") // <--- Revisa si tu tabla se llama así
            .select("*, package_id(*)") // Carga el paquete anidado
            .eq("user_id", user.id)
            .eq("status", "active") // ¡Solo suscripciones activas!
            .single();

          if (error) {
            // 'single()' da error si no encuentra filas, lo cual es normal
            // si el L1/BOTH acaba de registrarse y no ha pagado
            console.warn("No active subscription found for L1/BOTH user.");
            setPaqueteUsuario(null); // O un plan default si prefieres
          } else if (data && data.package_id) {
            setPaqueteUsuario(data.package_id as Package);
          }
        } catch (error) {
          console.error("Error fetching subscription:", error);
          setPaqueteUsuario(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Rol 'NONE' o cualquier otro caso
        setLoading(false);
        setPaqueteUsuario(null);
      }
    };

    fetchSubscription();
    // 👇 CORRECCIÓN CLAVE AQUÍ:
    // Se re-ejecuta si el usuario o su rol cambian
  }, [user, role]);

  // 3. La función de lógica de negocio (el "guardia de seguridad")
  const hasAccess = (feature: "radar_inteligente" | "recomendaciones" | "predictivo"): boolean => {
    if (!paqueteUsuario) return false;

    const level = paqueteUsuario.analytics_level;
    const name = paqueteUsuario.name;

    switch (feature) {
      // Básico IA ($299) y superior
      case "radar_inteligente":
        return level === "advanced" || level === "pro";

      // Profesional ($599) y superior
      case "recomendaciones":
        return level === "pro";

      // Empresarial ($1,299) - (Verificamos 'pro' Y el nombre)
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
