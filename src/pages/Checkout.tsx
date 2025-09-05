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

// Interface correcto que coincide con la BD
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_mxn: number;
  price_usd: number;
  discount_percentage: number | null;
  is_popular: boolean | null;
  is_active: boolean | null;
  description: string | null;
  created_at: string;
  package_type: string;
  max_uploads: number | null;
  max_catalogs: number | null;
  duration_months: number | null;
}

// Configuración de procesadores de pago
const PAYMENT_PROCESSORS = {
  stripe: {
    name: 'Stripe',
    fee_percentage: 3.6,
    fee_fixed: 300,
    supports_subscriptions: true,
    active: true
  },
  conekta: {
    name: 'Conekta', 
    fee_percentage: 2.9,
    fee_fixed: 300,
    supports_subscriptions: true,
    active: false
  },
  spei: {
    name: 'SPEI',
    fee_percentage: 0,
    fee_fixed: 500,
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
  
  const [monthlyPlans, setMonthlyPlans] = useState<CreditPackage[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Determinar tipo inicial basado en la URL
  const [activeTab, setActiveTab] = useState<'monthly' | 'credits'>(() => {
    const planParam = searchParams.get('plan');
    return planParam ? 'monthly' : 'credits';
  });

  const preSelectedPlanName = searchParams.get('plan') || location.state?.selectedPackageName;

  useEffect(() => {
    fetchAllPackages();
  }, []);

  useEffect(() => {
    // Pre-seleccionar paquete si viene de pricing
    if (preSelectedPlanName && (monthlyPlans.length > 0 || creditPacks.length > 0)) {
      const allPackages = [...monthlyPlans, ...creditPacks];
      const preSelected = allPackages.find(pkg => 
        pkg.name.toLowerCase().includes(preSelectedPlanName.toLowerCase()) ||
        pkg.name.toLowerCase().replace(/\s+/g, '-').includes(preSelectedPlanName.toLowerCase())
      );
      
      if (preSelected) {
        setSelectedPackage(preSelected);
        setActiveTab(preSelected.package_type === 'monthly_plan' ? 'monthly' : 'credits');
      }
    }
  }, [preSelectedPlanName, monthlyPlans, creditPacks]);

  const fetchAllPackages = async () => {
    try {
      // Query completa con todos los campos - solución para problema de tipos de Lovable
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_mxn');

      if (error) throw error;
      
      if (!data) {
        setMonthlyPlans([]);
        setCreditPacks([]);
        return;
      }

      // Mapeo manual para garantizar compatibilidad de tipos
      const mappedPackages: CreditPackage[] = (data as any[]).map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price_mxn: pkg.price_mxn,
        price_usd: pkg.price_usd,
        discount_percentage: pkg.discount_percentage,
        is_popular: pkg.is_popular,
        is_active: pkg.is_active,
        description: pkg.description,
        created_at: pkg.created_at,
        package_type: pkg.package_type || (pkg.name.toLowerCase().includes('plan') ? 'monthly_plan' : 'addon'),
        max_uploads: pkg.max_uploads,
        max_catalogs: pkg.max_catalogs,
        duration_months: pkg.duration_months
      }));

      // Separar por tipo usando el campo real package_type
      const monthly = mappedPackages.filter(pkg => pkg.package_type === 'monthly_plan');
      const credits = mappedPackages.filter(pkg => pkg.package_type === 'addon');
      
      setMonthlyPlans(monthly);
      setCreditPacks(credits);
      
      // Si no hay pre-selección, elegir el más popular
      if (!preSelectedPlanName && mappedPackages.length > 0) {
        const popularPackage = mappedPackages.find(pkg => pkg.is_popular) || mappedPackages[0];
        setSelectedPackage(popularPackage);
        setActiveTab(popularPackage.package_type === 'monthly_plan' ? 'monthly' : 'credits');
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

  const getRecommendedPaymentMethod = (amount: number, isSubscription: boolean) => {
    if (isSubscription) {
      return PAYMENT_PROCESSORS.conekta.active ? 'conekta' : 'stripe';
    }
    
    if (amount >= 50000) {
      return 'spei';
    }
    
    return PAYMENT_PROCESSORS.conekta.active ? 'conekta' : 'stripe';
  };

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
      if (packageName.includes('Starter')) return <Package className="w-5 h-5" />;
      if (packageName.includes('Básico')) return <Zap className="w-5 h-5" />;
      if (packageName.includes('Profesional')) return <Star className="w-5 h-5" />;
      if (packageName.includes('Empresarial')) return <Crown className="w-5 h-5" />;
      return <RefreshCw className="w-5 h-5" />;
    }
    
    // Packs únicos
    if (packageName.includes('Starter')) return <Zap className="w-5 h-5" />;
    if (packageName.includes('Popular')) return <TrendingUp className="w-5 h-5" />;
    if (packageName.includes('Business')) return <Users className="w-5 h-5" />;
    return <Coins className="w-5 h-5" />;
  };

  const getPackageColor = (packageName: string, packageType: string) => {
    if (packageType === 'monthly_plan') {
      if (packageName.includes('Starter')) return 'from-gray-500 to-gray-700';
      if (packageName.includes('Básico')) return 'from-blue-500 to-blue-700';
      if (packageName.includes('Profesional')) return 'from-purple-500 to-purple-700';
      if (packageName.includes('Empresarial')) return 'from-yellow-500 to-yellow-700';
    }
    
    if (packageName.includes('Starter')) return 'from-blue-500 to-blue-700';
    if (packageName.includes('Popular')) return 'from-green-500 to-green-700';
    if (packageName.includes('Business')) return 'from-purple-500 to-purple-700';
    return 'from-gray-500 to-gray-700';
  };

  const getPackageFeatures = (pkg: CreditPackage) => {
    const features = [];
    
    if (pkg.package_type === 'monthly_plan') {
      // Suscripciones mensuales - ahora funciona porque tenemos todos los campos
      if (pkg.credits > 0) {
        features.push(`${pkg.credits} créditos mensuales`);
      } else {
        features.push('Sin procesamiento IA');
      }
      
      if (pkg.max_catalogs !== undefined && pkg.max_catalogs !== null) {
        if (pkg.max_catalogs === 0) {
          features.push('Catálogos ilimitados');
        } else {
          features.push(`${pkg.max_catalogs} catálogos/mes`);
        }
      }
      
      if (pkg.max_uploads) {
        features.push(`${pkg.max_uploads} uploads/mes`);
      }
      
      features.push('Se renueva automáticamente');
      features.push('Cancela cuando quieras');
      features.push('Soporte prioritario');
    } else {
      // Packs únicos
      features.push(`${pkg.credits} créditos únicos`);
      features.push('Válidos por 12 meses');
      features.push('Sin renovación automática');
      features.push('Úsalos cuando quieras');
    }
    
    features.push('Catálogos PDF profesionales');
    features.push('Imágenes HD sin marca de agua');
    features.push('Soporte por WhatsApp');
    
    return features;
  };

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
          purchase_type: isSubscription ? 'subscription' : 'one_time',
          subscription_plan_id: isSubscription ? selectedPackage.id : null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          transactionId: transaction.id,
          isSubscription: isSubscription,
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
          purchase_type: 'one_time',
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

  const isSubscription = selectedPackage?.package_type === 'monthly_plan';
  const recommendedMethod = selectedPackage ? 
    getRecommendedPaymentMethod(selectedPackage.price_mxn, isSubscription) :
    'stripe';
  const selectedFees = selectedPackage ? 
    calculateFees(selectedPackage.price_mxn, paymentMethod as keyof typeof PAYMENT_PROCESSORS) : null;

  return (
    <AppLayout actions={actions}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Completa tu compra
          </h1>
          <p className="text-gray-600">
            Elige entre planes mensuales con renovación automática o packs únicos
          </p>
        </div>

        {/* Tabs mejorados */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as 'monthly' | 'credits');
          setSelectedPackage(null);
        }} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Planes Mensuales
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Packs Únicos
            </TabsTrigger>
          </TabsList>

          {/* Planes Mensuales */}
          <TabsContent value="monthly" className="space-y-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Suscripciones Mensuales</h3>
              <p className="text-sm text-blue-700">
                Créditos que se renuevan automáticamente • Cancela cuando quieras
              </p>
            </div>
            
            {monthlyPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay planes de suscripción disponibles.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {monthlyPlans.map(pkg => (
                  <div 
                    key={pkg.id}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      pkg.is_popular 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                        : 'border-gray-200 bg-white'
                    } ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary shadow-xl' : ''} hover:shadow-lg`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.is_popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          POPULAR
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                       <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getPackageColor(pkg.name, pkg.package_type)} flex items-center justify-center text-white mx-auto mb-3`}>
                         {getPackageIcon(pkg.name, pkg.package_type)}
                      </div>
                      
                      <h3 className="font-bold text-lg mb-1">{pkg.name.replace('Plan ', '')}</h3>
                      <p className="text-xs text-gray-600 mb-4">{pkg.description}</p>
                      
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-gray-900">
                          ${(pkg.price_mxn / 100).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">/mes</div>
                      </div>
                      
                      <div className="space-y-2 mb-4 text-left">
                        {getPackageFeatures(pkg).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-700">{feature}</span>
                          </div>
                        ))}
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

          {/* Packs Únicos */}
          <TabsContent value="credits" className="space-y-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Packs de Créditos</h3>
              <p className="text-sm text-green-700">
                Compra una vez • Válidos por 12 meses • Sin renovación automática
              </p>
            </div>
            
            {creditPacks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay packs de créditos disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditPacks.map(pkg => (
                  <div 
                    key={pkg.id}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      pkg.is_popular 
                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg' 
                        : 'border-gray-200 bg-white'
                    } ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary shadow-xl' : ''} hover:shadow-lg`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.is_popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          MÁS ELEGIDO
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                       <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getPackageColor(pkg.name, pkg.package_type)} flex items-center justify-center text-white mx-auto mb-4`}>
                         {getPackageIcon(pkg.name, pkg.package_type)}
                      </div>
                      
                      <h3 className="font-bold text-xl mb-2">{pkg.name.replace('Pack ', '')}</h3>
                      <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                      
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {pkg.credits}
                        </div>
                        <div className="text-sm text-gray-600">créditos</div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-2xl font-bold text-primary">
                          ${(pkg.price_mxn / 100).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${((pkg.price_mxn / 100) / pkg.credits).toFixed(2)} por crédito
                        </div>
                        {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                          <div className="text-sm text-green-600 font-medium mt-2">
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
              
              <div className="space-y-3">
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
                      <span className="font-semibold">Tarjeta de Crédito/Débito</span>
                      {recommendedMethod === 'stripe' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Visa, Mastercard, AMEX • Instantáneo</p>
                    <p className="text-xs text-gray-500">Comisión: 3.6% + $3 MXN</p>
                  </div>
                </label>
                
                {/* SPEI - Solo para créditos únicos */}
                {!isSubscription && (
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
                        {recommendedMethod === 'spei' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            Más Barato
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Todos los bancos • Instantáneo</p>
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
                <div className="flex justify-between items-center">
                  <span>Paquete:</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>
                    {isSubscription ? 'Tipo:' : 'Créditos:'}
                  </span>
                  <span>
                    {isSubscription ? 'Suscripción mensual' : `${selectedPackage.credits.toLocaleString()} créditos`}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span>${(selectedPackage.price_mxn / 100).toLocaleString()} MXN</span>
                </div>
                
                {selectedFees && (
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Comisión de procesamiento:</span>
                    <span>${(selectedFees.total / 100).toFixed(2)} MXN</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center font-bold text-lg border-t pt-3">
                  <span>Total:</span>
                  <span>
                    ${((selectedPackage.price_mxn + (selectedFees?.total || 0)) / 100).toLocaleString()} MXN
                    {isSubscription && <span className="text-sm font-normal text-gray-600">/mes</span>}
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
                  isSubscription ? 'Suscribirme Ahora' : 'Comprar Créditos'
                )}
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Pago 100% seguro • SSL encriptado
                {isSubscription && ' • Cancela cuando quieras'}
              </p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Checkout;
