import { getTemplateById, TemplateConfig } from '@/lib/templates';
import jsPDF from 'jspdf';

// ✅ INTERFACES OPTIMIZADAS
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

interface GenerationProgress {
  currentPage: number;
  totalPages: number;
  currentProduct: number;
  totalProducts: number;
  phase: 'loading' | 'processing' | 'generating' | 'complete';
  message: string;
}

// ✅ CONFIGURACIÓN OPTIMIZADA PARA RENDIMIENTO
const OPTIMIZATION_CONFIG = {
  MAX_IMAGES_PER_BATCH: 10,        // Procesar imágenes en lotes
  CANVAS_QUALITY: 1.5,             // DPI optimizado (no 200, muy pesado)
  IMAGE_COMPRESSION: 0.8,          // Compresión de imágenes
  MEMORY_CLEANUP_INTERVAL: 5,      // Limpiar memoria cada 5 páginas
  MAX_CONCURRENT_LOADS: 3,         // Máximo 3 imágenes cargando simultáneamente
  THUMBNAIL_SIZE: 300,             // Tamaño optimizado de thumbnails
  ENABLE_PROGRESSIVE_LOADING: true // Carga progresiva
};

// ✅ CACHE DE IMÁGENES OPTIMIZADO
class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Map<string, Promise<HTMLImageElement>>();
  private maxSize = 50; // Máximo 50 imágenes en cache

  async loadImage(url: string): Promise<HTMLImageElement> {
    // Verificar cache
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Verificar si ya está cargando
    if (this.loading.has(url)) {
      return this.loading.get(url)!;
    }

    // Iniciar carga
    const loadPromise = this.createOptimizedImage(url);
    this.loading.set(url, loadPromise);

    try {
      const img = await loadPromise;
      
      // Gestión de memoria: remover imágenes antigas si cache está lleno
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(url, img);
      this.loading.delete(url);
      return img;
    } catch (error) {
      this.loading.delete(url);
      throw error;
    }
  }

  private async createOptimizedImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Comprimir imagen si es muy grande
        if (img.width > OPTIMIZATION_CONFIG.THUMBNAIL_SIZE || img.height > OPTIMIZATION_CONFIG.THUMBNAIL_SIZE) {
          resolve(this.compressImage(img));
        } else {
          resolve(img);
        }
      };
      
      img.onerror = () => reject(new Error(`Error cargando imagen: ${url}`));
      img.src = url;
    });
  }

  private compressImage(img: HTMLImageElement): HTMLImageElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const maxSize = OPTIMIZATION_CONFIG.THUMBNAIL_SIZE;
    const ratio = Math.min(maxSize / img.width, maxSize / img.height);
    
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const compressedImg = new Image();
    compressedImg.src = canvas.toDataURL('image/jpeg', OPTIMIZATION_CONFIG.IMAGE_COMPRESSION);
    return compressedImg;
  }

  clear() {
    this.cache.clear();
    this.loading.clear();
  }
}

// ✅ INSTANCIA GLOBAL DEL CACHE
const imageCache = new ImageCache();

// ✅ FUNCIÓN PRINCIPAL OPTIMIZADA
export const generateOptimizedCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  
  let currentPhase: GenerationProgress['phase'] = 'loading';
  
  const updateProgress = (current: number, total: number, message: string, phase?: GenerationProgress['phase']) => {
    if (phase) currentPhase = phase;
    onProgress?.({
      currentPage: Math.floor(current / 6) + 1,
      totalPages: Math.ceil(total / 6),
      currentProduct: current,
      totalProducts: total,
      phase: currentPhase,
      message
    });
  };

  try {
    console.log(`🚀 Generando PDF optimizado: ${templateId} con ${products.length} productos`);
    
    updateProgress(0, products.length, 'Iniciando generación...', 'loading');
    
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }

    const config = getTemplateConfig(templateId, template);
    
    // ✅ PRE-CARGAR IMÁGENES EN LOTES
    updateProgress(0, products.length, 'Optimizando imágenes...', 'processing');
    await preloadImagesInBatches(products, updateProgress);
    
    // ✅ GENERAR PDF OPTIMIZADO
    updateProgress(0, products.length, 'Generando páginas PDF...', 'generating');
    const pdfBlob = await createOptimizedPDF(products, businessInfo, config, templateId, updateProgress);
    
    updateProgress(products.length, products.length, '¡PDF generado exitosamente!', 'complete');
    
    console.log(`✅ PDF optimizado generado: ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB`);
    
    return { success: true, blob: pdfBlob };

  } catch (error) {
    console.error('❌ Error generando PDF optimizado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generando PDF'
    };
  } finally {
    // ✅ LIMPIAR MEMORIA
    setTimeout(() => {
      imageCache.clear();
      if (window.gc) window.gc(); // Garbage collection si está disponible
    }, 1000);
  }
};

