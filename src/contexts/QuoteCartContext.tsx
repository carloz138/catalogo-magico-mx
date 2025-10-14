import React, { createContext, useContext, useState, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  processed_image_url: string | null;
  original_image_url: string;
  sku: string | null;
}

interface QuoteItem {
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  unitPrice: number; // Centavos
  variantId?: string | null; // ID de la variante seleccionada
  variantDescription?: string | null; // Descripción legible de la variante
}

interface QuoteCartContextType {
  items: QuoteItem[];
  addItem: (
    product: Product, 
    quantity: number, 
    priceType: 'retail' | 'wholesale', 
    unitPrice: number,
    variantId?: string | null,
    variantDescription?: string | null
  ) => void;
  updateQuantity: (productId: string, priceType: string, quantity: number, variantId?: string | null) => void;
  removeItem: (productId: string, priceType: string, variantId?: string | null) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(undefined);

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);

  const addItem = useCallback((
    product: Product, 
    quantity: number, 
    priceType: 'retail' | 'wholesale', 
    unitPrice: number,
    variantId?: string | null,
    variantDescription?: string | null
  ) => {
    setItems(prev => {
      // Buscar si ya existe este producto con la misma variante y tipo de precio
      const existingIndex = prev.findIndex(
        item => 
          item.product.id === product.id && 
          item.priceType === priceType &&
          item.variantId === variantId
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, { 
        product, 
        quantity, 
        priceType, 
        unitPrice,
        variantId,
        variantDescription
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, priceType: string, quantity: number, variantId?: string | null) => {
    setItems(prev => {
      if (quantity <= 0) {
        return prev.filter(item => !(
          item.product.id === productId && 
          item.priceType === priceType &&
          item.variantId === variantId
        ));
      }
      
      return prev.map(item =>
        item.product.id === productId && 
        item.priceType === priceType &&
        item.variantId === variantId
          ? { ...item, quantity }
          : item
      );
    });
  }, []);

  const removeItem = useCallback((productId: string, priceType: string, variantId?: string | null) => {
    setItems(prev => prev.filter(item => !(
      item.product.id === productId && 
      item.priceType === priceType &&
      item.variantId === variantId
    )));
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
