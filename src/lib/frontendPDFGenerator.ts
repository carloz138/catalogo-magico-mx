
import { getTemplateById, TemplateConfig } from '@/lib/templates';

// ✅ INTERFACES LIMPIAS
interface PDFProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price_retail?: number;
  image_url: string;
}

interface BusinessInfo {
  business_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  phone?: string;
  email?: string;
  address?: string;
}

// ✅ FUNCIÓN PRINCIPAL: Generar PDF con jsPDF + html2canvas
export const generateCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    console.log('🎨 Iniciando generación PDF frontend');
    console.log(`🎨 Template: ${templateId}`);
    console.log(`🎨 Productos: ${products.length}`);
    
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }

    // ✅ CARGAR LIBRERÍAS DINÁMICAMENTE
    await loadPDFLibraries();
    
    // ✅ CREAR HTML DEL CATÁLOGO
    const catalogHTML = generateCatalogHTML(products, businessInfo, template);
    
    // ✅ CREAR CONTENEDOR TEMPORAL
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '794px'; // A4 width
    tempContainer.style.background = '#ffffff';
    tempContainer.innerHTML = catalogHTML;
    document.body.appendChild(tempContainer);

    // ✅ ESPERAR A QUE LAS IMÁGENES CARGUEN
    await waitForImages(tempContainer);

    // ✅ INICIALIZAR JSPDF
    const { jsPDF } = (window as any);
    if (!jsPDF) {
      throw new Error('jsPDF no disponible');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // ✅ PROCESAR CADA PÁGINA
    const pages = tempContainer.querySelectorAll('.pdf-page');
    console.log(`📄 Procesando ${pages.length} páginas`);

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      
      const pageElement = pages[i] as HTMLElement;
      console.log(`🔄 Capturando página ${i + 1}/${pages.length}`);
      
      // ✅ USAR html2canvas DISPONIBLE EN LOVABLE
      const { html2canvas } = (window as any);
      if (!html2canvas) {
        throw new Error('html2canvas no disponible');
      }

      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: template.colors.background,
        logging: false,
        width: 794,
        height: 1123
      });
      
      // ✅ AGREGAR AL PDF
      const imgData = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, '', 'FAST');
    }

    // ✅ CLEANUP
    document.body.removeChild(tempContainer);

    // ✅ GENERAR BLOB
    const pdfOutput = pdf.output('arraybuffer');
    const blob = new Blob([pdfOutput], { type: 'application/pdf' });
    
    console.log('✅ PDF generado exitosamente:', {
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      pages: pages.length,
      template: templateId
    });

    return {
      success: true,
      blob: blob
    };

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generando PDF'
    };
  }
};

// ✅ FUNCIÓN: Cargar librerías PDF dinámicamente
const loadPDFLibraries = async (): Promise<void> => {
  // Verificar si ya están cargadas
  if ((window as any).jsPDF && (window as any).html2canvas) {
    return;
  }

  return new Promise((resolve, reject) => {
    // ✅ CARGAR JSPDF
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jspdfScript.onload = () => {
      // ✅ CARGAR HTML2CANVAS
      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      html2canvasScript.onload = () => {
        console.log('✅ Librerías PDF cargadas');
        resolve();
      };
      html2canvasScript.onerror = () => reject(new Error('Error cargando html2canvas'));
      document.head.appendChild(html2canvasScript);
    };
    jspdfScript.onerror = () => reject(new Error('Error cargando jsPDF'));
    document.head.appendChild(jspdfScript);
  });
};

// ✅ FUNCIÓN: Esperar a que todas las imágenes carguen
const waitForImages = async (container: HTMLElement): Promise<void> => {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    return new Promise<void>((resolve) => {
      if (img.complete && img.naturalWidth > 0) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        // Timeout after 5 seconds
        setTimeout(() => resolve(), 5000);
      }
    });
  });
  
  await Promise.all(promises);
  console.log(`✅ ${images.length} imágenes cargadas`);
};

// ✅ FUNCIÓN: Generar HTML como string (sin JSX)
const generateCatalogHTML = (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  template: TemplateConfig
): string => {
  
  // ✅ DIVIDIR EN PÁGINAS
  const productsPerPage = template.productsPerPage;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const pages = [];
  
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage));
  }

  console.log(`📄 Generando ${totalPages} páginas HTML`);

  // ✅ GENERAR CSS
  const css = generateTemplateCSS(template);
  
  // ✅ GENERAR PÁGINAS
  const pagesHTML = pages.map((pageProducts, pageIndex) => 
    generatePageHTML(pageProducts, businessInfo, template, pageIndex + 1, totalPages)
  ).join('');

  return `
    <style>${css}</style>
    <div class="catalog-container">
      ${pagesHTML}
    </div>
  `;
};

