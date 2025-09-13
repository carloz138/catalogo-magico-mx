// src/lib/templates/dynamic-mapper.ts
// 🔄 MAPPER ENTRE SISTEMA EXISTENTE Y DINÁMICO

import { IndustryTemplate, INDUSTRY_TEMPLATES } from './industry-templates';
import { DynamicTemplate } from '../pdf/dynamic-template-engine';

/**
 * 🎨 CONVERSIÓN AUTOMÁTICA DE TEMPLATES EXISTENTES A DINÁMICOS
 */
export class TemplateDynamicMapper {
  
  /**
   * Convierte un template existente al formato dinámico
   */
  static convertToDynamicTemplate(existingTemplate: IndustryTemplate): DynamicTemplate {
    const dynamicTemplate: DynamicTemplate = {
      id: existingTemplate.id,
      displayName: existingTemplate.displayName,
      description: existingTemplate.description,
      
      // MAPEO DIRECTO DE DENSIDAD A PRODUCTOS POR PÁGINA
      productsPerPage: existingTemplate.productsPerPage,
      
      // LAYOUT CALCULADO AUTOMÁTICAMENTE
      layout: {
        columns: existingTemplate.gridColumns,
        rows: Math.ceil(existingTemplate.productsPerPage / existingTemplate.gridColumns),
        spacing: this.mapSpacingToLayoutSpacing(existingTemplate.design.spacing),
        orientation: 'portrait' // Default, puede ser customizado
      },
      
      // TEMA VISUAL CONVERTIDO
      theme: {
        colors: {
          primary: existingTemplate.colors.primary,
          secondary: existingTemplate.colors.secondary,
          accent: existingTemplate.colors.accent,
          background: existingTemplate.colors.background,
          text: existingTemplate.colors.text
        },
        icons: this.generateIconsForIndustry(existingTemplate.industry),
        typography: this.calculateTypographyForDensity(existingTemplate.density)
      },
      
      // CONFIGURACIÓN PDF INTELIGENTE
      pdfConfig: {
        pageSize: 'A4',
        margin: this.calculateMarginForDensity(existingTemplate.density),
        quality: existingTemplate.isPremium ? 0.95 : 0.90
      },
      
      // CARACTERÍSTICAS CONVERTIDAS
      features: {
        showProductIcons: this.shouldShowIconsForIndustry(existingTemplate.industry),
        showDescriptions: existingTemplate.showInfo.description,
        showSKU: existingTemplate.showInfo.sku,
        showCategories: existingTemplate.showInfo.category,
        premiumLayout: existingTemplate.isPremium
      }
    };
    
    return dynamicTemplate;
  }
  
  /**
   * Mapea spacing del sistema existente al dinámico
   */
  private static mapSpacingToLayoutSpacing(spacing: 'compacto' | 'normal' | 'amplio'): 'tight' | 'normal' | 'loose' | 'luxury' {
    const spacingMap = {
      'compacto': 'tight' as const,
      'normal': 'normal' as const,
      'amplio': 'loose' as const
    };
    return spacingMap[spacing];
  }
  
  /**
   * Genera iconos temáticos por industria
   */
  private static generateIconsForIndustry(industry: string): {
    header: string;
    productIcons: string[];
    decorative: string[];
  } {
    const industryIcons = {
      joyeria: {
        header: '💎',
        productIcons: ['💍', '📿', '💎', '⭐', '✨', '🌟', '💫', '🔸', '🔹', '🔶', '🔷', '💠'],
        decorative: ['✨', '🌟', '⭐', '💫']
      },
      moda: {
        header: '👗',
        productIcons: ['👗', '👔', '👚', '🧥', '👖', '👠', '👜', '🕶️', '⌚', '👒', '🧣', '🧤'],
        decorative: ['🦋', '🌸', '💝', '🎀']
      },
      electronica: {
        header: '📱',
        productIcons: ['📱', '💻', '📺', '🎧', '📷', '⌚', '🖥️', '🖱️', '⌨️', '🔌', '🔋', '📟'],
        decorative: ['⚡', '🔸', '🔹', '💡']
      },
      ferreteria: {
        header: '🔧',
        productIcons: ['🔧', '🔨', '🪚', '⚒️', '🛠️', '⚙️', '🔩', '📏', '📐', '🪜', '⛏️', '🪓'],
        decorative: ['🔸', '🔹', '⚫', '🟠']
      },
      floreria: {
        header: '🌸',
        productIcons: ['🌸', '🌹', '🌺', '🌻', '🌷', '🌼', '💐', '🌿', '🌱', '🌵', '🌴', '🍃'],
        decorative: ['🦋', '🌈', '☀️', '🌙']
      },
      cosmeticos: {
        header: '💄',
        productIcons: ['💄', '💋', '👄', '🪞', '🧴', '🧼', '🛁', '💅', '👂', '👁️', '👃', '💆'],
        decorative: ['✨', '💖', '🌸', '💫']
      },
      decoracion: {
        header: '🏠',
        productIcons: ['🏠', '🪑', '🛋️', '🛏️', '🚪', '🪟', '🕯️', '🖼️', '🪴', '🕰️', '🧸', '🎨'],
        decorative: ['🌟', '🔸', '🔹', '🏡']
      },
      muebles: {
        header: '🪑',
        productIcons: ['🪑', '🛋️', '🛏️', '📚', '🗂️', '🪞', '🗃️', '📦', '🧺', '🪣', '🗑️', '🧹'],
        decorative: ['🏡', '🔸', '🔹', '📐']
      }
    };
    
    return industryIcons[industry] || industryIcons['decoracion'];
  }
  
