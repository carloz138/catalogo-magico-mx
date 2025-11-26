import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Directo para Auth
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, Rocket, Lock, Mail, AlertCircle } from "lucide-react";
import { ReplicationService } from "@/services/replication.service";
import { useToast } from "@/hooks/use-toast";
import type { CatalogByTokenResponse } from "@/types/digital-catalog";
import { useAuth } from "@/contexts/AuthContext"; // Usamos el contexto global

export default function ActivateCatalog() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, user } = useAuth(); // Usamos hooks de Auth

  const [catalog, setCatalog] = useState<CatalogByTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Form States
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", fullName: "" });

  // 1. Cargar Catálogo al inicio
  useEffect(() => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }
    loadCatalog();
  }, [token]);

  // 2. Si el usuario YA tiene sesión (o acaba de iniciar), intentar activar
  useEffect(() => {
    if (user && catalog && !catalog.is_active) {
      handleDirectActivation(user.id);
    }
  }, [user, catalog]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await ReplicationService.getCatalogByToken(token);
      setCatalog(data);

      // Si ya está activo, redirigir
      if (data.is_active) {
        // Opcional: Validar si soy yo el dueño
        toast({ title: "Catálogo ya activo", description: "Redirigiendo..." });
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Error loading catalog:", err);
      setError(err.message || "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE ACTIVACIÓN FINAL ---
  const handleDirectActivation = async (userId: string) => {
    setAuthLoading(true);
    try {
      console.log("🚀 Activando catálogo para usuario:", userId);

      // Llamamos a la función simplificada que crearemos en el siguiente paso
      // O usamos un update directo si tenemos permisos (pero mejor via función segura)
      await supabase.functions.invoke("activate-replicated-catalog", {
        body: {
          token,
          user_id: userId,
          strategy: "direct_link", // Flag para la nueva lógica
        },
      });

      toast({
        title: "🎉 ¡Bienvenido a bordo!",
        description: "Tu catálogo ha sido activado exitosamente.",
      });

      navigate("/dashboard"); // Redirección final
    } catch (error: any) {
      console.error("Error activating:", error);
      toast({ title: "Error de Activación", description: error.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  // --- HANDLERS DE AUTH (Replicados de LoginPage pero simplificados) ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setAuthLoading(false);
    }
    // Si es exitoso, el useEffect[user] disparará la activación
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    // SignUp normal
    const { data, error } = await signUp(signupData.email, signupData.password, {
      full_name: signupData.fullName,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setAuthLoading(false);
    } else {
      // Si requiere confirmación de email, avisamos
      if (data.user && !data.session) {
        toast({ title: "Revisa tu correo", description: "Confirma tu cuenta para continuar la activación." });
        setAuthLoading(false);
      }
      // Si entra directo (sesión activa), el useEffect hará el resto
    }
  };

  const handleGoogle = async () => {
    setAuthLoading(true);
    await signInWithGoogle();
    // El redirect manejará el resto, pero idealmente deberíamos guardar el token en localStorage
    // o pasarlo como query param state para recuperarlo al volver, pero Supabase Auth a veces pierde el contexto.
    // Para MVP simple: El usuario vuelve a hacer clic en el link del correo si se pierde.
  };

  // --- RENDER ---

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );

  if (error || !catalog) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Enlace no válido</h3>
            <p className="text-slate-500 mt-2">{error}</p>
            <Button className="mt-6" onClick={() => navigate("/")}>
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-4">
      {/* Header Info */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-4">
          <Rocket className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Activa tu Negocio</h1>
        <p className="text-slate-600">
          Estás a un paso de activar tu catálogo replicado de{" "}
          <span className="font-semibold text-indigo-700">{catalog.distributor_name || "Tu Proveedor"}</span>.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Bienvenido</CardTitle>
          <CardDescription className="text-center">
            Accede o crea una cuenta para vincular este catálogo a tu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            {/* --- LOGIN --- */}
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogle}
                  disabled={authLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">O con email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={authLoading}>
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar y Activar"}
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* --- SIGNUP --- */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    required
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    required
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={authLoading}>
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Cuenta y Activar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-slate-500">
        Powered by <strong>CatifyPro</strong>
      </p>
    </div>
  );
}