// ✅ PRE-CARGA DE IMÁGENES EN LOTES
const preloadImagesInBatches = async (
  products: PDFProduct[],
  updateProgress: (current: number, total: number, message: string) => void
): Promise<void> => {
  
  const batchSize = OPTIMIZATION_CONFIG.MAX_IMAGES_PER_BATCH;
  const totalBatches = Math.ceil(products.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const startIdx = i * batchSize;
    const endIdx = Math.min(startIdx + batchSize, products.length);
    const batch = products.slice(startIdx, endIdx);
    
    updateProgress(startIdx, products.length, `Optimizando lote ${i + 1}/${totalBatches}...`);
    
    // Cargar lote en paralelo (pero limitado)
    const loadPromises = batch.map(async (product) => {
      if (product.image_url && product.image_url.startsWith('http')) {
        try {
          await imageCache.loadImage(product.image_url);
        } catch (error) {
          console.warn(`⚠️ Error cargando imagen: ${product.image_url}`, error);
        }
      }
    });
    
    await Promise.all(loadPromises);
    
    // Pequeña pausa para no saturar el navegador
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// ✅ CREAR PDF OPTIMIZADO
const createOptimizedPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  config: any,
  templateId: string,
  updateProgress: (current: number, total: number, message: string) => void
): Promise<Blob> => {

  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  
  const productsPerPage = templateId === 'lujo-negro-oro' ? 4 : 6;
  const totalPages = Math.ceil(products.length / productsPerPage);
  
  // ✅ GENERAR PÁGINAS DE FORMA OPTIMIZADA
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const startIndex = pageIndex * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, products.length);
    const pageProducts = products.slice(startIndex, endIndex);
    
    updateProgress(
      endIndex, 
      products.length, 
      `Generando página ${pageIndex + 1}/${totalPages}...`
    );
    
    // Agregar nueva página (excepto la primera)
    if (pageIndex > 0) {
      pdf.addPage();
    }
    
    // ✅ GENERAR CANVAS OPTIMIZADO DE LA PÁGINA
    const canvasBlob = await createOptimizedPageCanvas(
      pageProducts, 
      businessInfo, 
      config, 
      templateId,
      pageIndex + 1,
      totalPages
    );
    
    // ✅ CONVERTIR E INSERTAR EN PDF
    const canvasDataUrl = await blobToDataURL(canvasBlob);
    
    pdf.addImage(
      canvasDataUrl, 
      'JPEG', // JPEG para mejor compresión
      0, 
      0, 
      pageWidth, 
      pageHeight,
      `page_${pageIndex}`,
      'FAST'
    );
    
    // ✅ LIMPIAR MEMORIA PERIÓDICAMENTE
    if (pageIndex % OPTIMIZATION_CONFIG.MEMORY_CLEANUP_INTERVAL === 0) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Micro-pausa
      
      // Forzar garbage collection si está disponible
      if (window.gc) {
        window.gc();
      }
    }
  }
  
  return pdf.output('blob');
};

