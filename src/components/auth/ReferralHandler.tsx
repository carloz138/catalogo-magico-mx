import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function ReferralHandler() {
  const { user } = useAuth();

  useEffect(() => {
    // Solo ejecutamos si hay usuario logueado
    if (!user) return;

    const checkAndRedeemReferral = async () => {
      // 1. Buscamos si hay un código guardado en el "bolsillo" (localStorage)
      // Recuerda que tu LoginPage ya lo guardó ahí.
      const storedCode = localStorage.getItem("catify_ref_code");

      if (storedCode) {
        console.log("🔗 Detectado código de referido pendiente:", storedCode);

        try {
          // 2. Llamamos a la función de rescate que creamos en SQL
          const { data, error } = await supabase.rpc("redeem_referral_code", {
            code_input: storedCode,
          });

          if (error) {
            console.error("Error canjeando referido:", error);
            return;
          }

          // @ts-ignore (Si data no tiene tipado automático aún)
          if (data && data.success) {
            toast({
              title: "¡Referido Aplicado!",
              description: "Se ha vinculado tu cuenta con tu invitador correctamente.",
            });
          }
          
          // 3. ¡IMPORTANTE! Borramos el código para no intentar canjearlo cada vez que entre
          localStorage.removeItem("catify_ref_code");

        } catch (err) {
          console.error("Error en proceso de referido:", err);
        }
      }
    };

    checkAndRedeemReferral();
  }, [user]); // Se ejecuta cada vez que 'user' cambia (al hacer login)

  // Este componente no renderiza nada visual
  return null;
}
