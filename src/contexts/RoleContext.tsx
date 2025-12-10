import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDevSimulation } from "@/contexts/DevSimulationContext";

export type UserRole = "L1" | "L2" | "BOTH" | "NONE" | "LOADING";

interface RoleContextProps {
  userRole: UserRole;
  realRole: UserRole; // The actual role from DB (for debugging)
  isLoadingRole: boolean;
  isL1: boolean;
  isL2: boolean;
  isBoth: boolean;
  isSimulated: boolean;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextProps | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { simulatedRole } = useDevSimulation();
  const [realRole, setRealRole] = useState<UserRole>("LOADING");
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const fetchRole = async () => {
    if (!user?.id) {
      setRealRole("NONE");
      setIsLoadingRole(false);
      return;
    }

    setIsLoadingRole(true);
    try {
      const [l1Result, l2Result] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"]),
        supabase
          .from("replicated_catalogs")
          .select("*", { count: "exact", head: true })
          .eq("reseller_id", user.id)
          .eq("is_active", true),
      ]);

      const isL1Found = (l1Result.count || 0) > 0;
      const isL2Found = (l2Result.count || 0) > 0;

      if (isL1Found && isL2Found) {
        setRealRole("BOTH");
      } else if (isL1Found) {
        setRealRole("L1");
      } else if (isL2Found) {
        setRealRole("L2");
      } else {
        setRealRole("NONE");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRealRole("NONE");
    } finally {
      setIsLoadingRole(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [user]);

  // 🔒 THE SECURITY GUARD: Only allow simulation if real user is admin
  const isRealAdmin = user?.user_metadata?.role === "admin";
  const finalRole: UserRole =
    isRealAdmin && simulatedRole ? simulatedRole : realRole;
  const isSimulated = isRealAdmin && simulatedRole !== null;

  const value = {
    userRole: finalRole,
    realRole,
    isLoadingRole,
    isL1: finalRole === "L1" || finalRole === "BOTH",
    isL2: finalRole === "L2" || finalRole === "BOTH",
    isBoth: finalRole === "BOTH",
    isSimulated,
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