  /**
   * Calcula tipografía según densidad
   */
  private static calculateTypographyForDensity(density: 'alta' | 'media' | 'baja'): {
    headerSize: string;
    productNameSize: string;
    priceSize: string;
  } {
    const typographyMap = {
      'alta': {      // 12 productos - texto pequeño
        headerSize: '28px',
        productNameSize: '14px',
        priceSize: '16px'
      },
      'media': {     // 6 productos - texto medio
        headerSize: '32px',
        productNameSize: '18px',
        priceSize: '20px'
      },
      'baja': {      // 3 productos - texto grande
        headerSize: '36px',
        productNameSize: '22px',
        priceSize: '24px'
      }
    };
    
    return typographyMap[density];
  }
  
  /**
   * Calcula márgenes según densidad
   */
  private static calculateMarginForDensity(density: 'alta' | 'media' | 'baja'): number {
    const marginMap = {
      'alta': 0.5,    // Márgenes pequeños para alta densidad
      'media': 0.75,  // Márgenes medianos
      'baja': 1.0     // Márgenes grandes para baja densidad
    };
    
    return marginMap[density];
  }
  
  /**
   * Determina si mostrar iconos según industria
   */
  private static shouldShowIconsForIndustry(industry: string): boolean {
    // Industrias más visuales/creativas usan iconos
    const iconFriendlyIndustries = ['floreria', 'moda', 'cosmeticos', 'decoracion', 'joyeria'];
    return iconFriendlyIndustries.includes(industry);
  }
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL - OBTENER TEMPLATE DINÁMICO
   */
  static getDynamicTemplate(templateId: string): DynamicTemplate | null {
    const existingTemplate = INDUSTRY_TEMPLATES[templateId];
    if (!existingTemplate) {
      console.warn(`Template ${templateId} no encontrado en sistema existente`);
      return null;
    }
    
    return this.convertToDynamicTemplate(existingTemplate);
  }
  
  /**
   * 🔄 CONVERTIR TODOS LOS TEMPLATES A DINÁMICOS
   */
  static convertAllToDynamic(): Record<string, DynamicTemplate> {
    const dynamicTemplates: Record<string, DynamicTemplate> = {};
    
    Object.entries(INDUSTRY_TEMPLATES).forEach(([id, template]) => {
      dynamicTemplates[id] = this.convertToDynamicTemplate(template);
    });
    
    console.log(`✅ Convertidos ${Object.keys(dynamicTemplates).length} templates a formato dinámico`);
    return dynamicTemplates;
  }
  
  /**
   * 📊 ESTADÍSTICAS DE CONVERSIÓN
   */
  static getConversionStats(): {
    totalTemplates: number;
    byDensity: Record<string, number>;
    byIndustry: Record<string, number>;
    withIcons: number;
    premium: number;
  } {
    const allTemplates = Object.values(INDUSTRY_TEMPLATES);
    
    const stats = {
      totalTemplates: allTemplates.length,
      byDensity: {
        alta: allTemplates.filter(t => t.density === 'alta').length,
        media: allTemplates.filter(t => t.density === 'media').length,
        baja: allTemplates.filter(t => t.density === 'baja').length
      },
      byIndustry: allTemplates.reduce((acc, template) => {
        acc[template.industry] = (acc[template.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withIcons: allTemplates.filter(t => this.shouldShowIconsForIndustry(t.industry)).length,
      premium: allTemplates.filter(t => t.isPremium).length
    };
    
    return stats;
  }
}

/**
 * 🚀 FUNCIÓN DE CONVENIENCIA PARA COMPONENTES
 */
export const getDynamicTemplate = (templateId: string): DynamicTemplate | null => {
  return TemplateDynamicMapper.getDynamicTemplate(templateId);
};

/**
 * 🎨 OBTENER TODOS LOS TEMPLATES DINÁMICOS
 */
export const getAllDynamicTemplates = (): Record<string, DynamicTemplate> => {
  return TemplateDynamicMapper.convertAllToDynamic();
};

export default TemplateDynamicMapper;