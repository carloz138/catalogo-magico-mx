// src/lib/pdf/puppeteer-service-client.ts
// 🎯 SISTEMA OPTIMIZADO 3x3 GRID - 9 PRODUCTOS POR PÁGINA - ESCALABLE 1-1000+ PRODUCTOS

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

// 📐 CONFIGURACIÓN OPTIMIZADA PARA 3x3 GRID - MEJORES PRÁCTICAS DOCUMENTADAS
const OPTIMIZED_LAYOUT = {
  // Estándar comercial: 3x3 = 9 productos por página
  PRODUCTS_PER_PAGE: 9,
  COLUMNS: 3,
  ROWS: 3,
  
  // Dimensiones A4 optimizadas (mejores prácticas)
  PAGE: {
    WIDTH: 210,  // mm
    HEIGHT: 297, // mm
    MARGIN: 12   // mm estándar
  },
  
  // Sistema 8pt base unit (Material Design best practice)
  SPACING: {
    GRID_GAP: 4,      // mm - 8pt convertido
    CARD_PADDING: 3,  // mm - 6pt convertido
    BORDER_RADIUS: 6  // mm - consistente
  }
};

// Calcular área disponible para productos
const CONTENT_AREA = {
  WIDTH: OPTIMIZED_LAYOUT.PAGE.WIDTH - (OPTIMIZED_LAYOUT.PAGE.MARGIN * 2), // 186mm
  HEIGHT: 240, // mm - espacio disponible después de header/footer fijos
  USABLE_WIDTH: 186 - 8, // mm - considerando padding interno
  USABLE_HEIGHT: 240 - 8 // mm
};

// Calcular dimensiones exactas para tarjetas 3x3
const CARD_DIMENSIONS = {
  // Ancho: (área disponible - gaps) / columnas
  WIDTH: (CONTENT_AREA.USABLE_WIDTH - (OPTIMIZED_LAYOUT.SPACING.GRID_GAP * 2)) / OPTIMIZED_LAYOUT.COLUMNS, // ~56mm
  // Alto: (área disponible - gaps) / filas  
  HEIGHT: (CONTENT_AREA.USABLE_HEIGHT - (OPTIMIZED_LAYOUT.SPACING.GRID_GAP * 2)) / OPTIMIZED_LAYOUT.ROWS, // ~74mm
  // Distribución interna optimizada
  IMAGE_HEIGHT_RATIO: 0.65, // 65% para imagen
  TEXT_HEIGHT_RATIO: 0.35    // 35% para texto
};

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  /**
   * 🎯 MÉTODO PRINCIPAL OPTIMIZADO PARA 3x3 GRID
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Generando PDF con 3x3 grid optimizado...', {
        products: products.length,
        template: template.id,
        productsPerPage: OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE,
        totalPages: Math.ceil(products.length / OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE),
        cardSize: `${Math.round(CARD_DIMENSIONS.WIDTH)}x${Math.round(CARD_DIMENSIONS.HEIGHT)}mm`,
        basedOn: 'Commercial catalog best practices + Material Design 8pt system'
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. Health Check
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // 2. Generar HTML con 3x3 GRID OPTIMIZADO
      const htmlContent = this.generateOptimized3x3HTML(
        products, 
        businessInfo, 
        template, 
        options.quality || 'medium'
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Configurar PDF optimizado
      const pdfOptions = this.getOptimizedPDFOptions(options);
      
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
      const totalPages = Math.ceil(products.length / OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE);
      
      console.log('✅ PDF 3x3 grid optimizado generado exitosamente:', {
        time: generationTime,
        size: pdfBlob.size,
        totalPages,
        avgProductsPerPage: products.length / totalPages,
        optimizations: ['3x3-grid', '9-products-per-page', 'larger-cards', '8pt-spacing']
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
      console.error('❌ Error en PDF 3x3 grid optimizado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 🏗️ GENERAR HTML CON 3x3 GRID OPTIMIZADO
   */
  private static generateOptimized3x3HTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const pagesHTML = this.generate3x3Pages(products, businessInfo, template, quality);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, height=297mm, initial-scale=1.0">
  <title>Catálogo ${businessInfo.business_name}</title>
  <style>
    ${this.generateOptimized3x3CSS(template, quality)}
  </style>
