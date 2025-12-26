import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export const useAffiliateTracker = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      console.log("🎁 Código de referido detectado:", refCode);
      // Guardamos en LocalStorage para que persista aunque cierre la pestaña
      localStorage.setItem("catify_ref_code", refCode);
    }
  }, [searchParams]);
};
