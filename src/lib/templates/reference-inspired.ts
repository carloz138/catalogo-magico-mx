// src/lib/templates/reference-inspired.ts
// 🎯 TEMPLATES INSPIRADOS EN TUS IMÁGENES DE REFERENCIA

import { EnhancedTemplateConfig } from './enhanced-config';

/**
 * 🚀 TEMPLATE 1: TECH BIG SALE (Inspirado en tu imagen 1)
 * Reproduce el diseño moderno con elementos geométricos verdes y layout asimétrico
 */
export const TECH_BIG_SALE: EnhancedTemplateConfig = {
  id: 'tech-big-sale',
  name: 'tech-big-sale',
  displayName: 'Tech Big Sale',
  description: 'Diseño tecnológico moderno con elementos geométricos y layout dinámico',
  isPremium: true,
  
  layout: {
    type: 'asymmetric',
    productsPerPage: 6,
    gridColumns: 3,
    featuredProduct: true
  },
  
  design: {
    imageSize: { width: 400, height: 400 },
    borderRadius: 0,
    shadows: true,
    animations: true,
    decorativeElements: true
  },
  
  colors: {
    primary: '#00E676',        // Verde brillante como en la imagen
    secondary: '#1DE9B6',      // Verde agua
    accent: '#FFD740',         // Amarillo para precios
    background: '#FAFAFA',     // Fondo claro
    surface: '#FFFFFF',        // Blanco para cards
    textPrimary: '#212121',    // Negro para texto
    textSecondary: '#757575',  // Gris para descripciones
    gradient: 'linear-gradient(135deg, #00E676, #1DE9B6)'
  },
  
  typography: {
    headerFont: 'Roboto',
    bodyFont: 'Roboto',
    headerSize: '48px',
    bodySize: '16px',
    titleWeight: 900,          // Extra bold como en la imagen
    spacing: 'tight'
  },
  
  elements: {
    logo: false,
    badges: true,              // Círculos de descuento
    priceHighlight: true,      // Precios en círculos amarillos
    backgroundPattern: true,   // Patrones geométricos
    geometricShapes: true,     // Formas decorativas
    diagonalAccents: true      // Bandas diagonales
  },
  
  category: 'tech',
  tags: ['tecnología', 'ofertas', 'moderno', 'dinámico'],
  industry: ['tecnología', 'electrónicos', 'gadgets']
};

/**
 * 👔 TEMPLATE 2: FASHION CATALOG RED (Inspirado en tu imagen 2)
 * Reproduce el diseño de moda con colores rojos y layout tipo revista
 */
export const FASHION_CATALOG_RED: EnhancedTemplateConfig = {
  id: 'fashion-catalog-red',
  name: 'fashion-catalog-red',
  displayName: 'Fashion Catalog Red',
  description: 'Catálogo de moda estilo revista con diseño rojo corporativo',
  isPremium: true,
  
  layout: {
    type: 'magazine',
    productsPerPage: 8,
    gridColumns: 4,
    featuredProduct: false
  },
  
  design: {
    imageSize: { width: 350, height: 450 },
    borderRadius: 8,
    shadows: false,
    animations: false,
    decorativeElements: false
  },
  
  colors: {
    primary: '#D32F2F',        // Rojo corporativo como en la imagen
    secondary: '#F44336',      // Rojo más claro
    accent: '#FFFFFF',         // Blanco para contraste
    background: '#FFFFFF',     // Fondo blanco limpio
    surface: '#FAFAFA',        // Gris muy claro para secciones
    textPrimary: '#212121',    // Negro para texto
    textSecondary: '#757575'   // Gris para info secundaria
  },
  
  typography: {
    headerFont: 'Montserrat',
    bodyFont: 'Open Sans',
    headerSize: '42px',
    bodySize: '14px',
    titleWeight: 700,
    spacing: 'normal'
  },
  
  elements: {
    logo: true,
    badges: false,
    priceHighlight: true,      // Precios destacados en rojo
    backgroundPattern: false,
    geometricShapes: false,
    diagonalAccents: false
  },
  
  category: 'fashion',
  tags: ['moda', 'corporativo', 'limpio', 'profesional'],
  industry: ['moda', 'ropa', 'accesorios', 'retail']
};

/**
 * 🪑 TEMPLATE 3: FURNITURE MINIMAL (Inspirado en tu imagen 3)
 * Reproduce el diseño minimalista de muebles con grid limpio
 */
