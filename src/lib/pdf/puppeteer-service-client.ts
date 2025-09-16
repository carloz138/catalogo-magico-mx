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
            preferCSSPageSize: true
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
   * 🎨 GENERAR HTML OPTIMIZADO PARA PUPPETEER
   */
  private static generateOptimizedHTML(
    products: Product[],
    businessInfo: BusinessInfo,
    template: TemplateConfig
  ): string {
    
    const productsPerPage = template.productsPerPage;
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catálogo ${businessInfo.business_name}</title>
        <style>
          ${this.generateOptimizedCSS(template)}
        </style>
      </head>
      <body>
        <div class="catalog-container">
          ${this.generateCatalogPages(products, businessInfo, template)}
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
        font-family: 'Arial', sans-serif;
        color: ${template.colors.text};
        background: ${template.colors.background};
        line-height: 1.4;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .catalog-container {
        width: 100%;
      }
      
      .catalog-page {
        width: 100%;
        min-height: 100vh;
        padding: 20px;
        page-break-after: always;
        display: flex;
        flex-direction: column;
      }
      
      .catalog-page:last-child {
        page-break-after: avoid;
      }
      
      .page-header {
        text-align: center;
        background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        print-color-adjust: exact;
      }
      
      .business-name {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .catalog-subtitle {
        font-size: 16px;
        opacity: 0.9;
      }
      
      .products-grid {
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 20px;
        flex-grow: 1;
        align-content: start;
      }
      
      .product-card {
        background: white;
        border: 2px solid ${template.colors.accent};
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        height: auto;
        min-height: 280px;
        print-color-adjust: exact;
      }
      
      .product-image-container {
        width: 100%;
        height: 160px;
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
        object-fit: contain;
        display: block;
      }
      
      .product-name {
        font-size: 14px;
        font-weight: 600;
        color: ${template.colors.primary};
        margin-bottom: 8px;
        word-wrap: break-word;
        line-height: 1.3;
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        min-height: 40px;
        print-color-adjust: exact;
      }
      
      .product-price {
        font-size: 16px;
        font-weight: bold;
        color: ${template.colors.secondary};
        background: ${template.colors.accent}20;
        padding: 6px 12px;
        border-radius: 6px;
        display: inline-block;
        margin-top: auto;
        print-color-adjust: exact;
      }
      
      .product-description {
        font-size: 11px;
        color: #666;
        margin-top: 6px;
        line-height: 1.2;
        max-height: 24px;
        overflow: hidden;
      }
      
      .page-footer {
        margin-top: 20px;
        text-align: center;
        padding: 15px;
        background: ${template.colors.primary}10;
        border-radius: 6px;
        font-size: 12px;
        print-color-adjust: exact;
      }
      
      .contact-info {
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .catalog-info {
        color: #666;
        font-size: 11px;
      }
      
      /* Imagen placeholder */
      .image-placeholder {
        width: 100%;
        height: 100%;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 12px;
        border: 1px dashed #ddd;
      }
      
      /* Optimizaciones para impresión */
      @media print {
        body { 
          print-color-adjust: exact; 
          -webkit-print-color-adjust: exact;
        }
        
        .catalog-page {
          page-break-inside: avoid;
        }
        
        .product-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
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