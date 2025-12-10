import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDevSimulation, SimulatedPlan } from "@/contexts/DevSimulationContext";
import { UserRole } from "@/contexts/RoleContext";
import { Bug, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES: { value: UserRole | "none"; label: string }[] = [
  { value: "none", label: "Sin simulación" },
  { value: "L1", label: "L1 (Fabricante)" },
  { value: "L2", label: "L2 (Revendedor)" },
  { value: "BOTH", label: "BOTH (Ambos)" },
  { value: "NONE", label: "NONE (Sin rol)" },
];

const PLANS: { value: SimulatedPlan | "none"; label: string }[] = [
  { value: "none", label: "Sin simulación" },
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

export const DevToolbar = () => {
  const { user } = useAuth();
  const { simulatedRole, simulatedPlan, setSimulatedRole, setSimulatedPlan, clearSimulation } =
    useDevSimulation();
  const [isExpanded, setIsExpanded] = useState(false);

  // 🔒 STRICT SECURITY GUARD: Only render for actual admins
  const realRole = user?.user_metadata?.role;
  if (realRole !== "admin") {
    return null;
  }

  const handleRoleChange = (value: string) => {
    if (value === "none") {
      setSimulatedRole(null);
    } else {
      setSimulatedRole(value as UserRole);
    }
  };

  const handlePlanChange = (value: string) => {
    if (value === "none") {
      setSimulatedPlan(null);
    } else {
      setSimulatedPlan(value as SimulatedPlan);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isExpanded ? (
        <div className="bg-zinc-900 text-white rounded-lg shadow-2xl border border-zinc-700 p-4 min-w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-sm">Dev Toolbar</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Simular Rol</label>
              <Select
                value={simulatedRole ?? "none"}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {ROLES.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Simular Plan</label>
              <Select
                value={simulatedPlan ?? "none"}
                onValueChange={handlePlanChange}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {PLANS.map((plan) => (
                    <SelectItem
                      key={plan.value}
                      value={plan.value}
                      className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                    >
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(simulatedRole || simulatedPlan) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={clearSimulation}
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar simulación
              </Button>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-700">
            <p className="text-[10px] text-zinc-500">
              Usuario real: {user?.email}
            </p>
            <p className="text-[10px] text-zinc-500">
              Rol metadata: {realRole ?? "ninguno"}
            </p>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-zinc-900 border-zinc-700 text-amber-400 hover:bg-zinc-800 hover:text-amber-300 shadow-lg"
          onClick={() => setIsExpanded(true)}
        >
          <Bug className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
