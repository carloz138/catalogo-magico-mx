import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Check, Sparkles, Crown, Palette, LayoutGrid, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessInfo } from "@/hooks/useBusinessInfo"; // Importamos el hook del negocio

import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import { getTemplateBlockedMessage, isTemplateAvailable } from "@/lib/web-catalog/template-filters";
import { getUserPlanTier, getPlanFeatures, type PlanTier } from "@/lib/web-catalog/plan-restrictions";
import type { WebCatalogTemplate } from "@/lib/web-catalog/types";

interface WebTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  userPlanId?: string;
  userPlanName?: string;
  productCount?: number;
}

export const WebTemplateSelector: React.FC<WebTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  userPlanId,
  userPlanName,
  productCount = 0,
}) => {
  const [userTier, setUserTier] = useState<PlanTier>("free");
  const [allTemplates, setAllTemplates] = useState<WebCatalogTemplate[]>([]);
  const { businessInfo } = useBusinessInfo(); // Obtenemos colores del negocio

  useEffect(() => {
    const tier = getUserPlanTier(userPlanId, userPlanName);
    setUserTier(tier);
    setAllTemplates(EXPANDED_WEB_TEMPLATES);
  }, [userPlanId, userPlanName]);

  const handleSelectTemplate = (template: WebCatalogTemplate) => {
    if (!isTemplateAvailable(template, userTier)) return;
    onTemplateSelect(template.id);
  };

  // Función para renderizar card (normal o con override de marca)
  const renderTemplateCard = (template: WebCatalogTemplate, useBrandColors = false) => {
    const isLocked = !isTemplateAvailable(template, userTier);
    const isSelected = selectedTemplate === template.id;

    // Si estamos en modo "Tu Marca", mostramos los colores del negocio visualmente
    // Nota: Esto es solo visual para el selector. La lógica real de aplicar los colores
    // se haría en el PublicCatalog si tuviéramos un flag 'use_brand_colors'.
    // Por ahora, esto sirve para que el usuario vea "cómo se vería".
    const displayColors =
      useBrandColors && businessInfo?.primary_color
        ? {
            primary: businessInfo.primary_color,
            background: "#ffffff",
          }
        : template.colorScheme;

    return (
      <Card
        key={`${template.id}-${useBrandColors ? "brand" : "std"}`}
        className={cn(
          "cursor-pointer transition-all group relative overflow-hidden border-2",
          isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/50",
          isLocked && "opacity-80",
        )}
        onClick={() => handleSelectTemplate(template)}
      >
        {/* Image Container con simulación de color */}
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          {template.thumbnail ? (
            <>
              <img
                src={template.thumbnail}
                alt={template.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                  isLocked && "grayscale-[0.5]",
                )}
              />
              {/* Overlay de color si es "Tu Marca" para simular el efecto */}
              {useBrandColors && (
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-60 pointer-events-none"
                  style={{ backgroundColor: displayColors.primary }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-muted-foreground">
              <LayoutGrid className="h-10 w-10 opacity-20" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {template.category === "seasonal" && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 border-none shadow-sm text-[10px]">
                <Crown className="h-3 w-3 mr-1" /> Premium
              </Badge>
            )}
            {useBrandColors && (
              <Badge variant="default" className="bg-white text-black border-none shadow-sm text-[10px]">
                <Paintbrush className="h-3 w-3 mr-1 text-purple-600" /> Tu Marca
              </Badge>
            )}
          </div>

          {/* Locked Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px] text-white p-4 text-center transition-opacity">
              <Lock className="h-8 w-8 mb-2" />
              <span className="font-bold text-sm">Plan {template.category === "seasonal" ? "Pro" : "Básico"}</span>
            </div>
          )}

          {isSelected && (
            <div className="absolute inset-0 bg-primary/10 border-4 border-primary flex items-center justify-center">
              <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg animate-in zoom-in">
                <Check className="h-6 w-6" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-1">
            <h4 className={cn("font-bold text-sm", isLocked ? "text-muted-foreground" : "text-foreground")}>
              {template.name}
            </h4>
            {/* Muestra de colores */}
            <div className="flex gap-1">
              <div
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ background: displayColors.primary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ background: displayColors.background }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-tight">{template.description}</p>

          {isLocked && (
            <p className="text-[10px] text-amber-600 font-medium mt-2 flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              {getTemplateBlockedMessage(template, userTier)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Agrupar templates
  const standardTemplates = allTemplates.filter((t) => t.category !== "seasonal");
  const premiumTemplates = allTemplates.filter((t) => t.category === "seasonal");

  // Detectar si puede usar "Tu Marca" (Asumimos Pro/Enterprise)
  const canUseBrandColors = ["professional", "enterprise"].includes(userTier);
  const hasBrandColors = !!businessInfo?.primary_color;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="font-semibold text-lg">Diseño de tu Catálogo</h3>
            <p className="text-sm text-muted-foreground">Elige el estilo que mejor se adapte a tus productos</p>
          </div>
          <TabsList className="flex-wrap h-auto p-1">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="brand" className="flex items-center gap-1">
              <Palette className="h-3 w-3" /> Tu Marca
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-1">
              <Crown className="h-3 w-3" /> Premium
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB: TODOS */}
        <TabsContent value="all" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTemplates.map((t) => renderTemplateCard(t))}
          </div>
        </TabsContent>

        {/* TAB: TU MARCA (Feature Solicitada) */}
        <TabsContent value="brand" className="mt-0">
          {!canUseBrandColors ? (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                La personalización con colores de marca requiere Plan Profesional.
              </AlertDescription>
            </Alert>
          ) : !hasBrandColors ? (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Paintbrush className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Configura los colores de tu negocio en "Perfil" para ver estos diseños adaptados a tu marca.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full shadow-sm border-2 border-white"
                style={{ backgroundColor: businessInfo.primary_color || "#000" }}
              />
              <div>
                <p className="text-sm font-medium text-purple-900">Adaptados a tu marca</p>
                <p className="text-xs text-purple-700">Viendo diseños con tus colores corporativos</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Mostramos una selección de los mejores templates adaptables */}
            {allTemplates
              .filter((t) => ["basic-catalog-free", "modern-grid-clean", "brand-minimal-clean"].includes(t.id))
              .map((t) => renderTemplateCard(t, true))}
          </div>
        </TabsContent>

        {/* TAB: PREMIUM */}
        <TabsContent value="premium" className="mt-0">
          {!["professional", "enterprise"].includes(userTier) && (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <Crown className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Estos diseños de alto impacto requieren Plan Profesional o superior.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumTemplates.map((t) => renderTemplateCard(t))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebTemplateSelector;
