// src/lib/templates/css-generator.ts - ARREGLADO COMPLETAMENTE
// 🎯 NUEVA VERSIÓN SIN DEFORMACIONES - REEMPLAZA EL ARCHIVO ACTUAL

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
   * 🎨 CSS GENERATOR COMPLETAMENTE REESCRITO - GRID SYSTEM ROBUSTO
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const dimensions = this.calculateRobustDimensions(template);
    const colors = this.generateColorScheme(template);
    const typography = this.calculateTypography(template);
    
    return `
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} - GRID SYSTEM ROBUSTO ===== */
      
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
        
        /* DIMENSIONES EXACTAS CALCULADAS */
        --page-width: 210mm;
        --page-height: 297mm;
        --margin: ${dimensions.margin}mm;
        --content-width: ${dimensions.contentWidth}mm;
        --content-height: ${dimensions.contentHeight}mm;
        
        /* GRID DIMENSIONS - MATEMÁTICAMENTE PRECISAS */
        --columns: ${dimensions.columns};
        --card-width: ${dimensions.cardWidth}mm;
        --card-height: ${dimensions.cardHeight}mm;
        --gap: ${dimensions.gap}mm;
        --image-height: ${dimensions.imageHeight}mm;
        --text-area-height: ${dimensions.textAreaHeight}mm;
        
        /* TIPOGRAFÍA OPTIMIZADA */
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
        orphans: 1;
        widows: 1;
      }
      
      /* ===== HTML Y BODY OPTIMIZADOS ===== */
      html {
        width: var(--page-width);
        height: auto;
        font-size: 12pt;
        line-height: 1.3;
        margin: 0;
        padding: 0;
      }
      
      body.template-${template.id} {
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: var(--bg) !important;
        color: var(--text) !important;
        width: 100%;
        min-height: 100vh;
        margin: 0 !important;
        padding: var(--margin) !important;
        font-size: 12pt;
        position: relative;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
      }
      
      /* ===== CONTAINER PRINCIPAL CENTRADO ===== */
      .catalog-container {
        width: var(--content-width);
        max-width: var(--content-width);
        background: var(--bg) !important;
        position: relative;
        min-height: var(--content-height);
        margin: 0 auto !important;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== HEADER ROBUSTO ===== */
      .catalog-header {
        width: 100%;
        background: var(--primary) !important;
        background-image: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
        color: white !important;
        text-align: center;
        padding: 8mm;
        margin-bottom: 6mm;
        border-radius: ${Math.min(template.design?.borderRadius || 8, 12)}px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0;
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
      
      /* ===== PRODUCTS SECTION CON ESTRUCTURA MEJORADA ===== */
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
      
      /* ===== PRODUCTS PAGE CON CENTRADO PERFECTO ===== */
      .products-page {
        width: 100%;
        margin-bottom: 8mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      /* ===== NUEVO SISTEMA DE GRID CSS - CENTRADO PERFECTO ===== */
      .products-grid {
        display: grid !important;
        grid-template-columns: repeat(var(--columns), 1fr) !important;
        gap: var(--gap) !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        page-break-inside: avoid;
        align-items: start !important;
        justify-content: center !important;
        place-content: center !important;
      }
      
      /* ===== PRODUCT CARDS CON GRID (MUCHO MÁS ESTABLE) ===== */
      .product-card {
        /* GRID ITEM - MÁS CONFIABLE QUE TABLE-CELL */
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        height: var(--card-height) !important;
        min-height: var(--card-height) !important;
        max-height: var(--card-height) !important;
        
        /* ESTRUCTURA VISUAL */
        background: var(--card-bg) !important;
        border: 0.5pt solid var(--border) !important;
        border-radius: ${Math.min(template.design?.borderRadius || 8, 15)}px !important;
        overflow: hidden !important;
        position: relative !important;
        
        /* PREVENIR CORTES Y DEFORMACIONES */
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
        
        /* SOMBRAS CONDICIONALES */
        ${template.design.shadows ? 'box-shadow: 0 1mm 3mm rgba(0, 0, 0, 0.08);' : ''}
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== CONTENIDO INTERNO OPTIMIZADO ===== */
      .product-card-inner {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        width: 100% !important;
        padding: 3mm !important;
        box-sizing: border-box !important;
      }
      
      /* ===== IMAGEN CONTAINER CON ALTURA FIJA ===== */
      .product-image-container {
        width: 100% !important;
        height: var(--image-height) !important;
        min-height: var(--image-height) !important;
        max-height: var(--image-height) !important;
        background: #f8f9fa !important;
        border-radius: ${Math.max(Math.min(template.design?.borderRadius || 8, 15) - 2, 2)}px !important;
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
      
      /* ===== IMAGEN PERFECTA SIN DISTORSIÓN ===== */
      .product-image {
        max-width: 95% !important;
        max-height: 95% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        margin: auto !important;
        border-radius: 2px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== PLACEHOLDER MEJORADO ===== */
      .product-image-placeholder {
        width: 90% !important;
        height: 90% !important;
        background: 
          repeating-conic-gradient(from 0deg at 50% 50%, 
            #f0f0f0 0deg 90deg, 
            transparent 90deg 180deg) !important;
        background-size: 8px 8px !important;
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
      
      /* ===== INFORMACIÓN CON ALTURA RESTANTE ===== */
      .product-info {
        flex-grow: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        height: var(--text-area-height) !important;
        min-height: var(--text-area-height) !important;
        text-align: center !important;
        overflow: hidden !important;
      }
      
      /* ===== ELEMENTOS DE TEXTO OPTIMIZADOS ===== */
      .product-name {
        font-size: var(--title-size) !important;
        font-weight: 600 !important;
        color: var(--primary) !important;
        line-height: 1.2 !important;
        margin-bottom: 1mm !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        
        /* TRUNCATION MEJORADO */
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
        border-radius: 12px !important;
        display: inline-block !important;
        margin: 1mm auto !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 1pt 2pt rgba(0,0,0,0.15) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
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
        border-radius: 6px !important;
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
        
        /* TRUNCATION PERFECTO */
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
      
      /* ===== FOOTER COMPLETAMENTE REESCRITO Y FIJO ===== */
      .catalog-footer {
        width: 100% !important;
        background: var(--secondary) !important;
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)} !important;
        padding: 8mm !important;
        text-align: center !important;
        border-top: 1pt solid var(--border) !important;
        margin-top: auto !important;
        border-radius: ${Math.min(template.design?.borderRadius || 8, 12)}px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
        position: relative !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        box-sizing: border-box !important;
      }
      
      .business-contact {
        font-size: 9pt !important;
        line-height: 1.4 !important;
        margin-bottom: 3mm !important;
        font-weight: 600 !important;
        word-wrap: break-word !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 3mm !important;
        width: 100% !important;
      }
      
      .contact-item {
        display: inline-block !important;
        padding: 1.5mm 3mm !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        font-size: 8pt !important;
        border: 0.5pt solid rgba(255, 255, 255, 0.1) !important;
      }
      
      .footer-branding {
        margin-top: 3mm !important;
        font-size: 7pt !important;
        opacity: 0.9 !important;
        font-weight: 300 !important;
        color: rgba(255, 255, 255, 0.8) !important;
      }
      
      /* ===== PAGINACIÓN ROBUSTA ===== */
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
      
      /* ===== CARDS VACÍAS PARA COMPLETAR GRID ===== */
      .product-card.empty-card {
        visibility: hidden !important;
        height: var(--card-height) !important;
        min-height: var(--card-height) !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      
      /* ===== RESPONSIVE SIMPLIFICADO ===== */
      @media screen and (max-width: 768px) {
        :root {
          --columns: 1;
          --gap: 3mm;
        }
        
        .products-grid {
          grid-template-columns: 1fr !important;
        }
        
        .product-card {
          max-width: none !important;
        }
      }
      
      /* ===== OPTIMIZACIONES ESPECÍFICAS PARA PDF ===== */
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
        }
        
        /* EVITAR CORTES EN GRID */
        .products-grid {
          page-break-inside: auto !important;
        }
      }
      
      /* ===== OPTIMIZACIONES POR INDUSTRIA ===== */
      ${this.generateIndustrySpecificCSS(template)}
      
      /* ===== OPTIMIZACIONES POR DENSIDAD ===== */
      ${this.generateDensitySpecificCSS(template)}
    `;
  }
  
  /**
   * 📐 DIMENSIONES MATEMÁTICAMENTE PRECISAS COMPLETAMENTE REESCRITO
   */
  private static calculateRobustDimensions(template: IndustryTemplate) {
    // A4: 210mm x 297mm
    const pageWidth = 210;
    const pageHeight = 297;
    
    // 🎯 MÁRGENES OPTIMIZADOS Y BALANCEADOS
    const marginMap = { 
      alta: 8,     // Márgenes más pequeños para más contenido
      media: 10,   // Márgenes balanceados  
      baja: 12     // Márgenes amplios para look premium
    };
    const margin = marginMap[template.density as keyof typeof marginMap] || 10;
    
    // 📏 DIMENSIONES DE CONTENIDO EXACTAS
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    // Columnas según el template
    const columns = template.gridColumns;
    
    // 📐 GAP PROPORCIONAL AL ANCHO DE PÁGINA
    const gapMap = { 
      alta: Math.max(2, contentWidth * 0.01),      // 1% del ancho
      media: Math.max(3, contentWidth * 0.015),    // 1.5% del ancho
      baja: Math.max(4, contentWidth * 0.02)       // 2% del ancho
    };
    const gap = gapMap[template.density as keyof typeof gapMap] || 3;
    
    // 🎯 ANCHO DE CARD MATEMÁTICAMENTE PERFECTO
    const totalGapWidth = (columns - 1) * gap;
    const availableWidth = contentWidth - totalGapWidth;
    const cardWidth = availableWidth / columns;
    
    // 📦 ALTURA DE CARD CALCULADA PARA PROPORCIÓN PERFECTA
    let cardHeight;
    
    if (columns === 3) {
      // Para 3 columnas: tarjetas cuadradas
      cardHeight = cardWidth + 18; // +18mm para texto y precio
    } else if (columns === 2) {
      // Para 2 columnas: tarjetas más altas
      cardHeight = cardWidth + 25;
    } else if (columns === 4) {
      // Para 4 columnas: tarjetas compactas pero proporcionadas
      cardHeight = cardWidth + 15;
    } else if (columns >= 5) {
      // Para 5+ columnas: tarjetas pequeñas pero legibles
      cardHeight = cardWidth + 12;
    } else {
      // Para 1 columna: tarjetas horizontales
      cardHeight = cardWidth * 0.6 + 20;
    }
    
    // 🖼️ DISTRIBUCIÓN INTERNA OPTIMIZADA
    const imageHeightRatio = columns <= 2 ? 0.7 : columns === 3 ? 0.65 : 0.6;
    const imageHeight = cardHeight * imageHeightRatio;
    const textAreaHeight = cardHeight - imageHeight;
    
    // 🔍 VALIDACIÓN Y AJUSTES FINALES
    const minCardHeight = 35; // Mínimo 35mm para legibilidad
    const maxCardHeight = 90; // Máximo 90mm para caber en página
    
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
   * 🎯 CALCULAR TIPOGRAFÍA SEGÚN DENSIDAD MEJORADA
   */
  private static calculateTypography(template: IndustryTemplate) {
    const densityMap = {
      alta: { header: 14, title: 8, price: 9, desc: 6, info: 5 },
      media: { header: 18, title: 10, price: 11, desc: 7, info: 6 },
      baja: { header: 22, title: 12, price: 13, desc: 8, info: 7 }
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
   * 🎨 GENERAR ESQUEMA DE COLORES MEJORADO
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
      borderColor: isLight ? '#e9ecef' : '#34495e'
    };
  }
  
  /**
   * 🏗️ GENERAR HTML CON GRID SYSTEM ROBUSTO
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTMLGrid(products, template);
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
        <!-- Header optimizado -->
        <header class="catalog-header page-break-avoid">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos</p>
        </header>
        
        <!-- Products con CSS Grid -->
        <main class="products-section">
            ${productsHTML}
        </main>
        
        <!-- Footer fijo -->
        ${footerHTML}
    </div>
</body>
</html>`;
  }
  
  /**
   * 🛍️ GENERAR HTML CON CSS GRID (MUCHO MÁS ROBUSTO)
   */
  private static generateProductsHTMLGrid(products: Product[], template: IndustryTemplate): string {
    const productsPerPage = template.productsPerPage;
    const columns = template.gridColumns;
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    let htmlPages = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      // Completar con cards vacías para mantener grid
      const emptyCardsNeeded = productsPerPage - pageProducts.length;
      const totalCards = [...pageProducts];
      
      // Agregar productos vacíos para completar el grid
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
  
  /**
   * 🎴 GENERAR TARJETA DE PRODUCTO OPTIMIZADA
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
   * ⬜ CARD VACÍA PARA MANTENER GRID
   */
  private static generateEmptyCard(): string {
    return `<div class="product-card empty-card"></div>`;
  }
  
  /**
   * 📄 GENERAR FOOTER MEJORADO
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
            Generado con CatalogoIA v2.0
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
          Generado con CatalogoIA v2.0
        </div>
      </footer>
    `;
  }
  
  // ===== UTILITY FUNCTIONS (SIN CAMBIOS) ===== 
  
  private static getNameLines(density: string): number {
    return { alta: 2, media: 2, baja: 3 }[density as keyof typeof density] || 2;
  }
  
  private static getDescLines(density: string): number {
    return { alta: 1, media: 2, baja: 3 }[density as keyof typeof density] || 2;
  }
  
  private static getSpecsHeight(density: string): number {
    return { alta: 6, media: 8, baja: 12 }[density as keyof typeof density] || 8;
  }
  
  private static generateIndustrySpecificCSS(template: IndustryTemplate): string {
    const industryStyles = {
      joyeria: `
        .template-${template.id} .product-image-container {
          background: linear-gradient(45deg, #fff8f0, #ffffff) !important;
          border: 0.5pt solid ${template.colors.accent}50 !important;
        }
        .template-${template.id} .product-card {
          border: 0.75pt solid ${template.colors.accent} !important;
        }
        .template-${template.id} .product-name {
          font-family: 'Georgia', serif !important;
          letter-spacing: 0.2pt !important;
        }
      `,
      moda: `
        .template-${template.id} .product-card {
          border-radius: ${Math.min((template.design?.borderRadius || 8) * 1.2, 15)}px !important;
        }
        .template-${template.id} .product-image-container {
          border-radius: ${Math.min((template.design?.borderRadius || 8) * 1.1, 12)}px !important;
        }
      `,
      electronica: `
        .template-${template.id} .product-image-container {
          background: linear-gradient(135deg, #f1f3f4, #ffffff) !important;
          border: 0.5pt solid #e0e0e0 !important;
        }
        .template-${template.id} .product-card {
          border-radius: ${Math.min((template.design?.borderRadius || 8) * 0.8, 8)}px !important;
        }
      `,
      ferreteria: `
        .template-${template.id} .product-card {
          border: 1pt solid ${template.colors.accent} !important;
          border-radius: 4px !important;
        }
      `,
      cosmeticos: `
        .template-${template.id} .product-card {
          border-radius: ${Math.min((template.design?.borderRadius || 8) * 1.3, 15)}px !important;
          background: linear-gradient(145deg, #ffffff, #fefefe) !important;
        }
      `
    };
    
    return industryStyles[template.industry as keyof typeof industryStyles] || '';
  }
  
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