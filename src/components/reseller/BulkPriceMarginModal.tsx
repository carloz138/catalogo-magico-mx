import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Percent, DollarSign } from "lucide-react";

interface BulkPriceMarginModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (margin: number, applyTo: "all" | "in_stock" | "out_of_stock") => void;
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
}

export function BulkPriceMarginModal({
  open,
  onClose,
  onApply,
  totalProducts,
  inStockCount,
  outOfStockCount,
}: BulkPriceMarginModalProps) {
  const [selectedMargin, setSelectedMargin] = useState<number | null>(10);
  const [customMargin, setCustomMargin] = useState("");
  const [applyTo, setApplyTo] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [marginType, setMarginType] = useState<"preset" | "custom">("preset");

  const presetMargins = [10, 15, 20, 25, 30];

  const handleApply = () => {
    const margin = marginType === "preset" ? selectedMargin : parseFloat(customMargin);

    if (!margin || margin <= 0 || margin > 200) {
      alert("Por favor ingresa un margen válido (1-200%)");
      return;
    }

    onApply(margin, applyTo);
    onClose();
  };

  const getAffectedCount = () => {
    switch (applyTo) {
      case "all":
        return totalProducts;
      case "in_stock":
        return inStockCount;
      case "out_of_stock":
        return outOfStockCount;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-600" />
            Aplicar Margen Global
          </DialogTitle>
          <DialogDescription>
            Aumenta el precio de múltiples productos a la vez
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Margen */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Selecciona el margen</Label>

            <RadioGroup
              value={marginType}
              onValueChange={(value) => setMarginType(value as "preset" | "custom")}
            >
              <div className="space-y-3">
                {/* Preset Margins */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preset" id="preset" />
                  <Label htmlFor="preset" className="font-normal cursor-pointer">
                    Porcentajes predefinidos
                  </Label>
                </div>

                {marginType === "preset" && (
                  <div className="ml-6 flex flex-wrap gap-2">
                    {presetMargins.map((margin) => (
                      <Button
                        key={margin}
                        variant={selectedMargin === margin ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMargin(margin)}
                        className={
                          selectedMargin === margin
                            ? "bg-purple-600 hover:bg-purple-700"
                            : ""
                        }
                      >
                        +{margin}%
                      </Button>
                    ))}
                  </div>
                )}

                {/* Custom Margin */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-normal cursor-pointer">
                    Porcentaje personalizado
                  </Label>
                </div>

                {marginType === "custom" && (
                  <div className="ml-6">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Ej: 18"
                        min="1"
                        max="200"
                        value={customMargin}
                        onChange={(e) => setCustomMargin(e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ingresa un valor entre 1% y 200%
                    </p>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Aplicar a */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Aplicar a:</Label>

            <RadioGroup value={applyTo} onValueChange={(value) => setApplyTo(value as any)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal cursor-pointer flex-1">
                    Todos los productos ({totalProducts})
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_stock" id="in_stock" />
                  <Label htmlFor="in_stock" className="font-normal cursor-pointer flex-1">
                    Solo productos "Disponibles" ({inStockCount})
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="out_of_stock" id="out_of_stock" />
                  <Label htmlFor="out_of_stock" className="font-normal cursor-pointer flex-1">
                    Solo productos "Bajo Pedido" ({outOfStockCount})
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Vista previa:</strong> Se aumentará el precio de{" "}
              <strong>{getAffectedCount()} productos</strong> en un{" "}
              <strong>
                {marginType === "preset" ? selectedMargin : customMargin || "0"}%
              </strong>
              .
              <br />
              <span className="text-sm">
                Ejemplo: Precio $100 → ${((100 * (1 + (marginType === "preset" ? (selectedMargin || 0) : (parseFloat(customMargin) || 0)) / 100))).toFixed(2)}
              </span>
            </AlertDescription>
          </Alert>

          {/* Advertencia */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900 text-sm">
              Este cambio se aplicará sobre los <strong>precios originales</strong> del
              fabricante, no sobre tus precios actuales.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={marginType === "custom" && !customMargin}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Aplicar Margen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
