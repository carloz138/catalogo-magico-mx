import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MerchantService, MerchantData } from "@/services/merchant.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Landmark, ShieldCheck, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BankingSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    business_name: "",
    rfc: "",
    clabe: "",
  });

  useEffect(() => {
    if (user) loadMerchantData();
  }, [user]);

  const loadMerchantData = async () => {
    try {
      const data = await MerchantService.getMerchantStatus(user!.id);
      setMerchant(data);
    } catch (error) {
      console.error("Error cargando datos bancarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (formData.clabe.length !== 18 || isNaN(Number(formData.clabe))) {
      toast({
        title: "CLABE Inválida",
        description: "La CLABE debe tener exactamente 18 dígitos numéricos.",
        variant: "destructive"
      });
      return;
    }

    if (formData.business_name.length < 3) {
      toast({ title: "Nombre requerido", description: "Ingresa el nombre del titular de la cuenta.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await MerchantService.registerMerchant({
        business_name: formData.business_name,
        rfc: formData.rfc,
        clabe: formData.clabe,
        email: user!.email || "",
      });

      toast({
        title: "✅ ¡Cuenta Vinculada!",
        description: "Ahora puedes recibir pagos de tus clientes directamente.",
      });
      
      // Recargar datos
      loadMerchantData();

    } catch (error: any) {
      toast({
        title: "Error de Registro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-indigo-600" />
          Configuración de Pagos
        </h1>
        <p className="text-slate-500 mt-1">
          Administra dónde recibes el dinero de tus ventas.
        </p>
      </div>

      {merchant ? (
        // --- VISTA: CUENTA YA VINCULADA ---
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <ShieldCheck className="h-5 w-5" />
              Cuenta Bancaria Activa
            </CardTitle>
            <CardDescription>
              Tus datos están validados y listos para recibir depósitos vía SPEI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Beneficiario</Label>
                  <p className="font-medium text-slate-900">{merchant.business_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">CLABE Interbancaria</Label>
                  <p className="font-mono font-medium text-slate-900 tracking-wider">
                    •••• •••• •••• {merchant.clabe_deposit.slice(-4)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Estado</Label>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 mt-1">
                    {merchant.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase">ID Proveedor</Label>
                  <p className="text-xs text-slate-400 font-mono">{merchant.openpay_id}</p>
                </div>
              </div>
            </div>
            
            <Alert className="bg-blue-50 border-blue-100 text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-sm font-semibold">Información Importante</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Los pagos de tus clientes se procesan automáticamente. Los fondos se transfieren a esta cuenta una vez confirmada la transacción.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="text-slate-500" disabled>
              Editar Cuenta (Contactar Soporte)
            </Button>
          </CardFooter>
        </Card>
      ) : (
        // --- VISTA: FORMULARIO DE REGISTRO ---
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vincular Cuenta Bancaria</CardTitle>
              <CardDescription>
                Ingresa los datos donde quieres recibir tus ganancias. Usamos Openpay (BBVA) para procesar los pagos de forma segura.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre del Titular / Razón Social</Label>
                  <Input 
                    id="business_name" 
                    name="business_name"
                    placeholder="Ej. Juan Pérez o Empresa S.A. de C.V." 
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC (Opcional)</Label>
                  <Input 
                    id="rfc" 
                    name="rfc"
                    placeholder="XAXX010101000" 
                    value={formData.rfc}
                    onChange={handleInputChange}
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clabe">CLABE Interbancaria (18 dígitos)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="clabe" 
                      name="clabe"
                      type="text" 
                      inputMode="numeric"
                      maxLength={18}
                      placeholder="012180015555555555" 
                      className="pl-9 font-mono"
                      value={formData.clabe}
                      onChange={(e) => {
                        // Solo permitir números
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData(prev => ({ ...prev, clabe: val }));
                      }}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Es la clave de 18 dígitos de tu banco, no el número de tarjeta.
                  </p>
                </div>

                <Alert className="bg-slate-50 border-slate-200">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <AlertDescription className="text-xs text-slate-600">
                    Tus datos bancarios se envían encriptados directamente a nuestro procesador de pagos. No almacenamos información sensible sin protección.
                  </AlertDescription>
                </Alert>

              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Guardar y Activar Pagos
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
