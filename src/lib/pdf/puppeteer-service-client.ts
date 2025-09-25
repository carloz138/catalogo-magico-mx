// src/lib/pdf/puppeteer-service-client.ts
// 🎯 VERSIÓN FINAL - CORRIGE TODAS LAS CAUSAS DE PÁGINAS EN BLANCO EXTRA

import { PDFStorageManager } from '@/lib/storage/pdf-uploader';

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
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
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
  catalogId?: string;
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

// ✅ CONFIGURACIÓN MATEMÁTICA CON DELTA DE PRECISIÓN (INVESTIGACIÓN: Issues #2278, #6704)
const PRECISION_DELTA = 0.5; // ✅ CRÍTICO: Delta para evitar problemas de redondeo

const PDF_LAYOUT = {
  PAGE_WIDTH: 210 + PRECISION_DELTA,  // ✅ CRÍTICO: Agregado delta
  PAGE_HEIGHT: 297 + PRECISION_DELTA, // ✅ CRÍTICO: Agregado delta
  HEADER_MARGIN: 15, // Mantengo como estaba (no tocar header/footer)
  FOOTER_MARGIN: 12, // Mantengo como estaba
  SIDE_MARGIN: 10,
  HEADER_HEIGHT: 10, // Mantengo como estaba
  FOOTER_HEIGHT: 6,  // Mantengo como estaba
  COLUMNS: 3,
  ROWS: 2,
  PRODUCTS_PER_PAGE: 6
};

// ✅ CÁLCULOS CON DELTA DE PRECISIÓN
const calculateAvailableSpace = () => {
  const contentWidth = PDF_LAYOUT.PAGE_WIDTH - (PDF_LAYOUT.SIDE_MARGIN * 2) - PRECISION_DELTA;
  const totalVerticalMargins = PDF_LAYOUT.HEADER_MARGIN + PDF_LAYOUT.FOOTER_MARGIN;
  const headerFooterSpace = PDF_LAYOUT.HEADER_HEIGHT + PDF_LAYOUT.FOOTER_HEIGHT;
  const availableHeight = PDF_LAYOUT.PAGE_HEIGHT - totalVerticalMargins - headerFooterSpace - PRECISION_DELTA;
  
  const gap = 3;
  const padding = 4;
  const usableWidth = contentWidth - (padding * 2) - PRECISION_DELTA;
  const usableHeight = availableHeight - (padding * 2) - PRECISION_DELTA;
  
  const cardWidth = (usableWidth - (gap * (PDF_LAYOUT.COLUMNS - 1))) / PDF_LAYOUT.COLUMNS;
  const cardHeight = (usableHeight - (gap * (PDF_LAYOUT.ROWS - 1))) / PDF_LAYOUT.ROWS;
  
  return {
    contentWidth: Math.floor(contentWidth * 100) / 100,
    availableHeight: Math.floor(availableHeight * 100) / 100,
    usableWidth: Math.floor(usableWidth * 100) / 100,
    usableHeight: Math.floor(usableHeight * 100) / 100,
    cardWidth: Math.floor(cardWidth * 100) / 100,
    cardHeight: Math.floor(cardHeight * 100) / 100,
    gap,
    padding,
    imageHeight: Math.floor(cardHeight * 0.65 * 100) / 100,
    textHeight: Math.floor(cardHeight * 0.35 * 100) / 100
  };
};

