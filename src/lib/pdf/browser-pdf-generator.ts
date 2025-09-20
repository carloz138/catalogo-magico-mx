// src/lib/pdf/browser-pdf-generator.ts
// 📄 GENERADOR PDF CON jsPDF DIRECTO - SIN DEFORMACIÓN DE IMÁGENES

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
      // Método 1: jsPDF directo (Preferido y corregido)
      const jspdfResult = await this.generateWithJsPDF(products, businessInfo, template, options);
      if (jspdfResult.success) {
        console.log('✅ PDF generado con jsPDF directo');
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
   * 📄 MÉTODO 1: jsPDF DIRECTO - SIN html2canvas - PRESERVA PROPORCIONES
   */
  private static async generateWithJsPDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate,
    options: PDFGenerationOptions
  ): Promise<PDFResult> {
    
    try {
      console.log('📄 Generando PDF con jsPDF directo...');
      
      if (options.onProgress) options.onProgress(20);
      
      // 1. Configurar jsPDF
      const pageSize = options.pageSize || 'A4';
      const orientation = options.orientation || 'portrait';
      const pdf = new jsPDF(orientation, 'mm', pageSize.toLowerCase());
      
      // 2. Dimensiones de página
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margins = { top: 15, bottom: 15, left: 15, right: 15 };
      const usableWidth = pageWidth - margins.left - margins.right;
      const usableHeight = pageHeight - margins.top - margins.bottom;
      
      // 3. Configuración de grid
      const columns = template.layout.columns;
      const productsPerPage = template.productsPerPage;
      const rows = Math.ceil(productsPerPage / columns);
      
      // 4. Calcular dimensiones de cada celda
      const cellWidth = usableWidth / columns;
      const cellHeight = usableHeight / (rows + 1); // +1 para header
      const headerHeight = cellHeight * 0.8;
      const productCellHeight = cellHeight * 0.9;
      
      // Espacios internos de cada celda
      const cellPadding = 3;
      const imageAreaWidth = cellWidth - (cellPadding * 2);
      const imageAreaHeight = productCellHeight * 0.6; // 60% para imagen
      const textAreaHeight = productCellHeight * 0.4; // 40% para texto
      
      if (options.onProgress) options.onProgress(30);
      
      // 5. Cargar todas las imágenes
      console.log('🖼️ Cargando imágenes...');
      const loadedImages = await this.loadAllImages(products, options.onProgress);
      
      if (options.onProgress) options.onProgress(60);
      
      // 6. Generar páginas
      const totalPages = Math.ceil(products.length / productsPerPage);
      let currentPageProducts = 0;
      
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Header de página
        this.addPageHeader(pdf, businessInfo, template, pageWidth, margins, headerHeight);
        
        // Productos de esta página
        const startIndex = pageIndex * productsPerPage;
        const endIndex = Math.min(startIndex + productsPerPage, products.length);
        const pageProducts = products.slice(startIndex, endIndex);
        
        // Dibujar grid de productos
        await this.drawProductGrid(
          pdf,
          pageProducts,
          loadedImages,
          template,
          {
            startY: margins.top + headerHeight + 5,
            cellWidth,
            cellHeight: productCellHeight,
            cellPadding,
            imageAreaWidth,
            imageAreaHeight,
            textAreaHeight,
            columns,
            margins
          }
        );
        
        currentPageProducts += pageProducts.length;
        
        // Footer si es la última página
        if (pageIndex === totalPages - 1) {
          this.addPageFooter(pdf, businessInfo, products.length, pageHeight, margins);
        }
        
        // Progress update
        const progress = 60 + (40 * (currentPageProducts / products.length));
        if (options.onProgress) options.onProgress(Math.round(progress));
      }
      
      if (options.onProgress) options.onProgress(95);
      
      // 7. Descargar PDF
      const filename = `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);
      
      if (options.onProgress) options.onProgress(100);
      
      console.log('✅ PDF generado exitosamente con jsPDF directo');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en jsPDF directo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en jsPDF directo'
      };
    }
  }
  
  /**
   * 🖼️ CARGAR TODAS LAS IMÁGENES Y CALCULAR SUS DIMENSIONES REALES
   */
  private static async loadAllImages(
    products: Product[], 
    onProgress?: (progress: number) => void
  ): Promise<Map<string, { img: HTMLImageElement; aspectRatio: number; loaded: boolean }>> {
    
    const imageMap = new Map();
    const loadPromises = products.map(async (product, index) => {
      
      try {
        if (!product.image_url) {
          imageMap.set(product.id, { img: null, aspectRatio: 1, loaded: false });
          return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const loadPromise = new Promise<void>((resolve) => {
          img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            imageMap.set(product.id, { 
              img, 
              aspectRatio: isNaN(aspectRatio) ? 1 : aspectRatio, 
              loaded: true 
            });
            resolve();
          };
          
          img.onerror = () => {
            console.warn(`⚠️ Error cargando imagen: ${product.image_url}`);
            imageMap.set(product.id, { img: null, aspectRatio: 1, loaded: false });
            resolve();
          };
          
          // Timeout de seguridad
          setTimeout(() => {
            if (!imageMap.has(product.id)) {
              imageMap.set(product.id, { img: null, aspectRatio: 1, loaded: false });
              resolve();
            }
          }, 8000);
        });
        
        img.src = product.image_url;
        await loadPromise;
        
        // Update progress
        if (onProgress) {
          const progress = 30 + (30 * (index + 1) / products.length);
          onProgress(Math.round(progress));
        }
        
      } catch (error) {
        console.warn(`⚠️ Error procesando imagen ${product.id}:`, error);
        imageMap.set(product.id, { img: null, aspectRatio: 1, loaded: false });
      }
    });
    
    await Promise.all(loadPromises);
    console.log(`✅ Cargadas ${imageMap.size} imágenes`);
    
    return imageMap;
  }
  
  /**
   * 📋 DIBUJAR GRID DE PRODUCTOS CON PROPORCIONES EXACTAS
   */
  private static async drawProductGrid(
    pdf: jsPDF,
    products: Product[],
    loadedImages: Map<string, any>,
    template: SimpleDynamicTemplate,
    layout: {
      startY: number;
      cellWidth: number;
      cellHeight: number;
      cellPadding: number;
      imageAreaWidth: number;
      imageAreaHeight: number;
      textAreaHeight: number;
      columns: number;
      margins: { left: number; right: number; top: number; bottom: number; };
    }
  ): Promise<void> {
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imageData = loadedImages.get(product.id);
      
      // Calcular posición en grid
      const row = Math.floor(i / layout.columns);
      const col = i % layout.columns;
      
      const x = layout.margins.left + (col * layout.cellWidth);
      const y = layout.startY + (row * layout.cellHeight);
      
      // Dibujar borde de celda
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.rect(x, y, layout.cellWidth, layout.cellHeight);
      
      // Área de imagen
      const imgX = x + layout.cellPadding;
      const imgY = y + layout.cellPadding;
      const imgMaxWidth = layout.imageAreaWidth;
      const imgMaxHeight = layout.imageAreaHeight;
      
      // Dibujar imagen si existe y se cargó
      if (imageData && imageData.loaded && imageData.img) {
        try {
          // Calcular dimensiones preservando aspect ratio
          const aspectRatio = imageData.aspectRatio;
          let finalWidth = imgMaxWidth;
          let finalHeight = imgMaxWidth / aspectRatio;
          
          // Si la altura calculada excede el espacio, ajustar por altura
          if (finalHeight > imgMaxHeight) {
            finalHeight = imgMaxHeight;
            finalWidth = imgMaxHeight * aspectRatio;
          }
          
          // Centrar la imagen en su área
          const centeredX = imgX + (imgMaxWidth - finalWidth) / 2;
          const centeredY = imgY + (imgMaxHeight - finalHeight) / 2;
          
          // Convertir imagen a base64 para jsPDF
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = imageData.img.naturalWidth;
          canvas.height = imageData.img.naturalHeight;
          ctx.drawImage(imageData.img, 0, 0);
          const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
          
          // Agregar imagen al PDF
          pdf.addImage(
            imageBase64, 
            'JPEG', 
            centeredX, 
            centeredY, 
            finalWidth, 
            finalHeight
          );
          
        } catch (error) {
          console.warn(`⚠️ Error añadiendo imagen ${product.id}:`, error);
          this.drawImagePlaceholder(pdf, imgX, imgY, imgMaxWidth, imgMaxHeight, product.name);
        }
      } else {
        // Dibujar placeholder
        this.drawImagePlaceholder(pdf, imgX, imgY, imgMaxWidth, imgMaxHeight, product.name);
      }
      
      // Área de texto
      const textY = imgY + layout.imageAreaHeight + 3;
      const textMaxWidth = layout.imageAreaWidth;
      
      // Nombre del producto
      pdf.setTextColor(template.colors.primary);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(parseFloat(template.typography.productNameSize) * 0.35); // Conversión px to pt
      
      const splitName = pdf.splitTextToSize(product.name, textMaxWidth);
      const nameLines = Math.min(splitName.length, 2); // Máximo 2 líneas
      
      for (let line = 0; line < nameLines; line++) {
        pdf.text(
          splitName[line], 
          x + layout.cellWidth / 2, 
          textY + (line * 4), 
          { align: 'center' }
        );
      }
      
      // Precio
      const priceY = textY + (nameLines * 4) + 3;
      pdf.setTextColor(template.colors.secondary);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(parseFloat(template.typography.priceSize) * 0.4);
      
      const priceText = `$${product.price_retail.toLocaleString('es-MX')}`;
      pdf.text(priceText, x + layout.cellWidth / 2, priceY, { align: 'center' });
      
      // Descripción (si hay espacio)
      if (product.description && (priceY + 8) < (y + layout.cellHeight - layout.cellPadding)) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        
        const splitDesc = pdf.splitTextToSize(product.description, textMaxWidth);
        const descLine = splitDesc[0]; // Solo primera línea
        
        if (descLine) {
          pdf.text(descLine, x + layout.cellWidth / 2, priceY + 5, { align: 'center' });
        }
      }
    }
  }
  
  /**
   * 🖼️ DIBUJAR PLACEHOLDER PARA IMÁGENES FALTANTES
   */
  private static drawImagePlaceholder(
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    productName: string
  ): void {
    
    // Fondo gris claro
    pdf.setFillColor(248, 249, 250);
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, width, height, 'FD');
    
    // Texto "Sin imagen"
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Sin imagen', x + width/2, y + height/2 - 2, { align: 'center' });
    
    // Nombre del producto truncado
    const truncatedName = productName.substring(0, 15) + (productName.length > 15 ? '...' : '');
    pdf.setFontSize(6);
    pdf.text(truncatedName, x + width/2, y + height/2 + 2, { align: 'center' });
  }
  
  /**
   * 📋 AGREGAR HEADER DE PÁGINA
   */
  private static addPageHeader(
    pdf: jsPDF,
    businessInfo: BusinessInfo,
    template: SimpleDynamicTemplate,
    pageWidth: number,
    margins: { left: number; right: number; top: number; bottom: number; },
    headerHeight: number
  ): void {
    
    const headerY = margins.top;
    const headerWidth = pageWidth - margins.left - margins.right;
    
    // Fondo del header con gradiente simulado
    pdf.setFillColor(template.colors.primary);
    pdf.rect(margins.left, headerY, headerWidth, headerHeight, 'F');
    
    // Overlay más claro para simular gradiente
    pdf.setFillColor(255, 255, 255, 0.1);
    pdf.rect(margins.left, headerY, headerWidth, headerHeight * 0.5, 'F');
    
    // Texto del header
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(parseFloat(template.typography.headerSize) * 0.4);
    
    const businessName = businessInfo.business_name;
    pdf.text(businessName, pageWidth / 2, headerY + headerHeight * 0.4, { align: 'center' });
    
    // Subtítulo
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const subtitle = `Catálogo ${template.displayName}`;
    pdf.text(subtitle, pageWidth / 2, headerY + headerHeight * 0.7, { align: 'center' });
  }
  
  /**
   * 📄 AGREGAR FOOTER DE PÁGINA
   */
  private static addPageFooter(
    pdf: jsPDF,
    businessInfo: BusinessInfo,
    totalProducts: number,
    pageHeight: number,
    margins: { left: number; right: number; top: number; bottom: number; }
  ): void {
    
    const footerY = pageHeight - margins.bottom + 2;
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Línea de contacto
    const contactLine = `📞 ${businessInfo.phone || ''} | 📧 ${businessInfo.email || ''}`;
    pdf.text(contactLine, pdf.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
    
    // Línea de info
    const infoLine = `Catálogo generado con CatifyPro - ${totalProducts} productos`;
    pdf.text(infoLine, pdf.internal.pageSize.getWidth() / 2, footerY + 4, { align: 'center' });
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
          <small>Catálogo generado con CatifyPro</small>
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
            <small>Catálogo generado con CatifyPro - ${new Date().toLocaleDateString('es-MX')}</small>
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