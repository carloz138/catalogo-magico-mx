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
  Rocket,
  Radar,
  BarChart3,
  CreditCard,
  Network,
  Crown,
  TrendingUp,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// --- MICRO-VISUALES (Uno para cada Slide) ---

const VisualRocket = () => (
  <div className="relative w-full h-40 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="relative z-10 bg-indigo-600 p-4 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.6)]"
    >
      <Rocket className="w-8 h-8 text-white" />
    </motion.div>
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 60 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-0 w-1 bg-gradient-to-t from-transparent to-indigo-500"
    />
  </div>
);

const VisualSmart = () => (
  <div className="relative w-full h-40 bg-amber-50 rounded-xl border border-amber-100 flex flex-col items-center justify-center p-6 gap-3">
    <div className="w-full bg-white h-10 rounded-full shadow-sm border border-slate-200 flex items-center px-3 gap-2">
      <Search className="w-4 h-4 text-slate-400" />
      <span className="text-xs text-slate-400 line-through">zapat</span>
      <span className="text-xs font-bold text-indigo-600">Zapato</span>
    </div>
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="flex gap-2">
      <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-[10px] font-bold">
        Tag: Industrial
      </div>
      <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-[10px] font-bold">
        Filtro: +$500
      </div>
    </motion.div>
  </div>
);

const VisualNetwork = () => (
  <div className="relative w-full h-40 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center">
    <div className="relative z-20 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full">TÚ</div>
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.2 }}
        className={`absolute ${i === 1 ? "top-4 left-8" : i === 2 ? "top-4 right-8" : "bottom-4"} bg-white p-2 rounded-full shadow-md border border-blue-200`}
      >
        <Users className="w-4 h-4 text-blue-500" />
      </motion.div>
    ))}
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  </div>
);

const VisualRadar = () => (
  <div className="relative w-full h-40 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center overflow-hidden">
    <div className="absolute w-32 h-32 border-2 border-emerald-200 rounded-full opacity-50"></div>
    <div className="absolute w-20 h-20 border-2 border-emerald-200 rounded-full opacity-50"></div>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      className="absolute w-32 h-32 border-r-2 border-t-2 border-transparent border-r-emerald-500 rounded-full"
      style={{ borderTopRightRadius: "100%" }}
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute top-10 right-12 w-2 h-2 bg-red-500 rounded-full shadow-lg"
    />
    <Radar className="w-8 h-8 text-emerald-600 relative z-10" />
  </div>
);

const VisualSearch = () => (
  <div className="relative w-full h-40 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center p-6 gap-2">
    {["Taladro", "Cemento", "Guantes"].map((term, i) => (
      <motion.div
        key={i}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="w-full bg-white p-2 rounded-lg shadow-sm flex justify-between items-center"
      >
        <span className="text-xs font-medium text-slate-700">{term}</span>
        <div className="h-1.5 bg-indigo-100 w-20 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${80 - i * 20}%` }}></div>
        </div>
      </motion.div>
    ))}
  </div>
);

const VisualRecommend = () => (
  <div className="relative w-full h-40 bg-violet-50 rounded-xl border border-violet-100 flex items-center justify-center gap-4">
    <div className="w-16 h-20 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
      <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
    </div>
    <Zap className="w-6 h-6 text-violet-500 animate-pulse" />
    <div className="w-16 h-20 bg-white rounded-lg shadow-md border-2 border-violet-200 flex items-center justify-center relative">
      <div className="w-8 h-8 bg-violet-100 rounded-full"></div>
      <div className="absolute -top-2 -right-2 bg-violet-600 text-white text-[8px] px-1.5 py-0.5 rounded-full">IA</div>
    </div>
  </div>
);

const VisualTrending = () => (
  <div className="relative w-full h-40 bg-slate-50 rounded-xl border border-slate-200 flex items-end justify-center p-6 gap-3">
    {[40, 70, 50, 100].map((h, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        animate={{ height: `${h}%` }}
        transition={{ type: "spring", delay: i * 0.1 }}
        className={`w-8 rounded-t-md ${i === 3 ? "bg-indigo-600" : "bg-slate-300"}`}
      />
    ))}
    <TrendingUp className="absolute top-4 right-4 w-5 h-5 text-indigo-600" />
  </div>
);

