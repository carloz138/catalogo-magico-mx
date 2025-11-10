import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useQuoteCart } from '@/contexts/QuoteCartContext';

// --- 1. IMPORTS (Corregidos y añadidos) ---
import { type Tables } from '@/integrations/supabase/types'; 
type Product = Tables<'products'>;
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { RecommendationBanner } from '@/components/quotes/RecommendationBanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: () => void;
}

export function QuoteCartModal({ isOpen, onClose, onRequestQuote }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useQuoteCart();

  // --- 2. LLAMAR A LOS HOOKS ---
  const productIdsInCart = items.map(item => item.product.id);
  const { recommendations, loading: loadingRecommendations } = 
    useProductRecommendations(productIdsInCart);

  // --- 3. FUNCIÓN HANDLER ---
  const handleAddToCartFromBanner = (productToAdd: Product) => {
    const defaultPriceType = 'retail';
    const defaultVariantId = null; 
    const existingItem = items.find(i => 
      i.product.id === productToAdd.id && 
      i.priceType === defaultPriceType && 
      i.variantId === defaultVariantId
    );
    const currentQuantity = existingItem?.quantity || 0;
    updateQuantity(productToAdd.id, defaultPriceType, currentQuantity + 1, defaultVariantId);
  };

  // --- VISTA DE CARRITO VACÍO (SIN CAMBIOS) ---
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
            <p className="text-sm text-muted-foreground mb-6">
              Explora el catálogo y agrega productos para cotizar
            </p>
            <Button onClick={onClose}>
              Explorar productos
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // --- VISTA DE CARRITO LLENO (CORREGIDA) ---
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* Este 'flex flex-col' es la clave. 
        ScrollArea (con flex-1) empuja a SheetFooter (con mt-auto) hacia abajo.
      */}
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Tu Cotización</SheetTitle>
          <p className="text-sm text-muted-foreground">{items.length} producto(s)</p>
        </SheetHeader>

        {/* Esta área ahora ocupará todo el espacio (flex-1) */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {items.map((item) => {
             const imageUrl = item.product.processed_image_url || item.product.original_image_url;
              
              return (
              // ... (Tu código de item de carrito - sin cambios) ...
                <div key={`${item.product.id}-${item.priceType}`} className="flex gap-3 pb-4 border-b">
                  <img
                    src={imageUrl || undefined}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                      {item.product.name}
                    </h4>
                    {item.variantDescription && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.variantDescription}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.priceType === 'retail' ? 'Menudeo' : 'Mayoreo'} - 
                      ${(item.unitPrice / 100).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity - 1, item.variantId)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
              _         size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity + 1, item.variantId)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => removeItem(item.product.id, item.priceType, item.variantId)}
                    _ >
                        <Trash2 className="h-3 w-3 text-destructive" />
A                   </Button>
                    </div>
                    <p className="text-sm font-semibold mt-2">
                      ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
A             );
            })}
          </div>
        </ScrollArea>

        {/* --- 👇 4. BANNER MOVIDO DENTRO DEL FOOTER --- */}
        <SheetFooter className="flex-col gap-3 mt-auto border-t pt-4">
          
          {/* El banner de recomendaciones ahora vive aquí */}
          <div className="pb-4">
            <RecommendationBanner 
              loading={loadingRecommendations}
              recommendations={recommendations}
              onAddToCart={handleAddToCartFromBanner}
            />
          </div>

          <div className="flex justify-between items-center w-full">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold">${(totalAmount / 100).toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={clearCart} className="flex-1">
              Vaciar
            </Button>
            <Button onClick={onRequestQuote} className="flex-1">
t              Solicitar Cotización
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
