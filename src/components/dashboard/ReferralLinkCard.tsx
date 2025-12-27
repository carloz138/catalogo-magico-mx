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

  useEffect(() => {
    const fetchRefCode = async () => {
      if (!user) return;
      try {
        // CORRECCIÓN: Leemos de la tabla 'affiliates'
        const { data, error } = await supabase
          .from("affiliates")
          .select("referral_code")
          .eq("user_id", user.id) // Asumimos que la tabla tiene user_id vinculado
          .single();

        if (error) {
          // Si no encuentra registro, tal vez el usuario es nuevo y no tiene código aún.
          // Podrías manejar la creación aquí si fuera necesario.
          console.error("No se encontró código de afiliado:", error);
        } else {
          setReferralCode(data?.referral_code);
        }
      } catch (err) {
        console.error("Error obteniendo código:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRefCode();
  }, [user]);

  // Si no hay código cargado, mostramos el ID como respaldo o "Cargando..."
  const codeToUse = referralCode || (loading ? "..." : user?.id);

  // Construimos el link. Ajusta '/register' si tu ruta es diferente.
  const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${codeToUse}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te recomiendo usar CatifyPro. Regístrate con mi código ${codeToUse} aquí: ${link}`,
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
              Comparte este link. Cuando alguien se registre con tu código, ¡tú ganas comisión!
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1 mb-1">
              Gana $250 MXN / mes
            </Badge>
            {referralCode && (
              <span className="text-xs text-indigo-500 font-mono">
                Código: <strong>{referralCode}</strong>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              readOnly
              value={loading ? "Cargando..." : link}
              className="pr-10 bg-white border-indigo-200 text-slate-600 font-medium select-all"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              disabled={loading}
              variant="outline"
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 min-w-[100px]"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>

            <Button
              onClick={handleWhatsApp}
              disabled={loading}
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
