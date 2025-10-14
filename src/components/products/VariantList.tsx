import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Star, Package } from 'lucide-react';
import type { ProductVariant } from '@/types/variants';
import { formatPrice } from '@/lib/utils/price-calculator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VariantListProps {
  variants: ProductVariant[];
  onDelete: (variantId: string) => void;
  onSetDefault: (variantId: string) => void;
}

export function VariantList({ variants, onDelete, onSetDefault }: VariantListProps) {
  if (variants.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
        <p className="text-sm font-medium mb-1">No hay variantes</p>
        <p className="text-xs text-muted-foreground">
          Crea la primera variante de este producto
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">
          {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {variants.map((variant) => (
          <Card key={variant.id} className={`p-4 ${variant.is_default ? 'border-primary' : ''}`}>
            <div className="space-y-3">
              {/* Encabezado con combinación */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Combinación de variantes */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(variant.variant_combination).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="text-xs">
                        <span className="font-medium capitalize">{key}:</span>
                        <span className="ml-1">{value}</span>
                      </Badge>
                    ))}
                  </div>

                  {/* SKU si existe */}
                  {variant.sku && (
                    <p className="text-xs text-muted-foreground font-mono">
                      SKU: {variant.sku}
                    </p>
                  )}
                </div>

                {/* Badge de default */}
                {variant.is_default && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3" />
                    Predeterminada
                  </Badge>
                )}
              </div>

              {/* Información de precios */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Menudeo</p>
                  <p className="font-medium">
                    {variant.price_retail ? formatPrice(variant.price_retail / 100) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Mayoreo</p>
                  <p className="font-medium">
                    {variant.price_wholesale ? formatPrice(variant.price_wholesale / 100) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Stock</p>
                  <p className="font-medium">{variant.stock_quantity || 0}</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-2 border-t">
                {!variant.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetDefault(variant.id)}
                    className="flex-1"
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Marcar predeterminada
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className={variant.is_default ? 'flex-1' : ''}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar variante?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La variante se eliminará permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(variant.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
