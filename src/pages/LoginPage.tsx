import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSaaSMarketing } from "@/providers/SaaSMarketingProvider";

const businessTypeOptions = [
  { value: "pyme", label: "PyME / Pequeña Empresa" },
  { value: "ecommerce", label: "Tienda en Línea / E-commerce" },
  { value: "distribuidor", label: "Distribuidor / Mayorista" },
  { value: "freelancer", label: "Freelancer / Consultor" },
  { value: "otros", label: "Otros" },
];

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
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
  const location = useLocation();

  // ✅ CAMBIO 1: El default ahora es "/dashboard" (La página segura para todos)
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get("redirect_to");
    if (redirectTo) {
      console.log("📍 Detectada redirección pendiente a:", redirectTo);
      setRedirectPath(redirectTo);
    }
  }, [location]);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    full_name: "",
    business_name: "",
    business_type: "",
    phone: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: "", message: "" });
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      toast({ title: "¡Bienvenido!", description: "Has iniciado sesión correctamente" });
      navigate(redirectPath);
    }
    setLoading(false);
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
    } else {
      trackSaaSEvent("CompleteRegistration", { content_name: "New User Signup" });
      setFeedback({ type: "success", message: "¡Cuenta creada! Revisa tu email para confirmar tu cuenta." });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // ✅ CAMBIO 2: Si no hay redirectPath específico, usa /dashboard
          redirectTo: `${window.location.origin}${redirectPath === "/dashboard" ? "/dashboard" : redirectPath}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setFeedback({ type: "error", message: `Error con Google: ${error.message}` });
      setLoading(false);
    }
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

    // ✅ CAMBIO 3: Aseguramos el fallback a /dashboard
    const destinationUrl = `${window.location.origin}${redirectPath}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: emailToUse,
      options: {
        emailRedirectTo: destinationUrl,
      },
    });

    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      setFeedback({ type: "success", message: "¡Link enviado! Revisa tu correo (y la carpeta de spam) para acceder." });
    }
    setMagicLinkLoading(false);
  };

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
              {redirectPath.includes("quotes")
                ? "Inicia sesión para ver tu cotización."
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
