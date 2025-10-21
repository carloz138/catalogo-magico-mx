import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'L1' | 'L2' | 'BOTH' | 'NONE' | 'LOADING';

interface RoleContextProps {
  userRole: UserRole;
  isLoadingRole: boolean;
}

const RoleContext = createContext<RoleContextProps>({ userRole: 'LOADING', isLoadingRole: true });

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('LOADING');
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) {
        setUserRole('NONE');
        setIsLoadingRole(false);
        return;
      }

      setIsLoadingRole(true);
      try {
        // Check for active subscription (L1)
        const { count: subCount, error: subError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (subError) throw subError;
        const isL1 = (subCount ?? 0) > 0;

        // Check for active replicated catalogs (L2)
        const { count: replicaCount, error: replicaError } = await supabase
          .from('replicated_catalogs')
          .select('*', { count: 'exact', head: true })
          .eq('reseller_id', user.id)
          .eq('is_active', true);

        if (replicaError) throw replicaError;
        const isL2 = (replicaCount ?? 0) > 0;

        // Determine role
        if (isL1 && isL2) setUserRole('BOTH');
        else if (isL1) setUserRole('L1');
        else if (isL2) setUserRole('L2');
        else setUserRole('NONE');

      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole('NONE');
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchRole();
  }, [user]);

  return (
    <RoleContext.Provider value={{ userRole, isLoadingRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useUserRole = () => useContext(RoleContext);
