// src/types/dynamic-layouts.ts
// 🎯 TIPOS CONSOLIDADOS PARA PRODUCTOS POR PÁGINA DINÁMICOS

export type ProductsPerPageOption = 4 | 6 | 9;

export interface DynamicLayoutConfig {
  productsPerPage: ProductsPerPageOption;
  columns: number;
  rows: number;
  cardSize: 'large' | 'medium' | 'small';
  optimization: string;
  description: string;
}

export interface LayoutDimensions {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  contentHeight: number;
  columns: number;
  gap: number;
  cardWidth: number;
  cardHeight: number;
  imageHeight: number;
  textAreaHeight: number;
}

export interface DynamicGenerationOptions {
  useDynamicEngine?: boolean;
  usePuppeteerService?: boolean;
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
  forceClassicMode?: boolean;
  qualityCheck?: boolean;
  autoFix?: boolean;
  skipAudit?: boolean;
  catalogTitle?: string;
  productsPerPage?: ProductsPerPageOption; // 🆕 OPCIÓN PRINCIPAL
}

export interface DynamicGenerationStats {
  totalProducts: number;
  totalPages: number;
  generationTime: number;
  templateQuality: number;
  issues?: string[];
  productsPerPage?: ProductsPerPageOption; // 🆕 STAT ADICIONAL
  layoutOptimization?: string;
}

export interface DynamicGenerationResult {
  success: boolean;
  catalogId?: string;
  htmlContent?: string;
  error?: string;
  message?: string;
  generationMethod?: 'puppeteer' | 'dynamic' | 'classic' | 'hybrid' | 'fallback';
  stats?: DynamicGenerationStats;
  warnings?: string[];
}

export interface ProductsPerPageValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: {
    recommended: ProductsPerPageOption;
    reason: string;
    alternatives: Array<{
      count: ProductsPerPageOption;
      reason: string;
    }>;
  };
}

// 🔧 CONSTANTES DE CONFIGURACIÓN
export const LAYOUT_CONFIGS: Record<ProductsPerPageOption, DynamicLayoutConfig> = {
  4: {
    productsPerPage: 4,
    columns: 2,
    rows: 2,
    cardSize: 'large',
    optimization: 'Large Cards (2x2) - Maximum Detail',
    description: 'Productos grandes con máximo detalle. Ideal para catálogos premium o productos complejos.'
  },
  6: {
    productsPerPage: 6,
    columns: 3,
    rows: 2,
    cardSize: 'medium',
    optimization: 'Balanced Layout (3x2) - Standard',
    description: 'Balance perfecto entre detalle y cantidad. Recomendado para la mayoría de casos.'
  },
  9: {
    productsPerPage: 9,
    columns: 3,
    rows: 3,
    cardSize: 'small',
    optimization: 'Compact Grid (3x3) - Maximum Content',
    description: 'Máximo contenido por página. Ideal para catálogos extensos o productos simples.'
  }
};

export const TYPOGRAPHY_SCALES: Record<ProductsPerPageOption, number> = {
  4: 1.3,  // Más grande para 4 productos
  6: 1.0,  // Estándar para 6 productos
  9: 0.8   // Más pequeño para 9 productos
};

export const SPACING_SCALES: Record<ProductsPerPageOption, number> = {
  4: 1.4,  // Más espaciado para 4 productos
  6: 1.0,  // Espaciado estándar
  9: 0.7   // Más compacto para 9 productos
};

// 🔧 UTILIDADES DE VALIDACIÓN
export const validateProductsPerPage = (
  productsPerPage: ProductsPerPageOption,
  totalProducts: number
): ProductsPerPageValidation => {
  const warnings: string[] = [];
  let isValid = true;
  
  const pages = Math.ceil(totalProducts / productsPerPage);
  
  // Validaciones específicas
  if (productsPerPage === 4 && totalProducts > 40) {
    warnings.push(`Con ${productsPerPage} productos/página tendrás ${pages} páginas. Considera usar 6 o 9 productos/página.`);
  }
  
  if (productsPerPage === 9 && totalProducts < 18) {
    warnings.push(`Con solo ${totalProducts} productos, el layout de 9/página puede verse espacioso.`);
  }
  
  if (totalProducts < productsPerPage) {
    warnings.push(`Solo tienes ${totalProducts} productos pero elegiste ${productsPerPage}/página.`);
  }
  
  if (pages > 50) {
    warnings.push(`${pages} páginas es muy extenso. Considera dividir en múltiples catálogos.`);
    isValid = false;
  }
  
  // Generar sugerencias
  let recommended: ProductsPerPageOption = 6;
  let reason = 'Layout balanceado recomendado';
  
  if (totalProducts <= 12) {
    recommended = 4;
    reason = 'Pocos productos - layout grande maximiza impacto visual';
  } else if (totalProducts >= 60) {
    recommended = 9;
    reason = 'Muchos productos - layout compacto reduce páginas';
  }
  
  const alternatives: Array<{ count: ProductsPerPageOption; reason: string }> = [];
  [4, 6, 9].forEach((option) => {
    if (option !== recommended) {
      const altPages = Math.ceil(totalProducts / option);
      alternatives.push({
        count: option as ProductsPerPageOption,
        reason: `${altPages} páginas con layout ${option === 4 ? 'grande' : option === 6 ? 'balanceado' : 'compacto'}`
      });
    }
  });
  
  return {
    isValid,
    warnings,
    suggestions: {
      recommended,
      reason,
      alternatives
    }
  };
};

