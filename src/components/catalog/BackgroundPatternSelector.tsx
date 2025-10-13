import React from 'react';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import patternTaco from '@/assets/patterns/pattern-taco.png';

interface BackgroundPatternSelectorProps {
  selectedPattern: string | null;
  onPatternChange: (pattern: string | null) => void;
}

// Lista de patrones disponibles - aquí puedes agregar las 18+ imágenes
const AVAILABLE_PATTERNS = [
  { id: 'none', name: 'Sin patrón', preview: null },
  { id: 'taco', name: 'Taco', preview: patternTaco },
  // Agrega más patrones aquí cuando los subas
];

export const BackgroundPatternSelector: React.FC<BackgroundPatternSelectorProps> = ({
  selectedPattern,
  onPatternChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Patrón de fondo</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Selecciona un patrón decorativo para el fondo. El color se adaptará automáticamente al template seleccionado.
      </p>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {AVAILABLE_PATTERNS.map((pattern) => (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onPatternChange(pattern.id === 'none' ? null : pattern.id)}
            className={`
              relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
              ${selectedPattern === (pattern.id === 'none' ? null : pattern.id)
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/50 hover:bg-accent'
              }
            `}
          >
            <div 
              className="w-full aspect-square rounded-md flex items-center justify-center overflow-hidden mb-2"
              style={{
                background: pattern.preview 
                  ? `url(${pattern.preview}) repeat`
                  : 'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%, transparent 75%, hsl(var(--muted)) 75%)',
                backgroundSize: pattern.preview ? '60px 60px' : '20px 20px',
                backgroundPosition: pattern.preview ? '0 0' : '0 0, 10px 10px',
              }}
            />
            <div className="text-xs font-medium text-center">{pattern.name}</div>
            {selectedPattern === (pattern.id === 'none' ? null : pattern.id) && (
              <div className="absolute top-1 right-1">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