// ✅ CREAR CANVAS OPTIMIZADO DE UNA PÁGINA
const createOptimizedPageCanvas = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  config: any,
  templateId: string,
  pageNumber: number,
  totalPages: number
): Promise<Blob> => {

  // ✅ CANVAS DE CALIDAD OPTIMIZADA
  const DPI = 120 * OPTIMIZATION_CONFIG.CANVAS_QUALITY; // Balance calidad/rendimiento
  const PAGE_WIDTH = 8.27 * DPI;
  const PAGE_HEIGHT = 11.69 * DPI;
  
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d', { 
    alpha: false,
    desynchronized: true // Mejor rendimiento
  })!;

  // ✅ CONFIGURACIÓN OPTIMIZADA
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium'; // Balance entre calidad y velocidad
  ctx.textBaseline = 'top';

  // ✅ FONDO
  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  let yPos = config.spacing.padding;

  // ✅ HEADER (solo primera página)
  if (pageNumber === 1) {
    yPos = await drawOptimizedHeader(ctx, businessInfo, config, templateId, config.spacing.padding, yPos, PAGE_WIDTH - (config.spacing.padding * 2));
  } else {
    yPos += 60;
  }

  // ✅ PRODUCTOS CON IMÁGENES REALES
  yPos = await drawOptimizedProducts(ctx, products, config, templateId, config.spacing.padding, yPos, PAGE_WIDTH - (config.spacing.padding * 2), PAGE_HEIGHT - 120);

  // ✅ FOOTER
  await drawOptimizedFooter(ctx, pageNumber, totalPages, products.length, config, templateId, config.spacing.padding, PAGE_HEIGHT - 80, PAGE_WIDTH - (config.spacing.padding * 2));

  // ✅ CONVERTIR A BLOB COMPRIMIDO
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([''], { type: 'image/jpeg' }));
    }, 'image/jpeg', OPTIMIZATION_CONFIG.IMAGE_COMPRESSION); // JPEG comprimido
  });
};

// ✅ PRODUCTOS CON IMÁGENES REALES OPTIMIZADAS
const drawOptimizedProducts = async (
  ctx: CanvasRenderingContext2D,
  products: PDFProduct[],
  config: any,
  templateId: string,
  x: number,
  startY: number,
  width: number,
  maxHeight: number
): Promise<number> => {

  const cols = 2;
  const cardWidth = (width - config.spacing.cardGap) / cols;
  const cardHeight = templateId === 'lujo-negro-oro' ? 380 : 320;
  
  let currentY = startY;
  let col = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const cardX = x + (col * (cardWidth + config.spacing.cardGap));
    const cardY = currentY;

    if (cardY + cardHeight > maxHeight) break;

    // ✅ DIBUJAR TARJETA CON IMAGEN REAL
    await drawOptimizedProductCard(ctx, product, config, templateId, cardX, cardY, cardWidth, cardHeight);

    col++;
    if (col >= cols) {
      col = 0;
      currentY += cardHeight + config.spacing.cardGap;
    }
  }

  return currentY;
};

