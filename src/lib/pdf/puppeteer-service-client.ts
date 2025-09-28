// src/lib/pdf/puppeteer-service-client.ts
// 🎯 VERSIÓN CORREGIDA PARA PROBLEMAS DE 4 Y 9 PRODUCTOS + FIX 2x2

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
  productsPerPage?: 4 | 6 | 9;
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

// ✅ MANTENER DELTA DE PRECISIÓN
const PRECISION_DELTA = 0.5;

// 🚀 CONFIGURACIÓN DINÁMICA CORREGIDA BASADA EN PRODUCTOS POR PÁGINA
const getDynamicPDFLayout = (productsPerPage: 4 | 6 | 9 = 6) => {
  const layoutConfigs = {
    4: {
      // 🔧 4 PRODUCTOS: Layout CORREGIDO para evitar productos alargados
      HEADER_MARGIN: 8,     // REDUCIDO más para evitar overlap
      FOOTER_MARGIN: 6,      // REDUCIDO más
      SIDE_MARGIN: 8,        // REDUCIDO de 10 para más ancho
      HEADER_HEIGHT: 10,     // REDUCIDO de 12
      FOOTER_HEIGHT: 6,      // REDUCIDO de 8
      COLUMNS: 2,
      ROWS: 2,
      PRODUCTS_PER_PAGE: 4,
      HEADER_TO_CONTENT_GAP: 12,  // AUMENTADO para evitar overlap
      GRID_GAP: 8,              // REDUCIDO de 10 para mayor uso del espacio
      CONTENT_PADDING: 5,       // REDUCIDO de 6
      CARD_INTERNAL_PADDING: 4, // REDUCIDO de 6
    },
    6: {
      // 6 PRODUCTOS: Layout estándar (SIN CAMBIOS CRÍTICOS)
      HEADER_MARGIN: 15,
      FOOTER_MARGIN: 12,
      SIDE_MARGIN: 10,
      HEADER_HEIGHT: 10,
      FOOTER_HEIGHT: 6,
      COLUMNS: 3,
      ROWS: 2,
      PRODUCTS_PER_PAGE: 6,
      HEADER_TO_CONTENT_GAP: 8,
      GRID_GAP: 5,
      CONTENT_PADDING: 4,
      CARD_INTERNAL_PADDING: 4,
    },
    9: {
      // 🔧 9 PRODUCTOS: Layout CORREGIDO para evitar amontonamiento
      HEADER_MARGIN: 10,     // REDUCIDO de 12
      FOOTER_MARGIN: 8,      // REDUCIDO de 10
      SIDE_MARGIN: 8,        // SIN CAMBIOS
      HEADER_HEIGHT: 8,      // SIN CAMBIOS
      FOOTER_HEIGHT: 5,      // SIN CAMBIOS
      COLUMNS: 3,
      ROWS: 3,
      PRODUCTS_PER_PAGE: 9,
      HEADER_TO_CONTENT_GAP: 10, // AUMENTADO de 6
      GRID_GAP: 8,               // AUMENTADO de 3
      CONTENT_PADDING: 4,        // AUMENTADO de 3
      CARD_INTERNAL_PADDING: 5,  // AUMENTADO de 3
    }
  };
  
  return layoutConfigs[productsPerPage];
};

