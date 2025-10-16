import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReplicationService } from "@/services/replication.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompleteActivation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [completing, setCompleting] = useState(true);

  useEffect(() => {
    if (user && token) {
      completeSetup();
    }
  }, [user, token]);

  const completeSetup = async () => {
    if (!user?.id || !token) return;

    try {
      await ReplicationService.completeActivation(token, user.id);
      
      toast({
        title: "✅ Activación completada",
        description: "Tu catálogo está listo para usar",
      });

      // Obtener catalog_id
      const catalogInfo = await ReplicationService.getCatalogByToken(token);
      navigate(`/dashboard/reseller?catalog_id=${catalogInfo.catalog_id}`);
    } catch (error: any) {
      console.error("Error completing activation:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {completing ? "Completando activación..." : "¡Listo!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          {completing ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Configurando tu catálogo...</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Redirigiendo a tu dashboard...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
