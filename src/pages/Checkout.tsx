import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Building2, CheckCircle, ArrowLeft, Zap, Crown, Users, TrendingUp } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_mxn: number;
  price_usd: number;
  description: string;
  is_popular: boolean;
  discount_percentage: number;
  is_active: boolean;
}

const Checkout = () => {
  console.log('Checkout page rendering');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check for pre-selected package from navigation state
  const preSelectedPackageName = location.state?.selectedPackageName;

  useEffect(() => {
    console.log('Checkout useEffect running, user:', user);
    fetchCreditPackages();
  }, []);

  useEffect(() => {
    // Pre-select package if one was passed from navigation
    if (preSelectedPackageName && packages.length > 0) {
      const preSelected = packages.find(pkg => pkg.name === preSelectedPackageName);
      if (preSelected) {
        setSelectedPackage(preSelected);
        console.log('Pre-selected package:', preSelected);
      }
    }
  }, [packages, preSelectedPackageName]);

  const fetchCreditPackages = async () => {
    console.log('Fetching credit packages from Supabase...');
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits');

      if (error) throw error;
      console.log('Credit packages fetched:', data);
      setPackages(data || []);
      
      // Auto-select popular package only if no pre-selection
      if (!preSelectedPackageName) {
        const popularPackage = data?.find(pkg => pkg.is_popular);
        if (popularPackage) setSelectedPackage(popularPackage);
      }
      
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

  const getPackageIcon = (packageName: string) => {
    if (packageName.includes('Starter')) return <Zap className="w-5 h-5" />;
    if (packageName.includes('Popular')) return <TrendingUp className="w-5 h-5" />;
    if (packageName.includes('Business')) return <Users className="w-5 h-5" />;
    if (packageName.includes('Enterprise')) return <Crown className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  const getPackageColor = (packageName: string) => {
    if (packageName.includes('Starter')) return 'from-blue-400 to-blue-600';
    if (packageName.includes('Popular')) return 'from-green-400 to-green-600';
    if (packageName.includes('Business')) return 'from-purple-400 to-purple-600';
    if (packageName.includes('Enterprise')) return 'from-yellow-400 to-yellow-600';
    return 'from-gray-400 to-gray-600';
  };

  const getPackageFeatures = (packageName: string, credits: number) => {
    const isPremium = packageName.includes('Premium');
    const isBasic = packageName.includes('Básico');
    
    const features = [
      `${credits.toLocaleString()} créditos incluidos`,
      'Catálogos PDF profesionales',
      'Imágenes HD sin marca de agua',
      'Soporte por WhatsApp'
    ];

    if (isPremium) {
      features.push('Remove.bg Premium incluido');
      features.push('Análisis híbrido inteligente');
      features.push('Calidad garantizada premium');
    } else if (isBasic) {
      features.push('Procesamiento Pixelcut optimizado');
      features.push('Smart Analysis incluido');
    }

    if (packageName.includes('Business') || packageName.includes('Enterprise')) {
      features.push('Procesamiento masivo');
      features.push('Soporte prioritario');
    }

    if (packageName.includes('Enterprise')) {
      features.push('API access');
      features.push('Account manager dedicado');
    }

    return features;
  };

  const handleStripePayment = async () => {
    if (!selectedPackage || !user) return;
    
    setProcessingPayment(true);
    try {
      // 1. Create transaction record
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

      console.log('Stripe payment for transaction:', transaction.id);

      // 2. Call create-payment-intent Edge Function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { transactionId: transaction.id }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(error.message || 'Error al crear la sesión de checkout');
      }

      if (!data.checkoutUrl) {
        throw new Error('No se recibió URL de checkout de Stripe');
      }

      console.log('✅ Checkout Session created:', data.sessionId);
      console.log('🔗 Redirecting to:', data.checkoutUrl);

      // 3. Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error en el pago",
        description: error.message || "Error al procesar el pago con tarjeta",
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
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar al inicio
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comprar Créditos</h1>
              <p className="text-gray-600 mt-1">Selecciona un paquete y método de pago</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Elige tu paquete</h2>
          
          {packages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay paquetes disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {packages.map(pkg => (
                <div 
                  key={pkg.id}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all transform hover:scale-105 ${
                    pkg.is_popular 
                      ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg' 
                      : 'border-gray-200 bg-white'
                  } ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary shadow-xl' : ''} hover:shadow-lg`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        MÁS POPULAR
                      </span>
                    </div>
                  )}
                  
                  {/* Header with icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getPackageColor(pkg.name)} flex items-center justify-center text-white`}>
                      {getPackageIcon(pkg.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{pkg.name}</h3>
                      <p className="text-sm text-gray-600">{pkg.description}</p>
                    </div>
                  </div>
                  
                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">${(pkg.price_mxn / 100).toLocaleString()}</span>
                      <span className="text-gray-500">MXN</span>
                      {pkg.discount_percentage > 0 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          -{pkg.discount_percentage}%
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-lg font-medium text-primary">{pkg.credits.toLocaleString()} créditos</p>
                      <p className="text-sm text-gray-600">
                        ${((pkg.price_mxn / 100) / pkg.credits).toFixed(2)} por crédito
                      </p>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {getPackageFeatures(pkg.name, pkg.credits).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {selectedPackage?.id === pkg.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
                {selectedPackage.discount_percentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({selectedPackage.discount_percentage}%):</span>
                    <span>-${(((selectedPackage.price_mxn / 100) * selectedPackage.discount_percentage) / (100 - selectedPackage.discount_percentage)).toFixed(2)} MXN</span>
                  </div>
                )}
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
              
              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Pago 100% seguro • SSL encriptado • Sin guardar datos de tarjeta
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Checkout;
