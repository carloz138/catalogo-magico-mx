import { useState, useEffect } from "react";
import { ChevronDown, Star, Check, Play, ArrowRight, Zap, Clock, DollarSign, Shield, Users, TrendingUp, Image as ImageIcon, Crown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

const Index = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<CreditPackage[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // ✅ CARGAR PLANES DINÁMICAMENTE
  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits');

      if (error) throw error;
      setPricingPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      // Fallback a planes estáticos si falla la carga
      setPricingPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleMainCTA = () => {
    if (user) {
      navigate('/upload');
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

  const handlePurchasePackage = (packageName: string) => {
    if (user) {
      navigate('/checkout', { state: { selectedPackageName: packageName } });
    } else {
      setLoginModalOpen(true);
    }
  };


  // ✅ FUNCIONES PARA STYLING DE PAQUETES
  const getPackageIcon = (packageName: string) => {
    if (packageName.includes('Starter')) return <Zap className="w-6 h-6" />;
    if (packageName.includes('Popular')) return <TrendingUp className="w-6 h-6" />;
    if (packageName.includes('Business')) return <Users className="w-6 h-6" />;
    if (packageName.includes('Enterprise')) return <Crown className="w-6 h-6" />;
    return <Zap className="w-6 h-6" />;
  };

  const getPackageColor = (packageName: string, isPopular: boolean) => {
    if (isPopular) return 'border-secondary bg-secondary/5';
    if (packageName.includes('Starter')) return 'border-blue-200 bg-blue-50';
    if (packageName.includes('Business')) return 'border-purple-200 bg-purple-50';
    if (packageName.includes('Enterprise')) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-gray-50';
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
      features.push('Máxima calidad garantizada');
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

  const testimonials = [
    {
      name: "María González",
      business: "Boutique Esperanza - Guadalajara",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332c5ae?w=80&h=80&fit=crop&crop=face",
      quote: "En 10 minutos tenía catálogos que parecían de Liverpool. Mis ventas se triplicaron porque ahora sí me ven como empresa seria.",
      results: "Ventas +300%"
    },
    {
      name: "Roberto Hernández", 
      business: "Muebles Artesanales RH - Oaxaca",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      quote: "Antes gastaba $15,000 pesos cada mes en fotógrafo. Ahora con CatalogoIA gasto $800 y salen mejor las fotos. ¡Increíble!",
      results: "Ahorro 95%"
    },
    {
      name: "Ana Sofía Ramírez",
      business: "Cosmética Natural ASR - CDMX", 
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      quote: "Subí mis productos a Mercado Libre con las fotos de CatalogoIA y quedé en primera página. Parece que tengo equipo de marketing.",
      results: "Top seller ML"
    }
  ];

  const faqs = [
    {
      question: "¿En serio mis fotos van a salir profesionales?",
      answer: "¡Por supuesto! Nuestro AI está entrenado con millones de fotografías profesionales. Toma tu foto de celular y la convierte en imagen de catálogo de empresa grande. Si no quedas satisfecho, te devolvemos tus créditos."
    },
    {
      question: "¿Funciona con cualquier tipo de producto?",
      answer: "Sí, desde productos de belleza hasta muebles, ropa, comida, artesanías, electrónicos y más. Nuestro AI reconoce automáticamente tu producto y aplica el mejor tratamiento profesional."
    },
    {
      question: "¿Cuánto tiempo toma realmente?",
      answer: "Entre 8-12 minutos por producto. Subes tu foto, llenas 2 datos básicos, y nosotros hacemos toda la magia. Mucho más rápido que conseguir fotógrafo, agendar cita, esperar edición..."
    },
    {
      question: "¿Es seguro poner mis datos de pago?",
      answer: "100% seguro. Usamos la misma tecnología de bancos mexicanos. Además aceptamos OXXO y transferencia bancaria si prefieres no usar tarjeta."
    },
    {
      question: "¿Qué pasa si no me gustan los resultados?",
      answer: "Si no quedas completamente satisfecho con algún producto, te regresamos esos créditos sin hacer preguntas. Queremos que tengas el catálogo de tus sueños."
    },
    {
      question: "¿Puedo usar las imágenes comercialmente?",
      answer: "¡Claro! Las imágenes son 100% tuyas. Úsalas en tu tienda, redes sociales, Mercado Libre, Amazon, donde quieras. Sin restricciones ni regalías."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">CatalogoIA</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#como-funciona" className="text-neutral hover:text-primary font-medium">Cómo funciona</a>
            <a href="#precios" className="text-neutral hover:text-primary font-medium">Precios</a>
            <a href="#testimonios" className="text-neutral hover:text-primary font-medium">Casos de éxito</a>
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
            {/* ✅ BOTÓN MI BIBLIOTECA - Desktop (para productos) */}
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
              className="bg-primary hover:bg-primary/90"
              onClick={handleMainCTA}
            >
              {user ? 'Crear Catálogo' : 'Prueba gratis'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
                ✨ Más de 10,000 productos transformados exitosamente
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral mb-6 leading-tight">
                Transforma tus productos en 
                <span className="text-primary"> catálogos profesionales</span> en 10 minutos
              </h1>
              
              <p className="text-xl text-neutral/70 mb-8 leading-relaxed">
                Por fin, calidad profesional que sí puedes pagar. 
                <span className="font-semibold text-secondary"> 95% más barato</span> que fotógrafos tradicionales y 
                <span className="font-semibold text-secondary"> 3,000x más rápido</span> que procesos tradicionales.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm">
                  <DollarSign className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-medium">Desde $75 MXN</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">10 minutos</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">100% seguro</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
                  onClick={handleMainCTA}
                >
                  Transforma tus productos ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Play className="mr-2 w-5 h-5" />
                  Ver demo
                </Button>
              </div>

              <p className="text-sm text-neutral/60 mt-4">
                💡 Prueba gratis tu primer catálogo • No necesitas tarjeta de crédito
              </p>
            </div>

            <div className="relative animate-slide-up">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-neutral/60 mb-2">ANTES (foto de celular)</h4>
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop" 
                        alt="Producto antes"
                        className="w-full h-full object-cover rounded-lg opacity-60"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-secondary mb-2">DESPUÉS (profesional)</h4>
                    <div className="aspect-square bg-gradient-to-br from-white to-gray-50 rounded-lg flex items-center justify-center relative">
                      <img 
                        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop&auto=enhance" 
                        alt="Producto después"
                        className="w-full h-full object-cover rounded-lg shadow-lg"
                      />
                      <Badge className="absolute -top-2 -right-2 bg-secondary text-white">
                        ✨ IA
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold text-neutral mb-2">¡Transformación automática!</p>
                  <p className="text-sm text-neutral/60">De foto de celular a catálogo de lujo</p>
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
            <h2 className="text-3xl font-bold text-neutral mb-4">
              ¿Por qué las PyMEs mexicanas nos prefieren?
            </h2>
            <p className="text-xl text-neutral/70">
              Porque entendemos que tu negocio merece verse como empresa grande
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-none shadow-mexican">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-neutral mb-4">95% más barato</h3>
              <p className="text-neutral/70 mb-4">
                Fotógrafos tradicionales: $1,500-4,000 MXN por producto.
                CatalogoIA: desde $75 MXN por producto.
              </p>
              <div className="bg-secondary/10 p-4 rounded-lg">
                <p className="text-sm font-semibold text-secondary">
                  Ahorra hasta $3,925 MXN por producto
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center border-none shadow-mexican">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-neutral mb-4">3,000x más rápido</h3>
              <p className="text-neutral/70 mb-4">
                Procesos tradicionales: 2-6 semanas entre citas, sesiones y edición.
                CatalogoIA: 10 minutos automático.
              </p>
              <div className="bg-accent/10 p-4 rounded-lg">
                <p className="text-sm font-semibold text-accent">
                  Catálogo completo en una tarde
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center border-none shadow-mexican">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-neutral mb-4">100% democratizado</h3>
              <p className="text-neutral/70 mb-4">
                Ya no necesitas fotógrafo para verte como empresa grande.
                Cualquier PyME puede tener calidad de Liverpool o Palacio de Hierro.
              </p>
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm font-semibold text-primary">
                  Acceso a calidad profesional para todos
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral mb-4">
              Súper fácil: Solo 3 pasos
            </h2>
            <p className="text-xl text-neutral/70">
              No necesitas ser experto, nosotros hacemos toda la magia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral mb-4">Sube tus fotos</h3>
              <p className="text-neutral/70">
                Arrastra las fotos de tus productos (no importa si son de celular o con mala luz)
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral mb-4">Completa 2 datos</h3>
              <p className="text-neutral/70">
                Nombre del producto y precio. Opcional: descripción personalizada
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold text-neutral mb-4">¡Listo!</h3>
              <p className="text-neutral/70">
                En 10 minutos tienes catálogo profesional, imágenes HD y contenido para redes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral mb-4">
              Casos de éxito reales
            </h2>
            <p className="text-xl text-neutral/70">
              Empresarios mexicanos que ya transformaron sus negocios
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 border-none shadow-mexican">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-neutral/80 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-neutral">{testimonial.name}</p>
                      <p className="text-sm text-neutral/60">{testimonial.business}</p>
                    </div>
                  </div>
                  
                  <Badge className="bg-secondary/10 text-secondary">
                    {testimonial.results}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ PRICING DINÁMICO DESDE SUPABASE */}
      <section id="precios" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral mb-4">
              Precios que sí puedes pagar
            </h2>
            <p className="text-xl text-neutral/70 mb-8">
              Elige el paquete perfecto para tu negocio
            </p>
            
            {!loadingPlans && pricingPlans.length > 0 && (
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div className="text-center">
                  <p className="text-sm text-neutral/60">Plan básico desde</p>
                  <p className="text-lg font-bold text-neutral">
                    ${Math.min(...pricingPlans.map(p => p.price_mxn / 100)).toLocaleString()} MXN
                  </p>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-sm text-neutral/60">Plan premium desde</p>
                  <p className="text-lg font-bold text-neutral">
                    ${Math.min(...pricingPlans.filter(p => p.name.includes('Premium')).map(p => p.price_mxn / 100)).toLocaleString()} MXN
                  </p>
                </div>
              </div>
            )}
          </div>

          {loadingPlans ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando planes...</p>
            </div>
          ) : pricingPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral/60">No hay planes disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className={`p-6 relative transition-all hover:scale-105 ${
                    plan.is_popular 
                      ? 'border-2 border-secondary shadow-2xl scale-105' 
                      : `border ${getPackageColor(plan.name, plan.is_popular)} shadow-lg`
                  }`}
                >
                  {plan.is_popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-secondary text-white">
                      ⭐ MÁS POPULAR
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`w-12 h-12 rounded-lg ${
                        plan.is_popular ? 'bg-secondary' : 
                        plan.name.includes('Starter') ? 'bg-blue-500' :
                        plan.name.includes('Business') ? 'bg-purple-500' :
                        plan.name.includes('Enterprise') ? 'bg-yellow-500' : 'bg-gray-500'
                      } flex items-center justify-center text-white`}>
                        {getPackageIcon(plan.name)}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-neutral mb-2">{plan.name}</h3>
                    <p className="text-sm text-neutral/60 mb-4">{plan.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-neutral">
                          ${(plan.price_mxn / 100).toLocaleString()}
                        </span>
                        <span className="text-lg font-normal">.00 MXN</span>
                        {plan.discount_percentage > 0 && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            -{plan.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral/60">{plan.credits.toLocaleString()} créditos incluidos</p>
                      <p className="text-sm text-secondary font-semibold">
                        ${((plan.price_mxn / 100) / plan.credits).toFixed(2)} por crédito
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {getPackageFeatures(plan.name, plan.credits).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-neutral/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${
                      plan.is_popular 
                        ? 'bg-secondary hover:bg-secondary/90' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    size="lg"
                    onClick={() => handlePurchasePackage(plan.name)}
                  >
                    Comprar ahora
                  </Button>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-neutral/60 mb-4">💳 Aceptamos tarjeta, OXXO y transferencia bancaria</p>
            <p className="text-sm text-neutral/60">Precios en pesos mexicanos • IVA incluido • Garantía de satisfacción</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral mb-4">
              Las dudas más frecuentes
            </h2>
            <p className="text-xl text-neutral/70">
              Todo lo que necesitas saber sobre CatalogoIA
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-none shadow-sm">
                <button
                  className="w-full p-6 text-left"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-neutral pr-8">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-neutral/60 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-neutral/80 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 gradient-mexican">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a miles de emprendedores mexicanos que ya tienen catálogos profesionales
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-4"
              onClick={handleMainCTA}
            >
              Prueba gratis tu primer catálogo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
              <Play className="mr-2 w-5 h-5" />
              Ver demostración
            </Button>
          </div>

          <p className="text-white/80 mt-6">
            💡 Sin tarjeta de crédito • Resultados garantizados • Soporte en español
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">CatalogoIA</span>
              </div>
              <p className="text-white/70">
                La plataforma que democratiza el marketing visual profesional en México
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#como-funciona" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#precios" className="hover:text-white">Precios</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreras</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white">Contacto</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/70 text-sm">
              © 2024 CatalogoIA. Todos los derechos reservados. Hecho con ❤️ en México.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-white/70 hover:text-white text-sm">Privacidad</Link>
              <Link to="/terms-and-conditions" className="text-white/70 hover:text-white text-sm">Términos</Link>
              <a href="#" className="text-white/70 hover:text-white text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </div>
  );
};

export default Index;
