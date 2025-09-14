// src/lib/templates/css-generator.ts
// 🚀 GENERADOR CSS PROFESIONAL - IMÁGENES SIN DISTORSIÓN + DISEÑO PREMIUM

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
   * 🎨 GENERA CSS PROFESIONAL CON TÉCNICAS MODERNAS
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const spacing = this.getSpacingValues(template.design.spacing);
    const colors = this.generateProfessionalColorScheme(template);
    
    return `
      /* ===== TEMPLATE PROFESIONAL: ${template.displayName.toUpperCase()} ===== */
      
      /* Reset y variables CSS modernas */
      :root {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --background-color: ${colors.background};
        --card-background: ${colors.cardBackground};
        --text-primary: ${colors.textPrimary};
        --text-secondary: ${colors.textSecondary};
        --border-color: ${colors.borderColor};
        --shadow-light: ${colors.shadowLight};
        --shadow-medium: ${colors.shadowMedium};
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body.template-${template.id} {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--background-color);
        color: var(--text-primary);
        line-height: 1.6;
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .catalog-container {
        max-width: 1400px;
        margin: 0 auto;
        background: var(--background-color);
        min-height: 100vh;
        box-shadow: 0 0 60px rgba(0, 0, 0, 0.1);
      }
      
      /* ===== HEADER MODERNO ===== */
      .catalog-header {
        background: linear-gradient(135deg, var(--primary-color) 0%, ${this.darkenColor(template.colors.primary, 15)} 100%);
        color: white;
        padding: ${spacing.header + 20}px ${spacing.section}px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .catalog-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.3"/><circle cx="80" cy="80" r="25" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.3"/></svg>') center/300px;
        pointer-events: none;
      }
      
      .business-name {
        font-size: ${this.getHeaderSize(template.density)};
        font-weight: 800;
        margin-bottom: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        position: relative;
        z-index: 1;
        text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      .catalog-subtitle {
        font-size: 1.2rem;
        font-weight: 400;
        opacity: 0.95;
        position: relative;
        z-index: 1;
        letter-spacing: 1px;
      }
      
      /* ===== SECCIÓN DE PRODUCTOS MEJORADA ===== */
      .products-section {
        padding: ${spacing.section + 20}px ${spacing.section}px;
        background: var(--background-color);
      }
      
      .products-grid {
        display: grid;
        grid-template-columns: repeat(${template.gridColumns}, 1fr);
        gap: ${spacing.grid + 10}px;
        max-width: 100%;
      }
      
      /* ===== PRODUCT CARDS PREMIUM ===== */
      .product-card {
        background: var(--card-background);
        border-radius: ${Math.max(12, template.design.borderRadius)}px;
        overflow: hidden;
        border: 1px solid var(--border-color);
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        position: relative;
        box-shadow: var(--shadow-light);
      }
      
      .product-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: var(--shadow-medium);
        border-color: var(--accent-color);
      }
      
      /* ===== SOLUCIÓN PROFESIONAL PARA IMÁGENES ===== */
      .product-image-container {
        /* Técnica moderna: aspect-ratio + object-fit */
        aspect-ratio: 1 / 1;
        width: 100%;
        background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
        position: relative;
        overflow: hidden;
        border-bottom: 1px solid var(--border-color);
      }
      
      .product-image {
        /* CLAVE: object-fit: contain mantiene proporción SIN distorsión */
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        
        /* Padding interno para evitar que toque bordes */
        padding: 15px;
        
        /* Transición suave */
        transition: transform 0.4s ease;
        
        /* Filtro sutil para mejorar calidad */
        image-rendering: high-quality;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      
      /* Hover effect en imagen */
      .product-card:hover .product-image {
        transform: scale(1.08);
      }
      
      /* Overlay sutil para mejorar contraste */
      .product-image-container::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30%;
        background: linear-gradient(transparent, rgba(255, 255, 255, 0.1));
        pointer-events: none;
      }
      
      /* Placeholder para imágenes que fallan */
      .product-image::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        background: var(--border-color);
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .product-image[src=""], .product-image:not([src]) {
        opacity: 0.3;
      }
      
      .product-image[src=""]:after, .product-image:not([src]):after {
        opacity: 1;
      }
      
      /* ===== INFORMACIÓN DEL PRODUCTO PREMIUM ===== */
      .product-info {
        padding: ${spacing.card + 8}px;
        background: var(--card-background);
        position: relative;
      }
      
      .product-name {
        font-size: ${this.getProductNameSize(template.density)};
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: ${spacing.card / 2 + 4}px;
        line-height: 1.3;
        
        /* Truncamiento moderno */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        
        /* Mejorar legibilidad */
        letter-spacing: -0.02em;
        word-break: break-word;
        hyphens: auto;
      }
      
      .product-price {
        font-size: ${this.getPriceSize(template.density)};
        font-weight: 800;
        color: white;
        margin-bottom: ${spacing.card / 2 + 4}px;
        
        /* Diseño premium para precio */
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
        padding: 8px 16px;
        border-radius: 25px;
        display: inline-block;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        
        /* Tipografía mejorada */
        font-family: 'Inter', system-ui, sans-serif;
        letter-spacing: 0.05em;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        
        /* Efecto hover */
        transition: all 0.3s ease;
      }
      
      .product-card:hover .product-price {
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
      }
      
      /* ===== INFORMACIÓN CONDICIONAL MEJORADA ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: 0.75rem;
        color: var(--accent-color);
        text-transform: uppercase;
        letter-spacing: 1.2px;
        font-weight: 700;
        margin-bottom: ${spacing.card / 2}px;
        
        /* Estilo premium */
        background: ${this.hexToRgba(template.colors.accent, 0.1)};
        padding: 4px 10px;
        border-radius: 15px;
        display: inline-block;
        border: 1px solid ${this.hexToRgba(template.colors.accent, 0.3)};
      }
      ` : `.product-category { display: none; }`}
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: ${this.getDescriptionSize(template.density)};
        color: var(--text-secondary);
        margin-bottom: ${spacing.card / 2 + 4}px;
        line-height: 1.5;
        
        /* Truncamiento mejorado */
        display: -webkit-box;
        -webkit-line-clamp: ${template.density === 'alta' ? '2' : template.density === 'media' ? '3' : '4'};
        -webkit-box-orient: vertical;
        overflow: hidden;
        
        /* Mejor tipografía */
        font-weight: 400;
        hyphens: auto;
        word-break: break-word;
      }
      ` : `.product-description { display: none; }`}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
        background: ${this.hexToRgba('#000000', 0.05)};
        padding: 6px 12px;
        border-radius: 6px;
        display: inline-block;
        margin-bottom: ${spacing.card / 2}px;
        border: 1px solid var(--border-color);
        font-weight: 500;
      }
      ` : `.product-sku { display: none; }`}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: 0.85rem;
        color: var(--text-secondary);
        border-top: 1px solid var(--border-color);
        padding-top: ${spacing.card / 2 + 4}px;
        margin-top: ${spacing.card / 2 + 4}px;
        line-height: 1.5;
        
        /* Estilo mejorado */
        background: ${this.hexToRgba('#000000', 0.02)};
        padding: ${spacing.card / 2 + 4}px;
        border-radius: 8px;
        border-left: 3px solid var(--accent-color);
      }
      ` : `.product-specifications { display: none; }`}
      
      /* ===== FOOTER ELEGANTE ===== */
      .catalog-footer {
        background: linear-gradient(135deg, var(--secondary-color) 0%, ${this.darkenColor(template.colors.secondary || template.colors.primary, 10)} 100%);
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)};
        padding: ${spacing.footer + 20}px ${spacing.section}px;
        text-align: center;
        border-top: 1px solid var(--border-color);
        margin-top: 60px;
        position: relative;
      }
      
      .business-contact {
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .contact-item {
        display: inline-flex;
        align-items: center;
        margin: 8px 20px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 25px;
        font-weight: 500;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .contact-item:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px);
      }
      
      .footer-branding {
        margin-top: 25px;
        font-size: 0.9rem;
        opacity: 0.8;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      
      /* ===== RESPONSIVE DESIGN AVANZADO ===== */
      
      /* Large Desktop */
      @media (min-width: 1400px) {
        .products-grid {
          gap: ${spacing.grid + 15}px;
        }
        
        .product-card {
          border-radius: ${Math.max(16, template.design.borderRadius)}px;
        }
      }
      
      /* Tablet */
      @media (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(${Math.max(2, template.gridColumns - 1)}, 1fr);
          gap: ${spacing.grid}px;
        }
        
        .products-section {
          padding: ${spacing.section}px ${spacing.section * 0.8}px;
        }
        
        .catalog-header {
          padding: ${spacing.header}px ${spacing.section * 0.8}px;
        }
      }
      
      /* Mobile */
      @media (max-width: 768px) {
        .products-grid {
          grid-template-columns: ${template.density === 'alta' ? 'repeat(2, 1fr)' : '1fr'};
          gap: ${spacing.grid * 0.8}px;
        }
        
        .catalog-header {
          padding: ${spacing.header * 0.8}px ${spacing.section * 0.6}px;
        }
        
        .business-name {
          font-size: ${this.getMobileHeaderSize(template.density)};
          letter-spacing: 1px;
        }
        
        .products-section {
          padding: ${spacing.section * 0.8}px ${spacing.section * 0.6}px;
        }
        
        .product-info {
          padding: ${spacing.card}px;
        }
        
        /* En móvil, aspect ratio ligeramente diferente para mejor uso del espacio */
        .product-image-container {
          aspect-ratio: 4 / 3;
        }
        
        .contact-item {
          display: block;
          margin: 6px auto;
          max-width: 280px;
        }
      }
      
      /* Small Mobile */
      @media (max-width: 480px) {
        .products-grid {
          grid-template-columns: 1fr;
        }
        
        .product-image-container {
          aspect-ratio: 3 / 2;
        }
      }
      
      /* ===== PRINT STYLES PROFESIONALES ===== */
      @media print {
        body.template-${template.id} {
          background: white !important;
          color: black !important;
        }
        
        .catalog-container {
          max-width: none !important;
          box-shadow: none !important;
        }
        
        .product-card {
          break-inside: avoid;
          box-shadow: none !important;
          border: 2px solid #ddd !important;
          margin-bottom: 20px;
        }
        
        .catalog-header {
          break-after: avoid;
          background: #333 !important;
          color: white !important;
        }
        
        .product-image {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          filter: none !important;
        }
        
        .product-price {
          background: #333 !important;
          color: white !important;
        }
      }
      
      /* ===== DARK MODE SUPPORT ===== */
      @media (prefers-color-scheme: dark) {
        :root {
          --background-color: #1a1a1a;
          --card-background: #2d2d2d;
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --border-color: #404040;
          --shadow-light: 0 2px 15px rgba(0, 0, 0, 0.3);
          --shadow-medium: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        
        .product-image-container {
          background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
        }
      }
    `;
  }
  
  /**
   * 🎨 GENERAR ESQUEMA DE COLORES PROFESIONAL
   */
  private static generateProfessionalColorScheme(template: IndustryTemplate) {
    const primary = template.colors.primary;
    const secondary = template.colors.secondary || template.colors.primary;
    const accent = template.colors.accent || this.adjustColor(primary, 30);
    const background = template.colors.background || '#ffffff';
    
    // Determinar si el fondo es claro u oscuro
    const isLightBackground = this.isLightColor(background);
    
    return {
      primary,
      secondary,
      accent,
      background,
      cardBackground: template.colors.cardBackground || (isLightBackground ? '#ffffff' : '#2d2d2d'),
      textPrimary: isLightBackground ? '#1a1a1a' : '#ffffff',
      textSecondary: isLightBackground ? '#666666' : '#cccccc',
      borderColor: isLightBackground ? '#e5e5e5' : '#404040',
      shadowLight: isLightBackground ? '0 2px 15px rgba(0, 0, 0, 0.08)' : '0 2px 15px rgba(0, 0, 0, 0.3)',
      shadowMedium: isLightBackground ? '0 10px 40px rgba(0, 0, 0, 0.15)' : '0 10px 40px rgba(0, 0, 0, 0.4)'
    };
  }
  
  /**
   * 🔧 UTILIDADES DE COLOR
   */
  private static isLightColor(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  
  private static getContrastColor(hexColor: string): string {
    return this.isLightColor(hexColor) ? '#1a1a1a' : '#ffffff';
  }
  
  private static darkenColor(hexColor: string, percent: number): string {
    const hex = hexColor.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent / 100));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent / 100));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent / 100));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
  
  /**
   * 📏 VALORES DE SPACING MEJORADOS
   */
  private static getSpacingValues(spacing: 'compacto' | 'normal' | 'amplio') {
    const configs = {
      compacto: { header: 35, section: 25, grid: 18, card: 16, footer: 30 },
      normal: { header: 45, section: 35, grid: 25, card: 20, footer: 35 },
      amplio: { header: 55, section: 45, grid: 35, card: 28, footer: 45 }
    };
    return configs[spacing];
  }
  
  /**
   * 📝 TAMAÑOS DE TEXTO OPTIMIZADOS
   */
  private static getHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '2rem', media: '2.5rem', baja: '3rem' }[density];
  }
  
  private static getMobileHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1.5rem', media: '1.8rem', baja: '2.2rem' }[density];
  }
  
  private static getProductNameSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1rem', media: '1.2rem', baja: '1.4rem' }[density];
  }
  
  private static getPriceSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '1.2rem', media: '1.4rem', baja: '1.6rem' }[density];
  }
  
  private static getDescriptionSize(density: 'alta' | 'media' | 'baja'): string {
    return { alta: '0.85rem', media: '0.95rem', baja: '1rem' }[density];
  }
  
  /**
   * 🏗️ GENERA HTML COMPLETO DEL CATÁLOGO
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTML(products, template);
    const footerHTML = this.generateFooterHTML(businessInfo);
    
    const businessName = businessInfo.business_name || 'Mi Negocio';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo - ${businessName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
            <div class="products-grid">
                ${productsHTML}
            </div>
        </main>
        
        <!-- Footer -->
        ${footerHTML}
    </div>
</body>
</html>`;
  }
  
  /**
   * 🛍️ GENERA HTML DE PRODUCTOS CON MANEJO AVANZADO DE IMÁGENES
   */
  private static generateProductsHTML(products: Product[], template: IndustryTemplate): string {
    return products.map(product => {
      const productName = product.name || 'Producto';
      const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
      const productImage = product.image_url || '';
      const productDescription = product.description || '';
      const productSku = product.sku || '';
      const productCategory = product.category || '';
      const productSpecs = product.specifications || '';
      
      return `
      <div class="product-card">
        <div class="product-image-container">
          <img 
            src="${productImage}" 
            alt="${productName}" 
            class="product-image"
            loading="lazy"
            onerror="this.style.opacity='0.3'; this.alt='Imagen no disponible';"
            onload="this.style.opacity='1';"
            style="opacity: 0; transition: opacity 0.3s ease;"
          />
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
      </div>`;
    }).join('');
  }
  
  /**
   * 🔗 GENERA HTML DEL FOOTER ELEGANTE
   */
  private static generateFooterHTML(businessInfo: BusinessInfo): string {
    const contactItems = [
      businessInfo.phone ? `<div class="contact-item">📞 ${businessInfo.phone}</div>` : '',
      businessInfo.email ? `<div class="contact-item">📧 ${businessInfo.email}</div>` : '',
      businessInfo.website ? `<div class="contact-item">🌐 ${businessInfo.website}</div>` : '',
      businessInfo.address ? `<div class="contact-item">📍 ${businessInfo.address}</div>` : ''
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