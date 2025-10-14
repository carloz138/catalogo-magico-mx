import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Wand2 } from 'lucide-react';
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
  // Estado para selección múltiple: { variantTypeName: [value1, value2, ...] }
  const [multipleSelections, setMultipleSelections] = useState<Record<string, string[]>>({});
  const [sku, setSku] = useState('');
  const [priceRetail, setPriceRetail] = useState(basePrice || 0);
  const [priceWholesale, setPriceWholesale] = useState(basePriceWholesale || 0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isDefault, setIsDefault] = useState(false);
  const [mode, setMode] = useState<'single' | 'multiple'>('multiple');

  useEffect(() => {
    if (basePrice) setPriceRetail(basePrice);
    if (basePriceWholesale) setPriceWholesale(basePriceWholesale);
  }, [basePrice, basePriceWholesale]);

  const handleCheckboxChange = (variantName: string, value: string, checked: boolean) => {
    setMultipleSelections(prev => {
      const current = prev[variantName] || [];
      if (checked) {
        return { ...prev, [variantName]: [...current, value] };
      } else {
        return { ...prev, [variantName]: current.filter(v => v !== value) };
      }
    });
  };

  const removeSelection = (variantName: string, value: string) => {
    setMultipleSelections(prev => {
      const current = prev[variantName] || [];
      return { ...prev, [variantName]: current.filter(v => v !== value) };
    });
  };

  const removeAllForType = (variantName: string) => {
    setMultipleSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[variantName];
      return newSelections;
    });
  };

  // Generar todas las combinaciones posibles
  const generateCombinations = (selections: Record<string, string[]>): Record<string, string>[] => {
    const entries = Object.entries(selections).filter(([_, values]) => values.length > 0);
    if (entries.length === 0) return [];

    const combinations: Record<string, string>[] = [{}];
    
    for (const [variantName, values] of entries) {
      const newCombinations: Record<string, string>[] = [];
      for (const combination of combinations) {
        for (const value of values) {
          newCombinations.push({
            ...combination,
            [variantName]: value
          });
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }
    
    return combinations;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const combinations = generateCombinations(multipleSelections);
    
    if (combinations.length === 0) {
      return;
    }

    // Si solo hay una combinación, crear directamente
    if (combinations.length === 1) {
      onSubmit({
        product_id: productId,
        variant_combination: combinations[0],
        sku: sku || undefined,
        price_retail: priceRetail,
        price_wholesale: priceWholesale,
        stock_quantity: stockQuantity,
        is_default: isDefault
      });
    } else {
      // Crear múltiples variantes
      combinations.forEach((combination, index) => {
        const variantSku = sku ? `${sku}-${index + 1}` : undefined;
        onSubmit({
          product_id: productId,
          variant_combination: combination,
          sku: variantSku,
          price_retail: priceRetail,
          price_wholesale: priceWholesale,
          stock_quantity: stockQuantity,
          is_default: index === 0 && isDefault
        });
      });
    }
  };

  const totalCombinations = generateCombinations(multipleSelections).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Información de modo múltiple */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Modo de creación múltiple
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Selecciona múltiples valores para crear todas las combinaciones automáticamente.
              {totalCombinations > 0 && (
                <span className="font-semibold ml-1">
                  Se crearán {totalCombinations} variantes.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Selección múltiple de variantes */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Selecciona valores de variantes</Label>
        
        {variantTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay tipos de variantes disponibles para esta categoría
          </p>
        ) : (
          <div className="space-y-4">
            {variantTypes.map((type) => {
              const selectedValues = multipleSelections[type.name] || [];
              return (
                <div key={type.id} className="space-y-3 p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {type.display_name}
                      {type.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {selectedValues.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllForType(type.name)}
                        className="h-7 text-xs"
                      >
                        Limpiar ({selectedValues.length})
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {type.variant_values.map((value) => {
                      const isChecked = selectedValues.includes(value.value);
                      return (
                        <div
                          key={value.id}
                          className={`
                            flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                            ${isChecked 
                              ? 'bg-primary/10 border-primary' 
                              : 'bg-background border-border hover:border-primary/50'
                            }
                          `}
                          onClick={() => handleCheckboxChange(type.name, value.value, !isChecked)}
                        >
                          <Checkbox
                            id={`${type.name}-${value.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(type.name, value.value, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <label
                            htmlFor={`${type.name}-${value.value}`}
                            className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                          >
                            {value.hex_color && (
                              <div 
                                className="w-4 h-4 rounded-full border flex-shrink-0" 
                                style={{ backgroundColor: value.hex_color }}
                              />
                            )}
                            <span className="truncate">{value.display_value || value.value}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mostrar selecciones actuales */}
        {Object.keys(multipleSelections).length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selecciones actuales:</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              {Object.entries(multipleSelections).map(([key, values]) => {
                const type = variantTypes.find(vt => vt.name === key);
                if (!values || values.length === 0) return null;
                
                return values.map(value => {
                  const variantValue = type?.variant_values.find(vv => vv.value === value);
                  return (
                    <Badge key={`${key}-${value}`} variant="secondary" className="gap-2">
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
                        onClick={() => removeSelection(key, value)}
                        className="hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                });
              })}
            </div>
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
          disabled={totalCombinations === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          {totalCombinations === 1 
            ? 'Crear 1 variante' 
            : `Crear ${totalCombinations} variantes`
          }
        </Button>
      </div>
    </form>
  );
}
