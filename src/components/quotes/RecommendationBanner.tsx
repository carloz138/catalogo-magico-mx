import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-700">
            <Sparkles className="w-5 h-5 animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium">Buscando recomendaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-purple-900 truncate">Te podría interesar</h3>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 flex-shrink-0">
            IA
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-3 border border-purple-100 hover:border-purple-300 transition-all shadow-sm flex gap-3"
            >
              {/* Imagen: Tamaño fijo y no se encoge */}
              <div className="flex-shrink-0">
                {product.processed_image_url ? (
                  <img
                    src={product.processed_image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded bg-gray-50"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                    Sin img
                  </div>
                )}
              </div>

              {/* Contenido: Se adapta al espacio restante (min-w-0 es CLAVE) */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-1" title={product.reason}>
                    {product.reason}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-sm font-bold text-purple-600 flex-shrink-0">
                    ${(product.price_retail / 100).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs flex-shrink-0"
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
      </CardContent>
    </Card>
  );
};
