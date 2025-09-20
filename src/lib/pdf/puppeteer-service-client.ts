// src/lib/pdf/puppeteer-service-client.ts - CÓDIGO COMPLETO CORREGIDO
// 🎯 SOLUCIÓN DEFINITIVA - DISPLAYHEADERFOOTER CON TEMPLATES

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

// 📐 CONFIGURACIÓN OPTIMIZADA PARA 3x3 GRID - FIJA
const OPTIMIZED_LAYOUT = {
  PRODUCTS_PER_PAGE: 9,
  COLUMNS: 3,
  ROWS: 3,
  
  PAGE: {
    WIDTH: 210,
    HEIGHT: 297,
    MARGIN: 12
  },
  
  SPACING: {
    GRID_GAP: 4,
    CARD_PADDING: 2,
    BORDER_RADIUS: 4
  }
};

// Área de contenido calculada
const CONTENT_AREA = {
  WIDTH: OPTIMIZED_LAYOUT.PAGE.WIDTH - (OPTIMIZED_LAYOUT.PAGE.MARGIN * 2),
  HEIGHT: 240, // Altura disponible después de header/footer
  USABLE_WIDTH: 186 - 8,
  USABLE_HEIGHT: 240 - 8
};

// Dimensiones de tarjetas
const CARD_DIMENSIONS = {
  WIDTH: (CONTENT_AREA.USABLE_WIDTH - (OPTIMIZED_LAYOUT.SPACING.GRID_GAP * 2)) / OPTIMIZED_LAYOUT.COLUMNS,
  HEIGHT: 50, // Altura optimizada
  IMAGE_HEIGHT: 32,
  TEXT_HEIGHT: 16
};

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  /**
   * 🎯 MÉTODO PRINCIPAL CORREGIDO CON DISPLAYHEADERFOOTER
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Generando PDF con solución definitiva...', {
        products: products.length,
        template: template.id,
        method: 'displayHeaderFooter',
        totalPages: Math.ceil(products.length / OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE)
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. Health Check
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // 2. Generar HTML SIMPLIFICADO
      const htmlContent = this.generateCorrectedHTML(
        products, 
        businessInfo, 
        template, 
        options.quality || 'medium'
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Configurar PDF con DISPLAYHEADERFOOTER
      const pdfOptions = this.getOptimizedPDFOptions(options, businessInfo);
      
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
      
      console.log('✅ PDF corregido generado exitosamente:', {
        time: generationTime,
        size: pdfBlob.size,
        totalPages,
        method: 'displayHeaderFooter'
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
   * 🏗️ GENERAR HTML SIMPLIFICADO - SIN POSITION FIXED
   */
  private static generateCorrectedHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const pagesHTML = this.generateCorrected3x3Pages(products, businessInfo, template, quality);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, height=297mm, initial-scale=1.0">
  <title>Catálogo ${businessInfo.business_name}</title>
  <style>
    ${this.generateCorrectedCSS(template, quality)}
  </style>
</head>
<body>
  ${pagesHTML}
