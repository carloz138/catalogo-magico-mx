import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MyActivatedCatalogsList } from "@/components/dashboard/MyActivatedCatalogsList";
// Importa aquí los componentes del dashboard del L1 (Creador) que ya tienes
// import { MyOriginalCatalogsList } from "@/components/dashboard/MyOriginalCatalogsList"; // Ejemplo
// import { KpiDashboard } from "@/components/dashboard/KpiDashboard"; // Ejemplo
import { Loader2 } from "lucide-react";

export default function MainDashboard() {
  const { user } = useAuth();
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isReseller, setIsReseller] = useState(false);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (!user?.id) {
        setLoadingRoles(false);
        return;
      }

      setLoadingRoles(true);
      
      // 1. Check if user is a Creator (has an active subscription)
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();
        
      if (subscription) {
        setIsCreator(true);
      }

      // 2. Check if user is a Reseller (has activated at least one catalog)
      const { count: resellerCount, error: resellerError } = await supabase
        .from('replicated_catalogs')
        .select('*', { count: 'exact', head: true })
        .eq('reseller_id', user.id)
        .eq('is_active', true);

      if (resellerCount && resellerCount > 0) {
        setIsReseller(true);
      }

      setLoadingRoles(false);
    };

    checkUserRoles();
  }, [user]);

  if (loadingRoles) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Tu Dashboard</h1>
          <p className="text-gray-500">Gestiona todos tus catálogos desde aquí.</p>
        </header>

        {/* --- SECCIÓN PARA REVENDEDORES (L2) --- */}
        {isReseller && (
          <MyActivatedCatalogsList />
        )}

        {/* --- SECCIÓN PARA CREADORES (L1) --- */}
        {isCreator && (
          <div className="space-y-8">
            {/* Aquí pones los componentes del dashboard L1 que ya tienes */}
            {/* <KpiDashboard /> */}
            {/* <MyOriginalCatalogsList /> */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold">Mis Catálogos Originales</h2>
              <p className="text-gray-600">Aquí aparecerá tu dashboard de Creador (KPIs, lista de catálogos originales, etc.).</p>
            </div>
          </div>
        )}
        
        {/* Mensaje si no tiene ningún rol activo */}
        {!isCreator && !isReseller && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold">¡Bienvenido!</h2>
            <p className="text-gray-600 mt-2">
              Para empezar, puedes crear tu propio catálogo o activar uno que te hayan compartido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
