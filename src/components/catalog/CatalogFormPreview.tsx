import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { calculateAdjustedPrice, formatPrice } from '@/lib/utils/price-calculator';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  image_url: string;
  processed_image_url: string | null;
  tags?: string[] | null;
}

interface PriceConfig {
  display: 'menudeo_only' | 'mayoreo_only' | 'both';
  adjustmentMenudeo: number;
  adjustmentMayoreo: number;
}

interface VisibilityConfig {
  showSku: boolean;
  showTags: boolean;
  showDescription: boolean;
}

interface CatalogFormPreviewProps {
  name: string;
  description?: string;
  products: Product[];
  priceConfig: PriceConfig;
  visibilityConfig: VisibilityConfig;
}

export function CatalogFormPreview({
  name,
  description,
  products,
  priceConfig,
  visibilityConfig,
}: CatalogFormPreviewProps) {
  const displayProducts = products.slice(0, 6);

  const getPriceDisplay = (product: Product) => {
    const { display, adjustmentMenudeo, adjustmentMayoreo } = priceConfig;
    
    const menudeoPrice = calculateAdjustedPrice(product.price_retail, adjustmentMenudeo);
    const mayoreoPrice = product.price_wholesale
      ? calculateAdjustedPrice(product.price_wholesale, adjustmentMayoreo)
      : null;

    switch (display) {
      case 'menudeo_only':
        return (
          <div className="text-lg font-bold text-primary">
            {formatPrice(menudeoPrice)}
          </div>
        );
      case 'mayoreo_only':
        return (
          <div className="text-lg font-bold text-primary">
            {mayoreoPrice ? formatPrice(mayoreoPrice) : formatPrice(menudeoPrice)}
          </div>
        );
      case 'both':
        return (
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">
              {formatPrice(menudeoPrice)}
            </div>
            {mayoreoPrice && (
              <div className="text-sm text-muted-foreground">
                Mayoreo: {formatPrice(mayoreoPrice)}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <CardTitle>Vista Previa</CardTitle>
        </div>
        <CardDescription>
          Así se verá tu catálogo para los clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Header del catálogo */}
        <div className="mb-6 pb-6 border-b">
          <h2 className="text-2xl font-bold mb-2">
            {name || 'Nombre del catálogo'}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Grid de productos */}
        {displayProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Selecciona productos para ver el preview</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayProducts.map((product) => {
              const imageUrl = product.processed_image_url || product.image_url;

              return (
                <div
                  key={product.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {product.name}
                    </h3>

                    {visibilityConfig.showSku && product.sku && (
                      <Badge variant="outline" className="text-xs">
                        {product.sku}
                      </Badge>
                    )}

                    {visibilityConfig.showDescription && product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {visibilityConfig.showTags && product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {getPriceDisplay(product)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {products.length > 6 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            + {products.length - 6} producto{products.length - 6 !== 1 ? 's' : ''} más
          </div>
        )}
      </CardContent>
    </Card>
  );
}