// ✅ TARJETA DE PRODUCTO CON IMAGEN REAL
const drawOptimizedProductCard = async (
  ctx: CanvasRenderingContext2D,
  product: PDFProduct,
  config: any,
  templateId: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> => {

  const padding = 15;

  // ✅ FONDO DE TARJETA
  ctx.fillStyle = config.colors.cardBg;
  if (config.spacing.borderRadius > 0) {
    drawRoundedRect(ctx, x, y, width, height, config.spacing.borderRadius);
  } else {
    ctx.fillRect(x, y, width, height);
  }

  // ✅ BORDE DINÁMICO
  ctx.strokeStyle = config.colors.primary;
  ctx.lineWidth = config.style.borderWidth;
  
  if (templateId === 'rustico-campestre') {
    ctx.setLineDash([8, 8]);
  } else if (templateId === 'profesional-corporativo') {
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
  }
  
  if (config.spacing.borderRadius > 0) {
    strokeRoundedRect(ctx, x, y, width, height, config.spacing.borderRadius);
  } else {
    ctx.strokeRect(x, y, width, height);
  }
  ctx.setLineDash([]);

  let textY = y + padding;

  // ✅ CATEGORÍA
  if (product.category) {
    const categoryColors = getCategoryColorsByTemplate(product.category, config, templateId);
    
    ctx.fillStyle = categoryColors.bg;
    const categoryWidth = width - (padding * 2);
    const categoryHeight = 25;
    
    if (templateId === 'naturaleza-organico') {
      drawRoundedRect(ctx, x + padding, textY, categoryWidth, categoryHeight, 12);
    } else {
      ctx.fillRect(x + padding, textY, categoryWidth, categoryHeight);
    }
    
    ctx.fillStyle = categoryColors.text;
    ctx.font = `bold ${config.fonts.size.desc}px ${config.fonts.main}`;
    ctx.textAlign = 'center';
    ctx.fillText(product.category.toUpperCase(), x + width/2, textY + 6);
    textY += categoryHeight + 15;
  }

  // ✅ IMAGEN REAL O PLACEHOLDER OPTIMIZADO
  const imgSize = 140;
  const imgX = x + (width - imgSize) / 2;
  const imgY = textY;

  try {
    // Intentar cargar imagen real
    if (product.image_url && product.image_url.startsWith('http')) {
      const img = await imageCache.loadImage(product.image_url);
      
      // Dibujar imagen real
      ctx.save();
      
      // Crear clipping para imagen redondeada
      if (config.spacing.borderRadius > 0) {
        clipRoundedRect(ctx, imgX, imgY, imgSize, imgSize, config.spacing.borderRadius / 2);
      }
      
      // Calcular dimensiones manteniendo aspecto
      const aspectRatio = img.width / img.height;
      let drawWidth = imgSize;
      let drawHeight = imgSize;
      let drawX = imgX;
      let drawY = imgY;
      
      if (aspectRatio > 1) {
        drawHeight = imgSize / aspectRatio;
        drawY = imgY + (imgSize - drawHeight) / 2;
      } else {
        drawWidth = imgSize * aspectRatio;
        drawX = imgX + (imgSize - drawWidth) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
      
      // Borde de imagen
      ctx.strokeStyle = config.colors.secondary;
      ctx.lineWidth = 2;
      if (config.spacing.borderRadius > 0) {
        strokeRoundedRect(ctx, imgX, imgY, imgSize, imgSize, config.spacing.borderRadius / 2);
      } else {
        ctx.strokeRect(imgX, imgY, imgSize, imgSize);
      }
      
    } else {
      throw new Error('No image URL');
    }
  } catch (error) {
    // ✅ FALLBACK: PLACEHOLDER MEJORADO
    ctx.fillStyle = config.colors.accent;
    if (config.spacing.borderRadius > 0) {
      drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, config.spacing.borderRadius / 2);
    } else {
      ctx.fillRect(imgX, imgY, imgSize, imgSize);
    }

    ctx.strokeStyle = config.colors.secondary;
    ctx.lineWidth = 2;
    if (config.spacing.borderRadius > 0) {
      strokeRoundedRect(ctx, imgX, imgY, imgSize, imgSize, config.spacing.borderRadius / 2);
    } else {
      ctx.strokeRect(imgX, imgY, imgSize, imgSize);
    }

    // Icono placeholder más grande
    ctx.fillStyle = config.colors.secondary;
    ctx.font = `${50}px ${config.fonts.main}`;
    ctx.textAlign = 'center';
    const placeholder = getPlaceholderByTemplate(templateId);
    ctx.fillText(placeholder, imgX + imgSize/2, imgY + imgSize/2 - 20);
  }

  textY = imgY + imgSize + 20;

  // ✅ INFORMACIÓN DEL PRODUCTO (resto igual)
  ctx.fillStyle = config.colors.text;
  ctx.font = `bold ${config.fonts.size.product + 2}px ${config.fonts.main}`;
  ctx.textAlign = 'center';
  
  const truncatedName = truncateText(ctx, product.name, width - (padding * 2));
  ctx.fillText(truncatedName, x + width/2, textY);
  textY += config.fonts.size.product + 12;

  // ✅ PRECIO
  ctx.fillStyle = config.colors.primary;
  ctx.font = `bold ${config.fonts.size.product + 4}px ${config.fonts.main}`;
  const price = `$${((product.price_retail || 0) / 100).toFixed(2)} MXN`;
  
  if (templateId === 'lujo-negro-oro') {
    const priceWidth = ctx.measureText(price).width + 20;
    const priceHeight = 30;
    const priceX = x + (width - priceWidth) / 2;
    
    ctx.fillStyle = config.colors.primary;
    drawRoundedRect(ctx, priceX, textY - 5, priceWidth, priceHeight, 5);
    
    ctx.fillStyle = config.colors.background;
    ctx.textAlign = 'center';
    ctx.fillText(price, x + width/2, textY + 5);
  } else {
    ctx.textAlign = 'center';
    ctx.fillText(price, x + width/2, textY);
  }
  
  textY += config.fonts.size.product + 15;

  // ✅ SKU Y DESCRIPCIÓN
  if (product.sku) {
    ctx.fillStyle = config.colors.secondary;
    ctx.font = `${config.fonts.size.desc + 1}px ${config.fonts.main}`;
    const skuText = getSkuTextByTemplate(product.sku, templateId);
    ctx.textAlign = 'center';
    ctx.fillText(skuText, x + width/2, textY);
    textY += config.fonts.size.desc + 10;
  }

  if (product.description && textY < y + height - 50) {
    ctx.fillStyle = config.colors.text;
    ctx.font = `${config.fonts.size.desc}px ${config.fonts.main}`;
    ctx.textAlign = 'center';
    
    const maxDescLength = templateId === 'lujo-negro-oro' ? 80 : 100;
    const description = product.description.length > maxDescLength 
      ? product.description.substring(0, maxDescLength) + '...'
      : product.description;
    
    const words = description.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > width - (padding * 2) && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    lines.slice(0, 2).forEach((line, index) => {
      ctx.fillText(line, x + width/2, textY + (index * (config.fonts.size.desc + 3)));
    });
  }
};

// ✅ FUNCIONES AUXILIARES OPTIMIZADAS
const clipRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
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
  ctx.clip();
};

