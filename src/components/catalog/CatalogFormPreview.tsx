import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateAdjustedPrice, formatPrice } from "@/lib/utils/price-calculator";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import { WebTemplateAdapter } from "@/lib/templates/web-css-adapter";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  image_url: string;
  processed_image_url: string | null;
  catalog_image_url?: string | null;
  thumbnail_image_url?: string | null;
  tags?: string[] | null;
}

interface PriceConfig {
  display: "menudeo_only" | "mayoreo_only" | "both";
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
  webTemplateId?: string;
  products: Product[];
  priceConfig: PriceConfig;
  visibilityConfig: VisibilityConfig;
  backgroundPattern?: string | null;
}

export function CatalogFormPreview({
  name,
  description,
  webTemplateId,
  products,
  priceConfig,
  visibilityConfig,
  backgroundPattern,
}: CatalogFormPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const displayProducts = products.slice(0, 6);

  // Obtener template web y generar CSS con el mismo adaptador que usa el catálogo público
  const template = webTemplateId 
    ? EXPANDED_WEB_TEMPLATES.find(t => t.id === webTemplateId)
    : null;

  const templateCSS = template 
    ? WebTemplateAdapter.generateWebCSS(template, backgroundPattern)
    : "";

  const getGridColumns = () => {
    if (!template) return 'grid-cols-2';
    
    switch (viewMode) {
      case 'mobile':
        return template.config.columnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';
      case 'tablet':
        return 'grid-cols-2';
      case 'desktop':
        return template.config.columnsDesktop === 2 ? 'grid-cols-2' :
               template.config.columnsDesktop === 3 ? 'grid-cols-3' :
               template.config.columnsDesktop === 4 ? 'grid-cols-2' : 'grid-cols-2';
    }
  };

  const getPriceDisplay = (product: Product) => {
    const { display, adjustmentMenudeo, adjustmentMayoreo } = priceConfig;

    // Los precios vienen en centavos, dividir por 100
    const menudeoPrice = calculateAdjustedPrice(product.price_retail / 100, adjustmentMenudeo);
    const mayoreoPrice = product.price_wholesale
      ? calculateAdjustedPrice(product.price_wholesale / 100, adjustmentMayoreo)
      : null;

    switch (display) {
      case "menudeo_only":
        return <div className="text-xl font-bold text-primary">{formatPrice(menudeoPrice)}</div>;
      case "mayoreo_only":
        return <div className="text-xl font-bold text-primary">{mayoreoPrice ? formatPrice(mayoreoPrice) : formatPrice(menudeoPrice)}</div>;
      case "both":
        return (
          <div className="space-y-1">
            <div className="text-xl font-bold text-primary">{formatPrice(menudeoPrice)}</div>
            {mayoreoPrice && <div className="text-sm text-muted-foreground">Mayoreo: {formatPrice(mayoreoPrice)}</div>}
          </div>
        );
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <CardTitle>Vista Previa</CardTitle>
          </div>
          
          {/* Selector de vista */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
              className="h-7 w-7 p-0"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tablet')}
              className="h-7 w-7 p-0"
            >
              <Tablet className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
              className="h-7 w-7 p-0"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <CardDescription>
          {template ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span>Previsualizando:</span>
              <Badge variant="outline">{template.name}</Badge>
              <Badge variant="secondary" className="text-xs">
                {template.layout} • {template.style}
              </Badge>
            </div>
          ) : (
            'Selecciona un template para ver el preview'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(
        'transition-all',
        viewMode === 'mobile' && 'max-w-[375px] mx-auto',
        viewMode === 'tablet' && 'max-w-[600px] mx-auto'
      )}>
        {/* Aplicar el mismo CSS que usa el catálogo público */}
        <style>{templateCSS}</style>
        
        {/* Estilos adicionales solo para el header del preview */}
        <style>{`
          .preview-header {
            background: ${template?.colorScheme.gradient 
              ? `linear-gradient(135deg, ${template.colorScheme.gradient.from}, ${template.colorScheme.gradient.to})`
              : template
              ? `linear-gradient(135deg, ${template.colorScheme.primary}, ${template.colorScheme.secondary})`
              : 'linear-gradient(135deg, #3B82F6, #2563EB)'
            };
            color: white;
            padding: 1.5rem 1rem;
            text-align: center;
            border-radius: 0.5rem 0.5rem 0 0;
          }
          
          .preview-container {
            background: ${template?.colorScheme.background || '#f8fafc'};
            border-radius: 0.5rem;
            overflow: hidden;
            position: relative;
          }
        `}</style>

        <div className="catalog-public-container preview-container">
          {/* Header del catálogo */}
          <div className="preview-header">
            <h2 className={cn(
              "font-bold mb-2",
              viewMode === 'mobile' ? 'text-xl' : 'text-2xl'
            )}>
              {name || "Nombre del catálogo"}
            </h2>
            {description && (
              <p className={cn(
                "opacity-90",
                viewMode === 'mobile' ? 'text-xs' : 'text-sm'
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Grid de productos */}
          {displayProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/50">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Selecciona productos para ver el preview</p>
            </div>
          ) : (
            <div className={cn(
              'grid gap-4 p-4',
              getGridColumns()
            )}>
              {displayProducts.map((product) => {
                // Prioridad de imágenes: catalog > processed > thumbnail > original
                const imageUrl = product.catalog_image_url || 
                                product.processed_image_url || 
                                product.thumbnail_image_url || 
                                product.image_url;
                const imageRatio = template?.config.imageRatio || 'square';

                return (
                  <div key={product.id} className="catalog-product-card border overflow-hidden">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className={cn(
                          'w-full h-full object-cover',
                          imageRatio === 'square' && 'aspect-square',
                          imageRatio === 'portrait' && 'aspect-[3/4]',
                          imageRatio === 'landscape' && 'aspect-video',
                          imageRatio === 'auto' && 'aspect-square'
                        )}
                      />
                    </div>
                    <div className={cn(
                      'space-y-2',
                      viewMode === 'mobile' ? 'p-2' : 'p-4'
                    )}>
                      <h3 className={cn(
                        'catalog-product-name font-semibold line-clamp-2',
                        viewMode === 'mobile' ? 'text-sm' : 'text-lg'
                      )}>
                        {product.name}
                      </h3>

                      {visibilityConfig.showSku && product.sku && (
                        <Badge variant="outline" className="text-xs">
                          SKU: {product.sku}
                        </Badge>
                      )}

                      {visibilityConfig.showDescription && product.description && viewMode !== 'mobile' && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      )}

                      {visibilityConfig.showTags && product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {product.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="catalog-product-tag text-xs px-2.5 py-1 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="catalog-product-price">
                        {getPriceDisplay(product)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {products.length > 6 && (
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30">
              + {products.length - 6} producto{products.length - 6 !== 1 ? "s" : ""} más
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