export const FURNITURE_MINIMAL: EnhancedTemplateConfig = {
  id: 'furniture-minimal',
  name: 'furniture-minimal',
  displayName: 'Furniture Minimal',
  description: 'Catálogo de muebles con diseño minimalista y grid organizado',
  isPremium: true,
  
  layout: {
    type: 'grid',
    productsPerPage: 9,
    gridColumns: 3,
    featuredProduct: false
  },
  
  design: {
    imageSize: { width: 300, height: 300 },
    borderRadius: 4,
    shadows: false,
    animations: false,
    decorativeElements: false
  },
  
  colors: {
    primary: '#5D4037',        // Marrón oscuro como en la imagen
    secondary: '#8D6E63',      // Marrón más claro
    accent: '#A5A5A5',         // Gris para elementos secundarios
    background: '#5D4037',     // Fondo marrón oscuro
    surface: '#FFFFFF',        // Blanco para cards de productos
    textPrimary: '#FFFFFF',    // Blanco para texto en fondo oscuro
    textSecondary: '#BDBDBD'   // Gris claro para descripciones
  },
  
  typography: {
    headerFont: 'Lato',
    bodyFont: 'Lato',
    headerSize: '36px',
    bodySize: '14px',
    titleWeight: 400,          // Peso normal, estilo minimalista
    spacing: 'loose'
  },
  
  elements: {
    logo: false,
    badges: false,             // Sin badges para mantener minimalismo
    priceHighlight: false,
    backgroundPattern: false,
    geometricShapes: false,
    diagonalAccents: false
  },
  
  category: 'lifestyle',
  tags: ['muebles', 'minimalista', 'hogar', 'decoración'],
  industry: ['muebles', 'hogar', 'decoración', 'diseño']
};

/**
 * 🔥 GENERADOR ESPECÍFICO PARA ESTOS TEMPLATES DE REFERENCIA
 */
export class ReferenceTemplateGenerator {
  
