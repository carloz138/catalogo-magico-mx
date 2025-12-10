import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Factory, 
  Package, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useProductionQueue, type ProductionQueueItem } from '@/hooks/useProductionQueue';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PLACEHOLDER_IMAGE = "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/business-logos/Package.png";

export function ProductionQueue() {
  const { 
    queueItems, 
    loading, 
    marking, 
    loadQueue, 
    markBatchAsReady,
    totalPendingItems,
    totalPendingUnits 
  } = useProductionQueue();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItem = (productKey: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(productKey)) {
        next.delete(productKey);
      } else {
        next.add(productKey);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === queueItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(queueItems.map(item => `${item.product_id}-${item.variant_id || 'base'}`)));
    }
  };

  const getItemKey = (item: ProductionQueueItem) => `${item.product_id}-${item.variant_id || 'base'}`;

  const handleMarkBatchReady = async () => {
    // Collect all quote_item_ids from selected items
    const allQuoteItemIds = queueItems
      .filter(item => selectedItems.has(getItemKey(item)))
      .flatMap(item => item.quote_item_ids);
    
    if (allQuoteItemIds.length === 0) return;
    
    const success = await markBatchAsReady(allQuoteItemIds);
    if (success) {
      setSelectedItems(new Set());
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-amber-600" />
            Cola de Producción
          </CardTitle>
          <CardDescription className="mt-1.5">
            Pedidos bajo demanda esperando fabricación
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {totalPendingItems} productos · {totalPendingUnits} unidades
          </Badge>
          <Button variant="ghost" size="icon" onClick={loadQueue} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {queueItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-emerald-50 p-4 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">¡Cola vacía!</h3>
            <p className="text-muted-foreground text-sm max-w-xs mt-1">
              No tienes pedidos pendientes de fabricación. Todos los productos están en stock o ya fueron enviados.
            </p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={selectedItems.size === queueItems.length && queueItems.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size > 0 
                    ? `${selectedItems.size} seleccionado(s)` 
                    : 'Seleccionar todo'}
                </span>
              </div>
              <Button 
                onClick={handleMarkBatchReady}
                disabled={selectedItems.size === 0 || marking}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {marking ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Marcar como Listo
              </Button>
            </div>

            {/* Queue Items */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {queueItems.map((item) => {
                  const itemKey = getItemKey(item);
                  const isSelected = selectedItems.has(itemKey);
                  
                  return (
                    <div 
                      key={itemKey}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                      }`}
                      onClick={() => toggleItem(itemKey)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleItem(itemKey)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="h-14 w-14 rounded-lg bg-background border overflow-hidden shrink-0">
                        <img 
                          src={item.product_image_url || PLACEHOLDER_IMAGE}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">{item.product_name}</h4>
                            {item.variant_description && (
                              <p className="text-xs text-muted-foreground">{item.variant_description}</p>
                            )}
                            {item.product_sku && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                SKU: {item.product_sku}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <Package className="h-3 w-3 mr-1" />
                              {item.total_quantity} uds
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.order_count} pedido(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Desde hace {formatDistanceToNow(new Date(item.oldest_order_date), { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
