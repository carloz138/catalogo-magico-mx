// src/hooks/useProductsPerPage.ts
// 🎯 HOOK PERSONALIZADO PARA MANEJAR PRODUCTOS POR PÁGINA

import { useState, useEffect, useCallback } from 'react';

export type ProductsPerPageOption = 4 | 6 | 9;

interface UseProductsPerPageProps {
  totalProducts: number;
  initialValue?: ProductsPerPageOption;
  autoSuggest?: boolean;
}

interface UseProductsPerPageReturn {
  productsPerPage: ProductsPerPageOption;
  setProductsPerPage: (count: ProductsPerPageOption) => void;
  totalPages: number;
  layoutInfo: {
    columns: number;
    rows: number;
    cardSize: 'large' | 'medium' | 'small';
    optimization: string;
    description: string;
  };
  suggestions: {
    recommended: ProductsPerPageOption;
    reason: string;
    alternatives: Array<{
      count: ProductsPerPageOption;
      reason: string;
    }>;
  };
  validation: {
    isValid: boolean;
    warnings: string[];
  };
}

export const useProductsPerPage = ({
  totalProducts,
  initialValue,
  autoSuggest = true
}: UseProductsPerPageProps): UseProductsPerPageReturn => {
  
  const [productsPerPage, setProductsPerPageState] = useState<ProductsPerPageOption>(() => {
    if (initialValue) return initialValue;
    
    if (autoSuggest) {
      // 🎯 SUGERENCIA AUTOMÁTICA INTELIGENTE
      if (totalProducts <= 12) return 4;  // Pocos productos -> layout grande
      if (totalProducts >= 60) return 9;  // Muchos productos -> layout compacto
      return 6; // Cantidad media -> layout estándar
    }
    
    return 6; // Default
  });
  
  // 🔧 CALCULAR INFORMACIÓN DE LAYOUT
  const getLayoutInfo = useCallback((count: ProductsPerPageOption) => {
    const layouts = {
      4: {
        columns: 2,
        rows: 2,
        cardSize: 'large' as const,
        optimization: 'Large Cards (2x2) - Maximum Detail',
        description: 'Productos grandes con máximo detalle. Ideal para catálogos premium o productos complejos.'
      },
      6: {
        columns: 3,
        rows: 2,
        cardSize: 'medium' as const,
        optimization: 'Balanced Layout (3x2) - Standard',
        description: 'Balance perfecto entre detalle y cantidad. Recomendado para la mayoría de casos.'
      },
      9: {
        columns: 3,
        rows: 3,
        cardSize: 'small' as const,
        optimization: 'Compact Grid (3x3) - Maximum Content',
        description: 'Máximo contenido por página. Ideal para catálogos extensos o productos simples.'
      }
    };
    
    return layouts[count];
  }, []);
  
  // 🔧 CALCULAR PÁGINAS TOTALES
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  
  // 🔧 GENERAR SUGERENCIAS INTELIGENTES
  const getSuggestions = useCallback((count: ProductsPerPageOption) => {
    let recommended: ProductsPerPageOption = 6;
    let reason = 'Layout balanceado recomendado';
    
    // Lógica inteligente de recomendación
    if (totalProducts <= 8) {
      recommended = 4;
      reason = 'Pocos productos - layout grande maximiza impacto visual';
    } else if (totalProducts >= 9 && totalProducts <= 30) {
      recommended = 6;
      reason = 'Cantidad ideal para layout balanceado';
    } else if (totalProducts >= 31 && totalProducts <= 60) {
      recommended = 6;
      reason = 'Layout estándar eficiente para cantidad media';
    } else if (totalProducts > 60) {
      recommended = 9;
      reason = 'Muchos productos - layout compacto reduce páginas';
    }
    
    // Generar alternativas
    const alternatives: Array<{ count: ProductsPerPageOption; reason: string }> = [];
    
    [4, 6, 9].forEach((option) => {
      if (option !== recommended) {
        const pages = Math.ceil(totalProducts / option);
        const layoutInfo = getLayoutInfo(option as ProductsPerPageOption);
        
        if (option === 4) {
          alternatives.push({
            count: option as ProductsPerPageOption,
            reason: `${pages} páginas con cards grandes - ${layoutInfo.description.split('.')[0]}`
          });
        } else if (option === 6) {
          alternatives.push({
            count: option as ProductsPerPageOption,
            reason: `${pages} páginas balanceadas - ${layoutInfo.description.split('.')[0]}`
          });
        } else if (option === 9) {
          alternatives.push({
            count: option as ProductsPerPageOption,
            reason: `${pages} páginas compactas - ${layoutInfo.description.split('.')[0]}`
          });
        }
      }
    });
    
    return {
      recommended,
      reason,
      alternatives
    };
  }, [totalProducts, getLayoutInfo]);
  
  // 🔧 VALIDACIONES
  const getValidation = useCallback((count: ProductsPerPageOption) => {
    const warnings: string[] = [];
    let isValid = true;
    
    const pages = Math.ceil(totalProducts / count);
    
    // Validaciones específicas
    if (count === 4 && totalProducts > 40) {
      warnings.push(`Con ${count} productos/página tendrás ${pages} páginas. Considera usar 6 o 9 productos/página para menos páginas.`);
    }
    
    if (count === 9 && totalProducts < 18) {
      warnings.push(`Con solo ${totalProducts} productos, el layout de 9/página puede verse muy espacioso. Considera usar 4 o 6 productos/página.`);
    }
    
    if (totalProducts < count) {
      warnings.push(`Solo tienes ${totalProducts} productos pero elegiste ${count}/página. La página se verá incompleta.`);
    }
    
    if (pages > 50) {
      warnings.push(`${pages} páginas es un catálogo muy extenso. Considera dividir en múltiples catálogos por categorías.`);
      isValid = false;
    }
    
    // Validación de eficiencia
    const efficiency = (totalProducts % count) / count;
    if (efficiency > 0 && efficiency < 0.3) {
      warnings.push(`La última página tendrá solo ${totalProducts % count} productos de ${count}. Puede verse desbalanceada.`);
    }
    
    return {
      isValid,
      warnings
    };
  }, [totalProducts]);
  
  // 🔧 FUNCIÓN PARA CAMBIAR PRODUCTOS POR PÁGINA CON VALIDACIÓN
  const setProductsPerPage = useCallback((count: ProductsPerPageOption) => {
    const validation = getValidation(count);
    
    // Permitir el cambio pero avisar si hay warnings
    setProductsPerPageState(count);
    
    if (validation.warnings.length > 0) {
      console.warn(`Advertencias para ${count} productos/página:`, validation.warnings);
    }
    
    console.log(`📋 Productos por página actualizado a: ${count}`, {
      totalPages: Math.ceil(totalProducts / count),
      layout: getLayoutInfo(count),
      validation
    });
  }, [totalProducts, getValidation, getLayoutInfo]);
  
  // 🔧 AUTO-SUGERIR EN CAMBIOS DE TOTAL DE PRODUCTOS
  useEffect(() => {
    if (autoSuggest && totalProducts > 0) {
      const suggestions = getSuggestions(productsPerPage);
      
      // Solo auto-cambiar si hay una gran diferencia
      if (suggestions.recommended !== productsPerPage) {
        const currentPages = Math.ceil(totalProducts / productsPerPage);
        const recommendedPages = Math.ceil(totalProducts / suggestions.recommended);
        
        // Cambiar automáticamente si la diferencia es significativa
        if (Math.abs(currentPages - recommendedPages) >= 3) {
          console.log(`🎯 Auto-ajustando de ${productsPerPage} a ${suggestions.recommended} productos/página:`, suggestions.reason);
          setProductsPerPageState(suggestions.recommended);
        }
      }
    }
  }, [totalProducts, autoSuggest, productsPerPage, getSuggestions]);
  
  return {
    productsPerPage,
    setProductsPerPage,
    totalPages,
    layoutInfo: getLayoutInfo(productsPerPage),
    suggestions: getSuggestions(productsPerPage),
    validation: getValidation(productsPerPage)
  };
};

