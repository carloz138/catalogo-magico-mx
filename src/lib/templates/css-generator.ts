// src/lib/templates/css-generator.ts
// 🎨 GENERADOR DE CSS ESTANDARIZADO PARA TEMPLATES POR INDUSTRIA

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
   * 🎨 GENERA CSS ESTANDARIZADO PARA CUALQUIER TEMPLATE
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const spacing = this.getSpacingValues(template.design.spacing);
    
    return `
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} ===== */
      
      /* Reset y base */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body.template-${template.id} {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: ${template.colors.background};
        color: ${template.colors.text};
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
      }
      
      .catalog-subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
        font-weight: 400;
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
      
      /* ===== PRODUCT IMAGE ===== */
      .product-image-container {
        position: relative;
        width: 100%;
        height: ${template.imageSize.height}px;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .product-image {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        /* SIN overlays, badges o decoraciones sobre la imagen */
      }
      
      /* ===== PRODUCT INFO ===== */
      .product-info {
        padding: ${spacing.card}px;
      }
      
      .product-name {
        font-size: ${this.getProductNameSize(template.density)};
        font-weight: 600;
        color: ${template.colors.text};
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.3;
        /* Truncar nombres muy largos */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-price {
        font-size: ${this.getPriceSize(template.density)};
        font-weight: 700;
        color: ${template.colors.primary};
        margin-bottom: ${spacing.card / 2}px;
      }
      
      /* ===== INFORMACIÓN CONDICIONAL ===== */
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: ${this.getDescriptionSize(template.density)};
        color: ${template.colors.text};
        opacity: 0.8;
        margin-bottom: ${spacing.card / 2}px;
        line-height: 1.4;
        /* Truncar descripciones largas */
        display: -webkit-box;
        -webkit-line-clamp: ${template.density === 'alta' ? '2' : template.density === 'media' ? '3' : '4'};
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      ` : `
      .product-description { display: none; }
      `}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: 0.8rem;
        color: ${template.colors.text};
        opacity: 0.6;
        font-family: 'Monaco', monospace;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
        display: inline-block;
        margin-bottom: ${spacing.card / 2}px;
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
      }
      ` : `
      .product-category { display: none; }
      `}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: 0.85rem;
        color: ${template.colors.text};
        opacity: 0.7;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: ${spacing.card / 2}px;
        margin-top: ${spacing.card / 2}px;
        line-height: 1.4;
      }
      ` : `
      .product-specifications { display: none; }
      `}
      
      /* ===== FOOTER ===== */
      .catalog-footer {
        background: ${template.colors.secondary};
        color: ${template.colors.text};
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
      }
      
      .footer-branding {
        margin-top: 15px;
        font-size: 0.8rem;
        opacity: 0.7;
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
      }
    `;
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
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo - ${businessInfo.business_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${css}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        <!-- Header -->
        <header class="catalog-header">
            <h1 class="business-name">${businessInfo.business_name}</h1>
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
   * 🛍️ GENERA HTML DE PRODUCTOS
   */
  private static generateProductsHTML(products: Product[], template: IndustryTemplate): string {
    return products.map(product => `
      <div class="product-card">
        <div class="product-image-container">
          <img src="${product.image_url}" alt="${product.name}" class="product-image" />
        </div>
        <div class="product-info">
          ${template.showInfo.category && product.category ? 
            `<div class="product-category">${product.category}</div>` : ''}
          
          <h3 class="product-name">${product.name}</h3>
          
          <div class="product-price">$${product.price_retail.toLocaleString('es-MX', { 
            minimumFractionDigits: 2 
          })}</div>
          
          ${template.showInfo.description && product.description ? 
            `<p class="product-description">${product.description}</p>` : ''}
          
          ${template.showInfo.sku && product.sku ? 
            `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
          
          ${template.showInfo.specifications && product.specifications ? 
            `<div class="product-specifications">${product.specifications}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
  
  /**
   * 🔗 GENERA HTML DEL FOOTER CON INFORMACIÓN CONDICIONAL
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