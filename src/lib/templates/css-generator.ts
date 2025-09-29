// src/lib/templates/css-generator.ts - VERSIÓN CORREGIDA PARA 4 Y 9 PRODUCTOS + FIX 2x2

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
   * 🎯 FUNCIÓN PRINCIPAL CON PRODUCTOS POR PÁGINA DINÁMICOS - CORREGIDA + FIX 2x2
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
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} - ${productsPerPage} PRODUCTOS/PÁGINA - CORREGIDO + FIX 2x2 ===== */
      
      /* ===== VARIABLES CSS DINÁMICAS CORREGIDAS ===== */
      :root {
        --primary: ${colors.primary};
        --secondary: ${colors.secondary};
        --accent: ${colors.accent};
        --bg: ${colors.background};
        --card-bg: ${colors.cardBackground};
        --text: ${colors.textPrimary};
        --text-light: ${colors.textSecondary};
        --border: ${colors.borderColor};
        
        /* DIMENSIONES DINÁMICAS CORREGIDAS */
        --page-width: 210mm;
        --page-height: 297mm;
        --margin: ${dimensions.margin}mm;
        --content-width: ${dimensions.contentWidth}mm;
        --content-height: ${dimensions.contentHeight}mm;
        
        /* 🔧 GRID DINÁMICO CORREGIDO */
        --columns: ${dimensions.columns};
        --rows: ${layoutConfig.rows};
        --card-width: ${dimensions.cardWidth}mm;
        --card-height: ${dimensions.cardHeight}mm;
        --gap: ${dimensions.gap}mm;
        --image-height: ${dimensions.imageHeight}mm;
        --text-area-height: ${dimensions.textAreaHeight}mm;
        
        /* 🔧 TIPOGRAFÍA ESCALADA CORREGIDA */
        --header-size: ${typography.headerSize}pt;
        --title-size: ${typography.titleSize}pt;
        --price-size: ${typography.priceSize}pt;
        --desc-size: ${typography.descSize}pt;
        --info-size: ${typography.infoSize}pt;
        
        /* 🔧 CONFIGURACIÓN ESPECÍFICA POR LAYOUT CORREGIDA */
        --layout-scale: ${this.getLayoutScale(productsPerPage)};
        --padding-scale: ${this.getPaddingScale(productsPerPage)};
        --border-radius-scale: ${this.getBorderRadiusScale(productsPerPage)};
        
        /* 🆕 MÁRGENES CORREGIDOS ESPECÍFICOS POR LAYOUT */
        --header-margin: ${this.getHeaderMargin(productsPerPage)}mm;
        --content-top-margin: ${this.getContentTopMargin(productsPerPage)}mm;
        --footer-margin: ${this.getFooterMargin(productsPerPage)}mm;
        
        /* 🚀 VARIABLES ESPECÍFICAS PARA FIX 2x2 */
        ${productsPerPage === 4 ? `
          --grid-total-height: ${dimensions.cardHeight * 2 + dimensions.gap}mm;
          --grid-2x2-mode: 1;
        ` : `
          --grid-2x2-mode: 0;
        `}
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
      
      /* ===== HEADER DINÁMICO CORREGIDO ===== */
      .catalog-header {
        width: 100%;
        background: var(--primary) !important;
        background-image: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
        color: white !important;
        text-align: center;
        padding: calc(var(--header-margin) * var(--padding-scale));
        margin-bottom: calc(var(--content-top-margin) * var(--padding-scale));
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
      
      /* ===== PRODUCTS SECTION CORREGIDA ===== */
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
        margin-bottom: calc(var(--footer-margin) * var(--padding-scale));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      /* 🚀 GRID SYSTEM COMPLETAMENTE DINÁMICO CORREGIDO + FIX CRÍTICO 2x2 */
      .products-grid {
        display: grid !important;
        grid-template-columns: repeat(var(--columns), 1fr) !important;
        
        /* 🔧 FIX CRÍTICO PARA 2x2: Altura fija vs auto */
        ${productsPerPage === 4 ? 
          `grid-template-rows: repeat(var(--rows), var(--card-height)) !important;
           height: var(--grid-total-height) !important;
           min-height: var(--grid-total-height) !important;` :
          `grid-template-rows: repeat(var(--rows), auto) !important;`
        }
        
        gap: var(--gap) !important;
        width: 100% !important;
        max-width: var(--content-width) !important;
        margin: 0 auto !important;
        padding: 0 !important;
        page-break-inside: avoid;
        
        /* 🔧 Place items específico para cada layout */
        ${productsPerPage === 4 ? 
          `place-items: start center !important;
           place-content: start center !important;` :
          `align-items: stretch !important;
           justify-content: center !important;
           place-content: center stretch !important;`
        }
        
        grid-auto-rows: var(--card-height) !important;
        
        /* 🔧 CLASES ESPECÍFICAS POR LAYOUT CORREGIDAS */
        ${this.generateGridSpecificCSS(productsPerPage)}
      }
      
      /* 🚀 PRODUCT CARDS ESCALADAS DINÁMICAMENTE - CORREGIDAS + FIX 2x2 */
      .product-card {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        
        /* 🔧 FIX ALTURA ESPECÍFICA PARA 2x2 */
        ${productsPerPage === 4 ? 
          `height: var(--card-height) !important;
           min-height: var(--card-height) !important;
           max-height: var(--card-height) !important;` :
          `height: var(--card-height) !important;
           min-height: var(--card-height) !important;
           max-height: none !important;`
        }
        
        background: var(--card-bg) !important;
        border: calc(0.5pt * var(--layout-scale)) solid var(--border) !important;
        border-radius: calc(${Math.min(template.design?.borderRadius || 8, 15)}px * var(--border-radius-scale)) !important;
        overflow: visible !important;
        position: relative !important;
        
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
        
        /* 🔧 POSICIONAMIENTO ESPECÍFICO PARA 2x2 */
        ${productsPerPage === 4 ? 
          `align-self: start !important;
           justify-self: center !important;` :
          `align-self: stretch !important;
           justify-self: center !important;`
        }
        
        padding: calc(var(--padding-scale) * ${this.getCardPadding(productsPerPage)}mm) !important;
        gap: calc(2mm * var(--padding-scale)) !important;
        
        ${template.design.shadows ? `box-shadow: 0 calc(1mm * var(--layout-scale)) calc(3mm * var(--layout-scale)) rgba(0, 0, 0, 0.08);` : ''}
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        
        /* 🔧 OPTIMIZACIONES ESPECÍFICAS POR LAYOUT CORREGIDAS */
        ${this.generateCardSpecificCSS(productsPerPage, template)}
      }
      
      /* 🔧 FIX POSICIONAMIENTO EXPLÍCITO PARA 2x2 */
      ${productsPerPage === 4 ? `
        .product-card:nth-child(1) { grid-area: 1 / 1 / 2 / 2 !important; }
        .product-card:nth-child(2) { grid-area: 1 / 2 / 2 / 3 !important; }
        .product-card:nth-child(3) { grid-area: 2 / 1 / 3 / 2 !important; }
        .product-card:nth-child(4) { grid-area: 2 / 2 / 3 / 3 !important; }
        
        /* Cards vacías también ocupan espacio */
        .product-card.empty-card {
          visibility: hidden !important;
          height: var(--card-height) !important;
          min-height: var(--card-height) !important;
          max-height: var(--card-height) !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
      ` : ''}
      
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
      
      /* ===== IMAGEN CONTAINER DINÁMICO CORREGIDO ===== */
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
      
      /* ===== IMAGEN OPTIMIZADA POR LAYOUT CORREGIDA ===== */
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
      
      /* 🚀 INFORMACIÓN ESCALADA DINÁMICAMENTE - CORREGIDA */
      .product-info {
        ${productsPerPage === 6 ? `
          /* CONTAINER OPTIMIZADO - MÁS ESPACIO VERTICAL */
          display: flex !important;
          flex-direction: column !important;
          min-width: 0 !important;
          min-height: 0 !important;
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
          padding: calc(0.8mm * var(--padding-scale)) 0 !important;
          gap: calc(1.2mm * var(--padding-scale)) !important;
        ` : `
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          min-height: var(--text-area-height) !important;
          text-align: center !important;
        `}
        min-height: var(--text-area-height) !important;
        height: auto !important;
        text-align: center !important;
        overflow: visible !important;
        gap: calc(${this.getTextGap(productsPerPage)}mm * var(--padding-scale)) !important;
        padding: calc(1mm * var(--padding-scale)) 0 !important;
      }
      
      /* ===== NOMBRE ESCALADO CORREGIDO ===== */
      .product-name {
        ${productsPerPage === 6 ? `
/* NOMBRE DE PRODUCTO - 3 LÍNEAS PARA TÍTULOS LARGOS */
          display: -webkit-box !important;
          -webkit-box-orient: vertical !important;
          -webkit-line-clamp: 3 !important;
          
          /* WORD-BREAK CRÍTICO */
          word-break: break-word !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          
          /* WIDTH EXPLÍCITO */
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          
          /* OVERFLOW */
          overflow: hidden !important;
          max-height: none !important;
          min-height: auto !important;
          
          /* TIPOGRAFÍA */
          font-size: calc(var(--title-size) * 0.92) !important;
          line-height: 1.25 !important;
          font-weight: 600 !important;
          color: var(--primary) !important;
          
          /* SPACING MÍNIMO */
          margin: 0 0 calc(2mm * var(--padding-scale)) 0 !important;
          padding: 0 !important;
          
          /* ALINEACIÓN */
          text-align: center !important;
          
          /* HYPHENATION */
          hyphens: auto !important;
          -webkit-hyphens: auto !important;
        ` : `
          font-size: var(--title-size) !important;
          font-weight: 600 !important;
          color: var(--primary) !important;
          line-height: 1.3 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: ${this.getNameLines(template.density, productsPerPage)} !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        `}
        font-weight: 600 !important;
        color: var(--primary) !important;
        margin-bottom: 0 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        
        -webkit-print-color-adjust: exact !important;
        text-align: center !important;
        width: 100% !important;
        flex-shrink: 0 !important;
      }
      
      /* ===== SISTEMA DE PRECIOS ESCALADO CORREGIDO ===== */
      .product-pricing {
        ${productsPerPage === 6 ? `
          /* PRICING CONTAINER - COMPACTO Y EFICIENTE */
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          overflow: visible !important;
          margin: calc(1.2mm * var(--padding-scale)) 0 !important;
          padding: 0 !important;
          min-height: calc(14mm * var(--padding-scale)) !important;
          text-align: center !important;
        ` : `
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: calc(${this.getPricingGap(productsPerPage)}mm * var(--padding-scale)) !important;
        `}
        margin: 0 !important;
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        min-height: 0 !important;
      }

      /* ===== PRECIO RETAIL ESCALADO CORREGIDO ===== */
      .product-price-retail {
        ${productsPerPage === 6 ? `
          /* PRECIO RETAIL - NO TRUNCAR (CRÍTICO) */
          font-size: calc(var(--price-size) * 0.95) !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: unset !important;
          padding: calc(1.5mm * var(--padding-scale)) calc(3mm * var(--padding-scale)) !important;
          margin: 0 auto calc(3mm * var(--padding-scale)) auto !important;
          max-width: 98% !important;
          word-wrap: break-word !important;
          text-align: center !important;
        ` : `
          font-size: var(--price-size) !important;
          padding: calc(1.5mm * var(--padding-scale)) calc(3mm * var(--padding-scale)) !important;
        `}
        font-weight: 700 !important;
        color: white !important;
        background: var(--secondary) !important;
        background-image: linear-gradient(135deg, var(--secondary), var(--primary)) !important;
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

      /* ===== PRECIO MAYOREO ESCALADO CORREGIDO ===== */
      .product-price-wholesale {
        ${productsPerPage === 6 ? `
          /* WHOLESALE - MÁS ESPACIO, NO TRUNCAR INFORMACIÓN CRÍTICA */
          display: block !important;
          overflow: visible !important;
          font-size: calc(var(--price-size) * 0.8) !important;
          padding: calc(2mm * var(--padding-scale)) !important;
          margin: calc(2mm * var(--padding-scale)) auto 0 auto !important;
          width: 95% !important;
          max-height: calc(12mm * var(--padding-scale)) !important;
          min-height: calc(8mm * var(--padding-scale)) !important;
          line-height: 1.3 !important;
          text-align: center !important;
        ` : `
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          font-size: calc(var(--price-size) * 0.75) !important;
          padding: calc(${this.getWholesalePadding(productsPerPage)}mm * var(--padding-scale)) !important;
        `}
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: calc(1mm * var(--padding-scale)) !important;
        color: var(--text) !important;
        background: rgba(0,0,0,0.12) !important;
        border-radius: calc(6px * var(--border-radius-scale)) !important;
        border: calc(0.5pt * var(--layout-scale)) solid var(--border) !important;
        width: 90% !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
        position: relative !important;
        z-index: 2 !important;
        margin: 0 !important;
      }

      .wholesale-label {
        font-size: calc(var(--info-size) * 0.9) !important;
        font-weight: 600 !important;
        color: var(--text) !important;
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
      
      ${productsPerPage === 6 ? `
        /* ETIQUETAS WHOLESALE - SELECTIVO */
        .wholesale-label {
          display: inline-block !important;
          white-space: nowrap !important; /* "MAYOREO:" siempre completo */
          overflow: visible !important;
          text-overflow: unset !important;
          font-size: calc(var(--info-size) * 0.9) !important;
          font-weight: 600 !important;
          margin-right: calc(2mm * var(--padding-scale)) !important;
        }

        .wholesale-price {
          display: inline-block !important;
          white-space: nowrap !important; /* Precio siempre completo */
          overflow: visible !important;
          text-overflow: unset !important;
          font-size: calc(var(--price-size) * 0.8) !important;
          font-weight: 700 !important;
        }

        .wholesale-min {
          display: block !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important; /* Solo cantidad puede truncarse */
          max-width: 100% !important;
          font-size: calc(var(--info-size) * 0.8) !important;
          margin-top: calc(1mm * var(--padding-scale)) !important;
          opacity: 0.8 !important;
        }
      ` : ''}
      
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
        margin: calc(var(--footer-margin) * var(--padding-scale)) auto 0 auto !important;
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
      
      /* ===== CARDS VACÍAS CORREGIDAS PARA 2x2 ===== */
      .product-card.empty-card {
        ${productsPerPage === 4 ? 
          `visibility: hidden !important;
           height: var(--card-height) !important;
           min-height: var(--card-height) !important;
           max-height: var(--card-height) !important;
           border: none !important;
           background: transparent !important;
           box-shadow: none !important;` :
          `visibility: hidden !important;
           height: var(--card-height) !important;
           min-height: var(--card-height) !important;
           border: none !important;
           background: transparent !important;
           box-shadow: none !important;`
        }
      }
      
      /* 🚀 PRE-PRINT FIXES CORREGIDOS PARA 2x2 */
      ${productsPerPage === 4 ? `
        .products-grid {
          grid-template-rows: minmax(0, 1fr) minmax(0, 1fr) !important;
          height: auto !important;
          min-height: calc(var(--card-height) * 2 + var(--gap)) !important;
          max-height: calc(var(--card-height) * 2 + var(--gap) + 20mm) !important;
          margin-top: 15mm !important;
          margin-bottom: 10mm !important;
          overflow: visible !important;
        }
        
        .product-card {
          height: calc(var(--card-height) - 5mm) !important;
          min-height: calc(var(--card-height) - 5mm) !important;
          max-height: calc(var(--card-height) - 5mm) !important;
          overflow: visible !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        
        .product-info {
          height: auto !important;
          max-height: calc(var(--text-area-height) - 3mm) !important;
          overflow: visible !important;
        }
        
        .product-pricing {
          overflow: visible !important;
          height: auto !important;
          max-height: 15mm !important;
        }
        
        .product-price-wholesale {
          overflow: visible !important;
          max-height: 8mm !important;
          line-height: 1.1 !important;
        }
      ` : ''}

      /* ===== MEDIA PRINT DINÁMICO CORREGIDO + FIX 2x2 ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* 🚀 PRINT FIXES COMPLETOS PARA 2x2 */
        ${productsPerPage === 4 ? `
          .products-grid {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            
            grid-template-rows: auto auto !important;
            grid-auto-rows: auto !important;
            
            page-break-inside: auto !important;
            break-inside: auto !important;
            
            position: static !important;
            float: none !important;
          }
          
          .product-card {
            overflow: visible !important;
            height: auto !important;
            min-height: calc(var(--card-height) - 5mm) !important;
            max-height: none !important;
            
            display: block !important;
            position: static !important;
            float: none !important;
            
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            
            margin-bottom: 5mm !important;
          }
          
          .product-info {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            display: block !important;
          }
          
          .product-pricing {
            overflow: visible !important;
            display: block !important;
            height: auto !important;
            max-height: none !important;
          }
          
          .product-price-wholesale {
            overflow: visible !important;
            display: block !important;
            position: static !important;
            margin-top: 3mm !important;
            margin-bottom: 3mm !important;
            min-height: auto !important;
            height: auto !important;
          }
        ` : `
          /* Print normal para 3x2 y 3x3 (SIN CAMBIOS) */
          .product-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            max-height: none !important;
            min-height: calc(var(--card-height) + calc(${this.getPrintExtraHeight(productsPerPage)}mm * var(--padding-scale))) !important;
          }
          
          .products-grid {
            page-break-inside: auto !important;
            grid-auto-rows: calc(var(--card-height) + calc(${this.getPrintExtraHeight(productsPerPage)}mm * var(--padding-scale))) !important;
          }
        `}
        
        .product-info {
          overflow: visible !important;
          height: auto !important;
          min-height: calc(var(--text-area-height) + calc(${this.getPrintTextExtraHeight(productsPerPage)}mm * var(--padding-scale))) !important;
        }
        
        /* 🔧 PRINT OPTIMIZATIONS ESPECÍFICAS POR LAYOUT */
        ${this.generatePrintSpecificCSS(productsPerPage)}
      }
      
      /* ===== OPTIMIZACIONES POR DENSIDAD Y LAYOUT CORREGIDAS ===== */
      ${productsPerPage === 6 ? `
        @media print {
          /* PRINT PRESERVANDO INFORMACIÓN CRÍTICA - FIX DEFINITIVO */
          .product-name {
            display: -webkit-box !important;
            -webkit-box-orient: vertical !important;
            -webkit-line-clamp: 3 !important;
            word-break: break-word !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            overflow: hidden !important;
            max-height: none !important;
            line-height: 1.35 !important;
            white-space: normal !important;
            text-overflow: clip !important;
            hyphens: auto !important;
            -webkit-hyphens: auto !important;
          }
          
          .product-price-retail {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
            word-wrap: break-word !important;
          }
          
          .product-price-wholesale {
            overflow: visible !important;
            height: auto !important;
            min-height: 8mm !important;
          }
          
          .wholesale-label,
          .wholesale-price {
            overflow: visible !important;
            white-space: nowrap !important;
            text-overflow: unset !important;
          }
        }
      ` : ''}
      ${this.generateDensitySpecificCSS(template, productsPerPage)}
    `;
  }
  
  /**
   * 🔧 DIMENSIONES DINÁMICAS CORREGIDAS + FIX 2x2
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
    
    // 🔧 GAP DINÁMICO CORREGIDO BASADO EN PRODUCTOS POR PÁGINA
    const gapMap = { 
      4: Math.max(6, contentWidth * 0.025),  // REDUCIDO de 0.035 a 0.025
      6: Math.max(5, contentWidth * 0.020),  // Gap estándar (era 4)
      9: Math.max(6, contentWidth * 0.025)   // MÁS GAP para 9 productos (era 3)
    };
    const gap = gapMap[productsPerPage] || 5;
    
    const totalGapWidth = (columns - 1) * gap;
    const availableWidth = contentWidth - totalGapWidth;
    const cardWidth = availableWidth / columns;
    
    // 🚀 ALTURA DINÁMICA CORREGIDA BASADA EN PRODUCTOS POR PÁGINA + FIX 2x2
    let cardHeight;
    
    if (productsPerPage === 4) {
      // 🔧 CORREGIDO: Reducir altura para evitar productos alargados
      cardHeight = cardWidth + 45; // AUMENTADO de 35 a 45 (+29% más espacio)
    } else if (productsPerPage === 6) {
      cardHeight = cardWidth + 48;
    } else if (productsPerPage === 9) {
      // 🔧 CORREGIDO: Más altura para dar más espacio al contenido
      cardHeight = cardWidth + 20; // REDUCIDO para grid 3x3 compacto
    } else {
      cardHeight = cardWidth + 30;
    }
    
    // 🔧 RATIO DINÁMICO DE IMAGEN CORREGIDO
    const imageHeightRatio = productsPerPage === 4 ? 0.63 :
                            productsPerPage === 6 ? 0.48 :
                            0.62;
    
    const imageHeight = cardHeight * imageHeightRatio;
    const textAreaHeight = cardHeight - imageHeight;
    
    // 🔧 LÍMITES DINÁMICOS CORREGIDOS
    const minCardHeight = productsPerPage === 4 ? 55 : // AUMENTADO de 45 a 55
                         productsPerPage === 6 ? 40 : // SIN CAMBIOS  
                         38; // AUMENTADO de 35 para 9 productos
                         
    const maxCardHeight = productsPerPage === 4 ? 125 : // AUMENTADO de 110 a 125
                         productsPerPage === 6 ? 100 : // SIN CAMBIOS
                         75; // REDUCIDO de 80 para 9 productos
    
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
   * 🔧 NUEVAS FUNCIONES PARA CORREGIR PROBLEMAS DE SPACING + FIX 2x2
   */
  
  // Márgenes de header específicos
  private static getHeaderMargin(productsPerPage: 4 | 6 | 9): number {
    const margins = { 4: 8, 6: 6, 9: 5 }; // 4: más margen, 9: menos margen
    return margins[productsPerPage];
  }
  
  // Margen superior del contenido (separación del header)
  private static getContentTopMargin(productsPerPage: 4 | 6 | 9): number {
    const margins = { 4: 10, 6: 8, 9: 12 }; // 9: MÁS margen para separar del header
    return margins[productsPerPage];
  }
  
  // Margen del footer
  private static getFooterMargin(productsPerPage: 4 | 6 | 9): number {
    const margins = { 4: 10, 6: 8, 9: 8 };
    return margins[productsPerPage];
  }
  
  // Padding interno de cards
  private static getCardPadding(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 4, 6: 3, 9: 4 }; // 9: MÁS padding interno
    return paddings[productsPerPage];
  }
  
  // Gap entre elementos de texto
  private static getTextGap(productsPerPage: 4 | 6 | 9): number {
    const gaps = { 4: 3, 6: 2.5, 9: 3 };
    return gaps[productsPerPage];
  }
  
  // Gap entre precios
  private static getPricingGap(productsPerPage: 4 | 6 | 9): number {
    const gaps = { 4: 3, 6: 2, 9: 2.8 }; // 🔧 REDUCIDO de 2.5 a 2 para 6 productos  
    return gaps[productsPerPage];
  }
  
  // Padding del precio wholesale
  private static getWholesalePadding(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 2.5, 6: 2, 9: 2.2 }; // 9: Más padding
    return paddings[productsPerPage];
  }
  
  // Altura mínima del wholesale
  private static getWholesaleMinHeight(productsPerPage: 4 | 6 | 9): number {
    const heights = { 4: 12, 6: 8, 9: 9 }; // AUMENTADO de 10 a 12 para evitar overflow
    return heights[productsPerPage];
  }
  
  // Extra height para print
  private static getPrintExtraHeight(productsPerPage: 4 | 6 | 9): number {
    const extras = { 4: 8, 6: 8, 9: 10 }; // 9: Más altura extra en print
    return extras[productsPerPage];
  }
  
  // Extra height para texto en print  
  private static getPrintTextExtraHeight(productsPerPage: 4 | 6 | 9): number {
    const extras = { 4: 5, 6: 5, 9: 7 }; // 9: Más altura de texto en print
    return extras[productsPerPage];
  }
  
  /**
   * 🔧 CSS ESPECÍFICO PARA PRINT CORREGIDO + FIX 2x2
   */
  private static generatePrintSpecificCSS(productsPerPage: 4 | 6 | 9): string {
    if (productsPerPage === 4) {
      return `
        /* PRINT OPTIMIZATIONS PARA 4 PRODUCTOS - 2x2 FORZADO */
        .products-grid {
          grid-template-rows: repeat(2, var(--card-height)) !important;
          grid-template-columns: repeat(2, 1fr) !important;
          height: calc(var(--card-height) * 2 + var(--gap)) !important;
          min-height: calc(var(--card-height) * 2 + var(--gap)) !important;
        }
        
        .product-card {
          justify-self: center !important;
          align-self: start !important;
        }
        
        .product-price-wholesale {
          min-height: 12mm !important; /* ASEGURAR ALTURA MÍNIMA */
        }
      `;
      } else if (productsPerPage === 9) {
      return `
        /* PRINT OPTIMIZATIONS PARA 9 PRODUCTOS - COMPACTO */
        .products-grid {
          gap: var(--gap) !important;
          height: auto !important;
          max-height: 250mm !important;
          grid-template-rows: repeat(3, minmax(0, 1fr)) !important;
          align-content: start !important;
        }
        
        .product-card {
          height: auto !important;
          max-height: calc(var(--card-height) - 3mm) !important;
          padding: 2mm !important;
        }
        
        .product-pricing {
          gap: calc(${this.getPricingGap(9) + 1}mm * var(--padding-scale)) !important;
        }
        
        .product-price-wholesale {
          min-height: calc(${this.getWholesaleMinHeight(9) + 2}mm * var(--padding-scale)) !important;
          padding: calc(${this.getWholesalePadding(9) + 0.5}mm * var(--padding-scale)) !important;
        }
      `;
    }
    return '';
  }
  
  // ===== RESTO DE FUNCIONES SIN CAMBIOS CRÍTICOS =====
  
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
      6: 0.85, // 🔧 REDUCIDO de 1.0 a 0.85 para 6 productos
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
   * 🎯 CSS ESPECÍFICO POR GRID CORREGIDO + FIX 2x2
   */
  private static generateGridSpecificCSS(productsPerPage: 4 | 6 | 9): string {
    if (productsPerPage === 4) {
      return `
        /* 🚀 GRID 4 PRODUCTOS - 2x2 CORREGIDO + FORZADO */
        justify-items: center;
        align-items: start;
        grid-template-rows: repeat(2, minmax(0, 1fr)) !important;
        grid-template-columns: repeat(2, 1fr) !important;
        place-content: start center !important;
        
        /* Forzar posicionamiento explícito */
        grid-auto-flow: row !important;
        
        /* Debug visual (descomentar para debug) */
        /* border: 2px solid red !important; */
      `;
    } else if (productsPerPage === 9) {
      return `
        /* GRID 9 PRODUCTOS - 3x3 CORREGIDO */
        justify-items: stretch;
        align-items: stretch;
        grid-template-rows: repeat(3, 1fr) !important;
        grid-template-columns: repeat(3, 1fr) !important;
      `;
    }
    return `
      /* GRID 6 PRODUCTOS - 3x2 (SIN CAMBIOS) */
      justify-items: center;
      align-items: stretch;
    `;
  }
  
  /**
   * 🎯 CSS ESPECÍFICO POR CARD CORREGIDO + FIX 2x2
   */
  private static generateCardSpecificCSS(
    productsPerPage: 4 | 6 | 9, 
    template: IndustryTemplate
  ): string {
    if (productsPerPage === 4) {
      return `
        /* CARDS GRANDES - 4 PRODUCTOS CORREGIDO */
        justify-self: center;
        max-width: 98%; /* AUMENTADO de 95% a 98% */
        min-width: 92%; /* AUMENTADO de 85% a 92% */
      `;
    } else if (productsPerPage === 9) {
      return `
        /* CARDS COMPACTAS - 9 PRODUCTOS CORREGIDO */
        justify-self: stretch;
        max-width: 100%;
        min-width: 100%;
      `;
    }
    return `
      /* CARDS ESTÁNDAR - 6 PRODUCTOS */
      justify-self: center;
      max-width: 100%;
    `;
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
  
  // ===== RESTO DE FUNCIONES HELPER SIN CAMBIOS =====
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL DE GENERACIÓN HTML CON FIX 2x2
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
    <title>Catálogo - ${businessName} (${productsPerPage} productos/página)${productsPerPage === 4 ? ' - 2x2 Fixed' : ''}</title>
    <meta name="products-per-page" content="${productsPerPage}">
    <meta name="grid-fix" content="${productsPerPage === 4 ? '2x2-fixed' : 'original'}">
    <style>
        ${css}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        <header class="catalog-header page-break-avoid">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos (${productsPerPage} por página)${productsPerPage === 4 ? ' - Grid 2x2 Corregido' : ''}</p>
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
   * 🔧 GENERACIÓN DE GRID HTML CORREGIDA PARA 2x2
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
      
      // 🚀 FIX CRÍTICO: Para 2x2, siempre generar exactamente 4 slots
      let totalCards: (Product | null)[] = [];
      
      if (productsPerPage === 4) {
        console.log(`🔧 Generando página ${page + 1} con grid 2x2, productos: ${pageProducts.length}`);
        
        // Rellenar con productos reales
        for (let i = 0; i < 4; i++) {
          if (i < pageProducts.length) {
            totalCards.push(pageProducts[i]);
          } else {
            totalCards.push(null); // Card vacía
          }
        }
      } else {
        // Lógica original para 3x2 y 3x3 (SIN CAMBIOS)
        totalCards = [...pageProducts];
        const emptyCardsNeeded = productsPerPage - pageProducts.length;
        
        for (let i = 0; i < emptyCardsNeeded; i++) {
          totalCards.push(null);
        }
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
            Generado con CatifyPro v2.0 - Grid 2x2 Corregido
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
          Generado con CatifyPro v2.0 - Grid 2x2 Corregido
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