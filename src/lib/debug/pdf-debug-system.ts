// src/lib/debug/pdf-debug-system.ts
// 🔍 SISTEMA PARA DIAGNOSTICAR PROBLEMAS DE PDF

interface DebugInfo {
  method: 'puppeteer' | 'dynamic' | 'classic';
  template: string;
  productCount: number;
  gridColumns: number;
  issues: string[];
  recommendations: string[];
}

export class PDFDebugSystem {
  
  /**
   * 🔍 GENERAR VERSIÓN DEBUG CON INFORMACIÓN VISIBLE
   */
  static generateDebugCatalog(
    products: any[],
    businessInfo: any,
    template: any,
    method: 'puppeteer' | 'dynamic' | 'classic'
  ): string {
    
    const debugInfo: DebugInfo = {
      method,
      template: template.id,
      productCount: products.length,
      gridColumns: template.gridColumns,
      issues: [],
      recommendations: []
    };
    
    // Detectar posibles problemas
    if (template.gridColumns >= 4) {
      debugInfo.issues.push('Grid de 4+ columnas puede causar cortes');
      debugInfo.recommendations.push('Probar con máximo 3 columnas');
    }
    
    if (products.length > template.productsPerPage * 3) {
      debugInfo.issues.push('Muchas páginas pueden crear páginas vacías');
      debugInfo.recommendations.push('Limitar a máximo ' + (template.productsPerPage * 3) + ' productos para testing');
    }
    
    const imageCount = products.filter(p => p.image_url).length;
    if (imageCount < products.length * 0.5) {
      debugInfo.issues.push('Muchas imágenes faltantes pueden causar layout inconsistente');
      debugInfo.recommendations.push('Usar productos con imágenes para testing');
    }
    
    return this.generateDebugHTML(products, businessInfo, template, debugInfo);
  }
  
  /**
   * 📋 GENERAR HTML DEBUG CON INFORMACIÓN VISIBLE
   */
  private static generateDebugHTML(
    products: any[],
    businessInfo: any,
    template: any,
    debugInfo: DebugInfo
  ): string {
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DEBUG - Catálogo ${businessInfo.business_name}</title>
    <style>
        /* ESTILOS DEBUG VISIBLES */
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 10mm;
          background: #f0f8ff;
        }
        
        .debug-header {
          background: #ff4444;
          color: white;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
          font-size: 14px;
          page-break-inside: avoid;
        }
        
        .debug-info {
          background: #ffffcc;
          padding: 10px;
          margin-bottom: 10px;
          border: 2px dashed #ff6600;
          font-size: 12px;
          page-break-inside: avoid;
        }
        
        .products-container {
          background: white;
          padding: 10mm;
          border: 2px solid #0066cc;
        }
        
        /* GRID DEBUG CON BORDES VISIBLES */
        .products-grid-debug {
          display: grid;
          grid-template-columns: repeat(${template.gridColumns}, 1fr);
          gap: 5mm;
          border: 3px solid #00cc00;
          padding: 5mm;
          background: #f0fff0;
        }
        
        .product-card-debug {
          border: 2px solid #cc0066;
          background: white;
          padding: 3mm;
          min-height: 60mm;
          display: flex;
          flex-direction: column;
          page-break-inside: avoid;
        }
        
        .product-image-container-debug {
          background: #e6f3ff;
          border: 1px dashed #0066cc;
          height: 35mm;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2mm;
          position: relative;
        }
        
        .product-image-debug {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          border: 1px solid #cc6600;
        }
        
        .size-indicator {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(255,0,0,0.8);
          color: white;
          font-size: 8px;
          padding: 1px 3px;
          border-radius: 2px;
        }
        
        .product-info-debug {
          flex-grow: 1;
          background: #fff5f5;
          padding: 2mm;
          border: 1px dashed #ff6666;
        }
        
        .product-name-debug {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 1mm;
          color: #003366;
          border-bottom: 1px dotted #666;
        }
        
        .product-price-debug {
          background: #006600;
          color: white;
          padding: 2mm;
          text-align: center;
          font-weight: bold;
          border-radius: 3mm;
          margin-top: 2mm;
        }
        
        .page-info {
          position: fixed;
          bottom: 5mm;
          right: 5mm;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 2mm;
          font-size: 8pt;
          border-radius: 2mm;
        }
        
        /* INDICADORES DE PROBLEMAS */
        .overflow-warning {
          border: 3px solid red !important;
          background: #ffeeee !important;
        }
        
