// src/components/templates/TemplatePreview.tsx
// 🖼️ SISTEMA DE PREVISUALIZACIONES VISUALES PARA TEMPLATES

import React from 'react';
import { IndustryTemplate } from '@/lib/templates/industry-templates';

// Productos de ejemplo para previsualizaciones
const SAMPLE_PRODUCTS = {
  joyeria: [
    { id: '1', name: 'Anillo Diamante', price_retail: 15000, image_url: '/api/placeholder/180/180' },
    { id: '2', name: 'Collar Oro 18k', price_retail: 8500, image_url: '/api/placeholder/180/180' },
    { id: '3', name: 'Pulsera Plata', price_retail: 3200, image_url: '/api/placeholder/180/180' },
    { id: '4', name: 'Aretes Perla', price_retail: 5800, image_url: '/api/placeholder/180/180' }
  ],
  moda: [
    { id: '1', name: 'Vestido Casual', price_retail: 1200, image_url: '/api/placeholder/250/250' },
    { id: '2', name: 'Blusa Elegante', price_retail: 800, image_url: '/api/placeholder/250/250' },
    { id: '3', name: 'Pantalón Formal', price_retail: 950, image_url: '/api/placeholder/250/250' }
  ],
  electronica: [
    { id: '1', name: 'Smartphone Pro', price_retail: 12000, image_url: '/api/placeholder/300/300' },
    { id: '2', name: 'Laptop Gaming', price_retail: 25000, image_url: '/api/placeholder/300/300' },
    { id: '3', name: 'Auriculares BT', price_retail: 3500, image_url: '/api/placeholder/300/300' }
  ],
  ferreteria: [
    { id: '1', name: 'Taladro Eléctrico', price_retail: 2800, image_url: '/api/placeholder/300/300' },
    { id: '2', name: 'Martillo 500g', price_retail: 450, image_url: '/api/placeholder/300/300' },
    { id: '3', name: 'Destornillador Set', price_retail: 320, image_url: '/api/placeholder/300/300' }
  ],
  floreria: [
    { id: '1', name: 'Ramo Rosas', price_retail: 650, image_url: '/api/placeholder/180/180' },
    { id: '2', name: 'Orquídea Blanca', price_retail: 890, image_url: '/api/placeholder/180/180' },
    { id: '3', name: 'Arreglo Mixto', price_retail: 1200, image_url: '/api/placeholder/180/180' },
    { id: '4', name: 'Girasoles', price_retail: 450, image_url: '/api/placeholder/180/180' }
  ],
  cosmeticos: [
    { id: '1', name: 'Base Líquida', price_retail: 480, image_url: '/api/placeholder/250/250' },
    { id: '2', name: 'Labial Mate', price_retail: 320, image_url: '/api/placeholder/250/250' },
    { id: '3', name: 'Sérum Facial', price_retail: 750, image_url: '/api/placeholder/250/250' }
  ],
  decoracion: [
    { id: '1', name: 'Vela Aromática', price_retail: 280, image_url: '/api/placeholder/250/250' },
    { id: '2', name: 'Marco Foto', price_retail: 420, image_url: '/api/placeholder/250/250' },
    { id: '3', name: 'Cojín Decorativo', price_retail: 350, image_url: '/api/placeholder/250/250' }
  ],
  muebles: [
    { id: '1', name: 'Silla Ejecutiva', price_retail: 4500, image_url: '/api/placeholder/300/300' },
    { id: '2', name: 'Mesa Centro', price_retail: 3200, image_url: '/api/placeholder/300/300' },
    { id: '3', name: 'Librero Modular', price_retail: 5800, image_url: '/api/placeholder/300/300' }
  ]
};

