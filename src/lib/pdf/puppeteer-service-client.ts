// src/lib/pdf/puppeteer-service-client.ts
// 🎯 LAYOUT FIJO: HEADER Y FOOTER ESTANDARIZADO - SOLO VARÍAN LAS TARJETAS

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

interface TemplateConfig {
  id: string;
  displayName: string;
  productsPerPage: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout: string;
  features: string[];
  category: string;
}

interface PuppeteerServiceOptions {
  onProgress?: (progress: number) => void;
  format?: 'A4' | 'Letter';
  margin?: { top: string; right: string; bottom: string; left: string; };
  quality?: 'low' | 'medium' | 'high';
}

// 📐 DIMENSIONES FIJAS ESTÁNDAR PARA TODOS LOS TEMPLATES
const FIXED_LAYOUT = {
  PAGE: {
    WIDTH: 210, // mm (A4)
    HEIGHT: 297, // mm (A4)
    MARGIN: 12 // mm
  },
  HEADER: {
    HEIGHT: 25, // mm fijo
    MARGIN_BOTTOM: 8 // mm
  },
  FOOTER: {
    HEIGHT: 20, // mm fijo
    MARGIN_TOP: 8 // mm
  }
};

// Calcular área disponible para productos
const CONTENT_AREA = {
  WIDTH: FIXED_LAYOUT.PAGE.WIDTH - (FIXED_LAYOUT.PAGE.MARGIN * 2), // 186mm
  HEIGHT: FIXED_LAYOUT.PAGE.HEIGHT - (FIXED_LAYOUT.PAGE.MARGIN * 2) - FIXED_LAYOUT.HEADER.HEIGHT - FIXED_LAYOUT.HEADER.MARGIN_BOTTOM - FIXED_LAYOUT.FOOTER.HEIGHT - FIXED_LAYOUT.FOOTER.MARGIN_TOP, // 224mm
  PADDING: 4 // mm interno
};