const VisualPay = () => (
  <div className="relative w-full h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white w-48 h-28 rounded-xl shadow-2xl flex flex-col p-4 justify-between relative"
    >
      <div className="flex justify-between">
        <div className="w-8 h-5 bg-slate-200 rounded"></div>
        <Check className="w-4 h-4 text-green-500" />
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-400">Total a pagar</div>
        <div className="text-xl font-bold text-slate-900">$1,299.00</div>
      </div>
      <div className="w-full h-2 bg-green-500 rounded-full"></div>
    </motion.div>
  </div>
);

const VisualGrowth = () => (
  <div className="relative w-full h-40 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center">
    <Network className="w-32 h-32 text-orange-200 absolute opacity-50" />
    <motion.div
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
      className="z-10 text-center"
    >
      <div className="text-3xl font-black text-orange-600 tracking-tighter">10x</div>
      <div className="text-xs font-bold text-orange-800 uppercase">Crecimiento</div>
    </motion.div>
  </div>
);

const VisualCrown = () => (
  <div className="relative w-full h-40 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl border border-amber-200 flex flex-col items-center justify-center p-4 overflow-hidden">
    {/* Confetti */}
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-amber-400 rounded-full"
        initial={{ y: -20, x: Math.random() * 300 }}
        animate={{ y: 200, rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2 + Math.random(), ease: "linear" }}
      />
    ))}
    <Crown className="w-12 h-12 text-amber-500 mb-2 drop-shadow-sm" />
    <div className="bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-amber-200 flex items-center gap-2 shadow-sm">
      <Ticket className="w-4 h-4 text-emerald-600" />
      <span className="text-xs font-bold text-slate-800">
        CUPÓN: <span className="text-emerald-600 text-sm">CYBER-AI-3</span>
      </span>
    </div>
    <p className="text-[10px] text-amber-700 mt-2 font-medium">3 Meses GRATIS Plan Enterprise</p>
  </div>
);

