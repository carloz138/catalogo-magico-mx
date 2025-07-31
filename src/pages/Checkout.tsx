
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Building2, CheckCircle } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_mxn: number;
  price_usd: number;
  description: string;
  is_popular: boolean;
  discount_percentage: number;
}

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchCreditPackages();
  }, [user, navigate]);

  const fetchCreditPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits');

      if (error) throw error;
      setPackages(data || []);
      
      // Auto-select popular package
      const popularPackage = data?.find(pkg => pkg.is_popular);
      if (popularPackage) setSelectedPackage(popularPackage);
      
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (amount: number) => {
    return amount < 50000 ? 'stripe' : 'spei'; // < $500 MXN recommend stripe
  };

  const calculateSavings = (amount: number) => {
    if (amount >= 200000) { // >= $2000 MXN
      const cardFee = Math.round(amount * 0.036 + 300);
      const speiFee = 500;
      return Math.max(0, cardFee - speiFee);
    }
    return 0;
  };

  const handleStripePayment = async () => {
    if (!selectedPackage || !user) return;
    
    setProcessingPayment(true);
    try {
      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_mxn: selectedPackage.price_mxn,
          credits_purchased: selectedPackage.credits,
          payment_method: 'stripe',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // For now, simulate successful payment
      // In production, integrate with Stripe Checkout or Elements
      toast({
        title: "Redirigiendo a Stripe",
        description: "Te redirigiremos al checkout seguro de Stripe",
      });
      
      // TODO: Implement actual Stripe integration
      console.log('Stripe payment for transaction:', transaction.id);
      
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: "Error",
        description: "Error al procesar el pago con tarjeta",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSPEIPayment = async () => {
    if (!selectedPackage || !user) return;
    
    setProcessingPayment(true);
    try {
      const speiReference = `CAT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_mxn: selectedPackage.price_mxn + 500, // Add $5 MXN SPEI fee
          credits_purchased: selectedPackage.credits,
          payment_method: 'spei',
          payment_status: 'pending',
          spei_reference: speiReference,
          spei_clabe: '646180157000000004', // Company CLABE
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to payment instructions
      navigate(`/payment-instructions/${transaction.id}`);
      
    } catch (error) {
      console.error('SPEI payment error:', error);
      toast({
        title: "Error",
        description: "Error al generar transferencia SPEI",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando paquetes...</p>
        </div>
      </div>
    );
  }

  const recommendation = selectedPackage ? getRecommendation(selectedPackage.price_mxn) : 'stripe';
  const savings = selectedPackage ? calculateSavings(selectedPackage.price_mxn) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Comprar Créditos</h1>
          <p className="text-gray-600 mt-1">Selecciona un paquete y método de pago</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Elige tu paquete</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map(pkg => (
              <div 
                key={pkg.id}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  pkg.is_popular ? 'border-primary bg-primary/5' : 'border-gray-200'
                } ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary' : ''} hover:shadow-md`}
                onClick={() => setSelectedPackage(pkg)}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                
                <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${(pkg.price_mxn / 100).toLocaleString()}</span>
                  <span className="text-gray-500 ml-1">MXN</span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-lg font-medium">{pkg.credits.toLocaleString()} créditos</p>
                  <p className="text-sm text-gray-600">
                    ${((pkg.price_mxn / 100) / pkg.credits).toFixed(2)} por crédito
                  </p>
                  {pkg.discount_percentage > 0 && (
                    <p className="text-green-600 font-semibold">
                      ¡Ahorra {pkg.discount_percentage}%!
                    </p>
                  )}
                </div>
                
                <p className="text-sm text-gray-500">{pkg.description}</p>
                
                {selectedPackage?.id === pkg.id && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedPackage && (
          <>
            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Método de Pago</h3>
              
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Tarjeta de Crédito/Débito</span>
                      {recommendation === 'stripe' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Instantáneo • Visa, Mastercard, American Express</p>
                    <p className="text-xs text-gray-500">Comisión: 3.6% + $3 MXN</p>
                  </div>
                </label>
                
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'spei' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="spei"
                    checked={paymentMethod === 'spei'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <Building2 className="w-5 h-5 mr-3 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Transferencia Bancaria (SPEI)</span>
                      {recommendation === 'spei' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Instantáneo • Todos los bancos mexicanos</p>
                    <p className="text-xs text-gray-500">Comisión: $5 MXN fijo</p>
                    {savings > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        Ahorra ${(savings / 100).toFixed(2)} MXN vs tarjeta
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-bold text-lg mb-4">Resumen de Compra</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Paquete:</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créditos:</span>
                  <span>{selectedPackage.credits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${(selectedPackage.price_mxn / 100).toLocaleString()} MXN</span>
                </div>
                {paymentMethod === 'spei' && (
                  <div className="flex justify-between text-sm">
                    <span>Comisión SPEI:</span>
                    <span>$5.00 MXN</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>Total:</span>
                  <span>
                    ${((selectedPackage.price_mxn + (paymentMethod === 'spei' ? 500 : 0)) / 100).toLocaleString()} MXN
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={paymentMethod === 'stripe' ? handleStripePayment : handleSPEIPayment}
                disabled={processingPayment}
                className="w-full py-3 text-lg"
                size="lg"
              >
                {processingPayment ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  `Pagar con ${paymentMethod === 'stripe' ? 'Tarjeta' : 'SPEI'}`
                )}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Checkout;