  /**
   * 🚀 TECH BIG SALE - HTML Generator
   */
  static generateTechBigSaleHTML(products: any[], businessInfo: any): string {
    const featuredProduct = products[0];
    const regularProducts = products.slice(1);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tech Big Sale - ${businessInfo.business_name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
              ${this.getTechBigSaleCSS()}
          </style>
      </head>
      <body>
          <div class="catalog-container">
              <!-- Header con estilo tech -->
              <div class="tech-header">
                  <div class="discount-badge">
                      <div class="discount-text">GET UP TO</div>
                      <div class="discount-amount">50%</div>
                      <div class="discount-word">DISCOUNT</div>
                  </div>
                  <div class="main-title">
                      <div class="title-line1">TECHNOLOGY</div>
                      <div class="title-line2">BIG SALE</div>
                  </div>
                  <div class="geometric-decoration"></div>
              </div>
              
              <!-- Grid de productos asimétrico -->
              <div class="products-grid-tech">
                  <!-- Producto destacado grande -->
                  <div class="product-hero">
                      <div class="product-image-hero">
                          <img src="${featuredProduct.image_url}" alt="${featuredProduct.name}" />
                      </div>
                      <div class="price-circle-large">
                          <span class="currency">$</span>
                          <span class="amount">${Math.round(featuredProduct.price_retail)}</span>
                      </div>
                      <div class="product-info-hero">
                          <h2>${featuredProduct.name}</h2>
                          <p>${featuredProduct.description}</p>
                      </div>
                  </div>
                  
                  <!-- Productos pequeños -->
                  ${regularProducts.slice(0, 5).map(product => `
                      <div class="product-small">
                          <div class="product-image-small">
                              <img src="${product.image_url}" alt="${product.name}" />
                          </div>
                          <div class="price-circle-small">
                              <span>$${Math.round(product.price_retail)}</span>
                          </div>
                          <div class="product-name-small">${product.name}</div>
                      </div>
                  `).join('')}
              </div>
              
              <!-- Footer con info de contacto -->
              <div class="tech-footer">
                  <div class="website">WWW.${businessInfo.business_name.replace(/\s/g, '').toUpperCase()}.COM</div>
                  <div class="contact-grid">
                      <div>${businessInfo.phone || 'LOREM IPSUM DOLOR SIT'}</div>
                      <div>${businessInfo.email || 'LOREM IPSUM DOLOR SIT'}</div>
                      <div>${businessInfo.address || 'LOREM IPSUM DOLOR SIT'}</div>
                  </div>
                  <div class="qr-placeholder">
                      <div class="qr-square"></div>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 👔 FASHION CATALOG RED - HTML Generator
   */
  static generateFashionRedHTML(products: any[], businessInfo: any): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fashion Catalog - ${businessInfo.business_name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
          <style>
              ${this.getFashionRedCSS()}
          </style>
      </head>
      <body>
          <div class="fashion-catalog">
              <!-- Header corporativo -->
              <div class="fashion-header">
                  <div class="logo-section">
                      <div class="business-logo">${businessInfo.business_name.charAt(0)}</div>
                      <h1>${businessInfo.business_name.toUpperCase()}</h1>
                  </div>
                  <div class="catalog-title">
                      <h2>MULTIPURPOSE</h2>
                      <h1>PRODUCT CATALOG</h1>
                  </div>
              </div>
              
              <!-- Grid de productos estilo revista -->
              <div class="fashion-products-grid">
                  ${products.map(product => `
                      <div class="fashion-product-card">
                          <div class="product-image-fashion">
                              <img src="${product.image_url}" alt="${product.name}" />
                          </div>
                          <div class="product-info-fashion">
                              <h3>${product.name}</h3>
                              <p class="product-category">${product.category || 'Fashion'}</p>
                              <div class="price-fashion">$${product.price_retail.toFixed(2)}</div>
                          </div>
                      </div>
                  `).join('')}
              </div>
              
              <!-- Secciones adicionales estilo revista -->
              <div class="magazine-sections">
                  <div class="section-new-collection">
                      <h2>New Collection</h2>
                      <p>Latest trends and styles</p>
                  </div>
                  <div class="section-featured">
                      <h2>Best Sellers</h2>
                      <p>Most popular items</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 🪑 FURNITURE MINIMAL - HTML Generator
   */
  static generateFurnitureMinimalHTML(products: any[], businessInfo: any): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Furniture Catalog - ${businessInfo.business_name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
          <style>
              ${this.getFurnitureMinimalCSS()}
          </style>
      </head>
      <body>
          <div class="furniture-catalog">
              <!-- Header minimalista -->
              <div class="furniture-header">
                  <h1>CATÁLOGO DE PRODUCTOS</h1>
              </div>
              
              <!-- Grid limpio y organizado -->
              <div class="furniture-grid">
                  ${products.map(product => `
                      <div class="furniture-item">
                          <div class="furniture-image">
                              <img src="${product.image_url}" alt="${product.name}" />
                          </div>
                          <div class="furniture-details">
                              <div class="item-id">${product.sku || 'Producto ID ' + product.id.slice(-2)}</div>
                              <h3>${product.name}</h3>
                              <div class="specs">
                                  <div class="spec">
                                      <span class="spec-label">Modelo:</span>
                                      <span class="spec-value">${product.name.split(' ')[0]}</span>
                                  </div>
                                  <div class="spec">
                                      <span class="spec-label">Tamaño:</span>
                                      <span class="spec-value">Estándar</span>
                                  </div>
                                  <div class="spec">
                                      <span class="spec-label">Color:</span>
                                      <span class="color-options">
                                          <span class="color-dot color-1"></span>
                                          <span class="color-dot color-2"></span>
                                          <span class="color-dot color-3"></span>
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  `).join('')}
              </div>
          </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 🎨 CSS ESPECÍFICO PARA TECH BIG SALE
   */
  private static getTechBigSaleCSS(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
          font-family: 'Roboto', sans-serif;
          background: #f5f5f5;
          color: #333;
      }
      
      .catalog-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
      }
      
      /* TECH HEADER */
      .tech-header {
          position: relative;
          padding: 40px;
          background: linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
      }
      
      .discount-badge {
          background: #00E676;
          color: white;
          padding: 20px;
          border-radius: 50%;
          width: 150px;
          height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 230, 118, 0.3);
      }
      
      .discount-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
      }
      
      .discount-amount {
          font-size: 36px;
          font-weight: 900;
          line-height: 1;
      }
      
      .discount-word {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
      }
      
      .main-title {
          text-align: center;
          flex: 1;
          margin: 0 40px;
      }
      
      .title-line1 {
          font-size: 48px;
          font-weight: 300;
          color: #666;
          letter-spacing: 8px;
      }
      
      .title-line2 {
          font-size: 64px;
          font-weight: 900;
          color: #333;
          letter-spacing: 4px;
          margin-top: -10px;
      }
      
      .geometric-decoration {
          width: 100px;
          height: 100px;
          background: linear-gradient(45deg, #00E676, #1DE9B6);
          transform: rotate(45deg);
          border-radius: 20px;
          opacity: 0.8;
      }
      
      /* GRID ASIMÉTRICO */
      .products-grid-tech {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: 1fr 1fr 1fr;
          gap: 20px;
          padding: 40px;
      }
      
      .product-hero {
          grid-row: span 2;
          position: relative;
          background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
          border-radius: 20px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
      }
      
      .product-image-hero {
          width: 200px;
          height: 200px;
          margin-bottom: 20px;
      }
      
      .product-image-hero img {
          width: 100%;
          height: 100%;
          object-fit: contain;
      }
      
      .price-circle-large {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #FFD740;
          color: #333;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          box-shadow: 0 5px 15px rgba(255, 215, 64, 0.4);
      }
      
      .currency { font-size: 12px; }
      .amount { font-size: 18px; line-height: 1; }
      
      .product-info-hero h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #333;
      }
      
      .product-info-hero p {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
      }
      
      /* PRODUCTOS PEQUEÑOS */
      .product-small {
          background: white;
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          position: relative;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
      }
      
      .product-small:hover {
          transform: translateY(-5px);
      }
      
      .product-image-small {
          width: 80px;
          height: 80px;
          margin: 0 auto 15px;
      }
      
      .product-image-small img {
          width: 100%;
          height: 100%;
          object-fit: contain;
      }
      
      .price-circle-small {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #FFD740;
          color: #333;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
      }
      
      .product-name-small {
          font-size: 14px;
          font-weight: 600;
          color: #333;
      }
      
      /* FOOTER TECH */
      .tech-footer {
          background: #333;
          color: white;
          padding: 30px 40px;
          display: grid;
          grid-template-columns: 1fr 2fr 100px;
          gap: 30px;
          align-items: center;
      }
      
      .website {
          font-size: 18px;
          font-weight: 700;
          color: #00E676;
      }
      
      .contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          font-size: 12px;
          line-height: 1.5;
      }
      
