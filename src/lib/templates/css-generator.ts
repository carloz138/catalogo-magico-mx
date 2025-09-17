// src/lib/templates/css-generator.ts - VERSIÓN CORREGIDA
// 🚀 CSS GENERATOR - ARREGLADO PARA EVITAR CORTE DE IMÁGENES

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
   * 🎨 CSS GENERATOR CON TÉCNICAS COMPATIBLES PDF - CORREGIDO
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const spacing = this.getSpacingValues(template.design?.spacing || 'normal');
    const colors = this.generateProfessionalColorScheme(template);
    
    return `
      /* ===== TEMPLATE PDF-COMPATIBLE: ${template.displayName.toUpperCase()} ===== */
      
      /* Variables CSS */
      :root {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --background-color: ${colors.background};
        --card-background: ${colors.cardBackground};
        --text-primary: ${colors.textPrimary};
        --text-secondary: ${colors.textSecondary};
        --border-color: ${colors.borderColor};
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body.template-${template.id} {
        font-family: 'Arial', 'Helvetica', sans-serif; /* Fuentes seguras para PDF */
        background: var(--background-color);
        color: var(--text-primary);
        line-height: 1.6;
        font-size: 16px;
      }
      
      .catalog-container {
        max-width: 1400px;
        margin: 0 auto;
        background: var(--background-color);
        min-height: 100vh;
      }
      
      /* ===== HEADER ===== */
      .catalog-header {
        background: var(--primary-color);
        color: white;
        padding: ${spacing.header}px;
        text-align: center;
        page-break-after: avoid; /* PDF-specific */
      }
      
      .business-name {
        font-size: ${this.getHeaderSize(template.density)};
        font-weight: bold;
        margin-bottom: 12px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      
      .catalog-subtitle {
        font-size: 1.2rem;
        font-weight: normal;
        opacity: 0.95;
        letter-spacing: 0.5px;
      }
      
      /* ===== PRODUCTS SECTION CORREGIDA ===== */
      .products-section {
        padding: ${spacing.section}px;
        max-width: 100%;
      }
      
      /* ===== GRID SYSTEM MEJORADO - EVITA CORTES ===== */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(${template.gridColumns}, 1fr);
        gap: ${this.calculateOptimalGap(template.gridColumns, template.density)}px;
        width: 100%;
        box-sizing: border-box;
        /* CORRECCIÓN CRÍTICA: Contenido dentro del contenedor */
        container-type: inline-size;
      }
      
      /* ===== PRODUCT CARDS - DIMENSIONES CALCULADAS CORRECTAMENTE ===== */
      .product-card {
        background: var(--card-background);
        border: 1px solid var(--border-color);
        border-radius: ${template.design.borderRadius}px;
        overflow: hidden;
        page-break-inside: avoid;
        width: 100%; /* CORRECCIÓN: Usar 100% del grid item */
        height: auto;
        min-height: ${this.calculateMinCardHeight(template.density)}px;
        display: flex;
        flex-direction: column;
        ${template.design.shadows ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);' : ''}
      }
      
      /* ===== IMAGEN CONTAINER - DIMENSIONES FIJAS CALCULADAS ===== */
      .product-image-container {
        width: 100%;
        height: ${this.calculateOptimalImageHeight(template.density, template.gridColumns)}px; 
        background: #f8f9fa;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        /* CRÍTICO: Evitar desbordamiento */
        flex-shrink: 0;
      }
      
      /* TÉCNICA BACKGROUND-IMAGE MEJORADA (Funciona en PDF) */
      .product-image-bg {
        width: 95%; /* CORRECCIÓN: 95% para margen interno */
        height: 95%; /* CORRECCIÓN: 95% para margen interno */
        background-size: contain; /* Equivalente a object-fit: contain */
        background-repeat: no-repeat;
        background-position: center;
        background-color: transparent;
        margin: auto; /* CORRECCIÓN: Centrar automáticamente */
      }
      
      /* TÉCNICA IMG CON CONTENEDOR MEJORADA */
      .product-image {
        max-width: 90%; /* CORRECCIÓN: Reducir para evitar corte */
        max-height: 90%; /* CORRECCIÓN: Reducir para evitar corte */
        width: auto;
        height: auto;
        object-fit: contain; /* CRÍTICO para mantener proportiones */
        display: block;
        margin: auto; /* CORRECCIÓN: Centrar */
      }
      
      /* ===== INFORMACIÓN PRODUCTO CON ESPACIADO CALCULADO ===== */
      .product-info {
        padding: ${this.calculateOptimalPadding(template.density)}px;
        background: var(--card-background);
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: ${this.calculateMinTextHeight(template.density)}px;
      }
      
      .product-name {
        font-size: ${this.getProductNameSize(template.density)};
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.3;
        word-wrap: break-word;
        /* CORRECCIÓN: Altura máxima calculada */
        max-height: ${this.getProductNameMaxHeight(template.density)};
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: ${this.getMaxLines(template.density)};
        -webkit-box-orient: vertical;
      }
      
      .product-price {
        font-size: ${this.getPriceSize(template.density)};
        font-weight: bold;
        color: white;
        background: var(--primary-color);
        padding: ${this.calculatePricePadding(template.density)};
        border-radius: 15px;
        display: inline-block;
        margin: ${spacing.card / 2}px 0;
        letter-spacing: 0.5px;
        text-align: center;
        /* CORRECCIÓN: Evitar desbordamiento de precio */
        max-width: 100%;
        box-sizing: border-box;
      }
      
      /* ===== INFORMACIÓN CONDICIONAL CON ESPACIADO OPTIMIZADO ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: ${this.getCategorySize(template.density)};
        color: var(--accent-color);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: bold;
        margin-bottom: ${spacing.card / 2}px;
        background: ${this.hexToRgba(template.colors.accent, 0.15)};
        padding: 3px 8px;
        border-radius: 10px;
        display: inline-block;
        max-width: 100%;
        box-sizing: border-box;
      }
      ` : `.product-category { display: none; }`}
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: ${this.getDescriptionSize(template.density)};
        color: var(--text-secondary);
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.4;
        max-height: ${this.getDescriptionMaxHeight(template.density)};
        overflow: hidden;
        word-wrap: break-word;
        display: -webkit-box;
        -webkit-line-clamp: ${this.getDescriptionMaxLines(template.density)};
        -webkit-box-orient: vertical;
      }
      ` : `.product-description { display: none; }`}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: ${this.getSkuSize(template.density)};
        color: var(--text-secondary);
        font-family: 'Courier New', monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: ${spacing.card / 2}px;
        border: 1px solid var(--border-color);
        max-width: 100%;
        box-sizing: border-box;
      }
      ` : `.product-sku { display: none; }`}
      
      /* ===== RESPONSIVE MEJORADO PARA PDF ===== */
      
      /* ===== CORRECCIONES ESPECÍFICAS POR DENSIDAD ===== */
      ${this.generateDensitySpecificCSS(template)}
      
      /* ===== CORRECCIONES POR NÚMERO DE COLUMNAS ===== */
      ${this.generateColumnSpecificCSS(template.gridColumns)}
      
      /* ===== FOOTER IGUAL QUE ANTES ===== */
      .catalog-footer {
        background: var(--secondary-color);
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)};
        padding: ${spacing.footer}px;
        text-align: center;
        border-top: 1px solid var(--border-color);
        margin-top: 40px;
        page-break-before: avoid;
      }
      
      .business-contact {
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 15px;
      }
      
      .contact-item {
        display: inline-block;
        margin: 5px 15px;
        padding: 5px 10px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 15px;
        font-weight: bold;
      }
      
      .footer-branding {
        margin-top: 20px;
        font-size: 0.9rem;
        opacity: 0.8;
        font-weight: bold;
        letter-spacing: 0.5px;
      }
      
      /* ===== RESPONSIVE PARA PDF CON CORRECCIONES ===== */
      
      /* Tablet - Ajustar columnas */
      @media (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(${Math.min(template.gridColumns, 2)}, 1fr);
          gap: ${this.calculateOptimalGap(Math.min(template.gridColumns, 2), template.density)}px;
        }
      }
      
      /* Mobile - Una sola columna para evitar cortes */
      @media (max-width: 768px) {
        .products-grid {
          grid-template-columns: 1fr;
          gap: 15px;
        }
        
        .product-image-container {
          height: ${this.calculateOptimalImageHeight(template.density, 1)}px;
        }
      }
      
      /* ===== PRINT/PDF STYLES MEJORADOS ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body.template-${template.id} {
          background: white !important;
          font-size: 12px !important;
        }
        
        .products-grid {
          /* CRÍTICO: Forzar columnas correctas en print */
          grid-template-columns: repeat(${template.gridColumns}, 1fr) !important;
          gap: ${Math.max(10, spacing.grid * 0.8)}px !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          border: 1px solid #ddd !important;
          margin-bottom: 10px !important;
          /* CRÍTICO: Forzar ancho correcto */
          width: 100% !important;
          box-sizing: border-box !important;
        }
        
        .product-image-container {
          /* CRÍTICO: Altura fija en print */
          height: ${this.calculateOptimalImageHeight(template.density, template.gridColumns)}px !important;
        }
        
        .product-image-bg,
        .product-image {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          /* CRÍTICO: Evitar desbordamiento en print */
          max-width: 90% !important;
          max-height: 90% !important;
        }
      }
    `;
  }
  
  /**
   * 🎯 FUNCIONES DE CÁLCULO CORREGIDAS
   */
  
  // Calcular gap optimal basado en columnas y densidad
  private static calculateOptimalGap(columns: number, density: string): number {
    const baseGap = {
      alta: 8,    // Gap pequeño para alta densidad
      media: 12,  // Gap medio
      baja: 16    // Gap grande para baja densidad
    }[density as keyof typeof baseGap] || 12;
    
    // Reducir gap si hay muchas columnas
    if (columns >= 4) return Math.max(6, baseGap - 4);
    if (columns >= 3) return Math.max(8, baseGap - 2);
    
    return baseGap;
  }
  
  // Calcular altura optimal de imagen
  private static calculateOptimalImageHeight(density: string, columns: number): number {
    const baseHeight = {
      alta: 140,   // Imágenes pequeñas para alta densidad
      media: 180,  // Imágenes medianas
      baja: 220    // Imágenes grandes para baja densidad
    }[density as keyof typeof baseHeight] || 180;
    
    // Ajustar por número de columnas
    if (columns >= 4) return Math.max(120, baseHeight - 40);
    if (columns >= 3) return Math.max(140, baseHeight - 20);
    
    return baseHeight;
  }
  
  // Calcular padding optimal
  private static calculateOptimalPadding(density: string): number {
    return {
      alta: 8,    // Padding pequeño para más contenido
      media: 12,  // Padding medio
      baja: 16    // Padding grande para menos contenido
    }[density as keyof typeof density] || 12;
  }
  
  // Calcular altura mínima de card
  private static calculateMinCardHeight(density: string): number {
    return {
      alta: 280,   // Cards compactas
      media: 320,  // Cards medianas  
      baja: 380    // Cards grandes
    }[density as keyof typeof density] || 320;
  }
  
  // Calcular altura mínima del área de texto
  private static calculateMinTextHeight(density: string): number {
    return {
      alta: 80,    // Área de texto compacta
      media: 100,  // Área de texto mediana
      baja: 120    // Área de texto amplia
    }[density as keyof typeof density] || 100;
  }
  
  // Calcular padding del precio
  private static calculatePricePadding(density: string): string {
    return {
      alta: '4px 8px',    // Precio compacto
      media: '6px 12px',  // Precio medio
      baja: '8px 16px'    // Precio amplio
    }[density as keyof typeof density] || '6px 12px';
  }
  
  // Calcular máximo de líneas para nombres
  private static getMaxLines(density: string): number {
    return {
      alta: 2,    // Máximo 2 líneas para alta densidad
      media: 3,   // Máximo 3 líneas para media densidad
      baja: 4     // Máximo 4 líneas para baja densidad
    }[density as keyof typeof density] || 3;
  }
  
  // Calcular máximo de líneas para descripción
  private static getDescriptionMaxLines(density: string): number {
    return {
      alta: 2,    // Máximo 2 líneas de descripción
      media: 3,   // Máximo 3 líneas de descripción
      baja: 4     // Máximo 4 líneas de descripción
    }[density as keyof typeof density] || 3;
  }
  
  // Tamaños de fuente optimizados por densidad
  private static getCategorySize(density: string): string {
    return {
      alta: '0.7rem',
      media: '0.8rem',
      baja: '0.9rem'
    }[density as keyof typeof density] || '0.8rem';
  }
  
  private static getSkuSize(density: string): string {
    return {
      alta: '0.7rem',
      media: '0.75rem',
      baja: '0.8rem'
    }[density as keyof typeof density] || '0.75rem';
  }
  
  /**
   * 🏗️ CSS ESPECÍFICO POR NÚMERO DE COLUMNAS - NUEVO
   */
  private static generateColumnSpecificCSS(columns: number): string {
    return `
      /* ===== OPTIMIZACIONES PARA ${columns} COLUMNAS ===== */
      .template-${columns}-cols .product-card {
        /* Ancho calculado específicamente para ${columns} columnas */
        min-width: ${Math.floor(100 / columns) - 2}%;
        max-width: ${Math.floor(100 / columns)}%;
      }
      
      .template-${columns}-cols .product-name {
        /* Ajustar tamaño de texto según número de columnas */
        font-size: ${columns >= 4 ? '0.9rem' : columns >= 3 ? '1rem' : '1.1rem'};
        line-height: ${columns >= 4 ? '1.2' : '1.3'};
      }
      
      .template-${columns}-cols .product-price {
        /* Ajustar tamaño de precio según columnas */
        font-size: ${columns >= 4 ? '1rem' : columns >= 3 ? '1.1rem' : '1.2rem'};
        padding: ${columns >= 4 ? '4px 8px' : columns >= 3 ? '6px 10px' : '8px 12px'};
      }
    `;
  }
  
  // ===== RESTO DE MÉTODOS SIN CAMBIOS (mantener igual) =====
  
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
  
  // [Incluir todos los demás métodos helper sin cambios]
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
  
  private static getHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1.8rem', media: '2.2rem', baja: '2.5rem' }[density];
  }
  
  private static getProductNameSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '0.95rem', media: '1.1rem', baja: '1.25rem' }[density];
  }
  
  private static getPriceSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1rem', media: '1.2rem', baja: '1.4rem' }[density];
  }
  
  private static getDescriptionSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '0.8rem', media: '0.9rem', baja: '0.95rem' }[density];
  }
  
  private static getProductNameMaxHeight(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '2.6em',      // ~2 líneas
      media: '3.9em',     // ~3 líneas  
      baja: '5.2em'       // ~4 líneas
    }[density];
  }
  
  private static getDescriptionMaxHeight(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '2.8em',      // ~2 líneas
      media: '4.2em',     // ~3 líneas
      baja: '5.6em'       // ~4 líneas
    }[density];
  }
  
  private static generateDensitySpecificCSS(template: IndustryTemplate): string {
    const adjustments = {
      alta: {
        cardPadding: '8px',
        fontSize: '0.85rem',
        imageHeight: '140px'
      },
      media: {
        cardPadding: '12px',
        fontSize: '1rem',
        imageHeight: '200px'
      },
      baja: {
        cardPadding: '16px',
        fontSize: '1.1rem',
        imageHeight: '280px'
      }
    };
    
    const config = adjustments[template.density];
    
    return `
      /* Ajustes específicos para densidad ${template.density} */
      .template-${template.id} .product-info {
        padding: ${config.cardPadding} !important;
      }
      
      .template-${template.id} .product-description {
        font-size: ${config.fontSize} !important;
      }
    `;
  }
  
  // [Resto de métodos incluyendo generateCatalogHTML, etc. - mantener igual]
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTMLCompatible(products, template);
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
<body class="template-${template.id} template-${template.gridColumns}-cols">
    <div class="catalog-container">
        <!-- Header -->
        <header class="catalog-header">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos</p>
        </header>
        
        <!-- Products -->
        <main class="products-section">
            ${productsHTML}
        </main>
        
        <!-- Footer -->
        ${footerHTML}
    </div>
</body>
</html>`;
  }
  
  private static generateProductsHTMLCompatible(products: Product[], template: IndustryTemplate): string {
    return `
      <div class="products-grid">
        ${products.map(product => this.generateProductCardHTML(product, template)).join('')}
      </div>
    `;
  }
  
  private static generateProductCardHTML(product: Product, template: IndustryTemplate): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    const productSku = product.sku || '';
    const productCategory = product.category || '';
    const productSpecs = product.specifications || '';
    
    const imageHTML = productImage ? 
      `<div class="product-image-bg" style="background-image: url('${productImage}');"></div>` :
      `<div class="product-image-bg" style="background-color: #f0f0f0;"></div>`;
    
    return `
      <div class="product-card">
        <div class="product-image-container">
          ${imageHTML}
        </div>
        <div class="product-info">
          ${template.showInfo.category && productCategory ? 
            `<div class="product-category">${productCategory}</div>` : ''}
          
          <h3 class="product-name">${productName}</h3>
          
          <div class="product-price">$${productPrice.toLocaleString('es-MX', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
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
        <footer class="catalog-footer">
          <div class="footer-branding">
            Generado con CatalogoIA
          </div>
        </footer>
      `;
    }
    
    return `
      <footer class="catalog-footer">
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