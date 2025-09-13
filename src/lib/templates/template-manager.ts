// src/lib/templates/template-manager.ts
// 🎨 SISTEMA DE GESTIÓN DE TEMPLATES - FÁCIL PARA AGREGAR NUEVOS

import { IndustryTemplate, IndustryType, ProductDensity } from './industry-templates';
import { DynamicTemplate } from '../pdf/dynamic-template-engine';

// ===== TIPOS PARA GESTIÓN =====

export type TemplateCategory = 'core' | 'seasonal' | 'thematic' | 'premium' | 'experimental';
export type SeasonalPeriod = 'spring' | 'summer' | 'fall' | 'winter' | 'christmas' | 'valentine' | 'halloween' | 'easter';

export interface TemplateDefinition {
  // Básico
  id: string;
  displayName: string;
  description: string;
  category: TemplateCategory;
  
  // Classificación
  industry: IndustryType;
  density: ProductDensity;
  isPremium: boolean;
  
  // Específico para temáticos/estacionales
  seasonal?: SeasonalPeriod;
  availableFrom?: string; // ISO date
  availableUntil?: string; // ISO date
  
  // Configuración visual simplificada
  config: TemplateConfig;
}

interface TemplateConfig {
  // Colores principales (los demás se generan automáticamente)
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  
  // Estilo visual
  style: 'elegant' | 'modern' | 'vintage' | 'minimal' | 'bold' | 'festive';
  
  // Configuración específica
  borderRadius?: number;
  showShadows?: boolean;
  spacing?: 'tight' | 'normal' | 'loose';
  
  // Información a mostrar (si no se especifica, usa defaults por industria)
  showInfo?: {
    description?: boolean;
    sku?: boolean;
    category?: boolean;
    specifications?: boolean;
  };
}

// ===== BUILDER PARA NUEVOS TEMPLATES =====

export class TemplateBuilder {
  private template: Partial<TemplateDefinition> = {};
  
  // Información básica
  setBasicInfo(id: string, displayName: string, description: string): TemplateBuilder {
    this.template.id = id;
    this.template.displayName = displayName;
    this.template.description = description;
    return this;
  }
  
  // Categoría y clasificación
  setCategory(category: TemplateCategory): TemplateBuilder {
    this.template.category = category;
    return this;
  }
  
  // Industria y densidad
  setIndustryAndDensity(industry: IndustryType, density: ProductDensity): TemplateBuilder {
    this.template.industry = industry;
    this.template.density = density;
    return this;
  }
  
  // Premium
  setPremium(isPremium: boolean = true): TemplateBuilder {
    this.template.isPremium = isPremium;
    return this;
  }
  
  // Para templates estacionales
  setSeasonal(period: SeasonalPeriod, availableFrom?: string, availableUntil?: string): TemplateBuilder {
    this.template.seasonal = period;
    if (availableFrom) this.template.availableFrom = availableFrom;
    if (availableUntil) this.template.availableUntil = availableUntil;
    return this;
  }
  
  // Configuración de estilo
  setStyle(style: TemplateConfig['style'], primaryColor: string): TemplateBuilder {
    if (!this.template.config) this.template.config = { primaryColor, style };
    else {
      this.template.config.style = style;
      this.template.config.primaryColor = primaryColor;
    }
    return this;
  }
  
  // Colores adicionales
  setColors(secondary?: string, accent?: string): TemplateBuilder {
    if (this.template.config) {
      this.template.config.secondaryColor = secondary;
      this.template.config.accentColor = accent;
    }
    return this;
  }
  
  // Configuración visual
  setVisualConfig(borderRadius?: number, showShadows?: boolean, spacing?: 'tight' | 'normal' | 'loose'): TemplateBuilder {
    if (this.template.config) {
      this.template.config.borderRadius = borderRadius;
      this.template.config.showShadows = showShadows;
      this.template.config.spacing = spacing;
    }
    return this;
  }
  
  // Información a mostrar
  setShowInfo(showInfo: TemplateConfig['showInfo']): TemplateBuilder {
    if (this.template.config) {
      this.template.config.showInfo = showInfo;
    }
    return this;
  }
  
  // Build final
  build(): TemplateDefinition {
    if (!this.isValid()) {
      throw new Error('Template definition incompleto. Faltan campos requeridos.');
    }
    return this.template as TemplateDefinition;
  }
  
