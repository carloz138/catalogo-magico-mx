// src/lib/templates/css-generator.ts
// 🎨 GENERADOR DE CSS ESTANDARIZADO - IMÁGENES Y TEXTO CORREGIDOS

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
   * 🎨 GENERA CSS ESTANDARIZADO CON IMÁGENES Y TEXTO MEJORADOS
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const spacing = this.getSpacingValues(template.design.spacing);
    const textColors = this.getOptimizedTextColors(template);
    
    return `
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} ===== */
      
      /* Reset y base */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body.template-${template.id} {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: ${template.colors.background};
        color: ${textColors.body};
        line-height: 1.6;
        min-height: 100vh;
      }
      
      .catalog-container {
        max-width: 1200px;
        margin: 0 auto;
        background: ${template.colors.background};
        min-height: 100vh;
      }
      
      /* ===== HEADER ===== */
      .catalog-header {
        background: ${template.colors.primary};
        color: white;
        padding: ${spacing.header}px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .business-name {
        font-size: ${this.getHeaderSize(template.density)};
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: 1px;
        /* Mejorar legibilidad del header */
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .catalog-subtitle {
        font-size: 1.1rem;
        opacity: 0.95;
        font-weight: 400;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      
      /* ===== PRODUCTS GRID ===== */
      .products-section {
        padding: ${spacing.section}px;
      }
      
      .products-grid {
        display: grid;
        grid-template-columns: repeat(${template.gridColumns}, 1fr);
        gap: ${spacing.grid}px;
        max-width: 100%;
      }
      
      /* ===== PRODUCT CARDS ===== */
      .product-card {
        background: ${template.colors.cardBackground};
        border-radius: ${template.design.borderRadius}px;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        
        ${template.design.shadows ? `
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        ` : ''}
      }
      
      .product-card:hover {
        transform: translateY(-2px);
        ${template.design.shadows ? `
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        ` : ''}
      }
      
      /* ===== PRODUCT IMAGE - CORREGIDO ===== */
      .product-image-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1; /* Mantener proporción cuadrada */
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        /* Borde sutil interno */
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
      }
      
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: contain; /* Mantiene proporción SIN recortar */
        object-position: center;
        /* Padding interno para evitar que toque los bordes */
        padding: 10px;
        /* Transición suave */
        transition: transform 0.3s ease;
      }
      
      /* Hover en imagen */
      .product-card:hover .product-image {
        transform: scale(1.05);
      }
      
      /* Placeholder para imágenes que no cargan */
      .product-image::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>') center/contain no-repeat;
        opacity: 0.3;
        z-index: -1;
      }
      
      /* ===== PRODUCT INFO - TEXTO MEJORADO ===== */
      .product-info {
        padding: ${spacing.card}px;
        position: relative;
      }
      
      .product-name {
        font-size: ${this.getProductNameSize(template.density)};
        font-weight: 600;
        color: ${textColors.title};
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        /* Mejorar legibilidad del título */
        text-shadow: ${this.getTextShadow(template.colors.background, textColors.title)};
        /* Background sutil si el contraste es bajo */
        ${this.needsTextBackground(template.colors.background, textColors.title) ? `
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 8px;
          border-radius: 4px;
          margin: -4px -8px ${spacing.card / 2}px -8px;
        ` : ''}
      }
      
      .product-price {
        font-size: ${this.getPriceSize(template.density)};
        font-weight: 700;
        color: ${textColors.price};
        margin-bottom: ${spacing.card / 2}px;
        /* Background destacado para el precio */
        background: ${this.getPriceBackground(template.colors.primary)};
        color: ${this.getPriceTextColor(template.colors.primary)};
        padding: 6px 12px;
        border-radius: 6px;
        display: inline-block;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      
      /* ===== INFORMACIÓN CONDICIONAL - TEXTO OPTIMIZADO ===== */
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: ${this.getDescriptionSize(template.density)};
        color: ${textColors.description};
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: ${template.density === 'alta' ? '2' : template.density === 'media' ? '3' : '4'};
        -webkit-box-orient: vertical;
        overflow: hidden;
        /* Mejorar legibilidad de descripción */
        ${this.needsTextBackground(template.colors.background, textColors.description) ? `
          background: rgba(255, 255, 255, 0.8);
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid ${template.colors.accent};
        ` : ''}
      }
      ` : `
      .product-description { display: none; }
      `}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: 0.8rem;
        color: ${textColors.sku};
        font-family: 'Monaco', monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: ${spacing.card / 2}px;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      ` : `
      .product-sku { display: none; }
      `}
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: 0.8rem;
        color: ${template.colors.accent};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        margin-bottom: ${spacing.card / 2}px;
        background: ${this.getCategoryBackground(template.colors.accent)};
        padding: 2px 6px;
        border-radius: 3px;
        display: inline-block;
      }
      ` : `
      .product-category { display: none; }
      `}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: 0.85rem;
        color: ${textColors.specifications};
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: ${spacing.card / 2}px;
        margin-top: ${spacing.card / 2}px;
        line-height: 1.4;
        background: rgba(0, 0, 0, 0.02);
        padding: ${spacing.card / 2}px;
        border-radius: 4px;
      }
      ` : `
      .product-specifications { display: none; }
      `}
      
      /* ===== FOOTER ===== */
      .catalog-footer {
        background: ${template.colors.secondary};
        color: ${this.getFooterTextColor(template.colors.secondary)};
        padding: ${spacing.footer}px;
        text-align: center;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        margin-top: 40px;
      }
      
      .business-contact {
        font-size: 0.9rem;
        line-height: 1.5;
      }
      
      .contact-item {
        display: inline-block;
        margin: 0 15px 5px 0;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      
      .footer-branding {
        margin-top: 15px;
        font-size: 0.8rem;
        opacity: 0.8;
      }
      
      /* ===== RESPONSIVE DESIGN ===== */
      
      /* Tablet */
      @media (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(${Math.max(1, template.gridColumns - 1)}, 1fr);
          gap: ${spacing.grid * 0.8}px;
        }
        
        .products-section {
          padding: ${spacing.section * 0.8}px;
        }
      }
      
      /* Mobile */
      @media (max-width: 768px) {
        .products-grid {
          grid-template-columns: ${template.density === 'alta' ? 'repeat(2, 1fr)' : '1fr'};
          gap: ${spacing.grid * 0.6}px;
        }
        
        .catalog-header {
          padding: ${spacing.header * 0.7}px;
        }
        
        .business-name {
          font-size: ${this.getMobileHeaderSize(template.density)};
        }
        
        .products-section {
          padding: ${spacing.section * 0.6}px;
        }
        
        .product-info {
          padding: ${spacing.card * 0.8}px;
        }
        
        /* En móvil, hacer las imágenes un poco más altas */
        .product-image-container {
          aspect-ratio: 4 / 3;
        }
      }
      
      /* ===== PRINT STYLES ===== */
      @media print {
        body.template-${template.id} {
          background: white !important;
        }
        
        .catalog-container {
          max-width: none !important;
          box-shadow: none !important;
        }
        
        .product-card {
          break-inside: avoid;
          box-shadow: none !important;
          border: 1px solid #ddd !important;
        }
        
        .catalog-header {
          break-after: avoid;
        }
        
        /* Asegurar que las imágenes se impriman bien */
        .product-image {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `;
  }
  
  /**
   * 🎨 OBTENER COLORES DE TEXTO OPTIMIZADOS PARA CONTRASTE
   */
  private static getOptimizedTextColors(template: IndustryTemplate) {
    const bgColor = template.colors.background;
    const isLightBg = this.isLightColor(bgColor);
    
    return {
      title: this.getContrastingColor(template.colors.text, bgColor, template.colors.primary),
      body: this.getContrastingColor(template.colors.text, bgColor),
      price: template.colors.primary,
      description: this.getContrastingColor(template.colors.text, bgColor, undefined, 0.8),
      sku: this.getContrastingColor(template.colors.text, bgColor, undefined, 0.7),
      specifications: this.getContrastingColor(template.colors.text, bgColor, undefined, 0.75)
    };
  }
  
  /**
   * 🔍 VERIFICAR SI UN COLOR ES CLARO O OSCURO
   */
  private static isLightColor(hexColor: string): boolean {
    // Convertir hex a RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular luminancia
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  
  /**
   * 📝 OBTENER COLOR CON BUEN CONTRASTE
   */
  private static getContrastingColor(
    originalColor: string, 
    backgroundColor: string, 
    fallbackColor?: string, 
    opacity: number = 1
  ): string {
    const isLightBg = this.isLightColor(backgroundColor);
    
    // Si el fondo es claro, usar texto oscuro
    if (isLightBg) {
      const darkColor = fallbackColor || '#2d3748';
      return opacity < 1 ? `rgba(45, 55, 72, ${opacity})` : darkColor;
    } else {
      // Si el fondo es oscuro, usar texto claro
      const lightColor = fallbackColor || '#f7fafc';
      return opacity < 1 ? `rgba(247, 250, 252, ${opacity})` : lightColor;
    }
  }
  
  /**
   * 🌟 GENERAR TEXT-SHADOW BASADO EN CONTRASTE
   */
  private static getTextShadow(backgroundColor: string, textColor: string): string {
    const isLightBg = this.isLightColor(backgroundColor);
    
    if (isLightBg) {
      // Fondo claro: sombra oscura sutil
      return '0 1px 2px rgba(0, 0, 0, 0.1)';
    } else {
      // Fondo oscuro: sombra clara sutil  
      return '0 1px 2px rgba(255, 255, 255, 0.2)';
    }
  }
  
  /**
   * 📦 VERIFICAR SI NECESITA BACKGROUND PARA TEXTO
   */
  private static needsTextBackground(backgroundColor: string, textColor: string): boolean {
    // Si los colores son muy similares en luminancia, agregar background
    const bgLuminance = this.isLightColor(backgroundColor) ? 1 : 0;
    const textLuminance = this.isLightColor(textColor) ? 1 : 0;
    
    // Si la diferencia es muy pequeña, necesita background
    return Math.abs(bgLuminance - textLuminance) < 0.3;
  }
  
  /**
   * 💰 GENERAR BACKGROUND PARA PRECIO
   */
  private static getPriceBackground(primaryColor: string): string {
    // Hacer el background un poco más claro/oscuro que el color primario
    if (this.isLightColor(primaryColor)) {
      return `linear-gradient(135deg, ${primaryColor} 0%, ${this.darkenColor(primaryColor, 10)} 100%)`;
    } else {
      return `linear-gradient(135deg, ${this.lightenColor(primaryColor, 10)} 0%, ${primaryColor} 100%)`;
    }
  }
  
  /**
   * 💰 COLOR DE TEXTO PARA PRECIO
   */
  private static getPriceTextColor(primaryColor: string): string {
    return this.isLightColor(primaryColor) ? '#2d3748' : '#ffffff';
  }
  
  /**
   * 🏷️ BACKGROUND PARA CATEGORÍA
   */
  private static getCategoryBackground(accentColor: string): string {
    return `${accentColor}20`; // 20% opacity
  }
  
  /**
   * 🦶 COLOR DE TEXTO PARA FOOTER
   */
  private static getFooterTextColor(secondaryColor: string): string {
    return this.isLightColor(secondaryColor) ? '#2d3748' : '#f7fafc';
  }
  
  /**
   * 🔧 UTILITARIAS PARA COLORES
   */
  private static darkenColor(hexColor: string, percent: number): string {
    const hex = hexColor.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent / 100));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent / 100));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent / 100));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  private static lightenColor(hexColor: string, percent: number): string {
    const hex = hexColor.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * percent / 100));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * percent / 100));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * percent / 100));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * 📏 VALORES DE SPACING SEGÚN DENSIDAD
   */
  private static getSpacingValues(spacing: 'compacto' | 'normal' | 'amplio') {
    const configs = {
      compacto: { header: 30, section: 20, grid: 15, card: 12, footer: 25 },
      normal: { header: 40, section: 30, grid: 20, card: 16, footer: 30 },
      amplio: { header: 50, section: 40, grid: 30, card: 24, footer: 40 }
    };
    return configs[spacing];
  }
  
  /**
   * 📝 TAMAÑOS DE TEXTO SEGÚN DENSIDAD
   */
  private static getHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '1.8rem',
      media: '2.2rem', 
      baja: '2.5rem'
    }[density];
  }
  
  private static getMobileHeaderSize(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '1.4rem',
      media: '1.6rem',
      baja: '1.8rem'
    }[density];
  }
  
  private static getProductNameSize(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '0.95rem',
      media: '1.1rem',
      baja: '1.25rem'
    }[density];
  }
  
  private static getPriceSize(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '1.1rem',
      media: '1.3rem',
      baja: '1.5rem'
    }[density];
  }
  
  private static getDescriptionSize(density: 'alta' | 'media' | 'baja'): string {
    return {
      alta: '0.8rem',
      media: '0.9rem',
      baja: '0.95rem'
    }[density];
  }
  
  /**
   * 🏗️ GENERA HTML COMPLETO DEL CATÁLOGO - FUNCIÓN SÍNCRONA
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    // IMPORTANTE: Esta función debe ser completamente síncrona
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTML(products, template);
    const footerHTML = this.generateFooterHTML(businessInfo);
    
    // Validar que businessInfo.business_name no sea undefined
    const businessName = businessInfo.business_name || 'Mi Negocio';
    const templateDisplayName = template.displayName || 'Catálogo';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo - ${businessName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
   * 🛍️ GENERA HTML DE PRODUCTOS - FUNCIÓN SÍNCRONA
   */
  private static generateProductsHTML(products: Product[], template: IndustryTemplate): string {
    return products.map(product => {
      // Validar que todos los campos estén definidos
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
          <img src="${productImage}" alt="${productName}" class="product-image" 
               onerror="this.style.display='none'" 
               onload="this.style.opacity='1'" 
               style="opacity:0; transition: opacity 0.3s ease;" />
        </div>
        <div class="product-info">
          ${template.showInfo.category && productCategory ? 
            `<div class="product-category">${productCategory}</div>` : ''}
          
          <h3 class="product-name">${productName}</h3>
          
          <div class="product-price">$${productPrice.toLocaleString('es-MX', { 
            minimumFractionDigits: 2 
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
   * 🔗 GENERA HTML DEL FOOTER - FUNCIÓN SÍNCRONA
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