</head>
<body>
  ${this.generateFixedHeader(businessInfo, template)}
  ${this.generateFixedFooter(businessInfo, products.length)}
  ${pagesHTML}
</body>
</html>`;
  }
  
  /**
   * 🎨 CSS OPTIMIZADO PARA 3x3 GRID - MATERIALES DESIGN + MEJORES PRÁCTICAS
   */
  private static generateOptimized3x3CSS(
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const qualityConfig = {
      low: { fontSize: 9, headerSize: 14, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, headerSize: 16, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, headerSize: 18, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    
    // Calcular dimensiones exactas
    const cardWidth = Math.round(CARD_DIMENSIONS.WIDTH * 100) / 100;
    const cardHeight = Math.round(CARD_DIMENSIONS.HEIGHT * 100) / 100;
    const imageHeight = Math.round(cardHeight * CARD_DIMENSIONS.IMAGE_HEIGHT_RATIO * 100) / 100;
    const textHeight = Math.round(cardHeight * CARD_DIMENSIONS.TEXT_HEIGHT_RATIO * 100) / 100;
    
    return `
      /* ===== 3x3 GRID OPTIMIZADO - COMERCIAL BEST PRACTICES ===== */
      
      /* Reset absoluto */
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* @page optimizado */
      @page {
        size: A4 portrait;
        margin: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm;
        marks: none;
        bleed: 0;
        orphans: 1;
        widows: 1;
        -webkit-print-color-adjust: exact;
      }
      
      /* HTML y Body con 8pt system */
      html {
        width: ${OPTIMIZED_LAYOUT.PAGE.WIDTH}mm !important;
        height: ${OPTIMIZED_LAYOUT.PAGE.HEIGHT}mm !important;
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      body {
        width: ${CONTENT_AREA.WIDTH}mm !important;
        height: auto !important;
        margin: 0 auto !important;
        padding: 0 !important;
        padding-top: 25mm !important; /* Header space */
        padding-bottom: 20mm !important; /* Footer space */
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        line-height: 1.2 !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== HEADER FIJO ===== */
      .fixed-header {
        position: fixed !important;
        top: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        left: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        right: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        width: ${CONTENT_AREA.WIDTH}mm !important;
        height: 20mm !important;
        background: ${template.colors.primary} !important;
        background-image: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
        color: white !important;
        z-index: 1000 !important;
        border-radius: ${OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS}px !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .header-cell {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: 100% !important;
        padding: 2mm !important;
      }
      
      .header-business-name {
        font-size: ${config.headerSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3pt !important;
        margin: 0 !important;
        line-height: 1.1 !important;
        word-wrap: break-word !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .header-subtitle {
        font-size: ${config.fontSize + 1}pt !important;
        font-weight: 300 !important;
        color: rgba(255,255,255,0.9) !important;
        margin-top: 1mm !important;
        line-height: 1 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== FOOTER FIJO ===== */
      .fixed-footer {
        position: fixed !important;
        bottom: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        left: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        right: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        width: ${CONTENT_AREA.WIDTH}mm !important;
        height: 15mm !important;
        background: ${template.colors.secondary} !important;
        color: ${this.getContrastColor(template.colors.secondary)} !important;
        z-index: 1000 !important;
        border-radius: ${OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS}px !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .footer-cell {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: 100% !important;
        padding: 2mm !important;
      }
      
      .footer-contact {
        font-size: ${config.fontSize - 1}pt !important;
        font-weight: 600 !important;
        margin-bottom: 1mm !important;
        line-height: 1.1 !important;
        word-wrap: break-word !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .footer-brand {
        font-size: ${config.fontSize - 2}pt !important;
        opacity: 0.8 !important;
        font-weight: 300 !important;
        line-height: 1 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== CONTENIDO PRINCIPAL ===== */
      .content-area {
        width: ${CONTENT_AREA.WIDTH}mm !important;
        margin: 0 auto !important;
        padding: ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm !important;
        position: relative !important;
        z-index: 1 !important;
        background: ${template.colors.background} !important;
        min-height: ${CONTENT_AREA.HEIGHT}mm !important;
        box-sizing: border-box !important;
      }
      
      /* ===== PÁGINA INDIVIDUAL ===== */
      .page-container {
        width: 100% !important;
        margin-bottom: 8mm !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        position: relative !important;
        background: ${template.colors.background} !important;
      }
      
      .page-container:last-child {
        page-break-after: avoid !important;
        margin-bottom: 0 !important;
      }
      
      /* ===== 3x3 GRID PERFECTO - TABLE LAYOUT PARA MÁXIMA COMPATIBILIDAD ===== */
      .products-grid-3x3 {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: ${OPTIMIZED_LAYOUT.SPACING.GRID_GAP}mm !important;
        table-layout: fixed !important;
        margin: 0 auto !important;
      }
      
      .grid-row {
        display: table-row !important;
        height: ${cardHeight}mm !important;
      }
      
      .grid-cell {
        display: table-cell !important;
        vertical-align: top !important;
        width: ${100 / OPTIMIZED_LAYOUT.COLUMNS}% !important;
        height: ${cardHeight}mm !important;
        padding: 0 !important;
        text-align: center !important;
      }
      
      /* ===== PRODUCT CARDS OPTIMIZADAS - MÁS GRANDES ===== */
      .product-card-optimized {
        width: 100% !important;
        height: ${cardHeight}mm !important;
        min-height: ${cardHeight}mm !important;
        max-height: ${cardHeight}mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: ${OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS}px !important;
        overflow: hidden !important;
        position: relative !important;
        page-break-inside: avoid !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.1) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      .card-decoration-optimized {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 2pt !important;
        background: ${template.colors.primary} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== IMAGEN CONTAINER OPTIMIZADA ===== */
      .image-container-optimized {
        width: 100% !important;
        height: ${imageHeight}mm !important;
        min-height: ${imageHeight}mm !important;
        max-height: ${imageHeight}mm !important;
        background: #f8f9fa !important;
        border-radius: ${Math.max(OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS - 2, 2)}px !important;
        border: 0.25pt solid #e9ecef !important;
        margin: ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm 2mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        flex-shrink: 0 !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .image-cell-optimized {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      .product-image-optimized {
        max-width: 92% !important;
        max-height: 92% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        margin: 0 auto !important;
        border-radius: 2px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .image-placeholder-optimized {
        width: 85% !important;
        height: 85% !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: 8px 8px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        margin: 0 auto !important;
        color: #999 !important;
        font-size: 8pt !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .placeholder-cell-optimized {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* ===== ÁREA DE TEXTO OPTIMIZADA ===== */
      .text-area-optimized {
        width: 100% !important;
        height: ${textHeight}mm !important;
        min-height: ${textHeight}mm !important;
        max-height: ${textHeight}mm !important;
        padding: 0 ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        align-items: center !important;
        text-align: center !important;
        overflow: hidden !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }
      
      .product-name-optimized {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        line-height: 1.1 !important;
        margin: 0 auto 1.5mm auto !important;
        text-align: center !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        flex-grow: 1 !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-price-optimized {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1.5mm 3mm !important;
        border-radius: 10px !important;
        display: inline-block !important;
        margin: 0 auto !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 1pt 2pt rgba(0,0,0,0.15) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      /* ===== CELDA VACÍA PARA COMPLETAR GRID ===== */
      .empty-cell {
        display: table-cell !important;
        width: ${100 / OPTIMIZED_LAYOUT.COLUMNS}% !important;
        height: ${cardHeight}mm !important;
        visibility: hidden !important;
      }
      
      /* ===== MEDIA PRINT OPTIMIZADO ===== */
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
        
        .fixed-header, .fixed-footer {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .page-container, .product-card-optimized {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .product-image-optimized {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          filter: none !important;
        }
      }
    `;
  }
  
  /**
   * 📋 GENERAR HEADER FIJO
   */
  private static generateFixedHeader(businessInfo: BusinessInfo, template: TemplateConfig): string {
    return `
      <div class="fixed-header">
        <div class="header-cell">
          <div class="header-business-name">${businessInfo.business_name}</div>
          <div class="header-subtitle">Catálogo ${template.displayName}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 📄 GENERAR FOOTER FIJO
   */
  private static generateFixedFooter(businessInfo: BusinessInfo, totalProducts: number): string {
    const contactInfo = [
      businessInfo.phone ? `📞 ${businessInfo.phone}` : '',
      businessInfo.email ? `📧 ${businessInfo.email}` : '',
      businessInfo.website ? `🌐 ${businessInfo.website}` : ''
    ].filter(Boolean).join(' | ');
    
    return `
      <div class="fixed-footer">
        <div class="footer-cell">
          ${contactInfo ? `<div class="footer-contact">${contactInfo}</div>` : ''}
          <div class="footer-brand">
            Catálogo generado con CatalogoIA - ${totalProducts} productos | ${new Date().toLocaleDateString('es-MX')}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS CON 3x3 GRID OPTIMIZADO
   */
  private static generate3x3Pages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: string
  ): string {
    
    const totalPages = Math.ceil(products.length / OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE);
    let pagesHTML = '<div class="content-area">';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE;
      const endIndex = Math.min(startIndex + OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      pagesHTML += `
        <div class="page-container">
          ${this.generate3x3Grid(pageProducts)}
        </div>
      `;
    }
    
    pagesHTML += '</div>';
    return pagesHTML;
  }
  
  /**
   * 🛍️ GENERAR 3x3 GRID CON TABLE LAYOUT - ESCALABLE 1-1000+ PRODUCTOS
   */
  private static generate3x3Grid(products: Product[]): string {
    let gridHTML = '<table class="products-grid-3x3">';
    
    // Crear exactamente 3 filas (3x3 = 9 slots)
    for (let row = 0; row < OPTIMIZED_LAYOUT.ROWS; row++) {
      gridHTML += '<tr class="grid-row">';
      
      // Crear 3 columnas por fila
      for (let col = 0; col < OPTIMIZED_LAYOUT.COLUMNS; col++) {
        const productIndex = (row * OPTIMIZED_LAYOUT.COLUMNS) + col;
        
        if (productIndex < products.length) {
          // Producto real
          const product = products[productIndex];
          gridHTML += `
            <td class="grid-cell">
              ${this.generateOptimizedProductCard(product)}
            </td>
          `;
        } else {
          // Celda vacía para completar el grid
          gridHTML += '<td class="empty-cell"></td>';
        }
      }
      
      gridHTML += '</tr>';
    }
    
    gridHTML += '</table>';
    return gridHTML;
  }
  
  /**
   * 🎴 GENERAR TARJETA OPTIMIZADA - MÁS GRANDE Y MEJOR DISEÑO
   */
  private static generateOptimizedProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<div class="image-cell-optimized">
         <img 
           src="${productImage}" 
           alt="${productName}"
           class="product-image-optimized" 
           loading="eager" 
           crossorigin="anonymous"
         />
       </div>` :
      `<div class="image-placeholder-optimized">
         <div class="placeholder-cell-optimized">
           <div style="font-size: 14pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    return `
      <div class="product-card-optimized">
        <div class="card-decoration-optimized"></div>
        
        <div class="image-container-optimized">
          ${imageHTML}
        </div>
        
        <div class="text-area-optimized">
          <div class="product-name-optimized">${productName}</div>
          <div class="product-price-optimized">$${productPrice.toLocaleString('es-MX', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * ⚙️ PDF OPTIONS OPTIMIZADO
   */
  private static getOptimizedPDFOptions(options: PuppeteerServiceOptions): any {
    return {
      format: options.format || 'A4',
      margin: {
        top: `${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm`,
        right: `${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm`,
        bottom: `${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm`,
        left: `${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm`
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false, // NO usar templates (bugs documentados)
      waitUntil: 'networkidle0',
      timeout: 30000,
      omitBackground: false,
      scale: 1.0,
      quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90
    };
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
        
        console.log(`✅ PDF 3x3 grid optimizado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
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
      await this.downloadPDF(blob, 'test-3x3-grid-optimized');
      
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