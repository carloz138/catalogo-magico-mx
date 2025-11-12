import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// 👇 1. NUEVOS IMPORTS (Truck para el envío)
import { Minus, Plus, Trash2, ShoppingCart, Truck } from "lucide-react";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { type Tables } from "@/integrations/supabase/types";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { RecommendationBanner } from "@/components/quotes/RecommendationBanner";
// 👇 2. IMPORTAR PROGRESS
import { Progress } from "@/components/ui/progress";

type Product = Tables<"products">;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: () => void;
  catalogOwnerId: string | null;
  // 👇 3. NUEVA PROP
  freeShippingThreshold: number | null;
}

export function QuoteCartModal({
  isOpen,
  onClose,
  onRequestQuote,
  catalogOwnerId,
  freeShippingThreshold, // 👇 Recibimos la regla
}: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useQuoteCart();

  // --- LÓGICA DE ENVÍO GRATIS ---
  // Calculamos cuánto falta (todo está en centavos)
  const amountLeft = freeShippingThreshold ? Math.max(0, freeShippingThreshold - totalAmount) : 0;
  const progressPercent = freeShippingThreshold ? Math.min(100, (totalAmount / freeShippingThreshold) * 100) : 0;
  const isFreeShipping = freeShippingThreshold && totalAmount >= freeShippingThreshold;

  // --- LÓGICA DE RECOMENDACIONES ---
  const productIdsInCart = items.map((item) => item.product.id);
  const { recommendations, loading: loadingRecommendations } = useProductRecommendations(
    productIdsInCart,
    catalogOwnerId,
  );

  const handleAddToCartFromBanner = (productToAdd: Product) => {
    const defaultPriceType = "retail";
    const defaultVariantId = null;

    const existingItem = items.find(
      (i) => i.product.id === productToAdd.id && i.priceType === defaultPriceType && i.variantId === defaultVariantId,
    );

    const currentQuantity = existingItem?.quantity || 0;

    updateQuantity(productToAdd.id, defaultPriceType, currentQuantity + 1, defaultVariantId);
  };

  // Vista de carrito vacío
  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Tu Cotización</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No has agregado productos</p>
            <p className="text-sm text-muted-foreground mb-6">Explora el catálogo y agrega productos para cotizar</p>
            <Button onClick={onClose}>Explorar productos</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Tu Cotización</SheetTitle>
          <p className="text-sm text-muted-foreground">{items.length} producto(s)</p>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {items.map((item) => {
              const imageUrl = item.product.processed_image_url || item.product.original_image_url;

              return (
                <div
                  key={`${item.product.id}-${item.priceType}-${item.variantId || "default"}`}
                  className="flex gap-3 pb-4 border-b"
                >
                  <img src={imageUrl || undefined} alt={item.product.name} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">{item.product.name}</h4>
                    {item.variantDescription && (
                      <p className="text-xs text-muted-foreground mb-1">{item.variantDescription}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.priceType === "retail" ? "Menudeo" : "Mayoreo"} - ${(item.unitPrice / 100).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(item.product.id, item.priceType, item.quantity - 1, item.variantId)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          updateQuantity(item.product.id, item.priceType, item.quantity + 1, item.variantId)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => removeItem(item.product.id, item.priceType, item.variantId)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-sm font-semibold mt-2">${((item.unitPrice * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-col gap-3 mt-auto border-t pt-4">
          {/* --- 👇 4. BARRA DE PROGRESO DE ENVÍO --- */}
          {freeShippingThreshold !== null && (
            <div className="w-full pb-2">
              {isFreeShipping ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3 text-emerald-700 animate-in fade-in zoom-in duration-300">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">¡Felicidades! Tienes envío gratis 🎉</p>
                    <Progress value={100} className="h-2 mt-2 bg-emerald-200" />
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-sm text-blue-800 mb-2 text-center">
                    Te faltan <strong>${(amountLeft / 100).toFixed(2)}</strong> para envío gratis
                  </p>
                  <Progress value={progressPercent} className="h-2 bg-blue-200" />
                </div>
              )}
            </div>
          )}

          {/* Banner de recomendaciones */}
          <div className="w-full pb-4">
            <RecommendationBanner
              loading={loadingRecommendations}
              recommendations={recommendations}
              onAddToCart={handleAddToCartFromBanner}
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center w-full">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold">${(totalAmount / 100).toFixed(2)}</span>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={clearCart} className="flex-1">
              Vaciar
            </Button>
            <Button onClick={onRequestQuote} className="flex-1">
              Solicitar Cotización
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
