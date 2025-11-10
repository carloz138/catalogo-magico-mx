import React from 'react';
// Asumo que usas lucide-react para los iconos
import { Sparkles, Plus } from 'lucide-react'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Product } from '@/types/product'; // Asumo un tipo Product

// Definimos el tipo de producto recomendado que esperamos
type RecommendedProduct = Product & {
  reason: string;
  confidence: number;
};

interface RecommendationBannerProps {
  recommendations: RecommendedProduct[];
  onAddToCart: (product: Product) => void; // Función para agregar al carrito
  loading: boolean;
}

export const RecommendationBanner = ({
  recommendations,
  onAddToCart,
  loading,
}: RecommendationBannerProps) => {

  // --- Estado de Carga ---
  if (loading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-700">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Buscando recomendaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Estado Vacío (No mostrar nada) ---
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // --- Estado con Recomendaciones ---
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">
            Productos recomendados para ti
          </h3>
          <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">IA</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-3 border border-purple-100 hover:border-purple-300 transition-all shadow-sm"
            >
              <div className="flex gap-3">
                {product.processed_image_url && (
                  <img
                    src={product.processed_image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-1 truncate">
                    {product.reason}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-600">
                      {/* Asumiendo que price_retail está en centavos */}
                      ${(product.price_retail / 100).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onAddToCart(product)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
