// src/lib/templates/css-generator.ts - VERSIÓN CON PRODUCTOS POR PÁGINA DINÁMICOS

import { IndustryTemplate } from './industry-templates';

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  image_url: string;
  sku?: string;
  category?: string;
  specifications?: string;
}

interface BusinessInfo {
  business_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  social_media?: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

// 🆕 NUEVA INTERFACE PARA CONFIGURACIÓN DINÁMICA
interface DynamicLayoutConfig {
  productsPerPage: 4 | 6 | 9;
  columns: number;
  rows: number;
}

export class TemplateGenerator {
  
  /**
   * 🎯 NUEVA FUNCIÓN: Calcular configuración de layout dinámico
   */
  private static calculateDynamicLayout(productsPerPage: 4 | 6 | 9): DynamicLayoutConfig {
    const layoutConfigs = {
      4: { productsPerPage: 4 as const, columns: 2, rows: 2 },
      6: { productsPerPage: 6 as const, columns: 3, rows: 2 },
      9: { productsPerPage: 9 as const, columns: 3, rows: 3 }
    };
    
    return layoutConfigs[productsPerPage];
  }
  
  /**
   * 🔧 FUNCIÓN MODIFICADA: Generar CSS con productos por página dinámicos
   */
  static generateTemplateCSS(
    template: IndustryTemplate, 
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    const layoutConfig = this.calculateDynamicLayout(productsPerPage);
    const dimensions = this.calculateCorrectedDimensions(template, layoutConfig);
    const colors = this.generateColorScheme(template);
    const typography = this.calculateTypography(template, layoutConfig);
    
    return `
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} - ${productsPerPage} PRODUCTOS/PÁGINA ===== */
      
      /* ===== VARIABLES CSS DINÁMICAS ===== */
      :root {
        --primary: ${colors.primary};
        --secondary: ${colors.secondary};
        --accent: ${colors.accent};
        --bg: ${colors.background};
        --card-bg: ${colors.cardBackground};
        --text: ${colors.textPrimary};
        --text-light: ${colors.textSecondary};
        --border: ${colors.borderColor};
        
        /* DIMENSIONES DINÁMICAS BASADAS EN ${productsPerPage} PRODUCTOS */
        --page-width: 210mm;
        --page-height: 297mm;
        --margin: ${dimensions.margin}mm;
        --content-width: ${dimensions.contentWidth}mm;
        --content-height: ${dimensions.contentHeight}mm;
        
        /* GRID DINÁMICO */
        --columns: ${dimensions.columns};
        --rows: ${layoutConfig.rows};
        --card-width: ${dimensions.cardWidth}mm;
        --card-height: ${dimensions.cardHeight}mm;
        --gap: ${dimensions.gap}mm;
        --image-height: ${dimensions.imageHeight}mm;
        --text-area-height: ${dimensions.textAreaHeight}mm;
        
        /* TIPOGRAFÍA ESCALADA */
        --header-size: ${typography.headerSize}pt;
        --title-size: ${typography.titleSize}pt;
        --price-size: ${typography.priceSize}pt;
        --desc-size: ${typography.descSize}pt;
        --info-size: ${typography.infoSize}pt;
        
        /* CONFIGURACIÓN ESPECÍFICA POR LAYOUT */
        --layout-scale: ${this.getLayoutScale(productsPerPage)};
        --padding-scale: ${this.getPaddingScale(productsPerPage)};
        --border-radius-scale: ${this.getBorderRadiusScale(productsPerPage)};
      }
      
      /* ===== RESET ABSOLUTO ===== */
      *, *::before, *::after {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* ===== PÁGINA PDF ===== */
      @page {
        size: A4 portrait;
        margin: var(--margin);
        marks: none;
        bleed: 0;
        orphans: 1;
        widows: 1;
      }
      
      /* ===== HTML Y BODY ===== */
      html {
        width: var(--page-width);
        height: auto;
        font-size: calc(12pt * var(--layout-scale));
        line-height: 1.3;
        margin: 0;
        padding: 0;
      }
      
      body.template-${template.id} {
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: var(--bg) !important;
        color: var(--text) !important;
        width: 100% !important;
        min-height: 100vh !important;
        margin: 0 auto !important;
        padding: var(--margin) !important;
        font-size: calc(12pt * var(--layout-scale));
        position: relative;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
      }
      
      /* ===== CONTAINER PRINCIPAL ===== */
      .catalog-container {
        width: var(--content-width) !important;
        max-width: var(--content-width) !important;
        background: var(--bg) !important;
        position: relative !important;
        min-height: calc(100vh - 40mm) !important;
        margin: 0 auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        -webkit-print-color-adjust: exact !important;
        padding-bottom: 0 !important;
      }
      
      /* ===== HEADER DINÁMICO ===== */
      .catalog-header {
        width: 100%;
        background: var(--primary) !important;
        background-image: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
        color: white !important;
        text-align: center;
        padding: calc(8mm * var(--padding-scale));
        margin-bottom: calc(6mm * var(--padding-scale));
        border-radius: calc(${Math.min(template.design?.borderRadius || 8, 12)}px * var(--border-radius-scale));
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0;
      }
      
      .business-name {
        font-size: var(--header-size);
        font-weight: 700;
        margin-bottom: calc(2mm * var(--padding-scale)) !important;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        color: white !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        word-wrap: break-word;
        line-height: 1.2;
        -webkit-print-color-adjust: exact !important;
      }
      
      .catalog-subtitle {
        font-size: calc(var(--header-size) * 0.6);
        font-weight: 300;
        opacity: 0.95;
        color: white !important;
        margin-top: calc(1mm * var(--padding-scale)) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== PRODUCTS SECTION ===== */
      .products-section {
        width: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 0;
      }
      
      .products-page {
        width: 100%;
        margin-bottom: calc(8mm * var(--padding-scale));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      /* 🚀 GRID SYSTEM COMPLETAMENTE DINÁMICO */
      .products-grid {
        display: grid !important;
        grid-template-columns: repeat(var(--columns), 1fr) !important;
        grid-template-rows: repeat(var(--rows), auto) !important;
        gap: var(--gap) !important;
        width: 100% !important;
        max-width: var(--content-width) !important;
        margin: 0 auto !important;
        padding: 0 !important;
        page-break-inside: avoid;
        align-items: stretch !important;
        justify-content: center !important;
        place-content: center stretch !important;
        grid-auto-rows: var(--card-height) !important;
        
        /* CLASES ESPECÍFICAS POR LAYOUT */
        ${this.generateGridSpecificCSS(productsPerPage)}
      }
      
      /* 🚀 PRODUCT CARDS ESCALADAS DINÁMICAMENTE */
      .product-card {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        height: var(--card-height) !important;
        min-height: var(--card-height) !important;
        max-height: none !important;
        
        background: var(--card-bg) !important;
        border: calc(0.5pt * var(--layout-scale)) solid var(--border) !important;
        border-radius: calc(${Math.min(template.design?.borderRadius || 8, 15)}px * var(--border-radius-scale)) !important;
        overflow: visible !important;
        position: relative !important;
        
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
        
        align-self: stretch !important;
        justify-self: center !important;
        
        padding: calc(3mm * var(--padding-scale)) !important;
        gap: calc(2mm * var(--padding-scale)) !important;
        
        ${template.design.shadows ? `box-shadow: 0 calc(1mm * var(--layout-scale)) calc(3mm * var(--layout-scale)) rgba(0, 0, 0, 0.08);` : ''}
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        
        /* OPTIMIZACIONES ESPECÍFICAS POR LAYOUT */
        ${this.generateCardSpecificCSS(productsPerPage, template)}
      }
      
      /* ===== CONTENIDO INTERNO ESCALADO ===== */
      .product-card-inner {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        gap: calc(2mm * var(--padding-scale)) !important;
        box-sizing: border-box !important;
      }
      
      /* ===== IMAGEN CONTAINER DINÁMICO ===== */
      .product-image-container {
        width: 100% !important;
        height: var(--image-height) !important;
        min-height: var(--image-height) !important;
        max-height: var(--image-height) !important;
        background: #f8f9fa !important;
        border-radius: calc(${Math.max(Math.min(template.design?.borderRadius || 8, 15) - 2, 2)}px * var(--border-radius-scale)) !important;
        overflow: hidden !important;
        position: relative !important;
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border: calc(0.25pt * var(--layout-scale)) solid var(--border) !important;
        margin-bottom: 0 !important;
        -webkit-print-color-adjust: exact !important;
        aspect-ratio: 1 / 1 !important;
        padding: calc(2mm * var(--padding-scale)) !important;
      }
      
      /* ===== IMAGEN OPTIMIZADA POR LAYOUT ===== */
      .product-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: ${this.getImageObjectFit(productsPerPage)} !important;
        object-position: center !important;
        display: block !important;
        margin: 0 !important;
        border-radius: calc(2px * var(--border-radius-scale)) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
      }
      
      /* ===== PLACEHOLDER ESCALADO ===== */
      .product-image-placeholder {
        width: 90% !important;
        height: 90% !important;
        background: 
          repeating-conic-gradient(from 0deg at 50% 50%, 
            #f0f0f0 0deg 90deg, 
            transparent 90deg 180deg) !important;
        background-size: calc(8px * var(--layout-scale)) calc(8px * var(--layout-scale)) !important;
        border: calc(1pt * var(--layout-scale)) dashed #ccc !important;
        border-radius: calc(3px * var(--border-radius-scale)) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        color: #999 !important;
        font-size: calc(8pt * var(--layout-scale)) !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* 🚀 INFORMACIÓN ESCALADA DINÁMICAMENTE */
      .product-info {
        flex: 1 1 auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        min-height: var(--text-area-height) !important;
        height: auto !important;
        text-align: center !important;
        overflow: visible !important;
        gap: calc(2mm * var(--padding-scale)) !important;
        padding: calc(1mm * var(--padding-scale)) 0 !important;
      }
      
      /* ===== NOMBRE ESCALADO ===== */
      .product-name {
        font-size: var(--title-size) !important;
        font-weight: 600 !important;
        color: var(--primary) !important;
        line-height: 1.3 !important;
        margin-bottom: 0 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getNameLines(template.density, productsPerPage)} !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        
        -webkit-print-color-adjust: exact !important;
        text-align: center !important;
        width: 100% !important;
        flex-shrink: 0 !important;
      }
      
      /* ===== SISTEMA DE PRECIOS ESCALADO ===== */
      .product-pricing {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: calc(2.5mm * var(--padding-scale)) !important;
        margin: 0 !important;
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        min-height: 0 !important;
      }

      /* ===== PRECIO RETAIL ESCALADO ===== */
      .product-price-retail {
        font-size: var(--price-size) !important;
        font-weight: 700 !important;
        color: white !important;
        background: var(--secondary) !important;
        background-image: linear-gradient(135deg, var(--secondary), var(--primary)) !important;
        padding: calc(1.5mm * var(--padding-scale)) calc(3mm * var(--padding-scale)) !important;
        border-radius: calc(12px * var(--border-radius-scale)) !important;
        display: inline-block !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 calc(1pt * var(--layout-scale)) calc(2pt * var(--layout-scale)) rgba(0,0,0,0.15) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
        line-height: 1.2 !important;
        margin: 0 !important;
      }

      /* ===== PRECIO MAYOREO ESCALADO ===== */
      .product-price-wholesale {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: calc(1mm * var(--padding-scale)) !important;
        font-size: calc(var(--price-size) * 0.75) !important;
        color: var(--text) !important;
        background: rgba(0,0,0,0.05) !important;
        padding: calc(2mm * var(--padding-scale)) !important;
        border-radius: calc(6px * var(--border-radius-scale)) !important;
        border: calc(0.5pt * var(--layout-scale)) solid var(--border) !important;
        width: 90% !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
        min-height: calc(8mm * var(--padding-scale)) !important;
        position: relative !important;
        z-index: 2 !important;
        margin: 0 !important;
      }

      .wholesale-label {
        font-size: calc(var(--info-size) * 0.9) !important;
        font-weight: 500 !important;
        color: var(--text-light) !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3pt !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.1 !important;
      }

      .wholesale-price {
        font-weight: 700 !important;
        color: var(--primary) !important;
        font-size: calc(var(--price-size) * 0.8) !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.1 !important;
      }

      .wholesale-min {
        font-size: calc(var(--info-size) * 0.8) !important;
        color: var(--text-light) !important;
        font-weight: 400 !important;
        font-style: italic !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.1 !important;
      }
      
      /* ===== ELEMENTOS CONDICIONALES ESCALADOS ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: var(--info-size) !important;
        color: var(--accent) !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        background: ${this.hexToRgba(template.colors.accent, 0.15)} !important;
        padding: calc(0.5mm * var(--padding-scale)) calc(2mm * var(--padding-scale)) !important;
        border-radius: calc(6px * var(--border-radius-scale)) !important;
        display: inline-block !important;
        margin: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-category { display: none !important; }`}
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: var(--desc-size) !important;
        color: var(--text-light) !important;
        line-height: 1.3 !important;
        margin: 0 !important;
        
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getDescLines(template.density, productsPerPage)} !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        
        -webkit-print-color-adjust: exact !important;
        text-align: center !important;
      }
      ` : `.product-description { display: none !important; }`}
      
      /* ===== FOOTER ESCALADO ===== */
      .catalog-footer {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        background: var(--secondary) !important;
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)} !important;
        padding: calc(5mm * var(--padding-scale)) calc(8mm * var(--padding-scale)) !important;
        text-align: center !important;
        border-top: calc(1pt * var(--layout-scale)) solid var(--border) !important;
        border-radius: calc(${Math.min(template.design?.borderRadius || 8, 12)}px * var(--border-radius-scale)) calc(${Math.min(template.design?.borderRadius || 8, 12)}px * var(--border-radius-scale)) 0 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
        margin: calc(8mm * var(--padding-scale)) auto 0 auto !important;
        transform: none !important;
        left: auto !important;
        bottom: auto !important;
      }
      
      .business-contact {
        font-size: calc(9pt * var(--layout-scale)) !important;
        line-height: 1.4 !important;
        margin-bottom: calc(3mm * var(--padding-scale)) !important;
        font-weight: 600 !important;
        word-wrap: break-word !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        align-items: center !important;
        gap: calc(3mm * var(--padding-scale)) !important;
        width: 100% !important;
      }
      
      .contact-item {
        display: inline-block !important;
        padding: calc(1.5mm * var(--padding-scale)) calc(3mm * var(--padding-scale)) !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: calc(8px * var(--border-radius-scale)) !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        font-size: calc(8pt * var(--layout-scale)) !important;
        border: calc(0.5pt * var(--layout-scale)) solid rgba(255, 255, 255, 0.1) !important;
      }
      
      /* ===== PAGINACIÓN ===== */
      .page-break-before {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .page-break-after {
        page-break-after: always !important;
        break-after: page !important;
      }
      
      .page-break-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: avoid !important;
        page-break-after: avoid !important;
      }
      
      /* ===== CARDS VACÍAS ===== */
      .product-card.empty-card {
        visibility: hidden !important;
        height: var(--card-height) !important;
        min-height: var(--card-height) !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      
      /* ===== MEDIA PRINT DINÁMICO ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: visible !important;
          max-height: none !important;
          min-height: calc(var(--card-height) + calc(8mm * var(--padding-scale))) !important;
        }
        
        .products-grid {
          page-break-inside: auto !important;
          grid-auto-rows: calc(var(--card-height) + calc(8mm * var(--padding-scale))) !important;
        }
        
        .product-info {
          overflow: visible !important;
          height: auto !important;
          min-height: calc(var(--text-area-height) + calc(5mm * var(--padding-scale))) !important;
        }
      }
      
      /* ===== OPTIMIZACIONES POR DENSIDAD Y LAYOUT ===== */
      ${this.generateDensitySpecificCSS(template, productsPerPage)}
    `;
  }
  
  /**
   * 🔧 FUNCIÓN MODIFICADA: Dimensiones dinámicas
   */
  private static calculateCorrectedDimensions(
    template: IndustryTemplate, 
    layoutConfig: DynamicLayoutConfig
  ) {
    const pageWidth = 210;
    const pageHeight = 297;
    
    const marginMap = { 
      alta: 6,
      media: 7,
      baja: 8
    };
    const margin = marginMap[template.density as keyof typeof marginMap] || 10;
    
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    const { columns, productsPerPage } = layoutConfig;
    
    // Gap dinámico basado en productos por página
    const gapMap = { 
      4: Math.max(5, contentWidth * 0.025), // Más gap para 4 productos
      6: Math.max(4, contentWidth * 0.015), // Gap estándar
      9: Math.max(3, contentWidth * 0.01)   // Menos gap para 9 productos
    };
    const gap = gapMap[productsPerPage] || 4;
    
    const totalGapWidth = (columns - 1) * gap;
    const availableWidth = contentWidth - totalGapWidth;
    const cardWidth = availableWidth / columns;
    
    // 🚀 ALTURA DINÁMICA BASADA EN PRODUCTOS POR PÁGINA
    let cardHeight;
    
    if (productsPerPage === 4) {
      // 4 productos: más grandes
      cardHeight = cardWidth + 45; // Mucho más grandes
    } else if (productsPerPage === 6) {
      // 6 productos: tamaño estándar
      cardHeight = cardWidth + 30; // Tamaño medio
    } else if (productsPerPage === 9) {
      // 9 productos: más compactos
      cardHeight = cardWidth + 20; // Más compactos
    } else {
      cardHeight = cardWidth + 30;
    }
    
    // Ratio dinámico de imagen basado en productos por página
    const imageHeightRatio = productsPerPage === 4 ? 0.65 : // Más imagen para 4
                            productsPerPage === 6 ? 0.55 : // Estándar para 6
                            0.50; // Menos imagen para 9
    
    const imageHeight = cardHeight * imageHeightRatio;
    const textAreaHeight = cardHeight - imageHeight;
    
    // Límites dinámicos
    const minCardHeight = productsPerPage === 4 ? 50 : productsPerPage === 6 ? 40 : 35;
    const maxCardHeight = productsPerPage === 4 ? 120 : productsPerPage === 6 ? 100 : 80;
    
    const finalCardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, cardHeight));
    const finalImageHeight = finalCardHeight * imageHeightRatio;
    const finalTextAreaHeight = finalCardHeight - finalImageHeight;
    
    return {
      pageWidth,
      pageHeight,
      margin,
      contentWidth: Math.floor(contentWidth * 100) / 100,
      contentHeight: Math.floor(contentHeight * 100) / 100,
      columns,
      gap: Math.floor(gap * 100) / 100,
      cardWidth: Math.floor(cardWidth * 100) / 100,
      cardHeight: Math.floor(finalCardHeight * 100) / 100,
      imageHeight: Math.floor(finalImageHeight * 100) / 100,
      textAreaHeight: Math.floor(finalTextAreaHeight * 100) / 100
    };
  }
  
  /**
   * 🎯 TIPOGRAFÍA DINÁMICA
   */
  private static calculateTypography(
    template: IndustryTemplate, 
    layoutConfig: DynamicLayoutConfig
  ) {
    const { productsPerPage } = layoutConfig;
    
    // Escalas por productos por página
    const scaleMap = {
      4: 1.3,  // Más grande para 4 productos
      6: 1.0,  // Estándar para 6 productos
      9: 0.8   // Más pequeño para 9 productos
    };
    
    const scale = scaleMap[productsPerPage] || 1.0;
    
    const baseSizes = {
      alta: { header: 14, title: 8, price: 9, desc: 6, info: 5 },
      media: { header: 18, title: 10, price: 11, desc: 7, info: 6 },
      baja: { header: 22, title: 12, price: 13, desc: 8, info: 7 }
    };
    
    const sizes = baseSizes[template.density as keyof typeof baseSizes] || baseSizes.media;
    
    return {
      headerSize: Math.round(sizes.header * scale),
      titleSize: Math.round(sizes.title * scale),
      priceSize: Math.round(sizes.price * scale),
      descSize: Math.round(sizes.desc * scale),
      infoSize: Math.round(sizes.info * scale)
    };
  }
  
  /**
   * 🎛️ ESCALAS ESPECÍFICAS
   */
  private static getLayoutScale(productsPerPage: 4 | 6 | 9): number {
    const scales = { 4: 1.2, 6: 1.0, 9: 0.85 };
    return scales[productsPerPage];
  }
  
  private static getPaddingScale(productsPerPage: 4 | 6 | 9): number {
    const scales = { 4: 1.3, 6: 1.0, 9: 0.8 };
    return scales[productsPerPage];
  }
  
  private static getBorderRadiusScale(productsPerPage: 4 | 6 | 9): number {
    const scales = { 4: 1.5, 6: 1.0, 9: 0.7 };
    return scales[productsPerPage];
  }
  
  private static getImageObjectFit(productsPerPage: 4 | 6 | 9): string {
    return productsPerPage === 9 ? 'cover' : 'contain';
  }
  
  /**
   * 🎯 CSS ESPECÍFICO POR GRID
   */
  private static generateGridSpecificCSS(productsPerPage: 4 | 6 | 9): string {
    if (productsPerPage === 4) {
      return `
        /* GRID 4 PRODUCTOS - 2x2 */
        justify-items: center;
        align-items: center;
      `;
    } else if (productsPerPage === 9) {
      return `
        /* GRID 9 PRODUCTOS - 3x3 */
        justify-items: stretch;
        align-items: stretch;
      `;
    }
    return '';
  }
  
  /**
   * 🎯 CSS ESPECÍFICO POR CARD
   */
  private static generateCardSpecificCSS(
    productsPerPage: 4 | 6 | 9, 
    template: IndustryTemplate
  ): string {
    if (productsPerPage === 4) {
      return `
        /* CARDS GRANDES - 4 PRODUCTOS */
        justify-self: center;
        max-width: 95%;
      `;
    } else if (productsPerPage === 9) {
      return `
        /* CARDS COMPACTAS - 9 PRODUCTOS */
        justify-self: stretch;
        max-width: 100%;
      `;
    }
    return '';
  }
  
  /**
   * 🔧 LÍNEAS DINÁMICAS
   */
  private static getNameLines(density: string, productsPerPage: 4 | 6 | 9): number {
    const lineMap = {
      4: { alta: 3, media: 3, baja: 4 }, // Más líneas para 4 productos
      6: { alta: 2, media: 2, baja: 3 }, // Estándar
      9: { alta: 1, media: 2, baja: 2 }  // Menos líneas para 9 productos
    };
    
    return lineMap[productsPerPage]?.[density as keyof typeof lineMap[4]] || 2;
  }
  
  private static getDescLines(density: string, productsPerPage: 4 | 6 | 9): number {
    const lineMap = {
      4: { alta: 2, media: 3, baja: 4 }, // Más descripción para 4
      6: { alta: 1, media: 2, baja: 3 }, // Estándar
      9: { alta: 1, media: 1, baja: 2 }  // Menos para 9
    };
    
    return lineMap[productsPerPage]?.[density as keyof typeof lineMap[4]] || 2;
  }
  
  /**
   * 🔧 FUNCIÓN MODIFICADA: Generar HTML con productos por página dinámicos
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    
    const css = this.generateTemplateCSS(template, productsPerPage);
    const productsHTML = this.generateProductsHTMLGrid(products, template, productsPerPage);
    const footerHTML = this.generateFooterHTML(businessInfo);
    
    const businessName = businessInfo.business_name || 'Mi Negocio';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=210mm, initial-scale=1.0">
    <title>Catálogo - ${businessName} (${productsPerPage} productos/página)</title>
    <meta name="products-per-page" content="${productsPerPage}">
    <style>
        ${css}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        <header class="catalog-header page-break-avoid">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos (${productsPerPage} por página)</p>
        </header>
        
        <main class="products-section">
            ${productsHTML}
        </main>
        
        ${footerHTML}
    </div>
</body>
</html>`;
  }
  
  /**
   * 🔧 FUNCIÓN MODIFICADA: Grid con productos por página dinámicos
   */
  private static generateProductsHTMLGrid(
    products: Product[], 
    template: IndustryTemplate, 
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    let htmlPages = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      const emptyCardsNeeded = productsPerPage - pageProducts.length;
      const totalCards = [...pageProducts];
      
      for (let i = 0; i < emptyCardsNeeded; i++) {
        totalCards.push(null as any);
      }
      
      const pageBreakClass = page > 0 ? 'page-break-before' : '';
      
      htmlPages += `
        <div class="products-page ${pageBreakClass}">
          <div class="products-grid">
            ${totalCards.map(product => 
              product ? this.generateProductCard(product, template) : this.generateEmptyCard()
            ).join('')}
          </div>
        </div>
      `;
    }
    
    return htmlPages;
  }
  
  // ===== RESTO DE FUNCIONES SIN CAMBIOS =====
  
  private static generateColorScheme(template: IndustryTemplate) {
    const primary = template.colors.primary;
    const secondary = template.colors.secondary || template.colors.primary;
    const accent = template.colors.accent || this.adjustColor(primary, 30);
    const background = template.colors.background || '#ffffff';
    
    const isLight = this.isLightColor(background);
    
    return {
      primary,
      secondary,
      accent,
      background,
      cardBackground: template.colors.cardBackground || (isLight ? '#ffffff' : '#f8f9fa'),
      textPrimary: isLight ? '#2c3e50' : '#ffffff',
      textSecondary: isLight ? '#7f8c8d' : '#bdc3c7',
      borderColor: isLight ? '#e9ecef' : '#34495e'
    };
  }
  
  private static generateProductCard(product: Product, template: IndustryTemplate): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    const productSku = product.sku || '';
    const productCategory = product.category || '';
    const productSpecs = product.specifications || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}" 
         class="product-image contain-mode" 
         loading="eager" 
         crossorigin="anonymous" 
       />` :
      `<div class="product-image-placeholder">
         <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
         <div style="font-size: 7pt;">Sin imagen</div>
       </div>`;
    
    return `
      <div class="product-card page-break-avoid">
        <div class="product-card-inner">
          <div class="product-image-container">
            ${imageHTML}
          </div>
          <div class="product-info">
            ${template.showInfo.category && productCategory ? 
              `<div class="product-category">${productCategory}</div>` : ''}
            
            <h3 class="product-name">${productName}</h3>
            
            <div class="product-pricing">
              <div class="product-price-retail">$${(productPrice / 100).toLocaleString('es-MX', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</div>
              ${product.price_wholesale && template.showInfo?.wholesalePrice ? `
                <div class="product-price-wholesale">
                  <span class="wholesale-label">Mayoreo:</span>
                  <span class="wholesale-price">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</span>
                  ${product.wholesale_min_qty && template.showInfo?.wholesaleMinQty ? `
                    <span class="wholesale-min">Min. ${product.wholesale_min_qty}</span>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            
            ${template.showInfo.description && productDescription ? 
              `<p class="product-description">${productDescription}</p>` : ''}
            
            ${template.showInfo.sku && productSku ? 
              `<div class="product-sku">SKU: ${productSku}</div>` : ''}
            
            ${template.showInfo.specifications && productSpecs ? 
              `<div class="product-specifications">${productSpecs}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  private static generateEmptyCard(): string {
    return `<div class="product-card empty-card"></div>`;
  }
  
  private static generateFooterHTML(businessInfo: BusinessInfo): string {
    const contactItems = [
      businessInfo.phone ? `<span class="contact-item">📞 ${businessInfo.phone}</span>` : '',
      businessInfo.social_media?.whatsapp ? `<span class="contact-item">📱 ${businessInfo.social_media.whatsapp}</span>` : '',
      businessInfo.email ? `<span class="contact-item">📧 ${businessInfo.email}</span>` : '',
      businessInfo.website ? `<span class="contact-item">🌐 ${businessInfo.website}</span>` : '',
      businessInfo.address ? `<span class="contact-item">📍 ${businessInfo.address}</span>` : ''
    ].filter(Boolean);
    
    if (contactItems.length === 0) {
      return `
        <footer class="catalog-footer page-break-avoid">
          <div class="footer-branding">
            Generado con CatifyPro v2.0
          </div>
        </footer>
      `;
    }
    
    return `
      <footer class="catalog-footer page-break-avoid">
        <div class="business-contact">
          ${contactItems.join('')}
        </div>
        <div class="footer-branding">
          Generado con CatifyPro v2.0
        </div>
      </footer>
    `;
  }
  
  private static generateDensitySpecificCSS(
    template: IndustryTemplate, 
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    if (template.density === 'alta') {
      return `
        .template-${template.id} .product-card {
          border-width: calc(0.25pt * var(--layout-scale)) !important;
        }
      `;
    }
    
    if (template.density === 'baja') {
      return `
        .template-${template.id} .product-card {
          border-width: calc(1pt * var(--layout-scale)) !important;
        }
      `;
    }
    
    return '';
  }
  
  // ===== UTILITY FUNCTIONS ===== 
  
  private static isLightColor(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  
  private static getContrastColor(hexColor: string): string {
    return this.isLightColor(hexColor) ? '#2c3e50' : '#ffffff';
  }
  
  private static adjustColor(hexColor: string, adjustment: number): string {
    const hex = hexColor.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + adjustment));
    const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + adjustment));
    const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + adjustment));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  private static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}