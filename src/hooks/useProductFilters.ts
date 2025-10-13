import { useState, useMemo } from 'react';

interface Product {
  id: string;
  tags?: string[];
  price_retail?: number;
  price_wholesale?: number;
  [key: string]: any;
}

interface UseProductFiltersOptions {
  priceField?: 'price_retail' | 'price_wholesale';
}

export function useProductFilters(
  products: Product[],
  options: UseProductFiltersOptions = {}
) {
  const { priceField = 'price_retail' } = options;

  // Calculate min and max prices (converting from cents to currency)
  const { minPrice, maxPrice } = useMemo(() => {
    if (products.length === 0) {
      return { minPrice: 0, maxPrice: 100 };
    }

    const prices = products
      .map((p) => (p[priceField] || 0) / 100)
      .filter((p) => p > 0);

    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 100 };
    }

    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices)),
    };
  }, [products, priceField]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  // Update price range when products change
  useMemo(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filter by tags
      if (selectedTags.length > 0) {
        const productTags = product.tags || [];
        const hasMatchingTag = selectedTags.some((tag) =>
          productTags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Filter by price range (converting from cents to currency)
      const price = (product[priceField] || 0) / 100;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      return true;
    });
  }, [products, selectedTags, priceRange, priceField]);

  const clearFilters = () => {
    setSelectedTags([]);
    setPriceRange([minPrice, maxPrice]);
  };

  return {
    filteredProducts,
    selectedTags,
    setSelectedTags,
    priceRange,
    setPriceRange,
    minPrice,
    maxPrice,
    clearFilters,
  };
}
