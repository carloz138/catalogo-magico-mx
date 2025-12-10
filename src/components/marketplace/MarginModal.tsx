import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Calculator, Loader2, Percent } from 'lucide-react';

interface MarginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogName: string;
  onConfirm: (marginPercentage: number) => Promise<void>;
  isLoading?: boolean;
}

export function MarginModal({
  open,
  onOpenChange,
  catalogName,
  onConfirm,
  isLoading = false,
}: MarginModalProps) {
  const [margin, setMargin] = useState(20);

  const examplePrice = 100;
  const calculatedPrice = useMemo(() => {
    return Math.round(examplePrice * (1 + margin / 100));
  }, [margin]);

  const handleConfirm = async () => {
    await onConfirm(margin);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Define tu Ganancia
          </DialogTitle>
          <DialogDescription>
            Establece el margen de ganancia para los productos de{' '}
            <span className="font-medium text-foreground">{catalogName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Margin Input */}
          <div className="space-y-3">
            <Label htmlFor="margin">Porcentaje de Margen</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[margin]}
                onValueChange={([value]) => setMargin(value)}
                min={5}
                max={100}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center gap-1 min-w-[80px]">
                <Input
                  id="margin"
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value) || 0)}
                  min={0}
                  max={200}
                  className="w-16 text-center"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Vista Previa del Cálculo</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Costo del proveedor:</span>
              <span className="font-mono">${examplePrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tu margen ({margin}%):</span>
              <span className="font-mono text-primary">
                +${(calculatedPrice - examplePrice).toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="font-medium">Tu precio de venta:</span>
              <span className="font-mono text-lg font-bold text-primary">
                ${calculatedPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Este margen se aplicará a <strong>todos los productos</strong> del catálogo. Podrás
              ajustar precios individuales después desde tu panel de productos.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando productos...
              </>
            ) : (
              'Confirmar e Importar Productos'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
