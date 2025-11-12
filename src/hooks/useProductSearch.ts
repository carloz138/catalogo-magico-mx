import { useMemo } from 'react';

export function useProductSearch<T extends Record<string, any>>(
  products: T[],
  searchFields: string[],
  externalQuery?: string
) {
  // Filter products based on search query (use external query if provided)
  const results = useMemo(() => {
    const searchQuery = externalQuery ?? '';
    
    if (!searchQuery.trim()) {
      return products;
    }

    const searchTerm = searchQuery.toLowerCase();

    return products.filter((product) =>
      searchFields.some((field) => {
        const value = product[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm);
      })
    );
  }, [products, searchFields, externalQuery]);

  return {
    results,
  };
}
