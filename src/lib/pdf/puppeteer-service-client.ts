// src/lib/pdf/puppeteer-service-client.ts
// 🎯 SOLUCIÓN HEADER/FOOTER FIJA BASADA EN GITHUB ISSUES #4132, #10024, #3672

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

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  /**
   * 🎯 MÉTODO PRINCIPAL CON HEADER/FOOTER FIXED POSITION
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Generando PDF con header/footer fixed position...', {
        products: products.length,
        template: template.id,
        basedOn: 'GitHub Issues #4132, #10024, #3672 - Stack Overflow solutions'
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. Health Check
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // 2. Generar HTML con HEADER/FOOTER FIJOS USANDO POSITION FIXED
      const htmlContent = this.generateHTMLWithFixedHeaderFooter(
        products, 
        businessInfo, 
        template, 
        options.quality || 'medium'
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Configurar PDF SIN displayHeaderFooter (Issue #10024 fix)
      const pdfOptions = this.getPDFOptionsWithoutTemplates(options);
      
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
      
      console.log('✅ PDF con header/footer fijos generado exitosamente:', {
        time: generationTime,
        size: pdfBlob.size,
        solutions: ['position-fixed', 'no-displayHeaderFooter', 'css-inline']
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
      console.error('❌ Error en PDF con header/footer fijos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 🏗️ GENERAR HTML CON HEADER/FOOTER USANDO POSITION FIXED - ISSUE #4132 SOLUTION
   */
  private static generateHTMLWithFixedHeaderFooter(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const pagesHTML = this.generatePagesWithFixedElements(products, businessInfo, template, quality);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, height=297mm, initial-scale=1.0">
  <title>Catálogo ${businessInfo.business_name}</title>
  <style>
    ${this.generateCSSWithFixedPositions(template, quality)}
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
   * 🎨 CSS CON POSITION FIXED - SOLUCIÓN ISSUES #3672, #1853
   */
  private static generateCSSWithFixedPositions(
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const qualityConfig = {
      low: { fontSize: 9, headerSize: 14, priceSize: 10 },
      medium: { fontSize: 10, headerSize: 16, priceSize: 11 },
      high: { fontSize: 11, headerSize: 18, priceSize: 12 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* ===== SOLUCIÓN HEADER/FOOTER FIJOS - GITHUB ISSUES #4132, #10024, #3672 ===== */
      
      /* Reset absoluto - Issue #3672 fix */
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* @page SIN headers/footers - Issue #10024 solution */
      @page {
        size: A4 portrait;
        margin: 12mm; /* Margins simples y simétricos */
        marks: none;
        bleed: 0;
        orphans: 1;
        widows: 1;
        -webkit-print-color-adjust: exact;
      }
      
      /* HTML y Body - Issue #1853 solution */
      html {
        width: 210mm !important;
        height: 297mm !important;
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      body {
        width: 186mm !important; /* 210mm - 24mm margins */
        height: auto !important;
        margin: 0 auto !important;
        padding: 0 !important;
        padding-top: 25mm !important; /* Espacio para header fijo */
        padding-bottom: 20mm !important; /* Espacio para footer fijo */
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        line-height: 1.2 !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== HEADER FIJO - POSITION FIXED TOP - ISSUE #4132 SOLUTION ===== */
      .fixed-header {
        position: fixed !important;
        top: 12mm !important; /* Alineado con margin de @page */
        left: 12mm !important;
        right: 12mm !important;
        width: 186mm !important;
        height: 20mm !important;
        background: ${template.colors.primary} !important;
        background-image: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
        color: white !important;
        z-index: 1000 !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        /* TABLE para centrado perfecto */
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
      
      /* ===== FOOTER FIJO - POSITION FIXED BOTTOM - ISSUE #4132 SOLUTION ===== */
      .fixed-footer {
        position: fixed !important;
        bottom: 12mm !important; /* Alineado con margin de @page */
        left: 12mm !important;
        right: 12mm !important;
        width: 186mm !important;
        height: 15mm !important;
        background: ${template.colors.secondary} !important;
        color: ${this.getContrastColor(template.colors.secondary)} !important;
        z-index: 1000 !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        /* TABLE para centrado perfecto */
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
      
      /* ===== CONTENIDO PRINCIPAL - SIN CONFLICTS CON HEADER/FOOTER ===== */
      .content-area {
        width: 186mm !important;
        margin: 0 auto !important;
        padding: 2mm !important;
        position: relative !important;
        z-index: 1 !important;
        background: ${template.colors.background} !important;
        min-height: 200mm !important; /* Altura mínima para contenido */
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
      
      /* ===== PRODUCTOS CON TABLE LAYOUT - ISSUE #5236 FIX ===== */
      .products-table {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 3mm !important;
        table-layout: fixed !important;
        margin: 0 auto !important;
      }
      
      .products-row {
        display: table-row !important;
      }
      
      .product-cell {
        display: table-cell !important;
        vertical-align: top !important;
        width: 25% !important; /* 4 columnas fijas */
        padding: 0 !important;
        text-align: center !important;
      }
      
      /* ===== PRODUCT CARDS ===== */
      .product-card {
        width: 100% !important;
        height: 55mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        position: relative !important;
        page-break-inside: avoid !important;
        box-shadow: 0 0.5pt 2pt rgba(0,0,0,0.1) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .card-inner {
        display: table-cell !important;
        vertical-align: top !important;
        width: 100% !important;
        height: 100% !important;
        padding: 2mm !important;
        text-align: center !important;
      }
      
      .card-decoration {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 1.5pt !important;
        background: ${template.colors.primary} !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== IMAGEN CONTAINER ===== */
      .image-container {
        width: 100% !important;
        height: 30mm !important;
        background: #f8f9fa !important;
        border-radius: 4px !important;
        border: 0.25pt solid #e9ecef !important;
        margin: 0 auto 2mm auto !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .image-cell {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      .product-image {
        max-width: 90% !important;
        max-height: 90% !important;
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
      
      .image-placeholder {
        width: 80% !important;
        height: 80% !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: 6px 6px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        margin: 0 auto !important;
        color: #999 !important;
        font-size: 7pt !important;
        -webkit-print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
      }
      
      .placeholder-cell {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* ===== TEXTOS DEL PRODUCTO ===== */
      .product-name {
        font-size: ${config.fontSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        line-height: 1.1 !important;
        margin: 0 auto 1mm auto !important;
        text-align: center !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        max-height: ${config.fontSize * 2.2}pt !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .product-price {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1mm 2.5mm !important;
        border-radius: 8px !important;
        display: inline-block !important;
        margin: 2mm auto 0 auto !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 90% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 0.5pt 1.5pt rgba(0,0,0,0.15) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== CELDA VACÍA ===== */
      .empty-cell {
        display: table-cell !important;
        width: 25% !important;
        visibility: hidden !important;
      }
      
      /* ===== MEDIA PRINT - STACK OVERFLOW BEST PRACTICES ===== */
      @media print {
        /* Forzar colores - Issue #2182 fix */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          background: white !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        /* Mantener posiciones fijas en print */
        .fixed-header, .fixed-footer {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Evitar breaks en elementos críticos */
        .page-container, .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Forzar imágenes */
        .product-image {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          filter: none !important;
        }
      }
    `;
  }
  
  /**
   * 📋 GENERAR HEADER FIJO - POSICIÓN FIXED TOP
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
   * 📄 GENERAR FOOTER FIJO - POSICIÓN FIXED BOTTOM
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
   * 📄 GENERAR PÁGINAS CON CONTENIDO SEPARADO DE HEADER/FOOTER
   */
  private static generatePagesWithFixedElements(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: string
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    const columns = 4; // Fijo para consistencia
    let pagesHTML = '<div class="content-area">';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      pagesHTML += `
        <div class="page-container">
          ${this.generateProductsTableLayout(pageProducts, template, columns)}
        </div>
      `;
    }
    
    pagesHTML += '</div>';
    return pagesHTML;
  }
  
  /**
   * 🛍️ GENERAR TABLA DE PRODUCTOS - TABLE LAYOUT
   */
  private static generateProductsTableLayout(
    products: Product[],
    template: TemplateConfig,
    columns: number
  ): string {
    
    let tableHTML = '<table class="products-table">';
    
    // Crear filas
    for (let i = 0; i < products.length; i += columns) {
      tableHTML += '<tr class="products-row">';
      
      // Agregar productos de la fila
      for (let j = 0; j < columns; j++) {
        const productIndex = i + j;
        
        if (productIndex < products.length) {
          const product = products[productIndex];
          tableHTML += `
            <td class="product-cell">
              ${this.generateProductCard(product)}
            </td>
          `;
        } else {
          // Celda vacía para completar la fila
          tableHTML += '<td class="empty-cell"></td>';
        }
      }
      
      tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    return tableHTML;
  }
  
  /**
   * 🎴 GENERAR TARJETA DE PRODUCTO
   */
  private static generateProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<div class="image-cell">
         <img 
           src="${productImage}" 
           alt="${productName}"
           class="product-image" 
           loading="eager" 
           crossorigin="anonymous"
         />
       </div>` :
      `<div class="image-placeholder">
         <div class="placeholder-cell">
           <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    return `
      <div class="product-card">
        <div class="card-decoration"></div>
        <div class="card-inner">
          <div class="image-container">
            ${imageHTML}
          </div>
          <div class="product-name">${productName}</div>
          <div class="product-price">$${productPrice.toLocaleString('es-MX', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * ⚙️ PDF OPTIONS SIN displayHeaderFooter - ISSUE #10024 FIX
   */
  private static getPDFOptionsWithoutTemplates(options: PuppeteerServiceOptions): any {
    return {
      format: options.format || 'A4',
      // Margins simples - Issue #3672 solution
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      },
      printBackground: true,           // CRÍTICO - Issue #2182
      preferCSSPageSize: true,         // Issue #2278 fix
      displayHeaderFooter: false,      // NO usar - Issue #10024 fix
      waitUntil: 'networkidle0',       // Esperar carga completa
      timeout: 30000,
      omitBackground: false,           // Mantener backgrounds
      scale: 1.0,                      // Sin scale para evitar rounding issues
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
        
        console.log(`✅ PDF con header/footer fijos generado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
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
      await this.downloadPDF(blob, 'test-header-footer-fixed');
      
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