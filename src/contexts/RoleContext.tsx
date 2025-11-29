import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "L1" | "L2" | "BOTH" | "NONE" | "LOADING";

interface RoleContextProps {
  userRole: UserRole;
  isLoadingRole: boolean;
  // Helpers para facilitar la vida en el UI
  isL1: boolean;
  isL2: boolean;
  isBoth: boolean;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>("LOADING");
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const fetchRole = async () => {
    if (!user?.id) {
      setUserRole("NONE");
      setIsLoadingRole(false);
      return;
    }

    setIsLoadingRole(true);
    try {
      // EJECUCIÓN PARALELA: Consultamos ambas tablas al mismo tiempo para velocidad máxima
      const [l1Result, l2Result] = await Promise.all([
        // 1. Check L1: ¿Tiene suscripción activa?
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"]),

        // 2. Check L2: ¿Tiene catálogos replicados activos?
        supabase
          .from("replicated_catalogs")
          .select("*", { count: "exact", head: true })
          .eq("reseller_id", user.id)
          .eq("is_active", true),
      ]);

      const isL1Found = (l1Result.count || 0) > 0;
      const isL2Found = (l2Result.count || 0) > 0;

      // 3. Asignación de Rol
      if (isL1Found && isL2Found) {
        setUserRole("BOTH");
      } else if (isL1Found) {
        setUserRole("L1");
      } else if (isL2Found) {
        setUserRole("L2");
      } else {
        setUserRole("NONE");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("NONE");
    } finally {
      setIsLoadingRole(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [user]);

  const value = {
    userRole,
    isLoadingRole,
    isL1: userRole === "L1" || userRole === "BOTH",
    isL2: userRole === "L2" || userRole === "BOTH",
    isBoth: userRole === "BOTH",
    refreshRole: fetchRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useUserRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useUserRole must be used within a RoleProvider");
  }
  return context;
};
