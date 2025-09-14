// src/lib/templates/dynamic-mapper.ts
// 🔄 MAPPER ENTRE SISTEMA EXISTENTE Y DINÁMICO

import { IndustryTemplate, getTemplateById, INDUSTRY_TEMPLATES } from './industry-templates';

// Tipo simplificado para dynamic templates
export interface SimpleDynamicTemplate {
  id: string;
  displayName: string;
  description: string;
  productsPerPage: number;
  layout: {
    columns: number;
    rows: number;
    spacing: 'tight' | 'normal' | 'loose';
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
    typography: {
      titleSize: string;
      bodySize: string;
      fontFamily: string;
    };
  };
  pdfConfig: {
    pageSize: 'A4' | 'Letter';
    margin: number;
    quality: 'standard' | 'high';
    dpi: number;
  };
  supportsDynamic: boolean;
  isPremium: boolean;
  recommendedFor: string;
}

/**
 * 🎨 MAPPER DE TEMPLATES DINÁMICOS
 */
export class TemplateDynamicMapper {
  
  /**
   * Convierte template existente a formato dinámico
   */
  static convertToDynamicTemplate(template: IndustryTemplate): SimpleDynamicTemplate {
    const spacing = this.mapSpacingToLayoutSpacing(template.design?.spacing || 'normal');
    const typography = this.calculateTypographyForDensity(template.density);
    
    return {
      id: template.id,
      displayName: template.displayName,
      description: template.description,
      productsPerPage: template.productsPerPage,
      
      layout: {
        columns: template.gridColumns || Math.ceil(Math.sqrt(template.productsPerPage)),
        rows: Math.ceil(template.productsPerPage / (template.gridColumns || Math.ceil(Math.sqrt(template.productsPerPage)))),
        spacing,
        orientation: 'portrait'
      },
      
      theme: {
        colors: {
          primary: template.colors.primary,
          secondary: template.colors.secondary,
          accent: template.colors.accent || template.colors.primary,
          background: template.colors.background || '#ffffff',
          text: template.colors.text || '#000000'
        },
        typography
      },
      
      pdfConfig: {
        pageSize: 'A4',
        margin: this.calculateMarginForDensity(template.density),
        quality: template.isPremium ? 'high' : 'standard',
        dpi: template.isPremium ? 300 : 200
      },
      
      supportsDynamic: true,
      isPremium: template.isPremium,
      recommendedFor: this.getRecommendedForText(template.productsPerPage)
    };
  }
  
  /**
   * Mapear spacing string a layout spacing
   */
  private static mapSpacingToLayoutSpacing(spacing: string): 'tight' | 'normal' | 'loose' {
    switch (spacing.toLowerCase()) {
      case 'tight':
      case 'compact':
        return 'tight';
      case 'loose':
      case 'spacious':
        return 'loose';
      default:
        return 'normal';
    }
  }
  
  /**
   * Calcular tipografía basada en densidad
   */
  private static calculateTypographyForDensity(density: string): { titleSize: string; bodySize: string; fontFamily: string } {
    switch (density) {
      case 'alta':
        return {
          titleSize: '14px',
          bodySize: '11px',
          fontFamily: 'Inter, -apple-system, sans-serif'
        };
      case 'media':
        return {
          titleSize: '16px',
          bodySize: '12px',
          fontFamily: 'Inter, -apple-system, sans-serif'
        };
      case 'baja':
        return {
          titleSize: '18px',
          bodySize: '14px',
          fontFamily: 'Inter, -apple-system, sans-serif'
        };
      default:
        return {
          titleSize: '16px',
          bodySize: '12px',
          fontFamily: 'Inter, -apple-system, sans-serif'
        };
    }
  }
  
  /**
   * Calcular margen basado en densidad
   */
  private static calculateMarginForDensity(density: string): number {
    switch (density) {
      case 'alta':
        return 15; // mm
      case 'media':
        return 20; // mm
      case 'baja':
        return 25; // mm
      default:
        return 20; // mm
    }
  }
  
  /**
   * Texto recomendado basado en productos por página
   */
  private static getRecommendedForText(productsPerPage: number): string {
    if (productsPerPage <= 3) return 'productos premium con mucho detalle';
    if (productsPerPage <= 6) return 'catálogos estándar equilibrados';
    if (productsPerPage <= 9) return 'catálogos densos con múltiples opciones';
    return 'alta densidad para máxima información';
  }
}

/**
 * 🎯 FUNCIÓN PRINCIPAL PARA OBTENER TEMPLATE DINÁMICO
 */
export const getDynamicTemplate = (templateId: string): SimpleDynamicTemplate | null => {
  const template = getTemplateById(templateId);
  
  if (!template) {
    console.warn(`Template ${templateId} no encontrado`);
    return null;
  }
  
  return TemplateDynamicMapper.convertToDynamicTemplate(template);
};

/**
 * 📋 OBTENER TODOS LOS TEMPLATES DINÁMICOS
 */
export const getAllDynamicTemplates = (): SimpleDynamicTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES)
    .flat()
    .map(template => TemplateDynamicMapper.convertToDynamicTemplate(template));
};

/**
 * 🔍 FILTRAR TEMPLATES POR INDUSTRIA EN FORMATO DINÁMICO
 */
export const getDynamicTemplatesByIndustry = (industry: string): SimpleDynamicTemplate[] => {
  const industryTemplates = INDUSTRY_TEMPLATES[industry as keyof typeof INDUSTRY_TEMPLATES];
  
  // Asegurar que siempre trabajamos con un array
  if (!industryTemplates) {
    return [];
  }
  
  // Si es un solo template (no array), convertirlo a array
  const templatesArray = Array.isArray(industryTemplates) ? industryTemplates : [industryTemplates];
  
  return templatesArray.map(template => TemplateDynamicMapper.convertToDynamicTemplate(template));
};

/**
 * ⚡ OBTENER TEMPLATES RECOMENDADOS PARA CANTIDAD DE PRODUCTOS
 */
export const getRecommendedTemplatesForProductCount = (productCount: number): SimpleDynamicTemplate[] => {
  const allTemplates = getAllDynamicTemplates();
  
  // Lógica de recomendación basada en cantidad de productos
  if (productCount <= 10) {
    // Pocos productos: recomendar baja densidad (menos productos por página)
    return allTemplates.filter(t => t.productsPerPage <= 4).slice(0, 6);
  } else if (productCount <= 50) {
    // Productos medianos: recomendar densidad media
    return allTemplates.filter(t => t.productsPerPage >= 4 && t.productsPerPage <= 8).slice(0, 6);
  } else {
    // Muchos productos: recomendar alta densidad
    return allTemplates.filter(t => t.productsPerPage >= 6).slice(0, 6);
  }
};