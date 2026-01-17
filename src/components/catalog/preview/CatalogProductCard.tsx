import { formatPrice, calculateAdjustedPrice } from "@/lib/utils/price-calculator";
import { cn } from "@/lib/utils";

const PLACEHOLDER_URL = "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/business-logos/Package.png";

interface ProductCardProps {
  product: any;
  priceConfig: {
    display: "menudeo_only" | "mayoreo_only" | "both";
    adjustmentMenudeo: number;
    adjustmentMayoreo: number;
  };
  visibilityConfig: {
    showSku: boolean;
    showDescription: boolean;
  };
  imageRatio: string;
  isMobile: boolean;
}

export function CatalogProductCard({ 
  product, 
  priceConfig, 
  visibilityConfig, 
  imageRatio,
  isMobile 
}: ProductCardProps) {
  
  const imageUrl = product.catalog_image_url || product.processed_image_url || product.image_url || PLACEHOLDER_URL;

  const getPriceDisplay = () => {
    const { display, adjustmentMenudeo, adjustmentMayoreo } = priceConfig;
    const menudeo = calculateAdjustedPrice(product.price_retail / 100, adjustmentMenudeo);
    const mayoreo = product.price_wholesale ? calculateAdjustedPrice(product.price_wholesale / 100, adjustmentMayoreo) : null;
    const minQty = product.wholesale_min_qty;

    if (display === "menudeo_only") return <div className="catalog-product-price text-lg font-bold">{formatPrice(menudeo)}</div>;
    if (display === "mayoreo_only") {
      return (
        <div className="flex flex-col items-start">
          <div className="catalog-product-price text-lg font-bold">{mayoreo ? formatPrice(mayoreo) : formatPrice(menudeo)}</div>
          {mayoreo && minQty && <div className="text-[10px] text-muted-foreground">Min. {minQty} pzas</div>}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-start">
        <div className="catalog-product-price text-lg font-bold">{formatPrice(menudeo)}</div>
        {mayoreo && (
          <div className="text-xs text-muted-foreground font-medium">
            Mayoreo: {formatPrice(mayoreo)}{minQty ? ` (min. ${minQty})` : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="catalog-product-card group relative flex flex-col overflow-hidden bg-white shadow-sm rounded-lg border border-gray-100">
      <div className={cn("relative overflow-hidden bg-gray-50", 
          imageRatio === "square" && "aspect-square",
          imageRatio === "portrait" && "aspect-[3/4]",
          imageRatio === "landscape" && "aspect-video",
          imageRatio === "auto" && "aspect-square"
      )}>
        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className={cn("flex flex-col flex-1 p-3", isMobile && "p-2")}>
        <h3 className={cn("catalog-product-name font-medium leading-tight mb-1 line-clamp-2", isMobile ? "text-xs" : "text-sm")}>
          {product.name}
        </h3>

        {visibilityConfig.showSku && product.sku && (
          <p className="text-[10px] text-gray-400 font-mono mb-1">{product.sku}</p>
        )}

        {visibilityConfig.showDescription && product.description && !isMobile && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 opacity-80">{product.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          {getPriceDisplay()}
          <div className="catalog-add-button h-7 w-7 rounded-full bg-black text-white flex items-center justify-center shadow-sm shrink-0 hover:bg-gray-800 cursor-pointer transition-colors">
            <span className="text-sm font-bold">+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
