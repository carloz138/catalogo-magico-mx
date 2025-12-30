import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Zap,
  Search,
  Check,
  Rocket,
  Radar,
  Crown,
  TrendingUp,
  Ticket,
  Network,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast"; // Asegúrate de tener este hook o usa alerta simple

// --- MICRO-VISUALES ---

const VisualRocket = () => (
  <div className="relative w-full h-40 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="relative z-10 bg-indigo-600 p-4 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.6)]"
    >
      <Rocket className="w-8 h-8 text-white" />
    </motion.div>
  </div>
);

const VisualIntelligence = () => (
  <div className="relative w-full h-40 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      className="absolute w-32 h-32 border-r-2 border-t-2 border-transparent border-r-emerald-500 rounded-full"
    />
    <div className="relative z-10 flex gap-4">
      <div className="bg-white p-2 rounded-lg shadow-sm border border-emerald-100 flex flex-col items-center">
        <Search className="w-5 h-5 text-emerald-600 mb-1" />
        <span className="text-[8px] font-bold uppercase text-emerald-800">Search Logs</span>
      </div>
      <div className="bg-white p-2 rounded-lg shadow-sm border border-emerald-100 flex flex-col items-center">
        <Radar className="w-5 h-5 text-indigo-600 mb-1" />
        <span className="text-[8px] font-bold uppercase text-indigo-800">Radar</span>
      </div>
    </div>
  </div>
);

const VisualRecommender = () => (
  <div className="relative w-full h-40 bg-violet-50 rounded-xl border border-violet-100 flex items-center justify-center gap-4 shrink-0">
    <div className="w-16 h-20 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center opacity-50">
      <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
    </div>
    <Zap className="w-8 h-8 text-violet-600 animate-pulse" />
    <div className="w-16 h-20 bg-white rounded-lg shadow-lg border-2 border-violet-500 flex flex-col items-center justify-center relative scale-110">
      <div className="w-8 h-8 bg-violet-100 rounded-full mb-1"></div>
      <span className="text-[8px] font-bold text-violet-700">Upsell</span>
    </div>
  </div>
);

const VisualNetworkEffect = () => (
  <div className="relative w-full h-40 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center shrink-0">
    <Network className="w-32 h-32 text-blue-200 absolute opacity-40" />
    <div className="relative z-10 flex items-center gap-2">
      <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">TÚ</div>
      <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <TrendingUp className="w-5 h-5 text-blue-500" />
      </motion.div>
      <div className="bg-white text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
        CLIENTES
      </div>
    </div>
  </div>
);

// 🔥 COMPONENTE CON LÓGICA DE COPIADO 🔥
const VisualCrown = () => {
  const [copied, setCopied] = useState(false);
  const code = "CYBER-AI-3";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "¡Cupón copiado!", description: "Úsalo al mejorar tu plan." });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative w-full h-40 bg-gradient-to-r from-yellow-50 to-amber-100 rounded-xl border border-amber-200 flex flex-col items-center justify-center p-4 overflow-hidden shrink-0">
      <Crown className="w-12 h-12 text-amber-500 mb-3 drop-shadow-sm" />

      {/* BOTÓN INTERACTIVO */}
      <button
        onClick={handleCopy}
        className="group relative bg-white/90 backdrop-blur px-5 py-2.5 rounded-full border border-amber-200 flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">¡COPIADO!</span>
          </>
        ) : (
          <>
            <Ticket className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
              CUPÓN:{" "}
              <span className="text-emerald-600 font-mono text-base border-b border-dashed border-emerald-300">
                {code}
              </span>
            </span>
            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center ml-1 group-hover:bg-slate-200">
              <Copy className="w-3 h-3 text-slate-500" />
            </div>
          </>
        )}

        {/* Tooltip flotante */}
        {!copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Clic para copiar
          </span>
        )}
      </button>
    </div>
  );
};

