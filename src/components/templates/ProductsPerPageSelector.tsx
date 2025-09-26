// src/components/templates/ProductsPerPageSelector.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, Grid2X2, Grip } from 'lucide-react';

interface ProductsPerPageSelectorProps {
  selectedCount: 4 | 6 | 9;
  onCountChange: (count: 4 | 6 | 9) => void;
  totalProducts: number;
  disabled?: boolean;
}

interface LayoutOption {
  count: 4 | 6 | 9;
  label: string;
  description: string;
  icon: React.ReactNode;
  columns: number;
  rows: number;
  cardSize: 'large' | 'medium' | 'small';
  recommended?: boolean;
}

const layoutOptions: LayoutOption[] = [
  {
    count: 4,
    label: '4 Productos',
    description: 'Productos grandes, máximo detalle',
    icon: <Grid2X2 className="w-4 h-4" />,
    columns: 2,
    rows: 2,
    cardSize: 'large',
    recommended: false
  },
  {
    count: 6,
    label: '6 Productos',
    description: 'Balance perfecto (Recomendado)',
    icon: <Grid3X3 className="w-4 h-4" />,
    columns: 3,
    rows: 2,
    cardSize: 'medium',
    recommended: true
  },
  {
    count: 9,
    label: '9 Productos',
    description: 'Máximo contenido por página',
    icon: <Grip className="w-4 h-4" />,
    columns: 3,
    rows: 3,
    cardSize: 'small',
    recommended: false
  }
];

export const ProductsPerPageSelector: React.FC<ProductsPerPageSelectorProps> = ({
  selectedCount,
  onCountChange,
  totalProducts,
  disabled = false
}) => {
  
  const calculatePages = (productsPerPage: number) => {
    return Math.ceil(totalProducts / productsPerPage);
  };

  const getRecommendation = (count: 4 | 6 | 9) => {
    if (totalProducts <= 12 && count === 4) return 'Ideal para pocos productos';
    if (totalProducts >= 13 && totalProducts <= 50 && count === 6) return 'Recomendado';
    if (totalProducts > 50 && count === 9) return 'Eficiente para muchos productos';
    return null;
  };

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Productos por página
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Elige cuántos productos mostrar en cada página del catálogo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {layoutOptions.map((option) => {
              const isSelected = selectedCount === option.count;
              const pages = calculatePages(option.count);
              const recommendation = getRecommendation(option.count);
              
              return (
                <button
                  key={option.count}
                  onClick={() => onCountChange(option.count)}
                  disabled={disabled}
                  className={`
                    relative p-3 rounded-lg border-2 text-left transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Badge recomendado */}
                  {option.recommended && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -right-2 bg-green-500 text-white text-xs"
                    >
                      Recomendado
                    </Badge>
                  )}

                  {/* Header con icono */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`
                      p-1.5 rounded 
                      ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {option.icon}
                    </div>
                    <div>
                      <h4 className={`
                        font-medium text-sm
                        ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                      `}>
                        {option.label}
                      </h4>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className={`
                    text-xs mb-2
                    ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                  `}>
                    {option.description}
                  </p>

                  {/* Layout info */}
                  <div className="space-y-1">
                    <div className={`
                      text-xs
                      ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      <span className="font-medium">Layout:</span> {option.columns}×{option.rows}
                    </div>
                    <div className={`
                      text-xs
                      ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      <span className="font-medium">Páginas:</span> {pages}
                    </div>
                    <div className={`
                      text-xs
                      ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      <span className="font-medium">Tamaño:</span> {
                        option.cardSize === 'large' ? 'Grande' :
                        option.cardSize === 'medium' ? 'Medio' : 'Compacto'
                      }
                    </div>
                  </div>

                  {/* Recomendación específica */}
                  {recommendation && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                      <p className={`
                        text-xs font-medium
                        ${isSelected ? 'text-blue-700' : 'text-green-600'}
                      `}>
                        ✓ {recommendation}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Con <strong>{selectedCount} productos/página</strong>:
              </span>
              <div className="text-right">
                <span className="font-medium text-gray-900">
                  {calculatePages(selectedCount)} páginas totales
                </span>
                {totalProducts % selectedCount !== 0 && (
                  <div className="text-xs text-gray-500">
                    (última página: {totalProducts % selectedCount} productos)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};