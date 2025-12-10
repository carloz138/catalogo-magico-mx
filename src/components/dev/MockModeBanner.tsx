import { useAuth } from "@/contexts/AuthContext";
import { useDevSimulation } from "@/contexts/DevSimulationContext";
import { AlertTriangle, X } from "lucide-react";

export const MockModeBanner = () => {
  const { user } = useAuth();
  const { isSimulating, simulatedRole, simulatedPlan, clearSimulation } = useDevSimulation();

  // 🔒 SECURITY: Only show to admins AND only when simulating
  const realRole = user?.user_metadata?.role;
  if (realRole !== "admin" || !isSimulating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-500 text-black py-1.5 px-4 flex items-center justify-center gap-3 text-sm font-medium shadow-md">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        MOCK MODE ACTIVE
        {simulatedRole && ` • Rol: ${simulatedRole}`}
        {simulatedPlan && ` • Plan: ${simulatedPlan}`}
      </span>
      <button
        onClick={clearSimulation}
        className="ml-2 p-0.5 hover:bg-amber-600 rounded transition-colors"
        aria-label="Cerrar modo mock"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
