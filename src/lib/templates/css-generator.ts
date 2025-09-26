// src/lib/templates/css-generator.ts - VERSIÓN CORREGIDA COMPLETA
// 🚀 SOLUCIÓN DEFINITIVA PARA CONTENIDO CORTADO EN TARJETAS

import { IndustryTemplate } from './industry-templates';

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
    twitter?: string;
  };
}

export class TemplateGenerator {
  
  /**
   * 🎨 CSS GENERATOR COMPLETAMENTE CORREGIDO
   */
  static generateTemplateCSS(template: IndustryTemplate): string {
    const dimensions = this.calculateCorrectedDimensions(template);
    const colors = this.generateColorScheme(template);
    const typography = this.calculateTypography(template);
    
    return `
      /* ===== TEMPLATE: ${template.displayName.toUpperCase()} - VERSIÓN CORREGIDA ===== */
      
      /* ===== VARIABLES CSS CORREGIDAS ===== */
      :root {
        --primary: ${colors.primary};
        --secondary: ${colors.secondary};
        --accent: ${colors.accent};
        --bg: ${colors.background};
        --card-bg: ${colors.cardBackground};
        --text: ${colors.textPrimary};
        --text-light: ${colors.textSecondary};
        --border: ${colors.borderColor};
        
        /* DIMENSIONES CORREGIDAS */
        --page-width: 210mm;
        --page-height: 297mm;
        --margin: ${dimensions.margin}mm;
        --content-width: ${dimensions.contentWidth}mm;
        --content-height: ${dimensions.contentHeight}mm;
        
        /* GRID DIMENSIONS CORREGIDAS PARA MÁS ESPACIO */
        --columns: ${dimensions.columns};
        --card-width: ${dimensions.cardWidth}mm;
        --card-height: ${dimensions.cardHeight}mm; /* AUMENTADO */
        --gap: ${dimensions.gap}mm;
        --image-height: ${dimensions.imageHeight}mm;
        --text-area-height: ${dimensions.textAreaHeight}mm; /* AUMENTADO SIGNIFICATIVAMENTE */
        
        /* TIPOGRAFÍA OPTIMIZADA */
        --header-size: ${typography.headerSize}pt;
        --title-size: ${typography.titleSize}pt;
        --price-size: ${typography.priceSize}pt;
        --desc-size: ${typography.descSize}pt;
        --info-size: ${typography.infoSize}pt;
      }
      
      /* ===== RESET ABSOLUTO ===== */
      *, *::before, *::after {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* ===== PÁGINA PDF ===== */
      @page {
        size: A4 portrait;
        margin: var(--margin);
        marks: none;
        bleed: 0;
        orphans: 1;
        widows: 1;
      }
      
      /* ===== HTML Y BODY ===== */
      html {
        width: var(--page-width);
        height: auto;
        font-size: 12pt;
        line-height: 1.3;
        margin: 0;
        padding: 0;
      }
      
      body.template-${template.id} {
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        background: var(--bg) !important;
        color: var(--text) !important;
        width: 100% !important;
        min-height: 100vh !important;
        margin: 0 auto !important;
        padding: var(--margin) !important;
        font-size: 12pt;
        position: relative;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
      }
      
      /* ===== CONTAINER PRINCIPAL ===== */
      .catalog-container {
        width: var(--content-width) !important;
        max-width: var(--content-width) !important;
        background: var(--bg) !important;
        position: relative !important;
        min-height: calc(100vh - 40mm) !important;
        margin: 0 auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        -webkit-print-color-adjust: exact !important;
        padding-bottom: 0 !important;
      }
      
      /* ===== HEADER ===== */
      .catalog-header {
        width: 100%;
        background: var(--primary) !important;
        background-image: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
        color: white !important;
        text-align: center;
        padding: 8mm;
        margin-bottom: 6mm;
        border-radius: ${Math.min(template.design?.borderRadius || 8, 12)}px;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        flex-shrink: 0;
      }
      
      .business-name {
        font-size: var(--header-size);
        font-weight: 700;
        margin-bottom: 2mm !important;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
        color: white !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        word-wrap: break-word;
        line-height: 1.2;
        -webkit-print-color-adjust: exact !important;
      }
      
      .catalog-subtitle {
        font-size: calc(var(--header-size) * 0.6);
        font-weight: 300;
        opacity: 0.95;
        color: white !important;
        margin-top: 1mm !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* ===== PRODUCTS SECTION ===== */
      .products-section {
        width: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 0;
      }
      
      /* ===== PRODUCTS PAGE ===== */
      .products-page {
        width: 100%;
        margin-bottom: 8mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      /* 🚀 GRID SYSTEM COMPLETAMENTE CORREGIDO */
      .products-grid {
        display: grid !important;
        grid-template-columns: repeat(var(--columns), 1fr) !important;
        gap: var(--gap) !important;
        width: 100% !important;
        max-width: var(--content-width) !important;
        margin: 0 auto !important;
        padding: 0 !important;
        page-break-inside: avoid;
        align-items: stretch !important;
        justify-content: center !important;
        place-content: center stretch !important;
        /* 🔧 ALTURA CORREGIDA PARA ACOMODAR CONTENIDO */
        grid-auto-rows: var(--card-height) !important;
      }
      
      /* 🚀 PRODUCT CARDS COMPLETAMENTE CORREGIDAS */
      .product-card {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        /* 🔧 ALTURA CORREGIDA PARA MÁS ESPACIO */
        height: var(--card-height) !important;
        min-height: var(--card-height) !important;
        max-height: none !important; /* CRÍTICO: Permitir crecimiento */
        
        background: var(--card-bg) !important;
        border: 0.5pt solid var(--border) !important;
        border-radius: ${Math.min(template.design?.borderRadius || 8, 15)}px !important;
        /* 🔧 OVERFLOW CORREGIDO */
        overflow: visible !important; /* CAMBIO CRÍTICO: de hidden a visible */
        position: relative !important;
        
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
        
        align-self: stretch !important;
        justify-self: center !important;
        
        /* 🔧 PADDING OPTIMIZADO */
        padding: 3mm !important;
        gap: 2mm !important; /* GAP INTERNO PARA SEPARACIÓN */
        
        ${template.design.shadows ? 'box-shadow: 0 1mm 3mm rgba(0, 0, 0, 0.08);' : ''}
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* ===== CONTENIDO INTERNO CORREGIDO ===== */
      .product-card-inner {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        width: 100% !important;
        padding: 0 !important; /* SIN PADDING DUPLICADO */
        gap: 2mm !important; /* GAP ENTRE ELEMENTOS */
        box-sizing: border-box !important;
      }
      
      /* ===== IMAGEN CONTAINER OPTIMIZADO ===== */
      .product-image-container {
        width: 100% !important;
        /* 🔧 ALTURA DE IMAGEN OPTIMIZADA */
        height: var(--image-height) !important;
        min-height: var(--image-height) !important;
        max-height: var(--image-height) !important;
        background: #f8f9fa !important;
        border-radius: ${Math.max(Math.min(template.design?.borderRadius || 8, 15) - 2, 2)}px !important;
        overflow: hidden !important;
        position: relative !important;
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border: 0.25pt solid var(--border) !important;
        margin-bottom: 0 !important; /* SIN MARGIN, USA GAP */
        -webkit-print-color-adjust: exact !important;
        aspect-ratio: 1 / 1 !important;
        padding: 2mm !important;
      }
      
      /* ===== IMAGEN ===== */
      .product-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        display: block !important;
        margin: 0 !important;
        border-radius: 2px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
      }
      
      /* ===== ESTRATEGIAS POR ORIENTACIÓN ===== */
      .product-image.cover-mode {
        object-fit: cover !important;
        object-position: center !important;
      }

      .product-image.contain-mode {
        object-fit: contain !important;
        object-position: center !important;
        padding: 2px !important;
        background: #fafafa !important;
      }
      
      /* ===== PLACEHOLDER ===== */
      .product-image-placeholder {
        width: 90% !important;
        height: 90% !important;
        background: 
          repeating-conic-gradient(from 0deg at 50% 50%, 
            #f0f0f0 0deg 90deg, 
            transparent 90deg 180deg) !important;
        background-size: 8px 8px !important;
        border: 1pt dashed #ccc !important;
        border-radius: 3px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        color: #999 !important;
        font-size: 8pt !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* 🚀 INFORMACIÓN COMPLETAMENTE CORREGIDA */
      .product-info {
        /* 🔧 FLEX CORREGIDO PARA MÁS ESPACIO */
        flex: 1 1 auto !important; /* CAMBIO CRÍTICO: flex-grow para usar espacio disponible */
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important; /* CAMBIO CRÍTICO: desde arriba */
        /* 🔧 ALTURA CORREGIDA */
        min-height: var(--text-area-height) !important;
        height: auto !important; /* CRÍTICO: altura automática */
        text-align: center !important;
        /* 🔧 OVERFLOW CORREGIDO */
        overflow: visible !important; /* CAMBIO CRÍTICO: de hidden a visible */
        
        /* 🔧 GAP Y PADDING OPTIMIZADOS */
        gap: 2mm !important; /* GAP AUMENTADO */
        padding: 1mm 0 !important;
      }
      
      /* 🚀 NOMBRE DEL PRODUCTO CORREGIDO */
      .product-name {
        font-size: var(--title-size) !important;
        font-weight: 600 !important;
        color: var(--primary) !important;
        line-height: 1.3 !important;
        margin-bottom: 0 !important; /* USA GAP EN VEZ DE MARGIN */
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
        
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getNameLines(template.density)} !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        
        -webkit-print-color-adjust: exact !important;
        text-align: center !important;
        width: 100% !important;
        flex-shrink: 0 !important;
      }
      
      /* 🚀 SISTEMA DE PRECIOS COMPLETAMENTE CORREGIDO */
      .product-pricing {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 2.5mm !important; /* GAP AUMENTADO PARA MEJOR SEPARACIÓN */
        margin: 0 !important; /* SIN MARGIN, USA GAP */
        width: 100% !important;
        flex-grow: 1 !important;
        justify-content: flex-start !important; /* CRÍTICO: desde arriba */
        /* 🔧 OVERFLOW CORREGIDO */
        overflow: visible !important; /* CAMBIO CRÍTICO: permitir overflow */
        min-height: 0 !important; /* PERMITIR FLEXIBILIDAD */
      }

      /* ===== PRECIO RETAIL OPTIMIZADO ===== */
      .product-price-retail {
        font-size: var(--price-size) !important;
        font-weight: 700 !important;
        color: white !important;
        background: var(--secondary) !important;
        background-image: linear-gradient(135deg, var(--secondary), var(--primary)) !important;
        padding: 1.5mm 3mm !important;
        border-radius: 12px !important;
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
        line-height: 1.2 !important;
        margin: 0 !important; /* SIN MARGIN, USA GAP */
      }

      /* 🚀 PRECIO MAYOREO COMPLETAMENTE CORREGIDO */
      .product-price-wholesale {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 1mm !important; /* GAP INTERNO */
        /* 🔧 TAMAÑO Y ESPACIADO CORREGIDOS */
        font-size: calc(var(--price-size) * 0.75) !important;
        color: var(--text) !important;
        background: rgba(0,0,0,0.05) !important;
        padding: 2mm !important; /* PADDING AUMENTADO */
        border-radius: 6px !important;
        border: 0.5pt solid var(--border) !important;
        width: 90% !important; /* ANCHO AUMENTADO */
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        /* 🔧 OVERFLOW Y ALTURA CORREGIDOS */
        overflow: visible !important; /* CAMBIO CRÍTICO */
        flex-shrink: 0 !important;
        min-height: 8mm !important; /* ALTURA MÍNIMA GARANTIZADA */
        position: relative !important;
        z-index: 2 !important;
        margin: 0 !important; /* SIN MARGIN, USA GAP */
      }

      .wholesale-label {
        font-size: calc(var(--info-size) * 0.9) !important;
        font-weight: 500 !important;
        color: var(--text-light) !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3pt !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.1 !important;
      }

      .wholesale-price {
        font-weight: 700 !important;
        color: var(--primary) !important;
        font-size: calc(var(--price-size) * 0.8) !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.1 !important;
      }

      .wholesale-min {
        font-size: calc(var(--info-size) * 0.8) !important;
        color: var(--text-light) !important;
        font-weight: 400 !important;
        font-style: italic !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.1 !important;
      }
      
      /* ===== ELEMENTOS CONDICIONALES ===== */
      
      ${template.showInfo.category ? `
      .product-category {
        font-size: var(--info-size) !important;
        color: var(--accent) !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        background: ${this.hexToRgba(template.colors.accent, 0.15)} !important;
        padding: 0.5mm 2mm !important;
        border-radius: 6px !important;
        display: inline-block !important;
        margin: 0 !important; /* USA GAP */
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-category { display: none !important; }`}
      
      ${template.showInfo.description ? `
      .product-description {
        font-size: var(--desc-size) !important;
        color: var(--text-light) !important;
        line-height: 1.3 !important;
        margin: 0 !important; /* USA GAP */
        
        display: -webkit-box !important;
        -webkit-line-clamp: ${this.getDescLines(template.density)} !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        word-wrap: break-word !important;
        
        -webkit-print-color-adjust: exact !important;
        text-align: center !important;
      }
      ` : `.product-description { display: none !important; }`}
      
      ${template.showInfo.sku ? `
      .product-sku {
        font-size: calc(var(--info-size) * 0.9) !important;
        color: var(--text-light) !important;
        font-family: 'Courier New', monospace !important;
        background: rgba(0, 0, 0, 0.05) !important;
        padding: 0.5mm 1.5mm !important;
        border-radius: 3px !important;
        display: inline-block !important;
        margin: 0 !important; /* USA GAP */
        border: 0.25pt solid var(--border) !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-sku { display: none !important; }`}
      
      ${template.showInfo.specifications ? `
      .product-specifications {
        font-size: calc(var(--info-size) * 0.85) !important;
        color: var(--text-light) !important;
        border-top: 0.25pt solid var(--border) !important;
        padding-top: 1mm !important;
        margin-top: 1mm !important;
        line-height: 1.3 !important;
        
        max-height: ${this.getSpecsHeight(template.density)}mm !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        
        -webkit-print-color-adjust: exact !important;
      }
      ` : `.product-specifications { display: none !important; }`}
      
      /* ===== FOOTER ===== */
      .catalog-footer {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        background: var(--secondary) !important;
        color: ${this.getContrastColor(template.colors.secondary || template.colors.primary)} !important;
        padding: 5mm 8mm !important;
        text-align: center !important;
        border-top: 1pt solid var(--border) !important;
        border-radius: ${Math.min(template.design?.borderRadius || 8, 12)}px ${Math.min(template.design?.borderRadius || 8, 12)}px 0 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
        margin: 8mm auto 0 auto !important;
        transform: none !important;
        left: auto !important;
        bottom: auto !important;
      }
      
      .business-contact {
        font-size: 9pt !important;
        line-height: 1.4 !important;
        margin-bottom: 3mm !important;
        font-weight: 600 !important;
        word-wrap: break-word !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 3mm !important;
        width: 100% !important;
      }
      
      .contact-item {
        display: inline-block !important;
        padding: 1.5mm 3mm !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        font-size: 8pt !important;
        border: 0.5pt solid rgba(255, 255, 255, 0.1) !important;
      }
      
      .footer-branding {
        margin-top: 3mm !important;
        font-size: 7pt !important;
        opacity: 0.9 !important;
        font-weight: 300 !important;
        color: rgba(255, 255, 255, 0.8) !important;
      }
      
      /* ===== PAGINACIÓN ===== */
      .page-break-before {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .page-break-after {
        page-break-after: always !important;
        break-after: page !important;
      }
      
      .page-break-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-before: avoid !important;
        page-break-after: avoid !important;
      }
      
      /* ===== CARDS VACÍAS ===== */
      .product-card.empty-card {
        visibility: hidden !important;
        height: var(--card-height) !important;
        min-height: var(--card-height) !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      
      /* ===== OPTIMIZACIONES POR INDUSTRIA ===== */
      
      .template-joyeria-elegante .product-image,
      .template-joyeria-luxury .product-image {
        object-fit: contain !important;
        background: linear-gradient(45deg, #fff8f0, #ffffff) !important;
        padding: 3px !important;
      }
      
      .template-joyeria-elegante .product-image-container,
      .template-joyeria-luxury .product-image-container {
        background: linear-gradient(45deg, #fff8f0, #ffffff) !important;
        border: 0.5pt solid ${template.colors.accent}50 !important;
      }
      
      .template-moda-boutique .product-image,
      .template-moda-urban .product-image {
        object-fit: cover !important;
        object-position: center top !important;
      }
      
      .template-electronica-tech .product-image,
      .template-electronica-gaming .product-image {
        object-fit: contain !important;
        padding: 4px !important;
      }
      
      .template-electronica-tech .product-image-container,
      .template-electronica-gaming .product-image-container {
        background: linear-gradient(135deg, #f1f3f4, #ffffff) !important;
        border: 0.5pt solid #e0e0e0 !important;
      }
      
      .template-cosmeticos-beauty .product-image {
        object-fit: contain !important;
        padding: 2px !important;
      }
      
      .template-ferreteria-pro .product-image {
        object-fit: contain !important;
        padding: 3px !important;
      }
      
      .template-floreria-natural .product-image,
      .template-floreria-boda .product-image {
        object-fit: cover !important;
        object-position: center !important;
      }
      
      .template-muebles-hogar .product-image {
        object-fit: contain !important;
        padding: 4px !important;
      }
      
      /* ===== RESPONSIVE ===== */
      @media screen and (max-width: 768px) {
        :root {
          --columns: 1;
          --gap: 3mm;
        }
        
        .products-grid {
          grid-template-columns: 1fr !important;
        }
        
        .product-card {
          max-width: none !important;
        }
      }
      
      /* 🚀 MEDIA PRINT COMPLETAMENTE CORREGIDO */
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
        
        .catalog-container {
          width: 100% !important;
          max-width: none !important;
        }
        
        .product-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          /* 🔧 OVERFLOW Y ALTURA CORREGIDOS PARA PRINT */
          overflow: visible !important;
          max-height: none !important;
          /* 🚀 ALTURA ADICIONAL EN PRINT */
          min-height: calc(var(--card-height) + 8mm) !important;
        }
        
        .product-image {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          image-rendering: -webkit-optimize-contrast !important;
          transform: translateZ(0) !important;
        }
        
        .products-grid {
          page-break-inside: auto !important;
          /* 🚀 ALTURA ADICIONAL EN GRID PARA PRINT */
          grid-auto-rows: calc(var(--card-height) + 8mm) !important;
        }
        
        /* 🚀 FIXES CRÍTICOS PARA PRINT */
        .product-info {
          overflow: visible !important;
          height: auto !important;
          min-height: calc(var(--text-area-height) + 5mm) !important;
        }
        
        .product-pricing {
          overflow: visible !important;
          gap: 3mm !important; /* MÁS GAP EN PRINT */
          min-height: 15mm !important; /* ALTURA MÍNIMA EN PRINT */
        }
        
        .product-price-wholesale {
          overflow: visible !important;
          min-height: 10mm !important; /* ALTURA MÍNIMA EN PRINT */
          padding: 2.5mm !important; /* MÁS PADDING EN PRINT */
          position: relative !important;
          z-index: 10 !important;
          margin-top: 1mm !important; /* SEPARACIÓN EN PRINT */
        }
        
        /* 🚀 TEXTO AREA EXPANDIDA PARA PRINT */
        .text-area-corrected {
          min-height: calc(var(--text-area-height) + 8mm) !important;
          height: auto !important;
          gap: 2.5mm !important;
        }
      }
      
      /* ===== OPTIMIZACIONES POR DENSIDAD ===== */
      ${this.generateDensitySpecificCSS(template)}
    `;
  }
  
  /**
   * 📐 DIMENSIONES CORREGIDAS PARA MÁS ESPACIO DE CONTENIDO
   */
  private static calculateCorrectedDimensions(template: IndustryTemplate) {
    const pageWidth = 210;
    const pageHeight = 297;
    
    const marginMap = { 
      alta: 6,
      media: 7,
      baja: 8
    };
    const margin = marginMap[template.density as keyof typeof marginMap] || 10;
    
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);
    
    const columns = template.gridColumns;
    
    // 🔧 GAP OPTIMIZADO
    const gapMap = { 
      alta: Math.max(3, contentWidth * 0.01),
      media: Math.max(4, contentWidth * 0.015),
      baja: Math.max(5, contentWidth * 0.02)
    };
    const gap = gapMap[template.density as keyof typeof gapMap] || 4;
    
    const totalGapWidth = (columns - 1) * gap;
    const availableWidth = contentWidth - totalGapWidth;
    const cardWidth = availableWidth / columns;
    
    // 🚀 ALTURA CORREGIDA PARA MÁS CONTENIDO
    let cardHeight;
    
    if (columns === 3) {
      cardHeight = cardWidth + 30; // Era 22, ahora 30 (+8mm más)
    } else if (columns === 2) {
      cardHeight = cardWidth + 37; // Era 29, ahora 37 (+8mm más)
    } else if (columns === 4) {
      cardHeight = cardWidth + 27; // Era 19, ahora 27 (+8mm más)
    } else if (columns >= 5) {
      cardHeight = cardWidth + 24; // Era 16, ahora 24 (+8mm más)
    } else {
      cardHeight = cardWidth * 0.6 + 32; // Era 24, ahora 32 (+8mm más)
    }
    
    // 🔧 RATIO CORREGIDO PARA MÁS ESPACIO DE TEXTO
    const imageHeightRatio = columns <= 2 ? 0.60 : columns === 3 ? 0.55 : 0.50; // Reducido para más texto
    const imageHeight = cardHeight * imageHeightRatio;
    const textAreaHeight = cardHeight - imageHeight; // Más espacio para texto
    
    const minCardHeight = 40; // Aumentado de 35
    const maxCardHeight = 100; // Aumentado de 90
    
    const finalCardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, cardHeight));
    const finalImageHeight = finalCardHeight * imageHeightRatio;
    const finalTextAreaHeight = finalCardHeight - finalImageHeight;
    
