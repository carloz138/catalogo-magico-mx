import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Landmark, Copy, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OpenpayDemo() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{ clabe: string; bank: string; amount: number } | null>(null);

  // ID Fijo que creamos en el SQL (Demo Quote)
  const DEMO_QUOTE_ID = "00000000-0000-0000-0000-000000000000"; 

  const handlePay = async () => {
    setLoading(true);
    try {
      console.log("💳 Iniciando demo de pago...");
      
      // Reutilizamos tu función existente que ya funciona
      const { data, error } = await supabase.functions.invoke("create-quote-payment", {
        body: { quoteId: DEMO_QUOTE_ID },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPaymentData({
        clabe: data.payment_method.clabe,
        bank: data.payment_method.bank || "STP",
        amount: data.amount,
      });
      
      setShowModal(true);
      toast({ title: "✅ Ficha Generada", description: "Prueba exitosa para Openpay." });

    } catch (error: any) {
      console.error("Error demo:", error);
      toast({ 
        title: "Error", 
        description: "No se pudo generar el pago. Verifica que el usuario dueño tenga merchant_id.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Simple */}
      <header className="bg-white border-b py-4 px-6 flex justify-between items-center">
        <div className="font-bold text-xl text-indigo-600">CatifyPro</div>
        <div className="text-sm text-slate-500">Entorno de Pruebas</div>
      </header>

      <main className="flex-1 container mx-auto py-12 px-4 flex flex-col items-center">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Demo de Checkout SPEI</h1>
          <p className="text-slate-600">
            Esta página demuestra el flujo de pago mediante Transferencia Interbancaria (SPEI) 
            utilizando la infraestructura de Openpay.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl border-indigo-100">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-slate-900">Plan Demo / Producto Prueba</CardTitle>
                <p className="text-sm text-slate-500 mt-1">SKU: DEMO-001</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Disponible</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-between items-center py-2 border-b border-dashed">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">$10.00 MXN</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-dashed">
              <span className="text-slate-600">Comisión por uso</span>
              <span className="font-medium">$0.00 MXN</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-slate-900">Total a Pagar</span>
              <span className="text-2xl font-bold text-indigo-600">$10.00</span>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 flex gap-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <p>
                Al realizar el pago, aceptas nuestros <a href="/terms-and-conditions" className="underline font-semibold">Términos y Condiciones</a> y <a href="/privacy-policy" className="underline font-semibold">Política de Privacidad</a>.
              </p>
            </div>
          </CardContent>

          <CardFooter className="pb-6">
            <Button 
              size="lg" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Landmark className="w-5 h-5 mr-2" />}
              {loading ? "Procesando..." : "Pagar con Transferencia (SPEI)"}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 flex gap-6 text-sm text-slate-400">
            <span>Powered by Openpay</span>
            <span>•</span>
            <span>SSL Secure Connection</span>
        </div>
      </main>

      {/* MODAL DE RESPUESTA (Simulación de Ficha) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-indigo-900">Ficha de Pago Generada</DialogTitle>
            <DialogDescription className="text-center">El flujo de generación de CLABE fue exitoso.</DialogDescription>
          </DialogHeader>
          
          {paymentData && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">Banco</p>
                <p className="font-semibold text-slate-900 mb-4">{paymentData.bank}</p>
                
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">CLABE</p>
                <div className="flex items-center justify-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border font-mono text-lg font-bold">{paymentData.clabe}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.clabe)}><Copy className="w-4 h-4"/></Button>
                </div>
              </div>
              
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800 text-xs">
                    Esta es una prueba en entorno Sandbox. En producción, esta CLABE sería única para el pedido.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper simple para Badge si no lo tienes importado globalmente
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${className}`}>{children}</span>;
}
