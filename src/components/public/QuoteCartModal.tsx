import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useQuoteCart } from '@/contexts/QuoteCartContext';

// --- 👇 1. CORRECCIÓN DE IMPORTS ---
// (Asumo que esta es la ruta de tu tipo 'Product')
import { type Tables } from '@/integrations/supabase/types'; 
type Product = Tables<'products'>;
// (Importamos los componentes que creamos)
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { RecommendationBanner } from '@/components/quotes/RecommendationBanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: () => void;
}

export function QuoteCartModal({ isOpen, onClose, onRequestQuote }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useQuoteCart();

  // --- 2. LLAMAR A LOS HOOKS (Deben estar en el top-level de React) ---
  // Obtenemos solo los IDs de los productos que ya están en el carrito
  // Tu hook 'useQuoteCart' ya nos da los 'items'
  const productIdsInCart = items.map(item => item.product.id);
  
  // Llamamos a nuestro hook de recomendaciones (Paso 6)
  const { recommendations, loading: loadingRecommendations } = 
    useProductRecommendations(productIdsInCart);

  // --- 3. AÑADIR FUNCIÓN HANDLER ---
  // Esta función se pasará al banner para manejar el clic de "Agregar"
  const handleAddToCartFromBanner = (productToAdd: Product) => {
    
    // NOTA: Esta lógica asume cómo funciona tu hook 'useQuoteCart'.
    // Asumimos que un producto recomendado se añade con precio 'retail' y sin variante.
    const defaultPriceType = 'retail';
    const defaultVariantId = null; // O 'undefined' si es así como lo manejas

    // Buscamos si este item "default" ya existe en el carrito
    const existingItem = items.find(i => 
      i.product.id === productToAdd.id && 
      i.priceType === defaultPriceType && 
      i.variantId === defaultVariantId
    );
    
    const currentQuantity = existingItem?.quantity || 0;
    
    // Usamos tu función 'updateQuantity' para añadir 1 de este item.
    // (Asumimos que 'updateQuantity' es lo suficientemente inteligente
    // para AÑADIR el item si no lo encuentra con cantidad 0).
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

  // --- VISTA DE CARRITO LLENO (CON INTEGRACIÓN) ---
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Tu Cotización</SheetTitle>
          <p className="text-sm text-muted-foreground">{items.length} producto(s)</p>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
      S     {items.map((item) => {
              // Asegúrate de que 'item.product' tiene el tipo 'Product'
             // Tu hook 'useQuoteCart' debe estar proveyendo el objeto 'product' completo
             const imageUrl = item.product.processed_image_url || item.product.original_image_url;
              
              return (
                <div key={`${item.product.id}-${item.priceType}`} className="flex gap-3 pb-4 border-b">
                  <img
                    src={imageUrl || undefined} // Añadido 'undefined' por si acaso
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                      {item.product.name}
                    </h4>
              _       {item.variantDescription && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.variantDescription}
                      </p>
a                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.priceType === 'retail' ? 'Menudeo' : 'Mayoreo'} - 
                      ${(item.unitPrice / 100).toFixed(2)}
a                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity - 1, item.variantId)}
                      >
                        <Minus className="h-3 w-3" />
Show                   </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
        _             <Button
                        variant="outline"
a                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity + 1, item.variantId)}
            s         >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
s                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => removeItem(item.product.id, item.priceType, item.variantId)}
A                    >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-sm font-semibold mt-2">
                      ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* --- 4. INSERTAR EL BANNER (Paso 7) --- */}
        {/* Lo ponemos fuera del ScrollArea, pero dentro del SheetContent */}
        <div className="my-4 px-6 -mx-6"> {/* El padding negativo/positivo alinea los bordes */}
          <RecommendationBanner 
            loading={loadingRecommendations}
            recommendations={recommendations}
            onAddToCart={handleAddToCartFromBanner}
          />
        </div>

        <SheetFooter className="flex-col gap-3 mt-auto border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold">${(totalAmount / 100).toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={clearCart} className="flex-1">
              Vaciar
            </Button>
            <Button onClick={onRequestQuote} className="flex-1">
a              Solicitar Cotización
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
