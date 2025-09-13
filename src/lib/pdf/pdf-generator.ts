// src/lib/pdf/pdf-generator.ts
// 📄 SISTEMA REAL DE CONVERSIÓN HTML→PDF

interface PDFOptions {
  format: 'A4' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  quality: 'low' | 'medium' | 'high';
  includeBackground: boolean;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface PDFResult {
  success: boolean;
  error?: string;
  blob?: Blob;
  downloadUrl?: string;
}

export class PDFGenerator {
  
  /**
   * 🎯 GENERAR PDF REAL DESDE HTML
   */
  static async generatePDF(
    htmlContent: string, 
    filename: string, 
    options: Partial<PDFOptions> = {}
  ): Promise<PDFResult> {
    
    const defaultOptions: PDFOptions = {
      format: 'A4',
      orientation: 'portrait', 
      quality: 'high',
      includeBackground: true,
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    };
    
    const pdfOptions = { ...defaultOptions, ...options };
    
    try {
      console.log('🚀 Iniciando conversión HTML→PDF...');
      
      // MÉTODO 1: Browser Print API (Más confiable)
      if (typeof window !== 'undefined') {
        return await this.generatePDFViaBrowser(htmlContent, filename, pdfOptions);
      }
      
      // MÉTODO 2: Server API (Si está disponible)
      return await this.generatePDFViaServer(htmlContent, filename, pdfOptions);
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido en PDF' 
      };
    }
  }
  
