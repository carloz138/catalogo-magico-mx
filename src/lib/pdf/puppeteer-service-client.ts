// src/lib/pdf/puppeteer-service-client.ts
// 🚀 CLIENTE PUPPETEER ROBUSTO - VERSION COMPLETA CORREGIDA

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
  private static readonly TIMEOUT = 30000; // 30 seconds
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL MEJORADA - GENERAR PDF SIN CORTES
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando generación con Puppeteer Service...', {
        products: products.length,
        template: template.id,
        quality: options.quality || 'medium'
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. Health Check con retry
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible después de varios intentos');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // 2. Generar HTML optimizado usando nuevo sistema
      const htmlContent = this.generateRobustHTML(products, businessInfo, template, options.quality);
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Preparar configuración de PDF optimizada
      const pdfOptions = this.getPDFOptions(options);
      
      // 4. Enviar solicitud con timeout y retry
      const pdfBlob = await this.generatePDFWithRetry(htmlContent, pdfOptions, businessInfo, options.onProgress);
      
      if (options.onProgress) options.onProgress(90);
      
      // 5. Descargar PDF
      await this.downloadPDF(pdfBlob, businessInfo.business_name);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      
      console.log('✅ PDF generado exitosamente con Puppeteer:', {
        time: generationTime,
        size: pdfBlob.size,
        products: products.length
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
      console.error('❌ Error en Puppeteer Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en Puppeteer'
      };
    }
  }
  
  /**
   * 🏥 VERIFICAR SALUD CON RETRY
   */
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
  
  /**
   * 🎨 GENERAR HTML ROBUSTO CON NUEVO SISTEMA CORREGIDO
   */
  private static generateRobustHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    const columns = this.calculateColumns(productsPerPage);
    
    const baseStyles = this.generatePuppeteerOptimizedCSS(template, columns, quality);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=210mm, height=297mm, initial-scale=1.0">
        <title>Catálogo ${businessInfo.business_name}</title>
        <style>
          ${baseStyles}
        </style>
      </head>
      <body>
        <div class="catalog-wrapper">
          ${this.generateCatalogPages(products, businessInfo, template, columns)}
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 🎨 CSS OPTIMIZADO ESPECÍFICO PARA PUPPETEER - VERSIÓN CORREGIDA COMPLETA
   */
  private static generatePuppeteerOptimizedCSS(
    template: TemplateConfig, 
    columns: number,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const qualityConfig = {
      low: { imgQuality: 80, fontSize: 11, cardPadding: 2, borderRadius: 4 },
      medium: { imgQuality: 90, fontSize: 12, cardPadding: 3, borderRadius: 6 },
      high: { imgQuality: 100, fontSize: 13, cardPadding: 4, borderRadius: 8 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* ===== PUPPETEER OPTIMIZED CSS CORREGIDO - ${template.id.toUpperCase()} ===== */
      
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
        margin: 12mm;
        marks: none;
        bleed: 0;
        -webkit-print-color-adjust: exact;
      }
      
      html {
        width: 210mm;
        height: 297mm;
        font-size: ${config.fontSize}pt;
      }
      
      body {
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: ${template.colors.background} !important;
        color: ${template.colors.text} !important;
        line-height: 1.3;
        width: 186mm; /* 210mm - 24mm margins */
        height: 273mm; /* 297mm - 24mm margins */
        margin: 0;
        padding: 0;
        overflow: visible;
        position: relative;
        -webkit-print-color-adjust: exact !important;
      }
      
      .catalog-wrapper {
        width: 100%;
        height: auto;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      /* ===== PÁGINA INDIVIDUAL CORREGIDA ===== */
      .catalog-page {
        width: 186mm;
        height: auto;
        min-height: 240mm;
        position: relative;
        padding: 0;
        margin: 0 0 10mm 0;
        page-break-after: always;
        page-break-inside: avoid;
        background: ${template.colors.background} !important;
        overflow: visible;
        -webkit-print-color-adjust: exact !important;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .catalog-page:last-child {
        page-break-after: avoid;
        margin-bottom: 0;
      }
      
      /* ===== HEADER ROBUSTO ===== */
      .page-header {
        width: 100%;
        height: 25mm;
        background: ${template.colors.primary} !important;
        background-image: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
        color: white !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin-bottom: 5mm;
        border-radius: ${config.borderRadius}px;
        position: relative;
        overflow: hidden;
        -webkit-print-color-adjust: exact !important;
        flex-shrink: 0;
      }
      
      .business-name {
        font-size: ${config.fontSize + 8}pt;
        font-weight: 700;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        color: white !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        word-wrap: break-word;
        max-width: 90%;
        line-height: 1.1;
      }
      
      .page-subtitle {
        font-size: ${config.fontSize + 2}pt;
        font-weight: 300;
        opacity: 0.9;
        color: white !important;
        margin-top: 1mm;
      }
      
      /* ===== PRODUCTOS CONTAINER CORREGIDO ===== */
      .products-container {
        width: 100%;
        flex-grow: 1;
        position: relative;
        overflow: visible;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        margin-bottom: 10mm;
      }
      
      /* ===== GRID SYSTEM COMPLETAMENTE REDISEÑADO ===== */
      .products-grid {
        display: grid !important;
        grid-template-columns: repeat(${columns}, 1fr) !important;
        gap: 4mm !important;
        width: 100% !important;
        max-width: 186mm !important;
        margin: 0 auto !important;
        padding: 2mm !important;
        justify-content: center !important;
        align-items: start !important;
        grid-auto-rows: minmax(60mm, auto) !important;
        box-sizing: border-box !important;
      }
      
      /* ===== PRODUCT CARDS UNIFORMES ===== */
      .product-card {
        width: 100% !important;
        height: auto !important;
        min-height: 60mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}40;
        border-radius: ${config.borderRadius}px;
        overflow: hidden;
        position: relative;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.1);
        -webkit-print-color-adjust: exact !important;
        page-break-inside: avoid !important;
        align-self: stretch !important;
        justify-self: center !important;
      }
      
      /* ===== DECORACIÓN SUPERIOR ===== */
      .card-decoration {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2pt;
        background: ${template.colors.primary} !important;
        background-image: linear-gradient(90deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
        -webkit-print-color-adjust: exact !important;
        flex-shrink: 0;
      }
      
      /* ===== IMAGEN CONTAINER PROPORCIONADO ===== */
      .image-container {
        width: 100%;
        height: 35mm !important;
        min-height: 35mm !important;
        max-height: 35mm !important;
        position: relative;
        background: #f8f9fa !important;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: ${config.cardPadding}mm;
        box-sizing: border-box;
        flex-shrink: 0;
      }
      
      /* ===== IMAGEN PERFECTA ===== */
      .product-image {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        border-radius: 2px !important;
        -webkit-print-color-adjust: exact !important;
        filter: none !important;
      }
      
      /* ===== PLACEHOLDER DE IMAGEN ===== */
      .image-placeholder {
        width: 80%;
        height: 80%;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg);
        background-size: 8px 8px;
        border: 1pt dashed #ddd;
        border-radius: 3px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: ${config.fontSize - 2}pt;
        text-align: center;
      }
      
      /* ===== INFO CONTAINER FLEXIBLE ===== */
      .product-info {
        flex-grow: 1;
        min-height: 20mm !important;
        padding: ${config.cardPadding}mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: center;
        position: relative;
        background: white !important;
        box-sizing: border-box;
      }
      
      /* ===== TEXTOS OPTIMIZADOS ===== */
      .product-name {
        font-size: ${config.fontSize + 1}pt;
        font-weight: 600;
        color: ${template.colors.primary} !important;
        line-height: 1.2;
        margin-bottom: 2mm;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-align: center;
        flex-shrink: 0;
      }
      
      .product-price {
        font-size: ${config.fontSize + 2}pt;
        font-weight: 700;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1.5mm 2.5mm;
        border-radius: 12px;
        display: inline-block;
        margin: 2mm auto 0 auto;
        text-align: center;
        white-space: nowrap;
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 0.5pt 2pt rgba(0,0,0,0.2);
        -webkit-print-color-adjust: exact !important;
        flex-shrink: 0;
      }
      
      .product-description {
        font-size: ${config.fontSize - 1}pt;
        color: #666 !important;
        line-height: 1.3;
        margin-top: 1mm;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-align: center;
        flex-grow: 1;
      }
      
      /* ===== FOOTER REPOSICIONADO ===== */
      .page-footer {
        position: static !important;
        width: 100%;
        background: ${template.colors.secondary} !important;
        color: ${this.getContrastColor(template.colors.secondary)} !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        border-radius: ${config.borderRadius}px;
        padding: 3mm 2mm !important;
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        margin-top: auto;
        flex-shrink: 0;
      }
      
      .contact-info {
        font-size: ${config.fontSize - 1}pt;
        font-weight: 600;
        margin-bottom: 1mm;
        word-wrap: break-word;
        line-height: 1.2;
      }
      
      .footer-brand {
        font-size: ${config.fontSize - 2}pt;
        opacity: 0.8;
        font-weight: 300;
        line-height: 1.1;
      }
      
      /* ===== PRINT MEDIA QUERIES ===== */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
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
        
        .product-image {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          filter: none !important;
        }
      }
      
      /* ===== OPTIMIZACIONES POR CATEGORÍA CORREGIDAS ===== */
      ${this.getCategorySpecificCSS(template, config)}
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS DEL CATÁLOGO - VERSIÓN CORREGIDA
   */
  private static generateCatalogPages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    columns: number
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    let pagesHTML = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      pagesHTML += `
        <div class="catalog-page">
          ${this.generatePageHeader(businessInfo, template, page + 1, totalPages)}
          
          <div class="products-container">
            <div class="products-grid">
              ${this.generateProductCards(pageProducts, template)}
            </div>
          </div>
          
          ${this.generatePageFooter(businessInfo, products.length)}
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  /**
   * 🎴 GENERAR CARDS DIRECTAMENTE (MÁS SIMPLE QUE EL SISTEMA DE FILAS)
   */
  private static generateProductCards(products: Product[], template: TemplateConfig): string {
    return products.map(product => this.generateProductCard(product, template)).join('');
  }
  
  /**
   * 📋 GENERAR HEADER DE PÁGINA
   */
  private static generatePageHeader(
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    pageNum: number,
    totalPages: number
  ): string {
    return `
      <div class="page-header">
        <h1 class="business-name">${businessInfo.business_name}</h1>
        <p class="page-subtitle">Catálogo ${template.displayName} - Página ${pageNum} de ${totalPages}</p>
      </div>
    `;
  }
  
  /**
   * 🎴 GENERAR CELDA DE PRODUCTO MEJORADA
   */
  private static generateProductCard(product: Product, template: TemplateConfig): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}"
         class="product-image" 
         loading="eager" 
         crossorigin="anonymous"
       />` :
      `<div class="image-placeholder">
         <div style="font-size: 16pt; margin-bottom: 1mm;">📷</div>
         <div>Sin imagen</div>
       </div>`;
    
    return `
      <div class="product-card">
        <div class="card-decoration"></div>
        
        <div class="image-container">
          ${imageHTML}
        </div>
        
        <div class="product-info">
          <h3 class="product-name">${productName}</h3>
          
          ${productDescription ? 
            `<p class="product-description">${productDescription}</p>` : ''
          }
          
          <div class="product-price">$${productPrice.toLocaleString('es-MX', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 📄 GENERAR FOOTER DE PÁGINA MEJORADO
   */
  private static generatePageFooter(businessInfo: BusinessInfo, totalProducts: number): string {
    const contactInfo = [
      businessInfo.phone ? `📞 ${businessInfo.phone}` : '',
      businessInfo.email ? `📧 ${businessInfo.email}` : '',
      businessInfo.website ? `🌐 ${businessInfo.website}` : ''
    ].filter(Boolean).join(' | ');
    
    return `
      <div class="page-footer">
        ${contactInfo ? `<div class="contact-info">${contactInfo}</div>` : ''}
        <div class="footer-brand">
          Catálogo generado con CatalogoIA - ${totalProducts} productos | ${new Date().toLocaleDateString('es-MX')}
        </div>
      </div>
    `;
  }
  
  /**
   * ⚙️ GENERAR PDF CON RETRY
   */
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
  
  /**
   * 💾 DESCARGAR PDF
   */
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
  
  /**
   * ⚙️ CONFIGURACIONES DE PDF OPTIMIZADAS
   */
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
      quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90
    };
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  private static calculateColumns(productsPerPage: number): number {
    if (productsPerPage <= 2) return 1;
    if (productsPerPage <= 4) return 2;
    if (productsPerPage <= 9) return 3;
    return 4;
  }
  
  private static getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#2c3e50' : '#ffffff';
  }
  
  private static getCategorySpecificCSS(template: TemplateConfig, config: any): string {
    const categoryStyles = {
      luxury: `
        .product-card {
          border: 1pt solid ${template.colors.accent} !important;
          background: linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%) !important;
        }
        .product-name {
          font-family: 'Georgia', serif !important;
          letter-spacing: 0.3pt !important;
        }
      `,
      creative: `
        .product-card {
          border-radius: ${config.borderRadius * 1.5}px !important;
        }
        .image-container {
          border-radius: ${config.borderRadius}px !important;
        }
      `,
      business: `
        .product-card {
          border-radius: ${Math.max(config.borderRadius * 0.5, 2)}px !important;
        }
        .page-header {
          border-radius: ${Math.max(config.borderRadius * 0.5, 2)}px !important;
        }
      `
    };
    
    return categoryStyles[template.category as keyof typeof categoryStyles] || '';
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
): Promise<PuppeteerResult> => {
  return PuppeteerServiceClient.generatePDF(products, businessInfo, template, options);
};