// --- DATA COMPLETA CON 10 SLIDES ---
const SLIDES = [
  {
    id: "intro",
    visual: VisualRocket,
    title: "Esta demo te va a mostrar por qué CatifyPro es tu mejor decisión",
    subtitle: "No es solo un catálogo. Es inteligencia de mercado en tiempo real.",
    bullets: [
      "Detecta qué productos están buscando tus clientes.",
      "Predice qué debes tener en inventario la próxima semana.",
      "Te muestra oportunidades de venta que tu competencia no ve.",
      "Mientras más venden tus clientes, más inteligente se vuelve tu sistema.",
    ],
    punchline: "Vendes con datos reales, no con suposiciones.",
  },
  {
    id: "catalog",
    visual: VisualSmart,
    title: "Tu catálogo se convierte en una máquina de ventas",
    subtitle: "Deja de usar PDFs que no generan resultados.",
    bullets: [
      "Buscador inteligente que encuentra productos aunque los escriban mal.",
      "Etiquetas dinámicas que puedes optimizar según cómo busca tu mercado.",
      "Filtros rápidos que hacen que compren más fácil y más rápido.",
      "Tu catálogo funciona 24/7 como un vendedor automático.",
    ],
    punchline: "Menos fricción. Más ventas.",
  },
  {
    id: "replication",
    visual: VisualNetwork,
    title: "Tus clientes se convierten en tu fuerza de ventas",
    subtitle: "Ellos pueden replicar tu catálogo con sus propios precios.",
    bullets: [
      "Ellos venden, tú observas el mercado desde arriba.",
      "Puedes ver lo que venden, lo que les piden y lo que buscan.",
      "Tienes información directa de los clientes finales sin intermediarios.",
      "Reaccionas más rápido a las demandas del mercado.",
    ],
    punchline: "No solo vendes más. Controlas el mercado.",
  },
  {
    id: "radar",
    visual: VisualRadar,
    title: "Radar de mercado en tiempo real",
    subtitle: "Escucha lo que tus clientes quieren comprar.",
    bullets: [
      "Los clientes dejan solicitudes de productos que no encuentran.",
      "Detectas demanda antes de que sea evidente.",
      "Visualizas oportunidades de negocio en segundos.",
      "Sabes exactamente qué producto lanzar o comprar primero.",
    ],
    punchline: "Venta que ves, venta que puedes capturar.",
  },
  {
    id: "search_logs",
    visual: VisualSearch,
    title: "Búsquedas que se convierten en decisiones inteligentes",
    subtitle: "Search Logs + Predicción de demanda trabajando para ti.",
    bullets: [
      "Sabes qué productos están buscando más esta semana.",
      "Detectas productos que no tienes y están pidiendo.",
      "Identificas errores de escritura que te hacen perder ventas.",
      "Optimiza tus etiquetas para que encuentren lo que ya vendes.",
    ],
    punchline: "Deja de adivinar. Empieza a anticipar.",
  },
  {
    id: "recommender",
    visual: VisualRecommend,
    title: "IA que vende más por ti",
    subtitle: "El recomendador que aumenta tu ticket y tu volumen de venta.",
    bullets: [
      "Recomienda productos complementarios automaticamente.",
      "Sugiere paquetes, cajas y combos para vender más volumen.",
      "Funciona aunque no tengas historial de ventas.",
      "Aprende de toda la red para mejorar cada recomendación.",
    ],
    punchline: "Más piezas por carrito. Más volumen. Más ganancias.",
  },
  {
    id: "trending",
    visual: VisualTrending,
    title: "Top 10 productos con mayor demanda del mes",
    subtitle: "Prepárate antes que tu competencia.",
    bullets: [
      "Detecta tendencias de compra en tiempo real.",
      "Mide el crecimiento de la demanda por producto.",
      "Te alerta antes de que falte inventario.",
      "Planea compras más inteligentes.",
    ],
    punchline: "El que se prepara primero, vende más.",
  },
  {
    id: "payments",
    visual: VisualPay,
    title: "Cobras más rápido con pagos integrados",
    subtitle: "Acepta SPEI automáticamente.",
    bullets: [
      "Recibe pagos por transferencia sin fricción.",
      "Confirmación automática de pago.",
      "Menos mensajes, menos errores, más velocidad.",
      "Tus clientes pagan más fácil, tú cobras más rápido.",
    ],
    punchline: "Vender rápido es cobrar rápido.",
  },
  {
    id: "effect",
    visual: VisualGrowth,
    title: "Efecto red: mientras más venden, más gana tu negocio",
    subtitle: "Un sistema que se vuelve más poderoso con cada venta.",
    bullets: [
      "Tus clientes alimentan tu inteligencia de mercado.",
      "Los datos de L2 y L3 se convierten en ventaja competitiva.",
      "Ve lo que pasa en tu mercado antes que nadie.",
      "Todo el ecosistema se beneficia de la información.",
    ],
    punchline: "No solo vendes un catálogo. Construyes un sistema de información.",
  },
  {
    id: "close",
    visual: VisualCrown,
    title: "CatifyPro no es un software — es tu ventaja competitiva",
    subtitle: "Empieza hoy mismo con 3 Meses de Enterprise GRATIS.",
    bullets: [
      "Más visibilidad del mercado.",
      "Más velocidad de reacción.",
      "Más control sobre tus ventas.",
      "Más inteligencia que cualquier método tradicional.",
    ],
    punchline: "El mercado cambia. Tú te adaptas antes que nadie.",
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
                  <VisualComponent />
                </div>

                {/* TEXT CONTENT */}
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 leading-tight">{slide.title}</h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base">{slide.subtitle}</p>
                </div>

                {/* BULLETS */}
                <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3 border border-slate-100 mb-6">
                  {slide.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: bullet.replace(
                              /(inteligencia|tiempo real|predice|oportunidades|Buscador inteligente|automático|fuerza de ventas|mercado|demanda|IA|Efecto red|Enterprise)/gi,
                              '<strong class="text-indigo-600">$1</strong>',
                            ),
                          }}
                        />
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
                className={`${currentStep === SLIDES.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-slate-900 hover:bg-slate-800 shadow-slate-300"} text-white px-6 shadow-lg transition-all`}
              >
                {currentStep === SLIDES.length - 1 ? (
                  <>
                    Empezar Demo <Zap className="w-4 h-4 ml-2" />
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
