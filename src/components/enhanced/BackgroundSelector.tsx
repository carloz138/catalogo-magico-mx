import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Scissors, ImageIcon, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  processed_image_url?: string;
  original_image_url?: string;
}

interface BackgroundAnalysis {
  total: number;
  withBackground: number;
  withoutBackground: number;
  hasNoBackgroundOptions: boolean;
  allHaveNoBackground: boolean;
  mixed: boolean;
}

interface BackgroundSelectorProps {
  products: Product[];
  backgroundPreference: 'with' | 'without';
  onPreferenceChange: (preference: 'with' | 'without') => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  products,
  backgroundPreference,
  onPreferenceChange
}) => {
  // Análizar productos con/sin fondo
  const analyzeBackgroundStatus = (products: Product[]): BackgroundAnalysis => {
    const withoutBackground = products.filter(p => 
      p.processed_image_url && p.processed_image_url !== p.original_image_url
    ).length;
    const withBackground = products.length - withoutBackground;
    
    return {
      total: products.length,
      withBackground,
      withoutBackground,
      hasNoBackgroundOptions: withoutBackground > 0,
      allHaveNoBackground: withoutBackground === products.length,
      mixed: withBackground > 0 && withoutBackground > 0
    };
  };

  const analysis = analyzeBackgroundStatus(products);

  // Solo mostrar si hay opciones de fondo removido
  if (!analysis.hasNoBackgroundOptions) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Scissors className="h-4 w-4 text-blue-600" />
        <Label className="text-sm font-medium text-blue-800">Tipo de imagen</Label>
      </div>
      <p className="text-xs text-blue-600">
        {analysis.mixed 
          ? `Tienes ${analysis.withoutBackground} productos con fondo removido y ${analysis.withBackground} con fondo.`
          : analysis.allHaveNoBackground 
          ? `Todos tus ${analysis.total} productos tienen el fondo removido.`
          : `${analysis.withoutBackground} productos tienen el fondo removido.`
        }
      </p>
      <Select value={backgroundPreference} onValueChange={(value) => {
        console.log('🎯 BACKGROUND SELECTOR - Cambio de preferencia:', {
          anterior: backgroundPreference,
          nuevo: value,
          timestamp: new Date().toISOString()
        });
        onPreferenceChange(value as 'with' | 'without');
      }}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="without">
            <div className="flex items-center gap-2">
              <Scissors className="h-3 w-3" />
              Usar imágenes sin fondo ({analysis.withoutBackground} disponibles)
            </div>
          </SelectItem>
          <SelectItem value="with">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3" />
              Usar imágenes con fondo
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};