      .qr-placeholder {
          display: flex;
          justify-content: center;
      }
      
      .qr-square {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 8px;
      }
      
      /* RESPONSIVE */
      @media (max-width: 768px) {
          .products-grid-tech {
              grid-template-columns: 1fr;
              grid-template-rows: auto;
          }
          .product-hero { grid-row: span 1; }
          .title-line1 { font-size: 24px; }
          .title-line2 { font-size: 32px; }
          .tech-footer {
              grid-template-columns: 1fr;
              text-align: center;
              gap: 20px;
          }
      }
    `;
  }
  
  /**
   * 🎨 CSS ESPECÍFICO PARA FASHION RED
   */
  private static getFashionRedCSS(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
          font-family: 'Open Sans', sans-serif;
          background: white;
          color: #333;
      }
      
      .fashion-catalog {
          max-width: 1200px;
          margin: 0 auto;
      }
      
      /* FASHION HEADER */
      .fashion-header {
          background: #D32F2F;
          color: white;
          padding: 60px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      
      .logo-section {
          display: flex;
          align-items: center;
          gap: 20px;
      }
      
      .business-logo {
          width: 60px;
          height: 60px;
          background: white;
          color: #D32F2F;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
      }
      
      .logo-section h1 {
          font-family: 'Montserrat', sans-serif;
          font-size: 28px;
          font-weight: 700;
      }
      
      .catalog-title {
          text-align: right;
      }
      
      .catalog-title h2 {
          font-size: 18px;
          font-weight: 400;
          margin-bottom: 5px;
          opacity: 0.9;
      }
      
      .catalog-title h1 {
          font-family: 'Montserrat', sans-serif;
          font-size: 36px;
          font-weight: 700;
      }
      
      /* GRID DE PRODUCTOS FASHION */
      .fashion-products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          padding: 40px;
      }
      
      .fashion-product-card {
          background: white;
          border: 1px solid #f0f0f0;
          padding: 20px;
          text-align: center;
          transition: box-shadow 0.3s ease;
      }
      
      .fashion-product-card:hover {
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      }
      
      .product-image-fashion {
          width: 100%;
          height: 200px;
          margin-bottom: 20px;
          background: #fafafa;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      
      .product-image-fashion img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
      }
      
      .product-info-fashion h3 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
      }
      
      .product-category {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 1px;
      }
      
      .price-fashion {
          font-size: 18px;
          font-weight: 700;
          color: #D32F2F;
      }
      
      /* SECCIONES ESTILO REVISTA */
      .magazine-sections {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          margin-top: 40px;
      }
      
      .magazine-sections > div {
          padding: 60px 40px;
          text-align: center;
      }
      
      .section-new-collection {
          background: #f8f8f8;
      }
      
      .section-featured {
          background: #D32F2F;
          color: white;
      }
      
      .magazine-sections h2 {
          font-family: 'Montserrat', sans-serif;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 15px;
      }
      
      .magazine-sections p {
          font-size: 16px;
          opacity: 0.8;
      }
      
      /* RESPONSIVE */
      @media (max-width: 768px) {
          .fashion-products-grid {
              grid-template-columns: repeat(2, 1fr);
          }
          .fashion-header {
              flex-direction: column;
              text-align: center;
              gap: 20px;
          }
          .catalog-title {
              text-align: center;
          }
      }
    `;
  }
  
  /**
   * 🎨 CSS ESPECÍFICO PARA FURNITURE MINIMAL
   */
  private static getFurnitureMinimalCSS(): string {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
          font-family: 'Lato', sans-serif;
          background: #5D4037;
          color: white;
      }
      
      .furniture-catalog {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px;
      }
      
      /* HEADER MINIMALISTA */
      .furniture-header {
          text-align: center;
          margin-bottom: 60px;
          padding-bottom: 30px;
          border-bottom: 1px solid rgba(255,255,255,0.3);
      }
      
      .furniture-header h1 {
          font-size: 36px;
          font-weight: 300;
          letter-spacing: 8px;
          color: white;
      }
      
      /* GRID LIMPIO */
      .furniture-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
      }
      
      .furniture-item {
          background: white;
          color: #333;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .furniture-image {
          width: 100%;
          height: 200px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      
      .furniture-image img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
      }
      
      .furniture-details {
          padding: 20px;
      }
      
      .item-id {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
      }
      
      .furniture-details h3 {
          font-size: 18px;
          font-weight: 400;
          color: #333;
          margin-bottom: 15px;
      }
      
      .specs {
          display: flex;
          flex-direction: column;
          gap: 8px;
      }
      
      .spec {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
      }
      
      .spec-label {
          color: #666;
          font-weight: 300;
      }
      
      .spec-value {
          color: #333;
          font-weight: 400;
      }
      
      .color-options {
          display: flex;
          gap: 5px;
      }
      
      .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid #ddd;
      }
      
      .color-1 { background: #8D6E63; }
      .color-2 { background: #A5A5A5; }
      .color-3 { background: #5D4037; }
      
      /* RESPONSIVE */
      @media (max-width: 768px) {
          .furniture-grid {
              grid-template-columns: 1fr;
          }
          .furniture-header h1 {
              font-size: 24px;
              letter-spacing: 4px;
          }
      }
    `;
  }
}

/**
 * 🎯 MAPA DE TEMPLATES DE REFERENCIA
 */
export const REFERENCE_TEMPLATES: Record<string, EnhancedTemplateConfig> = {
  'tech-big-sale': TECH_BIG_SALE,
  'fashion-catalog-red': FASHION_CATALOG_RED,
  'furniture-minimal': FURNITURE_MINIMAL
};

/**
 * 🚀 FUNCIÓN PRINCIPAL PARA GENERAR TEMPLATES DE REFERENCIA
 */
export const generateReferenceTemplate = (
  products: any[],
  businessInfo: any,
  templateId: string
): string => {
  
  switch (templateId) {
    case 'tech-big-sale':
      return ReferenceTemplateGenerator.generateTechBigSaleHTML(products, businessInfo);
      
    case 'fashion-catalog-red':
      return ReferenceTemplateGenerator.generateFashionRedHTML(products, businessInfo);
      
    case 'furniture-minimal':
      return ReferenceTemplateGenerator.generateFurnitureMinimalHTML(products, businessInfo);
      
    default:
      throw new Error(`Template de referencia ${templateId} no encontrado`);
  }
};