  private isValid(): boolean {
    return !!(
      this.template.id &&
      this.template.displayName &&
      this.template.description &&
      this.template.category &&
      this.template.industry &&
      this.template.density &&
      this.template.config
    );
  }
}

// ===== FACTORY DE TEMPLATES =====

export class TemplateFactory {
  
  /**
   * 🎄 CREAR TEMPLATE ESTACIONAL NAVIDEÑO
   */
  static createChristmasTemplate(industry: IndustryType, density: ProductDensity = 'media'): TemplateDefinition {
    return new TemplateBuilder()
      .setBasicInfo(
        `${industry}-christmas-2025`,
        `Navidad ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        `Template navideño especial para ${industry} con decoraciones festivas`
      )
      .setCategory('seasonal')
      .setIndustryAndDensity(industry, density)
      .setSeasonal('christmas', '2024-11-15', '2025-01-07')
      .setStyle('festive', '#C41E3A') // Rojo navideño
      .setColors('#228B22', '#FFD700') // Verde y dorado
      .setVisualConfig(20, true, 'normal')
      .build();
  }
  
  /**
   * 💖 CREAR TEMPLATE DE SAN VALENTÍN
   */
  static createValentinesTemplate(industry: IndustryType, density: ProductDensity = 'media'): TemplateDefinition {
    return new TemplateBuilder()
      .setBasicInfo(
        `${industry}-valentine-2025`,
        `San Valentín ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        `Template romántico para San Valentín con colores cálidos`
      )
      .setCategory('seasonal')
      .setIndustryAndDensity(industry, density)
      .setSeasonal('valentine', '2025-01-20', '2025-02-20')
      .setStyle('elegant', '#FF1493') // Rosa fuerte
      .setColors('#FFC0CB', '#DC143C') // Rosa claro y rojo
      .setVisualConfig(25, true, 'loose')
      .build();
  }
  
  /**
   * 🌸 CREAR TEMPLATE PRIMAVERAL
   */
  static createSpringTemplate(industry: IndustryType, density: ProductDensity = 'media'): TemplateDefinition {
    return new TemplateBuilder()
      .setBasicInfo(
        `${industry}-spring-2025`,
        `Primavera ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        `Template primaveral con colores frescos y naturales`
      )
      .setCategory('seasonal')
      .setIndustryAndDensity(industry, density)
      .setSeasonal('spring', '2025-03-01', '2025-06-01')
      .setStyle('modern', '#32CD32') // Verde limón
      .setColors('#98FB98', '#FFB6C1') // Verde claro y rosa claro
      .setVisualConfig(15, true, 'normal')
      .build();
  }
  
  /**
   * 🎃 CREAR TEMPLATE DE HALLOWEEN
   */
  static createHalloweenTemplate(industry: IndustryType, density: ProductDensity = 'alta'): TemplateDefinition {
    return new TemplateBuilder()
      .setBasicInfo(
        `${industry}-halloween-2025`,
        `Halloween ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        `Template de Halloween con colores oscuros y misterioso`
      )
      .setCategory('seasonal')
      .setIndustryAndDensity(industry, density)
      .setSeasonal('halloween', '2025-09-15', '2025-11-05')
      .setStyle('bold', '#FF8C00') // Naranja Halloween
      .setColors('#000000', '#8B0000') // Negro y rojo oscuro
      .setVisualConfig(5, true, 'tight')
      .build();
  }
  
  /**
   * 💎 CREAR TEMPLATE PREMIUM LUXURY
   */
  static createLuxuryTemplate(industry: IndustryType, density: ProductDensity = 'baja'): TemplateDefinition {
    return new TemplateBuilder()
      .setBasicInfo(
        `${industry}-luxury-premium`,
        `Luxury ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        `Template premium de lujo con acabados dorados`
      )
      .setCategory('premium')
      .setIndustryAndDensity(industry, density)
      .setPremium(true)
      .setStyle('elegant', '#FFD700') // Dorado
      .setColors('#000000', '#C0C0C0') // Negro y plata
      .setVisualConfig(12, true, 'loose')
      .build();
  }
  
  /**
   * 🎨 CREAR TEMPLATE MINIMALISTA
   */
  static createMinimalTemplate(industry: IndustryType, density: ProductDensity): TemplateDefinition {
    return new TemplateBuilder()
      .setBasicInfo(
        `${industry}-minimal-clean`,
        `Minimal ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
        `Template minimalista y limpio para productos modernos`
      )
      .setCategory('thematic')
      .setIndustryAndDensity(industry, density)
      .setStyle('minimal', '#2C3E50') // Gris oscuro
      .setColors('#ECF0F1', '#3498DB') // Gris claro y azul
      .setVisualConfig(0, false, 'loose')
      .setShowInfo({ description: false, sku: true, category: false, specifications: false })
      .build();
  }
}

