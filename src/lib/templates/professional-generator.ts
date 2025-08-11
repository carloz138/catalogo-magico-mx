
import jsPDF from 'jspdf';
import { EnhancedTemplateConfig } from './enhanced-config';

export interface PDFProduct {
  id: string;
  name: string;
  description: string;
  price_retail: number;
  image_url: string;
  category?: string;
  sku?: string;
  brand?: string;
}

export interface PDFBusinessInfo {
  business_name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  primary_color?: string;
  secondary_color?: string;
}

export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private template: EnhancedTemplateConfig;
  private businessInfo: PDFBusinessInfo;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;

  constructor(template: EnhancedTemplateConfig, businessInfo: PDFBusinessInfo) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.template = template;
    this.businessInfo = businessInfo;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = template.professional.margins.top;
  }

  async generatePDF(products: PDFProduct[]): Promise<Uint8Array> {
    console.log('🎨 Iniciando generación de PDF profesional...');
    
    // Add header to first page
    this.addHeader();
    
    // Add table of contents if enabled
    if (this.template.features.tableOfContents) {
      this.addTableOfContents(products);
      this.addNewPage();
    }
    
    // Process products by pages
    const productsPerPage = this.template.layout.productsPerPage;
    for (let i = 0; i < products.length; i += productsPerPage) {
      const pageProducts = products.slice(i, i + productsPerPage);
      await this.addProductPage(pageProducts, i / productsPerPage + 1);
      
      if (i + productsPerPage < products.length) {
        this.addNewPage();
      }
    }
    
    // Add footer to all pages
    this.addFooterToAllPages();
    
    return this.doc.output('arraybuffer') as Uint8Array;
  }

  private addHeader(): void {
    const { margins, branding } = this.template.professional;
    const { colors } = this.template;
    
    // Header background
    this.doc.setFillColor(colors.primary);
    this.doc.rect(0, 0, this.pageWidth, branding.logoSize + 20, 'F');
    
    // Business name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    
    const businessName = this.businessInfo.business_name || 'Mi Empresa';
    const textWidth = this.doc.getTextWidth(businessName);
    const x = branding.logoPosition === 'top-center' ? 
      (this.pageWidth - textWidth) / 2 : margins.left;
    
    this.doc.text(businessName, x, 30);
    
    // Business info
    if (branding.showCompanyInfo && this.businessInfo.email) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.businessInfo.email, x, 40);
    }
    
    this.currentY = branding.logoSize + 40;
  }

  private addTableOfContents(products: PDFProduct[]): void {
    this.doc.setTextColor(this.template.colors.text);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Índice de Contenidos', this.template.professional.margins.left, this.currentY);
    
    this.currentY += 20;
    
    // Group products by category
    const categories = [...new Set(products.map(p => p.category || 'General'))];
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    categories.forEach((category, index) => {
      const pageNum = Math.floor(index * this.template.layout.productsPerPage / this.template.layout.productsPerPage) + 2;
      this.doc.text(`${category}`, this.template.professional.margins.left, this.currentY);
      this.doc.text(`${pageNum}`, this.pageWidth - 30, this.currentY);
      this.currentY += 10;
    });
  }

  private async addProductPage(products: PDFProduct[], pageNumber: number): Promise<void> {
    const { layout, imageSettings } = this.template;
    const { margins } = this.template.professional;
    
    // Calculate grid dimensions
    const availableWidth = this.pageWidth - margins.left - margins.right;
    const availableHeight = this.pageHeight - this.currentY - margins.bottom;
    
    const itemWidth = (availableWidth - (layout.spacing * (layout.columns - 1))) / layout.columns;
    const itemHeight = itemWidth + 60; // Space for text
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const row = Math.floor(i / layout.columns);
      const col = i % layout.columns;
      
      const x = margins.left + (col * (itemWidth + layout.spacing));
      const y = this.currentY + (row * (itemHeight + layout.spacing));
      
      // Check if we need a new page
      if (y + itemHeight > this.pageHeight - margins.bottom) {
        this.addNewPage();
        return this.addProductPage(products.slice(i), pageNumber);
      }
      
      await this.renderProduct(product, x, y, itemWidth);
    }
  }

  private async renderProduct(product: PDFProduct, x: number, y: number, width: number): Promise<void> {
    const { imageSettings, colors, typography } = this.template;
    
    // Product container background
    this.doc.setFillColor(colors.surface);
    this.doc.roundedRect(x, y, width, width + 50, 5, 5, 'F');
    
    // Product image placeholder (in real implementation, load and add actual image)
    this.doc.setFillColor(240, 240, 240);
    this.doc.roundedRect(
      x + 10, 
      y + 10, 
      width - 20, 
      width - 20, 
      imageSettings.borderRadius, 
      imageSettings.borderRadius, 
      'F'
    );
    
    // Product name
    this.doc.setTextColor(colors.text);
    this.doc.setFontSize(typography.titleSize);
    this.doc.setFont('helvetica', 'bold');
    
    const maxWidth = width - 20;
    const truncatedName = this.truncateText(product.name, maxWidth, typography.titleSize);
    this.doc.text(truncatedName, x + 10, y + width + 15);
    
    // Product price
    this.doc.setFontSize(typography.priceSize);
    this.doc.setTextColor(colors.primary);
    this.doc.setFont('helvetica', 'bold');
    const priceText = `$${product.price_retail.toFixed(2)}`;
    this.doc.text(priceText, x + 10, y + width + 30);
    
    // Product description
    if (product.description) {
      this.doc.setFontSize(typography.bodySize);
      this.doc.setTextColor(colors.text);
      this.doc.setFont('helvetica', 'normal');
      const truncatedDesc = this.truncateText(product.description, maxWidth, typography.bodySize);
      this.doc.text(truncatedDesc, x + 10, y + width + 42);
    }
  }

  private addFooterToAllPages(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addFooter(i);
    }
  }

  private addFooter(pageNumber: number): void {
    const { margins } = this.template.professional;
    const footerY = this.pageHeight - margins.bottom + 10;
    
    // Footer background
    this.doc.setFillColor(this.template.colors.surface);
    this.doc.rect(0, footerY - 10, this.pageWidth, 30, 'F');
    
    // Page numbers
    if (this.template.features.pageNumbers) {
      this.doc.setTextColor(this.template.colors.text);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Página ${pageNumber}`, this.pageWidth - 30, footerY + 5);
    }
    
    // Business contact info
    if (this.businessInfo.phone) {
      this.doc.text(this.businessInfo.phone, margins.left, footerY + 5);
    }
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.addHeader();
  }

  private truncateText(text: string, maxWidth: number, fontSize: number): string {
    this.doc.setFontSize(fontSize);
    
    if (this.doc.getTextWidth(text) <= maxWidth) {
      return text;
    }
    
    let truncated = text;
    while (this.doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    
    return truncated + '...';
  }
}