const PRODUCTS_AREA = {
  WIDTH: CONTENT_AREA.WIDTH - (CONTENT_AREA.PADDING * 2), // 178mm
  HEIGHT: CONTENT_AREA.HEIGHT - (CONTENT_AREA.PADDING * 2) // 216mm
};

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL MEJORADA CON LAYOUT FIJO
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<any> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Generando PDF con layout fijo...', {
        products: products.length,
        template: template.id,
        contentArea: `${PRODUCTS_AREA.WIDTH}x${PRODUCTS_AREA.HEIGHT}mm`
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // Health Check
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // Calcular dimensiones de tarjetas según el área fija
      const cardDimensions = this.calculateCardDimensions(template.productsPerPage);
      
      // Generar HTML con layout fijo
      const htmlContent = this.generateFixedLayoutHTML(
        products, 
        businessInfo, 
        template, 
        cardDimensions,
        options.quality || 'medium'
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // Generar PDF
      const pdfBlob = await this.generatePDFWithRetry(
        htmlContent, 
        this.getPDFOptions(options), 
        businessInfo, 
        options.onProgress
      );
      
      if (options.onProgress) options.onProgress(90);
      
      // Descargar
      await this.downloadPDF(pdfBlob, businessInfo.business_name);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      
      console.log('✅ PDF generado con layout fijo:', {
        time: generationTime,
        size: pdfBlob.size,
        cardDimensions
      });
      
      return {
        success: true,
        stats: {
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / template.productsPerPage),
          generationTime
        }
      };
      
    } catch (error) {
      console.error('❌ Error en PDF con layout fijo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 📐 CALCULAR DIMENSIONES EXACTAS DE TARJETAS PARA EL ÁREA DISPONIBLE
   */
  private static calculateCardDimensions(productsPerPage: number) {
    // Decidir columnas según productos por página
    let columns: number;
    if (productsPerPage <= 3) columns = 2;
    else if (productsPerPage <= 6) columns = 3;
    else if (productsPerPage <= 12) columns = 4;
    else columns = 5;
    
    // Calcular filas necesarias
    const rows = Math.ceil(productsPerPage / columns);
    
    // Calcular espacios entre tarjetas
    const gap = Math.max(2, Math.min(6, PRODUCTS_AREA.WIDTH * 0.02)); // 2-6mm gap adaptativo
    
    // Calcular dimensiones de cada tarjeta
    const totalGapWidth = (columns - 1) * gap;
    const totalGapHeight = (rows - 1) * gap;
    
    const cardWidth = (PRODUCTS_AREA.WIDTH - totalGapWidth) / columns;
    const cardHeight = (PRODUCTS_AREA.HEIGHT - totalGapHeight) / rows;
    
    // Asegurar que las tarjetas no sean demasiado pequeñas ni grandes
    const minCardWidth = 35; // mm
    const maxCardWidth = 80; // mm
    const minCardHeight = 40; // mm
    const maxCardHeight = 90; // mm
    
    const finalCardWidth = Math.max(minCardWidth, Math.min(maxCardWidth, cardWidth));
    const finalCardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, cardHeight));
    
    // Distribuir altura entre imagen y texto
    const imageHeightRatio = 0.65; // 65% para imagen
    const imageHeight = finalCardHeight * imageHeightRatio;
    const textHeight = finalCardHeight * (1 - imageHeightRatio);
    
    return {
      columns,
      rows,
      gap: Math.round(gap * 100) / 100,
      cardWidth: Math.round(finalCardWidth * 100) / 100,
      cardHeight: Math.round(finalCardHeight * 100) / 100,
      imageHeight: Math.round(imageHeight * 100) / 100,
      textHeight: Math.round(textHeight * 100) / 100,
      // Información adicional para debug
      productsPerPage,
      availableArea: `${PRODUCTS_AREA.WIDTH}x${PRODUCTS_AREA.HEIGHT}mm`
    };
  }
  
  /**
   * 🏗️ GENERAR HTML CON LAYOUT COMPLETAMENTE FIJO
   */
  private static generateFixedLayoutHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    cardDimensions: any,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const css = this.generateFixedLayoutCSS(template, cardDimensions, quality);
    const pagesHTML = this.generateFixedPages(products, businessInfo, template, cardDimensions);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=210mm, height=297mm, initial-scale=1.0">
        <title>Catálogo ${businessInfo.business_name}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="catalog-document">
          ${pagesHTML}
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 🎨 CSS COMPLETAMENTE FIJO - HEADER Y FOOTER SIEMPRE EN SU LUGAR
   */
  private static generateFixedLayoutCSS(
    template: TemplateConfig,
    cardDimensions: any,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const qualitySettings = {
      low: { fontSize: 10, borderRadius: 4, cardPadding: 2 },
      medium: { fontSize: 11, borderRadius: 6, cardPadding: 3 },
      high: { fontSize: 12, borderRadius: 8, cardPadding: 4 }
    };
    
    const config = qualitySettings[quality];
    
    return `
      /* ===== LAYOUT FIJO - HEADER Y FOOTER ESTANDARIZADO ===== */
      
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      @page {
        size: A4 portrait;
        margin: ${FIXED_LAYOUT.PAGE.MARGIN}mm;
        marks: none;
        bleed: 0;
        -webkit-print-color-adjust: exact;
      }
      
      html {
        width: ${FIXED_LAYOUT.PAGE.WIDTH}mm;
        height: ${FIXED_LAYOUT.PAGE.HEIGHT}mm;
        font-size: ${config.fontSize}pt;
      }
      
      body {
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: ${template.colors.background} !important;
        color: ${template.colors.text} !important;
        line-height: 1.3;
        width: ${CONTENT_AREA.WIDTH}mm;
        height: auto;
        margin: 0 auto;
        padding: 0;
        overflow: visible;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== DOCUMENTO COMPLETO ===== */
      .catalog-document {
        width: 100%;
        display: block;
      }
      
      /* ===== PÁGINA INDIVIDUAL CON LAYOUT FIJO ===== */
      .catalog-page {
        width: ${CONTENT_AREA.WIDTH}mm;
        height: auto;
        min-height: ${CONTENT_AREA.HEIGHT + FIXED_LAYOUT.HEADER.HEIGHT + FIXED_LAYOUT.FOOTER.HEIGHT}mm;
        position: relative;
        margin: 0 auto;
        page-break-after: always;
        page-break-inside: avoid;
        background: ${template.colors.background} !important;
        overflow: visible;
        display: flex;
        flex-direction: column;
        -webkit-print-color-adjust: exact !important;
      }
      
      .catalog-page:last-child {
        page-break-after: avoid;
      }
      
      /* ===== HEADER FIJO - SIEMPRE ${FIXED_LAYOUT.HEADER.HEIGHT}mm ===== */
      .fixed-header {
        width: 100% !important;
        height: ${FIXED_LAYOUT.HEADER.HEIGHT}mm !important;
        min-height: ${FIXED_LAYOUT.HEADER.HEIGHT}mm !important;
        max-height: ${FIXED_LAYOUT.HEADER.HEIGHT}mm !important;
        background: ${template.colors.primary} !important;
        background-image: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
        color: white !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        border-radius: ${config.borderRadius}px !important;
        position: relative !important;
        overflow: hidden !important;
        margin-bottom: ${FIXED_LAYOUT.HEADER.MARGIN_BOTTOM}mm !important;
        flex-shrink: 0 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .header-business-name {
        font-size: ${config.fontSize + 6}pt !important;
        font-weight: 700 !important;
        margin: 0 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5pt !important;
        color: white !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
        word-wrap: break-word !important;
        max-width: 90% !important;
        line-height: 1.1 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      
      .header-subtitle {
        font-size: ${config.fontSize + 1}pt !important;
        font-weight: 300 !important;
        opacity: 0.9 !important;
        color: white !important;
        margin-top: 1mm !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        max-width: 90% !important;
      }
      
      /* ===== ÁREA DE PRODUCTOS FIJA - EXACTAMENTE ${PRODUCTS_AREA.HEIGHT}mm DE ALTO ===== */
      .products-area {
        width: 100% !important;
        height: ${CONTENT_AREA.HEIGHT}mm !important;
        min-height: ${CONTENT_AREA.HEIGHT}mm !important;
        max-height: ${CONTENT_AREA.HEIGHT}mm !important;
        padding: ${CONTENT_AREA.PADDING}mm !important;
        position: relative !important;
        overflow: visible !important;
        flex-grow: 0 !important;
        flex-shrink: 0 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
        background: transparent !important;
      }
      
      /* ===== GRID DE PRODUCTOS CON DIMENSIONES EXACTAS ===== */
      .products-grid {
        display: grid !important;
        grid-template-columns: repeat(${cardDimensions.columns}, ${cardDimensions.cardWidth}mm) !important;
        grid-template-rows: repeat(${cardDimensions.rows}, ${cardDimensions.cardHeight}mm) !important;
        gap: ${cardDimensions.gap}mm !important;
        width: ${cardDimensions.columns * cardDimensions.cardWidth + (cardDimensions.columns - 1) * cardDimensions.gap}mm !important;
        height: ${cardDimensions.rows * cardDimensions.cardHeight + (cardDimensions.rows - 1) * cardDimensions.gap}mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        justify-content: center !important;
        align-content: flex-start !important;
        place-items: center !important;
        position: relative !important;
        overflow: visible !important;
      }
      
      /* ===== TARJETAS CON DIMENSIONES EXACTAS ===== */
      .product-card {
        width: ${cardDimensions.cardWidth}mm !important;
        height: ${cardDimensions.cardHeight}mm !important;
        min-width: ${cardDimensions.cardWidth}mm !important;
        min-height: ${cardDimensions.cardHeight}mm !important;
        max-width: ${cardDimensions.cardWidth}mm !important;
        max-height: ${cardDimensions.cardHeight}mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: ${config.borderRadius}px !important;
        overflow: hidden !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.08) !important;
        -webkit-print-color-adjust: exact !important;
        page-break-inside: avoid !important;
        padding: ${config.cardPadding}mm !important;
        box-sizing: border-box !important;
      }
      
      /* ===== DECORACIÓN SUPERIOR ===== */
      .card-decoration {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 1.5pt !important;
        background: ${template.colors.primary} !important;
        background-image: linear-gradient(90deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== ÁREA DE IMAGEN CON ALTURA FIJA ===== */
      .product-image-container {
        width: 100% !important;
        height: ${cardDimensions.imageHeight}mm !important;
        min-height: ${cardDimensions.imageHeight}mm !important;
        max-height: ${cardDimensions.imageHeight}mm !important;
        background: #f8f9fa !important;
        border-radius: ${Math.max(config.borderRadius - 2, 2)}px !important;
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        margin-bottom: 1mm !important;
        flex-shrink: 0 !important;
        border: 0.25pt solid #e9ecef !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-image {
        max-width: 95% !important;
        max-height: 95% !important;
        width: auto !important;
        height: auto !important;
        display: block !important;
        object-fit: contain !important;
        object-position: center !important;
        border-radius: 2px !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-image-placeholder {
        width: 85% !important;
        height: 85% !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: 6px 6px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        color: #999 !important;
        font-size: 7pt !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== ÁREA DE TEXTO CON ALTURA FIJA ===== */
      .product-text-area {
        width: 100% !important;
        height: ${cardDimensions.textHeight}mm !important;
        min-height: ${cardDimensions.textHeight}mm !important;
        max-height: ${cardDimensions.textHeight}mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        align-items: center !important;
        text-align: center !important;
        overflow: hidden !important;
        flex-shrink: 0 !important;
        padding-top: 1mm !important;
      }
      
      .product-name {
        font-size: ${config.fontSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        line-height: 1.1 !important;
        margin: 0 auto 1mm auto !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        text-align: center !important;
        max-width: 100% !important;
        flex-grow: 1 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-price {
        font-size: ${config.fontSize + 1}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1mm 2mm !important;
        border-radius: 8px !important;
        display: inline-block !important;
        margin: 0 auto !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 0.5pt 2pt rgba(0,0,0,0.15) !important;
        -webkit-print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      /* ===== TARJETAS VACÍAS ===== */
      .product-card.empty {
        visibility: hidden !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      
      /* ===== FOOTER FIJO - SIEMPRE ${FIXED_LAYOUT.FOOTER.HEIGHT}mm ===== */
      .fixed-footer {
        width: 100% !important;
        height: ${FIXED_LAYOUT.FOOTER.HEIGHT}mm !important;
        min-height: ${FIXED_LAYOUT.FOOTER.HEIGHT}mm !important;
        max-height: ${FIXED_LAYOUT.FOOTER.HEIGHT}mm !important;
        background: ${template.colors.secondary} !important;
        color: ${this.getContrastColor(template.colors.secondary)} !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        border-radius: ${config.borderRadius}px !important;
        padding: 2mm !important;
        box-sizing: border-box !important;
        margin-top: ${FIXED_LAYOUT.FOOTER.MARGIN_TOP}mm !important;
        position: relative !important;
        overflow: hidden !important;
        flex-shrink: 0 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .footer-contact {
        font-size: ${config.fontSize - 1}pt !important;
        font-weight: 600 !important;
        margin-bottom: 1mm !important;
        word-wrap: break-word !important;
        line-height: 1.2 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      
      .footer-branding {
        font-size: ${config.fontSize - 2}pt !important;
        opacity: 0.8 !important;
        font-weight: 300 !important;
        line-height: 1.1 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      
      /* ===== REGLAS DE IMPRESIÓN ===== */
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
        
        .catalog-page {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .fixed-header, .fixed-footer {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
      
      /* ===== DEBUG INFO (SOLO EN DESARROLLO) ===== */
      ${process.env.NODE_ENV === 'development' ? `
      .debug-info {
        position: fixed;
        top: 5mm;
        right: 5mm;
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 2mm;
        font-size: 8pt;
        border-radius: 3px;
        z-index: 1000;
      }
      ` : ''}
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS CON LAYOUT FIJO
   */
  private static generateFixedPages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    cardDimensions: any
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    let pagesHTML = '';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      // Agregar tarjetas vacías para completar el grid si es necesario
      const totalSlots = cardDimensions.columns * cardDimensions.rows;
      const emptySlots = Math.max(0, totalSlots - pageProducts.length);
      const allSlots = [...pageProducts];
      
      for (let i = 0; i < emptySlots; i++) {
        allSlots.push(null);
      }
      
      pagesHTML += `
        <div class="catalog-page">
          ${this.generateFixedHeader(businessInfo, template, pageIndex + 1, totalPages)}
          
          <div class="products-area">
            <div class="products-grid">
              ${allSlots.map(product => 
                product ? this.generateProductCard(product, template) : this.generateEmptyCard()
              ).join('')}
            </div>
          </div>
          
          ${pageIndex === totalPages - 1 ? this.generateFixedFooter(businessInfo, products.length) : ''}
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  /**
   * 📋 GENERAR HEADER FIJO ESTANDARIZADO
   */
  private static generateFixedHeader(
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    pageNum: number,
    totalPages: number
  ): string {
    return `
      <div class="fixed-header">
        <h1 class="header-business-name">${businessInfo.business_name}</h1>
        <p class="header-subtitle">Catálogo ${template.displayName} - Página ${pageNum} de ${totalPages}</p>
      </div>
    `;
  }
  
  /**
   * 🎴 GENERAR TARJETA DE PRODUCTO OPTIMIZADA PARA EL ESPACIO FIJO
   */
  private static generateProductCard(product: Product, template: TemplateConfig): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}"
         class="product-image" 
         loading="eager" 
         crossorigin="anonymous"
       />` :
      `<div class="product-image-placeholder">
         <div style="font-size: 14pt; margin-bottom: 1mm;">📷</div>
         <div>Sin imagen</div>
       </div>`;
    
    return `
      <div class="product-card">
        <div class="card-decoration"></div>
        
        <div class="product-image-container">
          ${imageHTML}
        </div>
        
        <div class="product-text-area">
          <h3 class="product-name">${productName}</h3>
          <div class="product-price">${productPrice.toLocaleString('es-MX', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * ⬜ GENERAR TARJETA VACÍA
   */
  private static generateEmptyCard(): string {
    return `<div class="product-card empty"></div>`;
  }
  
  /**
   * 📄 GENERAR FOOTER FIJO ESTANDARIZADO
   */
  private static generateFixedFooter(businessInfo: BusinessInfo, totalProducts: number): string {
    const contactInfo = [
      businessInfo.phone ? `📞 ${businessInfo.phone}` : '',
      businessInfo.email ? `📧 ${businessInfo.email}` : '',
      businessInfo.website ? `🌐 ${businessInfo.website}` : ''
    ].filter(Boolean).join(' | ');
    
    return `
      <div class="fixed-footer">
        ${contactInfo ? `<div class="footer-contact">${contactInfo}</div>` : ''}
        <div class="footer-branding">
          Catálogo generado con CatalogoIA - ${totalProducts} productos | ${new Date().toLocaleDateString('es-MX')}
        </div>
      </div>
    `;
  }
  
  // ===== MÉTODOS EXISTENTES SIMPLIFICADOS =====
  
  private static async checkServiceHealthWithRetry(maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${this.SERVICE_URL}/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Puppeteer Service healthy (attempt ${attempt}/${maxRetries})`);
          return true;
        }
        
      } catch (error) {
        console.warn(`⚠️ Health check attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    return false;
  }
  
  private static async generatePDFWithRetry(
    htmlContent: string,
    pdfOptions: any,
    businessInfo: BusinessInfo,
    onProgress?: (progress: number) => void,
    maxRetries: number = 2
  ): Promise<Blob> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (onProgress) onProgress(30 + (attempt - 1) * 10);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
        
        const response = await fetch(`${this.SERVICE_URL}/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: htmlContent,
            options: pdfOptions,
            filename: `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (onProgress) onProgress(70 + attempt * 10);
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('PDF vacío recibido del servicio');
        }
        
        console.log(`✅ PDF generado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
        return blob;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt}/${maxRetries} falló:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    
    throw new Error('Todos los intentos de generación fallaron');
  }
  
  private static async downloadPDF(blob: Blob, businessName: string): Promise<void> {
    try {
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `catalogo-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw new Error('Error descargando el PDF generado');
    }
  }
  
  private static getPDFOptions(options: PuppeteerServiceOptions): any {
    return {
      format: options.format || 'A4',
      margin: options.margin || {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      waitUntil: 'networkidle0',
      timeout: 30000,
      omitBackground: false,
      scale: 1.0,
      quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90
    };
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  private static getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#2c3e50' : '#ffffff';
  }
  
  /**
   * 🧪 TEST SERVICE
   */
  static async testService(): Promise<any> {
    try {
      const response = await fetch(`${this.SERVICE_URL}/test-pdf`, {
        method: 'GET',
        timeout: this.TIMEOUT
      } as RequestInit);
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      await this.downloadPDF(blob, 'test-puppeteer');
      
      return { 
        success: true,
        stats: { totalProducts: 0, totalPages: 1, generationTime: 0 }
      };
      
    } catch (error) {
      console.error('Test service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error en test de servicio' 
      };
    }
  }
}

// Función de conveniencia
export const generatePDFWithPuppeteer = async (
  products: Product[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  options?: PuppeteerServiceOptions
): Promise<any> => {
  return PuppeteerServiceClient.generatePDF(products, businessInfo, template, options);
};