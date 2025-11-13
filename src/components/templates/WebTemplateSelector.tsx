// src/components/templates/WebTemplateSelector.tsx
// Selector de templates web con restricciones por plan

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Check, Sparkles, Crown, Zap, AlertCircle, Star, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import {
  getAvailableTemplatesForPlan,
  getLockedTemplatesForPlan,
  isTemplateAvailable,
  getTemplateBlockedMessage,
} from "@/lib/web-catalog/template-filters";
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

  useEffect(() => {
    const tier = getUserPlanTier(userPlanId, userPlanName);
    setUserTier(tier);
    setAllTemplates(EXPANDED_WEB_TEMPLATES);
  }, [userPlanId, userPlanName]);

  const handleSelectTemplate = (template: WebCatalogTemplate) => {
    if (!isTemplateAvailable(template, userTier)) return;
    onTemplateSelect(template.id);
  };

  const renderTemplateCard = (template: WebCatalogTemplate) => {
    const isLocked = !isTemplateAvailable(template, userTier);
    const isSelected = selectedTemplate === template.id;

    return (
      <Card
        key={template.id}
        className={cn(
          "cursor-pointer transition-all group relative overflow-hidden border-2",
          isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/50",
          isLocked && "opacity-80",
        )}
        onClick={() => handleSelectTemplate(template)}
      >
        {/* Image Container */}
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          {template.thumbnail ? (
            <img
              src={template.thumbnail}
              alt={template.name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                isLocked && "grayscale-[0.5]",
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-muted-foreground">
              <LayoutGrid className="h-10 w-10 opacity-20" />
            </div>
          )}

          {/* Overlays */}
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

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {template.category === "seasonal" && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 border-none shadow-sm text-[10px]">
                <Crown className="h-3 w-3 mr-1" /> Premium
              </Badge>
            )}
            {(template as any).isNew && (
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 border-none shadow-sm text-[10px]">
                Nuevo
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-1">
            <h4 className={cn("font-bold text-sm", isLocked ? "text-muted-foreground" : "text-foreground")}>
              {template.name}
            </h4>
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
  const basicTemplates = allTemplates.filter((t) => t.category === "basic");
  const standardTemplates = allTemplates.filter((t) => t.category === "standard");
  const premiumTemplates = allTemplates.filter((t) => t.category === "seasonal");

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Diseño de tu Catálogo</h3>
            <p className="text-sm text-muted-foreground">Elige cómo verán tus clientes tus productos</p>
          </div>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="standard" className="hidden sm:inline-flex">
              Estándar
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center gap-1">
              <Crown className="h-3 w-3" /> Premium
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTemplates.map((t) => renderTemplateCard(t))}
          </div>
        </TabsContent>

        <TabsContent value="standard" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...basicTemplates, ...standardTemplates].map((t) => renderTemplateCard(t))}
          </div>
        </TabsContent>

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
