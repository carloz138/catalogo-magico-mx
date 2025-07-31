
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Clock, Building2, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  amount_mxn: number;
  credits_purchased: number;
  payment_method: string;
  payment_status: string;
  spei_clabe: string;
  spei_reference: string;
  expires_at: string;
  package: {
    name: string;
  };
}

const PaymentInstructions = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    if (transactionId) {
      fetchTransaction();
    }
  }, [user, transactionId, navigate]);

  useEffect(() => {
    if (!transaction?.expires_at) return;

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(transaction.expires_at).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [transaction]);

  const fetchTransaction = async () => {
    if (!transactionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount_mxn,
          credits_purchased,
          payment_method,
          payment_status,
          spei_clabe,
          spei_reference,
          expires_at,
          credit_packages:package_id (
            name
          )
        `)
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setTransaction({
        ...data,
        package: data.credit_packages || { name: 'Paquete de créditos' }
      });
      
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del pago",
        variant: "destructive",
      });
      navigate('/checkout');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  const checkPaymentStatus = async () => {
    if (!transaction) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('payment_status')
        .eq('id', transaction.id)
        .single();

      if (error) throw error;

      if (data.payment_status === 'completed') {
        toast({
          title: "¡Pago confirmado!",
          description: "Tus créditos han sido agregados a tu cuenta",
        });
        navigate('/');
      } else {
        toast({
          title: "Pago pendiente",
          description: "Aún no hemos recibido tu transferencia",
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Error",
        description: "Error al verificar el estado del pago",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando información del pago...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pago no encontrado</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar la información del pago</p>
          <Button onClick={() => navigate('/checkout')}>
            Volver al checkout
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(transaction.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Instrucciones de Pago SPEI</h1>
          <p className="text-gray-600 mt-1">Realiza tu transferencia bancaria</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Instructions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`border rounded-lg p-6 ${
              isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center mb-3">
                {isExpired ? (
                  <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                ) : (
                  <Clock className="w-6 h-6 text-blue-500 mr-3" />
                )}
                <h3 className="font-semibold">
                  {isExpired ? 'Pago Expirado' : 'Pago Pendiente'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {isExpired 
                  ? 'Este pago ha expirado. Genera uno nuevo desde el checkout.'
                  : 'Tienes hasta 24 horas para completar tu transferencia'
                }
              </p>
              {!isExpired && (
                <p className="font-medium">
                  Tiempo restante: <span className="text-blue-600">{timeRemaining}</span>
                </p>
              )}
            </div>

            {/* SPEI Instructions */}
            {!isExpired && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Building2 className="w-6 h-6 text-primary mr-3" />
                  <h3 className="font-semibold text-lg">Datos para transferencia SPEI</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">CLABE Interbancaria</label>
                    <div className="flex items-center mt-1">
                      <code className="bg-gray-100 px-3 py-2 rounded flex-1 font-mono">
                        {transaction.spei_clabe}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => copyToClipboard(transaction.spei_clabe, 'CLABE')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Referencia de pago</label>
                    <div className="flex items-center mt-1">
                      <code className="bg-gray-100 px-3 py-2 rounded flex-1 font-mono">
                        {transaction.spei_reference}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => copyToClipboard(transaction.spei_reference, 'Referencia')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Monto exacto</label>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-primary">
                        ${(transaction.amount_mxn / 100).toLocaleString()} MXN
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Importante: Transfiere el monto exacto para que se procese automáticamente
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Concepto</label>
                    <p className="mt-1 text-sm text-gray-900">
                      Compra de créditos - {transaction.spei_reference}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!isExpired && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Cómo realizar tu transferencia</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Ingresa a tu banca en línea o app móvil</li>
                  <li>Selecciona "Transferencia SPEI" o "Envío de dinero"</li>
                  <li>Introduce la CLABE interbancaria</li>
                  <li>Ingresa el monto exacto: <strong>${(transaction.amount_mxn / 100).toLocaleString()} MXN</strong></li>
                  <li>Agrega la referencia de pago: <strong>{transaction.spei_reference}</strong></li>
                  <li>Confirma y envía la transferencia</li>
                </ol>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-800">
                      El procesamiento es automático. Recibirás tus créditos en menos de 30 minutos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white border rounded-lg p-6 h-fit">
            <h3 className="font-semibold text-lg mb-4">Resumen del pedido</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Paquete:</span>
                <span className="font-medium">{transaction.package.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créditos:</span>
                <span className="font-medium">{transaction.credits_purchased.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${((transaction.amount_mxn - 500) / 100).toLocaleString()} MXN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Comisión SPEI:</span>
                <span>$5.00 MXN</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total:</span>
                <span>${(transaction.amount_mxn / 100).toLocaleString()} MXN</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                onClick={checkPaymentStatus}
                className="w-full"
                variant="outline"
              >
                Verificar Estado del Pago
              </Button>
              
              {isExpired ? (
                <Button 
                  onClick={() => navigate('/checkout')}
                  className="w-full"
                >
                  Generar Nuevo Pago
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full"
                  variant="ghost"
                >
                  Volver al Inicio
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentInstructions;
