import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "./RoleContext";

export type SimulatedPlan = "free" | "starter" | "pro" | "premium" | null;

interface DevSimulationContextProps {
  simulatedRole: UserRole | null;
  simulatedPlan: SimulatedPlan;
  setSimulatedRole: (role: UserRole | null) => void;
  setSimulatedPlan: (plan: SimulatedPlan) => void;
  isSimulating: boolean;
  clearSimulation: () => void;
}

const DevSimulationContext = createContext<DevSimulationContextProps | undefined>(undefined);

export const DevSimulationProvider = ({ children }: { children: ReactNode }) => {
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const [simulatedPlan, setSimulatedPlan] = useState<SimulatedPlan>(null);

  const isSimulating = simulatedRole !== null || simulatedPlan !== null;

  const clearSimulation = () => {
    setSimulatedRole(null);
    setSimulatedPlan(null);
  };

  return (
    <DevSimulationContext.Provider
      value={{
        simulatedRole,
        simulatedPlan,
        setSimulatedRole,
        setSimulatedPlan,
        isSimulating,
        clearSimulation,
      }}
    >
      {children}
    </DevSimulationContext.Provider>
  );
};

export const useDevSimulation = () => {
  const context = useContext(DevSimulationContext);
  if (context === undefined) {
    throw new Error("useDevSimulation must be used within a DevSimulationProvider");
  }
  return context;
};
