import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Search, 
  ShoppingCart, 
  Users,
  ArrowUp,
  Check,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// --- VISUAL COMPONENTS (Micro-UI) ---

// 1. Visual Intro: Transformación PDF -> App
const VisualIntro = () => (
  <div className="relative w-full h-40 bg-gradient-to-b from-indigo-50 to-white rounded-xl border border-indigo-100 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
    <motion.div 
        initial={{ x: -50, opacity: 0 }} animate={{ x: -30, opacity: 0.5, scale: 0.8 }} transition={{ delay: 0.2 }}
        className="absolute bg-slate-200 p-4 rounded-lg w-24 h-32 border-2 border-slate-300 flex flex-col gap-2"
    >
        <div className="h-2 w-12 bg-slate-400 rounded"></div>
        <div className="h-2 w-full bg-slate-300 rounded"></div>
        <div className="h-2 w-full bg-slate-300 rounded"></div>
    </motion.div>
    <motion.div 
        initial={{ scale: 0.5, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", delay: 0.4 }}
        className="relative z-10 bg-white p-3 rounded-xl w-32 shadow-2xl border border-indigo-200"
    >
        <div className="h-24 bg-indigo-50 rounded-lg mb-2 flex items-center justify-center"><ShoppingCart className="w-8 h-8 text-indigo-500" /></div>
        <div className="h-2 w-16 bg-indigo-100 rounded mb-1"></div>
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">+Ventas</div>
    </motion.div>
  </div>
);

// 2. Visual Smart: Buscador + Recomendación
const VisualSmart = () => (
  <div className="relative w-full h-40 bg-amber-50/50 rounded-xl border border-amber-100 flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-full bg-white rounded-full h-10 shadow-sm border border-slate-200 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <div className="text-xs text-slate-400 flex gap-1">
             <span className="line-through opacity-50">zapat</span> <span className="text-slate-800 font-medium">Zapato Industrial</span>
          </div>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="w-full bg-white p-3 rounded-lg shadow-md border border-amber-100 flex items-center gap-3"
      >
          <div className="bg-amber-100 p-2 rounded-md"><Zap className="w-4 h-4 text-amber-600" /></div>
          <div className="flex-1">
              <div className="text-[10px] text-amber-700 font-bold uppercase">IA Recomienda</div>
              <div className="text-xs text-slate-600">Lleva guantes con esto.</div>
          </div>
      </motion.div>
  </div>
);

// 3. Visual Network: Efecto Red
const VisualNetwork = () => (
  <div className="relative w-full h-40 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-center overflow-hidden">
      <div className="relative z-20 flex flex-col items-center">
          <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center shadow-xl border-4 border-white z-20"><span className="text-white font-bold text-xs">TÚ</span></div>
          <div className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full -mt-3 z-30 relative">Admin</div>
      </div>
      {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + (i * 0.1) }}
            className={`absolute flex flex-col items-center z-10 ${i === 1 ? 'left-8 bottom-6' : i === 2 ? 'right-8 bottom-6' : 'top-4 right-12'}`}
          >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-blue-200"><Users className="w-4 h-4 text-blue-500" /></div>
              {/* Puntos de datos viajando hacia el admin */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: i===1?20:i===2?-20:-10, y: i===3?20:-20 }} 
                transition={{ repeat: Infinity, duration: 2, delay: i*0.5 }}
                className="absolute w-2 h-2 bg-green-500 rounded-full"
              />
          </motion.div>
      ))}
  </div>
);

// 4. Visual Intel: Gráfica + Radar
const VisualIntel = () => (
  <div className="relative w-full h-40 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-end justify-center p-4 gap-2 overflow-hidden">
      {[40, 70, 50, 90, 60].map((h, i) => (
          <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ type: "spring", delay: i * 0.1 }} className="w-8 bg-emerald-500 rounded-t-md opacity-80" />
      ))}
      <div className="absolute top-3 left-3 bg-white shadow-sm border border-emerald-100 px-2 py-1 rounded-md flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
          <span className="animate-pulse w-2 h-2 bg-emerald-500 rounded-full"></span> Radar Activo
      </div>
  </div>
);

// 5. Visual Offer: Cupón
const VisualOffer = () => (
    <div className="relative w-full h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden p-4">
        <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/50">
                <Ticket className="w-3 h-3" /> CUPÓN ACTIVADO
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">CYBER-AI-3</h3>
            <p className="text-slate-400 text-xs">3 Meses GRATIS en Plan Enterprise</p>
        </div>
        {/* Confetti effect simulated */}
        {[...Array(8)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                initial={{ y: -20, x: Math.random() * 300 }}
                animate={{ y: 200, rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2 + Math.random(), ease: "linear" }}
            />
        ))}
    </div>
);

