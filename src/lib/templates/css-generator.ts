// src/lib/templates/css-generator.ts - SOLUCIÓN INTEGRAL PARA PDF
// 🎯 REESCRITO COMPLETAMENTE PARA ELIMINAR CORTES Y PÁGINAS VACÍAS

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
   * 🎨 CSS GENERATOR INTEGRAL - PDF-FIRST APPROACH
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const spacing = this.getSpacingValues(template.design?.spacing || 'normal');
    const colors = this.generateProfessionalColorScheme(template);
    const dimensions = this.calculatePDFDimensions(template);
    
    return `
      /* ===== PDF-FIRST TEMPLATE: ${template.displayName.toUpperCase()} ===== */
      
      /* ===== VARIABLES CSS ===== */
      :root {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --background-color: ${colors.background};
        --card-background: ${colors.cardBackground};
        --text-primary: ${colors.textPrimary};
        --text-secondary: ${colors.textSecondary};
        --border-color: ${colors.borderColor};
        
        /* DIMENSIONES CALCULADAS PARA PDF */
        --page-width: ${dimensions.pageWidth}mm;
        --page-height: ${dimensions.pageHeight}mm;
        --margin: ${dimensions.margin}mm;
        --content-width: ${dimensions.contentWidth}mm;
        --card-width: ${dimensions.cardWidth}mm;
        --card-height: ${dimensions.cardHeight}mm;
        --image-height: ${dimensions.imageHeight}mm;
        --gap: ${dimensions.gap}mm;
      }
      
      /* ===== RESET Y BASE ===== */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* ===== CONFIGURACIÓN PÁGINA PDF ===== */
      @page {
        size: A4;
        margin: var(--margin);
      }
      
      html {
        width: var(--page-width);
        height: var(--page-height);
      }
      
      body.template-${template.id} {
        font-family: 'Arial', 'Helvetica', sans-serif;
        background: var(--background-color) !important;
        color: var(--text-primary);
        line-height: 1.4;
        font-size: 14px;
        width: var(--content-width);
        margin: 0 auto;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== CONTAINER PRINCIPAL ===== */
      .catalog-container {
        width: 100%;
        max-width: var(--content-width);
        background: var(--background-color) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== HEADER CON DIMENSIONES FIJAS ===== */
      .catalog-header {
        background: var(--primary-color) !important;
        color: white !important;
        padding: 15mm 10mm;
        text-align: center;
        width: 100%;
        margin-bottom: 8mm;
        page-break-after: avoid;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .business-name {
        font-size: ${this.getHeaderFontSize(template.density)}pt;
        font-weight: bold;
        margin-bottom: 3mm;
        letter-spacing: 1pt;
        text-transform: uppercase;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .catalog-subtitle {
        font-size: 14pt;
        font-weight: normal;
        opacity: 0.95;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== PRODUCTS SECTION CON FLEXBOX (MÁS COMPATIBLE) ===== */
      .products-section {
        width: 100%;
        padding: 0;
        margin: 0;
      }
      
      /* ===== SISTEMA FLEXBOX EN LUGAR DE GRID ===== */
      .products-grid {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 0; /* Sin gap - usamos margins */
        justify-content: flex-start;
        align-content: flex-start;
        page-break-inside: avoid;
      }
      
      /* ===== PRODUCT CARDS CON DIMENSIONES ABSOLUTAS ===== */
      .product-card {
        /* DIMENSIONES EXACTAS CALCULADAS */
        width: ${dimensions.cardWidth}mm;
        height: ${dimensions.cardHeight}mm;
        margin-right: ${dimensions.gap}mm;
        margin-bottom: ${dimensions.gap}mm;
        
        /* ESTRUCTURA */
        background: var(--card-background) !important;
        border: 0.5mm solid var(--border-color);
        border-radius: ${template.design.borderRadius}px;
        overflow: hidden;
        
        /* PDF OPTIMIZATIONS */
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        position: relative;
        flex-shrink: 0;
        flex-grow: 0;
        
        /* LAYOUT INTERNO */
        display: flex;
        flex-direction: column;
        
        ${template.design.shadows ? 'box-shadow: 0 1mm 2mm rgba(0, 0, 0, 0.1);' : ''}
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* AJUSTE PARA ÚLTIMA COLUMNA - QUITAR MARGIN RIGHT */
      .product-card:nth-child(${template.gridColumns}n) {
        margin-right: 0 !important;
      }
      
      /* ===== IMAGEN CONTAINER CON DIMENSIONES FIJAS ===== */
      .product-image-container {
        width: 100%;
        height: ${dimensions.imageHeight}mm;
        background: #f8f9fa !important;
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 0.5mm solid var(--border-color);
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== TÉCNICA IMG MEJORADA (MÁS COMPATIBLE QUE BACKGROUND) ===== */
      .product-image {
        max-width: 85%; /* REDUCIDO PARA MARGEN SEGURO */
        max-height: 85%; /* REDUCIDO PARA MARGEN SEGURO */
        width: auto;
        height: auto;
        object-fit: contain;
        object-position: center;
        display: block;
        margin: auto;
        border-radius: 2px;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* FALLBACK PARA IMÁGENES FALTANTES */
      .product-image-placeholder {
        width: 85%;
        height: 85%;
        background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        border: 1px dashed #ddd;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 10pt;
        text-align: center;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== INFORMACIÓN DEL PRODUCTO ===== */
      .product-info {
        flex-grow: 1;
        padding: ${this.getTextPadding(template.density)}mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: ${dimensions.textHeight}mm;
        background: var(--card-background) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-name {
        font-size: ${this.getProductNameFontSize(template.density)}pt;
        font-weight: bold;
        color: var(--text-primary) !important;
        margin-bottom: 2mm;
        line-height: 1.2;
        word-wrap: break-word;
        overflow: hidden;
        /* TRUNCAR TEXTO ESPECÍFICO POR DENSIDAD */
        display: -webkit-box;
        -webkit-line-clamp: ${this.getMaxLines(template.density)};
        -webkit-box-orient: vertical;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-price {
        font-size: ${this.getPriceFontSize(template.density)}pt;
        font-weight: bold;
        color: white !important;
        background: var(--primary-color) !important;
        padding: 2mm 4mm;
        border-radius: 10px;
        display: inline-block;
        text-align: center;
        margin: 2mm 0;
        max-width: 100%;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== INFORMACIÓN CONDICIONAL OPTIMIZADA ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: ${this.getCategoryFontSize(template.density)}pt;
        color: var(--accent-color) !important;
        text-transform: uppercase;
        font-weight: bold;
        margin-bottom: 1.5mm;
        background: ${this.hexToRgba(template.colors.accent, 0.15)} !important;
        padding: 1mm 2mm;
        border-radius: 8px;
        display: inline-block;
        max-width: 100%;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-category { display: none !important; }`}
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: ${this.getDescriptionFontSize(template.density)}pt;
        color: var(--text-secondary) !important;
        margin-bottom: 1.5mm;
        line-height: 1.3;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: ${this.getDescriptionMaxLines(template.density)};
        -webkit-box-orient: vertical;
        word-wrap: break-word;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-description { display: none !important; }`}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: ${this.getSkuFontSize(template.density)}pt;
        color: var(--text-secondary) !important;
        font-family: 'Courier New', monospace;
        background: rgba(0, 0, 0, 0.05) !important;
        padding: 1mm 2mm;
        border-radius: 3px;
        display: inline-block;
        margin-bottom: 1mm;
        border: 0.5px solid var(--border-color);
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-sku { display: none !important; }`}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: ${this.getSpecsFontSize(template.density)}pt;
        color: var(--text-secondary) !important;
        border-top: 0.5px solid var(--border-color);
        padding-top: 1.5mm;
        margin-top: 1.5mm;
        line-height: 1.3;
        overflow: hidden;
        max-height: ${this.getSpecsMaxHeight(template.density)}mm;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-specifications { display: none !important; }`}
      
      /* ===== FOOTER CON DIMENSIONES FIJAS ===== */
      .catalog-footer {
        width: 100%;
        background: var(--secondary-color) !important;
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)} !important;
        padding: 8mm;
        text-align: center;
        border-top: 1mm solid var(--border-color);
        margin-top: 10mm;
        page-break-before: avoid !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .business-contact {
        font-size: 11pt;
        line-height: 1.4;
        margin-bottom: 3mm;
        font-weight: bold;
      }
      
      .contact-item {
        display: inline-block;
        margin: 0 3mm;
        padding: 1.5mm 3mm;
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 10px;
        font-weight: bold;
        -webkit-print-color-adjust: exact !important;
      }
      
      .footer-branding {
        margin-top: 4mm;
        font-size: 9pt;
        opacity: 0.8;
        font-weight: normal;
      }
      
      /* ===== PAGE BREAK MANAGEMENT - CLAVE PARA EVITAR PÁGINAS VACÍAS ===== */
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
      }
      
      /* EVITAR CARDS HUÉRFANAS */
      .products-grid .product-card:last-child {
        page-break-after: avoid !important;
      }
      
      /* CONTROL DE FLUJO DE PÁGINAS */
      .products-section {
        orphans: 1;
        widows: 1;
      }
      
      /* ===== RESPONSIVE SIMPLIFICADO - MOBILE ONLY ===== */
      @media (max-width: 768px) {
        :root {
          --card-width: ${dimensions.contentWidth - 10}mm;
          --gap: 3mm;
        }
        
        .product-card {
          width: 100% !important;
          margin-right: 0 !important;
        }
        
        .product-card:nth-child(${template.gridColumns}n) {
          margin-right: 0 !important;
        }
      }
      
      /* ===== PRINT/PDF OVERRIDES ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          background: white !important;
          font-size: 12px !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .catalog-container {
          width: 100% !important;
          max-width: none !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          border: 1px solid #ddd !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .product-image {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .catalog-header,
        .catalog-footer,
        .product-price,
        .product-category {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
      
      /* ===== OPTIMIZACIONES ESPECÍFICAS POR TEMPLATE ===== */
      ${this.generateTemplateSpecificCSS(template)}
    `;
  }
  
  /**
   * 📐 CALCULAR DIMENSIONES PDF EXACTAS
   */
  private static calculatePDFDimensions(template: IndustryTemplate) {
    // Dimensiones A4: 210mm x 297mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = template.density === 'alta' ? 15 : template.density === 'media' ? 20 : 25;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    // Calcular dimensiones de cards
    const columns = template.gridColumns;
    const gap = template.density === 'alta' ? 3 : template.density === 'media' ? 4 : 5;
    const totalGapWidth = (columns - 1) * gap;
    const cardWidth = (contentWidth - totalGapWidth) / columns;
    
    // Altura de card según densidad
    const baseCardHeight = template.density === 'alta' ? 60 : template.density === 'media' ? 80 : 100;
    const cardHeight = baseCardHeight;
    
    // Altura de imagen (60% de la card)
    const imageHeight = cardHeight * 0.6;
    const textHeight = cardHeight * 0.4;
    
    return {
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
      contentHeight,
      cardWidth,
      cardHeight,
      imageHeight,
      textHeight,
      gap,
      columns
    };
  }
  
  /**
   * 🎯 TAMAÑOS DE FUENTE EN PUNTOS (PT) - MÁS PRECISOS PARA PDF
   */
  private static getHeaderFontSize(density: string): number {
    return { alta: 18, media: 22, baja: 26 }[density as keyof typeof density] || 22;
  }
  
  private static getProductNameFontSize(density: string): number {
    return { alta: 10, media: 12, baja: 14 }[density as keyof typeof density] || 12;
  }
  
  private static getPriceFontSize(density: string): number {
    return { alta: 11, media: 13, baja: 15 }[density as keyof typeof density] || 13;
  }
  
  private static getCategoryFontSize(density: string): number {
    return { alta: 8, media: 9, baja: 10 }[density as keyof typeof density] || 9;
  }
  
  private static getDescriptionFontSize(density: string): number {
    return { alta: 8, media: 9, baja: 10 }[density as keyof typeof density] || 9;
  }
  
  private static getSkuFontSize(density: string): number {
    return { alta: 7, media: 8, baja: 9 }[density as keyof typeof density] || 8;
  }
  
  private static getSpecsFontSize(density: string): number {
    return { alta: 7, media: 8, baja: 9 }[density as keyof typeof density] || 8;
  }
  
  /**
   * 📝 ALTURA Y LÍNEAS PARA TEXTO
   */
  private static getTextPadding(density: string): number {
    return { alta: 2, media: 3, baja: 4 }[density as keyof typeof density] || 3;
  }
  
  private static getMaxLines(density: string): number {
    return { alta: 2, media: 3, baja: 4 }[density as keyof typeof density] || 3;
  }
  
  private static getDescriptionMaxLines(density: string): number {
    return { alta: 2, media: 3, baja: 4 }[density as keyof typeof density] || 3;
  }
  
  private static getSpecsMaxHeight(density: string): number {
    return { alta: 10, media: 15, baja: 20 }[density as keyof typeof density] || 15;
  }
  
  /**
   * 🎨 CSS ESPECÍFICO POR TEMPLATE
   */
  private static generateTemplateSpecificCSS(template: IndustryTemplate): string {
    let specificCSS = '';
    
    // Optimizaciones por industria
    switch (template.industry) {
      case 'joyeria':
        specificCSS += `
          .template-${template.id} .product-image-container {
            background: linear-gradient(45deg, #f8f9fa, #ffffff) !important;
          }
          .template-${template.id} .product-card {
            border: 1mm solid var(--accent-color) !important;
          }
        `;
        break;
      
      case 'moda':
        specificCSS += `
          .template-${template.id} .product-card {
            border-radius: ${template.design.borderRadius * 1.5}px !important;
          }
        `;
        break;
      
      case 'electronica':
        specificCSS += `
          .template-${template.id} .product-image-container {
            background: linear-gradient(135deg, #f1f3f4, #ffffff) !important;
          }
        `;
        break;
    }
    
    // Optimizaciones por densidad
    if (template.density === 'alta') {
      specificCSS += `
        .template-${template.id} .product-card {
          border-width: 0.3mm !important;
        }
      `;
    }
    
    return specificCSS;
  }
  
  // ===== RESTO DE MÉTODOS HELPER (MANTENER IGUAL) =====
  
  private static generateProfessionalColorScheme(template: IndustryTemplate) {
    const primary = template.colors.primary;
    const secondary = template.colors.secondary || template.colors.primary;
    const accent = template.colors.accent || this.adjustColor(primary, 30);
    const background = template.colors.background || '#ffffff';
    
    const isLightBackground = this.isLightColor(background);
    
    return {
      primary,
      secondary,
      accent,
      background,
      cardBackground: template.colors.cardBackground || (isLightBackground ? '#ffffff' : '#f8f9fa'),
      textPrimary: isLightBackground ? '#2c3e50' : '#ffffff',
      textSecondary: isLightBackground ? '#7f8c8d' : '#bdc3c7',
      borderColor: isLightBackground ? '#ecf0f1' : '#34495e'
    };
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
  
  private static getSpacingValues(spacing: 'compacto' | 'normal' | 'amplio') {
    const configs = {
      compacto: { header: 25, section: 20, grid: 10, card: 12, footer: 20 },
      normal: { header: 35, section: 25, grid: 15, card: 16, footer: 25 },
      amplio: { header: 45, section: 35, grid: 20, card: 20, footer: 35 }
    };
    return configs[spacing];
  }
  
  /**
   * 🏗️ GENERAR HTML CON ESTRUCTURA MEJORADA - EVITA PÁGINAS VACÍAS
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTMLOptimized(products, template);
    const footerHTML = this.generateFooterHTML(businessInfo);
    
    const businessName = businessInfo.business_name || 'Mi Negocio';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo - ${businessName}</title>
    <style>
        ${css}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        <!-- Header con page-break control -->
        <header class="catalog-header page-break-avoid">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos</p>
        </header>
        
        <!-- Products con manejo de páginas -->
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
   * 🛍️ GENERAR HTML DE PRODUCTOS OPTIMIZADO - PREVIENE PÁGINAS VACÍAS
   */
  private static generateProductsHTMLOptimized(products: Product[], template: IndustryTemplate): string {
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    let htmlPages = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      // Clase para control de page-break
      const pageBreakClass = page > 0 ? 'page-break-before' : '';
      
      htmlPages += `
        <div class="products-page ${pageBreakClass}">
          <div class="products-grid">
            ${pageProducts.map((product, index) => 
              this.generateProductCardHTMLOptimized(product, template, index)
            ).join('')}
          </div>
        </div>
      `;
    }
    
    return htmlPages;
  }
  
  /**
   * 🎴 GENERAR HTML DE PRODUCTO INDIVIDUAL - USA IMG EN LUGAR DE BACKGROUND
   */
  private static generateProductCardHTMLOptimized(product: Product, template: IndustryTemplate, index: number): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    const productSku = product.sku || '';
    const productCategory = product.category || '';
    const productSpecs = product.specifications || '';
    
    // USAR IMG EN LUGAR DE BACKGROUND-IMAGE (MÁS COMPATIBLE)
    const imageHTML = productImage ? 
      `<img src="${productImage}" alt="${productName}" class="product-image" loading="eager" crossorigin="anonymous" />` :
      `<div class="product-image-placeholder">
         <div>Sin imagen</div>
         <div>${productName.substring(0, 12)}...</div>
       </div>`;
    
    return `
      <div class="product-card page-break-avoid" data-product-index="${index}">
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
    `;
  }
  
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
          ${contactItems.join('')}
        </div>
        <div class="footer-branding">
          Generado con CatalogoIA
        </div>
      </footer>
    `;
  }
}