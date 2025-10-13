import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductFiltersProps {
  tags: string[];
  minPrice: number;
  maxPrice: number;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClearAll: () => void;
  resultCount: number;
  showTags?: boolean;
}

export default function ProductFilters({
  tags,
  minPrice,
  maxPrice,
  selectedTags,
  onTagsChange,
  priceRange,
  onPriceRangeChange,
  onClearAll,
  resultCount,
  showTags = true,
}: ProductFiltersProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const hasActiveFilters = selectedTags.length > 0 || 
    priceRange[0] !== minPrice || 
    priceRange[1] !== maxPrice;

  return (
    <div className="sticky top-24 bg-card border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Limpiar todo
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Tags Filter */}
        {showTags && tags.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Categorías</h4>
            <ScrollArea className="h-48">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Price Range Filter */}
        {maxPrice > minPrice && (
          <div>
            <h4 className="font-medium text-sm mb-3">Rango de Precio</h4>
            <div className="px-2">
              <Slider
                min={minPrice}
                max={maxPrice}
                step={0.01}
                value={priceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${priceRange[0].toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>${priceRange[1].toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-center">
            {resultCount} {resultCount === 1 ? 'producto' : 'productos'}
          </p>
        </div>
      </div>
    </div>
  );
}
