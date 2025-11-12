import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
};

interface RecommendationBannerProps {
  recommendations: RecommendedProduct[];
  onAddToCart: (product: Product) => void;
  loading: boolean;
}

export const RecommendationBanner = ({ recommendations, onAddToCart, loading }: RecommendationBannerProps) => {
  if (loading) {
    // Skeleton de carga horizontal
    return (
      <div className="py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3 text-purple-600">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-medium">Buscando sugerencias...</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="w-40 h-20 bg-gray-50 rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-4 border-t border-gray-100 bg-gradient-to-b from-white to-purple-50/30 -mx-6 px-6">
      {/* Encabezado pequeño y limpio */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">Te podría interesar</h3>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-purple-100 text-purple-700 border-0">
          IA
        </Badge>
      </div>

      {/* Contenedor con Scroll Horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide snap-x">
        {recommendations.map((product) => (
          <div
            key={product.id}
            className="snap-start flex-shrink-0 w-64 bg-white rounded-lg border border-purple-100 shadow-sm p-2 flex gap-3 items-center"
          >
            {/* Imagen Pequeña */}
            <div className="h-12 w-12 flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-100">
              <img
                src={product.processed_image_url || product.image_url || ""}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>

            {/* Info Compacta */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-900 truncate mb-0.5">{product.name}</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700">${(product.price_retail / 100).toFixed(2)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                  onClick={() => onAddToCart(product)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
