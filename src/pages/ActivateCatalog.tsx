import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { ReplicationService } from "@/services/replication.service";
import { ComparisonTable } from "@/components/replication/ComparisonTable";
import { useToast } from "@/hooks/use-toast";
import type { CatalogByTokenResponse } from "@/types/digital-catalog";

export default function ActivateCatalog() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [catalog, setCatalog] = useState<CatalogByTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }

    loadCatalog();
  }, [token]);

  const loadCatalog = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Verificar expiración
      const expired = await ReplicationService.checkExpiration(token);
      setIsExpired(expired);

      // Obtener datos del catálogo
      const data = await ReplicationService.getCatalogByToken(token);
      setCatalog(data);
    } catch (err: any) {
      console.error("Error loading catalog:", err);
      setError(err.message || "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = () => {
    // Redirigir a página de pago/registro
    // Por ahora redirigimos a registro con el token en query
    navigate(`/register?activation_token=${token}`);
  };

  const handleContinueFree = () => {
    toast({
      title: "Modo gratuito",
      description: "Catálogo disponible por 30 días (solo vista)",
    });
    // Redirigir a vista del catálogo público (sin activar)
    if (catalog) {
      // Necesitaremos obtener el slug del catálogo original
      toast({
        title: "Función en desarrollo",
        description: "Pronto podrás ver el catálogo en modo gratuito",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Catálogo no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "El link de activación no es válido o ha expirado"}
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (catalog.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Catálogo ya activo
            </h2>
            <p className="text-gray-600 mb-6">
              Este catálogo ya ha sido activado. Inicia sesión para gestionarlo.
            </p>
            <Button onClick={() => navigate("/login")}>
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Catálogo expirado
            </h2>
            <p className="text-gray-600 mb-4">
              Este catálogo gratuito ha expirado (30 días).
            </p>
            <p className="text-gray-600 mb-6">
              Puedes activarlo por $29 MXN para tener acceso ilimitado.
            </p>
            <Button onClick={handleActivate} className="w-full">
              Activar por $29 MXN
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CatifyPro</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ¿Ya tienes cuenta?
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🎉 ¡Tu catálogo está listo!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            <span className="font-semibold text-indigo-600">
              {catalog.distributor_name || catalog.distributor_company || "Tu proveedor"}
            </span>{" "}
            te ha creado un catálogo profesional
          </p>
          <p className="text-lg text-gray-500">
            con {catalog.product_count} productos
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Elige tu plan
          </h2>
          <ComparisonTable />
        </div>

        {/* CTA Principal */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Activa tu catálogo por solo $29 MXN
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-left mb-8">
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Productos ilimitados</p>
                  <p className="text-sm text-indigo-100">
                    No te limites a 50 productos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Sin expiración</p>
                  <p className="text-sm text-indigo-100">
                    Úsalo todo el tiempo que necesites
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Cotizaciones 24/7</p>
                  <p className="text-sm text-indigo-100">
                    Recibe pedidos automáticamente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Panel de gestión</p>
                  <p className="text-sm text-indigo-100">
                    Controla todos tus pedidos
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleActivate}
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto font-bold"
            >
              🚀 Activar ahora por $29 MXN (pago único)
            </Button>
          </div>
        </div>

        {/* Opción gratuita */}
        <div className="text-center">
          <button
            onClick={handleContinueFree}
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            Continuar con versión gratuita (50 productos, 30 días, solo vista)
          </button>
        </div>

        {/* Info adicional */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Activación instantánea
            </h4>
            <p className="text-sm text-gray-600">
              Tu catálogo estará listo en menos de 1 minuto
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-3">💰</div>
            <h4 className="font-semibold text-gray-900 mb-2">Pago único</h4>
            <p className="text-sm text-gray-600">
              Solo $29 MXN, sin suscripciones ni cargos ocultos
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-3">📱</div>
            <h4 className="font-semibold text-gray-900 mb-2">
              100% responsive
            </h4>
            <p className="text-sm text-gray-600">
              Funciona perfecto en móvil, tablet y desktop
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 px-4 text-center text-sm text-gray-600 border-t">
        <p>
          Powered by <span className="font-semibold text-indigo-600">CatifyPro</span> |
          La manera más fácil de crear catálogos digitales
        </p>
      </footer>
    </div>
  );
}
