// src/lib/pdf/puppeteer-service-client.ts - SOLUCIÓN COMPLETA ESPACIADO
// 🎯 CÁLCULO MATEMÁTICO EXACTO DEL ESPACIO DISPONIBLE

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
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
  social_media?: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
  };
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
  catalogTitle?: string;
}

interface PuppeteerResult {
  success: boolean;
  error?: string;
  downloadUrl?: string;
  stats?: {
    totalProducts: number;
    totalPages: number;
    generationTime: number;
  };
}

// 📐 CÁLCULO MATEMÁTICO EXACTO - BASADO EN RESEARCH
const PDF_LAYOUT = {
  // Dimensiones A4 en mm
  PAGE_WIDTH: 210,
  PAGE_HEIGHT: 297,
  
  // Márgenes para header/footer (EXACTOS)
  HEADER_MARGIN: 20, // mm
  FOOTER_MARGIN: 15, // mm
  SIDE_MARGIN: 12,   // mm
  
  // Alturas estimadas de header/footer nativos
  HEADER_HEIGHT: 12, // mm
  FOOTER_HEIGHT: 8,  // mm
  
  // Grid configuration
  COLUMNS: 3,
  ROWS: 3,
  PRODUCTS_PER_PAGE: 9
};

// 📊 CÁLCULOS DINÁMICOS BASADOS EN ESPACIO REAL
const calculateAvailableSpace = () => {
  const contentWidth = PDF_LAYOUT.PAGE_WIDTH - (PDF_LAYOUT.SIDE_MARGIN * 2);
  
  // ALTURA DISPONIBLE = Página total - márgenes - headers/footers
  const contentHeight = PDF_LAYOUT.PAGE_HEIGHT 
    - PDF_LAYOUT.HEADER_MARGIN 
    - PDF_LAYOUT.FOOTER_MARGIN 
    - PDF_LAYOUT.HEADER_HEIGHT 
    - PDF_LAYOUT.FOOTER_HEIGHT;
  
  const gap = 4; // mm entre tarjetas
  const padding = 6; // mm padding interno de página
  
  const usableWidth = contentWidth - (padding * 2);
  const usableHeight = contentHeight - (padding * 2);
  
  // Calcular dimensiones de tarjetas dinámicamente
  const cardWidth = (usableWidth - (gap * (PDF_LAYOUT.COLUMNS - 1))) / PDF_LAYOUT.COLUMNS;
  const cardHeight = (usableHeight - (gap * (PDF_LAYOUT.ROWS - 1))) / PDF_LAYOUT.ROWS;
  
  return {
    contentWidth,
    contentHeight,
    usableWidth,
    usableHeight,
    cardWidth: Math.floor(cardWidth * 100) / 100,
    cardHeight: Math.floor(cardHeight * 100) / 100,
    gap,
    padding,
    imageHeight: Math.floor(cardHeight * 0.65 * 100) / 100,
    textHeight: Math.floor(cardHeight * 0.35 * 100) / 100
  };
};

