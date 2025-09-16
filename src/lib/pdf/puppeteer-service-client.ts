// src/lib/pdf/puppeteer-service-client.ts
// 🚀 CLIENTE PARA EL SERVICIO PUPPETEER EN EASYPANEL

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
}

interface PuppeteerResult {
  success: boolean;
  error?: string;
  downloadUrl?: string;
}

export class PuppeteerServiceClient {
  private static readonly SERVICE_URL = 'https://min8n-puppeteer-pdf.fqr2ax.easypanel.host';
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL - GENERAR PDF CON SERVICIO PUPPETEER
   */
  static async generatePDF(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig,
    options: PuppeteerServiceOptions = {}
  ): Promise<PuppeteerResult> {
    
    try {
      console.log('🚀 Enviando solicitud a servicio Puppeteer...');
      
      if (options.onProgress) options.onProgress(10);
      
      // 1. Verificar que el servicio esté disponible
      const healthCheck = await this.checkServiceHealth();
      if (!healthCheck) {
        throw new Error('Servicio Puppeteer no disponible');
      }
      
      if (options.onProgress) options.onProgress(20);
      
      // 2. Generar HTML optimizado para Puppeteer
      const htmlContent = this.generateOptimizedHTML(products, businessInfo, template);
      
      if (options.onProgress) options.onProgress(30);
      
      // 3. Enviar solicitud al servicio
      const response = await fetch(`${this.SERVICE_URL}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          options: {
            format: options.format || 'A4',
            margin: options.margin || {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm'
            },
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false,
            waitUntil: 'networkidle0'
          },
          filename: `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        })
      });
      
      if (options.onProgress) options.onProgress(70);
      
      if (!response.ok) {
        throw new Error(`Error del servicio: ${response.status} ${response.statusText}`);
      }
      
      // 4. Descargar el PDF
      const blob = await response.blob();
      
      if (options.onProgress) options.onProgress(90);
      
      // 5. Crear URL de descarga
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `catalogo-${businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      
      if (options.onProgress) options.onProgress(100);
      
      console.log('✅ PDF generado y descargado exitosamente');
      
      return {
        success: true,
        downloadUrl
      };
      
    } catch (error) {
      console.error('❌ Error en servicio Puppeteer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 🏥 VERIFICAR SALUD DEL SERVICIO
   */
  private static async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.SERVICE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      
      return response.ok;
    } catch (error) {
      console.error('❌ Servicio Puppeteer no disponible:', error);
      return false;
    }
  }
  
  /**
   * 🎨 GENERAR HTML OPTIMIZADO PARA PUPPETEER CON ESTILOS INLINE
   */
  private static generateOptimizedHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    // Estilos base para better compatibility
    const baseStyles = `
      <style>
        * { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body { 
          -webkit-print-color-adjust: exact !important; 
          margin: 0; 
          padding: 0; 
        }
        @page { 
          size: A4; 
          margin: 10mm; 
        }
      </style>
    `;
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catálogo ${businessInfo.business_name}</title>
        ${baseStyles}
      </head>
      <body style="
        font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
        color: ${template.colors.text};
        background: ${template.colors.background} !important;
        line-height: 1.5;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      ">
        <div style="
          width: 100%;
          background: ${template.colors.background} !important;
          -webkit-print-color-adjust: exact !important;
        ">
          ${this.generateInlineCatalogPages(products, businessInfo, template)}
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * 🎨 GENERAR CSS OPTIMIZADO PARA PUPPETEER
   */
  private static generateOptimizedCSS(template: TemplateConfig): string {
    const columns = template.productsPerPage <= 3 ? 2 : template.productsPerPage <= 6 ? 3 : 4;
    
    return `
      @page {
        size: A4;
        margin: 10mm;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
        color: ${template.colors.text};
        background: ${template.colors.background};
        line-height: 1.5;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .catalog-container {
        width: 100%;
        background: ${template.colors.background};
      }
      
      .catalog-page {
        width: 100%;
        min-height: 100vh;
        padding: 15mm;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        background: ${template.colors.background};
      }
      
      .catalog-page:last-child {
        page-break-after: avoid;
      }
      
      .page-header {
        text-align: center;
        background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
        color: white;
        padding: 25px 20px;
        border-radius: 12px;
        margin-bottom: 25px;
        print-color-adjust: exact;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .business-name {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
      }
      
      .catalog-subtitle {
        font-size: 16px;
        opacity: 0.95;
        font-weight: 300;
      }
      
      .products-grid {
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 18px;
        flex-grow: 1;
        align-content: start;
      }
      
      .product-card {
        background: white;
        border: 1px solid ${template.colors.accent}40;
        border-radius: 12px;
        padding: 18px;
        text-align: center;
        box-shadow: 0 3px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        height: auto;
        min-height: 300px;
        print-color-adjust: exact;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      
      .product-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, ${template.colors.primary}, ${template.colors.secondary});
        print-color-adjust: exact;
      }
      
      .product-image-container {
        width: 100%;
        height: 180px;
        position: relative;
        background: white;
        border-radius: 8px;
        margin-bottom: 15px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #f0f0f0;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
      }
      
      .product-image {
        max-width: 95%;
        max-height: 95%;
        width: auto;
        height: auto;
        object-fit: contain;
        display: block;
        background: transparent;
        border-radius: 4px;
      }
      
      .product-name {
        font-size: 15px;
        font-weight: 600;
        color: ${template.colors.primary};
        margin-bottom: 12px;
        word-wrap: break-word;
        line-height: 1.4;
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        min-height: 45px;
        print-color-adjust: exact;
      }
      
      .product-price {
        font-size: 18px;
        font-weight: 700;
        color: white;
        background: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary});
        padding: 8px 16px;
        border-radius: 25px;
        display: inline-block;
        margin-top: auto;
        print-color-adjust: exact;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
      }
      
      .product-description {
        font-size: 12px;
        color: #666;
        margin-top: 8px;
        line-height: 1.3;
        max-height: 30px;
        overflow: hidden;
        font-style: italic;
      }
      
      .page-footer {
        margin-top: 25px;
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, ${template.colors.primary}15, ${template.colors.secondary}15);
        border-radius: 8px;
        font-size: 12px;
        print-color-adjust: exact;
        border-top: 2px solid ${template.colors.accent};
      }
      
      .contact-info {
        font-weight: 600;
        margin-bottom: 6px;
        color: ${template.colors.primary};
      }
      
      .catalog-info {
        color: #777;
        font-size: 11px;
        font-style: italic;
      }
      
      /* Imagen placeholder mejorado */
      .image-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%), 
                    linear-gradient(-45deg, #f8f9fa 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #f8f9fa 75%), 
                    linear-gradient(-45deg, transparent 75%, #f8f9fa 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #aaa;
        font-size: 14px;
        border: 2px dashed #ddd;
        border-radius: 4px;
      }
      
      /* Optimizaciones para impresión */
      @media print {
        body { 
          print-color-adjust: exact !important; 
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .catalog-page {
          page-break-inside: avoid;
        }
        
        .product-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .product-image {
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          filter: none !important;
        }
      }
      
      /* Mejoras específicas para el template ${template.category} */
      ${template.category === 'luxury' ? `
        .product-card {
          border: 2px solid ${template.colors.accent};
          background: linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%);
        }
        .product-name {
          font-family: 'Georgia', serif;
          letter-spacing: 0.5px;
        }
      ` : ''}
      
      ${template.category === 'creative' ? `
        .product-card {
          border-radius: 16px;
          transform: rotate(-0.5deg);
        }
        .product-card:nth-child(even) {
          transform: rotate(0.5deg);
        }
      ` : ''}
      
      ${template.category === 'business' ? `
        .product-card {
          border-radius: 6px;
        }
        .page-header {
          border-radius: 6px;
        }
      ` : ''}
    `;
  }
  
  /**
   * 📄 GENERAR PÁGINAS DEL CATÁLOGO
   */
  private static generateCatalogPages(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    let pagesHTML = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * productsPerPage;
      const endIndex = Math.min(startIndex + productsPerPage, products.length);
      const pageProducts = products.slice(startIndex, endIndex);
      
      pagesHTML += `
        <div class="catalog-page">
          <header class="page-header">
            <h1 class="business-name">${businessInfo.business_name}</h1>
            <p class="catalog-subtitle">Catálogo ${template.displayName} - Página ${page + 1} de ${totalPages}</p>
          </header>
          
          <div class="products-grid">
            ${pageProducts.map(product => this.generateProductCard(product)).join('')}
          </div>
          
          ${page === totalPages - 1 ? this.generatePageFooter(businessInfo, products.length) : ''}
        </div>
      `;
    }
    
    return pagesHTML;
  }
  
  /**
   * 🛍️ GENERAR TARJETA DE PRODUCTO
   */
  private static generateProductCard(product: Product): string {
    const imageUrl = product.image_url || '';
    const productName = product.name || 'Producto sin nombre';
    const price = product.price_retail || 0;
    const description = product.description || '';
    
    return `
      <div class="product-card">
        <div class="product-image-container">
          ${imageUrl ? 
            `<img 
              src="${imageUrl}" 
              alt="${productName}"
              class="product-image"
              crossorigin="anonymous"
              loading="eager"
              onerror="this.parentElement.innerHTML='<div class=\\"image-placeholder\\"><div>📷</div><div>Sin imagen</div></div>'"
            />` :
            `<div class="image-placeholder">
              <div>📷</div>
              <div>Sin imagen</div>
            </div>`
          }
        </div>
        
        <h3 class="product-name">${productName}</h3>
        
        <div class="product-price">$${price.toLocaleString('es-MX')}</div>
        
        ${description ? `<p class="product-description">${description}</p>` : ''}
      </div>
    `;
  }
  
  /**
   * 📄 GENERAR FOOTER DE PÁGINA
   */
  private static generatePageFooter(businessInfo: BusinessInfo, totalProducts: number): string {
    return `
      <footer class="page-footer">
        <div class="contact-info">
          📞 ${businessInfo.phone || 'Teléfono no disponible'} | 
          📧 ${businessInfo.email || 'Email no disponible'}
          ${businessInfo.website ? ` | 🌐 ${businessInfo.website}` : ''}
        </div>
        <div class="catalog-info">
          Catálogo generado con CatalogoIA - ${totalProducts} productos | ${new Date().toLocaleDateString('es-MX')}
        </div>
      </footer>
    `;
  }
  
  /**
   * 🧪 PROBAR SERVICIO CON PDF DE PRUEBA
   */
  static async testService(): Promise<PuppeteerResult> {
    try {
      const response = await fetch(`${this.SERVICE_URL}/test-pdf`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'test-puppeteer-service.pdf';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      
      return { success: true, downloadUrl };
      
    } catch (error) {
      console.error('Error testing service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error en test' 
      };
    }
  }
}

// Función de conveniencia para usar en componentes
export const generatePDFWithPuppeteer = async (
  products: Product[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  options?: PuppeteerServiceOptions
): Promise<PuppeteerResult> => {
  return PuppeteerServiceClient.generatePDF(products, businessInfo, template, options);
};