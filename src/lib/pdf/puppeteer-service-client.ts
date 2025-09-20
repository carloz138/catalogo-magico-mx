// src/lib/pdf/puppeteer-service-client.ts - CÓDIGO COMPLETO CORREGIDO
// 🎯 SISTEMA OPTIMIZADO 3x3 GRID - TODOS LOS ERRORES DE PUPPETEER SOLUCIONADOS

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
  price_wholesale?: number;  // NUEVO: Precio de mayoreo
  wholesale_min_qty?: number;  // NUEVO: Cantidad mínima para mayoreo
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

// 📐 CONFIGURACIÓN OPTIMIZADA PARA 3x3 GRID - CORREGIDA
const OPTIMIZED_LAYOUT = {
  // Estándar comercial: 3x3 = 9 productos por página
  PRODUCTS_PER_PAGE: 9,
  COLUMNS: 3,
  ROWS: 3,
  
  // Dimensiones A4 optimizadas - VALORES FIJOS
  PAGE: {
    WIDTH: 210,  // mm
    HEIGHT: 297, // mm
    MARGIN: 6    // mm reducido para más espacio
  },
  
  // Sistema de spacing fijo - SIN VARIABLES
  SPACING: {
    GRID_GAP: 4,      // mm
    CARD_PADDING: 3,  // mm
    BORDER_RADIUS: 4  // mm
  }
};

// Calcular área disponible - VALORES FIJOS
const CONTENT_AREA = {
  WIDTH: OPTIMIZED_LAYOUT.PAGE.WIDTH - (OPTIMIZED_LAYOUT.PAGE.MARGIN * 2), // 198mm
  HEIGHT: 260, // mm - más espacio disponible
  USABLE_WIDTH: 198 - 6, // mm - padding interno
  USABLE_HEIGHT: 260 - 6 // mm
};