// ✅ FUNCIÓN: HTML de una página
const generatePageHTML = (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  pageNumber: number,
  totalPages: number
): string => {
  
  const productsHTML = products.map(product => {
    const productName = escapeHtml(product.name);
    const productCategory = product.category ? escapeHtml(product.category) : '';
    const productDescription = product.description ? escapeHtml(product.description) : '';
    const productPrice = ((product.price_retail || 0) / 100).toFixed(2);
    
    return `
      <div class="product-card">
        <div class="product-image-container">
          <img 
            src="${product.image_url}" 
            alt="${productName}"
            class="product-image"
            crossorigin="anonymous"
          />
        </div>
        <div class="product-info">
          <h3 class="product-name">${productName}</h3>
          ${product.category ? `<p class="product-category">${productCategory}</p>` : ''}
          <div class="product-price">$${productPrice} MXN</div>
          ${product.description ? `<p class="product-description">${productDescription}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const businessName = escapeHtml(businessInfo.business_name);
  const businessPhone = businessInfo.phone ? escapeHtml(businessInfo.phone) : '';
  const businessEmail = businessInfo.email ? escapeHtml(businessInfo.email) : '';
  const businessAddress = businessInfo.address ? escapeHtml(businessInfo.address) : '';

  return `
    <div class="pdf-page template-${template.id}">
      <!-- HEADER -->
      <div class="page-header">
        <div class="business-section">
          ${businessInfo.logo_url ? `<img src="${businessInfo.logo_url}" class="business-logo" alt="Logo" crossorigin="anonymous" />` : ''}
          <div class="business-info">
            <h1 class="business-name">${businessName}</h1>
            ${businessInfo.phone ? `<p class="contact-info">📞 ${businessPhone}</p>` : ''}
            ${businessInfo.email ? `<p class="contact-info">✉️ ${businessEmail}</p>` : ''}
          </div>
        </div>
        <div class="catalog-header">
          <h2 class="catalog-title">CATÁLOGO DE PRODUCTOS</h2>
          <p class="template-subtitle">${template.displayName}</p>
        </div>
      </div>

      <!-- PRODUCTOS -->
      <div class="products-container layout-${template.layout}">
        ${productsHTML}
      </div>

      <!-- FOOTER -->
      <div class="page-footer">
        <div class="footer-content">
          <span class="page-number">Página ${pageNumber} de ${totalPages}</span>
          <span class="separator">•</span>
          <span class="generator">Generado con Catalgo AI</span>
          <span class="separator">•</span>
          <span class="date">${new Date().toLocaleDateString('es-MX')}</span>
        </div>
        ${businessInfo.address ? `<p class="address">${businessAddress}</p>` : ''}
      </div>
    </div>
  `;
};

// ✅ FUNCIÓN: CSS específico por template
const generateTemplateCSS = (template: TemplateConfig): string => {
  
  const imageSize = Math.min(template.imageSize.width, template.imageSize.height) * 0.6;
  
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    .catalog-container {
      font-family: 'Inter', sans-serif;
    }
    
    .pdf-page {
      width: 794px;
      height: 1123px;
      background: ${template.colors.background};
      color: ${template.colors.text};
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 40px;
      page-break-after: always;
    }
    
    .page-header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${template.colors.primary};
    }
    
    .business-section {
      display: flex;
      align-items: center;
      margin-bottom: 25px;
    }
    
    .business-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-right: 20px;
    }
    
    .business-name {
      font-size: 28px;
      font-weight: 600;
      color: ${template.colors.primary};
      margin: 0 0 8px 0;
    }
    
    .contact-info {
      font-size: 12px;
      color: ${template.colors.text};
      margin: 2px 0;
    }
    
    .catalog-header {
      text-align: center;
    }
    
    .catalog-title {
      font-size: 24px;
      font-weight: 700;
      color: ${template.colors.primary};
      letter-spacing: 3px;
      margin: 0 0 8px 0;
    }
    
    .template-subtitle {
      font-size: 14px;
      color: ${template.colors.secondary};
      text-transform: uppercase;
      margin: 0;
    }
    
    .products-container {
      flex: 1;
      margin-bottom: 40px;
    }
    
    .page-footer {
      border-top: 1px solid ${template.colors.secondary};
      padding-top: 15px;
      text-align: center;
    }
    
    .footer-content {
      font-size: 11px;
      color: ${template.colors.text};
      margin-bottom: 8px;
    }
    
    .separator {
      margin: 0 8px;
      color: ${template.colors.secondary};
    }
    
    .address {
      font-size: 10px;
      color: ${template.colors.secondary};
      margin: 0;
    }
    
    .product-image {
      width: ${imageSize}px;
      height: ${imageSize}px;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .product-name {
      font-weight: 600;
      color: ${template.colors.text};
      margin-bottom: 8px;
    }
    
    .product-category {
      font-size: 11px;
      color: ${template.colors.secondary};
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    
    .product-price {
      font-weight: 700;
      color: ${template.colors.primary};
      margin-bottom: 10px;
    }
    
    .product-description {
      font-size: 10px;
      color: ${template.colors.text};
      line-height: 1.4;
    }
    
    /* ✅ LAYOUTS ESPECÍFICOS */
    .layout-grid {
      display: grid;
      grid-template-columns: repeat(${template.productsPerPage <= 2 ? 2 : template.productsPerPage <= 4 ? 2 : 3}, 1fr);
      gap: 20px;
    }
    
    .layout-grid .product-card {
      background: #ffffff;
      border: 1px solid ${template.colors.secondary};
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .layout-list .product-card {
      display: flex;
      align-items: center;
      background: #ffffff;
      margin-bottom: 20px;
      padding: 25px;
      border-radius: 10px;
      border-left: 5px solid ${template.colors.primary};
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
    }
    
    .layout-list .product-image-container {
      margin-right: 25px;
      flex-shrink: 0;
    }
    
    .layout-list .product-info {
      flex: 1;
    }
    
    .layout-magazine .product-card {
      background: #ffffff;
      margin-bottom: 25px;
      padding: 25px;
      border-radius: 15px;
      text-align: center;
      border: 2px solid ${template.colors.secondary};
      position: relative;
    }
    
    /* ✅ TEMPLATE ESPECÍFICOS */
    .template-minimalista-gris {
      font-family: 'Inter', sans-serif;
    }
    
    .template-profesional-corporativo {
      font-family: 'Roboto', sans-serif;
      background: #e9ecef !important;
    }
    
    .template-profesional-corporativo .product-card {
      border-left: 5px solid #3498db !important;
    }
    
    .template-lujo-negro-oro {
      font-family: 'Playfair Display', serif;
      background: #1a1a1a !important;
      color: #f5f5f5 !important;
    }
    
    .template-lujo-negro-oro .business-name {
      color: #ffd700 !important;
      letter-spacing: 4px !important;
    }
    
    .template-lujo-negro-oro .product-card {
      background: #2a2a2a !important;
      border: 2px solid #ffd700 !important;
    }
    
    .template-lujo-negro-oro .product-price {
      background: linear-gradient(45deg, #ffd700, #ffed4e) !important;
      color: #1a1a1a !important;
      padding: 10px 15px !important;
      border-radius: 5px !important;
      display: inline-block !important;
    }
    
    .template-naturaleza-organico {
      background: #f1f8e9 !important;
    }
    
    .template-naturaleza-organico .product-card {
      background: #e8f5e9 !important;
      border-radius: 0 20px !important;
    }
    
    .template-rustico-campestre {
      background: #f4f1e8 !important;
    }
    
    .template-rustico-campestre .product-card {
      background: #fff !important;
      border: 2px solid #d2b48c !important;
      box-shadow: 5px 5px 0 #deb887 !important;
    }
    
    .template-rustico-campestre .product-name {
      color: #8b4513 !important;
      text-transform: uppercase !important;
    }
    
    .template-rustico-campestre .product-price {
      background: #8b4513 !important;
      color: #fff !important;
      padding: 8px 12px !important;
      border-radius: 4px !important;
      display: inline-block !important;
    }
  `;
};

// ✅ FUNCIÓN: Escape HTML para seguridad
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// ✅ FUNCIÓN: Descargar PDF inmediatamente
export const downloadCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  filename?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📄 Iniciando descarga directa...');
    
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generando PDF');
    }

    // ✅ DESCARGAR
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `catalogo-${templateId}-${Date.now()}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    
    console.log('✅ Descarga iniciada');
    return { success: true };

  } catch (error) {
    console.error('❌ Error en descarga:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error descargando'
    };
  }
};

// ✅ FUNCIÓN: Preview en nueva tab
export const previewCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generando preview');
    }

    const url = URL.createObjectURL(result.blob);
    window.open(url, '_blank');
    
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return { success: true };

  } catch (error) {
    console.error('❌ Error en preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en preview'
    };
  }
};

