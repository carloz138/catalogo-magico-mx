import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, MessageCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReferralLinkCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Buscamos el código corto real en la base de datos
  useEffect(() => {
    if (!user) return;

    const fetchReferralCode = async () => {
      try {
        const { data, error } = await supabase
          .from("affiliates")
          .select("referral_code")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setReferralCode(data.referral_code);
        }
      } catch (error) {
        console.error("Error buscando código de referido:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralCode();
  }, [user]);

  // 2. Construimos el link con el código correcto
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = referralCode ? `${origin}/register?ref=${referralCode}` : "Generando enlace...";

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!referralCode) return;
    const text = encodeURIComponent(
      `¡Hola! Te recomiendo usar CatifyPro para vender más. Regístrate aquí: ${referralLink}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!user) return null;

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-white border-indigo-100 mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <CardTitle className="text-indigo-900 flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5" /> Tu Link de Referido
            </CardTitle>
            <CardDescription className="text-indigo-700/80 mt-1">
              Comparte este link. Cuando alguien se registre y pague, ¡tú ganas comisión!
            </CardDescription>
          </div>
          {/* Ajustamos el texto para que coincida con tu nueva regla del 50% */}
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 px-3 py-1">
            Gana el 50% de sus primeros 2 meses
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              readOnly
              value={loading ? "Cargando..." : referralLink}
              className="pr-10 bg-white border-indigo-200 text-slate-600 font-medium select-all"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              disabled={loading || !referralCode}
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 min-w-[100px]"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>

            <Button
              onClick={handleWhatsApp}
              disabled={loading || !referralCode}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
