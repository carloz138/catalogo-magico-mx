// src/lib/templates/professional-generator.ts
// 🎨 GENERADOR DE TEMPLATES PROFESIONALES CON SOMBRAS

import { EnhancedTemplateConfig, generateTemplateCSS } from './enhanced-config';

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  image_url: string;
  sku?: string;
  brand?: string;
  badges?: string[];
}

interface BusinessInfo {
  business_name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  primary_color?: string;
  secondary_color?: string;
}

export class ProfessionalTemplateGenerator {
  
  /**
   * 🎨 GENERADOR PRINCIPAL DE HTML PROFESIONAL
   */
  static generateCatalogHTML(
    products: Product[], 
    businessInfo: BusinessInfo, 
    template: EnhancedTemplateConfig
  ): string {
    
    const templateCSS = this.generateAdvancedCSS(template);
    const headerHTML = this.generateHeader(businessInfo, template);
    const productsHTML = this.generateProductsGrid(products, template);
    const footerHTML = this.generateFooter(businessInfo, template);
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo - ${businessInfo.business_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=${template.typography.headerFont.replace(' ', '+')}:wght@300;400;600;700&family=${template.typography.bodyFont.replace(' ', '+')}:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        ${templateCSS}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        ${headerHTML}
        ${productsHTML}
        ${footerHTML}
    </div>
</body>
</html>`;
  }

  /**
   * 🎨 GENERADOR DE CSS AVANZADO CON SOMBRAS PROFESIONALES
   */
  private static generateAdvancedCSS(template: EnhancedTemplateConfig): string {
    const baseCSS = generateTemplateCSS(template);
    
    const advancedCSS = `
      /* ===== BASE STYLES ===== */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: var(--body-font);
        background: var(--background);
        color: var(--text-primary);
        line-height: 1.6;
      }
      
      .catalog-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        min-height: 100vh;
        /* ✅ SOMBRA SUTIL PARA EL CONTENEDOR PRINCIPAL */
        box-shadow: 0 0 50px rgba(0, 0, 0, 0.08);
      }
      
      /* ===== HEADER SECTION CON SOMBRAS ===== */
      .catalog-header {
        padding: 60px 40px;
        position: relative;
        overflow: hidden;
        background: var(--surface);
        text-align: center;
        /* ✅ SOMBRA PARA EL HEADER */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
      }
      
