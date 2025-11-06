import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Send } from 'lucide-react';
import { calculateAdjustedPrice } from '@/lib/utils/price-calculator';
import { VariantSelector } from './VariantSelector';

interface ProductVariant {
  id: string;
  variant_combination: Record<string, string>;
  sku: string | null;
  price_retail: number;
  price_wholesale: number | null;
  stock_quantity: number;
  is_default: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  processed_image_url: string | null;
  original_image_url: string;
  tags: string[] | null;
  has_variants?: boolean;
  variants?: ProductVariant[];
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
    showStock: boolean;
  };
  enableVariants?: boolean;
  purchasedProductIds: string[];
  isReplicatedCatalog: boolean;
  onAddToQuote?: (product: any) => void;
  onRequestSpecialQuote?: (product: any) => void;
}

export function PublicProductCard({ 
  product, 
  priceConfig, 
  visibilityConfig, 
  enableVariants = true, 
  purchasedProductIds,
  isReplicatedCatalog,
  onAddToQuote,
  onRequestSpecialQuote 
}: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Inicializar con la variante por defecto
  useEffect(() => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0];
      setSelectedVariantId(defaultVariant.id);
    }
  }, [product]);

  // Determinar si el producto está en la lista de comprados
  const isPurchased = !isReplicatedCatalog || purchasedProductIds.includes(product.id);

  const imageUrl = product.processed_image_url || product.original_image_url;
  
  // Obtener la variante seleccionada si el producto tiene variantes
  const selectedVariant = product.has_variants && product.variants 
    ? product.variants.find(v => v.id === selectedVariantId)
    : null;

  // Usar precios de la variante si existe, sino usar precios del producto base
  const baseRetailPrice = selectedVariant?.price_retail ?? product.price_retail;
  const baseWholesalePrice = selectedVariant?.price_wholesale ?? product.price_wholesale;
  
  const retailPrice = calculateAdjustedPrice(baseRetailPrice, priceConfig.adjustmentMenudeo);
  const wholesalePrice = baseWholesalePrice 
    ? calculateAdjustedPrice(baseWholesalePrice, priceConfig.adjustmentMayoreo)
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
        
        {/* Badge de estado: Disponible o Bajo Pedido */}
        {isReplicatedCatalog && (
          <div>
            {isPurchased ? (
              <Badge variant="outline" className="border-green-500 text-green-700">
                ✅ Disponible
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                📝 Bajo Pedido
              </Badge>
            )}
          </div>
        )}
        
        {visibilityConfig.showSku && (selectedVariant?.sku || product.sku) && (
          <Badge variant="outline" className="text-xs">
            SKU: {selectedVariant?.sku || product.sku}
          </Badge>
        )}
        
        {visibilityConfig.showDescription && product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Selector de variantes */}
        {product.has_variants && product.variants && product.variants.length > 0 && enableVariants && (
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onVariantChange={setSelectedVariantId}
            showStock={visibilityConfig.showStock}
          />
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
              {wholesalePrice && product.wholesale_min_qty && (
                <div className="text-sm text-muted-foreground">
                  Mayoreo (desde {product.wholesale_min_qty} pzas): ${(wholesalePrice / 100).toFixed(2)}
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
        
        {/* Botón condicional basado en estado de compra */}
      {isPurchased ? (
  onAddToQuote && (
    <Button 
      size="sm"
      onClick={() => {
        // ✅ Formatear descripción de variante
        const variantDescription = selectedVariant 
          ? Object.entries(selectedVariant.variant_combination)
              .map(([key, value]) => {
                const labelMap: Record<string, string> = {
                  'color': 'Color',
                  'color_calzado': 'Color',
                  'color_electronico': 'Color',
                  'color_fiesta': 'Color',
                  'talla_ropa': 'Talla',
                  'talla_calzado': 'Talla',
                  'material': 'Material',
                  'capacidad': 'Capacidad',
                  'tamano': 'Tamaño',
                  'tamano_arreglo': 'Tamaño',
                  'tipo_flor': 'Tipo de Flor'
                };
                const label = labelMap[key] || key;
                return `${label}: ${value}`;
              })
              .join(', ')
          : null;

        // ✅ Determinar SKU (variante o producto)
        const sku = selectedVariant?.sku || product.sku;

        // ✅ Pasar objeto completo con toda la info
        onAddToQuote({
          product: product,
          variantId: selectedVariantId,
          variantDescription: variantDescription,
          sku: sku,
          quantity: 1,
          retailPrice: retailPrice,
          wholesalePrice: wholesalePrice
        });
      }}
      className="w-full catalog-add-button"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Agregar a cotización
    </Button>
  ) : (
          onRequestSpecialQuote && (
            <Button 
              variant="outline"
              size="sm"
              className="w-full border-indigo-500 text-indigo-700 hover:bg-indigo-50"
              onClick={() => onRequestSpecialQuote(product)}
            >
              <Send className="mr-2 h-4 w-4" />
              Solicitar Cotización Especial
            </Button>
          )
        )}
      </div>
    </div>
  );
}
