import { useState, useEffect, useMemo } from 'react';

export function useProductSearch<T extends Record<string, any>>(
  products: T[],
  searchFields: string[]
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter products based on search query
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return products;
    }

    const searchTerm = debouncedQuery.toLowerCase();

    return products.filter((product) =>
      searchFields.some((field) => {
        const value = product[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm);
      })
    );
  }, [products, debouncedQuery, searchFields]);

  return {
    query,
    setQuery,
    results,
  };
}
