import React from "react";
import { Sparkles, Plus, TrendingUp, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Product = Tables<"products">;

// Extendemos el tipo para incluir la metadata de la recomendación
type RecommendedProduct = Product & {
  reason?: string;
  confidence?: number;
};

interface RecommendationBannerProps {
  recommendations: RecommendedProduct[];
  onAddToCart: (product: Product) => void;
  loading: boolean;
}

export const RecommendationBanner = ({ recommendations, onAddToCart, loading }: RecommendationBannerProps) => {
  // --- LOADING STATE (SKELETON) ---
  if (loading) {
    return (
      <div className="py-4 border-t border-dashed border-slate-200 mt-2">
        <div className="flex items-center gap-2 mb-4 text-violet-600">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Analizando compatibilidad...</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-[260px] h-24 bg-slate-50 rounded-xl border border-slate-100 flex items-center p-3 gap-3 shrink-0"
            >
              <Skeleton className="w-16 h-16 rounded-md bg-slate-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-full h-3 bg-slate-200" />
                <Skeleton className="w-2/3 h-3 bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-5 border-t border-dashed border-slate-200 mt-2 -mx-6 px-6 bg-gradient-to-b from-transparent to-slate-50/50">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="bg-violet-100 p-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Completa tu pedido</h3>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] px-2 h-5 bg-violet-50 text-violet-700 border-violet-100 shadow-sm"
        >
          Sugerencias IA
        </Badge>
      </div>

      {/* CARRUSEL HORIZONTAL (SNAP SCROLL) */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
        {recommendations.map((product, index) => (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={product.id}
            className="snap-center shrink-0 w-[85%] sm:w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 p-3 flex gap-3 relative group"
          >
            {/* 1. IMAGEN DEL PRODUCTO */}
            <div className="h-20 w-20 shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 self-center">
              <img
                src={product.processed_image_url || product.original_image_url || product.image_url || "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/business-logos/Package.png"}
                alt={product.name}
                className="h-full w-full object-cover mix-blend-multiply"
                onError={(e) => {
                  e.currentTarget.src = "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/business-logos/Package.png";
                }}
              />
            </div>

            {/* 2. INFO & ACCIONES */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                {/* Badge de Razón (Upselling Psychology) */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 mb-1">
                  {index === 0 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Más vendido
                    </span>
                  ) : (
                    <span className="text-indigo-500 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Relacionado
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2 mb-1">{product.name}</h4>
              </div>

              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium line-through decoration-slate-300">
                    ${((product.price_retail * 1.1) / 100).toFixed(2)} {/* Precio Tachado Falso (Anchor Pricing) */}
                  </span>
                  <span className="text-base font-bold text-slate-900">${(product.price_retail / 100).toFixed(2)}</span>
                </div>

                {/* Touch-friendly button (min 44px touch target) */}
                <Button
                  size="sm"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full p-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white active:scale-95 shadow-sm border border-indigo-100 transition-all touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  title="Agregar recomendación"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Spacer final para que la última tarjeta no quede pegada al borde en móvil */}
        <div className="w-2 shrink-0" />
      </div>
    </div>
  );
};
