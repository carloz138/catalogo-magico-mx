import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateAdjustedPrice, formatPrice } from "@/lib/utils/price-calculator";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import { WebTemplateAdapter } from "@/lib/templates/web-css-adapter";
import { useState, useMemo } from "react";
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
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const displayProducts = products.slice(0, 6);

  // 1. Obtener template y generar CSS
  const template = useMemo(
    () => (webTemplateId ? EXPANDED_WEB_TEMPLATES.find((t) => t.id === webTemplateId) : null),
    [webTemplateId],
  );

  const templateCSS = useMemo(
    () => (template ? WebTemplateAdapter.generateWebCSS(template, backgroundPattern) : ""),
    [template, backgroundPattern],
  );

  const getGridColumns = () => {
    if (!template) return "grid-cols-2";

    switch (viewMode) {
      case "mobile":
        return template.config.columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";
      case "tablet":
        return "grid-cols-2";
      case "desktop":
        // Mapeo seguro de columnas
        const cols = template.config.columnsDesktop;
        if (cols === 3) return "grid-cols-3";
        if (cols === 4) return "grid-cols-4";
        if (cols === 5) return "grid-cols-5";
        return "grid-cols-2";
    }
  };

  // 2. Corrección de Precios: Usar la clase .catalog-product-price y quitar text-primary
  const getPriceDisplay = (product: Product) => {
    const { display, adjustmentMenudeo, adjustmentMayoreo } = priceConfig;

    const menudeoPrice = calculateAdjustedPrice(product.price_retail / 100, adjustmentMenudeo);
    const mayoreoPrice = product.price_wholesale
      ? calculateAdjustedPrice(product.price_wholesale / 100, adjustmentMayoreo)
      : null;

    // NOTA: Quitamos 'text-primary' y usamos 'catalog-product-price' para que el CSS inyectado funcione
    switch (display) {
      case "menudeo_only":
        return <div className="catalog-product-price text-xl font-bold">{formatPrice(menudeoPrice)}</div>;
      case "mayoreo_only":
        return (
          <div className="catalog-product-price text-xl font-bold">
            {mayoreoPrice ? formatPrice(mayoreoPrice) : formatPrice(menudeoPrice)}
          </div>
        );
      case "both":
        return (
          <div className="space-y-1">
            <div className="catalog-product-price text-xl font-bold">{formatPrice(menudeoPrice)}</div>
            {mayoreoPrice && (
              <div className="text-sm text-muted-foreground font-medium">Mayoreo: {formatPrice(mayoreoPrice)}</div>
            )}
          </div>
        );
    }
  };

  return (
    <Card className="sticky top-8 shadow-md border-muted">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Vista Previa en Vivo</CardTitle>
          </div>

          {/* Selector de vista */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <Button
              variant={viewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
              className="h-8 w-8 p-0"
              title="Vista Desktop"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "tablet" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tablet")}
              className="h-8 w-8 p-0"
              title="Vista Tablet"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
              className="h-8 w-8 p-0"
              title="Vista Móvil"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardDescription>
          {template ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-normal">
                {template.name}
              </Badge>
              {template.isPremium && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                  Premium
                </Badge>
              )}
            </div>
          ) : (
            "Selecciona un diseño para previsualizar tu catálogo"
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="bg-gray-100/50 p-4 min-h-[500px] flex items-center justify-center overflow-hidden rounded-b-lg">
        {/* Contenedor simulador de dispositivo */}
        <div
          className={cn(
            "transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden border-4 border-gray-800 flex flex-col",
            viewMode === "mobile" && "w-[375px] h-[667px] rounded-[2rem] border-[8px]",
            viewMode === "tablet" && "w-[768px] h-[1024px] rounded-[1.5rem] border-[8px]",
            viewMode === "desktop" && "w-full aspect-video rounded-lg border-b-[12px] max-h-[600px]",
          )}
        >
          {/* Inyección de CSS dinámico */}
          <style>{templateCSS}</style>

          {/* Estilos extra para el header del preview interno */}
          <style>{`
            .preview-internal-header {
               background: ${
                 template?.colorScheme.gradient
                   ? `linear-gradient(135deg, ${template.colorScheme.gradient.from}, ${template.colorScheme.gradient.to})`
                   : template?.colorScheme.primary || "#000"
               };
               color: ${template?.colorScheme.background === "#ffffff" || template?.colorScheme.background === "#f8fafc" ? "#ffffff" : "#ffffff"};
            }
          `}</style>

          {/* Scroll area interna */}
          <div className="flex-1 overflow-y-auto scrollbar-hide catalog-public-container h-full w-full">
            {/* Header del Catálogo */}
            <div className="preview-internal-header px-4 py-6 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className={cn("font-bold mb-1", viewMode === "mobile" ? "text-xl" : "text-2xl")}>
                  {name || "Tu Catálogo"}
                </h2>
                {description && <p className="opacity-90 text-sm max-w-md mx-auto line-clamp-2">{description}</p>}
              </div>
              {/* Pattern overlay sutil */}
              {backgroundPattern && (
                <div
                  className="absolute inset-0 opacity-10 bg-repeat"
                  style={{ backgroundImage: `url(/patterns/pattern-${backgroundPattern}.png)`, backgroundSize: "50px" }}
                />
              )}
            </div>

            {/* Contenido / Grid */}
            {displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Eye className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Agrega productos para ver cómo lucen</p>
                <p className="text-xs mt-1">Aparecerán aquí con el diseño seleccionado</p>
              </div>
            ) : (
              <div className={cn("grid gap-4 p-4", getGridColumns())}>
                {displayProducts.map((product) => {
                  // Determinar imagen a mostrar
                  const imageUrl =
                    product.catalog_image_url ||
                    product.processed_image_url ||
                    product.thumbnail_image_url ||
                    product.image_url;

                  const imageRatio = template?.config.imageRatio || "square";

                  return (
                    <div key={product.id} className="catalog-product-card group relative flex flex-col overflow-hidden">
                      {/* Imagen */}
                      <div className="relative overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className={cn(
                            "w-full object-cover catalog-product-image",
                            imageRatio === "square" && "aspect-square",
                            imageRatio === "portrait" && "aspect-[3/4]",
                            imageRatio === "landscape" && "aspect-video",
                            imageRatio === "auto" && "aspect-square",
                          )}
                        />

                        {/* Tags (si configurado) */}
                        {visibilityConfig.showTags && product.tags && product.tags.length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {product.tags.slice(0, 2).map((tag, i) => (
                              <span
                                key={i}
                                className="catalog-product-tag text-[10px] px-2 py-0.5 uppercase tracking-wider shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info del Producto */}
                      <div className={cn("flex flex-col flex-1", viewMode === "mobile" ? "p-2" : "p-3")}>
                        <h3
                          className={cn(
                            "catalog-product-name font-medium leading-tight mb-1",
                            viewMode === "mobile" ? "text-xs" : "text-sm",
                          )}
                        >
                          {product.name}
                        </h3>

                        {visibilityConfig.showSku && product.sku && (
                          <p className="text-[10px] text-muted-foreground font-mono mb-1 opacity-70">{product.sku}</p>
                        )}

                        {visibilityConfig.showDescription && product.description && viewMode !== "mobile" && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 opacity-80">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                          {/* Precio (Renderizado con la clase correcta) */}
                          {getPriceDisplay(product)}

                          {/* Botón Simulado */}
                          <div className="catalog-add-button h-6 w-6 rounded-full flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-xs font-bold">+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
