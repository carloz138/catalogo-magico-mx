import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crown, 
  Check, 
  Monitor, 
  Tablet, 
  Smartphone,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebCatalogTemplate } from '@/lib/web-catalog/types';

interface WebTemplatePreviewModalProps {
  template: WebCatalogTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  isLocked: boolean;
  isSelected: boolean;
}

export const WebTemplatePreviewModal: React.FC<WebTemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onSelect,
  isLocked,
  isSelected
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!template) return null;

  const handleSelect = () => {
    if (!isLocked) {
      onSelect(template.id);
      onClose();
    }
  };

  const getViewModeClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto';
      case 'tablet':
        return 'max-w-[768px] mx-auto';
      default:
        return 'w-full';
    }
  };

  // Use preview images or fallback to thumbnail
  const previewImages = template.previewImages || [template.thumbnail];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2 flex items-center gap-2">
                {template.name}
                {template.isPremium && (
                  <Crown className="h-5 w-5 text-amber-500" />
                )}
              </DialogTitle>
              <DialogDescription className="text-base">
                {template.description}
              </DialogDescription>
            </div>
            
            {/* View mode selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="h-8 w-8 p-0"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tablet')}
                className="h-8 w-8 p-0"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="h-8 w-8 p-0"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="capitalize">
              {template.category}
            </Badge>
            <Badge variant="outline">
              {template.layout}
            </Badge>
            <Badge variant="outline">
              {template.style}
            </Badge>
            {template.idealProductCount && (
              <Badge variant="secondary">
                Ideal: {template.idealProductCount.min}-{template.idealProductCount.max} productos
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1">
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="p-6 mt-0">
            <ScrollArea className="h-[50vh]">
              <div className={cn('transition-all', getViewModeClass())}>
                {previewImages.length > 0 ? (
                  <div className="space-y-4">
                    {previewImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg overflow-hidden border bg-muted relative"
                      >
                        <img
                          src={img}
                          alt={`${template.name} preview ${idx + 1}`}
                          className="w-full h-auto"
                        />
                        {isLocked && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center text-white">
                              <Lock className="h-12 w-12 mx-auto mb-3" />
                              <p className="text-lg font-semibold">Template Bloqueado</p>
                              <p className="text-sm opacity-90 mt-1">Actualiza tu plan para acceder</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                    <p>No hay vista previa disponible</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="features" className="p-6 mt-0">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-6">
                {/* Características principales */}
                {template.features && template.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Características Incluidas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {template.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Características PRO */}
                {template.proFeatures && template.proFeatures.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Características Premium
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {template.proFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configuración */}
                <div>
                  <h4 className="font-semibold mb-3">Configuración del Template</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Columnas:</span>
                      <p className="font-medium">{template.config.columnsMobile} móvil / {template.config.columnsDesktop} escritorio</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estilo de tarjeta:</span>
                      <p className="font-medium capitalize">{template.config.cardStyle}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Efecto hover:</span>
                      <p className="font-medium capitalize">{template.config.hoverEffect}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Animaciones:</span>
                      <p className="font-medium capitalize">{template.config.entranceAnimation}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer con acciones */}
        <div className="border-t p-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLocked ? (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Actualiza tu plan para usar este template
              </span>
            ) : isSelected ? (
              <span className="flex items-center gap-2 text-primary font-medium">
                <Check className="h-4 w-4" />
                Template seleccionado
              </span>
            ) : (
              'Haz clic en seleccionar para usar este diseño'
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              onClick={handleSelect}
              disabled={isLocked}
              className={cn(isSelected && 'bg-primary')}
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Bloqueado
                </>
              ) : isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Seleccionado
                </>
              ) : (
                'Seleccionar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebTemplatePreviewModal;
