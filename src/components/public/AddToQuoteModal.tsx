import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { calculateAdjustedPrice } from '@/lib/utils/price-calculator';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  processed_image_url: string | null;
  original_image_url: string;
}

interface Props {
  product: Product | null;
  priceConfig: {
    display: 'menudeo_only' | 'mayoreo_only' | 'both';
    adjustmentMenudeo: number;
    adjustmentMayoreo: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onAdd: (quantity: number, priceType: 'retail' | 'wholesale') => void;
}

export function AddToQuoteModal({ product, priceConfig, isOpen, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const imageUrl = product.processed_image_url || product.original_image_url;
  
  const retailPrice = calculateAdjustedPrice(product.price_retail, priceConfig.adjustmentMenudeo);
  const wholesalePrice = product.price_wholesale 
    ? calculateAdjustedPrice(product.price_wholesale, priceConfig.adjustmentMayoreo)
    : null;

  // Determinar automáticamente el tipo de precio según la cantidad
  const wholesaleMinQty = product.wholesale_min_qty || 1;
  const priceType: 'retail' | 'wholesale' = 
    wholesalePrice && quantity >= wholesaleMinQty ? 'wholesale' : 'retail';

  const currentPrice = priceType === 'retail' ? retailPrice : (wholesalePrice || retailPrice);
  const subtotal = currentPrice * quantity;

  const handleAdd = () => {
    onAdd(quantity, priceType);
    setQuantity(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar a cotización</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h4 className="font-semibold">{product.name}</h4>
              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>
          </div>

          {priceConfig.display === 'both' && wholesalePrice && (
            <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Precio actual:</Label>
                <div className="text-right">
                  <div className="font-semibold">
                    {priceType === 'retail' ? 'Menudeo' : 'Mayoreo'} - ${(currentPrice / 100).toFixed(2)}
                  </div>
                  {wholesalePrice && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {priceType === 'retail' 
                        ? `Mayoreo desde ${wholesaleMinQty} pzas: $${(wholesalePrice / 100).toFixed(2)}`
                        : `Menudeo: $${(retailPrice / 100).toFixed(2)}`
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cantidad</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border rounded px-2 py-1"
                min="1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-t">
            <span className="font-semibold">Subtotal:</span>
            <span className="text-2xl font-bold">${(subtotal / 100).toFixed(2)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAdd} className="flex-1">
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