// Dimensiones de tarjetas CALCULADAS Y FIJAS
const CARD_DIMENSIONS = {
  WIDTH: (CONTENT_AREA.USABLE_WIDTH - (OPTIMIZED_LAYOUT.SPACING.GRID_GAP * 2)) / OPTIMIZED_LAYOUT.COLUMNS, // ~60mm
  HEIGHT: 60, // mm - altura fija para consistencia
  IMAGE_HEIGHT: 40, // mm - espacio para imagen
  TEXT_HEIGHT: 17   // mm - espacio garantizado para texto
};

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  /**
   * 🎯 MÉTODO PRINCIPAL CORREGIDO PARA TODOS LOS ERRORES
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {},
    catalogTitle?: string
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Generando PDF con sistema corregido...', {
        products: products.length,
        template: template.id,
        productsPerPage: OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE,
        totalPages: Math.ceil(products.length / OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE),
        cardSize: `${CARD_DIMENSIONS.WIDTH}x${CARD_DIMENSIONS.HEIGHT}mm`,
        corrections: 'all-puppeteer-errors-fixed'
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. Health Check
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // 2. Generar HTML COMPLETAMENTE CORREGIDO
      const htmlContent = this.generateCorrectedHTML(
        products, 
        businessInfo, 
        template, 
        options.quality || 'medium',
        catalogTitle
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Configurar PDF con mejores prácticas
      const pdfOptions = this.getOptimizedPDFOptions(options);
      
      // 4. Generar con retry
      const pdfBlob = await this.generatePDFWithRetry(
        htmlContent, 
        pdfOptions, 
        businessInfo, 
        options.onProgress,
        catalogTitle
      );
      
      if (options.onProgress) options.onProgress(90);
      
      // 5. Descargar
      const finalTitle = catalogTitle || businessInfo.business_name;
      await this.downloadPDF(pdfBlob, finalTitle);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      const totalPages = Math.ceil(products.length / OPTIMIZED_LAYOUT.PRODUCTS_PER_PAGE);
      
      console.log('✅ PDF corregido generado exitosamente:', {
        time: generationTime,
        size: pdfBlob.size,
        totalPages,
        fixes: ['no-flexbox', 'fixed-dimensions', 'table-layout', 'visible-text']
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
      console.error('❌ Error en PDF corregido:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 🏗️ GENERAR HTML COMPLETAMENTE CORREGIDO
   */
  private static generateCorrectedHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    catalogTitle?: string
  ): string {
    
    const pagesHTML = this.generateCorrected3x3Pages(products, businessInfo, template, quality);
    const finalTitle = catalogTitle || `Catálogo ${businessInfo.business_name}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, height=297mm, initial-scale=1.0">
  <title>${finalTitle}</title>
  <style>
    ${this.generateCorrectedCSS(template, quality)}
  </style>
</head>
<body>
  ${this.generateFixedHeader(businessInfo, template, catalogTitle)}
  ${this.generateFixedFooter(businessInfo, products.length)}
  ${pagesHTML}
</body>
</html>`;
  }
  
  /**
   * 🎨 CSS COMPLETAMENTE CORREGIDO - SOLUCIÓN TOTAL
   */
  private static generateCorrectedCSS(
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    
    const qualityConfig = {
      low: { fontSize: 9, headerSize: 14, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, headerSize: 16, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, headerSize: 18, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* ===== SOLUCIÓN COMPLETA - TODOS LOS ERRORES CORREGIDOS ===== */
      
      /* ===== ERROR 1: NO MÁS FLEXBOX - SOLO TABLE LAYOUT ===== */
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* ===== ERROR 2: @PAGE CORREGIDO CON VALORES EXACTOS ===== */
      @page {
        size: A4 portrait;
        margin: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm;
        marks: none;
        bleed: 0;
        orphans: 1;
        widows: 1;
        -webkit-print-color-adjust: exact;
      }
      
      /* ===== ERROR 3: NO MÁS CSS VARIABLES - VALORES FIJOS ===== */
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
        padding-top: 22mm !important; /* Header space FIJO */
        padding-bottom: 18mm !important; /* Footer space FIJO */
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        line-height: 1.2 !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== HEADER FIJO - SIN PROBLEMAS DE POSITIONING ===== */
      .fixed-header {
        position: fixed !important;
        top: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        left: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        right: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        width: ${CONTENT_AREA.WIDTH}mm !important;
        height: 16mm !important;
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
      
      /* ===== FOOTER FIJO - SIN PROBLEMAS DE POSITIONING ===== */
      .fixed-footer {
        position: fixed !important;
        bottom: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        left: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        right: ${OPTIMIZED_LAYOUT.PAGE.MARGIN}mm !important;
        width: ${CONTENT_AREA.WIDTH}mm !important;
        height: 12mm !important;
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
      
      /* ===== CONTENIDO PRINCIPAL - SIN FLEX ===== */
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
      
      /* ===== 3x3 GRID CORREGIDO - TABLE LAYOUT ROBUSTO ===== */
      .products-grid-3x3 {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: ${OPTIMIZED_LAYOUT.SPACING.GRID_GAP}mm !important;
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
        width: ${100 / OPTIMIZED_LAYOUT.COLUMNS}% !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        padding: 0 !important;
        text-align: center !important;
      }
      
      /* ===== PRODUCT CARDS SIN FLEX - SOLO TABLE ===== */
      .product-card-optimized {
        width: 100% !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        min-height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        max-height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: ${OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS}px !important;
        overflow: hidden !important;
        position: relative !important;
        page-break-inside: avoid !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.1) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: table !important;
        table-layout: fixed !important;
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
      
      /* ===== IMAGEN CONTAINER CORREGIDO - DIMENSIONES FIJAS ===== */
      .image-container-optimized {
        display: table-row !important;
        width: 100% !important;
        height: ${CARD_DIMENSIONS.IMAGE_HEIGHT}mm !important;
        background: #f8f9fa !important;
        border-radius: ${Math.max(OPTIMIZED_LAYOUT.SPACING.BORDER_RADIUS - 2, 2)}px !important;
        border: 0.25pt solid #e9ecef !important;
        margin: ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm 1mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .image-cell-optimized {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: ${CARD_DIMENSIONS.IMAGE_HEIGHT}mm !important;
      }
      
      /* ===== IMAGEN SIN PROBLEMAS DE RENDERIZADO ===== */
      .product-image-optimized {
        max-width: 95% !important;
        max-height: ${CARD_DIMENSIONS.IMAGE_HEIGHT - 4}mm !important;
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
        width: ${CARD_DIMENSIONS.IMAGE_HEIGHT - 4}mm !important;
        height: ${CARD_DIMENSIONS.IMAGE_HEIGHT - 4}mm !important;
        background: 
          repeating-conic-gradient(from 0deg at 50% 50%, 
            #f0f0f0 0deg 90deg, 
            transparent 90deg 180deg) !important;
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
      
      /* ===== ÁREA DE TEXTO GARANTIZADA - VISIBLE ===== */
      .text-area-optimized {
        display: table-row !important;
        width: 100% !important;
        height: ${CARD_DIMENSIONS.TEXT_HEIGHT}mm !important;
        padding: 1mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm ${OPTIMIZED_LAYOUT.SPACING.CARD_PADDING}mm !important;
        text-align: center !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      }
      
      .text-content-cell {
        display: table-cell !important;
        vertical-align: middle !important;
        text-align: center !important;
        width: 100% !important;
        height: ${CARD_DIMENSIONS.TEXT_HEIGHT}mm !important;
      }
      
      /* ===== TEXTO VISIBLE - DIMENSIONES GARANTIZADAS ===== */
      .product-name-optimized {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        line-height: 1.1 !important;
        margin: 0 auto 2mm auto !important;
        text-align: center !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        
        height: 6mm !important;
        max-height: 6mm !important;
        
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== SISTEMA DE PRECIOS DUALES OPTIMIZADO PUPPETEER ===== */
.product-pricing-optimized {
  display: table !important;
  width: 100% !important;
  height: auto !important;
  margin: 0 auto !important;
  text-align: center !important;
}

/* Precio retail - prominente */
.product-price-retail-optimized {
  font-size: ${config.priceSize}pt !important;
  font-weight: 700 !important;
  color: white !important;
  background: ${template.colors.secondary} !important;
  background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
  padding: 1.5mm 3mm !important;
  border-radius: 10px !important;
  display: inline-block !important;
  margin: 0 auto 1mm auto !important;
  text-align: center !important;
  white-space: nowrap !important;
  max-width: 95% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  box-shadow: 0 1pt 2pt rgba(0,0,0,0.15) !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  
  height: auto !important;
  line-height: 1.2 !important;
}

/* Precio mayoreo - más compacto para 3x3 grid */
.product-price-wholesale-optimized {
  display: table !important;
  width: 90% !important;
  margin: 0 auto !important;
  font-size: ${Math.max(config.priceSize - 2, 6)}pt !important;
  color: ${template.colors.text} !important;
  background: rgba(0,0,0,0.03) !important;
  padding: 1mm !important;
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

/* ===== AJUSTES PARA GRID 3X3 ===== */
@media print {
  .product-pricing-optimized {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .product-price-retail-optimized,
  .product-price-wholesale-optimized {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
      
      /* ===== CELDA VACÍA PARA COMPLETAR GRID ===== */
      .empty-cell {
        display: table-cell !important;
        width: ${100 / OPTIMIZED_LAYOUT.COLUMNS}% !important;
        height: ${CARD_DIMENSIONS.HEIGHT}mm !important;
        visibility: hidden !important;
      }
      
      /* ===== MEDIA PRINT ESPECÍFICO - FUERZA TABLE LAYOUT ===== */
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
        
        .products-grid-3x3 {
          display: table !important;
          width: 100% !important;
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
   * 📋 GENERAR HEADER FIJO (SIN CAMBIOS)
   */
  private static generateFixedHeader(businessInfo: BusinessInfo, template: TemplateConfig, catalogTitle?: string): string {
    const displayTitle = (catalogTitle && catalogTitle.trim()) ? catalogTitle.trim() : `Catálogo ${template.displayName}`;
    return `
      <div class="fixed-header">
        <div class="header-cell">
          <div class="header-business-name">${businessInfo.business_name}</div>
          <div class="header-subtitle">${displayTitle}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * 📄 GENERAR FOOTER FIJO (SIN CAMBIOS)
   */
  private static generateFixedFooter(businessInfo: BusinessInfo, totalProducts: number): string {
    // Crear contactInfo dinámico solo con campos que tengan información
    const contactParts = [];
    
    if (businessInfo.business_name) {
      contactParts.push(businessInfo.business_name);
    }
    
    if (businessInfo.phone) {
      contactParts.push(`Tel: ${businessInfo.phone}`);
    }
    
    if (businessInfo.email) {
      contactParts.push(`Email: ${businessInfo.email}`);
    }
    
    if (businessInfo.website) {
      contactParts.push(`Web: ${businessInfo.website}`);
    }
    
    if (businessInfo.address) {
      contactParts.push(`Dir: ${businessInfo.address}`);
    }
    
    const contactInfo = contactParts.join(' | ');
    const currentDate = new Date().toLocaleDateString('es-MX');
    const footerBrand = `Catalogo generado con CatifyPro - ${totalProducts} productos | ${currentDate}`;
    
    console.log('🔍 PUPPETEER DEBUG - Footer Data:', { 
      contactInfo,
      totalProducts,
      currentDate,
      footerBrand,
      businessInfo: {
        business_name: businessInfo.business_name,
        phone: businessInfo.phone,
        email: businessInfo.email, 
        website: businessInfo.website,
        address: businessInfo.address
      }
    });
    
    return `
      <div class="fixed-footer">
        <div class="footer-cell">
          ${contactInfo ? `<div class="footer-contact">${contactInfo}</div>` : ''}
          <div class="footer-brand">
            ${footerBrand}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS CORREGIDAS
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
   * 🛍️ GENERAR 3x3 GRID CORREGIDO
   */
  private static generateCorrected3x3Grid(products: Product[]): string {
    let gridHTML = '<table class="products-grid-3x3">';
    
    // Crear exactamente 3 filas (3x3 = 9 slots)
    for (let row = 0; row < OPTIMIZED_LAYOUT.ROWS; row++) {
      gridHTML += '<tr class="grid-row">';
      
      // Crear 3 columnas por fila
      for (let col = 0; col < OPTIMIZED_LAYOUT.COLUMNS; col++) {
        const productIndex = (row * OPTIMIZED_LAYOUT.COLUMNS) + col;
        
        if (productIndex < products.length) {
          // Producto real con texto visible
          const product = products[productIndex];
          gridHTML += `
            <td class="grid-cell">
              ${this.generateCorrectedProductCard(product)}
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
   * 🎴 GENERAR TARJETA CORREGIDA - TEXTO GARANTIZADO VISIBLE
   */
  private static generateCorrectedProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';

    console.log('🔍 PUPPETEER DEBUG:', {
    name: productName,
    retail_price: productPrice,
    wholesale_price: product.price_wholesale,
    wholesale_min_qty: product.wholesale_min_qty,
    has_wholesale: !!product.price_wholesale
  });
    
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
      displayHeaderFooter: false,
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
    catalogTitle?: string,
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
            filename: `${(catalogTitle || businessInfo.business_name).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
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
        
        console.log(`✅ PDF corregido en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
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