import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/contexts/RoleContext";
import { MyActivatedCatalogsList } from "@/components/dashboard/MyActivatedCatalogsList";
import { UpsellBanner } from "@/components/dashboard/UpsellBanner";
import KpiDashboard from "@/components/dashboard/KpiDashboard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainDashboard() {
  const navigate = useNavigate();
  const { userRole, isLoadingRole } = useUserRole();

  if (isLoadingRole) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const isL1 = userRole === 'L1' || userRole === 'BOTH';
  const isL2 = userRole === 'L2' || userRole === 'BOTH';
  const isOnlyL2 = userRole === 'L2';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tu Dashboard</h1>
            <p className="text-gray-500">Gestiona todos tus catálogos desde aquí.</p>
          </div>
        </header>

        {/* Banner de Upsell para usuarios solo L2 */}
        {isOnlyL2 && (
          <UpsellBanner />
        )}

        {/* --- SECCIÓN PARA REVENDEDORES (L2) --- */}
        {isL2 && (
          <MyActivatedCatalogsList />
        )}

        {/* --- SECCIÓN PARA CREADORES (L1) --- */}
        {isL1 && (
          <div className="space-y-8">
            <KpiDashboard />
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold">Mis Catálogos Originales</h2>
              <p className="text-gray-600">Aquí aparecerá tu lista de catálogos originales.</p>
            </div>
          </div>
        )}
        
        {/* Mensaje si no tiene ningún rol activo */}
        {userRole === 'NONE' && (
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
