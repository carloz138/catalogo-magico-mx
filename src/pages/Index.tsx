import { useState, useEffect } from "react";
import {
  ChevronDown,
  Star,
  Check,
  Play,
  ArrowRight,
  Zap,
  Clock,
  DollarSign,
  Shield,
  Users,
  TrendingUp,
  Tag,
  Edit3,
  FileImage,
  Layers,
  Target,
  Sparkles,
  BarChart3,
  Crown,
  CheckCircle2,
  Upload,
  MousePointer,
  Download,
  Package,
  Coins,
  RefreshCw,
  AlertCircle,
  Network,
  GitBranch,
  Share2,
  Repeat,
  Truck,
  Radar,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Interface que coincide con la BD (igual que checkout)
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

const Index = () => {
  const [monthlyPlans, setMonthlyPlans] = useState<CreditPackage[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPackage[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Cargar planes dinámicamente desde Supabase (igual que checkout)
  useEffect(() => {
    fetchAllPackages();
  }, []);

  const fetchAllPackages = async () => {
    try {
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

      // Mapeo manual para garantizar compatibilidad de tipos (igual que checkout)
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

      // Separar por tipo usando el campo real package_type (igual que checkout)
      const monthly = mappedPackages.filter((pkg) => pkg.package_type === "monthly_plan");
      const credits = mappedPackages.filter((pkg) => pkg.package_type === "addon");

      setMonthlyPlans(monthly);
      setCreditPacks(credits);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  // Funciones helper idénticas a checkout
  const getPackageIcon = (packageName: string, packageType: string) => {
    if (packageType === "monthly_plan") {
      if (packageName.includes("Starter")) return <Package className="w-5 h-5" />;
      if (packageName.includes("Básico")) return <Zap className="w-5 h-5" />;
      if (packageName.includes("Profesional")) return <Star className="w-5 h-5" />;
      if (packageName.includes("Empresarial")) return <Crown className="w-5 h-5" />;
      return <RefreshCw className="w-5 h-5" />;
    }

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
        features.push("1 catálogo digital");
        features.push("50 productos máximo");
        features.push("❌ Sin cotización ni analytics");
      } else if (
        planName.includes("catálogos") &&
        !planName.includes("básico") &&
        !planName.includes("basico") &&
        !planName.includes("ia")
      ) {
        features.push("✅ Cotización Automática 24/7");
        features.push("✅ Analytics de Ventas Básicas");
        features.push("1 catálogo, 100 productos");
        features.push("Créditos IA como add-on");
      } else if (planName.includes("básico") || planName.includes("basico")) {
        features.push("✅ Sistema de cotización profesional");
        features.push("⭐ Activa tu Red de Distribución");
        features.push("✅ Tus clientes replican catálogos");
        features.push("5 catálogos activos");
        features.push("✅ Analytics avanzadas");
        features.push("➕ 30 créditos IA/mes incluidos");
      } else if (planName.includes("profesional")) {
        features.push("✅ Ecosistema de ventas completo");
        features.push("⭐ Red de Distribución ilimitada");
        features.push("30 catálogos activos");
        features.push("✅ Inteligencia de Negocio PRO");
        features.push("✅ Catálogos privados");
        features.push("➕ 100 créditos IA/mes incluidos");
      } else if (planName.includes("empresarial")) {
        features.push("✅ Ecosistema empresarial escalable");
        features.push("⭐ Red de Distribución multi-nivel");
        features.push("♾️ Catálogos ilimitados");
        features.push("✅ API de integración completa");
        features.push("✅ Soporte prioritario 24/7");
        features.push("➕ 300 créditos IA/mes incluidos");
      }

      features.push("Se renueva automáticamente");
      features.push("Cancela cuando quieras");
    } else {
      // Packs únicos de créditos IA
      features.push(`${pkg.credits} créditos IA`);
      features.push("Válidos por 12 meses");
      features.push("Sin renovación automática");
      features.push("Add-on para procesamiento IA");
    }

    return features;
  };

  const handlePurchasePackage = (packageId: string, packageName: string) => {
    if (user) {
      navigate("/checkout", { state: { selectedPackageName: packageName } });
    } else {
      navigate("/login");
    }
  };

  const handleMainCTA = () => {
    if (user) {
      navigate("/upload");
    } else {
      navigate("/login");
    }
  };

  const handleDemoButton = () => {
    if (user) {
      navigate("/onboarding");
    } else {
      navigate("/login");
    }
  };

  const handleAuthButton = () => {
    if (user) {
      signOut();
    } else {
      navigate("/login");
    }
  };

  // Sección de Problemas
  const painPoints = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Horas perdidas",
      description: "Semanas creando PDFs que quedan obsoletos al instante.",
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Errores costosos",
      description: "Cotizaciones manuales con precios incorrectos que dañan tu margen.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Ventas perdidas",
      description: "Clientes listos para comprar fuera de tu horario de oficina.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Crecimiento estancado",
      description: "Dependes 100% de tu propio esfuerzo para encontrar nuevos clientes.",
    },
  ];

  // Sección de Solución (5 pasos)
  const solutionSteps = [
    {
      number: "1",
      icon: <Upload className="w-8 h-8" />,
      title: "Crea tu Catálogo Profesional en Minutos",
      howItWorks: "Sube tus productos, personaliza precios y diseño. Tu catálogo web está listo para compartir.",
      result: "Vendes con estrategia, no al azar. Catálogos actualizados en tiempo real.",
    },
    {
      number: "2",
      icon: <Truck className="w-8 h-8" />,
      title: "Gestiona el Ciclo de Venta Completo (24/7)",
      howItWorks:
        "Tu cliente cotiza al instante. Tú recibes la solicitud, la aceptas, y con un clic marcas el pedido como 'Pedido Enviado'. Todo el seguimiento en un solo lugar.",
      result: "Cierras ventas mientras duermes. +25% conversión por respuesta inmediata.",
    },
    {
      number: "3",
      icon: <Radar className="w-8 h-8" />,
      title: "Inteligencia Real: Analytics y Radar de Mercado",
      howItWorks:
        "Ve tus KPIs de ventas, productos más vistos, y además, usa el Radar de Mercado para capturar la demanda de productos que *aún no tienes* pero que tu red está buscando.",
      result: "Tomas decisiones con datos reales, no intuición. Optimizas inventario y ofertas.",
    },
    {
      number: "4",
      icon: <Share2 className="w-8 h-8" />,
      title: "Tu Cliente Activa su Propia Red",
      howItWorks: "Con un clic, tu cliente replica tu catálogo con TUS productos para vender a su red. ¡GRATIS!",
      result: "Crecimiento exponencial. Tus clientes se convierten en tu fuerza de ventas.",
    },
    {
      number: "5",
      icon: <Network className="w-8 h-8" />,
      title: "Controlas Todo el Ecosistema",
      howItWorks:
        "Convierte a tus clientes en tu fuerza de ventas: ellos replican tu catálogo completo, mostrando los productos que te compraron como 'Disponibles' y el resto de tu inventario como 'Bajo Pedido'. ¡Así pueden vender toda tu línea de productos, no solo lo que te compraron!. Ellos venden, tú ganas.",
      result: "Escalas sin contratar vendedores. CAC (Costo de Adquisición) = $0.",
    },
  ];

  // Característica Estrella
  const cascadeFeatures = [
    {
      icon: <Repeat className="w-6 h-6" />,
      title: "Crecimiento Viral",
      description: "Cada cliente puede convertirse en distribuidor. Tu red crece automáticamente.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Costo de Adquisición Cero",
      description: "No pagas por cada nuevo cliente. Tu red se expande orgánicamente.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Ecosistema Defensivo",
      description: "Tus clientes dependen de tu plataforma. Mayor retención y lealtad.",
    },
  ];

  // FAQ
  const faqs = [
    {
      question: "¿Qué pasa exactamente cuando mi cliente replica un catálogo?",
      answer:
        "Tu cliente obtiene gratuitamente su propia versión de tu catálogo con TUS productos. Puede personalizar su marca y precios (con tus límites), pero el inventario y precios base los controlas tú. Cuando su cliente hace un pedido, tú lo cumples y defines los márgenes.",
    },
    {
      question: "¿Tengo control sobre los precios que mis clientes ponen?",
      answer:
        "Sí, completamente. Tú defines el precio base y el margen mínimo. Tu cliente puede aumentar el precio para su margen, pero nunca vender por debajo de tu precio mínimo. Mantienes control total sobre tu rentabilidad.",
    },
    {
      question: "¿Qué tan seguro es el sistema?",
      answer:
        "Utilizamos encriptación de nivel bancario y cumplimos con todas las normativas de protección de datos. Tu información de productos, precios y clientes está completamente protegida. Además, cuentas con backups automáticos diarios.",
    },
    {
      question: "¿Es difícil de configurar?",
      answer:
        "Para nada. En menos de 15 minutos puedes tener tu primer catálogo activo. El sistema es intuitivo: sube productos, personaliza tu marca, y comparte el link. No necesitas conocimientos técnicos. Además, ofrecemos onboarding guiado.",
    },
    {
      question: "¿Qué tipo de soporte ofrecen?",
      answer:
        "Todos los planes incluyen soporte por email con respuesta en menos de 24 horas. Los planes Profesional y Empresarial incluyen soporte prioritario con respuesta en menos de 4 horas, y el plan Empresarial tiene soporte 24/7 por WhatsApp y videollamadas de capacitación.",
    },
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      business: "Distribuidor Mayorista - Guadalajara",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      quote:
        "Dejé de ser un simple proveedor. Ahora gestiono una red. Mis 10 clientes más grandes le venden a sus propios 50 clientes con catálogos que nacen de mi sistema. Mis pedidos se triplicaron.",
      results: "Red de 50 distribuidores",
      metric: "3X en pedidos mensuales",
    },
    {
      name: "Sofia Hernández",
      business: "Textiles y Decoración SH - Puebla",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332c5ae?w=80&h=80&fit=crop&crop=face",
      quote:
        "El cotizador 24/7 es un cambio de juego. Cierro ventas mientras duermo. La tasa de conversión subió un 25% porque somos los primeros en responder, siempre.",
      results: "Ventas 24/7 automatizadas",
      metric: "+25% tasa de conversión",
    },
    {
      name: "Roberto Aguilar",
      business: "Productos Industriales RA - Monterrey",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      quote:
        "Mis mejores clientes ahora tienen su propio catálogo con mis productos. Ellos venden a sus redes y yo solo cumplo pedidos. Es como tener 20 vendedores sin pagarles salario.",
      results: "20 clientes = 20 vendedores",
      metric: "CAC = $0",
    },
  ];

  const stats = [
    { number: "3X", label: "Crecimiento promedio en pedidos", source: "Clientes con red activa 2024" },
    { number: "25%", label: "Más conversiones con cotización 24/7", source: "Analytics usuarios 2024" },
    { number: "$0", label: "Costo de adquisición con red", source: "Promedio usuarios 2024" },
    { number: "24/7", label: "Tu catálogo vende sin parar", source: "Sistema automático" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header simplificado con jerarquía visual clara */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - sin cambios en funcionalidad */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold">CatifyPro</span>
            </button>

            {/* Navegación simplificada - solo 3 items principales */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button
                variant="ghost"
                onClick={() => document.getElementById("funcionalidades")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-gray-900"
              >
                Funcionalidades
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-gray-900"
              >
                Precios
              </Button>
              <Button variant="ghost" onClick={() => navigate("/blog")} className="text-gray-700 hover:text-gray-900">
                Blog
              </Button>
              <Button
                variant="ghost"
                onClick={() => document.getElementById("casos")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-gray-900"
              >
                Casos de Éxito
              </Button>
            </nav>

            {/* CTAs desktop */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Button variant="outline" onClick={() => navigate("/products")} className="hidden sm:inline-flex">
                    <Package className="w-4 h-4 mr-2" />
                    Productos
                  </Button>
                  <Button onClick={() => navigate("/upload")} className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleAuthButton} className="hidden sm:inline-flex">
                    Iniciar sesión
                  </Button>
                  <Button onClick={handleMainCTA} className="bg-gradient-to-r from-purple-600 to-blue-600">
                    Comenzar gratis
                  </Button>
                </>
              )}
            </div>

            {/* CTAs móvil */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                onClick={handleMainCTA}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-10 px-3 text-sm"
              >
                {user ? "Subir" : "Comenzar"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 pb-16 sm:pb-24 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                +5,000 empresas automatizando sus catálogos
              </Badge>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Tu Catálogo es Ahora tu
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {" "}
                  Red de Ventas
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl">
                Transforma tu proceso de ventas con catálogos digitales, cotizaciones automáticas y un{" "}
                <span className="font-semibold text-purple-600">
                  ecosistema que permite a tus clientes vender tus productos por ti
                </span>
                . Activa tu red de distribución y escala sin límites.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100"
                  >
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{stat.number}</div>
                    <div className="text-xs sm:text-sm text-gray-600 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-auto"
                  onClick={handleMainCTA}
                >
                  <Upload className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Prueba con tus productos
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-auto border-purple-200 text-purple-600 hover:bg-purple-50"
                  onClick={handleDemoButton}
                >
                  <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Ver demo interactiva
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1.5 sm:mr-2" />
                  Setup en 5 minutos
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1.5 sm:mr-2" />
                  Desde $99 MXN/mes
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1.5 sm:mr-2" />
                  Soporte en español
                </div>
              </div>
            </div>

            {/* Demo Visual */}
            <div className="hidden lg:block relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
                {/* Steps visualization */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">Sube productos masivamente</h4>
                      <p className="text-gray-600 text-sm">Carga 100+ productos en un solo drag & drop</p>
                    </div>
                    <Upload className="w-5 h-5 text-purple-500" />
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">Etiqueta estratégicamente</h4>
                      <p className="text-gray-600 text-sm">Organiza por cliente, temporada, categoría</p>
                    </div>
                    <Tag className="w-5 h-5 text-blue-500" />
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">Genera catálogos automáticos</h4>
                      <p className="text-gray-600 text-sm">PDFs profesionales en 2 minutos</p>
                    </div>
                    <Download className="w-5 h-5 text-green-500" />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-4 py-2">
                    ⚡ Resultado: Catálogos personalizados por cliente
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección del Problema */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">¿Te suena familiar?</h2>
            <p className="text-xl text-gray-600">Estos son los frenos de mano que están limitando tu crecimiento</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((point, index) => (
              <Card key={index} className="p-6 text-center border-none shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                  {point.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{point.title}</h3>
                <p className="text-gray-600 text-sm">{point.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de la Solución: El Ciclo de Crecimiento Acelerado */}
      <section id="funcionalidades" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
              <Sparkles className="w-4 h-4 mr-2" />
              El Ciclo de Crecimiento Acelerado
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Cómo CatifyPro Transforma tu Negocio</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              De la gestión manual a un ecosistema de ventas automatizado en 5 pasos
            </p>
          </div>

          <div className="space-y-8">
            {solutionSteps.map((step, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-12 gap-0">
                    {/* Número del paso */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-purple-600 to-blue-600 p-8 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                          {step.icon}
                        </div>
                        <div className="text-6xl font-bold text-white/40">{step.number}</div>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="lg:col-span-10 p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>

                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-purple-600 uppercase mb-2">Cómo funciona</h4>
                        <p className="text-gray-700 leading-relaxed">{step.howItWorks}</p>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
                        <p className="text-base font-semibold text-green-800">{step.result}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Característica Estrella: El Efecto Cascada */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200">
              <Crown className="w-4 h-4 mr-2" />
              Tu Arma Secreta
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Transforma a cada Cliente en tu Propio Vendedor
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La característica que separa CatifyPro de cualquier otra herramienta de catálogos
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Izquierda */}
            <Card className="p-8 bg-white shadow-xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tu Cliente Recibe su Pedido</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tu cliente está satisfecho con tu producto y servicio. El proceso tradicional terminaría aquí.
                </p>
              </div>
            </Card>

            {/* Derecha */}
            <Card className="p-8 bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl transform lg:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Network className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">El Efecto Cascada Comienza</h3>
                <p className="leading-relaxed mb-6">
                  Con un clic y <span className="font-bold text-yellow-300">completamente gratis</span>, tu cliente
                  activa su propio catálogo con <span className="font-bold">TUS productos</span>, listo para vender a su
                  red.
                </p>
                <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                  <p className="text-sm font-semibold">Tú controlas los productos, ellos venden, tú ganas.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Beneficios Clave */}
          <div className="grid md:grid-cols-3 gap-6">
            {cascadeFeatures.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="casos" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Casos de éxito documentados</h2>
            <p className="text-xl text-gray-600">
              Empresas reales que transformaron sus ventas con automatización de catálogos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-gray-700 mb-6 italic text-base sm:text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between border-t pt-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-sm sm:text-base text-gray-900">{testimonial.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{testimonial.business}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <Badge className="bg-purple-100 text-purple-800 justify-center py-2">{testimonial.results}</Badge>
                    <Badge className="bg-green-100 text-green-800 justify-center py-2">{testimonial.metric}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Elige tu Plan de Crecimiento</h2>
            <p className="text-xl text-gray-600 mb-8">
              Desde catálogos básicos hasta ecosistemas de distribución completos. Créditos IA opcionales.
            </p>
          </div>

          {/* Monthly Plans */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Planes de Ecosistema</h3>
            <p className="text-gray-600 text-center mb-8">Activa tu red de distribución y escala sin límites</p>

            {/* Monthly Plans - Móvil scroll horizontal */}
            <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 mb-12">
              <div className="flex gap-4 snap-x snap-mandatory" style={{ scrollSnapType: "x mandatory" }}>
                {monthlyPlans.map((plan, index) => (
                  <Card
                    key={index}
                    className="min-w-[280px] flex-shrink-0 snap-center relative transition-all duration-300"
                  >
                    <CardContent className="p-5">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <p className="text-gray-600 text-xs mb-3">{plan.description}</p>
                        <div className="flex items-baseline justify-center">
                          <span className="text-2xl font-bold text-gray-900">${plan.price_mxn / 100}</span>
                          <span className="text-base text-gray-500 ml-1">/mes</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {getPackageFeatures(plan)
                          .slice(0, 4)
                          .map((feature, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-gray-700">{feature}</span>
                            </li>
                          ))}
                      </ul>
                      <Button className="w-full h-11 text-sm" onClick={() => handlePurchasePackage(plan.id, plan.name)}>
                        Comenzar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Monthly Plans - Desktop grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {monthlyPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative transition-all duration-300 hover:scale-105 ${
                    plan.is_popular
                      ? "border-2 border-purple-400 shadow-2xl bg-gradient-to-b from-white to-purple-50"
                      : "border border-gray-200 shadow-lg bg-white"
                  }`}
                >
                  {plan.is_popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-1">
                      POPULAR
                    </Badge>
                  )}

                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                      <div className="mb-4">
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-bold text-gray-900">${plan.price_mxn / 100}</span>
                          <span className="text-lg text-gray-500 ml-1">/mes</span>
                        </div>
                        {plan.credits && plan.credits > 0 && (
                          <p className="text-sm text-purple-600 font-semibold">+ {plan.credits} créditos incluidos</p>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {getPackageFeatures(plan).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.is_popular
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                      onClick={() => handlePurchasePackage(plan.id, plan.name)}
                    >
                      Comenzar ahora
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Credit Packages */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Créditos IA (Add-on Opcional)</h3>
            <p className="text-gray-600 text-center mb-8">
              Compra créditos adicionales para procesamiento de imágenes con IA cuando los necesites
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {creditPacks.map((pkg, index) => (
                <Card
                  key={index}
                  className={`transition-all duration-300 hover:scale-105 relative ${
                    pkg.is_popular
                      ? "border-2 border-green-400 bg-gradient-to-b from-white to-green-50"
                      : "border border-gray-200 bg-white"
                  }`}
                >
                  {pkg.is_popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1">
                      MÁS ELEGIDO
                    </Badge>
                  )}

                  <CardContent className="p-5 sm:p-6 text-center">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{pkg.credits}</div>
                    <p className="text-gray-600 text-sm mb-4">créditos únicos</p>

                    <div className="mb-6">
                      <div className="text-2xl font-bold text-purple-600">${pkg.price_mxn / 100}</div>
                    </div>

                    <Button
                      className={`w-full ${
                        pkg.is_popular ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"
                      }`}
                      onClick={() => handlePurchasePackage(pkg.id, pkg.name)}
                    >
                      Comprar créditos
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center mt-12 space-y-4">
            <p className="text-sm text-gray-500">Precios en pesos mexicanos • IVA incluido</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-xl text-gray-600">Todo lo que necesitas saber sobre CatifyPro</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                <AccordionTrigger className="text-left hover:text-purple-600 transition-colors py-6">
                  <span className="text-lg font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            ¿Listo para Dejar de Vender y Empezar a Construir tu Red?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            Únete a las empresas que ya están escalando con <span className="font-bold">crecimiento exponencial</span> y{" "}
            <span className="font-bold">CAC = $0</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 h-12 shadow-lg"
              onClick={handleMainCTA}
            >
              <Network className="mr-2 w-5 h-5" />
              Activa tu Ecosistema de Ventas
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 h-12"
              onClick={handleDemoButton}
            >
              <Play className="mr-2 w-5 h-5" />
              Ver demo completa
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-x-0 sm:space-x-6 space-y-2 sm:space-y-0 text-white/80">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sin límite de vendedores
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Desde $99 MXN/mes
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Red activa en 24 horas
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer móvil - Accordions */}
          <div className="md:hidden space-y-2 mb-8">
            {[
              { title: "Producto", items: ["Funcionalidades", "Precios", "API", "Integraciones"] },
              { title: "Empresa", items: ["Nosotros", "Casos de éxito", "Blog", "Prensa"] },
              { title: "Soporte", items: ["Centro de ayuda", "WhatsApp", "Email", "Onboarding"] },
            ].map((section, idx) => (
              <details key={idx} className="group border-b border-gray-800">
                <summary className="flex justify-between items-center py-4 cursor-pointer list-none">
                  <h4 className="font-semibold text-base">{section.title}</h4>
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="pb-4 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 text-sm hover:text-white block py-1">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">CatifyPro</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Automatizando la creación de catálogos profesionales para empresas mexicanas
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#funcionalidades" className="hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#precios" className="hover:text-white transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integraciones
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Nosotros
                  </a>
                </li>
                <li>
                  <a href="#casos" className="hover:text-white transition-colors">
                    Casos de éxito
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Prensa
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Centro de ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Email
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Onboarding
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © 2024 CatifyPro. Todos los derechos reservados. Hecho con ❤️ en México.
            </p>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Términos
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
