import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus, X, ShoppingCart } from 'lucide-react';
import { calculateAdjustedPrice } from '@/lib/utils/price-calculator';
import { VariantSelector } from './VariantSelector';

interface ProductVariant {
  id: string;
  variant_combination: Record<string, string>;
  sku: string | null;
  price_retail: number;
  price_wholesale: number | null;
  stock_quantity: number;
  is_default: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  processed_image_url: string | null;
  original_image_url: string;
  has_variants?: boolean;
  variants?: ProductVariant[];
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
  onAdd: (quantity: number, priceType: 'retail' | 'wholesale', variantId?: string | null, variantDescription?: string | null) => void;
  catalog: { enable_variants?: boolean };
}

export function AddToQuoteModal({ product, priceConfig, isOpen, onClose, onAdd, catalog }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Resetear la variante seleccionada cuando cambia el producto
  useEffect(() => {
    if (product?.has_variants && product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0];
      setSelectedVariantId(defaultVariant.id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product]);

  const PLACEHOLDER_URL = "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/business-logos/Package.png";

  if (!product) return null;

  const imageUrl = product.processed_image_url || product.original_image_url || PLACEHOLDER_URL;
  
  // Obtener la variante seleccionada si el producto tiene variantes
  const selectedVariant = product.has_variants && product.variants 
    ? product.variants.find(v => v.id === selectedVariantId)
    : null;

  // Usar precios de la variante si existe, sino usar precios del producto base
  const baseRetailPrice = selectedVariant?.price_retail ?? product.price_retail;
  const baseWholesalePrice = selectedVariant?.price_wholesale ?? product.price_wholesale;
  
  const retailPrice = calculateAdjustedPrice(baseRetailPrice, priceConfig.adjustmentMenudeo);
  const wholesalePrice = baseWholesalePrice 
    ? calculateAdjustedPrice(baseWholesalePrice, priceConfig.adjustmentMayoreo)
    : null;

  // Determinar automáticamente el tipo de precio según la cantidad
  const wholesaleMinQty = product.wholesale_min_qty || 1;
  const priceType: 'retail' | 'wholesale' = 
    wholesalePrice && quantity >= wholesaleMinQty ? 'wholesale' : 'retail';

  const currentPrice = priceType === 'retail' ? retailPrice : (wholesalePrice || retailPrice);
  const subtotal = currentPrice * quantity;

  // Generar descripción de la variante para mostrar en la cotización
  const getVariantDescription = (): string | null => {
    if (!selectedVariant) return null;
    
    return Object.entries(selectedVariant.variant_combination)
      .map(([key, value]) => {
        const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const formattedValue = value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `${formattedKey}: ${formattedValue}`;
      })
      .join(', ');
  };

  const handleAdd = () => {
    onAdd(quantity, priceType, selectedVariantId, getVariantDescription());
    setQuantity(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl p-0 overflow-hidden rounded-2xl md:rounded-3xl border-0 shadow-2xl [&>button]:hidden">
        {/* Single close button - absolute positioned, always visible */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-50 rounded-full bg-background/90 backdrop-blur-sm p-2 shadow-lg hover:bg-background transition-colors border border-border/50"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        {/* Main layout: Column on mobile, Row on desktop */}
        <div className="flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
          
          {/* IMAGE SECTION: Top on mobile, Left on desktop */}
          <div className="relative w-full md:w-1/2 h-56 sm:h-64 md:h-auto bg-muted/30 flex items-center justify-center flex-shrink-0">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-4 md:p-8"
            />
          </div>

          {/* CONTENT SECTION: Bottom on mobile, Right on desktop */}
          <div className="flex-1 flex flex-col w-full md:w-1/2 min-h-0">
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
              {/* Product info */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight pr-8">
                  {product.name}
                </h2>
                {(selectedVariant?.sku || product.sku) && (
                  <p className="text-sm text-muted-foreground">
                    SKU: {selectedVariant?.sku || product.sku}
                  </p>
                )}
              </div>

              {/* Variant selector */}
              {product.has_variants && product.variants && product.variants.length > 0 && catalog.enable_variants && (
                <div className="pt-2">
                  <VariantSelector
                    variants={product.variants}
                    selectedVariantId={selectedVariantId}
                    onVariantChange={setSelectedVariantId}
                  />
                </div>
              )}

              {/* Price info */}
              {priceConfig.display === 'both' && wholesalePrice && (
                <div className="bg-muted/50 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">Precio actual:</Label>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {priceType === 'retail' ? 'Menudeo' : 'Mayoreo'}
                        </span>
                        <span className="font-bold text-lg text-foreground">
                          ${(currentPrice / 100).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {priceType === 'retail' 
                      ? `Mayoreo desde ${wholesaleMinQty} pzas: $${(wholesalePrice / 100).toFixed(2)}`
                      : `Menudeo: $${(retailPrice / 100).toFixed(2)}`
                    }
                  </p>
                </div>
              )}

              {/* Subtotal preview */}
              <div className="flex justify-between items-center py-3 border-y border-border">
                <span className="text-base font-medium text-muted-foreground">Subtotal:</span>
                <span className="text-2xl font-bold text-foreground">
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* STICKY FOOTER: Quantity + Action buttons */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 md:p-5 space-y-4 flex-shrink-0">
              {/* Quantity selector */}
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-foreground whitespace-nowrap">Cantidad</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border border-input rounded-lg px-2 py-2 text-base bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    min="1"
                    style={{ fontSize: '16px' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="h-12 text-base font-medium rounded-full order-2 sm:order-1 sm:flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAdd} 
                  className="h-12 text-base font-medium rounded-full order-1 sm:order-2 flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Agregar al Pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
