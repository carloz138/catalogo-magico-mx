import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useDeletedProducts } from '@/hooks/useDeletedProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DeletedProducts() {
  const { deletedProducts, loading, restoreProduct, permanentlyDeleteProduct } = useDeletedProducts();
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  const handleRestore = (productId: string, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setShowRestoreConfirm(true);
  };

  const handlePermanentDelete = (productId: string, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setShowPermanentDeleteConfirm(true);
  };

  const confirmRestore = async () => {
    await restoreProduct(selectedProductId);
    setShowRestoreConfirm(false);
    setSelectedProductId('');
    setSelectedProductName('');
  };

  const confirmPermanentDelete = async () => {
    await permanentlyDeleteProduct(selectedProductId);
    setShowPermanentDeleteConfirm(false);
    setSelectedProductId('');
    setSelectedProductName('');
  };

  const actions = (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={() => window.history.back()}
      >
        Volver a Productos
      </Button>
    </div>
  );

  return (
    <AppLayout 
        title="Papelera de Productos" 
        subtitle="Administra los productos eliminados"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Información de la papelera */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Productos en papelera</p>
                  <p className="text-sm">
                    Los productos eliminados se conservan por 30 días antes de ser archivados permanentemente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de productos eliminados */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : deletedProducts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  No hay productos en la papelera
                </h3>
                <p className="text-muted-foreground">
                  Los productos que elimines aparecerán aquí y podrás restaurarlos si es necesario.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deletedProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Imagen del producto */}
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                      <img
                        src={product.processed_image_url || product.original_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Información del producto */}
                    <div className="space-y-2">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      
                      <div className="flex items-center justify-between text-sm">
                        {product.sku && (
                          <Badge variant="outline" className="text-xs">
                            {product.sku}
                          </Badge>
                        )}
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Eliminado {formatDistanceToNow(new Date(product.deleted_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(product.id, product.name)}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restaurar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePermanentDelete(product.id, product.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modal de confirmación de restauración */}
        <ConfirmationDialog
          open={showRestoreConfirm}
          onOpenChange={setShowRestoreConfirm}
          title="Restaurar producto"
          description={`¿Estás seguro que quieres restaurar "${selectedProductName}"? El producto volverá a aparecer en tu lista de productos activos.`}
          confirmText="Restaurar"
          cancelText="Cancelar"
          onConfirm={confirmRestore}
        />

        {/* Modal de confirmación de eliminación permanente */}
        <ConfirmationDialog
          open={showPermanentDeleteConfirm}
          onOpenChange={setShowPermanentDeleteConfirm}
          title="Eliminar permanentemente"
          description={`¿Estás seguro que quieres eliminar "${selectedProductName}" para siempre? Esta acción no se puede deshacer.`}
          confirmText="Eliminar para siempre"
          cancelText="Cancelar"
          onConfirm={confirmPermanentDelete}
          variant="destructive"
        />
      </AppLayout>
  );
}