import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, Wand2, Lock, Edit3, AlertTriangle } from 'lucide-react';
import type { VariantTypeWithValues, CreateVariantData } from '@/types/variants';
import { formatPrice } from '@/lib/utils/price-calculator';

// Categories that enforce strict predefined variant values
const STRICT_CATEGORIES = ['ropa', 'calzado'];

// Normalize custom value: trim whitespace, title case
const normalizeCustomValue = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  // Title case: capitalize first letter of each word
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface VariantFormProps {
  variantTypes: VariantTypeWithValues[];
  onSubmit: (data: CreateVariantData) => void;
  onCancel: () => void;
  productId: string;
  productCategory?: string;
  basePrice?: number;
  basePriceWholesale?: number;
}

export function VariantForm({ 
  variantTypes, 
  onSubmit, 
  onCancel, 
  productId,
  productCategory,
  basePrice,
  basePriceWholesale
}: VariantFormProps) {
  // State for multiple selection: { variantTypeName: [value1, value2, ...] }
  const [multipleSelections, setMultipleSelections] = useState<Record<string, string[]>>({});
  // State for custom values in flexible mode: { variantTypeName: "custom value" }
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [sku, setSku] = useState('');
  const [priceRetail, setPriceRetail] = useState(basePrice || 0);
  const [priceWholesale, setPriceWholesale] = useState(basePriceWholesale || 0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isDefault, setIsDefault] = useState(false);

  // Determine if we're in strict mode based on category
  const isStrictMode = useMemo(() => {
    return STRICT_CATEGORIES.includes(productCategory?.toLowerCase() || '');
  }, [productCategory]);

  // Separate variant types into strict (predefined) and flexible (custom-allowed)
  const { strictTypes, flexibleTypes } = useMemo(() => {
    const strict: VariantTypeWithValues[] = [];
    const flexible: VariantTypeWithValues[] = [];
    
    variantTypes.forEach(type => {
      if (type.allow_custom_values) {
        flexible.push(type);
      } else {
        strict.push(type);
      }
    });
    
    return { strictTypes: strict, flexibleTypes: flexible };
  }, [variantTypes]);

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

  const handleCustomValueChange = (variantName: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [variantName]: value }));
  };

  const addCustomValue = (variantName: string) => {
    const rawValue = customValues[variantName] || '';
    const normalized = normalizeCustomValue(rawValue);
    
    if (!normalized) return;
    
    // Check for duplicates (case-insensitive)
    const current = multipleSelections[variantName] || [];
    const isDuplicate = current.some(v => v.toLowerCase() === normalized.toLowerCase());
    
    if (isDuplicate) {
      return; // Silently ignore duplicates
    }
    
    setMultipleSelections(prev => ({
      ...prev,
      [variantName]: [...current, normalized]
    }));
    setCustomValues(prev => ({ ...prev, [variantName]: '' }));
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

  // Generate all possible combinations
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

    // Create single or multiple variants
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

  // Render strict variant type (predefined values only)
  const renderStrictType = (type: VariantTypeWithValues) => {
    const selectedValues = multipleSelections[type.name] || [];
    
    return (
      <div key={type.id} className="space-y-3 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">
              {type.display_name}
              {type.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
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
              <label
                key={value.id}
                htmlFor={`${type.name}-${value.value}`}
                className={`
                  flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                  ${isChecked 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-background border-border hover:border-primary/50'
                  }
                `}
              >
                <Checkbox
                  id={`${type.name}-${value.value}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(type.name, value.value, checked as boolean)
                  }
                />
                <div className="flex items-center gap-2 flex-1 text-sm">
                  {value.hex_color && (
                    <div 
                      className="w-4 h-4 rounded-full border flex-shrink-0" 
                      style={{ backgroundColor: value.hex_color }}
                    />
                  )}
                  <span className="truncate">{value.display_value || value.value}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  // Render flexible variant type (custom values allowed)
  const renderFlexibleType = (type: VariantTypeWithValues) => {
    const selectedValues = multipleSelections[type.name] || [];
    const currentCustomValue = customValues[type.name] || '';
    
    return (
      <div key={type.id} className="space-y-3 p-4 border border-dashed rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-500" />
            <Label className="text-sm font-semibold">
              {type.display_name}
              <span className="text-xs text-muted-foreground ml-2">(personalizable)</span>
            </Label>
          </div>
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
        
        {/* Custom value input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ej: Sabor: Fresa, Voltaje: 110v, Largo: 50cm"
            value={currentCustomValue}
            onChange={(e) => handleCustomValueChange(type.name, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomValue(type.name);
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addCustomValue(type.name)}
            disabled={!currentCustomValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Selected custom values */}
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map(value => (
              <Badge key={value} variant="secondary" className="gap-1">
                {value}
                <button
                  type="button"
                  onClick={() => removeSelection(type.name, value)}
                  className="hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode indicator */}
      <div className={`p-3 border rounded-lg ${isStrictMode ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'}`}>
        <div className="flex items-start gap-2">
          {isStrictMode ? (
            <>
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Modo Estricto: {productCategory}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Las variantes de esta categoría usan valores predefinidos para facilitar filtros.
                </p>
              </div>
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Modo Flexible
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Puedes crear valores personalizados para las especificaciones.
                  {totalCombinations > 0 && (
                    <span className="font-semibold ml-1">
                      Se crearán {totalCombinations} variantes.
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Strict variant types (predefined values) */}
      {strictTypes.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Atributos Estándar
          </Label>
          {strictTypes.map(renderStrictType)}
        </div>
      )}

      {/* Flexible variant types (custom values) */}
      {!isStrictMode && flexibleTypes.length > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Especificaciones Personalizadas
          </Label>
          {flexibleTypes.map(renderFlexibleType)}
        </div>
      )}

      {/* Warning if strict mode but flexible types exist */}
      {isStrictMode && flexibleTypes.length > 0 && (
        <Alert variant="default" className="bg-muted">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Las especificaciones personalizadas no están disponibles para {productCategory}.
            Usa los atributos estándar para mantener consistencia en filtros.
          </AlertDescription>
        </Alert>
      )}

      {/* Show current selections summary */}
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

      {variantTypes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay tipos de variantes disponibles para esta categoría
        </p>
      )}

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

      {/* Prices */}
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

      {/* Buttons */}
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