// ✅ RESTO DE FUNCIONES (Headers, Footers, etc. - mismas que antes)
const drawOptimizedHeader = async (
  ctx: CanvasRenderingContext2D,
  businessInfo: BusinessInfo,
  config: any,
  templateId: string,
  x: number,
  y: number,
  width: number
): Promise<number> => {
  // Usar la misma lógica de drawDynamicHeader pero sin DPI parameter
  let currentY = y;
  const headerHeight = 140;

  if (config.style.headerStyle === 'corporate') {
    ctx.fillStyle = config.colors.primary;
    ctx.fillRect(x, y, width, headerHeight);
    ctx.fillStyle = '#ffffff';
  } else if (config.style.headerStyle === 'luxury') {
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(x, y, width, headerHeight);
    ctx.strokeStyle = config.colors.primary;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, headerHeight);
    ctx.fillStyle = config.colors.primary;
  } else if (config.style.headerStyle === 'rustic') {
    ctx.fillStyle = config.colors.accent;
    ctx.fillRect(x, y, width, headerHeight);
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = config.colors.primary;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, headerHeight);
    ctx.setLineDash([]);
    ctx.fillStyle = config.colors.text;
  } else {
    ctx.fillStyle = config.colors.text;
  }

  currentY += 20;

  ctx.font = `bold ${config.fonts.size.title}px ${config.fonts.main}`;
  ctx.textAlign = 'center';
  
  const businessText = getBusinessNameByTemplate(businessInfo.business_name, templateId);
  ctx.fillText(businessText, x + width/2, currentY);
  currentY += config.fonts.size.title + 15;

  ctx.font = `bold ${config.fonts.size.subtitle}px ${config.fonts.main}`;
  const catalogTitle = getCatalogTitleByTemplate(templateId);
  ctx.fillText(catalogTitle, x + width/2, currentY);
  currentY += config.fonts.size.subtitle + 20;

  ctx.font = `${config.fonts.size.desc + 2}px ${config.fonts.main}`;
  ctx.textAlign = 'center';

  const contacts = [];
  if (businessInfo.phone) contacts.push(getContactText('phone', businessInfo.phone, templateId));
  if (businessInfo.email) contacts.push(getContactText('email', businessInfo.email, templateId));
  if (businessInfo.address) contacts.push(getContactText('address', businessInfo.address, templateId));

  contacts.forEach(contact => {
    ctx.fillText(contact, x + width/2, currentY);
    currentY += 18;
  });

  return y + headerHeight + 20;
};

