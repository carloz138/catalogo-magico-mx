import { useState } from "react";
import { ConsolidatedOrderItem } from "@/types/consolidated-order";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductConsolidationRowProps {
  item: ConsolidatedOrderItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
}

export function ProductConsolidationRow({
  item,
  onUpdateQuantity,
  onRemove,
  disabled,
}: ProductConsolidationRowProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  const handleQuantityBlur = () => {
    if (quantity !== item.quantity) {
      onUpdateQuantity(item.id, quantity);
    }
  };

  const incrementQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const decrementQuantity = () => {
    if (quantity <= 1) return;
    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleDelete = () => {
    onRemove(item.id);
    setShowDeleteDialog(false);
  };

  const subtotal = quantity * item.unit_price;

  return (
    <>
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        {/* Imagen */}
        {item.product_image_url && (
          <div className="flex-shrink-0">
            <img
              src={item.product_image_url}
              alt={item.product_name}
              className="w-20 h-20 object-cover rounded border border-gray-200"
            />
          </div>
        )}

        {/* Info del producto */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="font-medium text-gray-900">{item.product_name}</h4>
            {item.product_sku && (
              <p className="text-xs text-gray-500 mt-1">SKU: {item.product_sku}</p>
            )}
            {item.variant_description && (
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span>📦</span> {item.variant_description}
              </p>
            )}
          </div>

          {/* Origen */}
          {item.source_quote_ids && item.source_quote_ids.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                De {item.source_quote_ids.length} cotización(es)
              </Badge>
            </div>
          )}

          {/* Precio unitario */}
          <p className="text-sm text-gray-600">
            ${(item.unit_price / 100).toFixed(2)} por unidad
          </p>
        </div>

        {/* Controles de cantidad */}
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
          {/* Cantidad */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={decrementQuantity}
              disabled={disabled || quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              onBlur={handleQuantityBlur}
              disabled={disabled}
              className="w-20 text-center"
            />

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={incrementQuantity}
              disabled={disabled}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              ${(subtotal / 100).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {quantity} × ${(item.unit_price / 100).toFixed(2)}
            </p>
          </div>

          {/* Botón eliminar */}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Quitar
          </Button>
        </div>
      </div>

      {/* Dialog de confirmación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres quitar "{item.product_name}" del pedido consolidado?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
