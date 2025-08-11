
import { ProfessionalPDFGenerator, PDFProduct, PDFBusinessInfo } from './templates/professional-generator';
import { getEnhancedTemplateById } from './templates/enhanced-config';
import { getReferenceTemplateById } from './templates/reference-inspired';

export interface GenerationProgress {
  phase: 'initializing' | 'processing' | 'generating' | 'complete';
  currentProduct: number;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface GenerationResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
  stats?: {
    totalPages: number;
    totalProducts: number;
    generationTime: number;
  };
}

export class EnhancedPDFGenerator {
  private progressCallback?: ProgressCallback;

  constructor(progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
  }

  async generateCatalogPDF(
    products: PDFProduct[],
    businessInfo: PDFBusinessInfo,
    templateId: string
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      // Find template configuration
      let template = getEnhancedTemplateById(templateId);
      if (!template) {
        template = getReferenceTemplateById(templateId);
      }
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      this.updateProgress({
        phase: 'initializing',
        currentProduct: 0,
        totalProducts: products.length,
        currentPage: 1,
        totalPages: Math.ceil(products.length / template.layout.productsPerPage),
        message: 'Inicializando generador profesional...'
      });

      // Create professional PDF generator
      const generator = new ProfessionalPDFGenerator(template, businessInfo);

      this.updateProgress({
        phase: 'processing',
        currentProduct: 0,
        totalProducts: products.length,
        currentPage: 1,
        totalPages: Math.ceil(products.length / template.layout.productsPerPage),
        message: 'Procesando imágenes de productos...'
      });

      // Process products in batches for progress updates
      const processedProducts: PDFProduct[] = [];
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Simulate processing time for each product
        await new Promise(resolve => setTimeout(resolve, 100));
        
        processedProducts.push({
          ...product,
          image_url: product.image_url || '/placeholder.svg'
        });

        this.updateProgress({
          phase: 'processing',
          currentProduct: i + 1,
          totalProducts: products.length,
          currentPage: Math.floor(i / template.layout.productsPerPage) + 1,
          totalPages: Math.ceil(products.length / template.layout.productsPerPage),
          message: `Procesando producto ${i + 1} de ${products.length}...`
        });
      }

      this.updateProgress({
        phase: 'generating',
        currentProduct: products.length,
        totalProducts: products.length,
        currentPage: 1,
        totalPages: Math.ceil(products.length / template.layout.productsPerPage),
        message: 'Generando PDF profesional...'
      });

      // Generate the PDF
      const pdfData = await generator.generatePDF(processedProducts);

      this.updateProgress({
        phase: 'complete',
        currentProduct: products.length,
        totalProducts: products.length,
        currentPage: Math.ceil(products.length / template.layout.productsPerPage),
        totalPages: Math.ceil(products.length / template.layout.productsPerPage),
        message: '¡PDF generado exitosamente!'
      });

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        data: pdfData,
        stats: {
          totalPages: Math.ceil(products.length / template.layout.productsPerPage),
          totalProducts: products.length,
          generationTime
        }
      };

    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido generando PDF'
      };
    }
  }

  private updateProgress(progress: GenerationProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}

// Helper function for easy usage
export async function downloadEnhancedCatalogPDF(
  products: PDFProduct[],
  businessInfo: PDFBusinessInfo,
  templateId: string,
  filename: string = 'catalogo-profesional.pdf',
  progressCallback?: ProgressCallback
): Promise<GenerationResult> {
  const generator = new EnhancedPDFGenerator(progressCallback);
  const result = await generator.generateCatalogPDF(products, businessInfo, templateId);
  
  if (result.success && result.data) {
    // Download the file
    const blob = new Blob([result.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  return result;
}

// Export types for use in components
export type { GenerationProgress, ProgressCallback, GenerationResult, PDFProduct, PDFBusinessInfo };