// 🔧 UTILIDADES ADICIONALES
export const calculateOptimalProductsPerPage = (totalProducts: number): ProductsPerPageOption => {
  if (totalProducts <= 12) return 4;
  if (totalProducts >= 60) return 9;
  return 6;
};

export const getLayoutDescription = (productsPerPage: ProductsPerPageOption): string => {
  const descriptions = {
    4: 'Layout Premium - Cards grandes con máximo detalle para impacto visual',
    6: 'Layout Estándar - Balance perfecto entre detalle y cantidad de productos',
    9: 'Layout Compacto - Máximo contenido por página para catálogos extensos'
  };
  
  return descriptions[productsPerPage];
};

export const getProductsPerPageMetrics = (productsPerPage: ProductsPerPageOption, totalProducts: number) => {
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const lastPageProducts = totalProducts % productsPerPage || productsPerPage;
  const efficiency = (lastPageProducts / productsPerPage) * 100;
  
  return {
    totalPages,
    lastPageProducts,
    efficiency: Math.round(efficiency),
    averageProductsPerPage: totalProducts / totalPages,
    isLastPageEfficient: efficiency >= 50
  };
};

// 🔧 HOOK SIMPLIFICADO PARA CASOS BÁSICOS
export const useSimpleProductsPerPage = (totalProducts: number) => {
  const {
    productsPerPage,
    setProductsPerPage,
    totalPages,
    layoutInfo
  } = useProductsPerPage({
    totalProducts,
    autoSuggest: true
  });
  
  return {
    productsPerPage,
    setProductsPerPage,
    totalPages,
    layoutName: layoutInfo.cardSize === 'large' ? 'Grande' : 
                layoutInfo.cardSize === 'medium' ? 'Estándar' : 'Compacto'
  };
};