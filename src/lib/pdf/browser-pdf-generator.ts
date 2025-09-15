// src/lib/pdf/browser-pdf-generator.ts
// 📄 GENERADOR PDF COMPATIBLE CON TODOS LOS BROWSERS - IMÁGENES CORREGIDAS

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface PDFGenerationOptions {
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
  quality?: 'low' | 'medium' | 'high';
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
}

interface PDFResult {
  success: boolean;
  error?: string;
  method?: 'jspdf' | 'print' | 'html' | 'canvas';
}

// Template dinámico simplificado para compatibilidad
interface SimpleDynamicTemplate {
  id: string;
  displayName: string;
  productsPerPage: number;
  layout: {
    columns: number;
    rows: number;
    spacing: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headerSize: string;
    productNameSize: string;
    priceSize: string;
  };
}

export class BrowserPDFGenerator {
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL - GENERAR PDF COMPATIBLE CON TODOS LOS BROWSERS
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate,
    options: PDFGenerationOptions = {}
  ): Promise<PDFResult> {
    
    console.log('📄 Iniciando generación PDF compatible...');
    
    if (options.onProgress) options.onProgress(10);
    
    try {
      // Método 1: jsPDF + html2canvas (Preferido)
      const jspdfResult = await this.generateWithJsPDF(products, businessInfo, template, options);
      if (jspdfResult.success) {
        console.log('✅ PDF generado con jsPDF + html2canvas');
        return { ...jspdfResult, method: 'jspdf' };
      }
      
      // Método 2: Browser Print API (Fallback)
      console.log('⚠️ jsPDF falló, intentando Print API...');
      const printResult = await this.generateWithPrintAPI(products, businessInfo, template, options);
      if (printResult.success) {
        console.log('✅ PDF generado con Print API');
        return { ...printResult, method: 'print' };
      }
      
      // Método 3: Descarga HTML (Último recurso)
      console.log('⚠️ Print API falló, usando descarga HTML...');
      const htmlResult = await this.generateHTMLDownload(products, businessInfo, template);
      console.log('✅ HTML generado como fallback');
      return { ...htmlResult, method: 'html' };
      
    } catch (error) {
      console.error('❌ Error en generación PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 📄 MÉTODO 1: jsPDF + html2canvas - CORREGIDO
   */
  private static async generateWithJsPDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate,
    options: PDFGenerationOptions
  ): Promise<PDFResult> {
    
    try {
      if (options.onProgress) options.onProgress(20);
      
      // 1. Crear HTML temporal optimizado para PDF
      const htmlElement = this.createOptimizedHTMLElement(products, businessInfo, template);
      document.body.appendChild(htmlElement);
      
      // Esperar a que las imágenes se carguen completamente
      await this.preloadImages(htmlElement);
      
      if (options.onProgress) options.onProgress(40);
      
      // 2. Configurar html2canvas con opciones optimizadas para imágenes
      const canvasOptions = {
        scale: options.quality === 'high' ? 2 : options.quality === 'low' ? 1 : 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: template.colors.background,
        width: htmlElement.scrollWidth,
        height: htmlElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: htmlElement.scrollHeight,
        // Opciones específicas para mejor rendering de imágenes
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false // Mejor para imágenes
      };
      
      // 3. Generar canvas
      const canvas = await html2canvas(htmlElement, canvasOptions);
      
      if (options.onProgress) options.onProgress(70);
      
      // 4. Configurar jsPDF
      const pageSize = options.pageSize || 'A4';
      const orientation = options.orientation || 'portrait';
      const pdf = new jsPDF(orientation, 'mm', pageSize.toLowerCase());
      
      // 5. Calcular dimensiones
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 6. Añadir imagen al PDF con mejor calidad
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Calidad más alta
      
      // Si la imagen es más alta que la página, dividir en múltiples páginas
      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      } else {
        let yPosition = 0;
        const pageContentHeight = pageHeight - 20;
        
        while (yPosition < imgHeight) {
          if (yPosition > 0) {
            pdf.addPage();
          }
          
          const sourceY = (yPosition * canvas.height) / imgHeight;
          const sourceHeight = Math.min(
            (pageContentHeight * canvas.height) / imgHeight,
            canvas.height - sourceY
          );
          
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d')!;
          
          tempCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const tempImgData = tempCanvas.toDataURL('image/jpeg', 0.95);
          const tempImgHeight = (sourceHeight * imgWidth) / canvas.width;
          
          pdf.addImage(tempImgData, 'JPEG', 10, 10, imgWidth, tempImgHeight);
          
          yPosition += pageContentHeight;
        }
      }
      
      if (options.onProgress) options.onProgress(90);
      
      // 7. Descargar PDF
      const filename = `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);
      
      // 8. Cleanup
      document.body.removeChild(htmlElement);
      
      if (options.onProgress) options.onProgress(100);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error en jsPDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en jsPDF'
      };
    }
  }
  
  /**
   * 🖼️ PRECARGAR IMÁGENES PARA MEJOR RENDERING
   */
  private static async preloadImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continuar aunque falle una imagen
          // Timeout de seguridad
          setTimeout(() => resolve(), 5000);
        }
      });
    });
    
    await Promise.all(imagePromises);
    // Pequeña pausa adicional para asegurar rendering
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * 🖨️ MÉTODO 2: Browser Print API - MEJORADO
   */
  private static async generateWithPrintAPI(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate,
    options: PDFGenerationOptions
  ): Promise<PDFResult> {
    
    try {
      if (options.onProgress) options.onProgress(30);
      
      const printHTML = this.createPrintOptimizedHTML(products, businessInfo, template);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('No se pudo abrir ventana de impresión');
      }
      
      if (options.onProgress) options.onProgress(60);
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      await new Promise(resolve => {
        printWindow.onload = resolve;
        setTimeout(resolve, 1000);
      });
      
      if (options.onProgress) options.onProgress(80);
      
      printWindow.focus();
      printWindow.print();
      
      setTimeout(() => {
        printWindow.close();
      }, 1000);
      
      if (options.onProgress) options.onProgress(100);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error en Print API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en Print API'
      };
    }
  }
  
  /**
   * 📄 MÉTODO 3: Descarga HTML (Fallback final)
   */
  private static async generateHTMLDownload(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate
  ): Promise<PDFResult> {
    
    try {
      const standaloneHTML = this.createStandaloneHTML(products, businessInfo, template);
      
      const blob = new Blob([standaloneHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error en HTML download:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en HTML download'
      };
    }
  }
  
  /**
   * 🏗️ CREAR ELEMENTO HTML OPTIMIZADO - IMÁGENES CORREGIDAS
   */
  private static createOptimizedHTMLElement(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate
  ): HTMLElement {
    
    const element = document.createElement('div');
    element.className = 'pdf-catalog';
    
    // CSS inline corregido para preservar aspect ratio
    const css = `
      <style>
        .pdf-catalog {
          width: 210mm;
          min-height: 297mm;
          background: ${template.colors.background};
          font-family: 'Arial', sans-serif;
          color: ${template.colors.text};
          padding: 20px;
          box-sizing: border-box;
          margin: 0;
        }
        
        .catalog-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
          color: white;
          border-radius: 10px;
        }
        
        .business-name {
          font-size: ${template.typography.headerSize};
          font-weight: bold;
          margin: 0;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(${template.layout.columns}, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .product-card {
          background: white;
          border: 2px solid ${template.colors.accent};
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
        }
        
        /* 🎯 SISTEMA DE IMÁGENES CORREGIDO */
        .product-image-container {
          width: 100%;
          aspect-ratio: 1 / 1;
          position: relative;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e9ecef;
        }
        
        .product-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          display: block;
          object-fit: contain;
        }
        
        .product-name {
          font-size: ${template.typography.productNameSize};
          font-weight: 600;
          color: ${template.colors.primary};
          margin: 0 0 8px 0;
          word-wrap: break-word;
          hyphens: auto;
          line-height: 1.3;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        
        .product-price {
          font-size: ${template.typography.priceSize};
          font-weight: 700;
          color: ${template.colors.secondary};
          background: ${template.colors.accent}20;
          padding: 6px 10px;
          border-radius: 6px;
          display: inline-block;
          margin-top: auto;
        }
        
        .product-description {
          font-size: 11px;
          margin: 8px 0 0 0;
          color: #666;
          word-wrap: break-word;
          line-height: 1.2;
          max-height: 2.4em;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .catalog-footer {
          margin-top: 30px;
          text-align: center;
          padding: 15px;
          background: ${template.colors.primary}10;
          border-radius: 8px;
          font-size: 14px;
        }
        
        /* Ajustes responsivos para diferentes densidades */
        ${template.productsPerPage <= 4 ? `
          .product-image-container {
            aspect-ratio: 4 / 3;
          }
          .product-card {
            padding: 16px;
          }
        ` : template.productsPerPage <= 9 ? `
          .product-image-container {
            aspect-ratio: 1 / 1;
          }
          .product-card {
            padding: 12px;
          }
        ` : `
          .product-image-container {
            aspect-ratio: 1 / 1;
          }
          .product-card {
            padding: 8px;
          }
          .product-name {
            font-size: calc(${template.typography.productNameSize} * 0.9);
          }
        `}
        
        @media print {
          .pdf-catalog {
            width: 100%;
            min-height: auto;
            margin: 0;
            padding: 10mm;
          }
        }
      </style>
    `;
    
    // Dividir productos en páginas
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    let html = css;
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      html += `
        <div class="catalog-page" ${page > 0 ? 'style="page-break-before: always;"' : ''}>
          ${page === 0 ? `
            <div class="catalog-header">
              <h1 class="business-name">${businessInfo.business_name}</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Catálogo ${template.displayName}</p>
            </div>
          ` : ''}
          
          <div class="products-grid">
            ${pageProducts.map(product => {
              // Generar placeholder SVG para imágenes faltantes
              const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                  <rect fill="#f8f9fa" stroke="#dee2e6" width="200" height="200"/>
                  <text x="50%" y="45%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="12">Sin imagen</text>
                  <text x="50%" y="60%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="10">${product.name.substring(0, 20)}</text>
                </svg>
              `)}`;
              
              return `
                <div class="product-card">
                  <div class="product-image-container">
                    <img 
                      src="${product.image_url || placeholderSvg}" 
                      alt="${product.name}"
                      class="product-image"
                      crossorigin="anonymous"
                      loading="eager"
                      onerror="this.src='${placeholderSvg}'"
                    />
                  </div>
                  <h3 class="product-name">${product.name}</h3>
                  <div class="product-price">$${product.price_retail.toLocaleString('es-MX')}</div>
                  ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          ${page === totalPages - 1 ? `
            <div class="catalog-footer">
              <strong>📞 ${businessInfo.phone || ''} | 📧 ${businessInfo.email || ''}</strong><br>
              <small>Catálogo generado con CatalogoIA - ${products.length} productos</small>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    element.innerHTML = html;
    
    // Configurar estilos del elemento
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '210mm';
    element.style.backgroundColor = template.colors.background;
    
    return element;
  }
  
  /**
   * 🖨️ CREAR HTML OPTIMIZADO PARA IMPRESIÓN - MEJORADO
   */
  private static createPrintOptimizedHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate
  ): string {
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Catálogo ${businessInfo.business_name}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            color: ${template.colors.text};
            background: ${template.colors.background};
            line-height: 1.4;
          }
          
          .catalog-header {
            text-align: center;
            margin-bottom: 20px;
            padding: 15px;
            background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
            color: white;
            border-radius: 8px;
            print-color-adjust: exact;
          }
          
          .business-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .products-grid {
            display: grid;
            grid-template-columns: repeat(${template.layout.columns}, 1fr);
            gap: 12px;
            margin-bottom: 15px;
          }
          
          .product-card {
            background: white;
            border: 1px solid ${template.colors.accent};
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
            print-color-adjust: exact;
            display: flex;
            flex-direction: column;
          }
          
          .product-image-container {
            width: 100%;
            aspect-ratio: 1 / 1;
            position: relative;
            background: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e9ecef;
          }
          
          .product-image {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            display: block;
            object-fit: contain;
          }
          
          .product-name {
            font-size: 13px;
            font-weight: 600;
            color: ${template.colors.primary};
            margin-bottom: 6px;
            print-color-adjust: exact;
            word-wrap: break-word;
            line-height: 1.2;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .product-price {
            font-size: 15px;
            font-weight: 700;
            color: ${template.colors.secondary};
            background: ${template.colors.accent}20;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            print-color-adjust: exact;
            margin-top: auto;
          }
          
          .catalog-footer {
            margin-top: 20px;
            text-align: center;
            padding: 10px;
            background: ${template.colors.primary}10;
            border-radius: 6px;
            font-size: 12px;
            print-color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-instructions no-print" style="background: #e3f2fd; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
          <strong>📄 Para guardar como PDF:</strong> 
          Presiona Ctrl+P (Cmd+P en Mac) → Selecciona "Guardar como PDF" → Ajusta márgenes y configuración
          <br><small>Esta información no aparecerá en el PDF final</small>
        </div>
        
        <div class="catalog-header">
          <h1 class="business-name">${businessInfo.business_name}</h1>
          <p>Catálogo ${template.displayName} - ${products.length} productos</p>
        </div>
        
        ${this.generateProductPagesHTML(products, template)}
        
        <div class="catalog-footer">
          <strong>📞 ${businessInfo.phone || ''} | 📧 ${businessInfo.email || ''}</strong><br>
          <small>Catálogo generado con CatalogoIA</small>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 📄 CREAR HTML STANDALONE (Para descarga) - MEJORADO
   */
  private static createStandaloneHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate
  ): string {
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catálogo ${businessInfo.business_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: ${template.colors.text};
            background: ${template.colors.background};
            padding: 20px;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          
          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .product-card {
            background: white;
            border: 2px solid ${template.colors.accent};
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
            display: flex;
            flex-direction: column;
          }
          
          .product-card:hover {
            transform: translateY(-5px);
          }
          
          .product-image-container {
            width: 100%;
            aspect-ratio: 1 / 1;
            position: relative;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e9ecef;
          }
          
          .product-image {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            display: block;
            object-fit: contain;
          }
          
          .product-name {
            font-size: 1.2em;
            font-weight: bold;
            color: ${template.colors.primary};
            margin-bottom: 10px;
            word-wrap: break-word;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .product-price {
            font-size: 1.4em;
            font-weight: bold;
            color: ${template.colors.secondary};
            background: ${template.colors.accent}20;
            padding: 8px 16px;
            border-radius: 8px;
            display: inline-block;
            margin-top: auto;
          }
          
          .footer {
            text-align: center;
            background: ${template.colors.primary}10;
            padding: 20px;
            border-radius: 12px;
            margin-top: 30px;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${template.colors.primary};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
          }
          
          .print-button:hover {
            opacity: 0.9;
          }
          
          @media print {
            .print-button { display: none; }
            body { padding: 0; }
            .container { max-width: none; }
          }
          
          @media (max-width: 768px) {
            .products-grid {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            .header h1 { font-size: 2em; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Imprimir / PDF</button>
        
        <div class="container">
          <header class="header">
            <h1>${businessInfo.business_name}</h1>
            <p>Catálogo ${template.displayName}</p>
            <p>${products.length} productos disponibles</p>
          </header>
          
          <div class="products-grid">
            ${products.map(product => {
              const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                  <rect fill="#f8f9fa" stroke="#dee2e6" width="200" height="200"/>
                  <text x="50%" y="45%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="14">Sin imagen</text>
                  <text x="50%" y="60%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="12">${product.name.substring(0, 15)}</text>
                </svg>
              `)}`;
              
              return `
                <div class="product-card">
                  <div class="product-image-container">
                    <img 
                      src="${product.image_url || placeholderSvg}"
                      alt="${product.name}"
                      class="product-image"
                      crossorigin="anonymous"
                      loading="lazy"
                      onerror="this.src='${placeholderSvg}'"
                    />
                  </div>
                  <h3 class="product-name">${product.name}</h3>
                  <div class="product-price">$${product.price_retail.toLocaleString('es-MX')}</div>
                  ${product.description ? `<p style="margin-top: 10px; font-size: 14px; color: #666; word-wrap: break-word;">${product.description}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          <footer class="footer">
            <h3>Información de Contacto</h3>
            <p><strong>📞 ${businessInfo.phone || 'Teléfono no disponible'}</strong></p>
            <p><strong>📧 ${businessInfo.email || 'Email no disponible'}</strong></p>
            ${businessInfo.website ? `<p><strong>🌐 ${businessInfo.website}</strong></p>` : ''}
            ${businessInfo.address ? `<p><strong>📍 ${businessInfo.address}</strong></p>` : ''}
            <br>
            <small>Catálogo generado con CatalogoIA - ${new Date().toLocaleDateString('es-MX')}</small>
          </footer>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 🏭 GENERAR HTML DE PRODUCTOS PARA IMPRESIÓN - MEJORADO
   */
  private static generateProductPagesHTML(products: Product[], template: SimpleDynamicTemplate): string {
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    let html = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      html += `
        <div class="products-page ${page > 0 ? 'page-break' : ''}">
          <div class="products-grid">
            ${pageProducts.map(product => {
              const placeholderSvg = `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
                  <rect fill="#f8f9fa" stroke="#dee2e6" width="120" height="120"/>
                  <text x="50%" y="45%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="10">Sin imagen</text>
                  <text x="50%" y="60%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="8">${product.name.substring(0, 12)}</text>
                </svg>
              `)}`;
              
              return `
                <div class="product-card">
                  <div class="product-image-container">
                    <img 
                      src="${product.image_url || placeholderSvg}"
                      alt="${product.name}"
                      class="product-image"
                      crossorigin="anonymous"
                      loading="eager"
                      onerror="this.src='${placeholderSvg}'"
                    />
                  </div>
                  <h3 class="product-name">${product.name}</h3>
                  <div class="product-price">$${product.price_retail.toLocaleString('es-MX')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    return html;
  }
}

// ===== FUNCIONES DE CONVENIENCIA =====

/**
 * 🎯 FUNCIÓN PRINCIPAL PARA GENERAR PDF
 */
export const generateBrowserCompatiblePDF = async (
  products: Product[],
  businessInfo: BusinessInfo,
  template: SimpleDynamicTemplate,
  options?: PDFGenerationOptions
): Promise<PDFResult> => {
  return BrowserPDFGenerator.generatePDF(products, businessInfo, template, options);
};

/**
 * 📄 FUNCIÓN RÁPIDA PARA PDF CON CONFIGURACIÓN AUTOMÁTICA
 */
export const quickGeneratePDF = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateConfig: {
    displayName: string;
    productsPerPage: number;
    colors: { primary: string; secondary: string; accent: string; background: string; text: string; };
  },
  onProgress?: (progress: number) => void
): Promise<PDFResult> => {
  
  const template: SimpleDynamicTemplate = {
    id: 'quick-template',
    displayName: templateConfig.displayName,
    productsPerPage: templateConfig.productsPerPage,
    layout: {
      columns: templateConfig.productsPerPage <= 3 ? 3 : templateConfig.productsPerPage <= 6 ? 3 : 4,
      rows: Math.ceil(templateConfig.productsPerPage / (templateConfig.productsPerPage <= 3 ? 3 : templateConfig.productsPerPage <= 6 ? 3 : 4)),
      spacing: 'normal'
    },
    colors: templateConfig.colors,
    typography: {
      headerSize: templateConfig.productsPerPage <= 3 ? '32px' : templateConfig.productsPerPage <= 6 ? '28px' : '24px',
      productNameSize: templateConfig.productsPerPage <= 3 ? '18px' : templateConfig.productsPerPage <= 6 ? '16px' : '14px',
      priceSize: templateConfig.productsPerPage <= 3 ? '20px' : templateConfig.productsPerPage <= 6 ? '18px' : '16px'
    }
  };
  
  return BrowserPDFGenerator.generatePDF(products, businessInfo, template, {
    showProgress: !!onProgress,
    onProgress,
    quality: 'medium'
  });
};

export default BrowserPDFGenerator;