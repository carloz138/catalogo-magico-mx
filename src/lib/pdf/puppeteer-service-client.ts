// src/lib/pdf/puppeteer-service-client.ts
// 🎯 VERSIÓN FINAL: ELIMINACIÓN COMPLETA DEL RECUADRO BLANCO

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

// ✅ MANTENER DELTA DE PRECISIÓN
const PRECISION_DELTA = 0.5;

// 🚀 CONFIGURACIÓN FINAL LIMPIA
const PDF_LAYOUT = {
  // 🚨 MANTENER INTACTOS - NO CAMBIAR (funcionan bien con header/footer)
  HEADER_MARGIN: 15, // NO CAMBIAR
  FOOTER_MARGIN: 12, // NO CAMBIAR
  SIDE_MARGIN: 10,   // NO CAMBIAR
  HEADER_HEIGHT: 10, // NO CAMBIAR
  FOOTER_HEIGHT: 6,  // NO CAMBIAR
  
  // 🚨 MANTENER INTACTOS
  COLUMNS: 3,
  ROWS: 2,
  PRODUCTS_PER_PAGE: 6,
  
  // 🔧 OPTIMIZACIONES FINALES
  HEADER_TO_CONTENT_GAP: 8,
  GRID_GAP: 5,
  CONTENT_PADDING: 4,
  CARD_INTERNAL_PADDING: 4,
};

