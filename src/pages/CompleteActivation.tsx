import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReplicationService } from "@/services/replication.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function CompleteActivation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [completing, setCompleting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const activateCatalog = async () => {
      // Esperar a que haya usuario y token
      if (!user || !token) {
        console.log('⏳ Esperando usuario o token...');
        console.log('Usuario:', user?.id || 'No disponible');
        console.log('Token:', token || 'No disponible');
        return;
      }

      try {
        console.log('🚀 Activando catálogo para usuario:', user.id);
        console.log('🎫 Con token:', token);
        
        // Llamar al servicio de activación
        const result = await ReplicationService.completeActivation(token, user.id);
        
        console.log('📊 Resultado de activación:', result);
        
        // Verificar que fue exitoso
        if (result && result.success) {
          console.log('✅ Catálogo activado correctamente');
          
          toast({
            title: "✅ Activación completada",
            description: "Tu catálogo está listo para usar",
          });

          // Redirigir al dashboard con el catalog_id
          setTimeout(() => {
            navigate(`/dashboard`);
          }, 1500);
        } else {
          throw new Error(result?.message || 'Error desconocido al activar');
        }
        
      } catch (err: any) {
        console.error('❌ Error activando catálogo:', err);
        setError(err.message || 'Error al activar el catálogo');
        setCompleting(false);
        
        toast({
          title: "Error",
          description: err.message || 'No se pudo activar el catálogo',
          variant: "destructive",
        });
      }
    };

    activateCatalog();
  }, [user, token, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {error ? "Error de Activación" : completing ? "Completando activación..." : "¡Listo!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          {error ? (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="mt-4"
              >
                Ir al Dashboard
              </Button>
            </>
          ) : completing ? (
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
