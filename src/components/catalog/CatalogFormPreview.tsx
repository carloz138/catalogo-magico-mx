import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// 👇 AGREGADO: Package
import { Eye, Monitor, Tablet, Smartphone, ExternalLink, Package } from "lucide-react";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import { WebTemplateAdapter } from "@/lib/templates/web-css-adapter";
import { cn } from "@/lib/utils";
import { CatalogProductCard } from "./preview/CatalogProductCard";

interface CatalogFormPreviewProps {
  name: string;
  description?: string;
  webTemplateId?: string;
  products: any[];
  priceConfig: any;
  visibilityConfig: any;
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
  const displayProducts = products.slice(0, 8); // Mostrar más productos

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
    if (viewMode === "mobile") return template.config.columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";
    return `grid-cols-${Math.min(template.config.columnsDesktop, viewMode === "tablet" ? 3 : 4)}`;
  };

  return (
    <Card className="sticky top-6 shadow-xl border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
      {/* Header de Control */}
      <div className="bg-white border-b p-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-purple-600" />
          <span className="font-semibold text-sm">Vista Previa</span>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          {/* 👇 CORRECCIÓN: Usamos 'secondary' en lugar de 'white' */}
          <Button
            variant={viewMode === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Área de Preview con Scroll */}
      <div className="flex-1 bg-gray-100/50 overflow-y-auto p-4 md:p-8 flex justify-center items-start relative">
        {/* Marco del Dispositivo */}
        <div
          className={cn(
            "bg-white shadow-2xl transition-all duration-500 ease-in-out flex flex-col relative overflow-hidden origin-top",
            viewMode === "mobile" && "w-[375px] min-h-[667px] rounded-[2.5rem] border-[12px] border-gray-900",
            viewMode === "tablet" && "w-[768px] min-h-[1024px] rounded-[1.5rem] border-[12px] border-gray-900",
            viewMode === "desktop" && "w-full min-h-[600px] rounded-lg border border-gray-200 shadow-lg",
          )}
        >
          <style>{templateCSS}</style>

          {/* Contenedor principal con clase para activar estilos del template */}
          <div className="catalog-public-container min-h-full flex flex-col">
            {/* Header Interno del Catálogo */}
            <div className="preview-internal-header py-8 px-6 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h1 className={cn("font-bold mb-2 text-white", viewMode === "mobile" ? "text-2xl" : "text-4xl")}>
                  {name || "Tu Catálogo"}
                </h1>
                {description && <p className="text-white/80 max-w-lg mx-auto text-sm">{description}</p>}
              </div>
              {/* Patrón de fondo sutil */}
              {backgroundPattern && (
                <div
                  className="absolute inset-0 opacity-10 bg-repeat"
                  style={{ backgroundImage: `url(/patterns/${backgroundPattern}.png)` }}
                />
              )}
            </div>

            {/* Grid de Productos */}
            <div className="flex-1 bg-gray-50 p-4 md:p-8">
              {displayProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed rounded-xl">
                  <Package className="h-8 w-8 mb-2 opacity-50" />
                  <p>Agrega productos para verlos aquí</p>
                </div>
              ) : (
                <div className={cn("grid gap-4 md:gap-6", getGridColumns())}>
                  {displayProducts.map((product) => (
                    <CatalogProductCard
                      key={product.id}
                      product={product}
                      priceConfig={priceConfig}
                      visibilityConfig={visibilityConfig}
                      imageRatio={template?.config.imageRatio || "square"}
                      isMobile={viewMode === "mobile"}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