interface TemplatePreviewProps {
  template: IndustryTemplate;
  scale?: number; // Para controlar el tamaño del preview
  showTitle?: boolean;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  scale = 0.3,
  showTitle = true 
}) => {
  const sampleProducts = SAMPLE_PRODUCTS[template.industry] || SAMPLE_PRODUCTS.moda;
  const displayProducts = sampleProducts.slice(0, template.productsPerPage);
  
  // Generar CSS en línea para el preview
  const previewStyles = generatePreviewCSS(template, scale);
  
  return (
    <div className="template-preview-container">
      {showTitle && (
        <div className="preview-header">
          <h4 className="preview-title">{template.displayName}</h4>
          <span className="preview-density">{template.density} densidad</span>
        </div>
      )}
      
      <div 
        className="preview-frame"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: 'white'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
        
        <div className={`preview-catalog template-${template.id}`}>
          {/* Header del template */}
          <header className="catalog-header">
            <h1 className="business-name">Mi Negocio</h1>
            <p className="catalog-subtitle">Catálogo de Productos</p>
          </header>
          
          {/* Grid de productos */}
          <main className="products-section">
            <div className="products-grid">
              {displayProducts.map((product, index) => (
                <div key={index} className="product-card">
                  <div className="product-image-container">
                    <div 
                      className="product-image-placeholder"
                      style={{
                        width: `${template.imageSize.width * scale}px`,
                        height: `${template.imageSize.height * scale}px`,
                        background: `linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.background})`,
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: `${12 * scale}px`,
                        color: template.colors.text,
                        opacity: 0.7
                      }}
                    >
                      📦
                    </div>
                  </div>
                  
                  <div className="product-info">
                    {template.showInfo.category && (
                      <div className="product-category">Categoría</div>
                    )}
                    
                    <h3 className="product-name">{product.name}</h3>
                    
                    <div className="product-price">
                      ${product.price_retail.toLocaleString('es-MX')}
                    </div>
                    
                    {template.showInfo.description && (
                      <p className="product-description">
                        Descripción del producto
                      </p>
                    )}
                    
                    {template.showInfo.sku && (
                      <div className="product-sku">SKU: ABC123</div>
                    )}
                    
                    {template.showInfo.specifications && (
                      <div className="product-specifications">
                        Especificaciones técnicas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎨 GENERA CSS ESPECÍFICO PARA EL PREVIEW
 */
function generatePreviewCSS(template: IndustryTemplate, scale: number): string {
  const spacing = {
    compacto: { header: 20, section: 15, grid: 10, card: 8 },
    normal: { header: 25, section: 20, grid: 15, card: 12 },
    amplio: { header: 30, section: 25, grid: 20, card: 16 }
  }[template.design.spacing];

  return `
    .preview-catalog {
      font-family: 'Inter', sans-serif;
      background: ${template.colors.background};
      color: ${template.colors.text};
      min-height: 400px;
      width: 600px;
    }
    
    .preview-catalog .catalog-header {
      background: ${template.colors.primary};
      color: white;
      padding: ${spacing.header}px;
      text-align: center;
    }
    
    .preview-catalog .business-name {
      font-size: ${24 * scale}px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .preview-catalog .catalog-subtitle {
      font-size: ${14 * scale}px;
      opacity: 0.9;
    }
    
    .preview-catalog .products-section {
      padding: ${spacing.section}px;
    }
    
    .preview-catalog .products-grid {
      display: grid;
      grid-template-columns: repeat(${template.gridColumns}, 1fr);
      gap: ${spacing.grid}px;
    }
    
    .preview-catalog .product-card {
      background: ${template.colors.cardBackground};
      border-radius: ${template.design.borderRadius}px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.08);
      ${template.design.shadows ? 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);' : ''}
    }
    
    .preview-catalog .product-image-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${spacing.card}px;
      background: #fafafa;
    }
    
    .preview-catalog .product-info {
      padding: ${spacing.card}px;
    }
    
    .preview-catalog .product-name {
      font-size: ${(template.density === 'alta' ? 11 : template.density === 'media' ? 13 : 15) * scale}px;
      font-weight: 600;
      margin-bottom: ${spacing.card / 2}px;
      line-height: 1.2;
    }
    
    .preview-catalog .product-price {
      font-size: ${(template.density === 'alta' ? 12 : template.density === 'media' ? 14 : 16) * scale}px;
      font-weight: 700;
      color: ${template.colors.primary};
      margin-bottom: ${spacing.card / 2}px;
    }
    
    .preview-catalog .product-category {
      font-size: ${8 * scale}px;
      color: ${template.colors.accent};
      text-transform: uppercase;
      margin-bottom: ${spacing.card / 2}px;
      ${template.showInfo.category ? '' : 'display: none;'}
    }
    
    .preview-catalog .product-description {
      font-size: ${8 * scale}px;
      color: ${template.colors.text};
      opacity: 0.7;
      line-height: 1.3;
      margin-bottom: ${spacing.card / 2}px;
      ${template.showInfo.description ? '' : 'display: none;'}
    }
    
    .preview-catalog .product-sku {
      font-size: ${7 * scale}px;
      color: ${template.colors.text};
      opacity: 0.6;
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 4px;
      border-radius: 2px;
      display: inline-block;
      margin-bottom: ${spacing.card / 2}px;
      ${template.showInfo.sku ? '' : 'display: none;'}
    }
    
    .preview-catalog .product-specifications {
      font-size: ${7 * scale}px;
      color: ${template.colors.text};
      opacity: 0.6;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      padding-top: ${spacing.card / 2}px;
      margin-top: ${spacing.card / 2}px;
      ${template.showInfo.specifications ? '' : 'display: none;'}
    }
  `;
}

/**
 * 🖼️ COMPONENTE PARA GALERÍA DE PREVIEWS
 */
interface TemplateGalleryProps {
  templates: IndustryTemplate[];
  selectedTemplate?: string;
  onTemplateSelect?: (templateId: string) => void;
  scale?: number;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  scale = 0.25
}) => {
  const galleryStyles = `
    .template-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 20px 0;
    }
    
    .template-option {
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 16px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    
    .template-option:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .template-option.selected {
      border-color: #3b82f6;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    }
    
    .preview-header {
      text-align: center;
      margin-bottom: 12px;
    }
    
    .preview-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #1f2937;
    }
    
    .preview-density {
      font-size: 11px;
      color: #6b7280;
      text-transform: capitalize;
    }
    
    .template-info {
      margin-top: 12px;
      text-align: center;
    }
    
    .template-description {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    
    .template-badges {
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .template-badge {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 12px;
      background: #f3f4f6;
      color: #4b5563;
    }
    
    .template-badge.premium {
      background: #fef3c7;
      color: #d97706;
    }
  `;

  return (
    <div className="template-gallery">
      <style dangerouslySetInnerHTML={{ __html: galleryStyles }} />
      
      {templates.map(template => (
        <div
          key={template.id}
          className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
          onClick={() => onTemplateSelect?.(template.id)}
        >
          <TemplatePreview template={template} scale={scale} />
          
          <div className="template-info">
            <p className="template-description">{template.description}</p>
            <div className="template-badges">
              <span className="template-badge">{template.productsPerPage} productos</span>
              {template.isPremium && (
                <span className="template-badge premium">Premium</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplatePreview;