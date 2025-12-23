import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSuperAdmin() {
  const { user } = useAuth();

  const { data: isSuperAdmin, isLoading } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("users")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error checking super admin status:", error);
        return false;
      }
      
      return data?.is_super_admin === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isSuperAdmin: isSuperAdmin ?? false,
    isLoading,
  };
}
