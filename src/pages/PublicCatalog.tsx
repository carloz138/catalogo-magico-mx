import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Agregamos useSearchParams
import { useSaaSMarketing } from "@/providers/SaaSMarketingProvider";

const businessTypeOptions = [
  { value: "pyme", label: "PyME / Pequeña Empresa" },
  { value: "ecommerce", label: "Tienda en Línea / E-commerce" },
  { value: "distribuidor", label: "Distribuidor / Mayorista" },
  { value: "freelancer", label: "Freelancer / Consultor" },
  { value: "otros", label: "Otros" },
];

    // 1. AGREGA ESTA INTERFAZ SI NO ESTÁ
    interface PublicCatalogProps {
      subdomainSlug?: string;
    }
    
    // 2. MODIFICA LA LÍNEA DE EXPORTACIÓN PARA QUE USE "PublicCatalogProps"
    export default function PublicCatalog({ subdomainSlug }: PublicCatalogProps = {}) {
      const { slug: pathSlug } = useParams();
      const navigate = useNavigate();
      
      // Priorizar subdomainSlug sobre el path param
      const slug = subdomainSlug || pathSlug;

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { trackSaaSEvent } = useSaaSMarketing();
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: "",
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Para leer ?intent=replicate

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    full_name: "",
    business_name: "",
    business_type: "",
    phone: "",
  });

  // --- LÓGICA DE INTERCEPCIÓN POST-LOGIN (NUEVO) ---
  const handlePostLoginAction = async () => {
    // 1. Revisar si hay una clonación pendiente en LocalStorage
    const pendingCatalogId = localStorage.getItem("pending_replication_catalog_id");

    if (pendingCatalogId) {
      toast({ title: "Procesando solicitud...", description: "Estamos configurando tu catálogo." });

      try {
        // Ejecutar la RPC de clonación directa
        const { data, error } = await supabase.rpc("clone_catalog_direct", {
          p_original_catalog_id: pendingCatalogId,
        });

        if (error) throw error;

        // Limpiar la intención para no repetir
        localStorage.removeItem("pending_replication_catalog_id");

        const result = data as any; // Casteo simple

        if (result && result.success) {
          toast({
            title: "¡Catálogo Listo!",
            description: "Bienvenido. Configura tus precios para empezar a vender.",
          });
          // REDIRECCIÓN ESPECIAL: Al editor de precios
          navigate(`/reseller/edit-prices?catalog_id=${result.catalog_id}`);
          return;
        }
      } catch (err) {
        console.error("Error en autoconfiguración:", err);
        // Si falla, borramos la intención y seguimos al dashboard normal
        localStorage.removeItem("pending_replication_catalog_id");
        toast({
          variant: "destructive",
          title: "Error al clonar",
          description: "Hubo un problema clonando el catálogo, pero ya iniciaste sesión.",
        });
      }
    }

    // 2. Si no hay nada pendiente, flujo normal
    navigate("/products");
  };
  // -------------------------------------------------

  // --- ESCUCHA DE SESIÓN (Para Google Auth) ---
  useEffect(() => {
    // Si llegamos aquí y ya hay sesión (ej: redirect de Google), ejecutamos la lógica
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Pequeño delay para asegurar que el AuthContext se actualice
        setTimeout(() => handlePostLoginAction(), 500);
      }
    });
  }, []);
  // --------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: "", message: "" });
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      setFeedback({ type: "error", message: error.message });
      setLoading(false); // Solo quitamos loading si hubo error
    } else {
      toast({ title: "¡Bienvenido!", description: "Has iniciado sesión correctamente" });
      // EN LUGAR DE NAVIGATE DIRECTO, LLAMAMOS AL MANEJADOR
      await handlePostLoginAction();
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: "", message: "" });
    const { error } = await signUp(signupData.email, signupData.password, {
      full_name: signupData.full_name,
      business_name: signupData.business_name,
      business_type: signupData.business_type,
      phone: signupData.phone,
    });
    if (error) {
      setFeedback({ type: "error", message: error.message });
      setLoading(false);
    } else {
      trackSaaSEvent("CompleteRegistration", { content_name: "New User Signup" });
      setFeedback({ type: "success", message: "¡Cuenta creada! Revisa tu email para confirmar tu cuenta." });
      setLoading(false);
      // Nota: Signup requiere confirmación de email usualmente,
      // así que no redirigimos a la acción post-login todavía hasta que confirmen.
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setFeedback({ type: "error", message: `Error con Google: ${error.message}` });
      setLoading(false);
    }
    // El redirect ocurre automáticamente y lo cacha el useEffect de arriba
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: "", message: "" });
    if (!resetEmail || !resetEmail.includes("@")) {
      setFeedback({ type: "error", message: "Por favor ingresa un email válido" });
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setFeedback({ type: "success", message: "¡Enlace enviado! Revisa tu email para restablecer tu contraseña." });
      setShowResetPassword(false);
    } catch (error: any) {
      setFeedback({ type: "error", message: error.message || "Ocurrió un error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLinkLoading(true);
    setFeedback({ type: "", message: "" });

    const emailToUse = loginData.email;
    if (!emailToUse || !emailToUse.includes("@")) {
      setFeedback({ type: "error", message: "Por favor ingresa un email válido para el link mágico." });
      setMagicLinkLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: emailToUse,
      options: {
        // Si tienes una ruta específica que maneja el magic link token, úsala.
        // Si no, mandamos a login para que el useEffect lo capture.
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      setFeedback({ type: "success", message: "¡Link enviado! Revisa tu correo (y la carpeta de spam) para acceder." });
    }
    setMagicLinkLoading(false);
  };

  // Render (UI Idéntica a la tuya)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            {showResetPassword ? (
              <div className="flex items-center justify-center gap-2 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetPassword(false)}
                  className="h-6 w-6 p-0 absolute left-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Restablecer Contraseña
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 relative">
                <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="h-6 w-6 p-0 absolute left-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Accede a CatifyPro
              </div>
            )}
          </CardTitle>
          {!showResetPassword && (
            <CardDescription>
              {/* Mensaje personalizado si viene de intentar replicar */}
              {searchParams.get("intent") === "replicate"
                ? "Inicia sesión para clonar el catálogo y empezar a vender."
                : "Elige tu método preferido para acceder o crear tu cuenta."}
            </CardDescription>
          )}
        </CardHeader>

        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4 p-6 pt-0">
            {feedback.type && (
              <Alert
                variant={feedback.type === "error" ? "destructive" : "default"}
                className={feedback.type === "success" ? "bg-green-50 border-green-200" : ""}
              >
                {feedback.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar enlace
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setShowResetPassword(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </form>
        ) : (
          <>
            {feedback.type && feedback.type !== "success" && (
              <div className="px-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{feedback.message}</AlertDescription>
                </Alert>
              </div>
            )}
            {feedback.type === "success" && (
              <div className="px-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{feedback.message}</AlertDescription>
                </Alert>
              </div>
            )}

            <Tabs defaultValue="login" className="w-full p-6 pt-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="google"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O</span>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm h-auto"
                        onClick={() => setShowResetPassword(true)}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Lock className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O</span>
                    </div>
                  </div>

                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      ¿Vienes a revisar un pedido o tu catálogo activado?
                    </p>
                    <div>
                      <Label htmlFor="magic-email">Email</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="Ingresa tu email"
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        disabled={magicLinkLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="secondary"
                      disabled={magicLinkLoading || !loginData.email}
                    >
                      {magicLinkLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Enviar Link de Acceso
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="google"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Crear cuenta con Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="full-name">Nombre Completo</Label>
                      <Input
                        id="full-name"
                        type="text"
                        value={signupData.full_name}
                        onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-name">Nombre del Negocio</Label>
                      <Input
                        id="business-name"
                        type="text"
                        value={signupData.business_name}
                        onChange={(e) => setSignupData({ ...signupData, business_name: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-type">Tipo de Negocio</Label>
                      <Select
                        value={signupData.business_type}
                        onValueChange={(value) => setSignupData({ ...signupData, business_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de negocio" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear Cuenta
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
}
