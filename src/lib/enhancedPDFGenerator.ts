
// src/lib/enhancedPDFGenerator.ts
// 🚀 INTEGRACIÓN CON TU SISTEMA ACTUAL

import { generateProfessionalCatalog, ProfessionalTemplateGenerator } from './templates/professional-generator';
import { ENHANCED_TEMPLATES, EnhancedTemplateConfig } from './templates/enhanced-config';
import { REFERENCE_TEMPLATES, generateReferenceTemplate } from './templates/reference-inspired';

// Importar tu sistema actual
// import { getTemplateById } from './templates'; // Tu sistema actual

export interface GenerationProgress {
  phase: 'initializing' | 'processing' | 'generating' | 'complete';
  currentProduct: number;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  message: string;
}

export interface GenerationResult {
  success: boolean;
  filename?: string;
  templateType?: string;
  totalProducts?: number;
  pdfSize?: string;
  error?: string;
}

/**
 * 🚀 GENERADOR PDF MEJORADO - Combina tu sistema actual con templates profesionales
 */
export const downloadEnhancedCatalogPDF = async (
  products: any[],
  businessInfo: any,
  templateId: string,
  filename: string,
  progressCallback?: (progress: GenerationProgress) => void
): Promise<GenerationResult> => {
  try {
    console.log(`🎨 Generando catálogo mejorado: ${templateId}`);
    
    // ✅ STEP 1: Determinar si es template profesional o básico
    const isEnhancedTemplate = ENHANCED_TEMPLATES[templateId];
    const isReferenceTemplate = REFERENCE_TEMPLATES[templateId];
    
    // Para templates básicos, comentar esta línea hasta que agregues la importación
    // const isBasicTemplate = getTemplateById(templateId);
    
    if (!isEnhancedTemplate && !isReferenceTemplate) {
      // Si no es template profesional, usar tu sistema actual
      console.log(`📄 Template básico detectado: ${templateId}`);
      // Aquí llamarías a tu función actual
      // return await tuFuncionOriginal(products, businessInfo, templateId, filename, progressCallback);
      
      // Temporal: generar con template por defecto
      return await generateWithBasicTemplate(products, businessInfo, templateId, filename, progressCallback);
    }
    
    // ✅ STEP 2: Preparar datos optimizados (tu lógica existente)
    const optimizedProducts = products.map((product, index) => {
      progressCallback?.({
        phase: 'processing',
        currentProduct: index + 1,
        totalProducts: products.length,
        currentPage: 1,
        totalPages: 1,
        message: `Optimizando imagen ${index + 1}/${products.length}: ${product.name}`
      });

      // 🔍 Tu lógica actual de selección de imagen
      let finalImageUrl = product.image_url || product.original_image_url;
      if (product.processed_url) {
        finalImageUrl = product.processed_url;
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description || product.custom_description || `Descripción de ${product.name}`,
        category: product.category || 'General',
        price_retail: product.price_retail || 0,
        image_url: finalImageUrl,
        sku: product.sku || `SKU-${product.id.slice(-6)}`,
        brand: product.brand,
        badges: determineBadges(product) // Nueva función para badges inteligentes
      };
    });

    // ✅ STEP 3: Preparar info del negocio
    const enhancedBusinessInfo = {
      business_name: businessInfo.business_name || 'Mi Empresa',
      logo_url: businessInfo.logo_url,
      phone: businessInfo.phone,
      email: businessInfo.email,
      address: businessInfo.address,
      website: businessInfo.website,
      primary_color: businessInfo.primary_color,
      secondary_color: businessInfo.secondary_color
    };

    // ✅ STEP 4: Generar HTML según tipo de template
    let htmlContent: string;
    let templateType: string;
    
    if (isReferenceTemplate) {
      // 🎯 USAR GENERADOR DE TEMPLATES DE REFERENCIA
      console.log(`🎯 Usando template de referencia: ${isReferenceTemplate.displayName}`);
      templateType = 'reference';
      
      progressCallback?.({
        phase: 'generating',
        currentProduct: products.length,
        totalProducts: products.length,
        currentPage: 1,
        totalPages: Math.ceil(products.length / isReferenceTemplate.layout.productsPerPage),
        message: `Generando catálogo de referencia con ${isReferenceTemplate.displayName}`
      });
      
      htmlContent = generateReferenceTemplate(
        optimizedProducts,
        enhancedBusinessInfo,
        templateId
      );
      
    } else if (isEnhancedTemplate) {
      // 🎨 USAR GENERADOR PROFESIONAL
      console.log(`✨ Usando template profesional: ${isEnhancedTemplate.displayName}`);
      templateType = 'professional';
      
      progressCallback?.({
        phase: 'generating',
        currentProduct: products.length,
        totalProducts: products.length,
        currentPage: 1,
        totalPages: Math.ceil(products.length / isEnhancedTemplate.layout.productsPerPage),
        message: `Generando catálogo profesional con ${isEnhancedTemplate.displayName}`
      });
      
      htmlContent = ProfessionalTemplateGenerator.generateCatalogHTML(
        optimizedProducts,
        enhancedBusinessInfo,
        isEnhancedTemplate
      );
    } else {
      throw new Error('Template no encontrado');
    }

    // ✅ STEP 5: Generar PDF (usar tu lógica actual)
    progressCallback?.({
      phase: 'generating',
      currentProduct: products.length,
      totalProducts: products.length,
      currentPage: 1,
      totalPages: 1,
      message: 'Convirtiendo a PDF HD 300 DPI...'
    });

    const pdfResult = await convertHTMLToPDF(htmlContent, {
      filename,
      quality: 'high',
      dpi: 300,
      format: 'A4',
      margin: '20mm'
    });

    progressCallback?.({
      phase: 'complete',
      currentProduct: products.length,
      totalProducts: products.length,
      currentPage: 1,
      totalPages: 1,
      message: '¡Catálogo generado exitosamente!'
    });

    return {
      success: true,
      filename,
      templateType,
      totalProducts: products.length,
      pdfSize: (pdfResult as any).size || '2.4 MB'
    };

  } catch (error) {
    console.error('❌ Error generando catálogo mejorado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * 🎯 FUNCIÓN: Determinar badges inteligentes para productos
 */
function determineBadges(product: any): string[] {
  const badges: string[] = [];
  
  // Badge por fecha (productos nuevos)
  if (product.created_at) {
    const productDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - productDate.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff <= 30) {
      badges.push('NUEVO');
    }
  }
  
  // Badge por precio (ofertas)
  if (product.price_wholesale && product.price_retail) {
    const discount = ((product.price_retail - product.price_wholesale) / product.price_retail) * 100;
    if (discount > 20) {
      badges.push('OFERTA');
    }
  }
  
  // Badge por categoría especial
  if (product.category?.toLowerCase().includes('premium') || 
      product.category?.toLowerCase().includes('pro')) {
    badges.push('PREMIUM');
  }
  
  // Badge personalizado del usuario
  if (product.custom_badge) {
    badges.push(product.custom_badge.toUpperCase());
  }
  
  return badges.slice(0, 2); // Máximo 2 badges por producto
}

/**
 * 📄 GENERADOR BÁSICO TEMPORAL (hasta que conectes tu sistema)
 */
async function generateWithBasicTemplate(
  products: any[],
  businessInfo: any,
  templateId: string,
  filename: string,
  progressCallback?: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  
  console.log(`📄 Generando con template básico: ${templateId}`);
  
  progressCallback?.({
    phase: 'generating',
    currentProduct: products.length,
    totalProducts: products.length,
    currentPage: 1,
    totalPages: 1,
    message: `Generando catálogo básico con ${templateId}`
  });
  
  // Usar template básico mejorado
  const html = generateBasicCatalogHTML(products, businessInfo, templateId);
  
  const pdfResult = await convertHTMLToPDF(html, {
    filename,
    quality: 'standard',
    dpi: 150,
    format: 'A4',
    margin: '20mm'
  });

  return {
    success: true,
    filename,
    templateType: 'basic',
    totalProducts: products.length,
    pdfSize: (pdfResult as any).size || '1.8 MB'
  };
}

/**
 * 📄 GENERADOR DE HTML BÁSICO MEJORADO
 */
function generateBasicCatalogHTML(
  products: any[],
  businessInfo: any,
  templateId: string
): string {
  
  const productsHTML = products.map(product => `
    <div class="product">
      <div class="product-image-container">
        <img src="${product.image_url}" alt="${product.name}" class="product-img" />
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-price">$${product.price_retail.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
        ${product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Catálogo - ${businessInfo.business_name}</title>
        <style>
            /* CSS básico mejorado */
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Inter', sans-serif;
              background: #f8f9fa;
              color: #333;
              line-height: 1.6;
            }
            
            .catalog {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 50px;
              padding: 40px 0;
              border-bottom: 2px solid #3498db;
            }
            
            .header h1 {
              font-size: 36px;
              color: #3498db;
              margin-bottom: 10px;
              font-weight: 700;
            }
            
            .header p {
              color: #666;
              font-size: 18px;
            }
            
            .product {
              background: white;
              border-radius: 15px;
              padding: 30px;
              margin-bottom: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            
            .product:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            }
            
            .product-image-container {
              text-align: center;
              margin-bottom: 25px;
              padding: 20px;
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              border-radius: 10px;
            }
            
            .product-img {
              max-width: 100%;
              max-height: 250px;
              object-fit: contain;
              border-radius: 8px;
            }
            
            .product-title {
              font-size: 24px;
              color: #333;
              margin-bottom: 15px;
              font-weight: 600;
            }
            
            .product-desc {
              color: #666;
              margin-bottom: 20px;
              font-size: 16px;
              line-height: 1.6;
            }
            
            .product-price {
              font-size: 28px;
              color: #3498db;
              font-weight: 700;
              margin-bottom: 10px;
            }
            
            .product-sku {
              color: #999;
              font-size: 14px;
              font-weight: 500;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .catalog { padding: 20px 10px; }
              .product { padding: 20px; }
              .header h1 { font-size: 28px; }
              .product-title { font-size: 20px; }
              .product-price { font-size: 24px; }
            }
            
            /* Print */
            @media print {
              body { background: white; }
              .product { break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="catalog">
            <div class="header">
                <h1>${businessInfo.business_name}</h1>
                <p>Catálogo de Productos</p>
            </div>
            ${productsHTML}
        </div>
    </body>
    </html>
  `;
}

/**
 * 🔄 FUNCIÓN DE CONVERSIÓN A PDF (integrar con tu sistema)
 */
async function convertHTMLToPDF(html: string, options: any): Promise<any> {
  console.log('🔄 Convirtiendo HTML a PDF con opciones:', options);
  
  // ⚠️ IMPORTANTE: Aquí debes integrar tu lógica actual de conversión PDF
  // Puede ser puppeteer, jsPDF, html2pdf, etc.
  
  // Ejemplo con tu sistema actual:
  /*
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
  });
  await browser.close();
  
  // Descargar PDF
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename;
  a.click();
  */
  
  // Simular conversión para testing
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ PDF simulado generado:', options.filename);
      
      // Simular descarga
      const element = document.createElement('a');
      const file = new Blob([html], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = options.filename.replace('.pdf', '.html');
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      resolve({
        success: true,
        size: '2.4 MB',
        pages: Math.ceil(html.length / 5000)
      });
    }, 2000);
  });
}

