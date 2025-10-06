import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { calculateAdjustedPrice, formatPrice } from "@/lib/utils/price-calculator";
import { getTemplateById } from "@/lib/templates/industry-templates";

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
  templateId?: string; // ← AGREGADO
  products: Product[];
  priceConfig: PriceConfig;
  visibilityConfig: VisibilityConfig;
}

export function CatalogFormPreview({
  name,
  description,
  templateId, // ← AGREGADO
  products,
  priceConfig,
  visibilityConfig,
}: CatalogFormPreviewProps) {
  const displayProducts = products.slice(0, 6);

  // ← OBTENER TEMPLATE
  const template = templateId ? getTemplateById(templateId) : null;

  // ← GENERAR ESTILOS DINÁMICOS
  const previewStyles = template
    ? ({
        "--preview-primary": template.colors.primary,
        "--preview-secondary": template.colors.secondary,
        "--preview-accent": template.colors.accent,
        "--preview-background": template.colors.background,
        "--preview-card-bg": template.colors.cardBackground || "#ffffff",
        "--preview-border-radius": `${template.design?.borderRadius || 8}px`,
      } as React.CSSProperties)
    : {};

  const getPriceDisplay = (product: Product) => {
    const { display, adjustmentMenudeo, adjustmentMayoreo } = priceConfig;

    const menudeoPrice = calculateAdjustedPrice(product.price_retail, adjustmentMenudeo);
    const mayoreoPrice = product.price_wholesale
      ? calculateAdjustedPrice(product.price_wholesale, adjustmentMayoreo)
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
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <CardTitle>Vista Previa</CardTitle>
        </div>
        <CardDescription className="flex items-center gap-2">
          Así se verá tu catálogo para los clientes
          {template && (
            <Badge variant="outline" className="ml-2">
              {template.displayName}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent style={previewStyles}>
        {/* ← CSS ESPECÍFICO DEL PREVIEW */}
        <style>{`
          .preview-header {
            background: linear-gradient(135deg, var(--preview-primary, #3B82F6), var(--preview-secondary, #2563EB));
            color: white;
            padding: 1rem;
            border-radius: var(--preview-border-radius, 8px);
            margin-bottom: 1.5rem;
          }
          
          .preview-product-card {
            background: var(--preview-card-bg, #ffffff);
            border: 1px solid color-mix(in srgb, var(--preview-accent, #94A3B8) 40%, transparent);
            border-radius: var(--preview-border-radius, 8px);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .preview-product-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .preview-product-name {
            color: var(--preview-primary, #1E40AF);
            font-weight: 600;
          }
          
          .preview-price-badge {
            background: linear-gradient(135deg, var(--preview-secondary, #2563EB), var(--preview-primary, #3B82F6));
            color: white;
            padding: 0.375rem 0.75rem;
            border-radius: calc(var(--preview-border-radius, 8px) / 2);
            font-weight: 700;
            display: inline-block;
            font-size: 1.125rem;
            line-height: 1.75rem;
          }
          
          .preview-tag {
            background: color-mix(in srgb, var(--preview-accent, #94A3B8) 20%, transparent);
            color: var(--preview-accent, #475569);
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
          }
        `}</style>

        {/* Header del catálogo */}
        <div className="preview-header">
          <h2 className="text-2xl font-bold mb-2">{name || "Nombre del catálogo"}</h2>
          {description && <p className="text-sm opacity-90">{description}</p>}
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
                <div key={product.id} className="preview-product-card">
                  <img src={imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
                  <div className="p-3 space-y-2">
                    <h3 className="preview-product-name text-sm line-clamp-2">{product.name}</h3>

                    {visibilityConfig.showSku && product.sku && (
                      <Badge variant="outline" className="text-xs">
                        {product.sku}
                      </Badge>
                    )}

                    {visibilityConfig.showDescription && product.description && (
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
          <div className="mt-4 text-center text-sm text-muted-foreground">
            + {products.length - 6} producto{products.length - 6 !== 1 ? "s" : ""} más
          </div>
        )}
      </CardContent>
    </Card>
  );
}
