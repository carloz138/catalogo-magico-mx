// src/lib/pdf/puppeteer-service-client.ts
// 🎯 SOLUCIÓN FINAL: MÚLTIPLES PÁGINAS + ESPACIADO PERFECTO

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

// ✅ MANTENER DELTA DE PRECISIÓN (funciona)
const PRECISION_DELTA = 0.5;

// ✅ CONFIGURACIÓN CON MEJOR ESPACIADO
const PDF_LAYOUT = {
  HEADER_MARGIN: 15, // Mantener header/footer intactos
  FOOTER_MARGIN: 12,
  SIDE_MARGIN: 10,
  HEADER_HEIGHT: 10,
  FOOTER_HEIGHT: 6,
  COLUMNS: 3,
  ROWS: 2,
  PRODUCTS_PER_PAGE: 6,
  
  // 🎯 NUEVOS: Espaciados mejorados
  HEADER_TO_CONTENT_GAP: 8, // 8mm entre header y contenido
  GRID_GAP: 5, // 5mm entre tarjetas (antes era 3mm)
  CONTENT_PADDING: 6, // 6mm padding interno (antes era 4mm)
  CARD_INTERNAL_PADDING: 4, // 4mm padding interno de tarjetas
};

// ✅ CÁLCULOS CON MEJOR ESPACIADO
const calculateOptimizedDimensions = () => {
  const contentWidth = 210 - (PDF_LAYOUT.SIDE_MARGIN * 2) - PRECISION_DELTA;
  
  const gap = PDF_LAYOUT.GRID_GAP;
  const padding = PDF_LAYOUT.CONTENT_PADDING;
  const usableWidth = contentWidth - (padding * 2);
  
  const cardWidth = (usableWidth - (gap * (PDF_LAYOUT.COLUMNS - 1))) / PDF_LAYOUT.COLUMNS;
  
  // ✅ Altura de card optimizada para mejor distribución
  const baseCardHeight = cardWidth + 22; // +4mm más altura para mejor proporción
  
  return {
    contentWidth: Math.floor(contentWidth * 100) / 100,
    usableWidth: Math.floor(usableWidth * 100) / 100,
    cardWidth: Math.floor(cardWidth * 100) / 100,
    cardHeight: Math.floor(baseCardHeight * 100) / 100,
    gap,
    padding,
    imageHeight: Math.floor(baseCardHeight * 0.65 * 100) / 100,
    textHeight: Math.floor(baseCardHeight * 0.35 * 100) / 100
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
      console.log('🚀 Generando PDF con espaciado optimizado...', {
        products: products.length,
        expectedPages: Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE),
        layout: LAYOUT,
        spacing: {
          headerGap: PDF_LAYOUT.HEADER_TO_CONTENT_GAP,
          gridGap: PDF_LAYOUT.GRID_GAP,
          contentPadding: PDF_LAYOUT.CONTENT_PADDING
        }
      });
      
      const totalPages = Math.ceil(products.length / PDF_LAYOUT.PRODUCTS_PER_PAGE);
      
      if (options.onProgress) options.onProgress(5);
      
      const isHealthy = await this.checkServiceHealthWithRetry();
      if (!isHealthy) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(15);
      
      // ✅ HTML con espaciado mejorado
      const htmlContent = this.generateOptimizedSpacingHTML(products, businessInfo, template, options.quality || 'medium', options);
      
      if (options.onProgress) options.onProgress(30);
      
      // ✅ PDF Options sin cambios (funciona para múltiples páginas)
      const pdfOptions = this.getMultipagePDFOptions(options, businessInfo, template);
      
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
      console.error('❌ Error en PDF con espaciado optimizado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  // ✅ HTML CON ESPACIADO OPTIMIZADO
  private static generateOptimizedSpacingHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    quality: 'low' | 'medium' | 'high',
    options: PuppeteerServiceOptions = {}
  ): string {
    
    const pagesHTML = this.generateWellSpacedPages(products, businessInfo, template, quality);
    const pageTitle = options.catalogTitle || `Catálogo ${businessInfo.business_name}`;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <title>${pageTitle}</title>
  <style>
    ${this.generateOptimizedSpacingCSS(template, quality)}
  </style>
</head>
<body class="optimized-spacing-body">
  ${pagesHTML}
</body>
</html>`;
  }
  
  // ✅ CSS CON ESPACIADO OPTIMIZADO
  private static generateOptimizedSpacingCSS(template: TemplateConfig, quality: 'low' | 'medium' | 'high'): string {
    const qualityConfig = {
      low: { fontSize: 9, priceSize: 10, nameSize: 9 },
      medium: { fontSize: 10, priceSize: 11, nameSize: 10 },
      high: { fontSize: 11, priceSize: 12, nameSize: 11 }
    };
    
    const config = qualityConfig[quality];
    
    return `
      /* ✅ RESET ABSOLUTO (mantener) */
      *, *::before, *::after {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* ✅ @PAGE (sin cambios - funciona para múltiples páginas) */
      @page {
        size: A4 portrait;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
      }
      
      /* ✅ HTML NATURAL (sin cambios) */
      html {
        font-size: ${config.fontSize}pt !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      
      /* ✅ BODY NATURAL (sin cambios) */
      body.optimized-spacing-body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: ${config.fontSize}pt !important;
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
      
      /* ✅ PÁGINA INDIVIDUAL CON ESPACIADO MEJORADO */
      .page-container-optimized {
        width: 100% !important;
        margin: 0 !important;
        padding: ${PDF_LAYOUT.HEADER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm ${PDF_LAYOUT.FOOTER_MARGIN}mm ${PDF_LAYOUT.SIDE_MARGIN}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        display: block !important;
        
        /* ✅ Page breaks (mantener funcionalidad multipágina) */
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      
      .page-container-optimized:not(:first-child) {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .page-container-optimized:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      
      /* 🎯 CONTENIDO PRINCIPAL CON ESPACIADO OPTIMIZADO */
      .page-content-optimized {
        width: 100% !important;
        padding: ${LAYOUT.padding}mm !important;
        background: ${template.colors.background} !important;
        position: relative !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        
        /* 🎯 CRÍTICO: Espacio entre header y contenido */
        margin-top: ${PDF_LAYOUT.HEADER_TO_CONTENT_GAP}mm !important;
        
        /* 🎯 CRÍTICO: Espacio antes del footer */
        margin-bottom: ${PDF_LAYOUT.HEADER_TO_CONTENT_GAP}mm !important;
      }
      
      /* 🎯 GRID CON GAP MEJORADO */
      .products-grid-optimized {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(${PDF_LAYOUT.COLUMNS}, 1fr) !important;
        
        /* 🎯 CRÍTICO: Gap aumentado entre tarjetas */
        gap: ${LAYOUT.gap}mm !important; /* 5mm en lugar de 3mm */
        
        justify-items: center !important;
        align-items: start !important;
        grid-auto-rows: minmax(${LAYOUT.cardHeight}mm, auto) !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
        
        /* 🎯 PADDING ADICIONAL PARA MEJOR DISTRIBUCIÓN */
        padding: ${LAYOUT.gap / 2}mm 0 !important;
      }
      
      /* ✅ PRODUCT CARDS CON ALTURA OPTIMIZADA */
      .product-card-optimized {
        width: 100% !important;
        
        /* 🎯 CRÍTICO: Altura aumentada para mejor proporción */
        height: ${LAYOUT.cardHeight}mm !important;
        min-height: ${LAYOUT.cardHeight}mm !important;
        max-height: ${LAYOUT.cardHeight}mm !important;
        
        background: white !important;
        border: 0.5pt solid ${template.colors.accent}60 !important;
        border-radius: 6px !important; /* Ligeramente más redondeado */
        overflow: hidden !important;
        box-shadow: 0 2pt 4pt rgba(0,0,0,0.12) !important; /* Sombra ligeramente más prominente */
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
        
        /* 🎯 TRANSICIÓN SUAVE PARA MEJOR APARIENCIA */
        transition: box-shadow 0.2s ease !important;
      }
      
      .card-decoration-optimized {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 3pt !important; /* Ligeramente más prominente */
        background: ${template.colors.primary} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        z-index: 1 !important;
      }
      
      /* 🎯 IMAGEN CONTAINER CON MEJOR PROPORCIÓN */
      .image-container-optimized {
        flex: 1 1 ${LAYOUT.imageHeight}mm !important;
        height: ${LAYOUT.imageHeight}mm !important;
        min-height: ${LAYOUT.imageHeight}mm !important;
        max-height: ${LAYOUT.imageHeight}mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #f8f9fa !important;
        
        /* 🎯 PADDING MEJORADO */
        padding: 3mm !important; /* Aumentado de 2mm a 3mm */
        
        overflow: hidden !important;
        position: relative !important;
        border-radius: 0 0 3px 3px !important; /* Bordes redondeados solo abajo */
      }
      
      /* ✅ IMAGEN OPTIMIZADA (sin cambios) */
      .product-image-optimized {
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
      }
      
      .image-placeholder-optimized {
        width: ${LAYOUT.imageHeight - 8}mm !important; /* Ajustado por padding mayor */
        height: ${LAYOUT.imageHeight - 8}mm !important;
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
      
      .placeholder-content-optimized {
        color: #999 !important;
        font-size: 8pt !important;
        text-align: center !important;
        line-height: 1.2 !important;
      }
      
      /* 🎯 ÁREA DE TEXTO CON MEJOR ESPACIADO */
      .text-area-optimized {
        flex: 0 0 ${LAYOUT.textHeight}mm !important;
        height: ${LAYOUT.textHeight}mm !important;
        min-height: ${LAYOUT.textHeight}mm !important;
        max-height: ${LAYOUT.textHeight}mm !important;
        
        /* 🎯 PADDING MEJORADO */
        padding: 3mm !important; /* Aumentado de 2mm a 3mm */
        
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        overflow: hidden !important;
        position: relative !important;
        background: white !important; /* Asegurar fondo blanco */
      }
      
      .product-name-optimized {
        font-size: ${config.nameSize}pt !important;
        font-weight: 600 !important;
        color: ${template.colors.primary} !important;
        
        /* 🎯 MARGEN MEJORADO */
        margin-bottom: 2mm !important; /* Aumentado de 1.5mm a 2mm */
        
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        text-align: center !important;
        line-height: 1.3 !important; /* Mejorado line-height */
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      .product-pricing-optimized {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        
        /* 🎯 GAP MEJORADO */
        gap: 1.5mm !important; /* Aumentado de 1mm a 1.5mm */
        
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: center !important;
      }
      
      .product-price-retail-optimized {
        font-size: ${config.priceSize}pt !important;
        font-weight: 700 !important;
        color: white !important;
        background: ${template.colors.secondary} !important;
        background-image: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}) !important;
        
        /* 🎯 PADDING MEJORADO */
        padding: 1.5mm 3mm !important;
        
        border-radius: 8px !important; /* Más redondeado */
        display: inline-block !important;
        text-align: center !important;
        white-space: nowrap !important;
        max-width: 95% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-shadow: 0 1pt 3pt rgba(0,0,0,0.2) !important; /* Sombra mejorada */
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      .product-price-wholesale-optimized {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        width: 85% !important;
        font-size: ${Math.max(config.priceSize - 2, 6)}pt !important;
        color: ${template.colors.text} !important;
        background: rgba(0,0,0,0.05) !important;
        
        /* 🎯 PADDING MEJORADO */
        padding: 1mm 2mm !important; /* Aumentado */
        
        border-radius: 4px !important;
        border: 0.25pt solid ${template.colors.accent}50 !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0 !important;
      }
      
      .wholesale-label-optimized {
        font-size: ${Math.max(config.priceSize - 3, 5)}pt !important;
        font-weight: 500 !important;
        color: ${template.colors.text}80 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1pt !important;
        line-height: 1 !important;
        margin-bottom: 0.5mm !important; /* Ligeramente aumentado */
      }
      
      .wholesale-price-optimized {
        font-weight: 700 !important;
        color: ${template.colors.primary} !important;
        font-size: ${Math.max(config.priceSize - 1, 7)}pt !important;
        line-height: 1 !important;
        margin-bottom: 0.3mm !important;
      }
      
      .wholesale-min-optimized {
        font-size: ${Math.max(config.priceSize - 4, 5)}pt !important;
        color: ${template.colors.text}60 !important;
        font-weight: 400 !important;
        font-style: italic !important;
        line-height: 1 !important;
      }
      
      /* ✅ MEDIA PRINT (sin cambios - funciona) */
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
        
        .page-container-optimized,
        .page-content-optimized,
        .products-grid-optimized {
          overflow: visible !important;
          position: relative !important;
          height: auto !important;
        }
        
        .page-container-optimized {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        
        .page-container-optimized:not(:first-child) {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .page-container-optimized:last-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        
        .product-card-optimized {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .product-image-optimized {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
      
      /* ✅ CRÍTICO: Eliminar pseudoelementos problemáticos (mantener) */
      .page-container-optimized *::before,
      .page-container-optimized *::after,
      .page-content-optimized *::before,
      .page-content-optimized *::after,
      .products-grid-optimized *::before,
      .products-grid-optimized *::after {
        display: none !important;
        content: none !important;
      }
    `;
  }
  
  // ✅ GENERACIÓN DE PÁGINAS CON ESPACIADO MEJORADO
  private static generateWellSpacedPages(
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
        <div class="page-container-optimized">
          <div class="page-content-optimized">
            ${this.generateOptimizedGrid(pageProducts)}
          </div>
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  // ✅ GRID CON ESPACIADO OPTIMIZADO
  private static generateOptimizedGrid(products: Product[]): string {
    let gridHTML = '<div class="products-grid-optimized">';
    
    products.forEach(product => {
      gridHTML += this.generateOptimizedProductCard(product);
    });
    
    gridHTML += '</div>';
    return gridHTML;
  }
  
  // ✅ PRODUCTO CARD OPTIMIZADA
  private static generateOptimizedProductCard(product: Product): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}"
         class="product-image-optimized" 
         loading="eager" 
         crossorigin="anonymous"
         onload="this.style.opacity=1"
         onerror="this.style.display='none'"
       />` :
      `<div class="image-placeholder-optimized">
         <div class="placeholder-content-optimized">
           <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
           <div>Sin imagen</div>
         </div>
       </div>`;
    
    const wholesalePriceHTML = product.price_wholesale ? `
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
    ` : '';
    
    return `
      <div class="product-card-optimized">
        <div class="card-decoration-optimized"></div>
        
        <div class="image-container-optimized">
          ${imageHTML}
        </div>
        
        <div class="text-area-optimized">
          <div class="product-name-optimized">${productName}</div>
          <div class="product-pricing-optimized">
            <div class="product-price-retail-optimized">$${(productPrice / 100).toLocaleString('es-MX', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</div>
            ${wholesalePriceHTML}
          </div>
        </div>
      </div>
    `;
  }
  
  // ✅ PDF OPTIONS (sin cambios - funciona para múltiples páginas)
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
      
      // ✅ MANTENER HEADER/FOOTER TEMPLATES INTACTOS
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
            waitForSelector: '.page-container-optimized',
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
        
        if (blob.type !== 'application/pdf') {
          console.warn('⚠️ Tipo de archivo inesperado:', blob.type);
        }
        
        console.log(`✅ PDF con espaciado optimizado generado en intento ${attempt}/${maxRetries}, tamaño: ${blob.size} bytes`);
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
      await this.downloadPDF(blob, 'test-optimized-spacing');
      
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