const drawOptimizedFooter = async (
  ctx: CanvasRenderingContext2D,
  pageNumber: number,
  totalPages: number,
  totalProducts: number,
  config: any,
  templateId: string,
  x: number,
  y: number,
  width: number
): Promise<void> => {
  const footerHeight = 50;
  
  ctx.fillStyle = config.colors.accent;
  if (config.spacing.borderRadius > 0) {
    drawRoundedRect(ctx, x, y, width, footerHeight, config.spacing.borderRadius);
  } else {
    ctx.fillRect(x, y, width, footerHeight);
  }

  ctx.strokeStyle = config.colors.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  ctx.fillStyle = config.colors.text;
  ctx.font = `bold ${config.fonts.size.desc + 2}px ${config.fonts.main}`;
  ctx.textAlign = 'center';

  const footerMainText = getFooterTextByTemplate(pageNumber, totalPages, totalProducts, templateId);
  ctx.fillText(footerMainText, x + width/2, y + 15);

  ctx.font = `${config.fonts.size.desc}px ${config.fonts.main}`;
  ctx.fillStyle = config.colors.secondary;
  const footerSubText = getFooterSubTextByTemplate(templateId);
  ctx.fillText(footerSubText, x + width/2, y + 32);
};

// ✅ FUNCIONES AUXILIARES (importar todas las del código anterior)
const getTemplateConfig = (templateId: string, template: TemplateConfig) => {
  const configs = {
    'minimalista-gris': {
      fonts: { main: 'Arial', size: { title: 28, subtitle: 16, product: 14, desc: 10 } },
      colors: { ...template.colors, cardBg: '#ffffff', accent: '#f8f9fa' },
      spacing: { padding: 40, cardGap: 25, borderRadius: 8 },
      style: { borderWidth: 1, shadowOffset: 3, headerStyle: 'clean' }
    },
    'profesional-corporativo': {
      fonts: { main: 'Arial', size: { title: 30, subtitle: 18, product: 15, desc: 11 } },
      colors: { primary: '#2563eb', secondary: '#64748b', background: '#f8fafc', text: '#1e293b', cardBg: '#ffffff', accent: '#e2e8f0' },
      spacing: { padding: 35, cardGap: 20, borderRadius: 6 },
      style: { borderWidth: 2, shadowOffset: 4, headerStyle: 'corporate' }
    },
    'lujo-negro-oro': {
      fonts: { main: 'Georgia', size: { title: 32, subtitle: 20, product: 16, desc: 12 } },
      colors: { primary: '#ffd700', secondary: '#b8860b', background: '#1a1a1a', text: '#f5f5f5', cardBg: '#2a2a2a', accent: '#404040' },
      spacing: { padding: 45, cardGap: 30, borderRadius: 12 },
      style: { borderWidth: 3, shadowOffset: 6, headerStyle: 'luxury' }
    },
    'naturaleza-organico': {
      fonts: { main: 'Arial', size: { title: 29, subtitle: 17, product: 14, desc: 10 } },
      colors: { primary: '#16a34a', secondary: '#65a30d', background: '#f0fdf4', text: '#14532d', cardBg: '#dcfce7', accent: '#bbf7d0' },
      spacing: { padding: 35, cardGap: 25, borderRadius: 20 },
      style: { borderWidth: 2, shadowOffset: 4, headerStyle: 'organic' }
    },
    'rustico-campestre': {
      fonts: { main: 'Courier New', size: { title: 26, subtitle: 15, product: 13, desc: 9 } },
      colors: { primary: '#8b4513', secondary: '#a0522d', background: '#faf8f1', text: '#4a2511', cardBg: '#ffffff', accent: '#f5e6d3' },
      spacing: { padding: 40, cardGap: 20, borderRadius: 4 },
      style: { borderWidth: 2, shadowOffset: 5, headerStyle: 'rustic' }
    }
  };
  
  return configs[templateId as keyof typeof configs] || configs['minimalista-gris'];
};

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getBusinessNameByTemplate = (name: string, templateId: string): string => {
  const formats = {
    'minimalista-gris': name,
    'profesional-corporativo': name.toUpperCase(),
    'lujo-negro-oro': name.toUpperCase(),
    'naturaleza-organico': name,
    'rustico-campestre': name.toUpperCase()
  };
  return formats[templateId as keyof typeof formats] || name;
};

