import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import { 
  CreditCard, 
  Building2, 
  CheckCircle, 
  Zap, 
  Crown, 
  Users, 
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  Star,
  Package,
  Coins
} from 'lucide-react';

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
  package_type: 'monthly_plan' | 'addon';
  max_uploads?: number;
  max_catalogs?: number;
  duration_months?: number;
}

// Configuración de procesadores de pago
const PAYMENT_PROCESSORS = {
  stripe: {
    name: 'Stripe',
    fee_percentage: 3.6,
    fee_fixed: 300, // centavos
    supports_subscriptions: true,
    active: true
  },
  conekta: {
    name: 'Conekta', 
    fee_percentage: 2.9,
    fee_fixed: 300, // centavos
    supports_subscriptions: true,
    active: false // TODO: Activar cuando tengas cuenta
  },
  spei: {
    name: 'SPEI',
    fee_percentage: 0,
    fee_fixed: 500, // centavos
    supports_subscriptions: false,
    active: true
  }
};

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // Default a Stripe por ahora
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // NUEVO: Tipo de compra - separar suscripciones de créditos únicos
  const [purchaseType, setPurchaseType] = useState<'subscription' | 'credits'>(() => {
    // Auto-detectar desde URL query params
    const plan = searchParams.get('plan');
    return plan ? 'subscription' : 'credits';
  });

  const preSelectedPackageName = location.state?.selectedPackageName || searchParams.get('plan');

  useEffect(() => {
    fetchCreditPackages();
  }, [purchaseType]);

  useEffect(() => {
    if (preSelectedPackageName && packages.length > 0) {
      const preSelected = packages.find(pkg => 
        pkg.name.toLowerCase().includes(preSelectedPackageName.toLowerCase()) ||
        pkg.id === preSelectedPackageName
      );
      if (preSelected) {
        setSelectedPackage(preSelected);
        setPurchaseType(preSelected.package_type === 'monthly_plan' ? 'subscription' : 'credits');
      }
    }
  }, [packages, preSelectedPackageName]);

  const fetchCreditPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .eq('package_type', purchaseType === 'subscription' ? 'monthly_plan' : 'addon')
        .order('price_mxn');

      if (error) throw error;
      
      setPackages(data || []);
      
      if (!preSelectedPackageName && data && data.length > 0) {
        const popularPackage = data.find(pkg => pkg.is_popular) || data[0];
        setSelectedPackage(popularPackage);
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

  // NUEVA FUNCIÓN: Recomendar método de pago según monto y tipo
  const getRecommendedPaymentMethod = (amount: number, isSubscription: boolean) => {
    // Para suscripciones, preferir procesadores con soporte nativo
    if (isSubscription) {
      return PAYMENT_PROCESSORS.conekta.active ? 'conekta' : 'stripe';
    }
    
    // Para compras únicas, optimizar por costo
    if (amount >= 50000) { // $500 MXN o más
      return 'spei'; // Más barato para montos altos
    }
    
    return PAYMENT_PROCESSORS.conekta.active ? 'conekta' : 'stripe';
  };

  // NUEVA FUNCIÓN: Calcular fees de diferentes métodos
  const calculateFees = (amount: number, method: keyof typeof PAYMENT_PROCESSORS) => {
    const processor = PAYMENT_PROCESSORS[method];
    const percentageFee = Math.round((amount * processor.fee_percentage) / 100);
    const totalFee = percentageFee + processor.fee_fixed;
    return {
      percentage: percentageFee,
      fixed: processor.fee_fixed,
      total: totalFee
    };
  };

  const getPackageIcon = (packageName: string, packageType: string) => {
    if (packageType === 'monthly_plan') {
      if (packageName.includes('Básico')) return <Package className="w-5 h-5" />;
      if (packageName.includes('Estándar')) return <Star className="w-5 h-5" />;
      if (packageName.includes('Premium')) return <Crown className="w-5 h-5" />;
      return <RefreshCw className="w-5 h-5" />;
    }
    
    // Para packs de créditos
    if (packageName.includes('Starter')) return <Zap className="w-5 h-5" />;
    if (packageName.includes('Popular')) return <TrendingUp className="w-5 h-5" />;
    if (packageName.includes('Business')) return <Users className="w-5 h-5" />;
    if (packageName.includes('Enterprise')) return <Crown className="w-5 h-5" />;
    return <Coins className="w-5 h-5" />;
  };

  const getPackageColor = (packageName: string, packageType: string) => {
    if (packageType === 'monthly_plan') {
      if (packageName.includes('Básico')) return 'from-gray-400 to-gray-600';
      if (packageName.includes('Estándar')) return 'from-blue-400 to-blue-600';
      if (packageName.includes('Premium')) return 'from-purple-400 to-purple-600';
    }
    
    if (packageName.includes('Starter')) return 'from-blue-400 to-blue-600';
    if (packageName.includes('Popular')) return 'from-green-400 to-green-600';
    if (packageName.includes('Business')) return 'from-purple-400 to-purple-600';
    if (packageName.includes('Enterprise')) return 'from-yellow-400 to-yellow-600';
    return 'from-gray-400 to-gray-600';
  };

  const getPackageFeatures = (pkg: CreditPackage) => {
    const features = [`${pkg.credits.toLocaleString()} créditos`];
    
    if (pkg.package_type === 'monthly_plan') {
      // Para suscripciones
      features.push('Se renuevan automáticamente');
      if (pkg.max_uploads) features.push(`${pkg.max_uploads} uploads mensuales`);
      if (pkg.max_catalogs) features.push(`${pkg.max_catalogs === 0 ? 'Ilimitados' : pkg.max_catalogs} catálogos`);
      features.push('Cancela en cualquier momento');
      features.push('Soporte prioritario');
    } else {
      // Para packs de créditos
      features.push('Válidos por 12 meses');
      features.push('No se renuevan automáticamente');
      features.push('Úsalos cuando quieras');
    }
    
    features.push('Catálogos PDF profesionales');
    features.push('Imágenes HD sin marca de agua');
    features.push('Soporte por WhatsApp');
    
    return features;
  };

  // TODO: Implementar cuando tengas cuenta de Conekta
  const handleConektaPayment = async () => {
    if (!selectedPackage || !user) return;
    
    toast({
      title: "Próximamente",
      description: "Conekta estará disponible pronto. Usa Stripe por ahora.",
      variant: "default",
    });
  };

  const handleStripePayment = async () => {
    if (!selectedPackage || !user) return;
    
    setProcessingPayment(true);
    try {
      // Determinar si es suscripción o compra única
      const isSubscription = selectedPackage.package_type === 'monthly_plan';
      
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_mxn: selectedPackage.price_mxn,
          credits_purchased: selectedPackage.credits,
          payment_method: 'stripe',
          payment_status: 'pending',
          purchase_type: isSubscription ? 'subscription' : 'one_time', // NUEVO campo
          subscription_plan_id: isSubscription ? selectedPackage.id : null, // NUEVO campo
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          transactionId: transaction.id,
          isSubscription: isSubscription, // Informar al backend si es suscripción
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(error.message || 'Error al crear la sesión de checkout');
      }

      if (!data.checkoutUrl) {
        throw new Error('No se recibió URL de checkout de Stripe');
      }

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
    
    // SPEI no soporta suscripciones
    if (selectedPackage.package_type === 'monthly_plan') {
      toast({
        title: "Método no compatible",
        description: "SPEI no soporta suscripciones. Usa tarjeta para planes mensuales.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingPayment(true);
    try {
      const speiReference = `CAT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_mxn: selectedPackage.price_mxn + 500,
          credits_purchased: selectedPackage.credits,
          payment_method: 'spei',
          payment_status: 'pending',
          purchase_type: 'one_time', // SPEI siempre es one-time
          spei_reference: speiReference,
          spei_clabe: '646180157000000004',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

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

  const handlePayment = () => {
    switch (paymentMethod) {
      case 'conekta':
        return handleConektaPayment();
      case 'stripe':
        return handleStripePayment();
      case 'spei':
        return handleSPEIPayment();
      default:
        return handleStripePayment();
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      <Button onClick={() => navigate(-1)} variant="outline" size="sm">
        <ArrowLeft className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Volver</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <AppLayout actions={actions}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando opciones de pago...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Calcular recomendación y fees
  const recommendedMethod = selectedPackage ? 
    getRecommendedPaymentMethod(selectedPackage.price_mxn, selectedPackage.package_type === 'monthly_plan') :
    'stripe';

  const selectedFees = selectedPackage ? calculateFees(selectedPackage.price_mxn, paymentMethod as keyof typeof PAYMENT_PROCESSORS) : null;

  return (
    <AppLayout actions={actions}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Completa tu compra
          </h1>
          <p className="text-gray-600">
            {purchaseType === 'subscription' ? 
              'Suscríbete y empieza a crear catálogos profesionales' :
              'Compra créditos y úsalos cuando quieras'
            }
          </p>
        </div>

        {/* Tabs para tipo de compra */}
        <Tabs value={purchaseType} onValueChange={(value) => {
          setPurchaseType(value as 'subscription' | 'credits');
          setSelectedPackage(null);
        }} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Suscripciones
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Créditos Únicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Planes Mensuales</h3>
              <p className="text-sm text-blue-700">
                Créditos que se renuevan cada mes + uploads ilimitados + soporte prioritario
              </p>
            </div>
            
            {/* Grid de suscripciones */}
            {packages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay planes de suscripción disponibles.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      pkg.is_popular 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                        : 'border-gray-200 bg-white'
                    } ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary shadow-xl' : ''} hover:shadow-lg`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.is_popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          RECOMENDADO
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getPackageColor(pkg.name, pkg.package_type)} flex items-center justify-center text-white`}>
                        {getPackageIcon(pkg.name, pkg.package_type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${(pkg.price_mxn / 100).toLocaleString()}</span>
                        <span className="text-gray-500">/mes</span>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="text-lg font-medium text-blue-600">{pkg.credits} créditos mensuales</p>
                        {pkg.max_uploads && <p className="text-sm text-gray-600">{pkg.max_uploads} uploads</p>}
                        {pkg.max_catalogs !== undefined && (
                          <p className="text-sm text-gray-600">
                            {pkg.max_catalogs === 0 ? 'Catálogos ilimitados' : `${pkg.max_catalogs} catálogos`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {getPackageFeatures(pkg).map((feature, index) => (
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
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Packs de Créditos</h3>
              <p className="text-sm text-green-700">
                Compra una vez y úsalos durante 12 meses • Sin renovación automática
              </p>
            </div>
            
            {/* Grid de créditos */}
            {packages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay packs de créditos disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      pkg.is_popular 
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100' 
                        : 'border-gray-200 bg-white'
                    } ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary shadow-xl' : ''} hover:shadow-md`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.is_popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Más Elegido
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getPackageColor(pkg.name, pkg.package_type)} flex items-center justify-center text-white mx-auto mb-3`}>
                        {getPackageIcon(pkg.name, pkg.package_type)}
                      </div>
                      
                      <h3 className="font-bold text-sm md:text-base mb-1">{pkg.name}</h3>
                      <p className="text-xs text-gray-600 mb-3">{pkg.description}</p>
                      
                      <div className="mb-3">
                        <div className="text-2xl font-bold text-gray-900">{pkg.credits}</div>
                        <div className="text-xs text-gray-600">créditos</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xl font-bold text-primary">
                          ${(pkg.price_mxn / 100).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          ${((pkg.price_mxn / 100) / pkg.credits).toFixed(2)} c/u
                        </div>
                        {pkg.discount_percentage > 0 && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            {pkg.discount_percentage}% descuento
                          </div>
                        )}
                      </div>
                      
                      {selectedPackage?.id === pkg.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedPackage && (
          <>
            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Método de Pago</h3>
              
              <div className="space-y-4">
                {/* Conekta (futuro) */}
                {PAYMENT_PROCESSORS.conekta.active && (
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'conekta' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="conekta"
                      checked={paymentMethod === 'conekta'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Tarjeta (Conekta)</span>
                        {recommendedMethod === 'conekta' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Instantáneo • Procesador mexicano</p>
                      <p className="text-xs text-gray-500">Comisión: 2.9% + $3 MXN</p>
                    </div>
                  </label>
                )}
                
                {/* Stripe */}
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
                      <span className="font-semibold">Tarjeta (Stripe)</span>
                      {recommendedMethod === 'stripe' && !PAYMENT_PROCESSORS.conekta.active && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Instantáneo • Visa, Mastercard, AMEX</p>
                    <p className="text-xs text-gray-500">Comisión: 3.6% + $3 MXN</p>
                  </div>
                </label>
                
                {/* SPEI - Solo para créditos únicos */}
                {selectedPackage.package_type === 'addon' && (
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
                        <span className="font-semibold">Transferencia (SPEI)</span>
                        {recommendedMethod === 'spei' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Instantáneo • Todos los bancos</p>
                      <p className="text-xs text-gray-500">Comisión: $5 MXN fijo</p>
                      {selectedFees && paymentMethod !== 'spei' && (
                        <p className="text-xs text-green-600 font-medium">
                          Ahorra ${((selectedFees.total - 500) / 100).toFixed(2)} MXN vs tarjeta
                        </p>
                      )}
                    </div>
                  </label>
                )}
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
                  <span>
                    {selectedPackage.package_type === 'monthly_plan' ? 'Créditos mensuales:' : 'Créditos únicos:'}
                  </span>
                  <span>{selectedPackage.credits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${(selectedPackage.price_mxn / 100).toLocaleString()} MXN</span>
                </div>
                
                {selectedFees && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Comisión ({PAYMENT_PROCESSORS[paymentMethod as keyof typeof PAYMENT_PROCESSORS].name}):</span>
                    <span>${(selectedFees.total / 100).toFixed(2)} MXN</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>Total:</span>
                  <span>
                    ${((selectedPackage.price_mxn + (selectedFees?.total || 0)) / 100).toLocaleString()} MXN
                    {selectedPackage.package_type === 'monthly_plan' && (
                      <span className="text-sm font-normal text-gray-600">/mes</span>
                    )}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handlePayment}
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
                  `${selectedPackage.package_type === 'monthly_plan' ? 'Suscribirme' : 'Comprar'} con ${PAYMENT_PROCESSORS[paymentMethod as keyof typeof PAYMENT_PROCESSORS].name}`
                )}
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Pago 100% seguro • SSL encriptado • 
                {selectedPackage.package_type === 'monthly_plan' && ' Cancela cuando quieras'}
              </p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Checkout;
