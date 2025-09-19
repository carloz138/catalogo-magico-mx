// /src/components/products/ProductModals.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ZoomIn, 
  BookOpen, 
  Palette, 
  ImageIcon, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { Product, getDisplayImageUrl, getProcessingStatus } from '@/types/products';

interface ProductModalsProps {
  showViewModal: boolean;
  setShowViewModal: (show: boolean) => void;
  showCatalogPreview: boolean;
  setShowCatalogPreview: (show: boolean) => void;
  selectedProduct: Product | null;
  selectedProducts: string[];
  products: Product[];
  confirmCreateCatalog: (catalogTitle: string) => void;
}

export const ProductModals: React.FC<ProductModalsProps> = ({
  showViewModal,
  setShowViewModal,
  showCatalogPreview,
  setShowCatalogPreview,
  selectedProduct,
  selectedProducts,
  products,
  confirmCreateCatalog
}) => {
  const [catalogTitle, setCatalogTitle] = useState('');

  // Generar título sugerido cuando se abre el modal
  React.useEffect(() => {
    if (showCatalogPreview && !catalogTitle) {
      const today = new Date().toLocaleDateString('es-MX');
      setCatalogTitle(`Mi Catálogo - ${today}`);
    }
  }, [showCatalogPreview, catalogTitle]);

  return (
    <>
      {/* Modal para ver producto */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZoomIn className="w-5 h-5" />
              {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Detalles completos del producto con imagen y especificaciones
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 overflow-y-auto">
              {/* Imagen principal */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getDisplayImageUrl(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-full h-64 sm:h-80 object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={`${
                    getProcessingStatus(selectedProduct) === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {getProcessingStatus(selectedProduct) === 'completed' ? 'Sin fondo' : 'Con fondo'}
                  </Badge>
                </div>
              </div>

              {/* Información del producto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                    <p className="text-sm">{selectedProduct.name}</p>
                  </div>
                  
                  {selectedProduct.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                      <p className="text-sm">{selectedProduct.description}</p>
                    </div>
                  )}
                  
                  {selectedProduct.category && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Categoría</Label>
                      <p className="text-sm">{selectedProduct.category}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedProduct.price_retail && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Precio Público</Label>
                      <p className="text-sm font-bold text-green-600">
                        ${(selectedProduct.price_retail / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {selectedProduct.price_wholesale && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Precio Mayoreo</Label>
                      <p className="text-sm font-bold text-blue-600">
                        ${(selectedProduct.price_wholesale / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {selectedProduct.brand && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Marca</Label>
                      <p className="text-sm">{selectedProduct.brand}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de preview del catálogo */}
      <Dialog open={showCatalogPreview} onOpenChange={setShowCatalogPreview}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Confirmar Catálogo
            </DialogTitle>
            <DialogDescription>
              Revisa los productos seleccionados antes de crear tu catálogo profesional
            </DialogDescription>
            <p className="text-sm text-gray-600">
              {selectedProducts.length} productos seleccionados para tu catálogo
            </p>
          </DialogHeader>
          
          <CatalogPreviewContent 
            selectedProducts={selectedProducts}
            products={products}
          />

          {/* Campo para título del catálogo */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="catalog-title" className="text-sm font-medium">
              Título del Catálogo
            </Label>
            <Input
              id="catalog-title"
              value={catalogTitle}
              onChange={(e) => setCatalogTitle(e.target.value)}
              placeholder="Ingresa el título de tu catálogo"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Este título aparecerá en tu catálogo PDF y en la lista de catálogos
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCatalogPreview(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!catalogTitle.trim()) {
                  return; // No hacer nada si no hay título
                }
                setShowCatalogPreview(false);
                confirmCreateCatalog(catalogTitle.trim());
                setCatalogTitle(''); // Limpiar el campo
              }}
              disabled={!catalogTitle.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Palette className="h-4 w-4 mr-2" />
              Crear Catálogo ({selectedProducts.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componente interno para el contenido del preview
const CatalogPreviewContent: React.FC<{
  selectedProducts: string[];
  products: Product[];
}> = ({ selectedProducts, products }) => {
  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
  const withBackground = selectedProductsData.filter(p => getProcessingStatus(p) === 'pending');
  const processing = selectedProductsData.filter(p => getProcessingStatus(p) === 'processing');
  const noBackground = selectedProductsData.filter(p => getProcessingStatus(p) === 'completed');

  return (
    <div className="space-y-6 overflow-y-auto">
      {/* Resumen por estados */}
      <div className="grid grid-cols-3 gap-4">
        {withBackground.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3 text-center">
              <ImageIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="font-semibold text-orange-900">{withBackground.length}</div>
              <div className="text-xs text-orange-700">Con fondo original</div>
            </CardContent>
          </Card>
        )}
        
        {processing.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 text-center">
              <Loader2 className="h-6 w-6 text-blue-600 mx-auto mb-2 animate-spin" />
              <div className="font-semibold text-blue-900">{processing.length}</div>
              <div className="text-xs text-blue-700">Quitando fondo</div>
            </CardContent>
          </Card>
        )}
        
        {noBackground.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3 text-center">
              <Sparkles className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold text-green-900">{noBackground.length}</div>
              <div className="text-xs text-green-700">Sin fondo</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info del catálogo */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-purple-900">Tu catálogo incluirá:</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Imágenes originales y sin fondo según disponibilidad</li>
                <li>• Precios y descripciones de todos los productos</li>
                <li>• Diseño profesional totalmente personalizable</li>
                <li>• Formato PDF para imprimir o compartir</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};