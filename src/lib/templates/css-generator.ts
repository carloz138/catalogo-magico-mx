// src/lib/templates/css-generator.ts
// 🚀 CSS GENERATOR - COMPATIBLE CON GENERACIÓN PDF

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
   * 🎨 CSS GENERATOR CON TÉCNICAS COMPATIBLES PDF
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const spacing = this.getSpacingValues(template.design.spacing);
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
      
      /* ===== PRODUCTS SECTION ===== */
      .products-section {
        padding: ${spacing.section}px;
      }
      
      .products-grid {
        display: table; /* Más compatible que grid para PDF */
        width: 100%;
        table-layout: fixed;
        border-spacing: ${spacing.grid}px;
      }
      
      /* Crear filas de productos */
      .products-row {
        display: table-row;
      }
      
      .products-cell {
        display: table-cell;
        width: ${100 / template.gridColumns}%;
        vertical-align: top;
        page-break-inside: avoid; /* Evitar cortar productos */
      }
      
      /* ===== PRODUCT CARDS - TÉCNICA COMPATIBLE PDF ===== */
      .product-card {
        background: var(--card-background);
        border: 1px solid var(--border-color);
        border-radius: ${template.design.borderRadius}px;
        overflow: hidden;
        margin-bottom: ${spacing.grid}px;
        page-break-inside: avoid;
        ${template.design.shadows ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);' : ''}
      }
      
      /* ===== SOLUCIÓN IMÁGENES PDF-COMPATIBLE ===== */
      .product-image-container {
        position: relative;
        width: 100%;
        height: ${this.calculateImageHeight(template)}px; /* Altura fija calculada */
        background: #f8f9fa;
        overflow: hidden;
        text-align: center;
        display: table-cell;
        vertical-align: middle;
      }
      
      /* TÉCNICA BACKGROUND-IMAGE (Funciona en PDF) */
      .product-image-bg {
        width: 100%;
        height: 100%;
        background-size: contain; /* Equivalente a object-fit: contain */
        background-repeat: no-repeat;
        background-position: center;
        background-color: #f8f9fa;
      }
      
      /* TÉCNICA IMG CON CONTENEDOR (Fallback) */
      .product-image {
        max-width: 90%;
        max-height: 90%;
        width: auto;
        height: auto;
        vertical-align: middle;
        display: inline-block;
      }
      
      /* Para centrar imagen verticalmente */
      .product-image-container::before {
        content: '';
        display: inline-block;
        height: 100%;
        vertical-align: middle;
        width: 0;
      }
      
      /* ===== INFORMACIÓN PRODUCTO ===== */
      .product-info {
        padding: ${spacing.card}px;
        background: var(--card-background);
      }
      
      .product-name {
        font-size: ${this.getProductNameSize(template.density)};
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.3;
        word-wrap: break-word;
        /* Limitar líneas manualmente para PDF */
        max-height: ${this.getProductNameMaxHeight(template.density)};
        overflow: hidden;
      }
      
      .product-price {
        font-size: ${this.getPriceSize(template.density)};
        font-weight: bold;
        color: white;
        background: var(--primary-color);
        padding: 6px 12px;
        border-radius: 15px;
        display: inline-block;
        margin-bottom: ${spacing.card / 2}px;
        letter-spacing: 0.5px;
      }
      
      /* ===== INFORMACIÓN CONDICIONAL ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: 0.8rem;
        color: var(--accent-color);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: bold;
        margin-bottom: ${spacing.card / 2}px;
        background: ${this.hexToRgba(template.colors.accent, 0.15)};
        padding: 3px 8px;
        border-radius: 10px;
        display: inline-block;
      }
      ` : `.product-category { display: none; }`}
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: ${this.getDescriptionSize(template.density)};
        color: var(--text-secondary);
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.4;
        /* Limitar altura para consistencia */
        max-height: ${this.getDescriptionMaxHeight(template.density)};
        overflow: hidden;
        word-wrap: break-word;
      }
      ` : `.product-description { display: none; }`}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-family: 'Courier New', monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: ${spacing.card / 2}px;
        border: 1px solid var(--border-color);
      }
      ` : `.product-sku { display: none; }`}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: 0.85rem;
        color: var(--text-secondary);
        border-top: 1px solid var(--border-color);
        padding-top: ${spacing.card / 2}px;
        margin-top: ${spacing.card / 2}px;
        line-height: 1.4;
        background: rgba(0, 0, 0, 0.02);
        padding: ${spacing.card / 2}px;
        border-radius: 4px;
        border-left: 3px solid var(--accent-color);
      }
      ` : `.product-specifications { display: none; }`}
      
      /* ===== FOOTER ===== */
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
      
      /* ===== RESPONSIVE PARA PDF ===== */
      
      /* Tablet */
      @media (max-width: 1024px) {
        .products-grid {
          border-spacing: ${spacing.grid * 0.8}px;
        }
        
        .products-section {
          padding: ${spacing.section * 0.8}px;
        }
        
        .catalog-header {
          padding: ${spacing.header * 0.8}px;
        }
      }
      
      /* Mobile */
      @media (max-width: 768px) {
        .products-cell {
          width: ${template.density === 'alta' ? '50%' : '100%'};
        }
        
        .catalog-header {
          padding: ${spacing.header * 0.6}px;
        }
        
        .business-name {
          font-size: ${this.getMobileHeaderSize(template.density)};
          letter-spacing: 0.5px;
        }
        
        .products-section {
          padding: ${spacing.section * 0.6}px;
        }
        
        .product-info {
          padding: ${spacing.card * 0.8}px;
        }
        
        .product-image-container {
          height: ${this.calculateImageHeight(template, 'mobile')}px;
        }
      }
      
      /* ===== PRINT/PDF STYLES ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body.template-${template.id} {
          background: white !important;
          font-size: 12px !important;
        }
        
        .catalog-container {
          max-width: none !important;
          margin: 0 !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          border: 1px solid #ddd !important;
          margin-bottom: 15px !important;
        }
        
        .catalog-header {
          page-break-after: avoid !important;
        }
        
        .catalog-footer {
          page-break-before: avoid !important;
        }
        
        .product-image-bg,
        .product-image {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
      
      /* ===== UTILIDADES PARA DIFERENTES DENSIDADES ===== */
      
      ${this.generateDensitySpecificCSS(template)}
    `;
  }
  
  /**
   * 📐 CALCULAR ALTURA DE IMAGEN BASADA EN DENSIDAD
   */
  private static calculateImageHeight(template: IndustryTemplate, device: 'desktop' | 'mobile' = 'desktop'): number {
    const baseHeights = {
      alta: device === 'mobile' ? 120 : 160,
      media: device === 'mobile' ? 180 : 240,
      baja: device === 'mobile' ? 220 : 300
    };
    
    return baseHeights[template.density];
  }
  
  /**
   * 📝 ALTURAS MÁXIMAS PARA TEXTO SEGÚN DENSIDAD
   */
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
  
  /**
   * 🎨 CSS ESPECÍFICO POR DENSIDAD
   */
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
  
  /**
   * 🏗️ GENERA HTML CON TÉCNICA COMPATIBLE PDF
   */
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
<body class="template-${template.id}">
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
  
  /**
   * 🛍️ GENERA HTML COMPATIBLE CON PDF
   */
  private static generateProductsHTMLCompatible(products: Product[], template: IndustryTemplate): string {
    // Dividir productos en filas
    const rows = [];
    for (let i = 0; i < products.length; i += template.gridColumns) {
      const row = products.slice(i, i + template.gridColumns);
      rows.push(row);
    }
    
    const rowsHTML = rows.map(row => {
      const cellsHTML = row.map(product => this.generateProductCardHTML(product, template)).join('');
      
      // Rellenar celdas vacías si la fila no está completa
      const emptyCells = template.gridColumns - row.length;
      const emptyCellsHTML = Array(emptyCells).fill('<div class="products-cell"></div>').join('');
      
      return `
        <div class="products-row">
          ${cellsHTML}
          ${emptyCellsHTML}
        </div>
      `;
    }).join('');
    
    return `
      <div class="products-grid">
        ${rowsHTML}
      </div>
    `;
  }
  
  /**
   * 🎴 GENERA HTML DE PRODUCTO CON IMAGEN COMPATIBLE
   */
  private static generateProductCardHTML(product: Product, template: IndustryTemplate): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    const productSku = product.sku || '';
    const productCategory = product.category || '';
    const productSpecs = product.specifications || '';
    
    // Usar técnica background-image para compatibilidad PDF
    const imageHTML = productImage ? 
      `<div class="product-image-bg" style="background-image: url('${productImage}');"></div>` :
      `<div class="product-image-bg" style="background-color: #f0f0f0;"></div>`;
    
    return `
      <div class="products-cell">
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
      </div>
    `;
  }
  
  // ===== RESTO DE MÉTODOS IGUAL QUE ANTES =====
  
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
  
  private static getHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1.8rem', media: '2.2rem', baja: '2.5rem' }[density];
  }
  
  private static getMobileHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1.4rem', media: '1.6rem', baja: '1.8rem' }[density];
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