// 🔧 CÁLCULOS DINÁMICOS CORREGIDOS BASADOS EN PRODUCTOS POR PÁGINA
const calculateDynamicDimensions = (productsPerPage: 4 | 6 | 9 = 6) => {
  const PDF_LAYOUT = getDynamicPDFLayout(productsPerPage);
  const contentWidth = 210 - (PDF_LAYOUT.SIDE_MARGIN * 2) - PRECISION_DELTA;
  
  const gap = PDF_LAYOUT.GRID_GAP;
  const padding = PDF_LAYOUT.CONTENT_PADDING;
  const usableWidth = contentWidth - (padding * 2);
  
  const cardWidth = (usableWidth - (gap * (PDF_LAYOUT.COLUMNS - 1))) / PDF_LAYOUT.COLUMNS;
  
  // 🚀 ALTURA DINÁMICA CORREGIDA BASADA EN PRODUCTOS POR PÁGINA
  let baseCardHeight;
  
  if (productsPerPage === 4) {
    // 🔧 CORREGIDO: Reducir altura para evitar productos alargados
    baseCardHeight = Math.min(cardWidth + 35, 60); // REDUCIDO de +45,75 a +35,60
  } else if (productsPerPage === 6) {
    // 6 productos: altura estándar (SIN CAMBIOS)
    baseCardHeight = cardWidth + 35;
  } else if (productsPerPage === 9) {
    // 🔧 CORREGIDO: Aumentar altura para dar más espacio
    baseCardHeight = cardWidth + 40; // AUMENTADO de 25
  } else {
    baseCardHeight = cardWidth + 35;
  }
  
  return {
    PDF_LAYOUT,
    contentWidth: Math.floor(contentWidth * 100) / 100,
    usableWidth: Math.floor(usableWidth * 100) / 100,
    cardWidth: Math.floor(cardWidth * 100) / 100,
    cardHeight: Math.floor(baseCardHeight * 100) / 100,
    gap,
    padding,
    imageHeight: Math.floor(baseCardHeight * 0.63 * 100) / 100, // REDUCIDO de 0.68 a 0.63 (más espacio para texto)
    textHeight: Math.floor(baseCardHeight * 0.45 * 100) / 100
  };
};

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
    
    // 🆕 OBTENER PRODUCTOS POR PÁGINA DINÁMICOS
    const productsPerPage = options.productsPerPage || 6;
    
    try {
      console.log('🚀 Generando PDF con layout dinámico CORREGIDO...', {
        products: products.length,
        productsPerPage,
        expectedPages: Math.ceil(products.length / productsPerPage),
        layout: 'dynamic-corrected'
      });
      
      // 🔧 CALCULAR DIMENSIONES DINÁMICAS CORREGIDAS
      const LAYOUT = calculateDynamicDimensions(productsPerPage);
      const totalPages = Math.ceil(products.length / productsPerPage);
      
      // 🔧 DEBUG ESPECÍFICO PARA 2x2
      if (productsPerPage === 4) {
        console.log('🔍 DEBUG Grid 2x2 - Aplicando fixes específicos:', {
          cardHeight: LAYOUT.cardHeight,
          totalGridHeight: LAYOUT.cardHeight * 2 + LAYOUT.gap,
          gap: LAYOUT.gap,
          productos: products.length,
          slotsRequeridos: 4
        });
      }
      
      if (options.onProgress) options.onProgress(5);
      
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // ✅ HTML con layout dinámico CORREGIDO
      const htmlContent = this.generateDynamicHTML(
        products, 
        businessInfo, 
        template, 
        options.quality || 'medium', 
        options,
        productsPerPage
      );
      
      if (options.onProgress) options.onProgress(30);
      
      // ✅ PDF Options dinámicos CORREGIDOS
      const pdfOptions = this.getDynamicPDFOptions(options, businessInfo, template, productsPerPage);
      
      const pdfBlob = await this.generatePDFWithRetry(htmlContent, pdfOptions, businessInfo, options.onProgress);
      
      if (options.onProgress) options.onProgress(90);
      
      // Storage y descarga
      if (options.catalogId) {
        const storageResult = await PDFStorageManager.saveAndLinkPDF(
          pdfBlob,
          options.catalogId,
          businessInfo.business_name,
          {
            pdf_size_bytes: pdfBlob.size,
            generation_completed_at: new Date().toISOString(),
            generation_method: 'puppeteer_dynamic_corrected',
            products_per_page: productsPerPage,
            layout_config: LAYOUT.PDF_LAYOUT,
            grid_2x2_fixed: productsPerPage === 4
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
      console.error('❌ Error en PDF dinámico CORREGIDO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  // 🔧 HTML CON LAYOUT DINÁMICO CORREGIDO
  private static generateDynamicHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    options: PuppeteerServiceOptions = {},
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    
    const pagesHTML = this.generateDynamicPages(products, businessInfo, template, quality, productsPerPage);
    const pageTitle = options.catalogTitle || `Catálogo ${businessInfo.business_name}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <meta name="products-per-page" content="${productsPerPage}">
  <meta name="layout" content="corrected">
  <meta name="grid-fix" content="${productsPerPage === 4 ? '2x2-fixed' : 'original'}">
  <title>${pageTitle}</title>
  <style>
    ${this.generateDynamicCSS(template, quality, productsPerPage)}
  </style>
</head>
<body class="dynamic-body">
  ${pagesHTML}
</body>
</html>`;
  }
  
  // 🔧 CSS CON LAYOUT DINÁMICO CORREGIDO + FIX 2x2
  private static generateDynamicCSS(
    template: TemplateConfig, 
    quality: 'low' | 'medium' | 'high',
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    const qualityConfig = {
      low: { fontSize: 9, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    const LAYOUT = calculateDynamicDimensions(productsPerPage);
    const PDF_LAYOUT = LAYOUT.PDF_LAYOUT;
    
    // 🎯 ESCALAS DINÁMICAS CORREGIDAS
    const scaleMap = {
      4: { layout: 1.2, font: 1.1, padding: 1.2 }, // AJUSTADO para 4
      6: { layout: 1.0, font: 1.0, padding: 1.0 }, // Estándar para 6
      9: { layout: 0.85, font: 0.9, padding: 0.85 }  // AJUSTADO para 9
    };
    
    const scale = scaleMap[productsPerPage];
    
    return `
      /* 🔧 CSS DINÁMICO CORREGIDO PARA ${productsPerPage} PRODUCTOS POR PÁGINA + FIX 2x2 */
      
      /* RESET NORMAL */
      *, *::before, *::after {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* @PAGE DINÁMICO */
      @page {
        size: A4 portrait;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
      }
      
      /* HTML ESCALADO */
      html {
        font-size: ${Math.round(config.fontSize * scale.font)}pt !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      
      /* BODY ESCALADO */
      body.dynamic-body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${Math.round(config.fontSize * scale.font)}pt !important;
        color: ${template.colors.text} !important;
        background: ${template.colors.background} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 100vh !important;
        clear: both !important;
        float: none !important;
        display: block !important;
      }
      
      /* PÁGINA INDIVIDUAL DINÁMICA CORREGIDA */
      .page-container-dynamic {
        width: 100% !important;
        margin: 0 !important;
        padding: ${PDF_LAYOUT.HEADER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm ${PDF_LAYOUT.FOOTER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        display: block !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      .page-container-dynamic:not(:first-child) {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .page-container-dynamic:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      
      /* CONTENIDO PRINCIPAL DINÁMICO CORREGIDO */
      .page-content-dynamic {
        width: 100% !important;
        padding: ${Math.round(LAYOUT.padding * scale.padding)}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        margin-top: ${productsPerPage === 4 ? 20 : Math.round(PDF_LAYOUT.HEADER_TO_CONTENT_GAP * scale.padding)}mm !important;
        margin-bottom: ${Math.round(PDF_LAYOUT.HEADER_TO_CONTENT_GAP * scale.padding)}mm !important;
      }
      
      /* 🚀 GRID DINÁMICO CORREGIDO + FIX CRÍTICO PARA 2x2 */
      .products-grid-dynamic {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(${PDF_LAYOUT.COLUMNS}, 1fr) !important;
        
        /* 🔧 FIX CRÍTICO: Altura fija para 2x2, auto para otros */
        ${productsPerPage === 4 ? 
          `grid-template-rows: auto auto !important;
           height: calc(${Math.round(LAYOUT.cardHeight * scale.layout * 2 + LAYOUT.gap * scale.padding)}mm + 10mm) !important;
           max-height: calc(${Math.round(LAYOUT.cardHeight * scale.layout * 2 + LAYOUT.gap * scale.padding)}mm + 15mm) !important;` :
          `grid-template-rows: repeat(${PDF_LAYOUT.ROWS}, auto) !important;`
        }
        
        gap: ${Math.round(LAYOUT.gap * scale.padding)}mm !important;
        
        /* 🔧 JUSTIFICACIÓN ESPECÍFICA POR LAYOUT CORREGIDAS */
        ${productsPerPage === 4 ? 
          `justify-items: center !important;
           align-items: start !important;
           place-content: start center !important;` :
          `justify-items: center !important;
           align-items: start !important;`
        }
        
        grid-auto-rows: auto !important;
        overflow: visible !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
        padding: ${Math.round(2 * scale.padding)}mm 0 !important;
      }
      
      /* 🚀 PRODUCT CARDS DINÁMICAS CORREGIDAS + FIX 2x2 */
      .product-card-dynamic {
        width: 100% !important;
        
        /* 🔧 FIX ALTURA ESPECÍFICA PARA 2x2 */
        ${productsPerPage === 4 ? 
          `height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
           min-height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
           max-height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;` :
          `height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
           min-height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
           max-height: none !important;`
        }
        
        background: white !important;
        border: ${Math.round(0.5 * scale.layout)}pt solid ${template.colors.accent}60 !important;
        border-radius: ${Math.round(6 * scale.layout)}px !important;
        overflow: visible !important;
        box-shadow: 0 ${Math.round(2 * scale.layout)}pt ${Math.round(4 * scale.layout)}pt rgba(0,0,0,0.12) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
        break-before: auto !important;
        break-after: auto !important;
        
        padding: ${Math.round(PDF_LAYOUT.CARD_INTERNAL_PADDING * scale.padding)}mm !important;
        gap: ${Math.round(2 * scale.padding)}mm !important;
        
        /* 🔧 POSICIONAMIENTO ESPECÍFICO POR LAYOUT CORREGIDAS */
        ${productsPerPage === 4 ? 
          `align-self: start !important;
           justify-self: center !important;` :
          `align-self: stretch !important;
           justify-self: center !important;`
        }
      }
      
      /* IMAGEN CONTAINER DINÁMICO CORREGIDO */
      .image-container-dynamic {
        flex: 0 0 ${Math.round(LAYOUT.imageHeight * scale.layout)}mm !important;
        height: ${Math.round(LAYOUT.imageHeight * scale.layout)}mm !important;
        min-height: ${Math.round(LAYOUT.imageHeight * scale.layout)}mm !important;
        max-height: ${Math.round(LAYOUT.imageHeight * scale.layout)}mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #f8f9fa !important;
        padding: ${Math.round(2 * scale.padding)}mm !important;
        overflow: hidden !important;
        position: relative !important;
        border-radius: ${Math.round(3 * scale.layout)}px !important;
      }
      
      /* IMAGEN DINÁMICA CORREGIDA */
      .product-image-dynamic {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: cover !important;
        object-position: center !important;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        will-change: auto !important;
      }
      
      .image-placeholder-dynamic {
        width: ${Math.round((LAYOUT.imageHeight - 6) * scale.layout)}mm !important;
        height: ${Math.round((LAYOUT.imageHeight - 6) * scale.layout)}mm !important;
        background: repeating-conic-gradient(from 0deg at 50% 50%, #f0f0f0 0deg 90deg, transparent 90deg 180deg) !important;
        background-size: ${Math.round(6 * scale.layout)}px ${Math.round(6 * scale.layout)}px !important;
        border: ${Math.round(1 * scale.layout)}pt dashed #ccc !important;
        border-radius: ${Math.round(3 * scale.layout)}px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      
      .placeholder-content-dynamic {
        color: #999 !important;
        font-size: ${Math.round(8 * scale.font)}pt !important;
        text-align: center !important;
        line-height: 1.2 !important;
      }
      
      /* ÁREA DE TEXTO DINÁMICA CORREGIDA */
      .text-area-dynamic {
        flex: 1 1 auto !important;
        min-height: ${Math.round(LAYOUT.textHeight * scale.layout)}mm !important;
        height: auto !important;
        max-height: none !important;
        padding: ${Math.round(2 * scale.padding)}mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: center !important;
        overflow: visible !important;
        position: relative !important;
        background: white !important;
        gap: ${Math.round(1 * scale.padding)}mm !important;
      }
      
      .product-name-dynamic {
        font-size: ${Math.round(config.nameSize * scale.font)}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin-bottom: 0 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        text-align: center !important;
        line-height: 1.3 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      /* SISTEMA DE PRECIOS DINÁMICO CORREGIDO */
      .product-pricing-dynamic {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: ${Math.round(1 * scale.padding)}mm !important;
        margin: 0 !important;
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        min-height: 0 !important;
      }

      /* PRECIO RETAIL DINÁMICO CORREGIDO */
      .product-price-retail-dynamic {
        font-size: ${Math.round(config.priceSize * scale.font)}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: ${Math.round(1.5 * scale.padding)}mm ${Math.round(3 * scale.padding)}mm !important;
        border-radius: ${Math.round(8 * scale.layout)}px !important;
        display: inline-block !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 ${Math.round(1 * scale.layout)}pt ${Math.round(3 * scale.layout)}pt rgba(0,0,0,0.2) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
        line-height: 1.2 !important;
        margin: 0 !important;
      }

      /* PRECIO MAYOREO DINÁMICO CORREGIDO */
      .product-price-wholesale-dynamic {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: ${Math.round(1 * scale.padding)}mm !important;
        font-size: ${Math.round(Math.max(config.priceSize - 2, 6) * scale.font)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        padding: ${Math.round(2 * scale.padding)}mm !important;
        border-radius: ${Math.round(4 * scale.layout)}px !important;
        border: ${Math.round(0.25 * scale.layout)}pt solid ${template.colors.accent}50 !important;
        width: 90% !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        overflow: visible !important;
        position: static !important;
        flex-shrink: 0 !important;
        min-height: ${Math.round(8 * scale.layout)}mm !important;
        position: relative !important;
        z-index: 2 !important;
        margin: 0 !important;
      }
      
      .wholesale-label-dynamic {
        font-size: ${Math.round(Math.max(config.priceSize - 3, 5) * scale.font)}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin: 0 !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3pt !important;
      }
      
      .wholesale-price-dynamic {
        font-size: ${Math.round(Math.max(config.priceSize - 1, 7) * scale.font)}pt !important;
        font-weight: 700 !important;
        color: ${template.colors.secondary} !important;
        margin: 0 !important;
        line-height: 1.1 !important;
      }
      
      .wholesale-min-dynamic {
        font-size: ${Math.round(Math.max(config.priceSize - 4, 5) * scale.font)}pt !important;
        color: ${template.colors.text}60 !important;
        font-weight: 400 !important;
        font-style: italic !important;
        line-height: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* 🔧 MEDIA PRINT DINÁMICO CORREGIDO + FIX 2x2 */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          width: auto !important;
          height: auto !important;
        }
        
        .page-container-dynamic,
        .page-content-dynamic {
          overflow: visible !important;
          position: relative !important;
          height: auto !important;
        }
        
        .page-container-dynamic {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        
        .page-container-dynamic:not(:first-child) {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .page-container-dynamic:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        /* 🚀 PRINT FIXES COMPLETOS PARA 2x2 */
        ${productsPerPage === 4 ? `
          html {
            height: auto !important;
            min-height: 0 !important;
          }
          
          body {
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .page-container-dynamic {
            margin-top: 0 !important;
            padding-top: ${PDF_LAYOUT.HEADER_MARGIN + 5}mm !important;
          }
          
          .page-content-dynamic {
            margin-top: ${PDF_LAYOUT.HEADER_TO_CONTENT_GAP + 5}mm !important;
          }
          
          * {
            overflow: visible !important;
            position: static !important;
            float: none !important;
          }
          
          .products-grid-dynamic {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            
            grid-template-rows: auto auto !important;
            grid-auto-rows: auto !important;
            
            overflow: visible !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          
          .product-card-dynamic {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            
            margin-bottom: 8mm !important;
            padding-bottom: 3mm !important;
          }
          
          .text-area-dynamic,
          .product-pricing-dynamic,
          .product-price-wholesale-dynamic {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            position: static !important;
          }
        ` : `
          /* Print normal para 3x2 y 3x3 (SIN CAMBIOS) */
          .products-grid-dynamic {
            overflow: visible !important;
            position: relative !important;
            height: auto !important;
            page-break-inside: auto !important;
            grid-auto-rows: calc(${Math.round(LAYOUT.cardHeight * scale.layout)}mm + 5mm) !important;
          }
          
          .product-card-dynamic {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            max-height: none !important;
            min-height: calc(${Math.round(LAYOUT.cardHeight * scale.layout)}mm + 3mm) !important;
          }
        `}
        
        .text-area-dynamic {
          overflow: visible !important;
          height: auto !important;
          min-height: calc(${Math.round(LAYOUT.textHeight * scale.layout)}mm + 3mm) !important;
        }
        
        .product-pricing-dynamic {
          overflow: visible !important;
          height: auto !important;
          gap: ${Math.round(2 * scale.padding)}mm !important;
          min-height: ${Math.round(15 * scale.layout)}mm !important;
        }
        
        .product-price-wholesale-dynamic {
          overflow: visible !important;
          min-height: ${Math.round(10 * scale.layout)}mm !important;
          padding: ${Math.round(2 * scale.padding)}mm !important;
          margin-top: ${Math.round(1 * scale.padding)}mm !important;
          position: relative !important;
          z-index: 10 !important;
        }
        
        .product-image-dynamic {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
      
      /* ELIMINACIÓN DE PSEUDO-ELEMENTOS PROBLEMÁTICOS */
      .product-card-dynamic::before,
      .product-card-dynamic::after {
        display: none !important;
        content: none !important;
      }
      
      /* 🔧 OPTIMIZACIONES ESPECÍFICAS POR PRODUCTOS POR PÁGINA CORREGIDAS */
      ${this.getLayoutSpecificCSS(productsPerPage, template)}
    `;
  }
  
  private static getLayoutSpecificCSS(productsPerPage: 4 | 6 | 9, template: TemplateConfig): string {
    switch (productsPerPage) {
      case 4:
        return `
          /* Optimizaciones específicas para 2x2 */
          .products-grid-dynamic {
            justify-content: center !important;
            align-content: start !important;
          }
          
          .product-card-dynamic {
            max-width: 45% !important;
          }
        `;
      case 9:
        return `
          /* Optimizaciones específicas para 3x3 */
          .product-name-dynamic {
            -webkit-line-clamp: 1 !important;
          }
          
          .product-pricing-dynamic {
            gap: 1mm !important;
          }
        `;
      default:
        return '';
    }
  }
  
  private static async checkServiceHealthWithRetry(): Promise<boolean> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`${this.SERVICE_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.status === 'healthy';
        }
      } catch (error) {
        console.warn(`Health check attempt ${retries + 1} failed:`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    return false;
  }
  
  private static generateDynamicPages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    productsPerPage: 4 | 6 | 9
  ): string {
    const totalPages = Math.ceil(products.length / productsPerPage);
    let pagesHTML = '';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      const productsHTML = pageProducts.map(product => this.generateProductCard(product, template, quality)).join('');
      
      pagesHTML += `
        <div class="page-container-dynamic">
          <div class="page-content-dynamic">
            <div class="products-grid-dynamic">
              ${productsHTML}
            </div>
          </div>
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  private static generateProductCard(product: Product, template: TemplateConfig, quality: 'low' | 'medium' | 'high'): string {
    const imageHTML = product.image_url ? 
      `<img src="${product.image_url}" alt="${product.name}" class="product-image-dynamic" loading="eager">` :
      `<div class="image-placeholder-dynamic">
         <div class="placeholder-content-dynamic">Sin imagen</div>
       </div>`;
    
    const wholesalePriceHTML = product.price_wholesale && product.wholesale_min_qty ? `
      <div class="product-price-wholesale-dynamic">
        <div class="wholesale-label-dynamic">Mayoreo</div>
        <div class="wholesale-price-dynamic">$${product.price_wholesale.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
        <div class="wholesale-min-dynamic">Mín. ${product.wholesale_min_qty} pzs</div>
      </div>
    ` : '';
    
    return `
      <div class="product-card-dynamic">
        <div class="image-container-dynamic">
          ${imageHTML}
        </div>
        <div class="text-area-dynamic">
          <h3 class="product-name-dynamic">${product.name}</h3>
          <div class="product-pricing-dynamic">
            <div class="product-price-retail-dynamic">
              $${product.price_retail.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            ${wholesalePriceHTML}
          </div>
        </div>
      </div>
    `;
  }
  
  private static getDynamicPDFOptions(
    options: PuppeteerServiceOptions,
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    productsPerPage: 4 | 6 | 9
  ) {
    const LAYOUT = calculateDynamicDimensions(productsPerPage);
    
    return {
      format: options.format || 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: options.margin || {
        top: `${LAYOUT.PDF_LAYOUT.HEADER_MARGIN}mm`,
        right: `${LAYOUT.PDF_LAYOUT.SIDE_MARGIN}mm`,
        bottom: `${LAYOUT.PDF_LAYOUT.FOOTER_MARGIN}mm`,
        left: `${LAYOUT.PDF_LAYOUT.SIDE_MARGIN}mm`
      },
      width: '210mm',
      height: '297mm',
      timeout: this.TIMEOUT,
      waitUntil: 'networkidle0',
      omitBackground: false,
      quality: options.quality || 'medium'
    };
  }
  
  private static async generatePDFWithRetry(
    htmlContent: string,
    pdfOptions: any,
    businessInfo: BusinessInfo,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        if (onProgress) onProgress(40 + (retries * 10));
        
        const response = await fetch(`${this.SERVICE_URL}/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: htmlContent,
            options: pdfOptions,
            businessInfo: {
              name: businessInfo.business_name,
              email: businessInfo.email,
              phone: businessInfo.phone
            }
          }),
          signal: AbortSignal.timeout(this.TIMEOUT)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const pdfBlob = await response.blob();
        
        if (pdfBlob.size === 0) {
          throw new Error('PDF generado está vacío');
        }
        
        if (onProgress) onProgress(80);
        return pdfBlob;
        
      } catch (error) {
        console.error(`PDF generation attempt ${retries + 1} failed:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          throw new Error(`Failed to generate PDF after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }
    
    throw new Error('PDF generation failed');
  }
  
  private static async downloadPDF(pdfBlob: Blob, businessName: string): Promise<void> {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalogo-${businessName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Error al descargar el PDF');
    }
  }
}
