// /src/components/products/ProductCard.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Trash2, Tag } from 'lucide-react';
import { Product, getDisplayImageUrl } from '@/types/products';

interface ProductCardProps {
  product: Product;
  selectedProducts: string[];
  toggleProductSelection: (productId: string) => void;
  handleDeleteProduct: (product: Product) => void;
  handleViewProduct: (product: Product) => void;
  processing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  selectedProducts, 
  toggleProductSelection, 
  handleDeleteProduct,
  handleViewProduct,
  processing = false
}) => {
  const displayImageUrl = getDisplayImageUrl(product);
  
  // Manejar tags - verificar que existe y es array
  const productTags = product.tags && Array.isArray(product.tags) ? product.tags : [];
  
  // Manejador para click en la tarjeta (móvil principalmente)
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && !target.closest('input[type="checkbox"]')) {
      toggleProductSelection(product.id);
    }
  };

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer sm:cursor-default ${
        processing ? 'opacity-50' : ''
      } ${selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleCardClick}
    >
      <div className="relative">
        <div className="aspect-square bg-gray-100">
          <img
            src={displayImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        {/* Solo checkbox - sin badges de estado */}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selectedProducts.includes(product.id)}
            onCheckedChange={() => toggleProductSelection(product.id)}
            className="bg-white shadow-sm"
            disabled={processing}
          />
        </div>

        {/* Mostrar indicador de tags si las tiene */}
        {productTags.length > 0 && (
          <div className="absolute top-2 right-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
              <Tag className="h-3 w-3 text-gray-600" />
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">
          {product.name}
        </h3>
        
        {product.price_retail && (
          <p className="font-bold text-primary mb-2 text-sm">
            ${(product.price_retail / 100).toFixed(2)}
          </p>
        )}
        
        {/* Categoría y Tags en la misma línea */}
        <div className="flex flex-wrap gap-1 mb-2">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          
          {/* Mostrar hasta 2 tags principales + contador si hay más */}
          {productTags.length > 0 && (
            <>
              {productTags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {tag}
                </Badge>
              ))}
              {productTags.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-gray-500 border-gray-300"
                  title={`Tags adicionales: ${productTags.slice(2).join(', ')}`}
                >
                  +{productTags.length - 2}
                </Badge>
              )}
            </>
          )}
        </div>
        
        {/* Solo 2 botones: Ver y Eliminar */}
        <div className="flex gap-1 sm:gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-xs" 
            disabled={processing}
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct(product);
            }}
          >
            <Eye className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Ver</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            disabled={processing}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(product);
            }}
            className="text-xs hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};