// --- DATA DE LOS SLIDES ---
const SLIDES = [
  { 
      id: "intro", 
      visual: VisualIntro, 
      title: "Tu catálogo ya no es un PDF", 
      subtitle: "Es una máquina de ventas autónoma.", 
      bullets: [
          "Deja de enviar listas de precios estáticas.", 
          "Empieza a enviar un sistema que cotiza solo.", 
          "Tus clientes compran sin fricción 24/7."
      ], 
      punchline: "Sin vendedores extra. Sin esperas. Solo ventas." 
  },
  { 
      id: "smart", 
      visual: VisualSmart, 
      title: "Vende y Cobra en Automático", 
      subtitle: "Tecnología que cierra tratos por ti.", 
      bullets: [
          "Recomendador IA: Aumenta el ticket promedio.", 
          "Buscador Tolerante: Entiende errores de dedo.", 
          "Pagos Integrados: Cobra con SPEI al instante."
      ], 
      punchline: "Tu catálogo trabaja mientras tú duermes." 
  },
  { 
      id: "network", 
      visual: VisualNetwork, 
      title: "Tu Información se vuelve Exponencial", 
      subtitle: "El Efecto Red: Tu ventaja injusta.", 
      bullets: [
          "Regala a tus clientes una réplica de tu catálogo.", 
          "Ellos ponen SU logo y SUS precios (Marca Blanca).", 
          "Tú obtienes data de lo que vende toda la cadena."
      ], 
      punchline: "Convierte a cada cliente en una sucursal digital." 
  },
  { 
      id: "intel", 
      visual: VisualIntel, 
      title: "Deja de Adivinar. Empieza a Predecir.", 
      subtitle: "Inteligencia de mercado en tiempo real.", 
      bullets: [
          "Radar: Mira qué productos piden y no tienes.", 
          "Predicción: Evita el desabasto antes que nadie.", 
          "Search Logs: Lee la mente de tus consumidores."
      ], 
      punchline: "Información que vale dinero real." 
  },
  // --- SLIDE DE OFERTA FINAL ---
  { 
      id: "close", 
      visual: VisualOffer,
      title: "Prueba el Poder de la IA", 
      subtitle: "Te regalamos 3 Meses del Plan Enterprise.", 
      bullets: [
          "Acceso total a Modelos Predictivos.",
          "Visión completa de toda tu red de revendedores.",
          "Sin costo por 90 días para que veas resultados."
      ], 
      punchline: "Usa el código CYBER-AI-3 al registrarte." 
  }
];

export default function WelcomeTour({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < SLIDES.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const slide = SLIDES[currentStep];
  const VisualComponent = slide.visual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md md:max-w-lg relative"
      >
        <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white">
            {/* PROGRESS BAR */}
            <div className="h-1.5 bg-slate-100 w-full">
                <motion.div 
                    className="h-full bg-indigo-600"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / SLIDES.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Botón Cerrar */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-full"
                    >
                        {/* VISUAL AREA */}
                        <div className="mb-6">
                            {VisualComponent ? <VisualComponent /> : null}
                        </div>

                        {/* TEXT CONTENT */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                                {slide.title}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {slide.subtitle}
                            </p>
                        </div>

                        {/* BULLETS */}
                        <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3 border border-slate-100 mb-6">
                            {slide.bullets.map((bullet, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        {/* Resaltado dinámico de palabras clave */}
                                        <span dangerouslySetInnerHTML={{ 
                                            __html: bullet.replace(/(GRATIS|SU logo|SUS precios|Enterprise|Modelos Predictivos|90 días)/g, '<strong class="text-indigo-600">$1</strong>') 
                                        }} />
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-600 mt-auto">
                            {slide.punchline}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex gap-1.5">
                    {SLIDES.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-300'}`}
                        />
                    ))}
                </div>

                <div className="flex gap-3">
                    {currentStep > 0 && (
                        <Button variant="ghost" onClick={handlePrev} className="text-slate-500 hover:text-slate-900 px-2">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <Button 
                        onClick={handleNext}
                        className={`${currentStep === SLIDES.length - 1 ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'} text-white px-6 shadow-lg transition-all`}
                    >
                        {currentStep === SLIDES.length - 1 ? (
                            <>Ir a la Demo <Zap className="w-4 h-4 ml-2" /></>
                        ) : (
                            <>Siguiente <ChevronRight className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}
