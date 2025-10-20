import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X, CheckCircle, Mail } from "lucide-react";
import { ReplicationService } from "@/services/replication.service";
import { ComparisonTable } from "@/components/replication/ComparisonTable"; // Consider removing if activation is free
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
  const [activationMessage, setActivationMessage] = useState(""); // State to hold the message

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
    setError(null); // Clear previous errors on load
    try {
      // Check expiration first (optional, depends on your logic)
      // const expired = await ReplicationService.checkExpiration(token);
      // setIsExpired(expired);
      // if (expired) {
      //  setLoading(false);
      //  return; // Stop loading if expired
      // }

      // Get catalog data
      const data = await ReplicationService.getCatalogByToken(token);
      setCatalog(data);

      // Pre-fill email if available from replica data (optional)
      if (data?.reseller_email) {
        setEmail(data.reseller_email);
      }
    } catch (err: any) {
      console.error("Error loading catalog:", err);
      // More specific error handling based on message
      if (err.message?.includes("inválido") || err.message?.includes("expirado") || err.message?.includes("activo")) {
        setError(err.message); // Show specific error message from backend
      } else {
        setError("No se pudo cargar la información del catálogo. Por favor, verifica el link.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!catalog) return;
    setShowEmailForm(true); // Show the email input form
  };

  // --- THIS IS THE CORRECT VERSION of handleActivateWithEmail ---
  const handleActivateWithEmail = async () => {
    if (!email || !catalog || !token) return; // Ensure token is also checked

    setActivating(true);
    setError(null); // Clear previous errors before attempting activation
    try {
      // Call the service function that invokes the Edge Function
      const result = await ReplicationService.activateWithEmail({
        token: token,
        email,
        name,
      });

      // Update state based on the function's response
      setActivationMessage(result.message); // Store the message ("Revisa tu email...")
      setActivated(true); // Switch UI to show the "Check your email" view

      // No toast needed here as the UI changes significantly to inform the user
    } catch (error: any) {
      console.error("Error activating:", error);
      // Display the specific error message coming from the Edge Function or service
      setError(error.message || "No se pudo iniciar el proceso de activación. Verifica el email e inténtalo de nuevo.");
      toast({
        // Optional: Keep toast for specific errors if desired
        title: "Error de Activación",
        description: error.message || "Inténtalo de nuevo.",
        variant: "destructive",
      });
      // Important: Do NOT set activated to true if there was an error
      setActivated(false);
    } finally {
      setActivating(false);
    }
  };

  // --- REMOVED THE DUPLICATE DEFINITION OF handleActivateWithEmail ---

  // --- Consider removing handleContinueFree if activation is always free ---
  const handleContinueFree = () => {
    toast({
      title: "Función no disponible", // Or redirect if you have a preview mode
      description: "Por favor, activa el catálogo para continuar.",
    });
    // if (catalog) {
    //   // Potentially redirect to a read-only view using catalog.slug or similar
    // }
  };

  // --- Render Logic ---

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

  // Handle specific errors like invalid/expired/already active token
  if (error || !catalog) {
    // Added !catalog check for safety
    // Check for specific error messages we might expect
    const isAlreadyActive = error?.includes("ya ha sido activado");
    const isInvalidOrExpired = error?.includes("inválido") || error?.includes("expirado");

    if (isAlreadyActive) {
      // UI for already active catalog
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Catálogo ya activo</h2>
              <p className="text-gray-600 mb-6">{error || "Este catálogo ya ha sido activado."}</p>
              <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (isInvalidOrExpired) {
      // UI for invalid or expired token
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enlace Inválido o Expirado</h2>
              <p className="text-gray-600 mb-6">{error || "El link de activación no es válido o ha expirado"}</p>
              <Button onClick={() => navigate("/")} variant="outline">
                Ir al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default error UI if catalog data couldn't be fetched for other reasons
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || "No se pudo cargar la información del catálogo."}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Removed redundant is_active check here, handled by error logic now

  // Removed isExpired check here, handled by error logic now

  // --- Main Activation View ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              {/* Consider using your actual logo component if available */}
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CatifyPro</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/login")}>
            {" "}
            {/* Changed target to /login */}
            ¿Ya tienes cuenta? Inicia Sesión
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">🎉 ¡Tu catálogo gratuito está listo!</h1>
          <p className="text-xl text-gray-600 mb-2">
            <span className="font-semibold text-indigo-600">
              {catalog.distributor_name || catalog.distributor_company || "Tu proveedor"}
            </span>{" "}
            te ha creado un catálogo profesional
          </p>
          <p className="text-lg text-gray-500">con {catalog.product_count || 0} productos</p> {/* Added fallback */}
        </div>

        {/* --- Consider Removing Comparison Table if Activation is Free --- */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Beneficios al Activar</h2>
          {/* Replace ComparisonTable with a simple list or grid of benefits */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
              <Check className="h-6 w-6 flex-shrink-0 mt-1 text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Productos ilimitados y sin expiración</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
              <Check className="h-6 w-6 flex-shrink-0 mt-1 text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Recibe cotizaciones 24/7 de tus clientes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
              <Check className="h-6 w-6 flex-shrink-0 mt-1 text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Panel para gestionar pedidos y clientes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
              <Check className="h-6 w-6 flex-shrink-0 mt-1 text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Comparte tu propio link de catálogo</p>
              </div>
            </div>
          </div>
          {/* <ComparisonTable /> */}
        </div>

        {/* CTA Section or "Check Email" UI */}
        {!activated ? (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white mb-8">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Activa tu catálogo GRATIS</h3>
              {/* Removed the redundant feature list from here */}
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
                      Te enviaremos un link para confirmar/acceder a tu cuenta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="email-input" className="text-sm font-medium mb-2 block text-gray-900">
                        Email *
                      </label>
                      <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" // Added text color
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="name-input" className="text-sm font-medium mb-2 block text-gray-900">
                        Nombre (opcional)
                      </label>
                      <input
                        id="name-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" // Added text color
                      />
                    </div>
                    {/* Display specific error messages from activation attempt */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEmailForm(false);
                          setError(null);
                        }} // Hide form and clear error
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
                        {activating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activando...
                          </>
                        ) : (
                          "Activar"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          // --- UI shown AFTER successful call to activateWithEmail ---
          <Card className="max-w-2xl mx-auto mt-8 border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-center text-2xl flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="w-8 h-8 text-green-600" />
                ¡Activación Iniciada!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Revisa tu email</h3>
                <p className="text-gray-600 mb-4">
                  {/* Use the specific message from the backend */}
                  {activationMessage || `Te hemos enviado un link a ${email} para completar el proceso.`}
                </p>
                <p className="text-sm text-gray-500">
                  Haz clic en el link del email para confirmar tu cuenta y/o acceder a tu dashboard.
                </p>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>¿No ves el email?</strong> Revisa tu carpeta de spam o correo no deseado. El email puede
                  tardar unos minutos en llegar.
                </AlertDescription>
              </Alert>
              {/* Optional: Add a button to resend email if needed later */}
            </CardContent>
          </Card>
        )}

        {/* Info adicional */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Activación Rápida</h4>
            <p className="text-sm text-gray-600">Tu catálogo estará listo en minutos</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-3">💰</div>
            <h4 className="font-semibold text-gray-900 mb-2">100% Gratuito</h4>
            <p className="text-sm text-gray-600">Este catálogo replicado no tiene costo</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="text-3xl mb-3">📱</div>
            <h4 className="font-semibold text-gray-900 mb-2">Multiplataforma</h4>
            <p className="text-sm text-gray-600">Funciona en móvil, tablet y desktop</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 px-4 text-center text-sm text-gray-600 border-t">
        <p>
          Powered by <span className="font-semibold text-indigo-600">CatifyPro</span> | La manera más fácil de crear
          catálogos digitales
        </p>
      </footer>
    </div>
  );
}
