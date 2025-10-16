import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X, CheckCircle, Mail } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

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

  const handleActivate = async () => {
    if (!catalog) return;
    setShowEmailForm(true);
  };

  const handleActivateWithEmail = async () => {
    if (!email || !catalog) return;

    setActivating(true);
    try {
      const result = await ReplicationService.activateWithEmail({
        token: token!,
        email,
        name,
      });

      toast({
        title: "✅ ¡Catálogo activado!",
        description: result.message,
      });

      setActivated(true);
    } catch (error: any) {
      console.error("Error activating:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo activar el catálogo",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
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
              Puedes activarlo GRATIS para tener acceso ilimitado.
            </p>
            <Button onClick={handleActivate} className="w-full">
              Activar GRATIS
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
            🎉 ¡Tu catálogo gratuito está listo!
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
        {!activated ? (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white mb-8">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Activa tu catálogo GRATIS
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
                    <p className="font-semibold">Sin costo, sin expiración</p>
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
              {!showEmailForm ? (
                <Button
                  size="lg"
                  onClick={handleActivate}
                  className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto font-bold"
                >
                  🚀 Activar catálogo GRATIS
                </Button>
              ) : (
                <Card className="w-full max-w-md mx-auto mt-6 text-left">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Ingresa tu email para activar</CardTitle>
                    <CardDescription className="text-gray-600">
                      Te enviaremos un link mágico para acceder a tu dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-gray-900">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-gray-900">Nombre (opcional)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowEmailForm(false)}
                        disabled={activating}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleActivateWithEmail}
                        disabled={!email || activating}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        {activating ? "Activando..." : "Activar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto mt-8 border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                ¡Catálogo Activado Exitosamente!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-xl font-bold mb-2">Revisa tu email</h3>
                <p className="text-gray-600 mb-4">
                  Te hemos enviado un <strong>magic link</strong> a <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Haz clic en el link del email para acceder a tu dashboard y empezar a compartir tu catálogo
                </p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>¿No ves el email?</strong> Revisa tu carpeta de spam o correo no deseado.
                  El email puede tardar hasta 2 minutos en llegar.
                </AlertDescription>
              </Alert>

              <div className="border-t pt-6">
                <p className="text-sm text-center text-gray-500 mb-4">
                  Mientras esperas, aquí está lo que puedes hacer con tu catálogo:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl mb-2">📦</div>
                    <p className="text-sm font-semibold">Productos ilimitados</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl mb-2">💼</div>
                    <p className="text-sm font-semibold">Cotizaciones automáticas</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl mb-2">📊</div>
                    <p className="text-sm font-semibold">Analytics en tiempo real</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opción gratuita - ELIMINADA ya que todo es gratis */}

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
            <h4 className="font-semibold text-gray-900 mb-2">100% Gratuito</h4>
            <p className="text-sm text-gray-600">
              Sin pagos, sin suscripciones, sin cargos ocultos
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