const getCatalogTitleByTemplate = (templateId: string): string => {
  const titles = {
    'minimalista-gris': 'Catálogo de Productos',
    'profesional-corporativo': 'CATÁLOGO CORPORATIVO',
    'lujo-negro-oro': 'COLECCIÓN EXCLUSIVA',
    'naturaleza-organico': 'Productos Naturales',
    'rustico-campestre': 'CATÁLOGO ARTESANAL'
  };
  return titles[templateId as keyof typeof titles] || 'CATÁLOGO DE PRODUCTOS';
};

const getContactText = (type: string, value: string, templateId: string): string => {
  const prefixes = {
    'minimalista-gris': { phone: value, email: value, address: value },
    'profesional-corporativo': { phone: `Tel: ${value}`, email: `Email: ${value}`, address: `Oficina: ${value}` },
    'lujo-negro-oro': { phone: `Teléfono: ${value}`, email: `Correo: ${value}`, address: `Dirección: ${value}` },
    'naturaleza-organico': { phone: `📞 ${value}`, email: `✉️ ${value}`, address: `📍 ${value}` },
    'rustico-campestre': { phone: `Tel. ${value}`, email: `Correo: ${value}`, address: `Ubicación: ${value}` }
  };
  
  return prefixes[templateId as keyof typeof prefixes]?.[type as keyof typeof prefixes['minimalista-gris']] || value;
};

const getPlaceholderByTemplate = (templateId: string): string => {
  const placeholders = {
    'minimalista-gris': '□',
    'profesional-corporativo': '■',
    'lujo-negro-oro': '◊',
    'naturaleza-organico': '🌿',
    'rustico-campestre': '⌂'
  };
  return placeholders[templateId as keyof typeof placeholders] || '📷';
};

const getSkuTextByTemplate = (sku: string, templateId: string): string => {
  const formats = {
    'minimalista-gris': `SKU: ${sku}`,
    'profesional-corporativo': `Código: ${sku}`,
    'lujo-negro-oro': `Ref: ${sku}`,
    'naturaleza-organico': `#${sku}`,
    'rustico-campestre': `Cód. ${sku}`
  };
  return formats[templateId as keyof typeof formats] || `SKU: ${sku}`;
};

const getFooterTextByTemplate = (page: number, total: number, products: number, templateId: string): string => {
  const formats = {
    'minimalista-gris': `${page}/${total} • ${products} productos`,
    'profesional-corporativo': `Página ${page} de ${total} • Total: ${products} productos`,
    'lujo-negro-oro': `Página ${page} de ${total} • ${products} artículos exclusivos`,
    'naturaleza-organico': `Pág. ${page}/${total} • ${products} productos naturales`,
    'rustico-campestre': `Hoja ${page} de ${total} • ${products} productos artesanales`
  };
  return formats[templateId as keyof typeof formats] || `Página ${page} de ${total}`;
};

