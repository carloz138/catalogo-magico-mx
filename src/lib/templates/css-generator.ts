// src/lib/templates/css-generator.ts - SOLUCIÓN DEFINITIVA PARA PDFS SIN CORTES
// 🎯 REESCRITO COMPLETAMENTE PARA ELIMINAR TODOS LOS PROBLEMAS DE LAYOUT

import { IndustryTemplate } from './industry-templates';

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
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
}

export class TemplateGenerator {
  
  /**
   * 🎨 CSS GENERATOR INTEGRAL - SISTEMA ROBUSTO SIN CORTES
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const dimensions = this.calculateRobustDimensions(template);
    const colors = this.generateColorScheme(template);
    const typography = this.calculateTypography(template);
    
    return `
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} - ANTI-CORTES ===== */
      
      /* ===== VARIABLES CSS PRECISAS ===== */
      :root {
        --primary: ${colors.primary};
        --secondary: ${colors.secondary};
        --accent: ${colors.accent};
        --bg: ${colors.background};
        --card-bg: ${colors.cardBackground};
        --text: ${colors.textPrimary};
        --text-light: ${colors.textSecondary};
        --border: ${colors.borderColor};
        
        /* DIMENSIONES EXACTAS EN MM (MÁS PRECISAS QUE PX) */
        --page-width: 210mm;
        --page-height: 297mm;
        --margin: ${dimensions.margin}mm;
        --content-width: ${dimensions.contentWidth}mm;
        --content-height: ${dimensions.contentHeight}mm;
        
        /* CARD DIMENSIONS - CALCULADAS CON PRECISIÓN MATEMÁTICA */
        --columns: ${dimensions.columns};
        --card-width: ${dimensions.cardWidth}mm;
        --card-height: ${dimensions.cardHeight}mm;
        --gap: ${dimensions.gap}mm;
        --image-height: ${dimensions.imageHeight}mm;
        
        /* TIPOGRAFÍA EN PT (ÓPTIMA PARA PDF) */
        --header-size: ${typography.headerSize}pt;
        --title-size: ${typography.titleSize}pt;
        --price-size: ${typography.priceSize}pt;
        --desc-size: ${typography.descSize}pt;
        --info-size: ${typography.infoSize}pt;
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
      
      /* ===== PÁGINA PDF PERFECTA ===== */
      @page {
        size: A4 portrait;
        margin: var(--margin);
        marks: none;
        bleed: 0;
      }
      
      /* ===== HTML Y BODY BASE ===== */
      html {
        width: var(--page-width);
        height: auto;
        font-size: 12pt; /* Base font size para PDF */
      }
      
      body.template-${template.id} {
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: var(--bg) !important;
        color: var(--text) !important;
        line-height: 1.3;
        width: var(--content-width);
        min-height: var(--content-height);
        margin: 0 auto;
        font-size: 12pt;
        position: relative;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== CONTAINER PRINCIPAL ===== */
      .catalog-container {
        width: 100%;
        max-width: var(--content-width);
        background: var(--bg) !important;
        position: relative;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== HEADER ROBUSTO ===== */
      .catalog-header {
        width: 100%;
        background: var(--primary) !important;
        background-image: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
        color: white !important;
        text-align: center;
        padding: 12mm 8mm;
        margin-bottom: 6mm;
        border-radius: ${template.design.borderRadius}px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .business-name {
        font-size: var(--header-size);
        font-weight: 700;
        margin-bottom: 2mm !important;
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
        margin-top: 1mm !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== PRODUCTS SECTION ===== */
      .products-section {
        width: 100%;
      }
      
      /* ===== SISTEMA DE GRID ROBUSTO - TABLA EN LUGAR DE FLEXBOX ===== */
      .products-grid {
        display: table !important;
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: separate !important;
        border-spacing: var(--gap) !important;
        margin: 0 !important;
        page-break-inside: avoid;
      }
      
      /* ===== ROWS DE PRODUCTOS ===== */
      .products-row {
        display: table-row !important;
        width: 100% !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* ===== PRODUCT CARDS CON TABLE-CELL (MÁS ROBUSTO) ===== */
      .product-card {
        /* TABLE CELL - MÁS COMPATIBLE QUE FLEXBOX */
        display: table-cell !important;
        width: calc(100% / var(--columns)) !important;
        height: var(--card-height) !important;
        
        /* ESTRUCTURA VISUAL */
        background: var(--card-bg) !important;
        border: 0.5pt solid var(--border) !important;
        border-radius: ${template.design.borderRadius}px !important;
        overflow: hidden !important;
        position: relative !important;
        vertical-align: top !important;
        
        /* PREVENIR CORTES */
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
        
        /* SOMBRAS CONDICIONALES */
        ${template.design.shadows ? 'box-shadow: 0 1mm 3mm rgba(0, 0, 0, 0.1);' : ''}
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== CONTENIDO INTERNO DE CARD ===== */
      .product-card-inner {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        width: 100% !important;
        padding: 3mm !important;
        box-sizing: border-box !important;
      }
      
      /* ===== IMAGEN CONTAINER ROBUSTO ===== */
      .product-image-container {
        width: 100% !important;
        height: var(--image-height) !important;
        background: #f8f9fa !important;
        border-radius: ${Math.max(template.design.borderRadius - 2, 2)}px !important;
        overflow: hidden !important;
        position: relative !important;
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border: 0.25pt solid var(--border) !important;
        margin-bottom: 2mm !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== IMAGEN PERFECTA SIN CORTES ===== */
      .product-image {
        max-width: 90% !important;
        max-height: 90% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        margin: auto !important;
        border-radius: 2px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        filter: none !important;
      }
      
      /* ===== PLACEHOLDER DE IMAGEN ===== */
      .product-image-placeholder {
        width: 90% !important;
        height: 90% !important;
        background: 
          repeating-conic-gradient(from 0deg at 50% 50%, 
            #f0f0f0 0deg 90deg, 
            transparent 90deg 180deg) !important;
        background-size: 10px 10px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        color: #999 !important;
        font-size: 8pt !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== INFORMACIÓN DEL PRODUCTO ===== */
      .product-info {
        flex-grow: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        min-height: calc(var(--card-height) - var(--image-height) - 8mm) !important;
        text-align: center !important;
      }
      
      /* ===== ELEMENTOS DE TEXTO CON TRUNCACIÓN INTELIGENTE ===== */
      .product-name {
        font-size: var(--title-size) !important;
        font-weight: 600 !important;
        color: var(--primary) !important;
        line-height: 1.2 !important;
        margin-bottom: 1mm !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        
        /* TRUNCATION SYSTEM */
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getNameLines(template.density)} !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-price {
        font-size: var(--price-size) !important;
        font-weight: 700 !important;
        color: white !important;
        background: var(--secondary) !important;
        background-image: linear-gradient(135deg, var(--secondary), var(--primary)) !important;
        padding: 1.5mm 3mm !important;
        border-radius: 15px !important;
        display: inline-block !important;
        margin: 1mm auto !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 1pt 2pt rgba(0,0,0,0.2) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== ELEMENTOS CONDICIONALES OPTIMIZADOS ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: var(--info-size) !important;
        color: var(--accent) !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        background: ${this.hexToRgba(template.colors.accent, 0.15)} !important;
        padding: 0.5mm 2mm !important;
        border-radius: 8px !important;
        display: inline-block !important;
        margin-bottom: 1mm !important;
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
        margin: 1mm 0 !important;
        
        /* TRUNCATION */
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getDescLines(template.density)} !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-description { display: none !important; }`}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: calc(var(--info-size) * 0.9) !important;
        color: var(--text-light) !important;
        font-family: 'Courier New', monospace !important;
        background: rgba(0, 0, 0, 0.05) !important;
        padding: 0.5mm 1.5mm !important;
        border-radius: 3px !important;
        display: inline-block !important;
        margin: 0.5mm 0 !important;
        border: 0.25pt solid var(--border) !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-sku { display: none !important; }`}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: calc(var(--info-size) * 0.85) !important;
        color: var(--text-light) !important;
        border-top: 0.25pt solid var(--border) !important;
        padding-top: 1mm !important;
        margin-top: 1mm !important;
        line-height: 1.3 !important;
        
        /* TRUNCATION */
        max-height: ${this.getSpecsHeight(template.density)}mm !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-specifications { display: none !important; }`}
      
      /* ===== FOOTER ROBUSTO ===== */
      .catalog-footer {
        width: 100% !important;
        background: var(--secondary) !important;
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)} !important;
        padding: 6mm !important;
        text-align: center !important;
        border-top: 1pt solid var(--border) !important;
        margin-top: 8mm !important;
        border-radius: ${template.design.borderRadius}px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .business-contact {
        font-size: 10pt !important;
        line-height: 1.4 !important;
        margin-bottom: 2mm !important;
        font-weight: 600 !important;
        word-wrap: break-word !important;
      }
      
      .contact-item {
        display: inline-block !important;
        margin: 0 2mm !important;
        padding: 1mm 2mm !important;
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .footer-branding {
        margin-top: 3mm !important;
        font-size: 8pt !important;
        opacity: 0.8 !important;
        font-weight: 300 !important;
      }
      
      /* ===== SYSTEM DE PAGINACIÓN ROBUSTO ===== */
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
      
      /* CONTROL DE HUÉRFANOS Y VIUDAS */
      .products-section {
        orphans: 1 !important;
        widows: 1 !important;
      }
      
      .products-grid .products-row:last-child {
        page-break-after: avoid !important;
      }
      
      /* ===== RESPONSIVE SIMPLIFICADO ===== */
      @media screen and (max-width: 768px) {
        :root {
          --columns: 1;
          --card-width: calc(var(--content-width) - 4mm);
          --gap: 2mm;
        }
        
        .products-grid {
          display: block !important;
        }
        
        .products-row {
          display: block !important;
        }
        
        .product-card {
          display: block !important;
          width: 100% !important;
          margin-bottom: var(--gap) !important;
        }
      }
      
      /* ===== PRINT/PDF OPTIMIZATIONS ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          background: white !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .catalog-container {
          width: 100% !important;
          max-width: none !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .product-image {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          filter: none !important;
        }
      }
      
      /* ===== OPTIMIZACIONES ESPECÍFICAS POR INDUSTRIA ===== */
      ${this.generateIndustrySpecificCSS(template)}
      
      /* ===== OPTIMIZACIONES POR DENSIDAD ===== */
      ${this.generateDensitySpecificCSS(template)}
    `;
  }
  
  /**
   * 📐 CALCULAR DIMENSIONES ROBUSTAS MATEMÁTICAMENTE
   */
  private static calculateRobustDimensions(template: IndustryTemplate) {
    // A4: 210mm x 297mm
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Márgenes seguros según densidad
    const marginMap = { alta: 12, media: 15, baja: 18 };
    const margin = marginMap[template.density as keyof typeof marginMap] || 15;
    
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    // Columnas según products per page
    const columns = template.gridColumns;
    
    // Gap seguro según densidad
    const gapMap = { alta: 2, media: 3, baja: 4 };
    const gap = gapMap[template.density as keyof typeof gapMap] || 3;
    
    // Ancho de card matemáticamente exacto
    const totalGapWidth = (columns - 1) * gap;
    const cardWidth = (contentWidth - totalGapWidth) / columns;
    
    // Altura de card según densidad y productos por página
    const baseHeightMap = { alta: 50, media: 65, baja: 80 };
    const cardHeight = baseHeightMap[template.density as keyof typeof baseHeightMap] || 65;
    
    // Altura de imagen (65% de la card)
    const imageHeight = cardHeight * 0.65;
    
    return {
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      contentHeight,
      columns,
      gap,
      cardWidth: Math.floor(cardWidth * 100) / 100, // Redondear a 2 decimales
      cardHeight,
      imageHeight,
      textHeight: cardHeight * 0.35
    };
  }
  
  /**
   * 🎯 CALCULAR TIPOGRAFÍA SEGÚN DENSIDAD
   */
  private static calculateTypography(template: IndustryTemplate) {
    const densityMap = {
      alta: { header: 16, title: 9, price: 10, desc: 7, info: 6 },
      media: { header: 20, title: 11, price: 12, desc: 8, info: 7 },
      baja: { header: 24, title: 13, price: 14, desc: 9, info: 8 }
    };
    
    const sizes = densityMap[template.density as keyof typeof densityMap] || densityMap.media;
    
    return {
      headerSize: sizes.header,
      titleSize: sizes.title,
      priceSize: sizes.price,
      descSize: sizes.desc,
      infoSize: sizes.info
    };
  }
  
  /**
   * 🎨 GENERAR ESQUEMA DE COLORES
   */
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
      borderColor: isLight ? '#ecf0f1' : '#34495e'
    };
  }
  
  /**
   * 📝 HELPERS PARA TRUNCACIÓN DE TEXTO
   */
  private static getNameLines(density: string): number {
    return { alta: 2, media: 3, baja: 4 }[density as keyof typeof density] || 3;
  }
  
  private static getDescLines(density: string): number {
    return { alta: 2, media: 3, baja: 4 }[density as keyof typeof density] || 3;
  }
  
  private static getSpecsHeight(density: string): number {
    return { alta: 8, media: 12, baja: 16 }[density as keyof typeof density] || 12;
  }
  
  /**
   * 🏭 CSS ESPECÍFICO POR INDUSTRIA
   */
  private static generateIndustrySpecificCSS(template: IndustryTemplate): string {
    const industryStyles = {
      joyeria: `
        .template-${template.id} .product-image-container {
          background: linear-gradient(45deg, #fff8f0, #ffffff) !important;
          border: 1pt solid ${template.colors.accent}50 !important;
        }
        .template-${template.id} .product-card {
          border: 1pt solid ${template.colors.accent} !important;
        }
        .template-${template.id} .product-name {
          font-family: 'Georgia', serif !important;
          letter-spacing: 0.3pt !important;
        }
      `,
      moda: `
        .template-${template.id} .product-card {
          border-radius: ${template.design.borderRadius * 1.5}px !important;
        }
        .template-${template.id} .product-image-container {
          border-radius: ${template.design.borderRadius * 1.2}px !important;
        }
      `,
      electronica: `
        .template-${template.id} .product-image-container {
          background: linear-gradient(135deg, #f1f3f4, #ffffff) !important;
          border: 1pt solid #e0e0e0 !important;
        }
        .template-${template.id} .product-card {
          border-radius: ${Math.max(template.design.borderRadius * 0.8, 4)}px !important;
        }
      `,
      ferreteria: `
        .template-${template.id} .product-card {
          border: 1.5pt solid ${template.colors.accent} !important;
          border-radius: 4px !important;
        }
      `,
      cosmeticos: `
        .template-${template.id} .product-card {
          border-radius: ${template.design.borderRadius * 1.3}px !important;
          background: linear-gradient(145deg, #ffffff, #fefefe) !important;
        }
      `
    };
    
    return industryStyles[template.industry as keyof typeof industryStyles] || '';
  }
  
  /**
   * 🎯 CSS ESPECÍFICO POR DENSIDAD
   */
  private static generateDensitySpecificCSS(template: IndustryTemplate): string {
    if (template.density === 'alta') {
      return `
        .template-${template.id} .product-card {
          border-width: 0.25pt !important;
        }
        .template-${template.id} .product-card-inner {
          padding: 2mm !important;
        }
      `;
    }
    
    if (template.density === 'baja') {
      return `
        .template-${template.id} .product-card {
          border-width: 1pt !important;
        }
        .template-${template.id} .product-card-inner {
          padding: 4mm !important;
        }
      `;
    }
    
    return '';
  }
  
  /**
   * 🏗️ GENERAR HTML CON ESTRUCTURA TABLA ROBUSTA
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTMLTable(products, template);
    const footerHTML = this.generateFooterHTML(businessInfo);
    
    const businessName = businessInfo.business_name || 'Mi Negocio';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=210mm, initial-scale=1.0">
    <title>Catálogo - ${businessName}</title>
    <style>
        ${css}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        <!-- Header robusto -->
        <header class="catalog-header page-break-avoid">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos</p>
        </header>
        
        <!-- Products con tabla robusta -->
        <main class="products-section">
            ${productsHTML}
        </main>
        
        <!-- Footer -->
        ${footerHTML}
    </div>
</body>
</html>`;
  }
  
  /**
   * 🛍️ GENERAR HTML DE PRODUCTOS CON TABLA (MÁS ROBUSTO QUE FLEXBOX)
   */
  private static generateProductsHTMLTable(products: Product[], template: IndustryTemplate): string {
    const productsPerPage = template.productsPerPage;
    const columns = template.gridColumns;
    const rowsPerPage = Math.ceil(productsPerPage / columns);
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    let htmlPages = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      const pageBreakClass = page > 0 ? 'page-break-before' : '';
      
      htmlPages += `
        <div class="products-page ${pageBreakClass}">
          <div class="products-grid">
            ${this.generateProductRows(pageProducts, columns, template)}
          </div>
        </div>
      `;
    }
    
    return htmlPages;
  }
  
  /**
   * 📋 GENERAR FILAS DE PRODUCTOS
   */
  private static generateProductRows(products: Product[], columns: number, template: IndustryTemplate): string {
    let rowsHTML = '';
    
    for (let i = 0; i < products.length; i += columns) {
      const rowProducts = products.slice(i, i + columns);
      
      rowsHTML += `
        <div class="products-row page-break-avoid">
          ${rowProducts.map(product => this.generateProductCard(product, template)).join('')}
          ${this.fillEmptyCards(columns - rowProducts.length)}
        </div>
      `;
    }
    
    return rowsHTML;
  }
  
  /**
   * 🎴 GENERAR TARJETA DE PRODUCTO INDIVIDUAL
   */
  private static generateProductCard(product: Product, template: IndustryTemplate): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    const productSku = product.sku || '';
    const productCategory = product.category || '';
    const productSpecs = product.specifications || '';
    
    const imageHTML = productImage ? 
      `<img src="${productImage}" alt="${productName}" class="product-image" loading="eager" crossorigin="anonymous" />` :
      `<div class="product-image-placeholder">
         <div style="font-size: 14pt; margin-bottom: 2mm;">📷</div>
         <div style="font-size: 8pt;">Sin imagen</div>
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
            
            <div class="product-price">$${productPrice.toLocaleString('es-MX', { 
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}</div>
            
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
  
  /**
   * ⬜ LLENAR CARDS VACÍAS PARA COMPLETAR FILA
   */
  private static fillEmptyCards(count: number): string {
    if (count <= 0) return '';
    
    return Array(count).fill(`
      <div class="product-card" style="visibility: hidden;">
        <div class="product-card-inner">
          <div class="product-image-container"></div>
          <div class="product-info"></div>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * 📄 GENERAR FOOTER
   */
  private static generateFooterHTML(businessInfo: BusinessInfo): string {
    const contactItems = [
      businessInfo.phone ? `<span class="contact-item">📞 ${businessInfo.phone}</span>` : '',
      businessInfo.email ? `<span class="contact-item">📧 ${businessInfo.email}</span>` : '',
      businessInfo.website ? `<span class="contact-item">🌐 ${businessInfo.website}</span>` : '',
      businessInfo.address ? `<span class="contact-item">📍 ${businessInfo.address}</span>` : ''
    ].filter(Boolean);
    
    if (contactItems.length === 0) {
      return `
        <footer class="catalog-footer page-break-avoid">
          <div class="footer-branding">
            Generado con CatalogoIA
          </div>
        </footer>
      `;
    }
    
    return `
      <footer class="catalog-footer page-break-avoid">
        <div class="business-contact">
          ${contactItems.join(' ')}
        </div>
        <div class="footer-branding">
          Generado con CatalogoIA
        </div>
      </footer>
    `;
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