      .company-logo {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        border-radius: var(--border-radius);
        overflow: hidden;
        background: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 32px;
        /* ✅ SOMBRA PARA EL LOGO */
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      .company-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .header-title {
        font-family: var(--header-font);
        font-size: var(--header-size);
        font-weight: var(--title-weight);
        color: var(--text-primary);
        margin-bottom: 15px;
        letter-spacing: ${template.typography.spacing === 'loose' ? '3px' : template.typography.spacing === 'tight' ? '0.5px' : '1px'};
        /* ✅ SOMBRA SUTIL PARA TÍTULOS */
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .header-subtitle {
        color: var(--text-secondary);
        font-size: calc(var(--body-size) + 2px);
        font-weight: 400;
        margin-bottom: 10px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      .header-contact {
        color: var(--text-secondary);
        font-size: var(--body-size);
        margin-top: 20px;
      }
      
      /* ===== DECORATIVE ELEMENTS CON SOMBRAS ===== */
      ${template.elements.geometricShapes ? `
      .geometric-shape {
        position: absolute;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent-color), var(--secondary-color));
        opacity: 0.1;
        /* ✅ SOMBRA PARA ELEMENTOS DECORATIVOS */
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      }
      
      .shape-1 { width: 200px; height: 200px; top: -100px; right: -100px; }
      .shape-2 { width: 150px; height: 150px; bottom: -75px; left: -75px; }
      .shape-3 { width: 80px; height: 80px; top: 50%; right: 20px; transform: translateY(-50%); }
      ` : ''}
      
      ${template.elements.diagonalAccents ? `
      .diagonal-accent {
        position: absolute;
        top: 0; right: 0;
        width: 200px; height: 100%;
        background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
        clip-path: polygon(70% 0%, 100% 0%, 100% 100%, 40% 100%);
        opacity: 0.8;
        /* ✅ SOMBRA PARA ACENTOS DIAGONALES */
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
      }
      ` : ''}
      
      ${template.elements.backgroundPattern ? `
      .catalog-header::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: 
          radial-gradient(circle at 20% 30%, var(--accent-color) 2px, transparent 2px),
          radial-gradient(circle at 70% 20%, var(--secondary-color) 2px, transparent 2px);
        background-size: 50px 50px;
        opacity: 0.1;
      }
      ` : ''}
      
      /* ===== PRODUCTS SECTION ===== */
      .products-section {
        padding: 40px;
      }
      
      .section-title {
        font-family: var(--header-font);
        font-size: calc(var(--header-size) - 12px);
        font-weight: var(--title-weight);
        color: var(--text-primary);
        margin-bottom: 40px;
        text-align: center;
        /* ✅ SOMBRA PARA TÍTULOS DE SECCIÓN */
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }
      
      .products-grid {
        display: grid;
        gap: 30px;
        ${this.getGridLayout(template)}
      }
      
      /* ===== PRODUCT CARDS CON SOMBRAS PROFESIONALES ===== */
      .product-card {
        background: var(--surface);
        border-radius: var(--border-radius);
        overflow: hidden;
        position: relative;
        
        /* ✅ SOMBRA PRINCIPAL PARA CARDS */
        box-shadow: 
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06),
          0 0 0 1px rgba(0, 0, 0, 0.05);
        
        /* ✅ TRANSICIÓN SUAVE */
        ${template.design.animations ? 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);' : ''}
        
        /* ✅ BORDES SUTILES */
        border: 1px solid rgba(0, 0, 0, 0.04);
      }
      
      ${template.design.animations ? `
      .product-card:hover {
        /* ✅ SOMBRA ELEVADA AL HOVER */
        box-shadow: 
          0 10px 15px -3px rgba(0, 0, 0, 0.1),
          0 4px 6px -2px rgba(0, 0, 0, 0.05),
          0 0 0 1px rgba(0, 0, 0, 0.05);
        transform: translateY(-8px) scale(1.02);
      }
      ` : ''}
      
      .product-image-container {
        position: relative;
        height: 250px;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        
        /* ✅ SOMBRA INTERNA PARA EL CONTENEDOR DE IMAGEN */
        box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .product-image {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        
        /* ✅ SOMBRA PROFESIONAL PARA IMÁGENES DE PRODUCTOS */
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
        
        ${template.design.animations ? 'transition: all 0.3s ease;' : ''}
      }
      
      ${template.design.animations ? `
      .product-card:hover .product-image {
        transform: scale(1.05);
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15));
      }
      ` : ''}
      
      ${template.elements.badges ? `
      .product-badge {
        position: absolute;
        top: 15px;
        left: 15px;
        background: var(--accent-color);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        
        /* ✅ SOMBRA PARA BADGES */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .badge-new { 
        background: #28a745; 
        box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      }
      .badge-sale { 
        background: #dc3545; 
        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
      }
      .badge-featured { 
        background: var(--primary-color); 
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      ` : ''}
      
      .product-info {
        padding: 25px;
        
        /* ✅ SEPARACIÓN SUTIL CON SOMBRA */
        border-top: 1px solid rgba(0, 0, 0, 0.03);
        background: linear-gradient(to bottom, var(--surface), #fafafa);
      }
      
      .product-category {
        color: var(--text-secondary);
        font-size: calc(var(--body-size) - 2px);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }
      
      .product-title {
        font-family: var(--header-font);
        font-size: calc(var(--body-size) + 4px);
        font-weight: var(--title-weight);
        color: var(--text-primary);
        margin-bottom: 10px;
        line-height: 1.3;
        
        /* ✅ SOMBRA SUTIL PARA TÍTULOS DE PRODUCTOS */
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      .product-description {
        color: var(--text-secondary);
        font-size: var(--body-size);
        line-height: 1.5;
        margin-bottom: 15px;
      }
      
      .product-price-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .product-price {
        font-size: calc(var(--body-size) + 8px);
        font-weight: 700;
        color: var(--primary-color);
        
        /* ✅ SOMBRA Y EFECTO PARA PRECIOS */
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        
        ${template.elements.priceHighlight ? `
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        ` : ''}
      }
      
      .product-sku {
        color: var(--text-secondary);
        font-size: calc(var(--body-size) - 2px);
        font-weight: 500;
        background: rgba(0, 0, 0, 0.02);
        padding: 4px 8px;
        border-radius: 4px;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      /* ===== WHOLESALE PRICING ===== */
      .product-wholesale {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .wholesale-price {
        color: var(--text-secondary);
        font-size: calc(var(--body-size) + 2px);
        font-weight: 600;
        display: block;
        margin-bottom: 4px;
      }
      
      .wholesale-min {
        color: var(--text-secondary);
        font-size: calc(var(--body-size) - 2px);
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
      }
      
      /* ===== FEATURED PRODUCT CON SOMBRA ESPECIAL ===== */
      ${template.layout.featuredProduct ? `
      .product-featured {
        grid-column: span 2;
        grid-row: span 2;
        
        /* ✅ SOMBRA ESPECIAL PARA PRODUCTO DESTACADO */
        box-shadow: 
          0 8px 25px -5px rgba(0, 0, 0, 0.1),
          0 8px 10px -6px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(0, 0, 0, 0.05);
        border: 2px solid var(--accent-color);
      }
      
      .product-featured .product-image-container {
        height: 350px;
        box-shadow: inset 0 4px 8px 0 rgba(0, 0, 0, 0.08);
      }
      
      .product-featured .product-title {
        font-size: calc(var(--body-size) + 8px);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }
      
      .product-featured .product-price {
        font-size: calc(var(--body-size) + 12px);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      ` : ''}
      
      /* ===== FOOTER CON SOMBRA ===== */
      .catalog-footer {
        padding: 40px;
        text-align: center;
        border-top: 1px solid #e0e0e0;
        background: var(--surface);
        color: var(--text-secondary);
        font-size: var(--body-size);
        
        /* ✅ SOMBRA SUTIL PARA EL FOOTER */
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
      }
      
      .footer-contact {
        margin-bottom: 15px;
      }
      
      .footer-contact span {
        margin: 0 15px;
        padding: 5px 10px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 6px;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      /* ===== RESPONSIVE ===== */
      @media (max-width: 768px) {
        .catalog-header { padding: 40px 20px; }
        .products-section { padding: 20px; }
        .products-grid { 
          grid-template-columns: 1fr !important; 
          gap: 20px;
        }
        .header-title { font-size: calc(var(--header-size) - 8px) !important; }
        .product-featured { grid-column: span 1; grid-row: span 1; }
      }
      
      /* ===== PRINT STYLES ===== */
      @media print {
        body { background: white !important; }
        .catalog-container { box-shadow: none !important; }
        .product-card { 
          break-inside: avoid; 
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        .catalog-header { break-after: avoid; }
      }
    `;
    
    return baseCSS + advancedCSS;
  }

  /**
   * 🎨 GENERADOR DE LAYOUT DE GRID
   */
  private static getGridLayout(template: EnhancedTemplateConfig): string {
    switch (template.layout.type) {
      case 'asymmetric':
        return `
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          grid-auto-rows: auto;
        `;
      case 'magazine':
        return `
          grid-template-columns: repeat(${template.layout.gridColumns}, 1fr);
          grid-template-rows: repeat(3, minmax(300px, auto));
        `;
      case 'masonry':
        return `
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          grid-auto-rows: auto;
        `;
      case 'hero':
        return `
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: repeat(2, auto);
        `;
      default: // grid
        return `
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          grid-auto-rows: auto;
        `;
    }
  }

  /**
   * 🎨 GENERADOR DE HEADER
   */
  private static generateHeader(businessInfo: BusinessInfo, template: EnhancedTemplateConfig): string {
    const logoHTML = businessInfo.logo_url 
      ? `<div class="company-logo"><img src="${businessInfo.logo_url}" alt="Logo"></div>`
      : `<div class="company-logo">${businessInfo.business_name.charAt(0)}</div>`;
    
    const decorativeElements = `
      ${template.elements.geometricShapes ? `
        <div class="geometric-shape shape-1"></div>
        <div class="geometric-shape shape-2"></div>
        <div class="geometric-shape shape-3"></div>
      ` : ''}
      ${template.elements.diagonalAccents ? '<div class="diagonal-accent"></div>' : ''}
    `;
    
    return `
      <header class="catalog-header">
        ${decorativeElements}
        <div style="position: relative; z-index: 10;">
          ${template.elements.logo ? logoHTML : ''}
          <h1 class="header-title">${businessInfo.business_name.toUpperCase()}</h1>
          <p class="header-subtitle">Catálogo de Productos</p>
          ${businessInfo.website ? `<p class="header-contact">${businessInfo.website}</p>` : ''}
        </div>
      </header>
    `;
  }

  /**
   * 🎨 GENERADOR DE GRID DE PRODUCTOS
   */
  private static generateProductsGrid(products: Product[], template: EnhancedTemplateConfig): string {
    const featuredProductIndex = template.layout.featuredProduct ? 0 : -1;
    
    const productsHTML = products.map((product, index) => {
      const isFeatured = index === featuredProductIndex;
      const badges = this.generateProductBadges(product, template);
      
      return `
        <div class="product-card ${isFeatured ? 'product-featured' : ''}">
          <div class="product-image-container">
            ${badges}
            <img src="${product.image_url}" alt="${product.name}" class="product-image" />
          </div>
          <div class="product-info">
            ${product.category ? `<div class="product-category">${product.category}</div>` : ''}
            <h3 class="product-title">${product.name}</h3>
            ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
            <div class="product-price-container">
              <div class="product-price">$${product.price_retail.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              ${product.price_wholesale ? `
                <div class="product-wholesale">
                  <span class="wholesale-price">Mayoreo: $${product.price_wholesale.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  ${product.wholesale_min_qty ? `<span class="wholesale-min">Min. ${product.wholesale_min_qty}</span>` : ''}
                </div>
              ` : ''}
              ${product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <section class="products-section">
        <h2 class="section-title">Nuestros Productos</h2>
        <div class="products-grid">
          ${productsHTML}
        </div>
      </section>
    `;
  }

  /**
   * 🎨 GENERADOR DE BADGES DE PRODUCTOS
   */
  private static generateProductBadges(product: Product, template: EnhancedTemplateConfig): string {
    if (!template.elements.badges) return '';
    
    const badges: string[] = [];
    
    // Badge por categoría o personalizado
    if (product.badges && product.badges.length > 0) {
      badges.push(`<div class="product-badge badge-${product.badges[0].toLowerCase()}">${product.badges[0]}</div>`);
    } else if (product.category) {
      badges.push(`<div class="product-badge">${product.category}</div>`);
    }
    
    return badges.join('');
  }

  /**
   * 🎨 GENERADOR DE FOOTER
   */
  private static generateFooter(businessInfo: BusinessInfo, template: EnhancedTemplateConfig): string {
    const contactInfo = [
      businessInfo.phone ? `📞 ${businessInfo.phone}` : '',
      businessInfo.email ? `📧 ${businessInfo.email}` : '',
      businessInfo.address ? `📍 ${businessInfo.address}` : ''
    ].filter(Boolean);
    
    return `
      <footer class="catalog-footer">
        ${contactInfo.length > 0 ? `
          <div class="footer-contact">
            ${contactInfo.map(info => `<span>${info}</span>`).join('')}
          </div>
        ` : ''}
        <div>Generado con ❤️ por Tu Sistema de Catálogos</div>
      </footer>
    `;
  }
}

/**
 * 🚀 FUNCIÓN PRINCIPAL PARA INTEGRAR CON TU SISTEMA
 */
export const generateProfessionalCatalog = (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string
): string => {
  // Aquí importarías tu configuración de templates
  const { ENHANCED_TEMPLATES } = require('./enhanced-config');
  const template = ENHANCED_TEMPLATES[templateId];
  
  if (!template) {
    throw new Error(`Template ${templateId} no encontrado`);
  }
  
  return ProfessionalTemplateGenerator.generateCatalogHTML(products, businessInfo, template);
};
