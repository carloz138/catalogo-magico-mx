import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Factory, ArrowRight, AlertTriangle } from 'lucide-react';
import { type PendingBackorders } from '@/hooks/useInventoryInterceptor';

interface StockAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingBackorders: PendingBackorders;
  newStockValue: number;
  productName: string;
  onAllocate: () => void;
  onSkip: () => void;
  allocating?: boolean;
}

export function StockAllocationModal({
  open,
  onOpenChange,
  pendingBackorders,
  newStockValue,
  productName,
  onAllocate,
  onSkip,
  allocating = false
}: StockAllocationModalProps) {
  const canFulfillAll = newStockValue >= pendingBackorders.total_quantity;
  const potentialFulfillment = Math.min(newStockValue, pendingBackorders.total_quantity);
  const remainingAfterAllocation = Math.max(0, newStockValue - pendingBackorders.total_quantity);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-full">
              <Factory className="h-5 w-5 text-amber-600" />
            </div>
            <AlertDialogTitle>Pedidos Pendientes Detectados</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tienes <strong>{pendingBackorders.pending_count} pedido(s)</strong> en la cola de producción 
                para <strong>{productName}</strong>.
              </p>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Unidades Solicitadas</p>
                  <p className="text-lg font-bold text-foreground">{pendingBackorders.total_quantity}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Stock Nuevo</p>
                  <p className="text-lg font-bold text-foreground">{newStockValue}</p>
                </div>
              </div>

              {/* Allocation Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Si asignas ahora:
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Pedidos atendidos:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {canFulfillAll ? 'Todos' : `Parcial (${potentialFulfillment} uds)`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-700">Stock restante:</span>
                  <span className="font-medium text-blue-900">{remainingAfterAllocation} unidades</span>
                </div>
              </div>

              {!canFulfillAll && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    El stock nuevo no cubre todos los pedidos. Se asignarán en orden de llegada (FIFO).
                  </span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onSkip}
            disabled={allocating}
            className="sm:flex-1"
          >
            Solo actualizar stock
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onAllocate}
            disabled={allocating}
            className="bg-emerald-600 hover:bg-emerald-700 sm:flex-1"
          >
            {allocating ? (
              'Asignando...'
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Asignar a pedidos
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