// ===== CONVERTIDOR A FORMATO EXISTENTE =====

export class TemplateConverter {
  
  /**
   * Convierte TemplateDefinition a IndustryTemplate (formato existente)
   */
  static toIndustryTemplate(definition: TemplateDefinition): IndustryTemplate {
    const densityConfig = this.getDensityConfig(definition.density);
    const colors = this.generateColorPalette(definition.config);
    
    return {
      id: definition.id,
      name: definition.id,
      displayName: definition.displayName,
      description: definition.description,
      industry: definition.industry,
      density: definition.density,
      isPremium: definition.isPremium,
      
      productsPerPage: densityConfig.productsPerPage,
      gridColumns: densityConfig.gridColumns,
      imageSize: densityConfig.imageSize,
      
      colors,
      
      design: {
        borderRadius: definition.config.borderRadius ?? this.getDefaultBorderRadius(definition.config.style),
        shadows: definition.config.showShadows ?? true,
        spacing: this.mapSpacing(definition.config.spacing) || 'normal'
      },
      
      showInfo: {
        description: definition.config.showInfo?.description ?? this.getDefaultShowInfo(definition.industry).description,
        sku: definition.config.showInfo?.sku ?? this.getDefaultShowInfo(definition.industry).sku,
        category: definition.config.showInfo?.category ?? this.getDefaultShowInfo(definition.industry).category,
        specifications: definition.config.showInfo?.specifications ?? this.getDefaultShowInfo(definition.industry).specifications
      }
    };
  }
  
