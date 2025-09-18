// SOLUCIÓN COMPLETA PARA puppeteer-service-client.ts
// Basada en investigación de issues oficiales de Puppeteer

/**
 * 🎨 GENERAR HTML ROBUSTO CON SOLUCIONES DE ISSUES DE GITHUB
 */
private static generateRobustHTML(
  products: Product[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  quality: 'low' | 'medium' | 'high' = 'medium'
): string {
  
  const productsPerPage = template.productsPerPage;
  const columns = this.calculateColumns(productsPerPage);
  
  // CSS COMPLETAMENTE REDISEÑADO basado en Issues #2333, #3357, #10505
  const baseStyles = this.generatePuppeteerFixedCSS(template, columns, quality);
  
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
      <div class="page-container">
        ${this.generateCatalogPages(products, businessInfo, template, columns)}
      </div>
    </body>
    </html>
  `;
}

/**
 * 🎨 CSS CORREGIDO ESPECÍFICO PARA BUGS DE PUPPETEER
 */
private static generatePuppeteerFixedCSS(
  template: TemplateConfig, 
  columns: number,
  quality: 'low' | 'medium' | 'high'
): string {
  
  const config = {
    low: { fontSize: 11, cardPadding: 2, borderRadius: 4 },
    medium: { fontSize: 12, cardPadding: 3, borderRadius: 6 },
    high: { fontSize: 13, cardPadding: 4, borderRadius: 8 }
  }[quality];
  
  return `
    /* ===== SOLUCIÓN PARA ISSUES DE PUPPETEER ===== */
    
    * {
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* ===== SOLUCIÓN ISSUE #2333: VIEWPORT FIJO ===== */
    @page {
      size: A4 portrait;
      margin: 12mm;
      marks: none;
      bleed: 0;
      -webkit-print-color-adjust: exact;
    }
    
    html {
      width: 210mm !important;
      height: 297mm !important;
      font-size: ${config.fontSize}pt;
      background: ${template.colors.background} !important;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif !important;
      background: ${template.colors.background} !important;
      color: ${template.colors.text} !important;
      line-height: 1.3;
      
      /* SOLUCIÓN: FORZAR WIDTH ESPECÍFICO */
      width: 186mm !important; /* 210mm - 24mm margins */
      min-width: 186mm !important;
      max-width: 186mm !important;
      
      height: auto !important;
      margin: 0 auto !important;
      padding: 0 !important;
      position: relative;
      -webkit-print-color-adjust: exact !important;
      
      /* CENTRADO FORZADO */
      display: block !important;
      text-align: center !important;
    }
    
    /* ===== CONTAINER PRINCIPAL CON WIDTH FIJO ===== */
    .page-container {
      width: 186mm !important;
      min-width: 186mm !important;
      max-width: 186mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: ${template.colors.background} !important;
      position: relative;
      text-align: left !important;
      -webkit-print-color-adjust: exact !important;
    }
    
    /* ===== PÁGINA INDIVIDUAL CORREGIDA ===== */
    .catalog-page {
      width: 186mm !important;
      min-width: 186mm !important;
      max-width: 186mm !important;
      height: auto !important;
      min-height: 240mm !important;
      
      position: relative;
      margin: 0 auto 8mm auto !important;
      padding: 0 !important;
      
      page-break-after: always;
      page-break-inside: avoid;
      background: ${template.colors.background} !important;
      overflow: visible;
      -webkit-print-color-adjust: exact !important;
      
      /* ESTRUCTURA VERTICAL FIJA */
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: flex-start !important;
    }
    
    .catalog-page:last-child {
      page-break-after: avoid;
      margin-bottom: 0;
      min-height: auto !important;
    }
    
    /* ===== HEADER CON WIDTH FIJO ===== */
    .page-header {
      width: 186mm !important;
      min-width: 186mm !important;
      max-width: 186mm !important;
      height: 25mm !important;
      
      background: ${template.colors.primary} !important;
      background-image: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
      color: white !important;
      
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
      
      margin-bottom: 5mm !important;
      border-radius: ${config.borderRadius}px;
      position: relative;
      overflow: hidden;
      -webkit-print-color-adjust: exact !important;
      flex-shrink: 0;
    }
    
    .business-name {
      font-size: ${config.fontSize + 8}pt;
      font-weight: 700;
      margin: 0 !important;
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
      margin-top: 1mm !important;
    }
    
    /* ===== CONTENEDOR DE PRODUCTOS CON CENTRADO PERFECTO ===== */
    .products-container {
      width: 186mm !important;
      min-width: 186mm !important;
      max-width: 186mm !important;
      
      flex-grow: 1;
      position: relative;
      overflow: visible;
      
      display: flex !important;
      justify-content: center !important;
      align-items: flex-start !important;
      
      margin-bottom: 10mm !important;
      padding: 0 !important;
    }
    
    /* ===== GRID SYSTEM CENTRADO - SOLUCIÓN ISSUE #3357 ===== */
    .products-grid {
      display: grid !important;
      grid-template-columns: repeat(${columns}, 1fr) !important;
      gap: 4mm !important;
      
      /* WIDTH FIJO PARA CENTRADO PERFECTO */
      width: calc(186mm - 4mm) !important; /* Container width - padding */
      min-width: calc(186mm - 4mm) !important;
      max-width: calc(186mm - 4mm) !important;
      
      margin: 0 auto !important;
      padding: 2mm !important;
      
      justify-content: center !important;
      justify-items: center !important;
      align-items: start !important;
      
      grid-auto-rows: minmax(60mm, auto) !important;
      box-sizing: border-box !important;
      position: relative;
      
      /* CENTRADO ADICIONAL */
      place-content: start center !important;
      place-items: start center !important;
    }
    
    /* ===== PRODUCT CARDS UNIFORMES Y CENTRADAS ===== */
    .product-card {
      width: 100% !important;
      height: auto !important;
      min-height: 60mm !important;
      max-width: ${Math.floor((186 - 8 - (columns - 1) * 4) / columns)}mm !important;
      
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
      
      /* ALINEACIÓN PERFECTA */
      align-self: start !important;
      justify-self: center !important;
      margin: 0 auto !important;
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
    
    /* ===== IMAGEN CONTAINER CON ALTURA FIJA ===== */
    .image-container {
      width: 100% !important;
      height: 35mm !important;
      min-height: 35mm !important;
      max-height: 35mm !important;
      position: relative;
      background: #f8f9fa !important;
      
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden;
      padding: ${config.cardPadding}mm;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    
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
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      text-align: center !important;
      position: relative;
      background: white !important;
      box-sizing: border-box;
    }
    
    .product-name {
      font-size: ${config.fontSize + 1}pt;
      font-weight: 600;
      color: ${template.colors.primary} !important;
      line-height: 1.2;
      margin-bottom: 2mm !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      
      display: -webkit-box !important;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-align: center !important;
      flex-shrink: 0;
    }
    
    .product-price {
      font-size: ${config.fontSize + 2}pt;
      font-weight: 700;
      color: white !important;
      background: ${template.colors.secondary} !important;
      background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
      
      padding: 1.5mm 2.5mm !important;
      border-radius: 12px;
      display: inline-block !important;
      margin: 2mm auto 0 auto !important;
      text-align: center !important;
      
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
      margin: 1mm 0 !important;
      
      display: -webkit-box !important;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-align: center !important;
      flex-grow: 1;
    }
    
    /* ===== SOLUCIÓN ISSUE #10505: FOOTER SIN OVERLAP ===== */
    .page-footer {
      width: 186mm !important;
      min-width: 186mm !important;
      max-width: 186mm !important;
      
      /* POSICIONAMIENTO ESTÁTICO EN LUGAR DE ABSOLUTO */
      position: static !important;
      
      background: ${template.colors.secondary} !important;
      color: ${this.getContrastColor(template.colors.secondary)} !important;
      
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
      
      border-radius: ${config.borderRadius}px;
      padding: 4mm 2mm !important;
      margin: 8mm auto 0 auto !important;
      
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      flex-shrink: 0;
      
      /* FORZAR POSICIÓN AL FINAL */
      align-self: flex-end !important;
    }
    
    .contact-info {
      font-size: ${config.fontSize - 1}pt;
      font-weight: 600;
      margin-bottom: 1mm !important;
      word-wrap: break-word;
      line-height: 1.2;
      width: 100% !important;
    }
    
    .footer-brand {
      font-size: ${config.fontSize - 2}pt;
      opacity: 0.8;
      font-weight: 300;
      line-height: 1.1;
      width: 100% !important;
    }
    
    /* ===== REGLAS PRINT ESPECÍFICAS ===== */
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
      
      .page-footer {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;
}

/**
 * 📄 GENERAR PÁGINAS CON ESTRUCTURA MEJORADA
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
        
        ${page === totalPages - 1 ? this.generatePageFooter(businessInfo, products.length) : ''}
      </div>
    `;
  }
  
  return pagesHTML;
}

/**
 * ⚙️ OPCIONES PDF OPTIMIZADAS PARA BUGS CONOCIDOS
 */
private static getPDFOptions(options: PuppeteerServiceOptions): any {
  return {
    format: 'A4',
    width: '210mm',     // SOLUCIÓN Issue #2333: Width explícito
    height: '297mm',    // SOLUCIÓN Issue #2333: Height explícito
    margin: {
      top: '12mm',
      right: '12mm',
      bottom: '12mm',
      left: '12mm'
    },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,  // SOLUCIÓN Issue #10505: Deshabilitar sistema de header/footer
    waitUntil: 'networkidle0',
    timeout: 30000,
    omitBackground: false,
    quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90
  };
}

/**
 * 🎯 FUNCIÓN PRINCIPAL ACTUALIZADA CON VIEWPORT FIXES
 */
static async generatePDF(
  products: Product[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  options: PuppeteerServiceOptions = {}
): Promise<PuppeteerResult> {
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando generación con soluciones de Issues de GitHub...');
    
    if (options.onProgress) options.onProgress(5);
    
    const isHealthy = await this.checkServiceHealthWithRetry();
    if (!isHealthy) {
      throw new Error('Servicio Puppeteer no disponible después de varios intentos');
    }
    
    if (options.onProgress) options.onProgress(15);
    
    const htmlContent = this.generateRobustHTML(products, businessInfo, template, options.quality);
    
    if (options.onProgress) options.onProgress(30);
    
    // SOLUCIÓN Issue #2333: Opciones PDF específicas
    const pdfOptions = this.getPDFOptions(options);
    
    // ENVIAR CON CONFIGURACIONES ADICIONALES
    const requestBody = {
      html: htmlContent,
      options: {
        ...pdfOptions,
        // SOLUCIÓN ADICIONAL: Configuraciones de viewport
        viewport: {
          width: 1240,    // Wider than 800px default
          height: 1754    // A4 ratio
        },
        emulateMedia: 'print'  // SOLUCIÓN: Usar print media
      },
      filename: `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    };
    
    const pdfBlob = await this.generatePDFWithRetry(htmlContent, pdfOptions, businessInfo, options.onProgress);
    
    if (options.onProgress) options.onProgress(90);
    
    await this.downloadPDF(pdfBlob, businessInfo.business_name);
    
    if (options.onProgress) options.onProgress(100);
    
    const generationTime = Date.now() - startTime;
    
    console.log('✅ PDF generado con soluciones de Issues aplicadas');
    
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