</body>
</html>`;
  }
  
  /**
   * 🎨 CSS SIMPLIFICADO - SIN POSITION FIXED
   */
  private static generateCorrectedCSS(
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
      /* ===== CSS SIMPLIFICADO - SOLUCIÓN DEFINITIVA ===== */
      
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      @page {
        size: A4 portrait;
        margin: 25mm 12mm 20mm 12mm; /* Espacio para header/footer nativo */
      }
      
      html {
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      body {
        width: 100% !important;
        margin: 0 !important;
        padding: 6mm !important;
        font-family: 'Arial', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== CONTENIDO PRINCIPAL ===== */
      .content-area {
        width: 100% !important;
        margin: 0 auto !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .page-container {
        width: 100% !important;
        margin-bottom: 8mm !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        background: ${template.colors.background} !important;
      }
      
      .page-container:last-child {
        page-break-after: avoid !important;
        margin-bottom: 0 !important;
      }
      
      /* ===== GRID 3x3 OPTIMIZADO ===== */
      .products-grid-3x3 {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 4mm !important;
        table-layout: fixed !important;
        margin: 0 auto !important;
      }
      
      .grid-row {
        display: table-row !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
      }
      
      .grid-cell {
        display: table-cell !important;
        vertical-align: top !important;
        width: 33.333% !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        padding: 0 !important;
        text-align: center !important;
      }
      
      /* ===== PRODUCT CARDS ===== */
      .product-card-optimized {
        width: 100% !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: ${OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS}px !important;
        overflow: hidden !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.1) !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
        position: relative !important;
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
      
      .image-container-optimized {
        display: table-row !important;
        width: 100% !important;
        height: ${CARD_DIMENSIONS.IMAGE_HEIGHT}mm !important;
      }
      
      .image-cell-optimized {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        background: #f8f9fa !important;
        border-radius: 2px !important;
        margin: 2mm !important;
      }
      
      .product-image-optimized {
        max-width: 95% !important;
        max-height: ${CARD_DIMENSIONS.IMAGE_HEIGHT - 2}mm !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        margin: 0 auto !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .image-placeholder-optimized {
        width: ${CARD_DIMENSIONS.IMAGE_HEIGHT - 4}mm !important;
        height: ${CARD_DIMENSIONS.IMAGE_HEIGHT - 4}mm !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: 8px 8px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        margin: 0 auto !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .placeholder-cell-optimized {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        color: #999 !important;
        font-size: 8pt !important;
      }
      
      .text-area-optimized {
        display: table-row !important;
        width: 100% !important;
        height: ${CARD_DIMENSIONS.TEXT_HEIGHT}mm !important;
        padding: 2mm !important;
      }
      
      .text-content-cell {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
      }
      
      .product-name-optimized {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin-bottom: 2mm !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 1 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-pricing-optimized {
        display: table !important;
        width: 100% !important;
        margin: 0 auto !important;
        text-align: center !important;
      }
      
      .product-price-retail-optimized {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1.5mm 3mm !important;
        border-radius: 8px !important;
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
      
      .product-price-wholesale-optimized {
        display: table !important;
        width: 90% !important;
        margin: 0 auto !important;
        font-size: ${Math.max(config.priceSize - 2, 6)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        padding: 1mm 2mm !important;
        border-radius: 4px !important;
        border: 0.25pt solid ${template.colors.accent}50 !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        table-layout: fixed !important;
      }
      
      .wholesale-label-optimized {
        font-size: ${Math.max(config.priceSize - 3, 5)}pt !important;
        font-weight: 500 !important;
        color: ${template.colors.text}80 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.2pt !important;
        display: block !important;
        margin-bottom: 0.5mm !important;
        line-height: 1 !important;
      }
      
      .wholesale-price-optimized {
        font-weight: 700 !important;
        color: ${template.colors.primary} !important;
        font-size: ${Math.max(config.priceSize - 1, 7)}pt !important;
        display: block !important;
        line-height: 1.1 !important;
        margin-bottom: 0.5mm !important;
      }
      
      .wholesale-min-optimized {
        font-size: ${Math.max(config.priceSize - 4, 5)}pt !important;
        color: ${template.colors.text}60 !important;
        font-weight: 400 !important;
        font-style: italic !important;
        display: block !important;
        line-height: 1 !important;
      }
      
      .empty-cell {
        display: table-cell !important;
        width: 33.333% !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        visibility: hidden !important;
      }
      
      /* ===== MEDIA PRINT ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .products-grid-3x3 {
          display: table !important;
        }
        
        .grid-row {
          display: table-row !important;
        }
        
        .grid-cell {
          display: table-cell !important;
        }
        
        .product-card-optimized {
          display: table !important;
        }
      }
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS 3x3
   */
  private static generateCorrected3x3Pages(
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
          ${this.generateCorrected3x3Grid(pageProducts)}
        </div>
      `;
    }
    
    pagesHTML += '</div>';
    return pagesHTML;
  }
  
  /**
   * 🛍️ GENERAR GRID 3x3
   */
  private static generateCorrected3x3Grid(products: Product[]): string {
    let gridHTML = '<table class="products-grid-3x3">';
    
    for (let row = 0; row < OPTIMIZED_LAYOUT.ROWS; row++) {
      gridHTML += '<tr class="grid-row">';
      
      for (let col = 0; col < OPTIMIZED_LAYOUT.COLUMNS; col++) {
        const productIndex = (row * OPTIMIZED_LAYOUT.COLUMNS) + col;
        
        if (productIndex < products.length) {
          const product = products[productIndex];
          gridHTML += `
            <td class="grid-cell">
              ${this.generateCorrectedProductCard(product)}
            </td>
          `;
        } else {
          gridHTML += '<td class="empty-cell"></td>';
        }
      }
      
      gridHTML += '</tr>';
    }
    
    gridHTML += '</table>';
    return gridHTML;
  }
  
  /**
   * 🎴 GENERAR TARJETA DE PRODUCTO
   */
  private static generateCorrectedProductCard(product: Product): string {
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
          <div class="text-content-cell">
            <div class="product-name-optimized">${productName}</div>
            <div class="product-pricing-optimized">
              <div class="product-price-retail-optimized">$${(productPrice / 100).toLocaleString('es-MX', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</div>
              ${product.price_wholesale ? `
                <div class="product-price-wholesale-optimized">
                  <span class="wholesale-label-optimized">Mayoreo:</span>
                  <span class="wholesale-price-optimized">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</span>
                  ${product.wholesale_min_qty ? `
                    <span class="wholesale-min-optimized">Min. ${product.wholesale_min_qty}</span>
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
   * ⚙️ PDF OPTIONS CON DISPLAYHEADERFOOTER
   */
  private static getOptimizedPDFOptions(options: PuppeteerServiceOptions, businessInfo: BusinessInfo): any {
    const contactInfo = [
      businessInfo.phone ? `📞 ${businessInfo.phone}` : '',
      businessInfo.email ? `📧 ${businessInfo.email}` : '',
      businessInfo.website ? `🌐 ${businessInfo.website}` : ''
    ].filter(Boolean).join(' | ');
    
    return {
      format: options.format || 'A4',
      margin: {
        top: '25mm',
        right: '12mm',
        bottom: '20mm',
        left: '12mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true, // ✅ SOLUCIÓN DEFINITIVA
      waitUntil: 'networkidle0',
      timeout: 30000,
      omitBackground: false,
      scale: 1.0,
      quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90,
      
      // ✅ HEADER TEMPLATE QUE FUNCIONA
      headerTemplate: `
        <div style="
          font-size: 12px !important; 
          width: 100% !important; 
          text-align: center !important;
          background: #52c41a !important;
          background-image: linear-gradient(135deg, #52c41a, #389e0d) !important;
          color: white !important;
          padding: 4mm !important;
          margin: 0 !important;
          border-radius: 4px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        ">
          <strong style="color: white !important; font-size: 14px !important;">${businessInfo.business_name || 'DM DISFRACES'}</strong><br>
          <span style="color: rgba(255,255,255,0.9) !important; font-size: 10px !important;">Catálogo de Productos</span>
        </div>
      `,
      
      // ✅ FOOTER TEMPLATE QUE FUNCIONA
      footerTemplate: `
        <div style="
          font-size: 9px !important; 
          width: 100% !important; 
          text-align: center !important;
          background: #389e0d !important;
          color: white !important;
          padding: 3mm !important;
          margin: 0 !important;
          border-radius: 4px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        ">
          ${contactInfo ? `<div style="color: white !important;">${contactInfo}</div>` : ''}
          <div style="color: rgba(255,255,255,0.8) !important; font-size: 7px !important; margin-top: 1mm;">
            Catálogo generado con CatalogoIA - <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        </div>
      `
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
      await this.downloadPDF(blob, 'test-corregido');
      
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