  /**
   * Convierte TemplateDefinition a DynamicTemplate (formato dinámico)
   */
  static toDynamicTemplate(definition: TemplateDefinition): DynamicTemplate {
    const densityConfig = this.getDensityConfig(definition.density);
    const colors = this.generateColorPalette(definition.config);
    
    return {
      id: definition.id,
      displayName: definition.displayName,
      description: definition.description,
      
      productsPerPage: densityConfig.productsPerPage,
      
      layout: {
        columns: densityConfig.gridColumns,
        rows: Math.ceil(densityConfig.productsPerPage / densityConfig.gridColumns),
        spacing: this.mapToLayoutSpacing(definition.config.spacing),
        orientation: 'portrait'
      },
      
      theme: {
        colors: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
          background: colors.background,
          text: colors.text
        },
        icons: this.generateIconsForIndustryAndSeason(definition.industry, definition.seasonal),
        typography: this.getTypographyForDensity(definition.density)
      },
      
      pdfConfig: {
        pageSize: 'A4',
        margin: this.getMarginForDensity(definition.density),
        quality: definition.isPremium ? 0.95 : 0.90
      },
      
      features: {
        showProductIcons: this.shouldShowIconsForStyle(definition.config.style),
        showDescriptions: definition.config.showInfo?.description ?? true,
        showSKU: definition.config.showInfo?.sku ?? false,
        showCategories: definition.config.showInfo?.category ?? true,
        premiumLayout: definition.isPremium
      }
    };
  }
  
  // Helpers privados
  
  private static getDensityConfig(density: ProductDensity) {
    const configs = {
      alta: { productsPerPage: 12, gridColumns: 4, imageSize: { width: 180, height: 180 } },
      media: { productsPerPage: 6, gridColumns: 3, imageSize: { width: 250, height: 250 } },
      baja: { productsPerPage: 3, gridColumns: 3, imageSize: { width: 300, height: 300 } }
    };
    return configs[density];
  }
  
  private static generateColorPalette(config: TemplateConfig) {
    const primary = config.primaryColor;
    const secondary = config.secondaryColor || this.generateSecondaryColor(primary, config.style);
    const accent = config.accentColor || this.generateAccentColor(primary, config.style);
    
    return {
      primary,
      secondary,
      accent,
      background: this.generateBackgroundColor(config.style),
      text: this.generateTextColor(config.style),
      cardBackground: '#FFFFFF'
    };
  }
  
  private static generateSecondaryColor(primary: string, style: string): string {
    // Lógica para generar color secundario basado en el primario y estilo
    const styleMap = {
      elegant: this.lightenColor(primary, 0.8),
      modern: this.adjustHue(primary, 30),
      vintage: this.darkenColor(primary, 0.3),
      minimal: '#ECF0F1',
      bold: this.complementaryColor(primary),
      festive: this.lightenColor(primary, 0.6)
    };
    return styleMap[style] || this.lightenColor(primary, 0.5);
  }
  
  private static generateAccentColor(primary: string, style: string): string {
    // Lógica para generar color de acento
    const styleMap = {
      elegant: '#D4AF37', // Dorado
      modern: '#3498DB',  // Azul
      vintage: '#8B4513', // Marrón
      minimal: '#3498DB', // Azul
      bold: '#E74C3C',    // Rojo
      festive: '#FFD700'  // Dorado
    };
    return styleMap[style] || '#FF9800';
  }
  
  private static generateBackgroundColor(style: string): string {
    const backgrounds = {
      elegant: '#FFFEF7',
      modern: '#FAFAFA',
      vintage: '#FDF5E6',
      minimal: '#FFFFFF',
      bold: '#F5F5F5',
      festive: '#FFF8DC'
    };
    return backgrounds[style] || '#FFFFFF';
  }
  
  private static generateTextColor(style: string): string {
    const textColors = {
      elegant: '#2C1810',
      modern: '#212121',
      vintage: '#654321',
      minimal: '#2C3E50',
      bold: '#1A1A1A',
      festive: '#8B4513'
    };
    return textColors[style] || '#2C3E50';
  }
  
  // Utilidades de color (implementación básica)
  private static lightenColor(color: string, factor: number): string {
    // Implementación básica - en producción usar una librería como chroma.js
    return color; // Placeholder
  }
  
  private static darkenColor(color: string, factor: number): string {
    return color; // Placeholder
  }
  
  private static adjustHue(color: string, degrees: number): string {
    return color; // Placeholder
  }
  
  private static complementaryColor(color: string): string {
    return color; // Placeholder
  }
  
  private static getDefaultBorderRadius(style: string): number {
    const radiusMap = { elegant: 15, modern: 8, vintage: 20, minimal: 0, bold: 5, festive: 25 };
    return radiusMap[style] || 8;
  }
  
  private static mapSpacing(spacing?: string): 'compacto' | 'normal' | 'amplio' {
    const map = { tight: 'compacto', normal: 'normal', loose: 'amplio' };
    return map[spacing] || 'normal';
  }
  
  private static mapToLayoutSpacing(spacing?: string): 'tight' | 'normal' | 'loose' | 'luxury' {
    return spacing as any || 'normal';
  }
  
  private static generateIconsForIndustryAndSeason(industry: IndustryType, seasonal?: SeasonalPeriod) {
    // Iconos base por industria
    const baseIcons = this.getBaseIconsForIndustry(industry);
    
    // Iconos estacionales
    if (seasonal) {
      const seasonalIcons = this.getSeasonalIcons(seasonal);
      return {
        header: seasonalIcons.header,
        productIcons: [...seasonalIcons.productIcons, ...baseIcons.productIcons].slice(0, 12),
        decorative: seasonalIcons.decorative
      };
    }
    
    return baseIcons;
  }
  
  private static getBaseIconsForIndustry(industry: IndustryType) {
    // Implementar iconos por industria
    return { header: '🏪', productIcons: ['📦'], decorative: ['🔸'] };
  }
  
  private static getSeasonalIcons(seasonal: SeasonalPeriod) {
    const seasonalIconsMap = {
      christmas: { header: '🎄', productIcons: ['🎁', '❄️', '⭐', '🔔'], decorative: ['✨', '🌟'] },
      valentine: { header: '💖', productIcons: ['💝', '🌹', '💋', '💕'], decorative: ['💖', '🌹'] },
      spring: { header: '🌸', productIcons: ['🌺', '🦋', '🌿', '☀️'], decorative: ['🌸', '🦋'] },
      halloween: { header: '🎃', productIcons: ['👻', '🦇', '🕷️', '🍬'], decorative: ['🎃', '👻'] },
      summer: { header: '☀️', productIcons: ['🏖️', '🌊', '🍉', '🕶️'], decorative: ['☀️', '🌊'] },
      fall: { header: '🍂', productIcons: ['🍁', '🌰', '🍄', '🦔'], decorative: ['🍂', '🍁'] },
      winter: { header: '❄️', productIcons: ['⛄', '🧣', '🔥', '☃️'], decorative: ['❄️', '⛄'] },
      easter: { header: '🐰', productIcons: ['🥚', '🐣', '🌷', '🐰'], decorative: ['🐰', '🥚'] }
    };
    return seasonalIconsMap[seasonal] || seasonalIconsMap.spring;
  }
  
  private static getTypographyForDensity(density: ProductDensity) {
    const typography = {
      alta: { headerSize: '28px', productNameSize: '14px', priceSize: '16px' },
      media: { headerSize: '32px', productNameSize: '18px', priceSize: '20px' },
      baja: { headerSize: '36px', productNameSize: '22px', priceSize: '24px' }
    };
    return typography[density];
  }
  
  private static getMarginForDensity(density: ProductDensity): number {
    const margins = { alta: 0.5, media: 0.75, baja: 1.0 };
    return margins[density];
  }
  
  private static shouldShowIconsForStyle(style: string): boolean {
    const iconStyles = ['festive', 'elegant', 'vintage'];
    return iconStyles.includes(style);
  }
  
  private static getDefaultShowInfo(industry: IndustryType) {
    const industryDefaults = {
      joyeria: { description: false, sku: true, category: false, specifications: false },
      moda: { description: true, sku: false, category: true, specifications: false },
      electronica: { description: true, sku: true, category: true, specifications: true },
      ferreteria: { description: true, sku: true, category: true, specifications: true },
      floreria: { description: true, sku: false, category: false, specifications: false },
      cosmeticos: { description: true, sku: false, category: true, specifications: false },
      decoracion: { description: true, sku: false, category: true, specifications: false },
      muebles: { description: true, sku: true, category: true, specifications: true }
    };
    return industryDefaults[industry] || { description: true, sku: false, category: true, specifications: false };
  }
}

