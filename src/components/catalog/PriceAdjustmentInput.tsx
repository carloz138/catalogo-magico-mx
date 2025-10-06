import { Input } from '@/components/ui/input';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { calculateAdjustedPrice, formatPrice } from '@/lib/utils/price-calculator';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface PriceAdjustmentInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  basePrice?: number;
}

export function PriceAdjustmentInput({
  label,
  value,
  onChange,
  basePrice = 100,
}: PriceAdjustmentInputProps) {
  const adjustedPrice = calculateAdjustedPrice(basePrice, value);
  const isDiscount = value < 0;
  const isIncrease = value > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value) || 0;
    onChange(numValue);
  };

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          step="1"
          min="-90"
          max="100"
          className="pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          %
        </span>
      </div>

      <FormDescription>
        Usa números negativos para descuentos (Ej: -10 = 10% descuento)
      </FormDescription>

      {value !== 0 && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md ${
            isDiscount
              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
              : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
          }`}
        >
          {isDiscount ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {formatPrice(basePrice)} → {formatPrice(adjustedPrice)}
            {isDiscount && (
              <span className="ml-2">
                ({Math.abs(value)}% descuento)
              </span>
            )}
            {isIncrease && (
              <span className="ml-2">
                (+{value}% incremento)
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
