
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, ArrowRight, Home } from 'lucide-react';

interface Transaction {
  id: string;
  amount_mxn: number;
  credits_purchased: number;
  payment_method: string;
  completed_at: string;
  credit_packages: {
    name: string;
  } | null;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (transactionId && user) {
      fetchTransactionAndCredits();
    } else {
      setLoading(false);
    }
  }, [transactionId, user]);

  const fetchTransactionAndCredits = async () => {
    if (!transactionId || !user) return;

    try {
      // Fetch transaction details
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount_mxn,
          credits_purchased,
          payment_method,
          completed_at,
          credit_packages!package_id (
            name
          )
        `)
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .single();

      if (transactionError) {
        console.error('Error fetching transaction:', transactionError);
        return;
      }

      setTransaction(transactionData);

      // Fetch current user credits
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user credits:', userError);
        return;
      }

      setUserCredits(userData.credits);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <main className="max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Success Message */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
            <p className="text-xl text-gray-600 mb-4">
              Tu transacción ha sido procesada correctamente
            </p>
            
            {/* Credits Added Alert */}
            <div className="inline-flex items-center bg-green-100 border border-green-200 rounded-lg px-6 py-3">
              <CreditCard className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                {transaction ? `${transaction.credits_purchased.toLocaleString()} créditos` : 'Créditos'} 
                {' '}añadidos a tu cuenta
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Transaction Details */}
            {transaction && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Detalles de la transacción
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paquete:</span>
                    <span className="font-medium">
                      {transaction.credit_packages?.name || 'Paquete de créditos'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créditos comprados:</span>
                    <span className="font-medium">
                      {transaction.credits_purchased.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto pagado:</span>
                    <span className="font-medium">
                      ${(transaction.amount_mxn / 100).toLocaleString()} MXN
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium capitalize">
                      {transaction.payment_method === 'spei' ? 'SPEI' : transaction.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">
                      {new Date(transaction.completed_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de transacción:</span>
                    <span className="font-mono text-sm text-gray-500">
                      {transaction.id.split('-')[0]}...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Tu cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {userCredits.toLocaleString()}
                  </div>
                  <div className="text-gray-600">
                    Créditos disponibles
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-800 font-medium">
                      ¡Listos para usar!
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/upload')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
            >
              Comenzar a procesar productos
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="px-8 py-3"
            >
              Volver al inicio
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Si tienes alguna pregunta sobre tu compra, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
