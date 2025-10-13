import React from 'react';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import patternTaco from '@/assets/patterns/pattern-taco.png';
import patternGhost from '@/assets/patterns/pattern-ghost.png';
import patternPumpkin from '@/assets/patterns/pattern-pumpkin.png';
import { EXPANDED_WEB_TEMPLATES } from '@/lib/web-catalog/expanded-templates-catalog';

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
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Patrón de fondo</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Selecciona un patrón decorativo para el fondo. El color se adaptará automáticamente al template seleccionado.
      </p>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {AVAILABLE_PATTERNS.map((pattern) => (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onPatternChange(pattern.id === 'none' ? null : pattern.id)}
            className={`
              relative flex flex-col items-center p-2 rounded-lg border-2 transition-all
              ${selectedPattern === (pattern.id === 'none' ? null : pattern.id)
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/50 hover:bg-accent'
              }
            `}
          >
            <div 
              className="w-full aspect-square rounded-md flex items-center justify-center overflow-hidden mb-1.5 bg-background"
              style={{
                background: pattern.preview 
                  ? `url(${pattern.preview}) repeat`
                  : 'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%)',
                backgroundSize: pattern.preview ? '40px 40px' : '20px 20px',
                backgroundPosition: pattern.preview ? '0 0' : '0 0, 10px 10px',
                filter: pattern.preview && webTemplateId ? getPatternFilter() : 'none',
              }}
            />
            <div className="text-[10px] font-medium text-center leading-tight">{pattern.name}</div>
            {selectedPattern === (pattern.id === 'none' ? null : pattern.id) && (
              <div className="absolute -top-1 -right-1 bg-background rounded-full">
                <CheckCircle className="w-4 h-4 text-primary fill-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
