import React, { createContext, useContext, useState, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  price_retail: number;
  price_wholesale: number | null;
  processed_image_url: string | null;
  original_image_url: string;
  sku: string | null;
}

interface QuoteItem {
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  unitPrice: number; // Centavos
}

interface QuoteCartContextType {
  items: QuoteItem[];
  addItem: (product: Product, quantity: number, priceType: 'retail' | 'wholesale', unitPrice: number) => void;
  updateQuantity: (productId: string, priceType: string, quantity: number) => void;
  removeItem: (productId: string, priceType: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(undefined);

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);

  const addItem = useCallback((product: Product, quantity: number, priceType: 'retail' | 'wholesale', unitPrice: number) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.priceType === priceType
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, { product, quantity, priceType, unitPrice }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, priceType: string, quantity: number) => {
    setItems(prev => {
      if (quantity <= 0) {
        return prev.filter(item => !(item.product.id === productId && item.priceType === priceType));
      }
      
      return prev.map(item =>
        item.product.id === productId && item.priceType === priceType
          ? { ...item, quantity }
          : item
      );
    });
  }, []);

  const removeItem = useCallback((productId: string, priceType: string) => {
    setItems(prev => prev.filter(item => !(item.product.id === productId && item.priceType === priceType)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <QuoteCartContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
    }}>
      {children}
    </QuoteCartContext.Provider>
  );
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext);
  if (!context) throw new Error('useQuoteCart must be used within QuoteCartProvider');
  return context;
}
