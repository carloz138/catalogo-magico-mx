import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
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
  Coins,
  Loader2,
} from "lucide-react";

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
    name: "Stripe",
    fee_percentage: 3.6,
    fee_fixed: 300,
    supports_subscriptions: true,
    active: true,
  },
  conekta: {
    name: "Conekta",
    fee_percentage: 2.9,
    fee_fixed: 300,
    supports_subscriptions: true,
    active: false,
  },
  spei: {
    name: "SPEI",
    fee_percentage: 0,
    fee_fixed: 500,
    supports_subscriptions: false,
    active: true,
  },
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
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Determinar tipo inicial basado en la URL
  const [activeTab, setActiveTab] = useState<"monthly" | "credits">(() => {
    const planParam = searchParams.get("plan");
    return planParam ? "monthly" : "credits";
  });

  const preSelectedPlanName = searchParams.get("plan") || location.state?.selectedPackageName;

  useEffect(() => {
    fetchAllPackages();
  }, []);

  useEffect(() => {
    // Pre-seleccionar paquete si viene de pricing
    if (preSelectedPlanName && (monthlyPlans.length > 0 || creditPacks.length > 0)) {
      const allPackages = [...monthlyPlans, ...creditPacks];
      const preSelected = allPackages.find(
        (pkg) =>
          pkg.name.toLowerCase().includes(preSelectedPlanName.toLowerCase()) ||
          pkg.name.toLowerCase().replace(/\s+/g, "-").includes(preSelectedPlanName.toLowerCase()),
      );

      if (preSelected) {
        setSelectedPackage(preSelected);
        setActiveTab(preSelected.package_type === "monthly_plan" ? "monthly" : "credits");
      }
    }
  }, [preSelectedPlanName, monthlyPlans, creditPacks]);

  const fetchAllPackages = async () => {
    try {
      // Query completa con todos los campos - solución para problema de tipos de Lovable
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("price_mxn");

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
        package_type: pkg.package_type || (pkg.name.toLowerCase().includes("plan") ? "monthly_plan" : "addon"),
        max_uploads: pkg.max_uploads,
        max_catalogs: pkg.max_catalogs,
        duration_months: pkg.duration_months,
      }));

      // Separar por tipo usando el campo real package_type
      const monthly = mappedPackages.filter((pkg) => pkg.package_type === "monthly_plan");
      const credits = mappedPackages.filter((pkg) => pkg.package_type === "addon");

      setMonthlyPlans(monthly);
      setCreditPacks(credits);

      // Si no hay pre-selección, elegir el más popular
      if (!preSelectedPlanName && mappedPackages.length > 0) {
        const popularPackage = mappedPackages.find((pkg) => pkg.is_popular) || mappedPackages[0];
        setSelectedPackage(popularPackage);
        setActiveTab(popularPackage.package_type === "monthly_plan" ? "monthly" : "credits");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
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
      return PAYMENT_PROCESSORS.conekta.active ? "conekta" : "stripe";
    }

    if (amount >= 50000) {
      return "spei";
    }

    return PAYMENT_PROCESSORS.conekta.active ? "conekta" : "stripe";
  };

  const calculateFees = (amount: number, method: keyof typeof PAYMENT_PROCESSORS) => {
    const processor = PAYMENT_PROCESSORS[method];
    const percentageFee = Math.round((amount * processor.fee_percentage) / 100);
    const totalFee = percentageFee + processor.fee_fixed;
    return {
      percentage: percentageFee,
      fixed: processor.fee_fixed,
      total: totalFee,
    };
  };

  const getPackageIcon = (packageName: string, packageType: string) => {
    if (packageType === "monthly_plan") {
      if (packageName.includes("Starter")) return <Package className="w-5 h-5" />;
      if (packageName.includes("Básico")) return <Zap className="w-5 h-5" />;
      if (packageName.includes("Profesional")) return <Star className="w-5 h-5" />;
      if (packageName.includes("Empresarial")) return <Crown className="w-5 h-5" />;
      return <RefreshCw className="w-5 h-5" />;
    }

    // Packs únicos
    if (packageName.includes("Starter")) return <Zap className="w-5 h-5" />;
    if (packageName.includes("Popular")) return <TrendingUp className="w-5 h-5" />;
    if (packageName.includes("Business")) return <Users className="w-5 h-5" />;
    return <Coins className="w-5 h-5" />;
  };

  const getPackageColor = (packageName: string, packageType: string) => {
    if (packageType === "monthly_plan") {
      if (packageName.includes("Starter")) return "from-gray-500 to-gray-700";
      if (packageName.includes("Básico")) return "from-blue-500 to-blue-700";
      if (packageName.includes("Profesional")) return "from-purple-500 to-purple-700";
      if (packageName.includes("Empresarial")) return "from-yellow-500 to-yellow-700";
    }

    if (packageName.includes("Starter")) return "from-blue-500 to-blue-700";
    if (packageName.includes("Popular")) return "from-green-500 to-green-700";
    if (packageName.includes("Business")) return "from-purple-500 to-purple-700";
    return "from-gray-500 to-gray-700";
  };

  const getPackageFeatures = (pkg: CreditPackage) => {
    const features = [];

    if (pkg.package_type === "monthly_plan") {
      const planName = pkg.name.toLowerCase();

      if (planName.includes("gratis") || planName.includes("free")) {
        features.push("1 catálogo activo");
        features.push("50 productos por catálogo");
        features.push("1 template básico");
        features.push("❌ Sin sistema de cotización");
        features.push("❌ Sin analytics");
        features.push("❌ Sin procesamiento IA");
      } else if (
        planName.includes("catálogos") &&
        !planName.includes("básico") &&
        !planName.includes("basico") &&
        !planName.includes("ia")
      ) {
        features.push("1 catálogo activo");
        features.push("100 productos por catálogo");
        features.push("1 template básico");
        features.push("✅ Sistema de cotización incluido");
        features.push("✅ Analytics básicas");
        features.push("❌ Sin procesamiento IA");
      } else if (planName.includes("básico") || planName.includes("basico")) {
        features.push("5 catálogos activos");
        features.push("200 productos por catálogo");
        features.push("9 templates profesionales");
        features.push("✅ Sistema de cotización incluido");
        features.push("✅ Analytics avanzadas");
        features.push("➕ BONUS: 30 créditos IA/mes");
        features.push("➕ Compra packs extra cuando necesites más");
      } else if (planName.includes("profesional")) {
        features.push("30 catálogos activos");
        features.push("500 productos por catálogo");
        features.push("16 templates (todos)");
        features.push("✅ Sistema de cotización incluido");
        features.push("✅ Analytics profesionales");
        features.push("✅ Catálogos privados");
        features.push("➕ BONUS: 100 créditos IA/mes");
        features.push("➕ Compra packs extra cuando necesites más");
      } else if (planName.includes("empresarial")) {
        features.push("♾️ Catálogos ilimitados");
        features.push("♾️ Productos ilimitados");
        features.push("16 templates + personalización");
        features.push("✅ Sistema de cotización empresarial");
        features.push("✅ Analytics profesionales + API");
        features.push("✅ API de integración");
        features.push("➕ BONUS: 300 créditos IA/mes");
        features.push("➕ Compra packs extra cuando necesites más");
      }

      features.push("Se renueva automáticamente");
      features.push("Cancela cuando quieras");
    } else {
      // Packs únicos
      features.push(`${pkg.credits} créditos únicos`);
      features.push("Válidos por 12 meses");
      features.push("Sin renovación automática");
      features.push("Úsalos cuando quieras");
    }

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
      const isSubscription = selectedPackage.package_type === "monthly_plan";

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_mxn: selectedPackage.price_mxn,
          credits_purchased: selectedPackage.credits,
          payment_method: "stripe",
          payment_status: "pending",
          purchase_type: isSubscription ? "subscription" : "one_time",
          subscription_plan_id: isSubscription ? selectedPackage.id : null,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          transactionId: transaction.id,
          isSubscription: isSubscription,
        },
      });

      if (error) {
        console.error("Error creating checkout session:", error);
        throw new Error(error.message || "Error al crear la sesión de checkout");
      }

      if (!data.checkoutUrl) {
        throw new Error("No se recibió URL de checkout de Stripe");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
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
    if (selectedPackage.package_type === "monthly_plan") {
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
        .from("transactions")
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_mxn: selectedPackage.price_mxn + 500,
          credits_purchased: selectedPackage.credits,
          payment_method: "spei",
          payment_status: "pending",
          purchase_type: "one_time",
          spei_reference: speiReference,
          spei_clabe: "646180157000000004",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/payment-instructions/${transaction.id}`);
    } catch (error) {
      console.error("SPEI payment error:", error);
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
      case "conekta":
        return handleConektaPayment();
      case "stripe":
        return handleStripePayment();
      case "spei":
        return handleSPEIPayment();
      default:
        return handleStripePayment();
    }
  };

  const PageHeader = () => (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Selecciona tu plan</h1>
      <p className="text-gray-600">Elige entre suscripciones mensuales o packs únicos</p>
    </div>
  );

  const actions = (
    <Button onClick={() => navigate(-1)} variant="outline" size="sm">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Volver
    </Button>
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

  const isSubscription = selectedPackage?.package_type === "monthly_plan";
  const recommendedMethod = selectedPackage
    ? getRecommendedPaymentMethod(selectedPackage.price_mxn, isSubscription)
    : "stripe";
  const selectedFees = selectedPackage
    ? calculateFees(selectedPackage.price_mxn, paymentMethod as keyof typeof PAYMENT_PROCESSORS)
    : null;

  return (
    <AppLayout actions={actions}>
      <div className="max-w-6xl mx-auto">
        <PageHeader />

        {/* Tabs mejorados */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as "monthly" | "credits");
            setSelectedPackage(null);
          }}
          className="mb-8"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="monthly" className="gap-2 py-3">
              <RefreshCw className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold">Planes Mensuales</div>
                <div className="text-xs text-gray-500">Renovación automática</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2 py-3">
              <Coins className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold">Packs Únicos</div>
                <div className="text-xs text-gray-500">Compra una vez</div>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Planes Mensuales */}
          <TabsContent value="monthly" className="space-y-6">
            {monthlyPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay planes de suscripción disponibles.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {monthlyPlans.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`
                      relative p-6 rounded-xl border-2 text-left transition-all
                      ${
                        selectedPackage?.id === pkg.id
                          ? "border-purple-600 bg-purple-50 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }
                      ${pkg.is_popular ? "ring-2 ring-blue-200" : ""}
                    `}
                  >
                    {/* Badge popular */}
                    {pkg.is_popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">POPULAR</span>
                      </div>
                    )}

                    {/* Icono */}
                    <div
                      className={`
                      w-12 h-12 rounded-xl bg-gradient-to-r ${getPackageColor(pkg.name, pkg.package_type)}
                      flex items-center justify-center text-white mb-4
                    `}
                    >
                      {getPackageIcon(pkg.name, pkg.package_type)}
                    </div>

                    {/* Nombre */}
                    <h3 className="font-bold text-lg mb-2">{pkg.name.replace("Plan ", "")}</h3>

                    {/* Precio */}
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">${(pkg.price_mxn / 100).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">/mes</div>
                    </div>

                    {/* Características clave (solo 3 más importantes) */}
                    <div className="space-y-2">
                      {getPackageFeatures(pkg)
                        .slice(0, 5)
                        .map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                    </div>

                    {/* Checkmark si está seleccionado */}
                    {selectedPackage?.id === pkg.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Packs Únicos */}
          <TabsContent value="credits" className="space-y-6">
            {creditPacks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay packs de créditos disponibles.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {creditPacks.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`
                      relative p-6 rounded-xl border-2 text-left transition-all
                      ${
                        selectedPackage?.id === pkg.id
                          ? "border-purple-600 bg-purple-50 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }
                      ${pkg.is_popular ? "ring-2 ring-blue-200" : ""}
                    `}
                  >
                    {/* Badge popular */}
                    {pkg.is_popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">POPULAR</span>
                      </div>
                    )}

                    {/* Icono */}
                    <div
                      className={`
                      w-12 h-12 rounded-xl bg-gradient-to-r ${getPackageColor(pkg.name, pkg.package_type)}
                      flex items-center justify-center text-white mb-4
                    `}
                    >
                      {getPackageIcon(pkg.name, pkg.package_type)}
                    </div>

                    {/* Nombre */}
                    <h3 className="font-bold text-lg mb-2">{pkg.name.replace("Pack ", "")}</h3>

                    {/* Precio */}
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">${(pkg.price_mxn / 100).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{pkg.credits} créditos</div>
                    </div>

                    {/* Características clave (solo 3 más importantes) */}
                    <div className="space-y-2">
                      {getPackageFeatures(pkg)
                        .slice(0, 5)
                        .map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                    </div>

                    {/* Checkmark si está seleccionado */}
                    {selectedPackage?.id === pkg.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedPackage && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Métodos de pago */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold mb-4">Método de Pago</h3>
              <div className="space-y-3">
                {/* Tarjeta */}
                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`
                    w-full flex items-center p-4 rounded-lg border-2 transition-all
                    ${
                      paymentMethod === "stripe"
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Tarjeta</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard • Instantáneo</div>
                  </div>
                  {paymentMethod === "stripe" && <CheckCircle className="w-5 h-5 text-purple-600" />}
                </button>

                {/* SPEI - solo para packs únicos */}
                {!isSubscription && (
                  <button
                    onClick={() => setPaymentMethod("spei")}
                    className={`
                      w-full flex items-center p-4 rounded-lg border-2 transition-all
                      ${
                        paymentMethod === "spei"
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <Building2 className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Transferencia SPEI</div>
                      <div className="text-sm text-gray-600">Instantáneo • $5 MXN comisión</div>
                    </div>
                    {paymentMethod === "spei" && <CheckCircle className="w-5 h-5 text-purple-600" />}
                  </button>
                )}
              </div>
            </div>

            {/* Resumen de compra */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold mb-4">Resumen</h3>
              <div className="space-y-3">
                {/* Paquete */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Paquete</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>

                {/* Créditos o tipo */}
                <div className="flex justify-between">
                  <span className="text-gray-600">{isSubscription ? "Tipo" : "Créditos"}</span>
                  <span>{isSubscription ? "Mensual" : `${selectedPackage.credits.toLocaleString()}`}</span>
                </div>

                {/* Precio */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio</span>
                  <span>${(selectedPackage.price_mxn / 100).toLocaleString()}</span>
                </div>

                {/* Comisión SPEI si aplica */}
                {paymentMethod === "spei" && !isSubscription && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Comisión SPEI</span>
                    <span>$5.00</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-lg font-bold">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      $
                      {(paymentMethod === "spei" && !isSubscription
                        ? (selectedPackage.price_mxn + 500) / 100
                        : selectedPackage.price_mxn / 100
                      ).toLocaleString()}
                    </div>
                    {isSubscription && <div className="text-sm text-gray-600">/mes</div>}
                  </div>
                </div>
              </div>

              {/* CTA de pago */}
              <Button onClick={handlePayment} disabled={processingPayment} className="w-full mt-6 py-6 text-lg">
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    Procesando...
                  </>
                ) : (
                  <>{isSubscription ? "Suscribirme" : "Comprar Ahora"}</>
                )}
              </Button>

              {/* Nota de seguridad */}
              <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Pago seguro y encriptado
                {isSubscription && " • Cancela cuando quieras"}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Checkout;
