
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface CostCalculatorProps {
  productCount: number;
  creditsPerProduct: number;
  userCredits: number;
  onProcessCatalog: () => void;
  onBuyCredits: () => void;
  processing: boolean;
}

export const CostCalculator = ({
  productCount,
  creditsPerProduct,
  userCredits,
  onProcessCatalog,
  onBuyCredits,
  processing
}: CostCalculatorProps) => {
  const totalCreditsNeeded = productCount * creditsPerProduct;
  const hasEnoughCredits = userCredits >= totalCreditsNeeded;

  if (productCount === 0) return null;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="text-lg">
            <span className="font-semibold">{productCount} productos</span>
            {' × '}
            <span className="font-semibold">{creditsPerProduct} créditos</span>
            {' = '}
            <span className="text-2xl font-bold text-primary">{totalCreditsNeeded} créditos total</span>
          </div>

          <div className="text-sm text-neutral/70">
            Créditos disponibles: <span className="font-semibold">{userCredits}</span>
          </div>

          {!hasEnoughCredits && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Créditos insuficientes</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Necesitas {totalCreditsNeeded - userCredits} créditos adicionales
              </p>
            </div>
          )}

          <div className="space-y-3">
            {hasEnoughCredits ? (
              <Button
                onClick={onProcessCatalog}
                disabled={processing}
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
              >
                {processing 
                  ? 'Procesando...' 
                  : `¡Crear mi catálogo profesional! (${totalCreditsNeeded} créditos)`
                }
              </Button>
            ) : (
              <Button
                onClick={onBuyCredits}
                className="w-full text-lg py-6 bg-secondary hover:bg-secondary/90"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Comprar más créditos
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
