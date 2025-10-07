import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useQuoteCart } from '@/contexts/QuoteCartContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: () => void;
}

export function QuoteCartModal({ isOpen, onClose, onRequestQuote }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useQuoteCart();

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
                <div key={`${item.product.id}-${item.priceType}`} className="flex gap-3 pb-4 border-b">
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                      {item.product.name}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.priceType === 'retail' ? 'Menudeo' : 'Mayoreo'} - 
                      ${(item.unitPrice / 100).toFixed(2)}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => removeItem(item.product.id, item.priceType)}
                      >
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
              Solicitar Cotización
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
