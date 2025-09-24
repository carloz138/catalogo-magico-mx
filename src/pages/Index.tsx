import { useState, useEffect } from "react";
import { ChevronDown, Star, Check, Play, ArrowRight, Zap, Clock, DollarSign, Shield, Users, TrendingUp, Tag, Edit3, FileImage, Layers, Target, Sparkles, BarChart3, Crown, CheckCircle2, Upload, MousePointer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  const monthlyPlans = [
    {
      name: "Starter",
      description: "Para crear catálogos sin procesamiento IA",
      price: 106,
      popular: false,
      features: [
        "Catálogos PDF ilimitados",
        "Sistema de etiquetas básico", 
        "3 templates profesionales",
        "Biblioteca de productos",
        "Inline editing básico",
        "Soporte por email"
      ]
    },
    {
      name: "Básico",
      description: "Ideal para pequeños negocios",
      price: 261,
      popular: false,
      credits: 10,
      features: [
        "Todo el plan Starter",
        "10 créditos de remoción incluidos",
        "Sistema de etiquetas avanzado",
        "8 templates premium",
        "Inline editing completo",
        "Soporte prioritario"
      ]
    },
    {
      name: "Profesional",
      description: "Perfecto para empresas en crecimiento",
      price: 520,
      popular: true,
      credits: 25,
      features: [
        "Todo el plan Básico",
        "25 créditos de remoción incluidos",
        "Etiquetas y segmentación ilimitada",
        "15+ templates premium",
        "Procesamiento masivo",
        "Análisis de rendimiento",
        "Soporte WhatsApp"
      ]
    },
    {
      name: "Empresarial",
      description: "Para grandes volúmenes de productos",
      price: 935,
      popular: false,
      credits: 50,
      features: [
        "Todo el plan Profesional",
        "50 créditos de remoción incluidos",
        "Templates personalizados",
        "Multi-usuario y permisos",
        "API para integraciones",
        "Account manager dedicado",
        "Onboarding personalizado"
      ]
    }
  ];

  const creditPackages = [
    {
      name: "Starter",
      credits: 10,
      price: 74.48,
      pricePerCredit: 7.45
    },
    {
      name: "Popular", 
      credits: 25,
      price: 167.72,
      pricePerCredit: 6.71,
      popular: true
    },
    {
      name: "Business",
      credits: 50, 
      price: 302.40,
      pricePerCredit: 6.05
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
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CatifyPro
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#funcionalidades" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Funcionalidades</a>
            <a href="#precios" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Precios</a>
            <a href="#casos" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Casos de Éxito</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="hidden lg:inline-flex border-gray-300 text-gray-600 hover:bg-gray-50"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            {user && (
              <Button 
                variant="outline" 
                className="hidden lg:inline-flex border-green-300 text-green-600 hover:bg-green-50"
                onClick={() => navigate('/onboarding')}
              >
                <Play className="w-4 h-4 mr-2" />
                Guía De Inicio
              </Button>
            )}
            {user && (
              <Button 
                variant="outline" 
                className="hidden lg:inline-flex border-gray-300 text-gray-600 hover:bg-gray-50"
                onClick={() => navigate('/products')}
              >
                <Users className="w-4 h-4 mr-2" />
                Productos
              </Button>
            )}
            <Button 
              variant="outline" 
              className="hidden sm:inline-flex"
              onClick={handleAuthButton}
            >
              {user ? 'Cerrar sesión' : 'Iniciar sesión'}
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={handleMainCTA}
            >
              {user ? 'Crear Catálogo' : 'Comenzar ahora'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-24 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200 text-sm px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                +5,000 empresas automatizando sus catálogos
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Crea catálogos
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> personalizados automáticamente</span> en minutos
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                La primera plataforma que convierte tu inventario en catálogos PDF profesionales 
                <span className="font-semibold text-purple-600"> segmentados por cliente</span>. 
                Organiza productos con etiquetas inteligentes y genera catálogos automáticos por solo $106 MXN/mes.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
                    <div className="text-2xl font-bold text-purple-600">{stat.number}</div>
                    <div className="text-sm text-gray-600 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4 shadow-lg"
                  onClick={handleMainCTA}
                >
                  <Upload className="mr-2 w-5 h-5" />
                  Prueba con tus productos
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 border-purple-200 text-purple-600 hover:bg-purple-50"
                  onClick={handleDemoButton}
                >
                  <Play className="mr-2 w-5 h-5" />
                  Ver demo interactiva
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                  Setup en 5 minutos
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                  Desde $106 MXN/mes
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                  Soporte en español
                </div>
              </div>
            </div>

            {/* Demo Visual */}
            <div className="relative">
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

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-none shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">90% más barato</h3>
              <p className="text-gray-600 mb-4">
                Servicios externos: $1,000+ MXN por catálogo.
                CatifyPro: desde $106 MXN mensual ilimitado.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-800">
                  Ahorra hasta $11,000+ MXN anuales
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center border-none shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">40x más rápido</h3>
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

            <Card className="p-8 text-center border-none shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Personalización total</h3>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
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

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="flex items-center justify-between border-t pt-6">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.business}</p>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {monthlyPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative transition-all duration-300 hover:scale-105 ${
                    plan.popular 
                      ? 'border-2 border-purple-400 shadow-2xl bg-gradient-to-b from-white to-purple-50' 
                      : 'border border-gray-200 shadow-lg bg-white'
                  }`}
                >
                  {plan.popular && (
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
                          <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-lg text-gray-500 ml-1">/mes</span>
                        </div>
                        {plan.credits && (
                          <p className="text-sm text-purple-600 font-semibold">
                            + {plan.credits} créditos incluidos
                          </p>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      onClick={handleMainCTA}
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
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {creditPackages.map((pkg, index) => (
                <Card 
                  key={index}
                  className={`transition-all duration-300 hover:scale-105 ${
                    pkg.popular ? 'border-2 border-green-400 bg-gradient-to-b from-white to-green-50' : 'border border-gray-200 bg-white'
                  }`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1">
                      MÁS ELEGIDO
                    </Badge>
                  )}
                  
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{pkg.credits}</div>
                    <p className="text-gray-600 text-sm mb-4">créditos únicos</p>
                    
                    <div className="mb-6">
                      <div className="text-2xl font-bold text-purple-600">${pkg.price}</div>
                      <div className="text-sm text-gray-500">${pkg.pricePerCredit} por crédito</div>
                    </div>

                    <Button 
                      className={`w-full ${
                        pkg.popular 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                      onClick={handleMainCTA}
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
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            ¿Listo para automatizar tus catálogos?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a miles de empresas que ya ahorran <span className="font-bold">$11,000+ pesos anuales</span> y crean catálogos en 15 minutos
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-lg"
              onClick={handleMainCTA}
            >
              <Upload className="mr-2 w-5 h-5" />
              Comenzar ahora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
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
              Desde $106 MXN/mes
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Soporte en español 24/7
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 CatifyPro. Todos los derechos reservados. Hecho con ❤️ en México.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
};

export default Index;
