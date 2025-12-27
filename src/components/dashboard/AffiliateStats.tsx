import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, DollarSign, Gift, Loader2 } from "lucide-react";

export function AffiliateStats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<any>(null);

  // Variables para saldos reales calculados desde la nueva tabla
  const [realBalance, setRealBalance] = useState(0);
  const [totalHistorical, setTotalHistorical] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchAffiliateData = async () => {
      try {
        // 1. Obtener datos del perfil (para el código de referido)
        const { data: profile, error } = await supabase.from("affiliates").select("*").eq("user_id", user.id).single();

        if (error && error.code !== "PGRST116") {
          console.error("Error cargando afiliados:", error);
        }

        if (profile) {
          setAffiliateData(profile);
        }

        // 2. CALCULAR SALDOS REALES (La corrección clave)
        // Leemos 'affiliate_payouts' en lugar de confiar en columnas viejas
        const { data: payouts, error: payoutsError } = await supabase
          .from("affiliate_payouts" as any)
          .select("amount, status")
          .eq("user_id", user.id);

        if (!payoutsError && payouts) {
          // Saldo Disponible: Suma solo lo que está 'ready'
          const available = payouts
            .filter((p: any) => p.status === "ready")
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

          // Histórico: Suma todo lo generado
          const historical = payouts.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

          setRealBalance(available);
          setTotalHistorical(historical);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateData();
  }, [user]);

  const copyLink = () => {
    if (!affiliateData) return;
    const link = `${window.location.origin}/?ref=${affiliateData.referral_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "¡Enlace copiado!",
      description: "Compártelo para ganar el 50% de comisiones.",
    });
  };

  const handleWithdraw = () => {
    // Usamos el saldo real calculado
    const message = `Hola, soy el usuario ${user?.email}. Quiero retirar mis ganancias disponibles de $${realBalance.toFixed(2)} MXN. Mi código es ${affiliateData?.referral_code}.`;
    const whatsappUrl = `https://wa.me/528183745074?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading)
    return (
      <div className="h-32 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );

  if (!affiliateData)
    return (
      <div className="p-6 text-center border rounded-lg bg-slate-50">
        <p className="text-slate-500 mb-2">Generando tu código de afiliado...</p>
        <p className="text-xs text-slate-400">Recarga la página en unos segundos.</p>
      </div>
    );

  const referralLink = `${window.location.origin}/?ref=${affiliateData.referral_code}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* TARJETA 1: SALDO (Con datos reales) */}
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Saldo Disponible</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${realBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              +${totalHistorical.toLocaleString("es-MX")} generados históricamente
            </p>
            {realBalance > 0 && (
              <Button
                onClick={handleWithdraw}
                variant="secondary"
                size="sm"
                className="mt-3 w-full bg-white text-indigo-700 hover:bg-indigo-700 font-semibold"
              >
                Solicitar Retiro
              </Button>
            )}
          </CardContent>
        </Card>

        {/* TARJETA 2: ENLACE */}
        <Card className="col-span-1 lg:col-span-2 border-indigo-100 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <Gift className="w-5 h-5 text-purple-600" />
              ¡Gana dinero invitando amigos!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Comparte este enlace. Cuando alguien se registre y pague, tú ganarás el{" "}
              <span className="font-bold text-green-600">50% de su mensualidad</span> de los primeros 2 meses.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={referralLink}
                  className="bg-slate-50 border-slate-200 pr-10 font-mono text-xs md:text-sm text-slate-600"
                />
              </div>
              <Button onClick={copyLink} className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
                <Copy className="w-4 h-4 mr-2" /> Copiar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
