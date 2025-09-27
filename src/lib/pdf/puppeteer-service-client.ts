// src/lib/pdf/puppeteer-service-client.ts
// 🎯 VERSIÓN CORREGIDA PARA PROBLEMAS DE 4 Y 9 PRODUCTOS

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
      HEADER_MARGIN: 12,     // REDUCIDO de 15
      FOOTER_MARGIN: 10,     // REDUCIDO de 12
      SIDE_MARGIN: 10,       // REDUCIDO de 12
      HEADER_HEIGHT: 10,     // REDUCIDO de 12
      FOOTER_HEIGHT: 6,      // REDUCIDO de 8
      COLUMNS: 2,
      ROWS: 2,
      PRODUCTS_PER_PAGE: 4,
      HEADER_TO_CONTENT_GAP: 8,  // REDUCIDO de 10
      GRID_GAP: 10,             // AUMENTADO de 8
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
    baseCardHeight = cardWidth + 30; // REDUCIDO de 50
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
    imageHeight: Math.floor(baseCardHeight * 0.55 * 100) / 100,
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
            layout_config: LAYOUT.PDF_LAYOUT
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
  
  // 🔧 CSS CON LAYOUT DINÁMICO CORREGIDO
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
      /* 🔧 CSS DINÁMICO CORREGIDO PARA ${productsPerPage} PRODUCTOS POR PÁGINA */
      
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
        margin-top: ${Math.round(PDF_LAYOUT.HEADER_TO_CONTENT_GAP * scale.padding)}mm !important;
        margin-bottom: ${Math.round(PDF_LAYOUT.HEADER_TO_CONTENT_GAP * scale.padding)}mm !important;
      }
      
      /* GRID DINÁMICO CORREGIDO */
      .products-grid-dynamic {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(${PDF_LAYOUT.COLUMNS}, 1fr) !important;
        grid-template-rows: repeat(${PDF_LAYOUT.ROWS}, auto) !important;
        gap: ${Math.round(LAYOUT.gap * scale.padding)}mm !important;
        justify-items: ${this.getGridJustifyItems(productsPerPage)} !important;
        align-items: start !important;
        grid-auto-rows: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
        padding: ${Math.round(2 * scale.padding)}mm 0 !important;
        
        /* 🔧 CORRECCIONES ESPECÍFICAS POR LAYOUT */
        ${this.getGridSpecificCorrections(productsPerPage)}
      }
      
      /* PRODUCT CARDS DINÁMICAS CORREGIDAS */
      .product-card-dynamic {
        width: ${this.getCardWidth(productsPerPage)} !important;
        height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
        min-height: ${Math.round(LAYOUT.cardHeight * scale.layout)}mm !important;
        max-height: none !important;
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
        gap: ${Math.round(this.getCardGap(productsPerPage) * scale.padding)}mm !important;
        
        /* 🔧 OPTIMIZACIONES ESPECÍFICAS POR CARD CORREGIDAS */
        ${this.getCardOptimizations(productsPerPage)}
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
        padding: ${Math.round(this.getImagePadding(productsPerPage) * scale.padding)}mm !important;
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
        object-fit: ${this.getImageObjectFit(productsPerPage)} !important;
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
        padding: ${Math.round(this.getTextPadding(productsPerPage) * scale.padding)}mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: center !important;
        overflow: visible !important;
        position: relative !important;
        background: white !important;
        gap: ${Math.round(this.getTextGap(productsPerPage) * scale.padding)}mm !important;
      }
      
      .product-name-dynamic {
        font-size: ${Math.round(config.nameSize * scale.font)}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin-bottom: 0 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getNameLinesForLayout(productsPerPage)} !important;
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
        gap: ${Math.round(this.getPricingGap(productsPerPage) * scale.padding)}mm !important;
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
        padding: ${Math.round(this.getRetailPricePadding(productsPerPage) * scale.padding)}mm ${Math.round(this.getRetailPricePaddingHorizontal(productsPerPage) * scale.padding)}mm !important;
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
      }

      /* PRECIO MAYOREO DINÁMICO CORREGIDO */
      .product-price-wholesale-dynamic {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 90% !important;
        font-size: ${Math.round(Math.max(config.priceSize - 2, 6) * scale.font)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        padding: ${Math.round(this.getWholesalePadding(productsPerPage) * scale.padding)}mm !important;
        border-radius: ${Math.round(4 * scale.layout)}px !important;
        border: ${Math.round(0.25 * scale.layout)}pt solid ${template.colors.accent}50 !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
        gap: ${Math.round(0.8 * scale.padding)}mm !important;
        min-height: ${Math.round(this.getWholesaleMinHeight(productsPerPage) * scale.layout)}mm !important;
        position: relative !important;
        z-index: 2 !important;
      }
      
      .wholesale-label-dynamic {
        font-size: ${Math.round(Math.max(config.priceSize - 3, 5) * scale.font)}pt !important;
        font-weight: 500 !important;
        color: ${template.colors.text}80 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1pt !important;
        line-height: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .wholesale-price-dynamic {
        font-weight: 700 !important;
        color: ${template.colors.primary} !important;
        font-size: ${Math.round(Math.max(config.priceSize - 1, 7) * scale.font)}pt !important;
        line-height: 1.1 !important;
        margin: 0 !important;
        padding: 0 !important;
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
      
      /* MEDIA PRINT DINÁMICO CORREGIDO */
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
        .page-content-dynamic,
        .products-grid-dynamic {
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
        
        .product-card-dynamic {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: visible !important;
          max-height: none !important;
          min-height: calc(${Math.round(LAYOUT.cardHeight * scale.layout)}mm + ${Math.round(this.getPrintExtraHeight(productsPerPage) * scale.padding)}mm) !important;
        }
        
        .product-image-dynamic {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .text-area-dynamic {
          overflow: visible !important;
          height: auto !important;
          min-height: calc(${Math.round(LAYOUT.textHeight * scale.layout)}mm + ${Math.round(this.getPrintTextExtraHeight(productsPerPage) * scale.padding)}mm) !important;
        }
        
        .product-pricing-dynamic {
          overflow: visible !important;
          height: auto !important;
          gap: ${Math.round(this.getPricingGap(productsPerPage) + 1 * scale.padding)}mm !important;
          min-height: ${Math.round(15 * scale.layout)}mm !important;
        }
        
        .product-price-wholesale-dynamic {
          overflow: visible !important;
          min-height: ${Math.round(this.getWholesaleMinHeight(productsPerPage) + 2 * scale.layout)}mm !important;
          padding: ${Math.round(this.getWholesalePadding(productsPerPage) + 0.5 * scale.padding)}mm !important;
          margin-top: ${Math.round(1 * scale.padding)}mm !important;
          position: relative !important;
          z-index: 10 !important;
        }
        
        .products-grid-dynamic {
          grid-auto-rows: calc(${Math.round(LAYOUT.cardHeight * scale.layout)}mm + ${Math.round(this.getPrintExtraHeight(productsPerPage) * scale.padding)}mm) !important;
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
  
  // 🔧 NUEVAS FUNCIONES PARA CORREGIR PROBLEMAS ESPECÍFICOS
  
  // Grid justify items específico por layout
  private static getGridJustifyItems(productsPerPage: 4 | 6 | 9): string {
    const justifyMap = { 4: 'center', 6: 'center', 9: 'stretch' };
    return justifyMap[productsPerPage];
  }
  
  // Ancho de card específico
  private static getCardWidth(productsPerPage: 4 | 6 | 9): string {
    const widthMap = { 4: '100%', 6: '100%', 9: '100%' };
    return widthMap[productsPerPage];
  }
  
  // Gap interno de card
  private static getCardGap(productsPerPage: 4 | 6 | 9): number {
    const gaps = { 4: 3, 6: 2, 9: 2.5 }; // 9: Más gap interno
    return gaps[productsPerPage];
  }
  
  // Padding de imagen
  private static getImagePadding(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 2.5, 6: 2, 9: 2.2 }; // 9: Más padding
    return paddings[productsPerPage];
  }
  
  // Padding de texto
  private static getTextPadding(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 2, 6: 1, 9: 1.5 }; // 9: Más padding de texto
    return paddings[productsPerPage];
  }
  
  // Gap entre texto
  private static getTextGap(productsPerPage: 4 | 6 | 9): number {
    const gaps = { 4: 2.5, 6: 1.5, 9: 2 }; // 9: Más gap entre texto
    return gaps[productsPerPage];
  }
  
  // Gap entre precios
  private static getPricingGap(productsPerPage: 4 | 6 | 9): number {
    const gaps = { 4: 3, 6: 2.5, 9: 2.8 }; // 9: Más gap entre precios
    return gaps[productsPerPage];
  }
  
  // Padding del precio retail
  private static getRetailPricePadding(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 2, 6: 1.5, 9: 1.8 }; // Solo el valor vertical
    return paddings[productsPerPage];
  }
  
  // Padding horizontal del precio retail
  private static getRetailPricePaddingHorizontal(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 4, 6: 3, 9: 3.5 };
    return paddings[productsPerPage];
  }
  
  // Padding del precio wholesale
  private static getWholesalePadding(productsPerPage: 4 | 6 | 9): number {
    const paddings = { 4: 2.5, 6: 2, 9: 2.5 }; // 9: Más padding
    return paddings[productsPerPage];
  }
  
  // Altura mínima del wholesale
  private static getWholesaleMinHeight(productsPerPage: 4 | 6 | 9): number {
    const heights = { 4: 12, 6: 8, 9: 10 }; // 9: Más altura
    return heights[productsPerPage];
  }
  
  // Extra height para print
  private static getPrintExtraHeight(productsPerPage: 4 | 6 | 9): number {
    const extras = { 4: 8, 6: 8, 9: 12 }; // 9: Más altura extra en print
    return extras[productsPerPage];
  }
  
  // Extra height para texto en print  
  private static getPrintTextExtraHeight(productsPerPage: 4 | 6 | 9): number {
    const extras = { 4: 6, 6: 5, 9: 8 }; // 9: Más altura de texto en print
    return extras[productsPerPage];
  }
  
  // 🎯 CORRECCIONES ESPECÍFICAS POR GRID
  private static getGridSpecificCorrections(productsPerPage: 4 | 6 | 9): string {
    if (productsPerPage === 4) {
      return `
        /* CORRECCIONES PARA 4 PRODUCTOS - 2x2 */
        grid-template-rows: repeat(2, 1fr) !important;
        place-items: center !important;
      `;
    } else if (productsPerPage === 9) {
      return `
        /* CORRECCIONES PARA 9 PRODUCTOS - 3x3 */
        grid-template-rows: repeat(3, 1fr) !important;
        place-items: stretch !important;
      `;
    }
    return '';
  }
  
  // 🎯 OPTIMIZACIONES POR CARD CORREGIDAS
  private static getCardOptimizations(productsPerPage: 4 | 6 | 9): string {
    if (productsPerPage === 4) {
      return `
        justify-self: center;
        max-width: 95%;
        min-width: 85%;
      `;
    } else if (productsPerPage === 9) {
      return `
        justify-self: stretch;
        max-width: 100%;
        min-width: 100%;
      `;
    }
    return `
      justify-self: center;
      max-width: 100%;
    `;
  }
  
  // 🎯 LÍNEAS DE NOMBRE POR LAYOUT CORREGIDAS
  private static getNameLinesForLayout(productsPerPage: 4 | 6 | 9): number {
    const lineMap = { 4: 3, 6: 2, 9: 2 }; // 9: Permitir 2 líneas
    return lineMap[productsPerPage];
  }
  
  // 🎯 OBJECT FIT POR LAYOUT
  private static getImageObjectFit(productsPerPage: 4 | 6 | 9): string {
    return productsPerPage === 9 ? 'cover' : 'contain';
  }
  
  // 🎯 CSS ESPECÍFICO POR LAYOUT CORREGIDO
  private static getLayoutSpecificCSS(productsPerPage: 4 | 6 | 9, template: TemplateConfig): string {
    if (productsPerPage === 4) {
      return `
        /* OPTIMIZACIONES PARA 4 PRODUCTOS - LAYOUT ESPACIOSO CORREGIDO */
        .products-grid-dynamic {
          justify-items: center;
          align-items: center;
          place-content: center;
          grid-template-rows: repeat(2, 1fr) !important;
          grid-template-columns: repeat(2, 1fr) !important;
        }
        
        .product-card-dynamic {
          transform: scale(1.0);
          justify-self: center !important;
        }
      `;
    } else if (productsPerPage === 9) {
      return `
        /* OPTIMIZACIONES PARA 9 PRODUCTOS - LAYOUT COMPACTO CORREGIDO */
        .products-grid-dynamic {
          justify-items: stretch;
          align-items: stretch;
          place-content: stretch;
          grid-template-rows: repeat(3, 1fr) !important;
          grid-template-columns: repeat(3, 1fr) !important;
        }
        
        .product-card-dynamic {
          border-width: 0.25pt !important;
          justify-self: stretch !important;
        }
        
        .product-image-dynamic {
          object-fit: cover !important;
        }
        
        .text-area-dynamic {
          gap: 2.5mm !important;
        }
        
        .product-pricing-dynamic {
          gap: 3mm !important;
        }
      `;
    }
    return '';
  }
  
  // ===== RESTO DE FUNCIONES SIN CAMBIOS CRÍTICOS =====
  
  private static generateDynamicPages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: string,
    productsPerPage: 4 | 6 | 9 = 6
  ): string {
    
    const totalPages = Math.ceil(products.length / productsPerPage);
    let pagesHTML = '';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      if (pageProducts.length === 0) continue;
      
      pagesHTML += `
        <div class="page-container-dynamic">
          <div class="page-content-dynamic">
            ${this.generateDynamicGrid(pageProducts, productsPerPage)}
          </div>
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  private static generateDynamicGrid(products: Product[], productsPerPage: 4 | 6 | 9): string {
    let gridHTML = '<div class="products-grid-dynamic">';
    
    // Rellenar con productos
    products.forEach(product => {
      gridHTML += this.generateDynamicProductCard(product);
    });
    
    // Rellenar con cards vacías si es necesario
    const emptyCardsNeeded = productsPerPage - products.length;
    for (let i = 0; i < emptyCardsNeeded; i++) {
      gridHTML += '<div class="product-card-dynamic" style="visibility: hidden;"></div>';
    }
    
    gridHTML += '</div>';
    return gridHTML;
  }
  
  private static generateDynamicProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}"
         class="product-image-dynamic" 
         loading="eager" 
         crossorigin="anonymous"
         onload="this.style.opacity=1"
         onerror="this.style.display='none'"
       />` :
      `<div class="image-placeholder-dynamic">
         <div class="placeholder-content-dynamic">
           <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    const wholesalePriceHTML = product.price_wholesale ? `
      <div class="product-price-wholesale-dynamic">
        <span class="wholesale-label-dynamic">Mayoreo:</span>
        <span class="wholesale-price-dynamic">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</span>
        ${product.wholesale_min_qty ? `
          <span class="wholesale-min-dynamic">Min. ${product.wholesale_min_qty}</span>
        ` : ''}
      </div>
    ` : '';
    
    return `
      <div class="product-card-dynamic">
        <div class="image-container-dynamic">
          ${imageHTML}
        </div>
        
        <div class="text-area-dynamic">
          <div class="product-name-dynamic">${productName}</div>
          <div class="product-pricing-dynamic">
            <div class="product-price-retail-dynamic">$${(productPrice / 100).toLocaleString('es-MX', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</div>
            ${wholesalePriceHTML}
          </div>
        </div>
      </div>
    `;
  }
  
  private static getDynamicPDFOptions(
    options: PuppeteerServiceOptions, 
    businessInfo: BusinessInfo, 
    template?: TemplateConfig,
    productsPerPage: 4 | 6 | 9 = 6
  ): any {
    
    const PDF_LAYOUT = getDynamicPDFLayout(productsPerPage);
    const primaryColor = template?.colors?.primary || '#007BFF';
    const secondaryColor = template?.colors?.secondary || '#0056B3';
    const contactInfo = this.generateSmartContactInfo(businessInfo);
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
      
      headerTemplate: `<div style="font-size: 12px !important; width: 100% !important; height: ${PDF_LAYOUT.HEADER_HEIGHT}mm !important; text-align: center !important; background: ${primaryColor} !important; background-image: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important; color: white !important; padding: 2mm !important; margin: 0 !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: table !important; table-layout: fixed !important;"><div style="display: table-cell; vertical-align: middle; text-align: center;"><strong style="color: white !important; font-size: 14px !important;">${businessInfo.business_name || 'Mi Negocio'}</strong><br><span style="color: rgba(255,255,255,0.9) !important; font-size: 10px !important;">${catalogTitle}</span></div></div>`,

      footerTemplate: `<div style="font-size: 9px !important; width: 100% !important; height: ${PDF_LAYOUT.FOOTER_HEIGHT}mm !important; text-align: center !important; background: ${secondaryColor} !important; color: white !important; padding: 1mm !important; margin: 0 !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: table !important; table-layout: fixed !important;"><div style="display: table-cell; vertical-align: middle; text-align: center;">${contactInfo ? `<div style="color: white !important; font-size: 8px !important; margin-bottom: 1mm !important;">${contactInfo}</div>` : ''}</div></div>`,
      landscape: false,
      
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
  
  // ===== MÉTODOS SIN CAMBIOS =====
  
private static generateSmartContactInfo(businessInfo: BusinessInfo): string {
    const contactItems: string[] = [];
    
    // Agregar teléfono (priorizar WhatsApp si existe)
    if (businessInfo.social_media?.whatsapp) {
      contactItems.push(businessInfo.social_media.whatsapp);
    } else if (businessInfo.phone) {
      contactItems.push(businessInfo.phone);
    }
    
    // Agregar email sin restricción de longitud
    if (businessInfo.email) {
      contactItems.push(businessInfo.email);
    }
    
    // Agregar website si existe
    if (businessInfo.website) {
      contactItems.push(businessInfo.website);
    }
    
    // Agregar dirección si existe y no es muy larga
    if (businessInfo.address && businessInfo.address.length <= 50) {
      contactItems.push(businessInfo.address);
    }
    
    // Mostrar hasta 4 elementos separados por ' | '
    return contactItems.slice(0, 4).join(' | ');
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
        
        const requestPayload = {
          html: htmlContent,
          options: {
            ...pdfOptions,
            emulateMediaType: 'screen',
            setViewport: {
              width: 1024,
              height: 768
            },
            waitForSelector: '.page-container-dynamic',
            waitForFunction: 'document.readyState === "complete"',
          },
          filename: `catalogo-corrected-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          debug: process.env.NODE_ENV === 'development',
          retryOnFailure: attempt < maxRetries
        };
        
        const response = await fetch(`${this.SERVICE_URL}/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf',
            'User-Agent': 'CatifyPro-PDF-Generator/2.0-Dynamic-Corrected'
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
        
        console.log(`✅ PDF dinámico CORREGIDO generado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
        return blob;
        
      } catch (error) {
        console.warn(`⚠️ Intento ${attempt}/${maxRetries} falló:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Todos los intentos de generación fallaron');
  }
  
  private static async downloadPDF(blob: Blob, businessName: string): Promise<void> {
    try {
      const downloadUrl = URL.createObjectURL(blob);
      const filename = `catalogo-corrected-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
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
      await this.downloadPDF(blob, 'test-dynamic-corrected');
      
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

// 🚀 FUNCIÓN EXPORTADA CON PRODUCTOS POR PÁGINA DINÁMICOS CORREGIDA
export const generatePDFWithPuppeteer = async (
  products: Product[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  options?: PuppeteerServiceOptions
): Promise<PuppeteerResult> => {
  return PuppeteerServiceClient.generatePDF(products, businessInfo, template, options);
};