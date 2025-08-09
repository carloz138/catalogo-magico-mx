import { getTemplateById, TemplateConfig } from '@/lib/templates';
import { jsPDF } from 'jspdf';

interface PDFProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price_retail?: number;
  price_wholesale?: number;
  image_url: string;
  sku?: string;
  stock?: number;
  discount_percentage?: number;
  weight?: string;
  brand?: string;
}

interface BusinessInfo {
  business_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

// ✅ FUNCIÓN PARA CARGAR IMÁGENES
const loadImage = async (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('Error loading image:', url, e);
      reject(new Error(`Failed to load image from ${url}`));
    };
    img.src = url.includes('http') ? `${url}?t=${Date.now()}` : url;
  });
};

// ✅ CONFIGURACIONES POR TEMPLATE
const getTemplateConfig = (templateId: string, template: TemplateConfig) => {
  const configs = {
    'minimalista-gris': {
      fonts: { main: 'Arial', sizes: { title: 28, subtitle: 16, product: 14, desc: 10 } },
      colors: { ...template.colors, cardBg: '#ffffff', accent: '#f8f9fa' },
      spacing: { padding: 40, cardGap: 25, borderRadius: 8 }
    },
    // ... otros templates ...
  };
  return configs[templateId as keyof typeof configs] || configs['minimalista-gris'];
};

// ✅ DIBUJAR RECTÁNGULO REDONDEADO
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

// ✅ DIBUJAR PRODUCTO CON IMAGEN REAL
const drawProductWithImage = async (
  ctx: CanvasRenderingContext2D,
  product: PDFProduct,
  config: any,
  templateId: string,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  // Fondo de la tarjeta
  ctx.fillStyle = config.colors.cardBg;
  drawRoundedRect(ctx, x, y, width, height, config.spacing.borderRadius);

  // Intenta cargar la imagen
  try {
    const img = await loadImage(product.image_url);
    const imgSize = Math.min(width * 0.6, height * 0.4);
    const imgX = x + (width - imgSize) / 2;
    const imgY = y + 20;

    // Dibujar imagen con bordes redondeados
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, config.spacing.borderRadius / 2);
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    ctx.restore();

    // Texto del producto
    ctx.fillStyle = config.colors.text;
    ctx.font = `bold ${config.fonts.sizes.product}px ${config.fonts.main}`;
    ctx.textAlign = 'center';
    ctx.fillText(product.name, x + width / 2, imgY + imgSize + 15);

    // Precio
    ctx.fillStyle = config.colors.primary;
    ctx.font = `bold ${config.fonts.sizes.product + 4}px ${config.fonts.main}`;
    ctx.fillText(`$${(product.price_retail || 0).toFixed(2)}`, x + width / 2, imgY + imgSize + 40);

  } catch (error) {
    console.error('Error drawing product image:', error);
    // Fallback sin imagen
    ctx.fillStyle = config.colors.text;
    ctx.font = `bold ${config.fonts.sizes.product}px ${config.fonts.main}`;
    ctx.textAlign = 'center';
    ctx.fillText(product.name, x + width / 2, y + height / 2);
  }
};

// ✅ GENERAR PÁGINA PDF
const generatePDFPage = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  pageNumber: number,
  totalPages: number
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const dpi = 150;
  const pageWidth = 8.5 * dpi;
  const pageHeight = 11 * dpi;
  
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d')!;

  // Escala para alta resolución
  const scale = dpi / 96;
  ctx.scale(scale, scale);

  // Fondo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  // Cabecera
  ctx.fillStyle = '#333333';
  ctx.font = `bold 24px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(businessInfo.business_name, pageWidth / (2 * scale), 40);

  // Productos
  const productsPerRow = 2;
  const cardWidth = (pageWidth / scale - 60) / productsPerRow;
  const cardHeight = 180;

  for (let i = 0; i < products.length; i++) {
    const row = Math.floor(i / productsPerRow);
    const col = i % productsPerRow;
    const x = 30 + col * (cardWidth + 20);
    const y = 80 + row * (cardHeight + 20);

    await drawProductWithImage(
      ctx,
      products[i],
      getTemplateConfig(templateId, getTemplateById(templateId)),
      templateId,
      x,
      y,
      cardWidth,
      cardHeight
    );
  }

  // Pie de página
  ctx.fillStyle = '#666666';
  ctx.font = `10px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(`Página ${pageNumber} de ${totalPages}`, pageWidth / (2 * scale), pageHeight / scale - 20);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([''], { type: 'image/png' }));
    }, 'image/png', 0.95);
  });
};

// ✅ GENERAR PDF COMPLETO
export const generateCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    const productsPerPage = 6;
    const totalPages = Math.ceil(products.length / productsPerPage);
    const pageBlobs: Blob[] = [];

    for (let i = 0; i < totalPages; i++) {
      const start = i * productsPerPage;
      const end = start + productsPerPage;
      const pageProducts = products.slice(start, end);
      
      const pageBlob = await generatePDFPage(
        pageProducts,
        businessInfo,
        templateId,
        i + 1,
        totalPages
      );
      
      pageBlobs.push(pageBlob);
    }

    // Combinar páginas en un solo PDF
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < pageBlobs.length; i++) {
      if (i > 0) pdf.addPage();
      
      const imgData = URL.createObjectURL(pageBlobs[i]);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    const pdfBlob = pdf.output('blob');
    return { success: true, blob: pdfBlob };

  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generating PDF'
    };
  }
};

// ✅ DESCARGAR PDF
export const downloadCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  filename?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generating PDF');
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `catalogo-${templateId}-${Date.now()}.pdf`;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return { success: true };

  } catch (error) {
    console.error('Error downloading PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error downloading PDF'
    };
  }
};

// ✅ ESTIMACIONES DE PDF
export const getPDFEstimates = (
  products: PDFProduct[], 
  template: TemplateConfig
) => {
  const productsPerPage = 6;
  const totalPages = Math.ceil(products.length / productsPerPage);
  
  return {
    totalPages,
    productsPerPage,
    estimatedSize: `${Math.max(0.5, products.length * 0.1).toFixed(1)} MB`,
    estimatedTime: `${Math.max(2, products.length * 0.1).toFixed(0)} segundos`,
    features: [
      '🖼️ Imágenes PNG con transparencia',
      '🎨 Diseño responsive',
      '⚡ Generación instantánea'
    ]
  };
};