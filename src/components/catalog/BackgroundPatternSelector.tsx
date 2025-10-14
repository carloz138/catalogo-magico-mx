import React from 'react';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import patternTaco from '@/assets/patterns/pattern-taco.png';
import patternGhost from '@/assets/patterns/pattern-ghost.png';
import patternPumpkin from '@/assets/patterns/pattern-pumpkin.png';
import { EXPANDED_WEB_TEMPLATES } from '@/lib/web-catalog/expanded-templates-catalog';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface BackgroundPatternSelectorProps {
  selectedPattern: string | null;
  onPatternChange: (pattern: string | null) => void;
  webTemplateId?: string;
}

// Lista de patrones disponibles
const AVAILABLE_PATTERNS = [
  { id: 'none', name: 'Sin patrón', preview: null },
  { id: 'taco', name: 'Taco', preview: patternTaco },
  { id: 'ghost', name: 'Fantasma', preview: patternGhost },
  { id: 'pumpkin', name: 'Calabaza', preview: patternPumpkin },
];

export const BackgroundPatternSelector: React.FC<BackgroundPatternSelectorProps> = ({
  selectedPattern,
  onPatternChange,
  webTemplateId,
}) => {
  const { isMobile, isTablet, isDesktop, isUltraWide } = useBreakpoint();

  // Obtener color primario del template seleccionado
  const getPatternFilter = () => {
    if (!webTemplateId) return '';
    
    const template = EXPANDED_WEB_TEMPLATES.find(t => t.id === webTemplateId);
    if (!template) return '';
    
    const primaryColor = template.colorScheme.primary;
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI;
    
    return `hue-rotate(${hue}deg) saturate(1.2) brightness(0.95)`;
  };

  // ✅ GRID COLUMNS RESPONSIVE
  const gridCols = isMobile ? "grid-cols-4" :
                   isTablet ? "grid-cols-5" :
                   isDesktop ? "grid-cols-6" :
                   "grid-cols-8"; // Ultra-wide

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Patrón de fondo</Label>
      
      <p className={cn(
        "text-muted-foreground",
        isMobile ? "text-xs" : "text-xs"
      )}>
        {isMobile 
          ? "Patrón decorativo adaptado al color del template"
          : "Selecciona un patrón decorativo. El color se adaptará al template seleccionado."
        }
      </p>
      
      <div className={cn("grid gap-2", gridCols)}>
        {AVAILABLE_PATTERNS.map((pattern) => (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onPatternChange(pattern.id === 'none' ? null : pattern.id)}
            className={cn(
              "relative flex flex-col items-center rounded-lg border-2 transition-all",
              isMobile && "p-2.5 active:scale-95",
              (isTablet || isDesktop) && "p-2 hover:bg-accent hover:scale-105",
              isUltraWide && "p-3 hover:bg-accent hover:scale-105",
              selectedPattern === (pattern.id === 'none' ? null : pattern.id)
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border hover:border-primary/50"
            )}
            aria-label={`Seleccionar patrón ${pattern.name}`}
            aria-pressed={selectedPattern === (pattern.id === 'none' ? null : pattern.id)}
          >
            <div 
              className={cn(
                "w-full rounded-md flex items-center justify-center overflow-hidden bg-background",
                isMobile && "aspect-square mb-2",
                isTablet && "aspect-square mb-1.5",
                (isDesktop || isUltraWide) && "aspect-square mb-2"
              )}
              style={{
                background: pattern.preview 
                  ? `url(${pattern.preview}) repeat`
                  : 'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%)',
                backgroundSize: pattern.preview 
                  ? (isMobile ? "48px 48px" : isUltraWide ? "56px 56px" : "40px 40px")
                  : "20px 20px",
                backgroundPosition: pattern.preview ? "0 0" : "0 0, 10px 10px",
                filter: pattern.preview && webTemplateId ? getPatternFilter() : 'none',
              }}
            />
            
            <div className={cn(
              "font-medium text-center leading-tight",
              isMobile ? "text-xs" : isTablet ? "text-[10px]" : "text-xs"
            )}>
              {pattern.name}
            </div>
            
            {selectedPattern === (pattern.id === 'none' ? null : pattern.id) && (
              <div className={cn(
                "absolute bg-background rounded-full",
                isMobile ? "-top-2 -right-2" : "-top-1 -right-1"
              )}>
                <CheckCircle className={cn(
                  "text-primary fill-primary",
                  isMobile ? "w-5 h-5" : isUltraWide ? "w-5 h-5" : "w-4 h-4"
                )} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