// 🔧 UTILIDADES DE CÁLCULO
export const calculateLayoutDimensions = (productsPerPage: ProductsPerPageOption): LayoutDimensions => {
  const config = LAYOUT_CONFIGS[productsPerPage];
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = productsPerPage === 4 ? 12 : productsPerPage === 6 ? 10 : 8;
  
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);
  
  const gap = productsPerPage === 4 ? 8 : productsPerPage === 6 ? 5 : 3;
  const totalGapWidth = (config.columns - 1) * gap;
  const availableWidth = contentWidth - totalGapWidth;
  const cardWidth = availableWidth / config.columns;
  
  // Altura dinámica
  let cardHeight;
  if (productsPerPage === 4) {
    cardHeight = cardWidth + 50; // Más alto para 4 productos
  } else if (productsPerPage === 6) {
    cardHeight = cardWidth + 35; // Altura estándar
  } else {
    cardHeight = cardWidth + 25; // Más compacto para 9 productos
  }
  
  const imageHeightRatio = productsPerPage === 4 ? 0.65 : productsPerPage === 6 ? 0.55 : 0.50;
  const imageHeight = cardHeight * imageHeightRatio;
  const textAreaHeight = cardHeight - imageHeight;
  
  return {
    pageWidth,
    pageHeight,
    margin,
    contentWidth: Math.floor(contentWidth * 100) / 100,
    contentHeight: Math.floor(contentHeight * 100) / 100,
    columns: config.columns,
    gap: Math.floor(gap * 100) / 100,
    cardWidth: Math.floor(cardWidth * 100) / 100,
    cardHeight: Math.floor(cardHeight * 100) / 100,
    imageHeight: Math.floor(imageHeight * 100) / 100,
    textAreaHeight: Math.floor(textAreaHeight * 100) / 100
  };
};

export const getOptimalProductsPerPage = (totalProducts: number): ProductsPerPageOption => {
  if (totalProducts <= 12) return 4;
  if (totalProducts >= 60) return 9;
  return 6;
};