// Usar cálculos dinámicos
const LAYOUT = calculateAvailableSpace();

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  /**
   * 🎯 MÉTODO PRINCIPAL CON CÁLCULO EXACTO
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    console.log('🔍 DEBUG - PuppeteerServiceClient businessInfo recibido:', businessInfo);
    
    try {
      console.log('🚀 Generando PDF con cálculo exacto del espacio...', {
        products: products.length,
        template: template.id,
        availableSpace: LAYOUT,
        totalPages: Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE)
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. Health Check
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // 2. Generar HTML con cálculos exactos
      const htmlContent = this.generateOptimizedHTML(
        products, 
        businessInfo, 
        template, 
        options.quality || 'medium',
        options
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Configurar PDF con márgenes exactos
      const pdfOptions = this.getExactPDFOptions(options, businessInfo, template);
      
      // 4. Generar con retry
      const pdfBlob = await this.generatePDFWithRetry(
        htmlContent, 
        pdfOptions, 
        businessInfo, 
        options.onProgress
      );
      
      if (options.onProgress) options.onProgress(90);
      
      // 5. Descargar
      await this.downloadPDF(pdfBlob, businessInfo.business_name);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      const totalPages = Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE);
      
      console.log('✅ PDF con espaciado correcto generado:', {
        time: generationTime,
        size: pdfBlob.size,
        totalPages,
        cardDimensions: `${LAYOUT.cardWidth}x${LAYOUT.cardHeight}mm`
      });
      
      return {
        success: true,
        stats: {
          totalProducts: products.length,
          totalPages,
          generationTime
        }
      };
      
    } catch (error) {
      console.error('❌ Error en PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 🏗️ GENERAR HTML OPTIMIZADO CON CÁLCULOS EXACTOS
   */
  private static generateOptimizedHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    options: PuppeteerServiceOptions = {}
  ): string {
    
    const pagesHTML = this.generatePrecisePages(products, businessInfo, template, quality);
    const pageTitle = options.catalogTitle || `Catálogo ${businessInfo.business_name}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${PDF_LAYOUT.PAGE_WIDTH}mm, height=${PDF_LAYOUT.PAGE_HEIGHT}mm, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    ${this.generatePreciseCSS(template, quality)}
  </style>
</head>
<body>
  <div class="page-content">
    ${pagesHTML}
  </div>
</body>
</html>`;
  }
  
  /**
   * 🎨 CSS CON CÁLCULOS MATEMÁTICOS EXACTOS
   */
  private static generatePreciseCSS(
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const qualityConfig = {
      low: { fontSize: 9, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* ===== CÁLCULOS MATEMÁTICOS EXACTOS - SOLUCIÓN TOTAL ===== */
      
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== @PAGE CON MÁRGENES EXACTOS ===== */
      @page {
        size: A4 portrait;
        margin: ${PDF_LAYOUT.HEADER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm ${PDF_LAYOUT.FOOTER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm;
      }
      
      html {
        width: ${PDF_LAYOUT.PAGE_WIDTH}mm !important;
        height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      body {
        width: ${LAYOUT.contentWidth}mm !important;
        height: ${LAYOUT.contentHeight}mm !important;
        margin: 0 auto !important;
        padding: ${LAYOUT.padding}mm !important;
        font-family: 'Arial', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
        position: relative !important;
      }
      
      /* ===== CONTENIDO PRINCIPAL ===== */
      .page-content {
        width: 100% !important;
        height: 100% !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .page-container {
        width: ${LAYOUT.usableWidth}mm !important;
        height: ${LAYOUT.usableHeight}mm !important;
        margin: 0 auto !important;
        margin-bottom: 8mm !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        background: ${template.colors.background} !important;
        position: relative !important;
      }
      
      .page-container:last-child {
        page-break-after: avoid !important;
        margin-bottom: 0 !important;
      }
      
      /* ===== GRID 3x3 CON DIMENSIONES EXACTAS ===== */
      .products-grid-exact {
        width: 100% !important;
        height: 100% !important;
        border-collapse: separate !important;
        border-spacing: ${LAYOUT.gap}mm !important;
        table-layout: fixed !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .grid-row-exact {
        display: table-row !important;
        height: ${LAYOUT.cardHeight}mm !important;
      }
      
      .grid-cell-exact {
        display: table-cell !important;
        vertical-align: top !important;
        width: ${100 / PDF_LAYOUT.COLUMNS}% !important;
        height: ${LAYOUT.cardHeight}mm !important;
        padding: 0 !important;
        text-align: center !important;
        page-break-inside: avoid !important;
      }
      
      /* ===== PRODUCT CARDS CON DIMENSIONES CALCULADAS ===== */
      .product-card-exact {
        width: 100% !important;
        height: ${LAYOUT.cardHeight}mm !important;
        min-height: ${LAYOUT.cardHeight}mm !important;
        max-height: ${LAYOUT.cardHeight}mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: 4px !important;
        overflow: hidden !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.1) !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
        position: relative !important;
        page-break-inside: avoid !important;
      }
      
      .card-decoration-exact {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 2pt !important;
        background: ${template.colors.primary} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== IMAGEN CON ALTURA CALCULADA ===== */
      .image-container-exact {
        display: table-row !important;
        width: 100% !important;
        height: ${LAYOUT.imageHeight}mm !important;
      }
      
      .image-cell-exact {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        background: #f8f9fa !important;
        border-radius: 2px !important;
        margin: 2mm !important;
        height: ${LAYOUT.imageHeight}mm !important;
      }
      
      .product-image-exact {
        max-width: 95% !important;
        max-height: ${LAYOUT.imageHeight - 4}mm !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        margin: 0 auto !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .image-placeholder-exact {
        width: ${LAYOUT.imageHeight - 6}mm !important;
        height: ${LAYOUT.imageHeight - 6}mm !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: 6px 6px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        margin: 0 auto !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .placeholder-cell-exact {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        color: #999 !important;
        font-size: 8pt !important;
      }
      
      /* ===== TEXTO CON ALTURA CALCULADA ===== */
      .text-area-exact {
        display: table-row !important;
        width: 100% !important;
        height: ${LAYOUT.textHeight}mm !important;
        padding: 2mm !important;
      }
      
      .text-content-cell-exact {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        height: ${LAYOUT.textHeight}mm !important;
      }
      
      .product-name-exact {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin-bottom: 1mm !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 1 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        -webkit-print-color-adjust: exact !important;
        height: 3.5mm !important;
      }
      
      .product-pricing-exact {
        display: table !important;
        width: 100% !important;
        margin: 0 auto !important;
        text-align: center !important;
      }
      
      .product-price-retail-exact {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1mm 2mm !important;
        border-radius: 6px !important;
        display: inline-block !important;
        margin-bottom: 1mm !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 1pt 2pt rgba(0,0,0,0.15) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-price-wholesale-exact {
        display: table !important;
        width: 85% !important;
        margin: 0 auto !important;
        font-size: ${Math.max(config.priceSize - 2, 6)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        padding: 0.5mm 1mm !important;
        border-radius: 3px !important;
        border: 0.25pt solid ${template.colors.accent}50 !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        table-layout: fixed !important;
      }
      
      .wholesale-label-exact {
        font-size: ${Math.max(config.priceSize - 3, 5)}pt !important;
        font-weight: 500 !important;
        color: ${template.colors.text}80 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1pt !important;
        display: block !important;
        margin-bottom: 0.2mm !important;
        line-height: 1 !important;
      }
      
      .wholesale-price-exact {
        font-weight: 700 !important;
        color: ${template.colors.primary} !important;
        font-size: ${Math.max(config.priceSize - 1, 7)}pt !important;
        display: block !important;
        line-height: 1 !important;
        margin-bottom: 0.2mm !important;
      }
      
      .wholesale-min-exact {
        font-size: ${Math.max(config.priceSize - 4, 5)}pt !important;
        color: ${template.colors.text}60 !important;
        font-weight: 400 !important;
        font-style: italic !important;
        display: block !important;
        line-height: 1 !important;
      }
      
      .empty-cell-exact {
        display: table-cell !important;
        width: ${100 / PDF_LAYOUT.COLUMNS}% !important;
        height: ${LAYOUT.cardHeight}mm !important;
        visibility: hidden !important;
      }
      
      /* ===== MEDIA PRINT OPTIMIZADO ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .products-grid-exact {
          display: table !important;
        }
        
        .grid-row-exact {
          display: table-row !important;
        }
        
        .grid-cell-exact {
          display: table-cell !important;
        }
        
        .product-card-exact {
          display: table !important;
        }
      }
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS CON CÁLCULOS EXACTOS
   */
  private static generatePrecisePages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: string
  ): string {
    
    const totalPages = Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE);
    let pagesHTML = '';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * PDF_LAYOUT.PRODUCTS_PER_PAGE;
      const endIndex = Math.min(startIndex + PDF_LAYOUT.PRODUCTS_PER_PAGE, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      pagesHTML += `
        <div class="page-container">
          ${this.generateExactGrid(pageProducts)}
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  /**
   * 🛍️ GENERAR GRID CON DIMENSIONES EXACTAS
   */
  private static generateExactGrid(products: Product[]): string {
    let gridHTML = '<table class="products-grid-exact">';
    
    for (let row = 0; row < PDF_LAYOUT.ROWS; row++) {
      gridHTML += '<tr class="grid-row-exact">';
      
      for (let col = 0; col < PDF_LAYOUT.COLUMNS; col++) {
        const productIndex = (row * PDF_LAYOUT.COLUMNS) + col;
        
        if (productIndex < products.length) {
          const product = products[productIndex];
          gridHTML += `
            <td class="grid-cell-exact">
              ${this.generateExactProductCard(product)}
            </td>
          `;
        } else {
          gridHTML += '<td class="empty-cell-exact"></td>';
        }
      }
      
      gridHTML += '</tr>';
    }
    
    gridHTML += '</table>';
    return gridHTML;
  }
  
  /**
   * 🎴 GENERAR TARJETA CON DIMENSIONES EXACTAS
   */
  private static generateExactProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<div class="image-cell-exact">
         <img 
           src="${productImage}" 
           alt="${productName}"
           class="product-image-exact" 
           loading="eager" 
           crossorigin="anonymous"
         />
       </div>` :
      `<div class="image-placeholder-exact">
         <div class="placeholder-cell-exact">
           <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    return `
      <div class="product-card-exact">
        <div class="card-decoration-exact"></div>
        
        <div class="image-container-exact">
          ${imageHTML}
        </div>
        
        <div class="text-area-exact">
          <div class="text-content-cell-exact">
            <div class="product-name-exact">${productName}</div>
            <div class="product-pricing-exact">
              <div class="product-price-retail-exact">$${(productPrice / 100).toLocaleString('es-MX', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</div>
              ${product.price_wholesale ? `
                <div class="product-price-wholesale-exact">
                  <span class="wholesale-label-exact">Mayoreo:</span>
                  <span class="wholesale-price-exact">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</span>
                  ${product.wholesale_min_qty ? `
                    <span class="wholesale-min-exact">Min. ${product.wholesale_min_qty}</span>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
  /**
 * ⚙️ PDF OPTIONS CON HEADER/FOOTER DINÁMICOS SEGÚN TEMPLATE
 */
  private static getExactPDFOptions(options: PuppeteerServiceOptions, businessInfo: BusinessInfo, template?: any): any {
  // 🎨 USAR COLORES DEL TEMPLATE (dinámico)
  // 🎨 USAR COLORES DEL TEMPLATE (dinámico)
    const primaryColor = template?.colors?.primary || '#007BFF';
    const secondaryColor = template?.colors?.secondary || '#0056B3';
  
  // 📧 CONTACT INFO INTELIGENTE - Solo información clave
  const contactInfo = this.generateSmartContactInfo(businessInfo);
  
  // 📝 TÍTULO DEL CATÁLOGO - Usar nombre personalizado o default
  const catalogTitle = options.catalogTitle || 'Catálogo de Productos';
  
  return {
    format: options.format || 'A4',
    margin: {
      top: `${PDF_LAYOUT.HEADER_MARGIN}mm`,
      right: `${PDF_LAYOUT.SIDE_MARGIN}mm`,
      bottom: `${PDF_LAYOUT.FOOTER_MARGIN}mm`,
      left: `${PDF_LAYOUT.SIDE_MARGIN}mm`
    },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    waitUntil: 'networkidle0',
    timeout: 30000,
    omitBackground: false,
    scale: 1.0,
    quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90,
    
    // ✅ HEADER DINÁMICO CON COLORES DEL TEMPLATE
    headerTemplate: `
      <div style="
        font-size: 12px !important; 
        width: 100% !important; 
        height: ${PDF_LAYOUT.HEADER_HEIGHT}mm !important;
        text-align: center !important;
        background: ${primaryColor} !important;
        background-image: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
        color: white !important;
        padding: 2mm !important;
        margin: 0 !important;
        border-radius: 4px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      ">
        <div style="display: table-cell; vertical-align: middle; text-align: center;">
          <strong style="color: white !important; font-size: 14px !important;">${businessInfo.business_name || 'Mi Negocio'}</strong><br>
          <span style="color: rgba(255,255,255,0.9) !important; font-size: 10px !important;">${catalogTitle}</span>
        </div>
      </div>
    `,
    
    // ✅ FOOTER DINÁMICO CON CONTACT INFO INTELIGENTE
    footerTemplate: `
      <div style="
        font-size: 9px !important; 
        width: 100% !important; 
        height: ${PDF_LAYOUT.FOOTER_HEIGHT}mm !important;
        text-align: center !important;
        background: ${secondaryColor} !important;
        color: white !important;
        padding: 1mm !important;
        margin: 0 !important;
        border-radius: 4px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      ">
        <div style="display: table-cell; vertical-align: middle; text-align: center;">
          ${contactInfo ? `<div style="color: white !important; font-size: 8px !important; margin-bottom: 1mm !important;">${contactInfo}</div>` : ''}
          <div style="color: rgba(255,255,255,0.8) !important; font-size: 7px !important;">
            Generado con CatifyPro - <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        </div>
      </div>
    `
  };
}


  /**
 * 📧 GENERAR CONTACT INFO INTELIGENTE - Solo información clave
 */
private static generateSmartContactInfo(businessInfo: BusinessInfo): string {
  const contactItems: string[] = [];
  
  // Prioridad 1: WhatsApp (más directo para negocios)
  if (businessInfo.social_media?.whatsapp) {
    contactItems.push(`📱 ${businessInfo.social_media.whatsapp}`);
  }
  
  // Prioridad 2: Teléfono (si no hay WhatsApp)
  else if (businessInfo.phone) {
    contactItems.push(`📞 ${businessInfo.phone}`);
  }
  
  // Prioridad 3: Email (solo si es corto)
  if (businessInfo.email && businessInfo.email.length <= 25) {
    contactItems.push(`📧 ${businessInfo.email}`);
  }
  
  // Máximo 2 items para no saturar el footer
  return contactItems.slice(0, 2).join(' | ');
}
  
  // ===== MÉTODOS HEREDADOS (SIN CAMBIOS) =====
  
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
  static async testService(): Promise<PuppeteerResult> {
    try {
      const response = await fetch(`${this.SERVICE_URL}/test-pdf`, {
        method: 'GET',
        timeout: this.TIMEOUT
      } as RequestInit);
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      await this.downloadPDF(blob, 'test-exact-spacing');
      
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
): Promise<PuppeteerResult> => {
  return PuppeteerServiceClient.generatePDF(products, businessInfo, template, options);
};