// ===== FUNCIONES DE CONVENIENCIA =====

/**
 * 🚀 CREAR TEMPLATE FÁCILMENTE
 */
export const createTemplate = () => new TemplateBuilder();

/**
 * 🎨 CREAR TEMPLATES ESTACIONALES PARA TODAS LAS INDUSTRIAS
 */
export const createSeasonalTemplatesForAllIndustries = (seasonal: SeasonalPeriod): TemplateDefinition[] => {
  const industries: IndustryType[] = ['joyeria', 'moda', 'electronica', 'ferreteria', 'floreria', 'cosmeticos', 'decoracion', 'muebles'];
  
  return industries.map(industry => {
    switch (seasonal) {
      case 'christmas':
        return TemplateFactory.createChristmasTemplate(industry);
      case 'valentine':
        return TemplateFactory.createValentinesTemplate(industry);
      case 'spring':
        return TemplateFactory.createSpringTemplate(industry);
      case 'halloween':
        return TemplateFactory.createHalloweenTemplate(industry);
      default:
        return TemplateFactory.createSpringTemplate(industry);
    }
  });
};

/**
 * 📦 BATCH DE TEMPLATES LISTOS PARA USAR
 */
export const TEMPLATE_BATCHES = {
  // Templates navideños 2025
  christmas2025: createSeasonalTemplatesForAllIndustries('christmas'),
  
  // Templates de San Valentín 2025
  valentine2025: createSeasonalTemplatesForAllIndustries('valentine'),
  
  // Templates de Primavera 2025
  spring2025: createSeasonalTemplatesForAllIndustries('spring'),
  
  // Templates de Halloween 2025
  halloween2025: createSeasonalTemplatesForAllIndustries('halloween')
};

export default TemplateBuilder;