import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import type { VariantTypeWithValues, CreateVariantData } from '@/types/variants';
import { formatPrice } from '@/lib/utils/price-calculator';

interface VariantFormProps {
  variantTypes: VariantTypeWithValues[];
  onSubmit: (data: CreateVariantData) => void;
  onCancel: () => void;
  productId: string;
  basePrice?: number;
  basePriceWholesale?: number;
}

export function VariantForm({ 
  variantTypes, 
  onSubmit, 
  onCancel, 
  productId,
  basePrice,
  basePriceWholesale
}: VariantFormProps) {
  const [combination, setCombination] = useState<Record<string, string>>({});
  const [sku, setSku] = useState('');
  const [priceRetail, setPriceRetail] = useState(basePrice || 0);
  const [priceWholesale, setPriceWholesale] = useState(basePriceWholesale || 0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (basePrice) setPriceRetail(basePrice);
    if (basePriceWholesale) setPriceWholesale(basePriceWholesale);
  }, [basePrice, basePriceWholesale]);

  const handleCombinationChange = (variantName: string, value: string) => {
    setCombination(prev => ({
      ...prev,
      [variantName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(combination).length === 0) {
      return;
    }

    onSubmit({
      product_id: productId,
      variant_combination: combination,
      sku: sku || undefined,
      price_retail: priceRetail,
      price_wholesale: priceWholesale,
      stock_quantity: stockQuantity,
      is_default: isDefault
    });
  };

  const removeCombinationItem = (key: string) => {
    setCombination(prev => {
      const newComb = { ...prev };
      delete newComb[key];
      return newComb;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selección de combinación de variantes */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Combinación de variantes</Label>
        
        {variantTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay tipos de variantes disponibles para esta categoría
          </p>
        ) : (
          <div className="space-y-3">
            {variantTypes.map((type) => (
              <div key={type.id} className="space-y-2">
                <Label className="text-sm">
                  {type.display_name}
                  {type.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Select
                  value={combination[type.name] || ''}
                  onValueChange={(value) => handleCombinationChange(type.name, value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={`Selecciona ${type.display_name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {type.variant_values.map((value) => (
                      <SelectItem key={value.id} value={value.value}>
                        <div className="flex items-center gap-2">
                          {value.hex_color && (
                            <div 
                              className="w-4 h-4 rounded-full border" 
                              style={{ backgroundColor: value.hex_color }}
                            />
                          )}
                          <span>{value.display_value || value.value}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {/* Mostrar combinación seleccionada */}
        {Object.keys(combination).length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
            {Object.entries(combination).map(([key, value]) => {
              const type = variantTypes.find(vt => vt.name === key);
              const variantValue = type?.variant_values.find(vv => vv.value === value);
              
              return (
                <Badge key={key} variant="secondary" className="gap-2">
                  {variantValue?.hex_color && (
                    <div 
                      className="w-3 h-3 rounded-full border" 
                      style={{ backgroundColor: variantValue.hex_color }}
                    />
                  )}
                  <span className="font-medium">{type?.display_name}:</span>
                  <span>{variantValue?.display_value || value}</span>
                  <button
                    type="button"
                    onClick={() => removeCombinationItem(key)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* SKU */}
      <div className="space-y-2">
        <Label htmlFor="sku">SKU (opcional)</Label>
        <Input
          id="sku"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU de la variante"
        />
      </div>

      {/* Precios */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_retail">Precio menudeo</Label>
          <Input
            id="price_retail"
            type="number"
            value={priceRetail / 100}
            onChange={(e) => setPriceRetail(Math.round(parseFloat(e.target.value || '0') * 100))}
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            {formatPrice(priceRetail / 100)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_wholesale">Precio mayoreo</Label>
          <Input
            id="price_wholesale"
            type="number"
            value={priceWholesale / 100}
            onChange={(e) => setPriceWholesale(Math.round(parseFloat(e.target.value || '0') * 100))}
            step="0.01"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            {formatPrice(priceWholesale / 100)}
          </p>
        </div>
      </div>

      {/* Stock */}
      <div className="space-y-2">
        <Label htmlFor="stock">Cantidad en stock</Label>
        <Input
          id="stock"
          type="number"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(parseInt(e.target.value || '0'))}
          min="0"
        />
      </div>

      {/* Default */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <Label htmlFor="is_default" className="font-medium">
            Variante predeterminada
          </Label>
          <p className="text-sm text-muted-foreground">
            Esta será la variante que se muestre por defecto
          </p>
        </div>
        <Switch
          id="is_default"
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={Object.keys(combination).length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear variante
        </Button>
      </div>
    </form>
  );
}