    return {
      pageWidth,
      pageHeight,
      margin,
      contentWidth: Math.floor(contentWidth * 100) / 100,
      contentHeight: Math.floor(contentHeight * 100) / 100,
      columns,
      gap: Math.floor(gap * 100) / 100,
      cardWidth: Math.floor(cardWidth * 100) / 100,
      cardHeight: Math.floor(finalCardHeight * 100) / 100,
      imageHeight: Math.floor(finalImageHeight * 100) / 100,
      textAreaHeight: Math.floor(finalTextAreaHeight * 100) / 100
    };
  }
  
  /**
   * 🎯 TIPOGRAFÍA OPTIMIZADA
   */
  private static calculateTypography(template: IndustryTemplate) {
    const densityMap = {
      alta: { header: 14, title: 8, price: 9, desc: 6, info: 5 },
      media: { header: 18, title: 10, price: 11, desc: 7, info: 6 },
      baja: { header: 22, title: 12, price: 13, desc: 8, info: 7 }
    };
    
    const sizes = densityMap[template.density as keyof typeof densityMap] || densityMap.media;
    
    return {
      headerSize: sizes.header,
      titleSize: sizes.title,
      priceSize: sizes.price,
      descSize: sizes.desc,
      infoSize: sizes.info
    };
  }
  
  /**
   * 🎨 GENERAR ESQUEMA DE COLORES
   */
  private static generateColorScheme(template: IndustryTemplate) {
    const primary = template.colors.primary;
    const secondary = template.colors.secondary || template.colors.primary;
    const accent = template.colors.accent || this.adjustColor(primary, 30);
    const background = template.colors.background || '#ffffff';
    
    const isLight = this.isLightColor(background);
    
    return {
      primary,
      secondary,
      accent,
      background,
      cardBackground: template.colors.cardBackground || (isLight ? '#ffffff' : '#f8f9fa'),
      textPrimary: isLight ? '#2c3e50' : '#ffffff',
      textSecondary: isLight ? '#7f8c8d' : '#bdc3c7',
      borderColor: isLight ? '#e9ecef' : '#34495e'
    };
  }
  
  /**
   * 🏗️ GENERAR HTML CORREGIDO
   */
  static generateCatalogHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
  ): string {
    
    const css = this.generateTemplateCSS(template);
    const productsHTML = this.generateProductsHTMLGrid(products, template);
    const footerHTML = this.generateFooterHTML(businessInfo);
    
    const businessName = businessInfo.business_name || 'Mi Negocio';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=210mm, initial-scale=1.0">
    <title>Catálogo - ${businessName}</title>
    <style>
        ${css}
    </style>
</head>
<body class="template-${template.id}">
    <div class="catalog-container">
        <header class="catalog-header page-break-avoid">
            <h1 class="business-name">${businessName}</h1>
            <p class="catalog-subtitle">Catálogo de Productos</p>
        </header>
        
        <main class="products-section">
            ${productsHTML}
        </main>
        
        ${footerHTML}
    </div>
</body>
</html>`;
  }
  
  /**
   * 🛍️ GENERAR HTML CON GRID
   */
  private static generateProductsHTMLGrid(products: Product[], template: IndustryTemplate): string {
    const productsPerPage = template.productsPerPage;
    const columns = template.gridColumns;
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    let htmlPages = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      const emptyCardsNeeded = productsPerPage - pageProducts.length;
      const totalCards = [...pageProducts];
      
      for (let i = 0; i < emptyCardsNeeded; i++) {
        totalCards.push(null as any);
      }
      
      const pageBreakClass = page > 0 ? 'page-break-before' : '';
      
      htmlPages += `
        <div class="products-page ${pageBreakClass}">
          <div class="products-grid">
            ${totalCards.map(product => 
              product ? this.generateProductCard(product, template) : this.generateEmptyCard()
            ).join('')}
          </div>
        </div>
      `;
    }
    
    return htmlPages;
  }
  
  /**
   * 🚀 GENERAR TARJETA DE PRODUCTO CORREGIDA
   */
  private static generateProductCard(product: Product, template: IndustryTemplate): string {
    const productName = product.name || 'Producto';
    const productPrice = typeof product.price_retail === 'number' ? product.price_retail : 0;
    const productImage = product.image_url || '';
    const productDescription = product.description || '';
    const productSku = product.sku || '';
    const productCategory = product.category || '';
    const productSpecs = product.specifications || '';
    
    const imageHTML = productImage ? 
      `<img 
         src="${productImage}" 
         alt="${productName}" 
         class="product-image contain-mode" 
         loading="eager" 
         crossorigin="anonymous" 
       />` :
      `<div class="product-image-placeholder">
         <div style="font-size: 12pt; margin-bottom: 1mm;">📷</div>
         <div style="font-size: 7pt;">Sin imagen</div>
       </div>`;
    
    return `
      <div class="product-card page-break-avoid">
        <div class="product-card-inner">
          <div class="product-image-container">
            ${imageHTML}
          </div>
          <div class="product-info">
            ${template.showInfo.category && productCategory ? 
              `<div class="product-category">${productCategory}</div>` : ''}
            
            <h3 class="product-name">${productName}</h3>
            
            <div class="product-pricing">
              <div class="product-price-retail">$${(productPrice / 100).toLocaleString('es-MX', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</div>
              ${product.price_wholesale && template.showInfo?.wholesalePrice ? `
                <div class="product-price-wholesale">
                  <span class="wholesale-label">Mayoreo:</span>
                  <span class="wholesale-price">$${(product.price_wholesale / 100).toLocaleString('es-MX', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</span>
                  ${product.wholesale_min_qty && template.showInfo?.wholesaleMinQty ? `
                    <span class="wholesale-min">Min. ${product.wholesale_min_qty}</span>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            
            ${template.showInfo.description && productDescription ? 
              `<p class="product-description">${productDescription}</p>` : ''}
            
            ${template.showInfo.sku && productSku ? 
              `<div class="product-sku">SKU: ${productSku}</div>` : ''}
            
            ${template.showInfo.specifications && productSpecs ? 
              `<div class="product-specifications">${productSpecs}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * ⬜ CARD VACÍA
   */
  private static generateEmptyCard(): string {
    return `<div class="product-card empty-card"></div>`;
  }
  
  /**
   * 📄 GENERAR FOOTER
   */
  private static generateFooterHTML(businessInfo: BusinessInfo): string {
    const contactItems = [
      businessInfo.phone ? `<span class="contact-item">📞 ${businessInfo.phone}</span>` : '',
      businessInfo.social_media?.whatsapp ? `<span class="contact-item">📱 ${businessInfo.social_media.whatsapp}</span>` : '',
      businessInfo.email ? `<span class="contact-item">📧 ${businessInfo.email}</span>` : '',
      businessInfo.website ? `<span class="contact-item">🌐 ${businessInfo.website}</span>` : '',
      businessInfo.address ? `<span class="contact-item">📍 ${businessInfo.address}</span>` : ''
    ].filter(Boolean);
    
    if (contactItems.length === 0) {
      return `
        <footer class="catalog-footer page-break-avoid">
          <div class="footer-branding">
            Generado con CatifyPro v2.0
          </div>
        </footer>
      `;
    }
    
    return `
      <footer class="catalog-footer page-break-avoid">
        <div class="business-contact">
          ${contactItems.join('')}
        </div>
        <div class="footer-branding">
          Generado con CatifyPro v2.0
        </div>
      </footer>
    `;
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  private static getNameLines(density: string): number {
    return { alta: 2, media: 2, baja: 3 }[density as keyof typeof density] || 2;
  }
  
  private static getDescLines(density: string): number {
    return { alta: 1, media: 2, baja: 3 }[density as keyof typeof density] || 2;
  }
  
  private static getSpecsHeight(density: string): number {
    return { alta: 6, media: 8, baja: 12 }[density as keyof typeof density] || 8;
  }
  
  private static generateDensitySpecificCSS(template: IndustryTemplate): string {
    if (template.density === 'alta') {
      return `
        .template-${template.id} .product-card {
          border-width: 0.25pt !important;
        }
      `;
    }
    
    if (template.density === 'baja') {
      return `
        .template-${template.id} .product-card {
          border-width: 1pt !important;
        }
      `;
    }
    
    return '';
  }
  
  private static isLightColor(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  
  private static getContrastColor(hexColor: string): string {
    return this.isLightColor(hexColor) ? '#2c3e50' : '#ffffff';
  }
  
  private static adjustColor(hexColor: string, adjustment: number): string {
    const hex = hexColor.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + adjustment));
    const g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + adjustment));
    const b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + adjustment));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  private static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}