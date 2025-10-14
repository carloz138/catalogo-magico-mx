import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ProductVariant {
  id: string;
  variant_combination: Record<string, string>;
  sku: string | null;
  price_retail: number;
  price_wholesale: number | null;
  stock_quantity: number;
  is_default: boolean;
}

interface Props {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onVariantChange: (variantId: string) => void;
}

export function VariantSelector({ variants, selectedVariantId, onVariantChange }: Props) {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Función para formatear la combinación de variantes
  const formatVariantCombination = (combination: Record<string, string>) => {
    return Object.entries(combination)
      .map(([key, value]) => {
        // Formatear el nombre del atributo
        const formattedKey = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Formatear el valor
        const formattedValue = value
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return `${formattedKey}: ${formattedValue}`;
      })
      .join(', ');
  };

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || variants[0];

  return (
    <div className="space-y-3">
      <Label>Selecciona una variante</Label>
      
      <Select 
        value={selectedVariantId || variants[0]?.id} 
        onValueChange={onVariantChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedVariant && formatVariantCombination(selectedVariant.variant_combination)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {variants.map((variant) => (
            <SelectItem key={variant.id} value={variant.id}>
              <div className="flex items-center justify-between gap-4 w-full">
                <span>{formatVariantCombination(variant.variant_combination)}</span>
                {variant.sku && (
                  <Badge variant="outline" className="text-xs ml-2">
                    {variant.sku}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVariant && selectedVariant.stock_quantity !== undefined && (
        <p className="text-sm text-muted-foreground">
          {selectedVariant.stock_quantity > 0 ? (
            <>Disponible: <strong>{selectedVariant.stock_quantity}</strong> unidades</>
          ) : (
            <span className="text-destructive">Sin stock</span>
          )}
        </p>
      )}
    </div>
  );
}