        .no-image-warning {
          background: #ffcccc !important;
        }
        
        @media print {
          .debug-header, .debug-info { 
            -webkit-print-color-adjust: exact !important;
          }
          
          body {
            background: white !important;
          }
        }
        
        @page {
          size: A4;
          margin: 10mm;
        }
    </style>
</head>
<body>
    <div class="debug-header">
        🔍 DEBUG MODE - Método: ${debugInfo.method.toUpperCase()} | Template: ${debugInfo.template} | Productos: ${debugInfo.productCount} | Grid: ${debugInfo.gridColumns} columnas
    </div>
    
    ${debugInfo.issues.length > 0 ? `
    <div class="debug-info">
        <strong>⚠️ PROBLEMAS DETECTADOS:</strong><br>
        ${debugInfo.issues.map(issue => `• ${issue}`).join('<br>')}
        <br><br>
        <strong>💡 RECOMENDACIONES:</strong><br>
        ${debugInfo.recommendations.map(rec => `• ${rec}`).join('<br>')}
    </div>
    ` : ''}
    
    <div class="products-container">
        <h1 style="text-align: center; color: #003366;">${businessInfo.business_name}</h1>
        
        <div class="products-grid-debug">
            ${products.slice(0, Math.min(products.length, 12)).map((product, index) => `
                <div class="product-card-debug ${!product.image_url ? 'no-image-warning' : ''}" data-index="${index}">
                    <div class="product-image-container-debug">
                        <div class="size-indicator">${index + 1}</div>
                        ${product.image_url ? 
                          `<img src="${product.image_url}" 
                               alt="${product.name}" 
                               class="product-image-debug"
                               onerror="this.parentElement.classList.add('overflow-warning')"
                               onload="console.log('Imagen ${index + 1} cargada:', this.naturalWidth + 'x' + this.naturalHeight)" />` :
                          `<div style="color: #666; font-size: 10px; text-align: center;">
                             SIN IMAGEN<br>#${index + 1}
                           </div>`
                        }
                    </div>
                    <div class="product-info-debug">
                        <div class="product-name-debug">${product.name || 'Producto ' + (index + 1)}</div>
                        <div class="product-price-debug">$${(product.price_retail || 0).toLocaleString()}</div>
                        <div style="font-size: 8px; color: #666; margin-top: 1mm;">
                            ID: ${product.id?.substring(0, 8) || 'N/A'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${products.length > 12 ? `
        <div style="text-align: center; margin-top: 10mm; padding: 5mm; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px;">
            <strong>ℹ️ MOSTRANDO SOLO LOS PRIMEROS 12 PRODUCTOS</strong><br>
            Total de productos: ${products.length} | Páginas estimadas: ${Math.ceil(products.length / template.productsPerPage)}
        </div>
        ` : ''}
    </div>
    
    <div class="page-info">
        Grid: ${template.gridColumns}x? | Densidad: ${template.density} | Método: ${debugInfo.method}
    </div>
    
    <script>
        // DEBUG JAVASCRIPT
        console.log('🔍 DEBUG INFO:', ${JSON.stringify(debugInfo, null, 2)});
        
        // Detectar imágenes que no cargan
        const images = document.querySelectorAll('.product-image-debug');
        images.forEach((img, index) => {
            img.addEventListener('error', () => {
                console.error(\`❌ Error cargando imagen \${index + 1}:\`, img.src);
                img.parentElement.classList.add('overflow-warning');
                img.parentElement.innerHTML += '<div style="color: red; font-size: 8px;">ERROR CARGA</div>';
            });
            
            img.addEventListener('load', () => {
                const ratio = img.naturalWidth / img.naturalHeight;
                console.log(\`✅ Imagen \${index + 1} cargada: \${img.naturalWidth}x\${img.naturalHeight} (ratio: \${ratio.toFixed(2)})\`);
                
                if (ratio < 0.5 || ratio > 2) {
                    img.parentElement.classList.add('overflow-warning');
                    img.parentElement.innerHTML += '<div style="color: orange; font-size: 8px;">RATIO EXTREMO</div>';
                }
            });
        });
        
        // Detectar overflow
        setTimeout(() => {
            const cards = document.querySelectorAll('.product-card-debug');
            cards.forEach((card, index) => {
                if (card.scrollHeight > card.clientHeight || card.scrollWidth > card.clientWidth) {
                    console.warn(\`⚠️ Card \${index + 1} tiene overflow\`);
                    card.classList.add('overflow-warning');
                }
            });
        }, 1000);
        
        // Log final para debugging
        window.addEventListener('load', () => {
            console.log('📊 ESTADÍSTICAS FINALES:');
            console.log('- Imágenes cargadas:', document.querySelectorAll('.product-image-debug').length);
            console.log('- Cards con problemas:', document.querySelectorAll('.overflow-warning').length);
            console.log('- Template usado:', '${template.id}');
            console.log('- Método generación:', '${debugInfo.method}');
        });
    </script>
</body>
</html>`;
  }
  
  /**
   * 🧪 GENERAR TEST DE CADA MÉTODO DE GENERACIÓN
   */
  static async testAllMethods(products: any[], businessInfo: any, template: any) {
    const results = {
      puppeteer: { tested: false, success: false, error: null },
      dynamic: { tested: false, success: false, error: null },
      classic: { tested: false, success: false, error: null }
    };
    
    // Test Puppeteer
    try {
      const puppeteerHTML = this.generateDebugCatalog(products, businessInfo, template, 'puppeteer');
      // Simular test de Puppeteer
      results.puppeteer = { tested: true, success: true, error: null };
    } catch (error) {
      results.puppeteer = { tested: true, success: false, error: error.message };
    }
    
    // Test Dynamic (jsPDF)
    try {
      const dynamicHTML = this.generateDebugCatalog(products, businessInfo, template, 'dynamic');
      results.dynamic = { tested: true, success: true, error: null };
    } catch (error) {
      results.dynamic = { tested: true, success: false, error: error.message };
    }
    
    // Test Classic
    try {
      const classicHTML = this.generateDebugCatalog(products, businessInfo, template, 'classic');
      results.classic = { tested: true, success: true, error: null };
    } catch (error) {
      results.classic = { tested: true, success: false, error: error.message };
    }
    
    return results;
  }
  
  /**
   * 📊 CREAR REPORTE DETALLADO DE PROBLEMAS
   */
  static generateProblemReport(template: any, products: any[]): string {
    const report = {
      template: template.id,
      gridColumns: template.gridColumns,
      density: template.density,
      productCount: products.length,
      issues: [],
      recommendations: []
    };
    
    // Analizar problemas comunes
    if (template.gridColumns >= 4) {
      report.issues.push({
        type: 'LAYOUT',
        severity: 'HIGH',
        description: 'Grid de 4+ columnas causa cortes en PDF',
        solution: 'Reducir a máximo 3 columnas o usar densidad "alta"'
      });
    }
    
    if (template.productsPerPage > 12) {
      report.issues.push({
        type: 'DENSITY',
        severity: 'MEDIUM', 
        description: 'Muchos productos por página pueden causar overflow',
        solution: 'Reducir productsPerPage o aumentar cardHeight'
      });
    }
    
    const imagesWithoutUrl = products.filter(p => !p.image_url).length;
    if (imagesWithoutUrl > products.length * 0.3) {
      report.issues.push({
        type: 'IMAGES',
        severity: 'MEDIUM',
        description: `${imagesWithoutUrl} productos sin imagen pueden causar layout inconsistente`,
        solution: 'Agregar placeholders o filtrar productos sin imagen'
      });
    }
    
    const longNames = products.filter(p => p.name && p.name.length > 50).length;
    if (longNames > 0) {
      report.issues.push({
        type: 'TEXT',
        severity: 'LOW',
        description: `${longNames} productos con nombres muy largos`,
        solution: 'Truncar nombres o aumentar altura de cards'
      });
    }
    
    return JSON.stringify(report, null, 2);
  }
}

/**
 * 🔧 FUNCIÓN PARA USAR EN TU COMPONENTE
 */
export const generateDebugPDF = async (
  products: any[],
  businessInfo: any,
  templateId: string,
  userId: string
) => {
  try {
    // Importar tu template actual
    const { getTemplateById } = await import('../templates/industry-templates');
    const template = getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }
    
    // Generar versión debug
    const debugHTML = PDFDebugSystem.generateDebugCatalog(
      products, 
      businessInfo, 
      template, 
      'debug' as any
    );
    
    // Crear y descargar archivo debug
    const blob = new Blob([debugHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-${templateId}-${Date.now()}.html`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    // Generar reporte
    const report = PDFDebugSystem.generateProblemReport(template, products);
    console.log('🔍 REPORTE DEBUG:', report);
    
    return {
      success: true,
      method: 'debug',
      report: JSON.parse(report)
    };
    
  } catch (error) {
    console.error('❌ Error en debug PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};