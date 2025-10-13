import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { calculateAdjustedPrice } from '@/lib/utils/price-calculator';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  processed_image_url: string | null;
  original_image_url: string;
  tags: string[] | null;
}

interface Props {
  product: Product;
  priceConfig: {
    display: 'menudeo_only' | 'mayoreo_only' | 'both';
    adjustmentMenudeo: number;
    adjustmentMayoreo: number;
  };
  visibilityConfig: {
    showSku: boolean;
    showTags: boolean;
    showDescription: boolean;
  };
  onAddToQuote: () => void;
}

export function PublicProductCard({ product, priceConfig, visibilityConfig, onAddToQuote }: Props) {
  const imageUrl = product.processed_image_url || product.original_image_url;
  
  const retailPrice = calculateAdjustedPrice(product.price_retail, priceConfig.adjustmentMenudeo);
  const wholesalePrice = product.price_wholesale 
    ? calculateAdjustedPrice(product.price_wholesale, priceConfig.adjustmentMayoreo)
    : null;

  return (
    <div className="catalog-product-card group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-4 space-y-3">
        <h3 className="catalog-product-name font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>
        
        {visibilityConfig.showSku && product.sku && (
          <Badge variant="outline" className="text-xs">
            SKU: {product.sku}
          </Badge>
        )}
        
        {visibilityConfig.showDescription && product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        
        {visibilityConfig.showTags && product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="catalog-product-tag text-xs px-2.5 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="catalog-product-tag text-xs px-2.5 py-1 rounded-full font-medium">
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          {priceConfig.display === 'both' ? (
            <>
              <div className="catalog-product-price text-xl font-bold text-primary">
                ${(retailPrice / 100).toFixed(2)}
              </div>
              {wholesalePrice && (
                <div className="text-sm text-muted-foreground">
                  Mayoreo: ${(wholesalePrice / 100).toFixed(2)}
                </div>
              )}
            </>
          ) : priceConfig.display === 'menudeo_only' ? (
            <div className="catalog-product-price text-xl font-bold text-primary">
              ${(retailPrice / 100).toFixed(2)}
            </div>
          ) : (
            <div className="catalog-product-price text-xl font-bold text-primary">
              ${((wholesalePrice || retailPrice) / 100).toFixed(2)}
            </div>
          )}
        </div>
        
        <Button 
          onClick={onAddToQuote}
          className="w-full catalog-add-button"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Agregar a cotización
        </Button>
      </div>
    </div>
  );
}
