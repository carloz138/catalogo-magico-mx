import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, List, Plus } from 'lucide-react';
import { VariantForm } from './VariantForm';
import { VariantList } from './VariantList';
import { useProductVariants } from '@/hooks/useProductVariants';

interface VariantManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productCategory?: string;
  basePrice?: number;
  basePriceWholesale?: number;
}

export function VariantManagementModal({
  open,
  onOpenChange,
  productId,
  productName,
  productCategory,
  basePrice,
  basePriceWholesale
}: VariantManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  const {
    variants,
    variantTypes,
    loading,
    loadVariants,
    loadVariantTypes,
    createVariant,
    deleteVariant,
    setDefaultVariant
  } = useProductVariants(productId);

  useEffect(() => {
    if (open && productId) {
      loadVariants();
      if (productCategory) {
        loadVariantTypes(productCategory);
      }
    }
  }, [open, productId, productCategory, loadVariants, loadVariantTypes]);

  const handleCreateVariant = async (data: any) => {
    const result = await createVariant(data);
    if (result) {
      setActiveTab('list');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    await deleteVariant(variantId);
  };

  const handleSetDefaultVariant = async (variantId: string) => {
    await setDefaultVariant(variantId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Gestionar variantes
            {variants.length > 0 && (
              <Badge variant="secondary">
                {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {productName}
            {productCategory && (
              <span className="ml-2 text-xs">
                • Categoría: <span className="capitalize">{productCategory}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !productCategory ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Este producto no tiene categoría asignada.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Asigna una categoría para poder crear variantes.
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'create')} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista ({variants.length})
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Plus className="h-4 w-4" />
                Crear nueva
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="list" className="mt-0">
                <VariantList
                  variants={variants}
                  onDelete={handleDeleteVariant}
                  onSetDefault={handleSetDefaultVariant}
                />
              </TabsContent>

              <TabsContent value="create" className="mt-0">
                <VariantForm
                  variantTypes={variantTypes}
                  onSubmit={handleCreateVariant}
                  onCancel={() => setActiveTab('list')}
                  productId={productId}
                  basePrice={basePrice}
                  basePriceWholesale={basePriceWholesale}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