// ✅ FUNCIÓN: Estadísticas del PDF
export const getPDFEstimates = (products: PDFProduct[], template: TemplateConfig) => {
  const totalPages = Math.ceil(products.length / template.productsPerPage);
  const estimatedSize = Math.max(1, (products.length * 0.4) + 0.5);
  const estimatedTime = Math.max(2, products.length * 0.15);

  return {
    totalProducts: products.length,
    totalPages,
    productsPerPage: template.productsPerPage,
    estimatedSize: `${estimatedSize.toFixed(1)} MB`,
    estimatedTime: `${Math.ceil(estimatedTime)} seg`,
    instantGeneration: true,
    noCreditsCost: true,
    templateInfo: {
      name: template.displayName,
      layout: template.layout,
      category: template.category,
      imageSize: `${template.imageSize.width}×${template.imageSize.height}px`
    }
  };
};

// ✅ FUNCIÓN: Validar productos antes de generar
export const validateProductsForPDF = (products: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!products || products.length === 0) {
    errors.push('No hay productos seleccionados');
  }
  
  products.forEach((product, index) => {
    if (!product.name) {
      errors.push(`Producto ${index + 1}: Sin nombre`);
    }
    if (!product.image_url && !product.original_image_url) {
      errors.push(`Producto ${index + 1}: Sin imagen`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
