import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface DemoHotspotProps {
  title: string;
  description: string;
  className?: string;
  side?: "left" | "right" | "top" | "bottom";
}

export const DemoHotspot = ({ title, description, className = "", side = "right" }: DemoHotspotProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // 🔥 AQUÍ ESTÁ LA LÓGICA DE POSICIÓN CORREGIDA 🔥
  const positionClasses = {
    left: "right-full mr-3 top-0",
    right: "left-full ml-3 top-0",
    // Top: Se va hacia arriba (bottom-full), margen abajo (mb-3), y se centra horizontalmente
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2 origin-bottom",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2 origin-top",
  };

  return (
    <div className={`absolute z-30 ${className}`}>
      {/* Botón Pulsante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="relative group outline-none"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-1000"></span>
        <div
          className={`relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)] border-2 border-white transition-transform duration-300 ${isOpen ? "bg-indigo-600 scale-110" : "bg-red-500 hover:scale-110"}`}
        >
          {isOpen ? (
            <Info className="w-3 h-3 md:w-4 md:h-4 text-white" />
          ) : (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
        </div>
      </button>

      {/* Tarjeta de Información */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            // w-max asegura que el texto no se aplaste, max-w limita el ancho
            className={`absolute ${positionClasses[side]} w-64 md:w-72 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 pointer-events-none md:pointer-events-auto z-50`}
          >
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                <SparkleIcon className="w-3 h-3 text-yellow-400" />
                {title}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium text-left">{description}</p>

            {/* Flechita decorativa centrada dinámicamente */}
            <div
              className={`absolute w-3 h-3 bg-slate-900 border-l border-t border-slate-700 rotate-45
                ${side === "left" ? "top-3 -right-1.5 border-l-0 border-t-0 border-r border-b" : ""}
                ${side === "right" ? "top-3 -left-1.5" : ""}
                ${side === "top" ? "-bottom-1.5 left-1/2 -translate-x-1/2 border-l-0 border-t-0 border-r border-b" : ""}
                ${side === "bottom" ? "-top-1.5 left-1/2 -translate-x-1/2" : ""}
            `}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SparkleIcon = (props: any) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);
