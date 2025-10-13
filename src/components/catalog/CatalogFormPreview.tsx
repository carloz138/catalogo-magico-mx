import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateAdjustedPrice, formatPrice } from "@/lib/utils/price-calculator";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
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

  // Obtener template web
  const template = webTemplateId 
    ? EXPANDED_WEB_TEMPLATES.find(t => t.id === webTemplateId)
    : null;

  // Generar estilos dinámicos del template
  const previewStyles = template
    ? ({
        "--preview-primary": template.colorScheme.primary,
        "--preview-secondary": template.colorScheme.secondary,
        "--preview-accent": template.colorScheme.accent,
        "--preview-background": template.colorScheme.background,
        "--preview-card-bg": template.colorScheme.cardBackground,
        "--preview-text": template.colorScheme.text,
        "--preview-border": template.colorScheme.border,
        "--preview-border-radius": template.config.cardRadius === 'none' ? '0px' : 
                                   template.config.cardRadius === 'sm' ? '4px' :
                                   template.config.cardRadius === 'md' ? '8px' :
                                   template.config.cardRadius === 'lg' ? '12px' : '16px',
      } as React.CSSProperties)
    : {};

  // Generar filtro de color para el patrón de fondo
  const getPatternFilter = () => {
    if (!template || !backgroundPattern) return '';
    
    const primaryColor = template.colorScheme.primary;
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI;
    
    return `
      hue-rotate(${hue}deg) 
      saturate(1.2) 
      brightness(0.95) 
      opacity(0.15)
    `;
  };

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

    const priceClass = template ? "preview-price-badge" : "text-lg font-bold text-primary";

    switch (display) {
      case "menudeo_only":
        return <div className={priceClass}>{formatPrice(menudeoPrice)}</div>;
      case "mayoreo_only":
        return <div className={priceClass}>{mayoreoPrice ? formatPrice(mayoreoPrice) : formatPrice(menudeoPrice)}</div>;
      case "both":
        return (
          <div className="space-y-1">
            <div className={priceClass}>{formatPrice(menudeoPrice)}</div>
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
      <CardContent style={previewStyles} className={cn(
        'transition-all',
        viewMode === 'mobile' && 'max-w-[375px] mx-auto',
        viewMode === 'tablet' && 'max-w-[600px] mx-auto'
      )}>
        {/* CSS específico del preview */}
        <style>{`
          .preview-container {
            background: var(--preview-background, #f8fafc);
            border-radius: var(--preview-border-radius, 8px);
            overflow: hidden;
            ${backgroundPattern ? `
              position: relative;
            ` : ''}
          }
          
          ${backgroundPattern ? `
            .preview-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: url('/src/assets/patterns/pattern-${backgroundPattern}.png');
              background-size: 200px 200px;
              background-repeat: repeat;
              filter: ${getPatternFilter()};
              pointer-events: none;
              z-index: 0;
            }
            
            .preview-header,
            .preview-product-card {
              position: relative;
              z-index: 1;
            }
          ` : ''}
          
          
          .preview-header {
            background: ${template?.colorScheme.gradient 
              ? `linear-gradient(135deg, ${template.colorScheme.gradient.from}, ${template.colorScheme.gradient.to})`
              : `linear-gradient(135deg, var(--preview-primary, #3B82F6), var(--preview-secondary, #2563EB))`
            };
            color: white;
            padding: 1.5rem 1rem;
            text-align: center;
          }
          
          .preview-product-card {
            background: var(--preview-card-bg, #ffffff);
            border: 1px solid var(--preview-border, #e2e8f0);
            border-radius: var(--preview-border-radius, 8px);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            ${template?.config.cardStyle === 'elevated' ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.08);' : ''}
            ${template?.config.cardStyle === 'glass' ? 'backdrop-filter: blur(10px); background: rgba(255,255,255,0.9);' : ''}
          }
          
          .preview-product-card:hover {
            ${template?.config.hoverEffect === 'lift' ? 'transform: translateY(-4px);' : ''}
            ${template?.config.hoverEffect === 'zoom' ? 'transform: scale(1.02);' : ''}
            ${template?.config.hoverEffect === 'glow' ? 'box-shadow: 0 4px 20px rgba(var(--preview-primary), 0.3);' : ''}
          }
          
          .preview-product-name {
            color: var(--preview-primary, #1E40AF);
            font-weight: 600;
          }
          
          .preview-price-badge {
            background: var(--preview-primary, #3B82F6);
            color: white;
            padding: 0.375rem 0.75rem;
            border-radius: calc(var(--preview-border-radius, 8px) / 2);
            font-weight: 700;
            display: inline-block;
            font-size: 1rem;
          }
          
          .preview-tag {
            background: var(--preview-accent, #94A3B8);
            color: white;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
          }
        `}</style>

        <div className="preview-container">
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
                  <div key={product.id} className="preview-product-card">
                    <img 
                      src={imageUrl} 
                      alt={product.name} 
                      className={cn(
                        'w-full object-cover',
                        imageRatio === 'square' && 'aspect-square',
                        imageRatio === 'portrait' && 'aspect-[3/4]',
                        imageRatio === 'landscape' && 'aspect-video',
                        imageRatio === 'auto' && 'aspect-square'
                      )}
                    />
                    <div className={cn(
                      'space-y-2',
                      viewMode === 'mobile' ? 'p-2' : 'p-3'
                    )}>
                      <h3 className={cn(
                        'preview-product-name line-clamp-2',
                        viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                      )}>
                        {product.name}
                      </h3>

                      {visibilityConfig.showSku && product.sku && (
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      )}

                      {visibilityConfig.showDescription && product.description && viewMode !== 'mobile' && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                      )}

                      {visibilityConfig.showTags && product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="preview-tag">
                              {tag}
                            </span>
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
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30">
              + {products.length - 6} producto{products.length - 6 !== 1 ? "s" : ""} más
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