/*
================================================================================
GUÍA DE IMPLEMENTACIÓN - PRODUCTOS POR PÁGINA DINÁMICOS
================================================================================

## 🎯 RESUMEN DE LA FUNCIONALIDAD

Esta implementación permite a los usuarios elegir mostrar 4, 6 o 9 productos por página
en sus catálogos, con layouts optimizados automáticamente para cada opción:

- **4 productos/página**: Layout 2x2 con cards grandes para máximo detalle
- **6 productos/página**: Layout 3x2 balanceado (estándar actual)  
- **9 productos/página**: Layout 3x3 compacto para máximo contenido

## 📂 ARCHIVOS MODIFICADOS

### 1. **Componentes Nuevos**
```typescript
// src/components/templates/ProductsPerPageSelector.tsx
// Selector visual para que el usuario elija 4, 6 o 9 productos/página
```

### 2. **Hooks Nuevos**
```typescript
// src/hooks/useProductsPerPage.ts  
// Hook para manejar estado y lógica de productos por página
```

### 3. **Modificaciones en Generadores**
```typescript
// src/lib/templates/css-generator.ts
// Añadido soporte para CSS dinámico basado en productos/página

// src/lib/pdf/puppeteer-service-client.ts  
// Añadido soporte para layouts dinámicos en Puppeteer

// src/lib/catalog/unified-generator.ts
// Integración completa de productos/página en el generador unificado
```

### 4. **Modificaciones en UI**
```typescript
// src/pages/TemplateSelection.tsx
// Integración del selector y lógica dinámica

// src/components/enhanced/TemplateSelectionEnhanced.tsx
// Versión mejorada con selector de productos/página
```

## 🚀 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Instalar Archivos Base
```bash
# Copiar todos los archivos generados a sus ubicaciones correspondientes
# Asegurarse de que todos los imports estén disponibles
```

### Paso 2: Integrar en TemplateSelection
```typescript
// En tu componente TemplateSelection.tsx

import { ProductsPerPageSelector } from '@/components/templates/ProductsPerPageSelector';
import { useProductsPerPage } from '@/hooks/useProductsPerPage';

// Dentro del componente:
const {
  productsPerPage,
  setProductsPerPage,
  totalPages,
  layoutInfo,
  suggestions,
  validation
} = useProductsPerPage({
  totalProducts: selectedProducts.length,
  autoSuggest: true
});

// En el JSX, añadir el selector:
<ProductsPerPageSelector
  selectedCount={productsPerPage}
  onCountChange={setProductsPerPage}
  totalProducts={selectedProducts.length}
  disabled={generating}
/>
```

### Paso 3: Actualizar Llamadas de Generación
```typescript
// Pasar productsPerPage a las funciones de generación:

const result = await generateCatalog(
  selectedProducts,
  businessData,
  selectedTemplate,
  user.id,
  {
    // ... otras opciones
    productsPerPage: productsPerPage // 🆕 AÑADIR ESTA LÍNEA
  }
);
```

### Paso 4: Actualizar CSS Generator (si usas custom)
```typescript
// Si tienes CSS personalizado, usar la nueva función:

const htmlContent = TemplateGenerator.generateCatalogHTML(
  selectedProducts,
  businessData,
  template,
  productsPerPage // 🆕 AÑADIR PARÁMETRO
);
```

## 🎛️ USO DEL HOOK useProductsPerPage

### Uso Básico
```typescript
const { productsPerPage, setProductsPerPage, totalPages } = useProductsPerPage({
  totalProducts: 25,
  autoSuggest: true
});
```

### Uso Avanzado con Validaciones
```typescript
const {
  productsPerPage,
  setProductsPerPage,
  totalPages,
  layoutInfo,
  suggestions,
  validation
} = useProductsPerPage({
  totalProducts: 25,
  initialValue: 6,
  autoSuggest: true
});

// Acceder a información del layout
console.log(layoutInfo.optimization); // "Balanced Layout (3x2) - Standard"
console.log(layoutInfo.cardSize);     // "medium"

// Verificar validaciones
if (validation.warnings.length > 0) {
  console.warn('Advertencias:', validation.warnings);
}

// Ver sugerencias automáticas
console.log('Recomendado:', suggestions.recommended);
console.log('Razón:', suggestions.reason);
```

## 🎨 PERSONALIZACIÓN DE LAYOUTS

### Modificar Dimensiones
```typescript
// En css-generator.ts, puedes ajustar las constantes:

const TYPOGRAPHY_SCALES = {
  4: 1.3,  // Textos más grandes para 4 productos
  6: 1.0,  // Tamaño estándar
  9: 0.8   // Textos más pequeños para 9 productos
};

const SPACING_SCALES = {
  4: 1.4,  // Más espaciado
  6: 1.0,  // Espaciado estándar  
  9: 0.7   // Más compacto
};
```

### Añadir Nuevas Opciones de Productos/Página
```typescript
// Para añadir soporte para 8 productos/página:

// 1. Actualizar tipo
export type ProductsPerPageOption = 4 | 6 | 8 | 9;

// 2. Añadir configuración
export const LAYOUT_CONFIGS = {
  // ... configuraciones existentes
  8: {
    productsPerPage: 8,
    columns: 4,
    rows: 2,
    cardSize: 'medium',
    optimization: 'Wide Layout (4x2) - Horizontal',
    description: 'Layout horizontal para pantallas anchas.'
  }
};
```

## 🔧 DEBUGGING Y TROUBLESHOOTING

### Logs de Debug
La implementación incluye logs extensos. Busca en la consola:
```
🎯 Generando catálogo con 6 productos por página
📋 Productos por página cambiado a: 4
✅ Template optimizado para 9 productos por página
```

### Problemas Comunes

1. **CSS no se aplica correctamente**
   - Verificar que `productsPerPage` se pase a `generateTemplateCSS()`
   - Comprobar que las variables CSS dinámicas se están generando

2. **Layout se ve mal en Puppeteer**
   - Asegurar que `productsPerPage` se pase en `puppeteerOptions`
   - Verificar que las dimensiones dinámicas se calculen correctamente

3. **Productos no se distribuyen bien**
   - Comprobar que `productsPerPage` se use en `generateProductsHTMLGrid()`
   - Verificar que las cards vacías se añadan correctamente

### Testing
```typescript
// Para probar diferentes configuraciones:
const testConfigs = [
  { products: 5, expected: 4 },   // Pocos productos -> layout grande
  { products: 25, expected: 6 },  // Cantidad media -> layout estándar
  { products: 100, expected: 9 }  // Muchos productos -> layout compacto
];

testConfigs.forEach(({ products, expected }) => {
  const optimal = getOptimalProductsPerPage(products);
  console.assert(optimal === expected, `Failed for ${products} products`);
});
```

## 📊 MÉTRICAS Y ANALYTICS

La implementación incluye métricas automáticas:
```typescript
// En el resultado de generación:
result.stats = {
  totalProducts: 25,
  totalPages: 5,
  generationTime: 1234,
  templateQuality: 95,
  productsPerPage: 6,                    // 🆕 MÉTRICA NUEVA
  layoutOptimization: "Balanced Layout"  // 🆕 MÉTRICA NUEVA
};
```

## 🎯 MEJORES PRÁCTICAS

1. **Usar auto-sugerencia**: Permite que el hook sugiera automáticamente
2. **Validar antes de generar**: Revisar `validation.warnings` 
3. **Mostrar información al usuario**: Usar `layoutInfo.description`
4. **Manejar casos edge**: Productos < productsPerPage
5. **Optimizar para móvil**: El selector es responsive

================================================================================
*/