import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageAnalysis } from './ImageAnalysis';

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_qty: number;
  category: string;
  custom_description: string;
  original_image_url: string;
  smart_analysis?: ImageAnalysis;
}

type PriceDisplayMode = 'none' | 'retail' | 'both';

interface ProductFormProps {
  product: ProductData;
  imageUrl: string;
  onUpdate: (product: ProductData) => void;
  priceDisplayMode: PriceDisplayMode;
}

const categories = [
  'Electrónicos',
  'Ropa y Accesorios',
  'Hogar y Jardín',
  'Deportes y Aire Libre',
  'Salud y Belleza',
  'Juguetes y Juegos',
  'Automóviles',
  'Libros y Medios',
  'Alimentos y Bebidas',
  'Oficina y Escuela',
  'Mascotas',
  'Arte y Manualidades',
  'Música e Instrumentos',
  'Bebés y Niños',
  'Otro'
];

export const ProductForm = ({ product, imageUrl, onUpdate, priceDisplayMode }: ProductFormProps) => {
  const handleInputChange = (field: keyof ProductData, value: string | number) => {
    onUpdate({
      ...product,
      [field]: value
    });
  };

  const shouldShowRetailPrice = priceDisplayMode === 'retail' || priceDisplayMode === 'both';
  const shouldShowWholesalePrice = priceDisplayMode === 'both';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="aspect-square">
            <img
              src={imageUrl}
              alt="Product preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Form Section */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${product.id}`} className="text-sm font-medium">
                Nombre del producto *
              </Label>
              <Input
                id={`name-${product.id}`}
                value={product.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: iPhone 15 Pro Max"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`sku-${product.id}`} className="text-sm font-medium">
                SKU / Código
              </Label>
              <Input
                id={`sku-${product.id}`}
                value={product.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Ej: IPH15PM-256GB"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`category-${product.id}`} className="text-sm font-medium">
                Categoría *
              </Label>
              <Select
                value={product.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {shouldShowRetailPrice && (
              <div className="space-y-2">
                <Label htmlFor={`price-retail-${product.id}`} className="text-sm font-medium">
                  Precio de venta *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id={`price-retail-${product.id}`}
                    type="number"
                    value={product.price_retail || ''}
                    onChange={(e) => handleInputChange('price_retail', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-8"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}

            {shouldShowWholesalePrice && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`price-wholesale-${product.id}`} className="text-sm font-medium">
                    Precio mayoreo
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id={`price-wholesale-${product.id}`}
                      type="number"
                      value={product.price_wholesale || ''}
                      onChange={(e) => handleInputChange('price_wholesale', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="pl-8"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`wholesale-min-${product.id}`} className="text-sm font-medium">
                    Cantidad mínima mayoreo
                  </Label>
                  <Input
                    id={`wholesale-min-${product.id}`}
                    type="number"
                    value={product.wholesale_min_qty || 12}
                    onChange={(e) => handleInputChange('wholesale_min_qty', parseInt(e.target.value) || 12)}
                    placeholder="12"
                    min="1"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor={`description-${product.id}`} className="text-sm font-medium">
                Descripción personalizada
              </Label>
              <Textarea
                id={`description-${product.id}`}
                value={product.custom_description}
                onChange={(e) => handleInputChange('custom_description', e.target.value)}
                placeholder="Describe características especiales, beneficios, etc."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
