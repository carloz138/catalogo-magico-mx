
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
}

type PriceDisplayMode = 'none' | 'retail' | 'both';

interface ProductFormProps {
  product: ProductData;
  imageUrl: string;
  onUpdate: (product: ProductData) => void;
  priceDisplayMode: PriceDisplayMode;
}

const categories = [
  'Ropa',
  'Electrónicos', 
  'Hogar',
  'Belleza',
  'Deportes',
  'Alimentos',
  'Otros'
];

export const ProductForm = ({ product, imageUrl, onUpdate, priceDisplayMode }: ProductFormProps) => {
  const handleChange = (field: keyof ProductData, value: string | number) => {
    onUpdate({ ...product, [field]: value });
  };

  const generateSKU = () => {
    const randomSku = `${product.category?.slice(0, 3).toUpperCase() || 'PRD'}-${Date.now().toString().slice(-6)}`;
    handleChange('sku', randomSku);
  };

  const formatPrice = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  };

  const shouldShowRetailPrice = priceDisplayMode === 'retail' || priceDisplayMode === 'both';
  const shouldShowWholesalePrice = priceDisplayMode === 'both';

  // Validation status for visual feedback
  const hasName = product.name?.trim();
  const hasCategory = product.category?.trim();
  const hasRetail = product.price_retail && product.price_retail > 0;

  const getFieldStatus = (field: string) => {
    switch (field) {
      case 'name':
        return hasName ? 'complete' : 'incomplete';
      case 'category':
        return hasCategory ? 'complete' : 'incomplete';
      case 'price_retail':
        if (priceDisplayMode === 'none') return 'optional';
        return hasRetail ? 'complete' : 'incomplete';
      default:
        return 'optional';
    }
  };

  const getFieldClassName = (field: string) => {
    const status = getFieldStatus(field);
    const baseClass = "transition-all duration-200";
    
    switch (status) {
      case 'incomplete':
        return `${baseClass} border-red-300 focus:border-red-500 focus:ring-red-500`;
      case 'complete':
        return `${baseClass} border-green-300 focus:border-green-500 focus:ring-green-500`;
      default:
        return baseClass;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          <img
            src={imageUrl}
            alt="Producto"
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <CardTitle className="text-lg">Datos del Producto</CardTitle>
            <p className="text-sm text-neutral/60">
              Completa la información según tu configuración elegida
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`name-${product.id}`} className="flex items-center gap-1">
            Nombre del Producto *
            {getFieldStatus('name') === 'incomplete' && (
              <span className="text-red-500 text-xs">(requerido)</span>
            )}
          </Label>
          <Input
            id={`name-${product.id}`}
            value={product.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ej: Playera básica algodón"
            className={getFieldClassName('name')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {shouldShowRetailPrice && (
            <div>
              <Label htmlFor={`price-retail-${product.id}`} className="flex items-center gap-1">
                Precio Venta MXN *
                {getFieldStatus('price_retail') === 'incomplete' && (
                  <span className="text-red-500 text-xs">(requerido)</span>
                )}
              </Label>
              <Input
                id={`price-retail-${product.id}`}
                type="number"
                value={product.price_retail || ''}
                onChange={(e) => handleChange('price_retail', formatPrice(e.target.value))}
                placeholder="299"
                min="1"
                className={getFieldClassName('price_retail')}
                required={priceDisplayMode !== 'none'}
              />
            </div>
          )}
          <div>
            <Label htmlFor={`category-${product.id}`} className="flex items-center gap-1">
              Categoría *
              {getFieldStatus('category') === 'incomplete' && (
                <span className="text-red-500 text-xs">(requerido)</span>
              )}
            </Label>
            <Select
              value={product.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger className={getFieldClassName('category')}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={`sku-${product.id}`}>SKU/Código</Label>
          <div className="flex gap-2">
            <Input
              id={`sku-${product.id}`}
              value={product.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="PRD-123456"
            />
            <button
              type="button"
              onClick={generateSKU}
              className="text-sm text-primary hover:underline px-2"
            >
              Generar
            </button>
          </div>
        </div>

        {shouldShowWholesalePrice && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`price-wholesale-${product.id}`}>Precio Mayoreo MXN</Label>
              <Input
                id={`price-wholesale-${product.id}`}
                type="number"
                value={product.price_wholesale || ''}
                onChange={(e) => handleChange('price_wholesale', formatPrice(e.target.value) || undefined)}
                placeholder="250"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor={`min-qty-${product.id}`}>Cantidad Mín. Mayoreo</Label>
              <Input
                id={`min-qty-${product.id}`}
                type="number"
                value={product.wholesale_min_qty}
                onChange={(e) => handleChange('wholesale_min_qty', parseInt(e.target.value) || 12)}
                min="1"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor={`description-${product.id}`}>Descripción Personalizada</Label>
          <Textarea
            id={`description-${product.id}`}
            value={product.custom_description}
            onChange={(e) => handleChange('custom_description', e.target.value)}
            placeholder="Describe las características especiales de tu producto..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