// --- HELPER SEGURO PARA TEXTO ---
const parseText = (text: string) => {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <strong key={index} className="text-indigo-600 font-bold">
              {part.slice(1, -1)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
};

// --- DATA ---
const SLIDES = [
  {
    id: "intro",
    visual: VisualRocket,
    title: "Bienvenido a la demo de CatifyPro",
    subtitle:
      "Descubre cómo convertir tu catálogo en una máquina de inteligencia de mercado. Aprovecha que es GRATIS por tiempo limitado.",
    bullets: [
      "Esta demo te mostrará los *beneficios ocultos* que estás perdiendo.",
      "Verás cómo tu catálogo trabaja por ti aunque no estés presente.",
      "Entenderás por qué somos diferentes a un PDF estático.",
    ],
    punchline: "Tu ventaja competitiva empieza aquí.",
  },
  {
    id: "intelligence",
    visual: VisualIntelligence,
    title: "Inteligencia: Escucha lo que el mercado grita",
    subtitle: "Dos herramientas poderosas para saber qué vender.",
    bullets: [
      "Search Logs: Rastreamos qué buscan tus clientes. Detecta *tendencias* y productos que tienes pero ellos no encuentran.",
      "Radar de Mercado: Tus clientes pueden solicitar productos que no tienes en catálogo con cantidades específicas.",
      "Validación: Recibes esas solicitudes listas para que valides si puedes *conseguirlo y ganar esa venta*.",
    ],
    punchline: "Deja de adivinar. Empieza a saber.",
  },
  {
    id: "recommender",
    visual: VisualRecommender,
    title: "Aumenta tu Ticket Promedio automáticamente",
    subtitle: "Un vendedor inteligente dentro de cada carrito.",
    bullets: [
      "El recomendador ofrece automáticamente los productos *más vendidos* y los más nuevos.",
      "Sugiere productos que otros clientes compran juntos.",
      "Todo esto aumenta el valor de cada compra sin que tú tengas que hacer nada.",
    ],
    punchline: "Gana más en cada venta.",
  },
  {
    id: "viral_loop",
    visual: VisualNetworkEffect,
    title: "El Efecto Red: Tu crecimiento exponencial",
    subtitle: "Esto es lo más importante. Tus clientes se convierten en tus vendedores.",
    bullets: [
      "Con cada venta, tu cliente puede *replicar tu catálogo* con sus propios precios y logo.",
      "Él vende todo tu inventario, no solo lo que compró.",
      "TÚ ves los Search Logs y Radares de los *clientes de tu cliente*.",
      "Tu información y oportunidades de venta se multiplican exponencialmente.",
    ],
    punchline: "Toda la cadena de suministro te informa a ti.",
  },
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-lg relative flex flex-col"
      >
        <Card className="flex flex-col h-full sm:h-auto overflow-hidden border-0 shadow-2xl sm:rounded-3xl bg-white rounded-t-3xl rounded-b-none">
          {/* PROGRESS BAR */}
          <div className="h-1.5 bg-slate-100 w-full shrink-0">
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
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* CONTENIDO SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                {/* VISUAL */}
                <div className="mb-6 flex justify-center">
                  <VisualComponent />
                </div>

                {/* TEXT CONTENT */}
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">{slide.title}</h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base">{slide.subtitle}</p>
                </div>

                {/* BULLETS */}
                <div className="bg-slate-50 rounded-xl p-5 text-left space-y-4 border border-slate-100 mb-6">
                  {slide.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 bg-green-100 p-0.5 rounded-full shrink-0">
                        <Check className="w-3 h-3 text-green-700" />
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{parseText(bullet)}</p>
                    </div>
                  ))}
                </div>

                <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                  {slide.punchline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between pb-8 sm:pb-5">
            <div className="text-xs font-medium text-slate-400">
              {currentStep + 1} / {SLIDES.length}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handlePrev} className="text-slate-500 hover:text-slate-900 px-2">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`${
                  currentStep === SLIDES.length - 1
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    : "bg-slate-900 hover:bg-slate-800 shadow-slate-300"
                } text-white px-6 shadow-lg transition-all min-w-[140px]`}
              >
                {currentStep === SLIDES.length - 1 ? (
                  <>
                    Empezar <Zap className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