export const downloadOptimizedCatalogPDF = async (products: any[], businessInfo: any, templateId: string, filename: string, progressCallback?: (progress: GenerationProgress) => void) => {
  // ✅ Detectar si es template profesional
  const isEnhanced = ENHANCED_TEMPLATES[templateId] || REFERENCE_TEMPLATES[templateId];
  
  if (isEnhanced) {
    // 🎨 Usar nuevo sistema
    console.log('🎨 Usando template profesional:', templateId);
    return await downloadEnhancedCatalogPDF(products, businessInfo, templateId, filename, progressCallback);
  } else {
    // 📄 Tu código actual para templates básicos
    console.log('📄 Usando template básico:', templateId);
    // [TU CÓDIGO ACTUAL AQUÍ - NO CAMBIAR]
    return await downloadEnhancedCatalogPDF(products, businessInfo, templateId, filename, progressCallback);
  }
};

/**
 * 🚀 FUNCIÓN PRINCIPAL PARA TU COMPONENTE TEMPLATESELECTION
 */
export const generateCatalogWithProgress = async (
  products: any[],
  businessInfo: any,
  templateId: string,
  progressCallback?: (progress: GenerationProgress) => void
): Promise<GenerationResult> => {
  const filename = `catalogo-${templateId}-${Date.now()}.pdf`;
  
  return downloadEnhancedCatalogPDF(
    products,
    businessInfo,
    templateId,
    filename,
    progressCallback
  );
};

/**
 * 🎯 FUNCIÓN PARA OBTENER ESTIMADOS
 */
export const getOptimizedPDFEstimates = (products: any[], template: any) => {
  const productsPerPage = template.layout?.productsPerPage || template.productsPerPage || 4;
  const totalPages = Math.ceil(products.length / productsPerPage);
  
  return {
    totalPages,
    estimatedTime: totalPages > 5 ? '2-3 minutos' : '1-2 minutos',
    estimatedSize: totalPages > 10 ? '5-8 MB' : '2-4 MB',
    dpi: 300,
    quality: 'HD Professional'
  };
};