  /**
   * 🖥️ GENERACIÓN PDF VÍA BROWSER (Print Dialog)
   */
  private static async generatePDFViaBrowser(
    htmlContent: string, 
    filename: string, 
    options: PDFOptions
  ): Promise<PDFResult> {
    
    try {
      // Crear ventana temporal optimizada para PDF
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('⚠️ Popup bloqueado. Permite ventanas emergentes para generar PDF.');
      }
      
      // HTML optimizado para PDF
      const optimizedHTML = this.optimizeHTMLForPrint(htmlContent, options);
      
      // Escribir contenido a la ventana
      printWindow.document.open();
      printWindow.document.write(optimizedHTML);
      printWindow.document.close();
      
      // Esperar a que cargue completamente
      await new Promise<void>((resolve) => {
        if (printWindow.document.readyState === 'complete') {
          resolve();
        } else {
          printWindow.onload = () => resolve();
          // Fallback timeout
          setTimeout(resolve, 2000);
        }
      });
      
      // Aplicar configuraciones de impresión
      printWindow.focus();
      
      // Configurar print settings si es posible
      if ('print' in printWindow) {
        // Mostrar dialog de impresión nativo
        printWindow.print();
        
        console.log('✅ PDF abierto en dialog de impresión');
        
        return { 
          success: true,
          downloadUrl: printWindow.location.href
        };
      } else {
        throw new Error('Función de impresión no disponible');
      }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error en generación browser PDF' 
      };
    }
  }
  
  /**
   * 🌐 GENERACIÓN PDF VÍA API SERVER (Futuro)
   */
  private static async generatePDFViaServer(
    htmlContent: string, 
    filename: string, 
    options: PDFOptions
  ): Promise<PDFResult> {
    
    try {
      console.log('🔄 Intentando conversión via servidor...');
      
      // TODO: Implementar endpoint en backend
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf' 
        },
        body: JSON.stringify({
          html: htmlContent,
          filename: filename,
          options: options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error del servidor PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.type !== 'application/pdf') {
        throw new Error('Respuesta del servidor no es un PDF válido');
      }
      
      // Descargar automáticamente
      this.downloadBlob(blob, `${filename}.pdf`);
      
      console.log('✅ PDF generado via servidor');
      
      return { 
        success: true, 
        blob: blob 
      };
      
    } catch (error) {
      console.warn('⚠️ Server PDF no disponible:', error);
      
      // Fallback a método browser
      return this.generatePDFViaBrowser(htmlContent, filename, options);
    }
  }
  
  /**
   * 🎨 OPTIMIZAR HTML PARA IMPRESIÓN PDF
   */
  private static optimizeHTMLForPrint(htmlContent: string, options: PDFOptions): string {
    
    const printOptimizedCSS = `
      <style id="pdf-optimization">
        /* ===== PDF PRINT OPTIMIZATION ===== */
        
        @page {
          size: ${options.format} ${options.orientation};
          margin: ${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm;
        }
        
        /* Reset para PDF */
        * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        html, body {
          height: auto !important;
          font-family: 'Arial', 'Helvetica', sans-serif !important;
          line-height: 1.4 !important;
          color: #333 !important;
          background: white !important;
        }
        
        /* ===== PAGE BREAKS INTELIGENTES ===== */
        .catalog-header {
          break-after: avoid !important;
          page-break-after: avoid !important;
        }
        
        .product-card {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          margin-bottom: 15px !important;
        }
        
        .products-grid {
          display: grid !important;
          gap: 15px !important;
          page-break-inside: auto !important;
        }
        
        .products-section {
          break-before: avoid !important;
        }
        
        /* ===== OPTIMIZACIÓN DE IMÁGENES ===== */
        .product-image, img {
          max-width: 100% !important;
          height: auto !important;
          object-fit: contain !important;
          display: block !important;
          filter: none !important;
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
        }
        
        .product-image-container {
          overflow: visible !important;
          background: #fafafa !important;
        }
        
        /* ===== OPTIMIZACIÓN DE TEXTO ===== */
        .product-name, .business-name {
          font-weight: 600 !important;
          color: #333 !important;
          text-overflow: ellipsis !important;
          word-wrap: break-word !important;
        }
        
        .product-price {
          font-weight: 700 !important;
          color: #000 !important;
        }
        
        .product-description {
          font-size: 11px !important;
          line-height: 1.3 !important;
          color: #666 !important;
          overflow: hidden !important;
        }
        
        /* ===== LAYOUT PARA PDF ===== */
        .catalog-header {
          padding: 20px !important;
          text-align: center !important;
          border-bottom: 2px solid #eee !important;
          margin-bottom: 20px !important;
        }
        
        .business-name {
          font-size: 24px !important;
          margin-bottom: 5px !important;
        }
        
        .catalog-subtitle {
          font-size: 14px !important;
          color: #666 !important;
        }
        
        /* ===== GRID RESPONSIVO PARA PDF ===== */
        .products-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
        }
        
        /* Ajustar grid según formato */
        @media print and (max-width: 210mm) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media print and (min-width: 297mm) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        
        /* ===== TARJETAS OPTIMIZADAS ===== */
        .product-card {
          background: white !important;
          border: 1px solid #ddd !important;
          border-radius: 8px !important;
          padding: 15px !important;
          box-shadow: none !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .product-info {
          padding: 10px 0 !important;
        }
        
        /* ===== FOOTER ===== */
        .catalog-footer {
          margin-top: 30px !important;
          padding: 15px !important;
          border-top: 1px solid #ddd !important;
          text-align: center !important;
          font-size: 11px !important;
          color: #666 !important;
          break-inside: avoid !important;
        }
        
        .business-contact {
          margin-bottom: 10px !important;
        }
        
        .contact-item {
          display: inline-block !important;
          margin: 0 10px !important;
        }
        
        /* ===== OCULTAR ELEMENTOS NO IMPRIMIBLES ===== */
        .no-print,
        .print-hidden,
        button:not(.print-show),
        input:not(.print-show),
        .template-preview-wrapper,
        .selection-indicator {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* ===== COLORES PARA PDF ===== */
        ${options.includeBackground ? '' : `
          * {
            background: white !important;
            background-image: none !important;
          }
        `}
      </style>
    `;
    
    // Inyectar CSS de optimización
    let optimizedHTML = htmlContent;
    
    // Si ya tiene </head>, insertamos antes
    if (optimizedHTML.includes('</head>')) {
      optimizedHTML = optimizedHTML.replace('</head>', `${printOptimizedCSS}</head>`);
    } else {
      // Si no tiene head, lo agregamos
      optimizedHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${printOptimizedCSS}
        </head>
        <body>
          ${optimizedHTML}
        </body>
        </html>
      `;
    }
    
    return optimizedHTML;
  }
  
  /**
   * 📥 DESCARGAR BLOB COMO ARCHIVO
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Agregar, click, y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      URL.revokeObjectURL(url);
      
      console.log(`✅ Archivo descargado: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
    }
  }
  
  /**
   * 🧪 PROBAR COMPATIBILIDAD PDF
   */
  static testPDFCompatibility(): { 
    browserSupport: boolean; 
    printAPI: boolean; 
    serverAPI: boolean;
    recommendations: string[];
  } {
    
    const recommendations: string[] = [];
    
    // Test browser support
    const browserSupport = typeof window !== 'undefined' && 'print' in window;
    if (!browserSupport) {
      recommendations.push('Usa un navegador moderno (Chrome, Firefox, Safari, Edge)');
    }
    
    // Test print API
    const printAPI = typeof window !== 'undefined' && 'print' in window;
    if (!printAPI) {
      recommendations.push('Función de impresión no disponible en este entorno');
    }
    
    // Test server API (placeholder)
    const serverAPI = false; // TODO: implementar check real
    if (!serverAPI) {
      recommendations.push('API de servidor PDF no configurada (opcional)');
    }
    
    return {
      browserSupport,
      printAPI,
      serverAPI,
      recommendations
    };
  }
}

// ===== FUNCIÓN PRINCIPAL PARA USAR EN UNIFIED-GENERATOR =====

/**
 * 📄 REEMPLAZAR downloadCatalogAsPDF EN unified-generator.ts
 */
export const generateCatalogPDF = async (
  htmlContent: string,
  filename: string,
  options?: Partial<PDFOptions>
): Promise<{ success: boolean; error?: string }> => {
  
  try {
    const result = await PDFGenerator.generatePDF(htmlContent, filename, options);
    
    if (!result.success) {
      console.error('❌ Error generando PDF:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('✅ PDF generado exitosamente');
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error en generateCatalogPDF:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export default PDFGenerator;