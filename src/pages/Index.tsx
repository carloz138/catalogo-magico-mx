import { useState, useEffect } from "react";
import { ChevronDown, Star, Check, Play, ArrowRight, Zap, Clock, DollarSign, Shield, Users, TrendingUp, Tag, Edit3, FileImage, Layers, Target, Sparkles, BarChart3, Crown, CheckCircle2, Upload, MousePointer, Download, Package, Coins, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoginModal } from "@/components/auth/LoginModal";
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
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
        package_type: pkg.package_type || (pkg.name.toLowerCase().includes('plan') ? 'monthly_plan' : 'addon'),
        max_uploads: pkg.max_uploads,
        max_catalogs: pkg.max_catalogs,
        duration_months: pkg.duration_months
      }));

      // Separar por tipo usando el campo real package_type (igual que checkout)
      const monthly = mappedPackages.filter(pkg => pkg.package_type === 'monthly_plan');
      const credits = mappedPackages.filter(pkg => pkg.package_type === 'addon');
      
      setMonthlyPlans(monthly);
      setCreditPacks(credits);
      
    } catch (error) {
      console.error('Error fetching packages:', error);
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
    if (packageType === 'monthly_plan') {
      if (packageName.includes('Starter')) return <Package className="w-5 h-5" />;
      if (packageName.includes('Básico')) return <Zap className="w-5 h-5" />;
      if (packageName.includes('Profesional')) return <Star className="w-5 h-5" />;
      if (packageName.includes('Empresarial')) return <Crown className="w-5 h-5" />;
      return <RefreshCw className="w-5 h-5" />;
    }
    
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
      // Suscripciones mensuales
      if (pkg.credits > 0) {
        features.push(`${pkg.credits} créditos mensuales incluidos`);
      } else {
        features.push('Sin procesamiento IA');
      }
      
      if (pkg.max_catalogs !== undefined && pkg.max_catalogs !== null) {
        if (pkg.max_catalogs === 0) {
          features.push('Catálogos PDF ilimitados');
        } else {
          features.push(`${pkg.max_catalogs} catálogos/mes`);
        }
      }
      
      if (pkg.max_uploads) {
        features.push(`${pkg.max_uploads} uploads/mes`);
      }
      
      features.push('Se renueva automáticamente');
      features.push('Cancela cuando quieras');
    } else {
      // Packs únicos  
      features.push(`${pkg.credits} créditos únicos`);
      features.push('Válidos por 12 meses');
      features.push('Sin renovación automática');
      features.push('Úsalos cuando quieras');
    }
    
    features.push('Sistema de etiquetas avanzado');
    features.push('Inline editing completo');
    features.push('Templates profesionales');
    features.push('Soporte por WhatsApp');
    
    return features;
  };

  const handlePurchasePackage = (packageId: string, packageName: string) => {
    if (user) {
      navigate('/checkout', { state: { selectedPackageName: packageName } });
    } else {
      setLoginModalOpen(true);
    }
  };

  const handleMainCTA = () => {
    if (user) {
      navigate('/upload');
    } else {
      setLoginModalOpen(true);
    }
  };

  const handleDemoButton = () => {
    if (user) {
      navigate('/onboarding');
    } else {
      setLoginModalOpen(true);
    }
  };

  const handleAuthButton = () => {
    if (user) {
      signOut();
    } else {
      setLoginModalOpen(true);
    }
  };

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Subida de Productos Masiva",
      description: "Carga cientos de productos de una vez. Arrastra y suelta todas tus imágenes y organízalas rápidamente en tu biblioteca personal.",
      benefit: "Procesa 100+ productos en minutos vs semanas"
    },
    {
      icon: <Tag className="w-6 h-6" />,
      title: "Sistema de Etiquetas Inteligente",
      description: "Organiza productos por categorías, temporadas, clientes. Crea catálogos específicos en un clic: 'Halloween', 'Cliente Premium', etc.",
      benefit: "760% más ingresos con segmentación"
    },
    {
      icon: <Edit3 className="w-6 h-6" />,
      title: "Edición Inline Ultrarrápida",
      description: "Edita precios, nombres y descripciones directamente en la tabla. Sin abrir ventanas, sin perder tiempo en navegación.",
      benefit: "30% menos tiempo en gestión diaria"
    },
    {
      icon: <FileImage className="w-6 h-6" />,
      title: "Remoción de Fondos Opcional",
      description: "Decide cuándo usar nuestro servicio de remoción de fondos. Elimina fondos de productos seleccionados cuando lo necesites.",
      benefit: "9.6% más conversiones con fondos limpios"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Templates Profesionales",
      description: "Elige un template, selecciona productos por etiquetas, y genera PDFs profesionales automáticamente. Zero diseño manual.",
      benefit: "Reduce costos de producción 10-50%"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Catálogos Personalizados por Cliente",
      description: "Crea versiones específicas para cada cliente o segmento. Mismo inventario, múltiples catálogos dirigidos.",
      benefit: "400% ROI en personalización"
    }
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      business: "Muebles Artesanales CM - Guadalajara",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      quote: "Antes tardaba 2 semanas creando catálogos manualmente por $1000+ pesos. Ahora tengo 15 catálogos diferentes para cada tipo de cliente por solo $261 al mes.",
      results: "15 catálogos automáticos",
      metric: "De 2 semanas a 15 minutos"
    },
    {
      name: "Sofia Hernández", 
      business: "Textiles y Decoración SH - Puebla",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332c5ae?w=80&h=80&fit=crop&crop=face",
      quote: "El sistema de etiquetas cambió mi negocio. Ahora creo catálogos de 'Navidad', 'Hoteles', 'Casas' en segundos. Cada cliente ve solo lo que le interesa.",
      results: "12 segmentos activos",
      metric: "760% más pedidos dirigidos"
    },
    {
      name: "Roberto Aguilar",
      business: "Productos Industriales RA - Monterrey", 
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      quote: "2,400 productos organizados por industria. Cada prospecto recibe un catálogo personalizado. Cerramos 80% más deals porque parecemos empresa grande.",
      results: "2,400 productos activos",
      metric: "+80% tasa de cierre"
    }
  ];



  const stats = [
    { number: "760%", label: "Aumento en ingresos con catálogos segmentados", source: "Estudio DataAxle 2024" },
    { number: "$1,000", label: "Costo promedio servicios externos", source: "Feedback clientes 2024" },
    { number: "1-2 sem", label: "Tiempo promedio métodos tradicionales", source: "Feedback clientes 2024" },
    { number: "15 min", label: "Tiempo con CatifyPro", source: "Promedio usuarios 2024" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header simplificado con jerarquía visual clara */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            
            {/* Logo - sin cambios en funcionalidad */}
            <button 
              onClick={() => navigate('/')}
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
                onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-gray-900"
              >
                Funcionalidades
              </Button>
              <Button 
                variant="ghost"
                onClick={() => document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-gray-900"
              >
                Precios
              </Button>
              <Button 
                variant="ghost"
                onClick={() => document.getElementById('casos')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-gray-900"
              >
                Casos de Éxito
              </Button>
            </nav>

            {/* CTAs desktop */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/products')}
                    className="hidden sm:inline-flex"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Productos
                  </Button>
                  <Button
                    onClick={() => navigate('/upload')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleAuthButton}
                    className="hidden sm:inline-flex"
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    onClick={handleMainCTA}
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                  >
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
                {user ? 'Subir' : 'Comenzar'}
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
                Crea catálogos
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> personalizados automáticamente</span> en minutos
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl">
                La primera plataforma que convierte tu inventario en catálogos PDF profesionales 
                <span className="font-semibold text-purple-600"> segmentados por cliente</span>. 
                Organiza productos con etiquetas inteligentes y genera catálogos automáticos por solo $99 MXN/mes.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
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
                  Desde $106 MXN/mes
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
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">Sube productos masivamente</h4>
                      <p className="text-gray-600 text-sm">Carga 100+ productos en un solo drag & drop</p>
                    </div>
                    <Upload className="w-5 h-5 text-purple-500" />
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">Etiqueta estratégicamente</h4>
                      <p className="text-gray-600 text-sm">Organiza por cliente, temporada, categoría</p>
                    </div>
                    <Tag className="w-5 h-5 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
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

      {/* Value Props */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué las PyMEs mexicanas eligen CatifyPro?
            </h2>
            <p className="text-xl text-gray-600">
              Porque entendemos que tu negocio merece verse como empresa grande
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="p-6 sm:p-8 text-center border-none shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">90% más barato</h3>
              <p className="text-gray-600 mb-4">
                Servicios externos: $1,000+ MXN por catálogo.
                CatifyPro: desde $99 MXN mensual ilimitado.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-800">
                  Ahorra hasta $11,000+ MXN anuales
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 text-center border-none shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">40x más rápido</h3>
              <p className="text-gray-600 mb-4">
                Métodos tradicionales: 1-2 semanas entre diseño y entrega.
                CatifyPro: 15 minutos automático.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">
                  Catálogo completo en una tarde
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 text-center border-none shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Personalización total</h3>
              <p className="text-gray-600 mb-4">
                Crea catálogos específicos para cada cliente, temporada o segmento.
                Mismo inventario, múltiples versiones dirigidas.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-purple-800">
                  760% más ingresos con segmentación
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              6 funcionalidades que revolucionarán tu negocio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada funcionalidad está respaldada por datos reales de impacto empresarial
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
                <CardContent className="p-6 sm:p-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-400">
                    <p className="text-sm font-semibold text-purple-800">
                      📈 {feature.benefit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="casos" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Casos de éxito documentados
            </h2>
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
                    <Badge className="bg-purple-100 text-purple-800 justify-center py-2">
                      {testimonial.results}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 justify-center py-2">
                      {testimonial.metric}
                    </Badge>
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
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Precios diseñados para PyMEs mexicanas
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Planes mensuales + créditos opcionales para remoción de fondos
            </p>
          </div>

          {/* Monthly Plans */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Planes Mensuales</h3>
            
            {/* Monthly Plans - Móvil scroll horizontal */}
            <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 mb-12">
              <div className="flex gap-4 snap-x snap-mandatory" style={{ scrollSnapType: 'x mandatory' }}>
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
                        {getPackageFeatures(plan).slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full h-11 text-sm"
                        onClick={() => handlePurchasePackage(plan.id, plan.name)}
                      >
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
                      ? 'border-2 border-purple-400 shadow-2xl bg-gradient-to-b from-white to-purple-50' 
                      : 'border border-gray-200 shadow-lg bg-white'
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
                          <p className="text-sm text-purple-600 font-semibold">
                            + {plan.credits} créditos incluidos
                          </p>
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
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
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
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">Créditos para Remoción de Fondos</h3>
            <p className="text-gray-600 text-center mb-8">Compra créditos adicionales cuando los necesites</p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {creditPacks.map((pkg, index) => (
                <Card 
                  key={index}
                  className={`transition-all duration-300 hover:scale-105 relative ${
                    pkg.is_popular ? 'border-2 border-green-400 bg-gradient-to-b from-white to-green-50' : 'border border-gray-200 bg-white'
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
                      <div className="text-sm text-gray-500">${Math.round((pkg.price_mxn / 100) / pkg.credits)} por crédito</div>
                    </div>

                    <Button 
                      className={`w-full ${
                        pkg.is_popular 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
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
            <p className="text-gray-600">💳 Aceptamos tarjeta, OXXO, transferencia bancaria y PayPal</p>
            <p className="text-sm text-gray-500">Precios en pesos mexicanos • IVA incluido</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            ¿Listo para automatizar tus catálogos?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            Únete a miles de empresas que ya ahorran <span className="font-bold">$11,000+ pesos anuales</span> y crean catálogos en 15 minutos
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 h-12 shadow-lg"
              onClick={handleMainCTA}
            >
              <Upload className="mr-2 w-5 h-5" />
              Comenzar ahora
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
              Setup en 5 minutos
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Desde $99 MXN/mes
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Soporte en español 24/7
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
              { title: "Soporte", items: ["Centro de ayuda", "WhatsApp", "Email", "Onboarding"] }
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
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integraciones</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Nosotros</a></li>
                <li><a href="#casos" className="hover:text-white transition-colors">Casos de éxito</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Prensa</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Email</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Onboarding</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
              © 2024 CatifyPro. Todos los derechos reservados. Hecho con ❤️ en México.
            </p>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
};

export default Index;