const getFooterSubTextByTemplate = (templateId: string): string => {
  const texts = {
    'minimalista-gris': `${new Date().toLocaleDateString('es-MX')} • Catalgo AI`,
    'profesional-corporativo': `Generado: ${new Date().toLocaleDateString('es-MX')} • Powered by Catalgo AI`,
    'lujo-negro-oro': `Creado exclusivamente el ${new Date().toLocaleDateString('es-MX')} • Catalgo AI Premium`,
    'naturaleza-organico': `🌱 ${new Date().toLocaleDateString('es-MX')} • Eco-friendly by Catalgo AI`,
    'rustico-campestre': `Hecho a mano el ${new Date().toLocaleDateString('es-MX')} • Con Catalgo AI`
  };
  return texts[templateId as keyof typeof texts] || `${new Date().toLocaleDateString('es-MX')} • Catalgo AI`;
};

const getCategoryColorsByTemplate = (category: string, config: any, templateId: string) => {
  const baseColors = {
    'BEBÉS Y NIÑOS': { bg: '#FEF3C7', text: '#92400E' },
    'ROPA Y ACCESORIOS': { bg: '#DBEAFE', text: '#1E40AF' },
    'OTRO': { bg: '#F3E8FF', text: '#7C3AED' }
  };
  
  const categoryColor = baseColors[category as keyof typeof baseColors] || { bg: config.colors.accent, text: config.colors.text };
  
  if (templateId === 'lujo-negro-oro') {
    return { bg: config.colors.primary, text: config.colors.background };
  } else if (templateId === 'naturaleza-organico') {
    return { bg: config.colors.primary, text: '#ffffff' };
  }
  
  return categoryColor;
};

const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;
  
  for (let i = text.length - 1; i > 0; i--) {
    const truncated = text.substring(0, i) + '...';
    if (ctx.measureText(truncated).width <= maxWidth) {
      return truncated;
    }
  }
  return '...';
};

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

const strokeRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
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
  ctx.stroke();
};

// ✅ FUNCIONES DE EXPORTACIÓN CON PROGRESO
export const downloadOptimizedCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  filename?: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`📄 Descargando PDF optimizado: ${templateId} (${products.length} productos)`);
    
    const result = await generateOptimizedCatalogPDF(products, businessInfo, templateId, onProgress);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generando PDF');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanBusinessName = businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '-');
    const finalFilename = filename || `catalogo-optimizado-${templateId}-${cleanBusinessName}-${timestamp}.pdf`;
    
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    
    console.log(`✅ PDF optimizado descargado: ${finalFilename} (${(result.blob.size / 1024 / 1024).toFixed(2)} MB)`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error descarga PDF optimizado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error descargando'
    };
  }
};

export const previewOptimizedCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateOptimizedCatalogPDF(products, businessInfo, templateId, onProgress);
    
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

export const getOptimizedPDFEstimates = (products: PDFProduct[], template: TemplateConfig) => {
  const config = getTemplateConfig(template.id, template);
  const productsPerPage = template.id === 'lujo-negro-oro' ? 4 : 6;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const estimatedSize = Math.max(0.8, (products.length * 0.12) + 0.5); // Más realista con imágenes
  const estimatedTime = Math.max(5, products.length * 0.08); // Tiempo con optimizaciones

  return {
    totalProducts: products.length,
    totalPages,
    productsPerPage,
    estimatedSize: `${estimatedSize.toFixed(1)} MB`,
    estimatedTime: `${Math.ceil(estimatedTime)} seg`,
    instantGeneration: true,
    noCreditsCost: true,
    optimizations: [
      `🚀 Carga de imágenes en lotes de ${OPTIMIZATION_CONFIG.MAX_IMAGES_PER_BATCH}`,
      `🗜️ Compresión automática (${Math.round(OPTIMIZATION_CONFIG.IMAGE_COMPRESSION * 100)}%)`,
      `💾 Cache inteligente (máx. ${50} imágenes)`,
      `⚡ Limpieza de memoria automática`,
      `📱 Optimizado para móviles y desktop`
    ],
    canvasFeatures: [
      `🎨 Estilo único: ${template.displayName}`,
      `📐 Canvas optimizado + jsPDF`,
      `🖼️ Imágenes reales con fallback`,
      `📄 PDF comprimido de alta calidad`
    ],
    templateInfo: {
      name: template.displayName,
      layout: template.layout,
      category: template.category,
      styleMode: config.style.headerStyle
    }
  };
};