// 🔧 CÁLCULOS FINALES LIMPIOS
const calculateOptimizedDimensions = () => {
  const contentWidth = 210 - (PDF_LAYOUT.SIDE_MARGIN * 2) - PRECISION_DELTA;
  
  const gap = PDF_LAYOUT.GRID_GAP;
  const padding = PDF_LAYOUT.CONTENT_PADDING;
  const usableWidth = contentWidth - (padding * 2);
  
  const cardWidth = (usableWidth - (gap * (PDF_LAYOUT.COLUMNS - 1))) / PDF_LAYOUT.COLUMNS;
  
  // 🚀 ALTURA OPTIMIZADA FINAL
  const baseCardHeight = cardWidth + 35;
  
  return {
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

const LAYOUT = calculateOptimizedDimensions();

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
      console.log('🚀 Generando PDF con layout FINAL LIMPIO (sin recuadro blanco)...', {
        products: products.length,
        expectedPages: Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE),
        layout: LAYOUT
      });
      
      const totalPages = Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE);
      
      if (options.onProgress) options.onProgress(5);
      
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // ✅ HTML con layout FINAL LIMPIO
      const htmlContent = this.generateCleanHTML(products, businessInfo, template, options.quality || 'medium', options);
      
      if (options.onProgress) options.onProgress(30);
      
      // ✅ MANTENER PDF Options EXACTAMENTE IGUALES
      const pdfOptions = this.getMultipagePDFOptions(options, businessInfo, template);
      
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
            generation_method: 'puppeteer_final_clean'
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
      console.error('❌ Error en PDF final limpio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  // 🔧 HTML CON LAYOUT FINAL LIMPIO (SIN RECUADRO BLANCO)
  private static generateCleanHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    options: PuppeteerServiceOptions = {}
  ): string {
    
    const pagesHTML = this.generateCleanPages(products, businessInfo, template, quality);
    const pageTitle = options.catalogTitle || `Catálogo ${businessInfo.business_name}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <title>${pageTitle}</title>
  <style>
    ${this.generateCleanCSS(template, quality)}
  </style>
</head>
<body class="clean-layout-body">
  ${pagesHTML}
</body>
</html>`;
  }
  
  // 🚀 CSS COMPLETAMENTE LIMPIO (ELIMINACIÓN TOTAL DEL RECUADRO BLANCO)
  private static generateCleanCSS(template: TemplateConfig, quality: 'low' | 'medium' | 'high'): string {
    const qualityConfig = {
      low: { fontSize: 9, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* 🚀 RESET ABSOLUTO COMPLETO + ELIMINACIÓN DE RECUADRO BLANCO */
      *, *::before, *::after {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        /* 🔧 ELIMINACIÓN COMPLETA DE PSEUDO-ELEMENTOS */
        content: none !important;
        display: none !important;
      }
      
      /* 🔧 REACTIVAR SOLO ELEMENTOS NECESARIOS */
      .page-container-clean,
      .page-content-clean, 
      .products-grid-clean,
      .product-card-clean,
      .image-container-clean,
      .product-image-clean,
      .image-placeholder-clean,
      .placeholder-content-clean,
      .text-area-clean,
      .product-name-clean,
      .product-pricing-clean,
      .product-price-retail-clean,
      .product-price-wholesale-clean,
      .wholesale-label-clean,
      .wholesale-price-clean,
      .wholesale-min-clean {
        display: block !important;
      }
      
      .products-grid-clean {
        display: grid !important;
      }
      
      .product-card-clean,
      .text-area-clean,
      .product-pricing-clean,
      .product-price-wholesale-clean {
        display: flex !important;
      }
      
      .product-price-retail-clean {
        display: inline-block !important;
      }
      
      /* 🚨 @PAGE (MANTENER EXACTAMENTE IGUAL) */
      @page {
        size: A4 portrait;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
      }
      
      /* 🔧 HTML LIMPIO (ELIMINACIÓN COMPLETA DE MARGINS) */
      html {
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: ${template.colors.background} !important;
      }
      
      /* 🚀 BODY COMPLETAMENTE LIMPIO (SIN MARGINS QUE CAUSAN RECUADRO BLANCO) */
      body.clean-layout-body {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        background: ${template.colors.background} !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
        color: ${template.colors.text} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 100vh !important;
        width: 100% !important;
        box-sizing: border-box !important;
        display: block !important;
        position: relative !important;
        z-index: 1 !important;
      }
      
      /* 🚨 PÁGINA INDIVIDUAL (MANTENER MÁRGENES ORIGINALES) */
      .page-container-clean {
        width: 100% !important;
        margin: 0 !important;
        padding: ${PDF_LAYOUT.HEADER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm ${PDF_LAYOUT.FOOTER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        border: none !important;
        outline: none !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        z-index: 2 !important;
      }
      
      .page-container-clean:not(:first-child) {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .page-container-clean:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      
      /* 🔧 CONTENIDO PRINCIPAL LIMPIO */
      .page-content-clean {
        width: 100% !important;
        padding: ${LAYOUT.padding}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        border: none !important;
        outline: none !important;
        margin-top: ${PDF_LAYOUT.HEADER_TO_CONTENT_GAP}mm !important;
        margin-bottom: ${PDF_LAYOUT.HEADER_TO_CONTENT_GAP}mm !important;
        box-sizing: border-box !important;
        z-index: 3 !important;
      }
      
      /* 🔧 GRID LIMPIO */
      .products-grid-clean {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(${PDF_LAYOUT.COLUMNS}, 1fr) !important;
        gap: ${LAYOUT.gap}mm !important;
        justify-items: center !important;
        align-items: start !important;
        grid-auto-rows: ${LAYOUT.cardHeight}mm !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        padding: 1mm 0 !important;
        margin: 0 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-sizing: border-box !important;
        z-index: 4 !important;
      }
      
      /* 🚀 PRODUCT CARDS COMPLETAMENTE LIMPIAS (SIN DECORACIONES) */
      .product-card-clean {
        width: 100% !important;
        height: ${LAYOUT.cardHeight}mm !important;
        min-height: ${LAYOUT.cardHeight}mm !important;
        max-height: none !important;
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: 6px !important;
        overflow: visible !important;
        box-shadow: 0 2pt 4pt rgba(0,0,0,0.12) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        
        /* 🔧 PADDING LIMPIO */
        padding: ${PDF_LAYOUT.CARD_INTERNAL_PADDING}mm !important;
        gap: 2mm !important;
        margin: 0 !important;
        outline: none !important;
        box-sizing: border-box !important;
        z-index: 5 !important;
      }
      
      /* 🚀 ELIMINACIÓN COMPLETA DE CARD DECORATION (CAUSA DEL RECUADRO BLANCO) */
      /* NO AGREGAMOS .card-decoration - COMPLETAMENTE ELIMINADA */
      
      /* 🔧 IMAGEN CONTAINER LIMPIO */
      .image-container-clean {
        flex: 0 0 ${LAYOUT.imageHeight}mm !important;
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
        border-radius: 3px !important;
        border: none !important;
        outline: none !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        z-index: 6 !important;
      }
      
      /* 🔧 IMAGEN LIMPIA */
      .product-image-clean {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
        will-change: auto !important;
        border: none !important;
        outline: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        box-sizing: border-box !important;
      }
      
      .image-placeholder-clean {
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
        margin: 0 !important;
        padding: 1mm !important;
        box-sizing: border-box !important;
      }
      
      .placeholder-content-clean {
        color: #999 !important;
        font-size: 8pt !important;
        text-align: center !important;
        line-height: 1.2 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: transparent !important;
      }
      
      /* 🚀 ÁREA DE TEXTO COMPLETAMENTE LIMPIA */
      .text-area-clean {
        flex: 1 1 auto !important;
        min-height: ${LAYOUT.textHeight}mm !important;
        height: auto !important;
        max-height: none !important;
        padding: 1mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: center !important;
        overflow: visible !important;
        position: relative !important;
        background: transparent !important;
        gap: 1.5mm !important;
        margin: 0 !important;
        border: none !important;
        outline: none !important;
        box-sizing: border-box !important;
        z-index: 7 !important;
      }
      
      .product-name-clean {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        margin: 0 !important;
        padding: 0 !important;
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
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-sizing: border-box !important;
      }
      
      /* 🚀 SISTEMA DE PRECIOS COMPLETAMENTE LIMPIO */
      .product-pricing-clean {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 2mm !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        min-height: 0 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        box-sizing: border-box !important;
        position: relative !important;
        z-index: 8 !important;
      }

      /* 🔧 PRECIO RETAIL LIMPIO */
      .product-price-retail-clean {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        padding: 1.5mm 3mm !important;
        border-radius: 8px !important;
        display: inline-block !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.2) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
        margin: 0 !important;
        border: none !important;
        outline: none !important;
        position: relative !important;
        z-index: 9 !important;
        box-sizing: border-box !important;
      }

      /* 🚀 PRECIO MAYOREO COMPLETAMENTE LIMPIO */
      .product-price-wholesale-clean {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 90% !important;
        font-size: ${Math.max(config.priceSize - 2, 6)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        padding: 2mm !important;
        border-radius: 4px !important;
        border: 0.25pt solid ${template.colors.accent}50 !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        overflow: visible !important;
        flex-shrink: 0 !important;
        gap: 0.5mm !important;
        min-height: 8mm !important;
        margin: 0 !important;
        outline: none !important;
        position: relative !important;
        z-index: 10 !important;
        box-sizing: border-box !important;
      }
      
      .wholesale-label-clean {
        font-size: ${Math.max(config.priceSize - 3, 5)}pt !important;
        font-weight: 500 !important;
        color: ${template.colors.text}80 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1pt !important;
        line-height: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        display: block !important;
      }
      
      .wholesale-price-clean {
        font-weight: 700 !important;
        color: ${template.colors.primary} !important;
        font-size: ${Math.max(config.priceSize - 1, 7)}pt !important;
        line-height: 1.1 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        display: block !important;
      }
      
      .wholesale-min-clean {
        font-size: ${Math.max(config.priceSize - 4, 5)}pt !important;
        color: ${template.colors.text}60 !important;
        font-weight: 400 !important;
        font-style: italic !important;
        line-height: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        background: transparent !important;
        display: block !important;
      }
      
      /* 🚀 MEDIA PRINT COMPLETAMENTE LIMPIO */
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
          background: ${template.colors.background} !important;
          border: none !important;
          outline: none !important;
        }
        
        .page-container-clean,
        .page-content-clean,
        .products-grid-clean {
          overflow: visible !important;
          position: relative !important;
          height: auto !important;
          background: ${template.colors.background} !important;
          border: none !important;
          outline: none !important;
        }
        
        .page-container-clean {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .page-container-clean:not(:first-child) {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .page-container-clean:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        .product-card-clean {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: visible !important;
          max-height: none !important;
          min-height: calc(${LAYOUT.cardHeight}mm + 5mm) !important;
          background: white !important;
          border: 0.5pt solid ${template.colors.accent}60 !important;
          outline: none !important;
        }
        
        .product-image-clean {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          border: none !important;
          outline: none !important;
        }
        
        /* 🚀 FIXES FINALES PARA PRINT */
        .text-area-clean {
          overflow: visible !important;
          height: auto !important;
          min-height: calc(${LAYOUT.textHeight}mm + 5mm) !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
        }
        
        .product-pricing-clean {
          overflow: visible !important;
          height: auto !important;
          gap: 2.5mm !important;
          min-height: 15mm !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
        }
        
        .product-price-wholesale-clean {
          overflow: visible !important;
          min-height: 10mm !important;
          padding: 2.5mm !important;
          margin-top: 1mm !important;
          background: rgba(0,0,0,0.05) !important;
          border: 0.25pt solid ${template.colors.accent}50 !important;
          outline: none !important;
        }
        
        /* 🚀 ALTURA ADICIONAL PARA CARDS EN PRINT */
        .products-grid-clean {
          grid-auto-rows: calc(${LAYOUT.cardHeight}mm + 5mm) !important;
          background: ${template.colors.background} !important;
          border: none !important;
          outline: none !important;
        }
      }
      
      /* 🚀 ELIMINACIÓN TOTAL DE PSEUDO-ELEMENTOS (CRÍTICO) */
      .page-container-clean *::before,
      .page-container-clean *::after,
      .page-content-clean *::before,
      .page-content-clean *::after,
      .products-grid-clean *::before,
      .products-grid-clean *::after,
      .product-card-clean *::before,
      .product-card-clean *::after,
      .text-area-clean *::before,
      .text-area-clean *::after,
      .product-pricing-clean *::before,
      .product-pricing-clean *::after {
        display: none !important;
        content: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: none !important;
        position: absolute !important;
        z-index: -1 !important;
      }
    `;
  }
  
  // 🔧 GENERACIÓN DE PÁGINAS LIMPIAS
  private static generateCleanPages(
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
      
      if (pageProducts.length === 0) continue;
      
      pagesHTML += `
        <div class="page-container-clean">
          <div class="page-content-clean">
            ${this.generateCleanGrid(pageProducts)}
          </div>
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  // 🔧 GRID LIMPIO
  private static generateCleanGrid(products: Product[]): string {
    let gridHTML = '<div class="products-grid-clean">';
    
    products.forEach(product => {
      gridHTML += this.generateCleanProductCard(product);
    });
    
    gridHTML += '</div>';
    return gridHTML;
  }
  
  // 🚀 PRODUCTO CARD COMPLETAMENTE LIMPIO (SIN DECORACIONES)
  private static generateCleanProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}"
         class="product-image-clean" 
         loading="eager" 
         crossorigin="anonymous"
         onload="this.style.opacity=1"
         onerror="this.style.display='none'"
       />` :
      `<div class="image-placeholder-clean">
         <div class="placeholder-content-clean">
           <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    const wholesalePriceHTML = product.price_wholesale ? `
      <div class="product-price-wholesale-clean">
        <span class="wholesale-label-clean">Mayoreo:</span>
        <span class="wholesale-price-clean">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</span>
        ${product.wholesale_min_qty ? `
          <span class="wholesale-min-clean">Min. ${product.wholesale_min_qty}</span>
        ` : ''}
      </div>
    ` : '';
    
    return `
      <div class="product-card-clean">
        <div class="image-container-clean">
          ${imageHTML}
        </div>
        
        <div class="text-area-clean">
          <div class="product-name-clean">${productName}</div>
          <div class="product-pricing-clean">
            <div class="product-price-retail-clean">$${(productPrice / 100).toLocaleString('es-MX', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</div>
            ${wholesalePriceHTML}
          </div>
        </div>
      </div>
    `;
  }
  
  // 🚨 PDF OPTIONS (MANTENER EXACTAMENTE IGUALES - NO TOCAR)
  private static getMultipagePDFOptions(
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
      margin: {
        top: `${PDF_LAYOUT.HEADER_MARGIN}mm`,    // MANTENER: 15mm
        right: `${PDF_LAYOUT.SIDE_MARGIN}mm`,    // MANTENER: 10mm
        bottom: `${PDF_LAYOUT.FOOTER_MARGIN}mm`, // MANTENER: 12mm
        left: `${PDF_LAYOUT.SIDE_MARGIN}mm`      // MANTENER: 10mm
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      waitUntil: 'networkidle0',
      timeout: 30000,
      omitBackground: false,
      scale: 1.0,
      quality: options.quality === 'high' ? 100 : options.quality === 'low' ? 80 : 90,
      
      // 🚨 MANTENER HEADER/FOOTER TEMPLATES EXACTAMENTE IGUALES
      headerTemplate: `<div style="font-size: 12px !important; width: 100% !important; height: ${PDF_LAYOUT.HEADER_HEIGHT}mm !important; text-align: center !important; background: ${primaryColor} !important; background-image: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important; color: white !important; padding: 2mm !important; margin: 0 !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: table !important; table-layout: fixed !important;"><div style="display: table-cell; vertical-align: middle; text-align: center;"><strong style="color: white !important; font-size: 14px !important;">${businessInfo.business_name || 'Mi Negocio'}</strong><br><span style="color: rgba(255,255,255,0.9) !important; font-size: 10px !important;">${catalogTitle}</span></div></div>`,
      
      footerTemplate: `<div style="font-size: 9px !important; width: 100% !important; height: ${PDF_LAYOUT.FOOTER_HEIGHT}mm !important; text-align: center !important; background: ${secondaryColor} !important; color: white !important; padding: 1mm !important; margin: 0 !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; display: table !important; table-layout: fixed !important;"><div style="display: table-cell; vertical-align: middle; text-align: center;">${contactInfo ? `<div style="color: white !important; font-size: 8px !important; margin-bottom: 1mm !important;">${contactInfo}</div>` : ''}<div style="color: rgba(255,255,255,0.8) !important; font-size: 7px !important;">Generado con CatifyPro - <span class="pageNumber"></span> de <span class="totalPages"></span></div></div></div>`,
      
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
            waitForSelector: '.page-container-clean',
            waitForFunction: 'document.readyState === "complete"',
          },
          filename: `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          debug: process.env.NODE_ENV === 'development',
          retryOnFailure: attempt < maxRetries
        };
        
        const response = await fetch(`${this.SERVICE_URL}/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf',
            'User-Agent': 'CatifyPro-PDF-Generator/2.0-FinalClean'
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
        
        console.log(`✅ PDF FINAL LIMPIO generado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
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
      const filename = `catalogo-limpio-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
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
      await this.downloadPDF(blob, 'test-final-clean');
      
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