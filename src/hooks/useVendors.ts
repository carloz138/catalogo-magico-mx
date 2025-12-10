import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Vendor {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  owner_id: string;
  is_active: boolean;
}

export const useVendors = (enabled = true) => {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Vendor[];
    },
    enabled,
  });
};

export const useCurrentUserVendor = () => {
  return useQuery({
    queryKey: ["current-user-vendor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Vendor | null;
    },
  });
};