const LAYOUT = calculateAvailableSpace();

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  private static readonly TIMEOUT = 30000;
  
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Generando PDF con TODAS las correcciones...', {
        products: products.length,
        totalPages: Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE),
        layout: LAYOUT,
        precisionDelta: PRECISION_DELTA
      });
      
      const totalPages = Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE);
      
      if (options.onProgress) options.onProgress(5);
      
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      const htmlContent = this.generateBulletproofHTML(products, businessInfo, template, options.quality || 'medium', options);
      
      if (options.onProgress) options.onProgress(30);
      
      // ✅ CRÍTICO: PDF Options completamente corregidas
      const pdfOptions = this.getBulletproofPDFOptions(options, businessInfo, template);
      
      const pdfBlob = await this.generatePDFWithRetry(htmlContent, pdfOptions, businessInfo, options.onProgress);
      
      if (options.onProgress) options.onProgress(90);
      
      // Storage y descarga (sin cambios)
      if (options.catalogId) {
        const storageResult = await PDFStorageManager.saveAndLinkPDF(
          pdfBlob,
          options.catalogId,
          businessInfo.business_name,
          {
            pdf_size_bytes: pdfBlob.size,
            generation_completed_at: new Date().toISOString(),
            generation_method: 'puppeteer'
          }
        );
        
        if (storageResult.success) {
          await this.downloadPDF(pdfBlob, businessInfo.business_name);
          
          if (options.onProgress) options.onProgress(100);
          
          return {
            success: true,
            downloadUrl: storageResult.url,
            stats: {
              totalProducts: products.length,
              totalPages,
              generationTime: Date.now() - startTime
            }
          };
        }
      }
      
      await this.downloadPDF(pdfBlob, businessInfo.business_name);
      
      if (options.onProgress) options.onProgress(100);
      
      return {
        success: true,
        stats: {
          totalProducts: products.length,
          totalPages,
          generationTime: Date.now() - startTime
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
  
  // ✅ HTML BULLETPROOF - CORRIGE TODOS LOS PROBLEMAS IDENTIFICADOS
  private static generateBulletproofHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    options: PuppeteerServiceOptions = {}
  ): string {
    
    const pagesHTML = this.generateRobustPages(products, businessInfo, template, quality);
    const pageTitle = options.catalogTitle || `Catálogo ${businessInfo.business_name}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${PDF_LAYOUT.PAGE_WIDTH}mm, height=${PDF_LAYOUT.PAGE_HEIGHT}mm, initial-scale=1.0, user-scalable=no">
  <meta name="format-detection" content="telephone=no">
  <title>${pageTitle}</title>
  <style>
    ${this.generateBulletproofCSS(template, quality)}
  </style>
</head>
<body class="pdf-body">
  <div class="pdf-container">
    ${pagesHTML}
  </div>
</body>
</html>`;
  }
  
  // ✅ CSS BULLETPROOF - SOLUCIONA TODOS LOS PROBLEMAS ENCONTRADOS
  private static generateBulletproofCSS(template: TemplateConfig, quality: 'low' | 'medium' | 'high'): string {
    const qualityConfig = {
      low: { fontSize: 9, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* ✅ RESET ABSOLUTO - INVESTIGACIÓN: Issues #6704, #5277 */
      *, *::before, *::after {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* ✅ @PAGE SIN MÁRGENES - INVESTIGACIÓN: Issues #393, #2592 */
      @page {
        size: A4 portrait;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
      }
      
      /* ✅ HTML BULLETPROOF - INVESTIGACIÓN: Issues #2278, #3357 */
      html {
        width: ${PDF_LAYOUT.PAGE_WIDTH}mm !important;
        height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        position: relative !important;
      }
      
      /* ✅ BODY BULLETPROOF - INVESTIGACIÓN: Issues #6704, #589 */
      body.pdf-body {
        width: 100% !important;
        height: 100% !important;
        max-width: ${PDF_LAYOUT.PAGE_WIDTH}mm !important;
        max-height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow: hidden !important;
        position: relative !important;
        
        /* ✅ CRÍTICO: Sin elementos flotantes problemáticos */
        clear: both !important;
        float: none !important;
        display: block !important;
      }
      
      /* ✅ CONTAINER PRINCIPAL BULLETPROOF */
      .pdf-container {
        width: 100% !important;
        height: 100% !important;
        max-width: ${PDF_LAYOUT.PAGE_WIDTH}mm !important;
        max-height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: hidden !important;
        display: block !important;
        
        /* ✅ CRÍTICO: Sin pseudoelementos problemáticos */
        --no-after: none !important;
        --no-before: none !important;
      }
      
      .pdf-container::before,
      .pdf-container::after {
        display: none !important;
        content: none !important;
      }
      
      /* ✅ PÁGINA INDIVIDUAL BULLETPROOF */
      .page-container-bulletproof {
        width: ${PDF_LAYOUT.PAGE_WIDTH}mm !important;
        height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
        max-width: ${PDF_LAYOUT.PAGE_WIDTH}mm !important;
        max-height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
        margin: 0 !important;
        padding: ${PDF_LAYOUT.HEADER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm ${PDF_LAYOUT.FOOTER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        
        /* ✅ CRÍTICO: Page breaks correctos - INVESTIGACIÓN: Issues #5277, #2061 */
        page-break-before: auto !important;
        page-break-after: auto !important;
        page-break-inside: avoid !important;
        break-before: auto !important;
        break-after: auto !important;
        break-inside: avoid !important;
        
        /* ✅ CRÍTICO: Sin elementos flotantes */
        clear: both !important;
        float: none !important;
      }
      
      /* ✅ NUEVA PÁGINA SOLO CUANDO ES NECESARIO */
      .page-container-bulletproof:not(:first-child) {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      /* ✅ ÚLTIMA PÁGINA SIN PAGE-BREAK */
      .page-container-bulletproof:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      
      /* ✅ CONTENIDO PRINCIPAL BULLETPROOF */
      .page-content-bulletproof {
        width: 100% !important;
        height: ${LAYOUT.availableHeight}mm !important;
        max-height: ${LAYOUT.availableHeight}mm !important;
        flex-grow: 1 !important;
        flex-shrink: 0 !important;
        padding: ${LAYOUT.padding}mm !important;
        background: ${template.colors.background} !important;
        overflow: hidden !important;
        position: relative !important;
        display: block !important;
        
        /* ✅ CRÍTICO: Sin pseudoelementos */
        --content-clear: both !important;
      }
      
      .page-content-bulletproof::before,
      .page-content-bulletproof::after {
        display: none !important;
        content: none !important;
      }
      
      /* ✅ GRID BULLETPROOF - INVESTIGACIÓN: Issues #6417, flexbox más estable que CSS Grid */
      .products-grid-bulletproof {
        width: 100% !important;
        height: 100% !important;
        max-width: ${LAYOUT.usableWidth}mm !important;
        max-height: ${LAYOUT.usableHeight}mm !important;
        display: flex !important;
        flex-direction: column !important;
        gap: ${LAYOUT.gap}mm !important;
        justify-content: flex-start !important;
        align-items: stretch !important;
        overflow: hidden !important;
        position: relative !important;
        
        /* ✅ CRÍTICO: Sin page-breaks en grid */
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      .grid-row-bulletproof {
        display: flex !important;
        flex-direction: row !important;
        height: ${LAYOUT.cardHeight}mm !important;
        min-height: ${LAYOUT.cardHeight}mm !important;
        max-height: ${LAYOUT.cardHeight}mm !important;
        gap: ${LAYOUT.gap}mm !important;
        justify-content: flex-start !important;
        align-items: stretch !important;
        flex-shrink: 0 !important;
        overflow: hidden !important;
        
        /* ✅ CRÍTICO: Sin page-breaks problemáticos */
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .grid-cell-bulletproof {
        flex: 1 1 ${100 / PDF_LAYOUT.COLUMNS}% !important;
        height: 100% !important;
        min-height: ${LAYOUT.cardHeight}mm !important;
        max-height: ${LAYOUT.cardHeight}mm !important;
        display: flex !important;
        align-items: stretch !important;
        justify-content: center !important;
        overflow: hidden !important;
        
        /* ✅ CRÍTICO: Sin page-breaks en celdas */
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
      }
      
      /* ✅ PRODUCT CARDS BULLETPROOF */
      .product-card-bulletproof {
        width: 100% !important;
        height: 100% !important;
        min-height: ${LAYOUT.cardHeight}mm !important;
        max-height: ${LAYOUT.cardHeight}mm !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: 4px !important;
        overflow: hidden !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.1) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
        
        /* ✅ CRÍTICO: Cards sin page-breaks */
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
        break-before: auto !important;
        break-after: auto !important;
      }
      
      .card-decoration-bulletproof {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 2pt !important;
        background: ${template.colors.primary} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        z-index: 1 !important;
      }
      
      /* ✅ IMAGEN CONTAINER BULLETPROOF */
      .image-container-bulletproof {
        flex: 1 1 ${LAYOUT.imageHeight}mm !important;
        height: ${LAYOUT.imageHeight}mm !important;
        min-height: ${LAYOUT.imageHeight}mm !important;
        max-height: ${LAYOUT.imageHeight}mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #f8f9fa !important;
        padding: 2mm !important;
        overflow: hidden !important;
        position: relative !important;
      }
      
      /* ✅ IMAGEN BULLETPROOF - INVESTIGACIÓN: Issues con loading de imágenes */
      .product-image-bulletproof {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        
        /* ✅ CRÍTICO: Optimizaciones de imagen para PDF */
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        will-change: auto !important;
      }
      
      .image-placeholder-bulletproof {
        width: ${LAYOUT.imageHeight - 6}mm !important;
        height: ${LAYOUT.imageHeight - 6}mm !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: 6px 6px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      
      .placeholder-content-bulletproof {
        color: #999 !important;
        font-size: 8pt !important;
        text-align: center !important;
        line-height: 1.2 !important;
      }
      
      /* ✅ ÁREA DE TEXTO BULLETPROOF */
      .text-area-bulletproof {
        flex: 0 0 ${LAYOUT.textHeight}mm !important;
        height: ${LAYOUT.textHeight}mm !important;
        min-height: ${LAYOUT.textHeight}mm !important;
        max-height: ${LAYOUT.textHeight}mm !important;
        padding: 2mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        overflow: hidden !important;
        position: relative !important;
      }
      
      .product-name-bulletproof {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin-bottom: 1.5mm !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        text-align: center !important;
        line-height: 1.2 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      .product-pricing-bulletproof {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 1mm !important;
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: center !important;
      }
      
      .product-price-retail-bulletproof {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1mm 2mm !important;
        border-radius: 6px !important;
        display: inline-block !important;
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
      
      .product-price-wholesale-bulletproof {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 85% !important;
        font-size: ${Math.max(config.priceSize - 2, 6)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        padding: 0.5mm 1mm !important;
        border-radius: 3px !important;
        border: 0.25pt solid ${template.colors.accent}50 !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      .wholesale-label-bulletproof {
        font-size: ${Math.max(config.priceSize - 3, 5)}pt !important;
        font-weight: 500 !important;
        color: ${template.colors.text}80 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1pt !important;
        line-height: 1 !important;
        margin-bottom: 0.2mm !important;
      }
      
      .wholesale-price-bulletproof {
        font-weight: 700 !important;
        color: ${template.colors.primary} !important;
        font-size: ${Math.max(config.priceSize - 1, 7)}pt !important;
        line-height: 1 !important;
        margin-bottom: 0.2mm !important;
      }
      
      .wholesale-min-bulletproof {
        font-size: ${Math.max(config.priceSize - 4, 5)}pt !important;
        color: ${template.colors.text}60 !important;
        font-weight: 400 !important;
        font-style: italic !important;
        line-height: 1 !important;
      }
      
      /* ✅ CELDAS VACÍAS COMPLETAMENTE OCULTAS */
      .empty-cell-bulletproof {
        flex: 1 1 ${100 / PDF_LAYOUT.COLUMNS}% !important;
        height: ${LAYOUT.cardHeight}mm !important;
        visibility: hidden !important;
        background: transparent !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        
        /* ✅ CRÍTICO: Sin page-breaks en celdas vacías */
        page-break-inside: auto !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
        break-inside: auto !important;
        break-before: auto !important;
        break-after: auto !important;
      }
      
      /* ✅ MEDIA PRINT BULLETPROOF - INVESTIGACIÓN: Issues #54035306, #2061 */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        /* ✅ CRÍTICO: Evitar elementos que causen overflow */
        .pdf-container,
        .page-container-bulletproof,
        .page-content-bulletproof,
        .products-grid-bulletproof {
          overflow: hidden !important;
          position: relative !important;
        }
        
        /* ✅ CRÍTICO: Page breaks en print */
        .page-container-bulletproof {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .page-container-bulletproof:not(:first-child) {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .page-container-bulletproof:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        .product-card-bulletproof {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-before: auto !important;
          page-break-after: auto !important;
        }
        
        /* ✅ CRÍTICO: Imágenes optimizadas para print */
        .product-image-bulletproof {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
      
      /* ✅ MEDIA SCREEN ESPECÍFICO - INVESTIGACIÓN: Issues sobre screen vs print */
      @media screen {
        .page-container-bulletproof {
          /* ✅ En screen mode, permitir más flexibilidad */
          min-height: ${PDF_LAYOUT.PAGE_HEIGHT}mm !important;
          height: auto !important;
        }
      }
      
      /* ✅ CRÍTICO: Eliminar pseudoelementos problemáticos */
      .pdf-container *::before,
      .pdf-container *::after,
      .page-container-bulletproof *::before,
      .page-container-bulletproof *::after,
      .page-content-bulletproof *::before,
      .page-content-bulletproof *::after,
      .products-grid-bulletproof *::before,
      .products-grid-bulletproof *::after {
        display: none !important;
        content: none !important;
      }
      
      /* ✅ CRÍTICO: Sin elementos flotantes problemáticos */
      .pdf-container *,
      .page-container-bulletproof *,
      .page-content-bulletproof *,
      .products-grid-bulletproof * {
        float: none !important;
        clear: both !important;
        position: static !important;
      }
      
      /* ✅ CRÍTICO: Excepciones para elementos que NECESITAN position */
      .page-container-bulletproof,
      .card-decoration-bulletproof,
      .image-container-bulletproof,
      .text-area-bulletproof {
        position: relative !important;
      }
    `;
  }
  
  // ✅ GENERACIÓN DE PÁGINAS BULLETPROOF
  private static generateRobustPages(
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
      
      // ✅ CRÍTICO: Solo agregar páginas con contenido real
      if (pageProducts.length === 0) continue;
      
      pagesHTML += `
        <div class="page-container-bulletproof">
          <div class="page-content-bulletproof">
            ${this.generateBulletproofGrid(pageProducts)}
          </div>
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  // ✅ GRID BULLETPROOF
  private static generateBulletproofGrid(products: Product[]): string {
    let gridHTML = '<div class="products-grid-bulletproof">';
    
    // ✅ CRÍTICO: Solo generar filas necesarias
    const requiredRows = Math.ceil(products.length / PDF_LAYOUT.COLUMNS);
    const actualRows = Math.min(requiredRows, PDF_LAYOUT.ROWS);
    
    for (let row = 0; row < actualRows; row++) {
      gridHTML += '<div class="grid-row-bulletproof">';
      
      for (let col = 0; col < PDF_LAYOUT.COLUMNS; col++) {
        const productIndex = (row * PDF_LAYOUT.COLUMNS) + col;
        
        if (productIndex < products.length) {
          const product = products[productIndex];
          gridHTML += `
            <div class="grid-cell-bulletproof">
              ${this.generateBulletproofProductCard(product)}
            </div>
          `;
        } else {
          // ✅ CRÍTICO: Celdas vacías solo cuando son necesarias para el grid
          gridHTML += '<div class="empty-cell-bulletproof"></div>';
        }
      }
      
      gridHTML += '</div>';
    }
    
    gridHTML += '</div>';
    return gridHTML;
  }
  
  // ✅ PRODUCTO CARD BULLETPROOF
  private static generateBulletproofProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}"
         class="product-image-bulletproof" 
         loading="eager" 
         crossorigin="anonymous"
         onload="this.style.opacity=1"
         onerror="this.style.display='none'"
       />` :
      `<div class="image-placeholder-bulletproof">
         <div class="placeholder-content-bulletproof">
           <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    const wholesalePriceHTML = product.price_wholesale ? `
      <div class="product-price-wholesale-bulletproof">
        <span class="wholesale-label-bulletproof">Mayoreo:</span>
        <span class="wholesale-price-bulletproof">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</span>
        ${product.wholesale_min_qty ? `
          <span class="wholesale-min-bulletproof">Min. ${product.wholesale_min_qty}</span>
        ` : ''}
      </div>
    ` : '';
    
    return `
      <div class="product-card-bulletproof">
        <div class="card-decoration-bulletproof"></div>
        
        <div class="image-container-bulletproof">
          ${imageHTML}
        </div>
        
        <div class="text-area-bulletproof">
          <div class="product-name-bulletproof">${productName}</div>
          <div class="product-pricing-bulletproof">
            <div class="product-price-retail-bulletproof">$${(productPrice / 100).toLocaleString('es-MX', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</div>
            ${wholesalePriceHTML}
          </div>
        </div>
      </div>
    `;
  }
  
  // ✅ PDF OPTIONS BULLETPROOF - MANTENER HEADER/FOOTER INTACTOS
  private static getBulletproofPDFOptions(
    options: PuppeteerServiceOptions, 
    businessInfo: BusinessInfo, 
    template?: TemplateConfig
  ): any {
    
    const primaryColor = template?.colors?.primary || '#007BFF';
    const secondaryColor = template?.colors?.secondary || '#0056B3';
    const contactInfo = this.generateSmartContactInfo(businessInfo);
    const catalogTitle = options.catalogTitle || 'Catálogo de Productos';
    
    return {
      format: options.format || 'A4',
      
      // ✅ MANTENER MÁRGENES COMO ESTABAN (para header/footer)
      margin: {
        top: `${PDF_LAYOUT.HEADER_MARGIN}mm`,
        right: `${PDF_LAYOUT.SIDE_MARGIN}mm`,
        bottom: `${PDF_LAYOUT.FOOTER_MARGIN}mm`,
        left: `${PDF_LAYOUT.SIDE_MARGIN}mm`
      },
      
      // ✅ CRÍTICO: Dimensiones exactas con delta de precisión
      width: `${PDF_LAYOUT.PAGE_WIDTH}mm`,
      height: `${PDF_LAYOUT.PAGE_HEIGHT}mm`,
      
      printBackground: true,
      preferCSSPageSize: false, // ✅ CRÍTICO: False para que use nuestras dimensiones
      
      // ✅ MANTENER HEADER/FOOTER COMO ESTABAN (funcionan bien)
      displayHeaderFooter: true,
      waitUntil: 'networkidle0', // ✅ CRÍTICO: Esperar por imágenes
      timeout: 30000,
      omitBackground: false,
      scale: 1.0,
      quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90,
      
      // ✅ MANTENER TEMPLATES COMO ESTABAN
      headerTemplate: `<div style="font-size: 12px !important; width: 100% !important; height: ${PDF_LAYOUT.HEADER_HEIGHT}mm !important; text-align: center !important; background: ${primaryColor} !important; background-image: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important; color: white !important; padding: 2mm !important; margin: 0 !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: table !important; table-layout: fixed !important;"><div style="display: table-cell; vertical-align: middle; text-align: center;"><strong style="color: white !important; font-size: 14px !important;">${businessInfo.business_name || 'Mi Negocio'}</strong><br><span style="color: rgba(255,255,255,0.9) !important; font-size: 10px !important;">${catalogTitle}</span></div></div>`,
      
      footerTemplate: `<div style="font-size: 9px !important; width: 100% !important; height: ${PDF_LAYOUT.FOOTER_HEIGHT}mm !important; text-align: center !important; background: ${secondaryColor} !important; color: white !important; padding: 1mm !important; margin: 0 !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: table !important; table-layout: fixed !important;"><div style="display: table-cell; vertical-align: middle; text-align: center;">${contactInfo ? `<div style="color: white !important; font-size: 8px !important; margin-bottom: 1mm !important;">${contactInfo}</div>` : ''}<div style="color: rgba(255,255,255,0.8) !important; font-size: 7px !important;">Generado con CatifyPro - <span class="pageNumber"></span> de <span class="totalPages"></span></div></div></div>`,
      
      // ✅ CRÍTICO: Opciones adicionales para evitar páginas extra
      pageRanges: '', // ✅ Sin rangos problemáticos
      landscape: false,
      
      // ✅ CRÍTICO: Opciones de Chrome para estabilidad
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    };
  }
  
  // ✅ GENERACIÓN CON RETRY MEJORADA - INVESTIGACIÓN: waitUntil options
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
        
        // ✅ CRÍTICO: Payload mejorado con configuraciones adicionales
        const requestPayload = {
          html: htmlContent,
          options: {
            ...pdfOptions,
            // ✅ CRÍTICO: Opciones adicionales para evitar páginas extra
            emulateMediaType: 'screen', // ✅ INVESTIGACIÓN: screen funciona mejor que print
            setViewport: {
              width: Math.floor(PDF_LAYOUT.PAGE_WIDTH * 3.78), // ✅ Conversión mm a px
              height: Math.floor(PDF_LAYOUT.PAGE_HEIGHT * 3.78)
            },
            waitForSelector: '.pdf-container', // ✅ Esperar por contenedor principal
            waitForFunction: 'document.readyState === "complete"', // ✅ Esperar carga completa
          },
          filename: `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          
          // ✅ CRÍTICO: Configuraciones adicionales del servicio
          debug: process.env.NODE_ENV === 'development',
          retryOnFailure: attempt < maxRetries
        };
        
        const response = await fetch(`${this.SERVICE_URL}/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf',
            'User-Agent': 'CatifyPro-PDF-Generator/2.0'
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        if (onProgress) onProgress(70 + attempt * 10);
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('PDF vacío recibido del servicio');
        }
        
        // ✅ CRÍTICO: Validación adicional del PDF
        if (blob.type !== 'application/pdf') {
          console.warn('⚠️ Tipo de archivo inesperado:', blob.type);
        }
        
        console.log(`✅ PDF bulletproof generado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
        return blob;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt}/${maxRetries} falló:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // ✅ Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Todos los intentos de generación fallaron');
  }
  
  // ===== RESTO DE MÉTODOS SIN CAMBIOS =====
  
  private static generateSmartContactInfo(businessInfo: BusinessInfo): string {
    const contactItems: string[] = [];
    
    if (businessInfo.social_media?.whatsapp) {
      contactItems.push(`📱 ${businessInfo.social_media.whatsapp}`);
    } else if (businessInfo.phone) {
      contactItems.push(`📞 ${businessInfo.phone}`);
    }
    
    if (businessInfo.email && businessInfo.email.length <= 25) {
      contactItems.push(`📧 ${businessInfo.email}`);
    }
    
    return contactItems.slice(0, 2).join(' | ');
  }
  
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
      await this.downloadPDF(blob, 'test-bulletproof');
      
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

export const generatePDFWithPuppeteer = async (
  products: Product[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  options?: PuppeteerServiceOptions
): Promise<PuppeteerResult> => {
  return PuppeteerServiceClient.generatePDF(products, businessInfo, template, options);
};