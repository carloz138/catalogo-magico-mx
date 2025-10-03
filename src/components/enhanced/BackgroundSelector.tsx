import React from 'react';
import { Label } from '@/components/ui/label';
import { Scissors, ImageIcon, CheckCircle } from 'lucide-react';

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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Tipo de imagen</Label>
      </div>
      <p className="text-xs text-gray-600">
        {analysis.mixed 
          ? `Tienes ${analysis.withoutBackground} productos con fondo removido y ${analysis.withBackground} con fondo.`
          : analysis.allHaveNoBackground 
          ? `Todos tus ${analysis.total} productos tienen el fondo removido.`
          : `${analysis.withoutBackground} productos tienen el fondo removido.`
        }
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            console.log('🎯 BACKGROUND SELECTOR - Cambio de preferencia:', {
              anterior: backgroundPreference,
              nuevo: 'without',
              timestamp: new Date().toISOString()
            });
            onPreferenceChange('without');
          }}
          className={`
            relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
            ${backgroundPreference === 'without' 
              ? 'border-purple-600 bg-purple-50 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center mb-2
            ${backgroundPreference === 'without' ? 'bg-purple-100' : 'bg-gray-100'}
          `}>
            <Scissors className={`w-5 h-5 ${backgroundPreference === 'without' ? 'text-purple-600' : 'text-gray-600'}`} />
          </div>
          <div className="text-sm font-medium text-center">Sin fondo</div>
          <div className="text-xs text-gray-500 mt-1">
            {analysis.withoutBackground} disponibles
          </div>
          {backgroundPreference === 'without' && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            console.log('🎯 BACKGROUND SELECTOR - Cambio de preferencia:', {
              anterior: backgroundPreference,
              nuevo: 'with',
              timestamp: new Date().toISOString()
            });
            onPreferenceChange('with');
          }}
          className={`
            relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
            ${backgroundPreference === 'with' 
              ? 'border-purple-600 bg-purple-50 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center mb-2
            ${backgroundPreference === 'with' ? 'bg-purple-100' : 'bg-gray-100'}
          `}>
            <ImageIcon className={`w-5 h-5 ${backgroundPreference === 'with' ? 'text-purple-600' : 'text-gray-600'}`} />
          </div>
          <div className="text-sm font-medium text-center">Con fondo</div>
          <div className="text-xs text-gray-500 mt-1">
            Originales
          </div>
          {backgroundPreference === 'with' && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};