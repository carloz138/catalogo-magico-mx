// src/lib/pdf/dynamic-template-engine.ts
// 🎨 DEFINICIÓN DE TEMPLATES DINÁMICOS

export interface DynamicTemplate {
  id: string;
  displayName: string;
  description: string;
  productsPerPage: number;
  
  layout: {
    columns: number;
    rows: number;
    spacing: 'tight' | 'normal' | 'loose' | 'luxury';
    orientation: 'portrait' | 'landscape';
  };
  
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    icons: {
      header: string;
      productIcons: string[];
      decorative: string[];
    };
    typography: {
      headerSize: string;
      productNameSize: string;
      priceSize: string;
    };
  };
  
  pdfConfig: {
    pageSize: 'A4' | 'Letter' | 'A3';
    margin: number;
    quality: number;
  };
  
  features: {
    showProductIcons: boolean;
    showDescriptions: boolean;
    showSKU: boolean;
    showCategories: boolean;
    premiumLayout: boolean;
  };
}