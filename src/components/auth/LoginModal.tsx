import { useState, useEffect } from "react"; // [+] Agregué useEffect
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Gift } from "lucide-react"; // [+] Agregué Gift
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom"; // [+] Agregué useLocation
import { Badge } from "@/components/ui/badge"; // [+] Agregué Badge

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const { signIn, signUp } = useAuth(); // [+] Ya no usamos signInWithGoogle del context para poder pasar params
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // [+] Hooks para detectar URL
  const location = useLocation();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // [+] Efecto para capturar el código de referido
  useEffect(() => {
    if (!open) return; // Solo ejecutar si el modal está abierto

    const params = new URLSearchParams(location.search);
    const refParam = params.get("ref");

    if (refParam) {
      setReferralCode(refParam);
      localStorage.setItem("catify_ref_code", refParam);
    } else {
      const storedRef = localStorage.getItem("catify_ref_code");
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }
  }, [location, open]);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    full_name: "",
    business_name: "",
    business_type: "",
    phone: "",
  });

  const businessTypeOptions = [
    { value: "pyme", label: "PyME / Pequeña Empresa" },
    { value: "ecommerce", label: "Tienda en Línea / E-commerce" },
    { value: "distribuidor", label: "Distribuidor / Mayorista" },
    { value: "freelancer", label: "Freelancer / Consultor" },
    { value: "otros", label: "Otros" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // [+] Agregamos referral_code a la metadata
    const { error } = await signUp(signupData.email, signupData.password, {
      full_name: signupData.full_name,
      business_name: signupData.business_name,
      business_type: signupData.business_type,
      phone: signupData.phone,
      referral_code: referralCode, // <--- AQUÍ SE ENVÍA
    });

    if (error) {
      toast({
        title: "Error al crear cuenta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // [+] Limpiar storage si éxito
      if (referralCode) localStorage.removeItem("catify_ref_code");

      toast({
        title: "¡Cuenta creada!",
        description: "Revisa tu email para confirmar tu cuenta",
      });
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    // [+] Usamos supabase directo para pasar queryParams con el ref
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: referralCode ? { ref: referralCode } : undefined,
      },
    });

    if (error) {
      toast({
        title: "Error al iniciar sesión con Google",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!resetEmail || !resetEmail.includes("@")) {
      toast({
        title: "Error de validación",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error al enviar enlace",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Enlace enviado!",
          description: "Te enviamos un enlace para restablecer tu contraseña. Revisa tu email.",
        });
        setShowResetPassword(false);
        setResetEmail("");
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showResetPassword ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail("");
                  }}
                  className="h-6 w-6 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Restablecer Contraseña
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span>Accede a CatifyPro</span>

                {/* [+] Badge Visual si hay código */}
                {referralCode && (
                  <Badge
                    variant="secondary"
                    className="w-fit bg-emerald-100 text-emerald-700 border-emerald-200 flex gap-1 items-center px-2 py-0.5 text-xs font-normal"
                  >
                    <Gift className="h-3 w-3" />
                    Código de invitado aplicado
                  </Badge>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Ingresa tu email"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar enlace de restablecimiento
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowResetPassword(false);
                setResetEmail("");
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
          </form>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline" // Ajusté a outline para que coincida con Google Style usualmente
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                  )}
                  Continuar con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="Ingresa tu email"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
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
                      className="px-0 h-auto font-normal text-xs"
                      onClick={() => setShowResetPassword(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <div className="space-y-4">
                {/* Google Button for Signup too */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                  )}
                  Registrarse con Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O crea una cuenta con email</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="full-name">Nombre Completo</Label>
                    <Input
                      id="full-name"
                      value={signupData.full_name}
                      onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-name">Nombre del Negocio (Opcional)</Label>
                    <Input
                      id="business-name"
                      value={signupData.business_name}
                      onChange={(e) => setSignupData({ ...signupData, business_name: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-type">Tipo de Negocio</Label>
                    <Select
                      value={signupData.business_type}
                      onValueChange={(value) => setSignupData({ ...signupData, business_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
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
                    <Label htmlFor="phone">Teléfono (Opcional)</Label>
                    <Input
                      id="phone"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      disabled={loading}
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
        )}
      </DialogContent>
    </Dialog>
  );
};
