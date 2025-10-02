// src/components/templates/TemplatePreview.tsx
// 🖼️ SISTEMA DE PREVISUALIZACIONES VISUALES CORREGIDO - Sin deformaciones

import React from 'react';
import { IndustryTemplate } from '@/lib/templates/industry-templates';
import { Badge } from '@/components/ui/badge';
import { Crown, Package, CheckCircle } from 'lucide-react';

// 🎨 PRODUCTOS DE MUESTRA MÁS REALISTAS Y ESPECÍFICOS
const SAMPLE_PRODUCTS = {
  joyeria: [
    { name: 'Anillo Compromiso', price: 15000, category: 'Anillos' },
    { name: 'Collar Perlas', price: 8500, category: 'Collares' },
    { name: 'Pulsera Oro 18k', price: 3200, category: 'Pulseras' },
    { name: 'Aretes Diamante', price: 5800, category: 'Aretes' },
    { name: 'Reloj Dama', price: 12000, category: 'Relojes' },
    { name: 'Cadena Plata', price: 2100, category: 'Cadenas' }
  ],
  moda: [
    { name: 'Vestido Noche', price: 1200, category: 'Vestidos' },
    { name: 'Blusa Seda', price: 800, category: 'Blusas' },
    { name: 'Pantalón Formal', price: 950, category: 'Pantalones' },
    { name: 'Falda Midi', price: 680, category: 'Faldas' },
    { name: 'Chaqueta Lino', price: 1400, category: 'Chaquetas' },
    { name: 'Zapatos Tacón', price: 1100, category: 'Calzado' }
  ],
  electronica: [
    { name: 'iPhone 15 Pro', price: 25000, category: 'Smartphones' },
    { name: 'Laptop Gaming', price: 35000, category: 'Computadoras' },
    { name: 'AirPods Pro', price: 6500, category: 'Audio' },
    { name: 'iPad Air', price: 15000, category: 'Tablets' },
    { name: 'Apple Watch', price: 8500, category: 'Wearables' },
    { name: 'MacBook Air', price: 28000, category: 'Laptops' }
  ],
  ferreteria: [
    { name: 'Taladro Dewalt', price: 2800, category: 'Herramientas' },
    { name: 'Martillo 500g', price: 450, category: 'Manuales' },
    { name: 'Set Destornilladores', price: 320, category: 'Sets' },
    { name: 'Sierra Circular', price: 1800, category: 'Eléctricas' },
    { name: 'Nivel Láser', price: 950, category: 'Medición' },
    { name: 'Caja Herramientas', price: 680, category: 'Almacenaje' }
  ],
  floreria: [
    { name: 'Ramo 24 Rosas', price: 650, category: 'Ramos' },
    { name: 'Orquídea Blanca', price: 890, category: 'Plantas' },
    { name: 'Arreglo Cumpleaños', price: 1200, category: 'Especiales' },
    { name: 'Corona Funeral', price: 1800, category: 'Funerarios' },
    { name: 'Centro Mesa', price: 750, category: 'Decoración' },
    { name: 'Bouquet Novia', price: 2500, category: 'Bodas' }
  ],
  cosmeticos: [
    { name: 'Base Longwear', price: 480, category: 'Rostro' },
    { name: 'Labial Mate', price: 320, category: 'Labios' },
    { name: 'Sérum Vitamina C', price: 750, category: 'Cuidado' },
    { name: 'Paleta Sombras', price: 560, category: 'Ojos' },
    { name: 'Perfume 100ml', price: 1200, category: 'Fragancias' },
    { name: 'Crema Antiedad', price: 890, category: 'Antiaging' }
  ],
  decoracion: [
    { name: 'Vela Aromática', price: 280, category: 'Velas' },
    { name: 'Marco Vintage', price: 420, category: 'Marcos' },
    { name: 'Cojín Terciopelo', price: 350, category: 'Textiles' },
    { name: 'Florero Cristal', price: 680, category: 'Jarrones' },
    { name: 'Espejo Dorado', price: 950, category: 'Espejos' },
    { name: 'Lámpara Mesa', price: 1200, category: 'Iluminación' }
  ],
  muebles: [
    { name: 'Silla Ejecutiva', price: 4500, category: 'Oficina' },
    { name: 'Mesa Centro Roble', price: 3200, category: 'Mesas' },
    { name: 'Librero 5 Niveles', price: 5800, category: 'Almacenaje' },
    { name: 'Sofá 3 Plazas', price: 12000, category: 'Salas' },
    { name: 'Cama King Size', price: 8500, category: 'Recámaras' },
    { name: 'Escritorio L', price: 6800, category: 'Oficina' }
  ]
};

// 🎯 ICONOS POR INDUSTRIA PARA PRODUCTOS SIN IMAGEN
const INDUSTRY_ICONS = {
  joyeria: ['💍', '💎', '⌚', '📿', '👑', '✨'],
  moda: ['👗', '👠', '👚', '👖', '🧥', '👜'],
  electronica: ['📱', '💻', '🎧', '📺', '⌚', '🖥️'],
  ferreteria: ['🔨', '🔧', '🪚', '🔩', '📐', '🧰'],
  floreria: ['🌹', '🌺', '🌻', '🌷', '🌸', '💐'],
  cosmeticos: ['💄', '💅', '🧴', '🪞', '✨', '🌟'],
  decoracion: ['🕯️', '🖼️', '🛋️', '🪴', '🏺', '💡'],
  muebles: ['🪑', '🛏️', '📚', '🗄️', '🚪', '🪞']
};

interface TemplatePreviewProps {
  template: IndustryTemplate;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  isSelected = false,
  onClick,
  className = ''
}) => {
  const sampleProducts = SAMPLE_PRODUCTS[template.industry] || SAMPLE_PRODUCTS.moda || SAMPLE_PRODUCTS.joyeria;
  const industryIcons = INDUSTRY_ICONS[template.industry] || INDUSTRY_ICONS.moda || INDUSTRY_ICONS.joyeria;
  const displayProducts = (sampleProducts || []).slice(0, Math.min(template.productsPerPage || 6, 6)).filter(Boolean);

  // 🎨 GENERAR GRADIENTE ÚNICO PARA CADA PRODUCTO
  const generateProductGradient = (index: number) => {
    const colors = [
      template.colors.primary,
      template.colors.secondary,
      template.colors.accent
    ];
    const color1 = colors[index % colors.length];
    const color2 = colors[(index + 1) % colors.length];
    return `linear-gradient(135deg, ${color1}20, ${color2}40)`;
  };

  const previewStyles = {
    '--template-primary': template.colors.primary,
    '--template-secondary': template.colors.secondary,
    '--template-accent': template.colors.accent,
    '--template-background': template.colors.background,
    '--template-text': template.colors.text,
    '--template-card-bg': template.colors.cardBackground,
    '--template-border-radius': `${template.design?.borderRadius || 8}px`,
    '--template-shadow': template.design?.shadows ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
  } as React.CSSProperties;

  return (
    <div 
      className={`template-preview-wrapper ${className} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={previewStyles}
    >
      {/* Header del preview */}
      <div className="preview-header">
        <div className="template-title-section">
          <h4 className="template-title">{template.displayName}</h4>
          <div className="template-badges">
            <Badge variant="outline" className="density-badge">
              <Package className="w-3 h-3 mr-1" />
              {template.productsPerPage} productos
            </Badge>
            {template.isPremium && (
              <Badge variant="default" className="premium-badge">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>
        <p className="template-description">{template.description}</p>
        
        {/* Tags del template */}
        {template.tags && template.tags.length > 0 && (
          <div className="template-tags">
            {template.tags.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" className="tag-badge">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Preview del catálogo */}
      <div className="catalog-preview">
        {/* Header del catálogo */}
        <div className="catalog-header">
          <h5 className="business-name">Mi Negocio</h5>
          <span className="catalog-subtitle">Catálogo de Productos</span>
        </div>

        {/* Grid de productos */}
        <div className="products-section">
          <div 
            className={`products-grid density-${template.density}`}
            style={{
              gridTemplateColumns: `repeat(${Math.min(template.gridColumns, 3)}, 1fr)`
            }}
          >
           {displayProducts.filter(product => product).map((product, index) => (
              <div key={index} className="product-card">
                {/* Imagen del producto */}
                <div 
                  className="product-image"
                  style={{
                    background: generateProductGradient(index)
                  }}
                >
                  <span className="product-icon">
                    {industryIcons[index % industryIcons.length]}
                  </span>
                </div>

                {/* Información del producto */}
                <div className="product-info">
                  {template.showInfo?.category && product?.category && (
  <div className="product-category">{product.category}</div>
)}
                  
                  <h6 className="product-name">{product.name}</h6>
                  
                  <div className="product-price">
                    ${product.price.toLocaleString('es-MX')}
                  </div>
                  
                  {template.showInfo.description && (
                    <p className="product-description">
                      Descripción detallada del producto
                    </p>
                  )}
                  
                  {template.showInfo.sku && (
                    <div className="product-sku">SKU: {template.industry.toUpperCase()}{index + 1}</div>
                  )}
                  
                  {template.showInfo.specifications && (
                    <div className="product-specs">Especificaciones técnicas</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicador de selección */}
      {isSelected && (
        <div className="selection-indicator">
          <CheckCircle className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
      )}

      <style>{`
        .template-preview-wrapper {
          position: relative;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          min-height: 420px;
        }

        .template-preview-wrapper:hover {
          border-color: var(--template-primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .template-preview-wrapper.selected {
          border-color: var(--template-primary);
          box-shadow: 0 0 0 3px ${template.colors.primary}20;
          background: ${template.colors.primary}05;
        }

        .preview-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .template-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .template-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .template-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .density-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: #f3f4f6;
          color: #6b7280;
          border: none;
        }

        .premium-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          border: none;
        }

        .template-description {
          font-size: 11px;
          color: #6b7280;
          line-height: 1.4;
          margin: 0 0 8px 0;
        }
        
        .template-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
        }
        
        .tag-badge {
          font-size: 9px;
          padding: 2px 6px;
          background: var(--template-primary);
          color: white;
          border: none;
          opacity: 0.85;
        }

        .catalog-preview {
          background: var(--template-background);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          min-height: 280px;
        }

        .catalog-header {
          background: var(--template-primary);
          color: white;
          padding: 12px 16px;
          text-align: center;
        }

        .business-name {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px 0;
        }

        .catalog-subtitle {
          font-size: 10px;
          opacity: 0.9;
        }

        .products-section {
          padding: 12px;
        }

        .products-grid {
          display: grid;
          gap: 8px;
        }

        .products-grid.density-alta {
          gap: 6px;
        }

        .products-grid.density-media {
          gap: 8px;
        }

        .products-grid.density-baja {
          gap: 12px;
        }

        .product-card {
          background: var(--template-card-bg);
          border-radius: var(--template-border-radius);
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: var(--template-shadow);
        }

        .product-image {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .product-icon {
          font-size: 18px;
          filter: grayscale(0.3);
        }

        .product-info {
          padding: 8px;
        }

        .product-category {
          font-size: 8px;
          color: var(--template-accent);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 2px;
          ${!template.showInfo.category ? 'display: none;' : ''}
        }

        .product-name {
          font-size: 10px;
          font-weight: 600;
          color: var(--template-text);
          margin: 0 0 4px 0;
          line-height: 1.2;
        }

        .product-price {
          font-size: 11px;
          font-weight: 700;
          color: var(--template-primary);
          margin-bottom: 4px;
        }

        .product-description {
          font-size: 8px;
          color: var(--template-text);
          opacity: 0.7;
          line-height: 1.3;
          margin: 0 0 4px 0;
          ${!template.showInfo.description ? 'display: none;' : ''}
        }

        .product-sku {
          font-size: 7px;
          color: var(--template-text);
          opacity: 0.6;
          background: rgba(0, 0, 0, 0.05);
          padding: 1px 4px;
          border-radius: 2px;
          display: inline-block;
          margin-bottom: 2px;
          ${!template.showInfo.sku ? 'display: none;' : ''}
        }

        .product-specs {
          font-size: 7px;
          color: var(--template-text);
          opacity: 0.6;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding-top: 4px;
          margin-top: 4px;
          ${!template.showInfo.specifications ? 'display: none;' : ''}
        }

        .selection-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          background: var(--template-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
          animation: scaleIn 0.2s ease-out;
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .template-preview-wrapper {
            padding: 12px;
            min-height: 380px;
          }

          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .template-title-section {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

// 🖼️ GALERÍA MEJORADA CON GRID RESPONSIVO
interface TemplateGalleryProps {
  templates: IndustryTemplate[];
  selectedTemplate?: string;
  onTemplateSelect?: (templateId: string) => void;
  columns?: number;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  columns = 3
}) => {
  if (templates.length === 0) {
    return (
      <div className="empty-gallery">
        <div className="empty-message">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No hay templates disponibles
          </h3>
          <p className="text-gray-500">
            Intenta cambiar los filtros para ver más opciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="template-gallery">
      <div 
        className="gallery-grid"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))`,
          gap: '20px'
        }}
      >
        {templates.map(template => (
          <TemplatePreview
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onClick={() => onTemplateSelect?.(template.id)}
          />
        ))}
      </div>

      <style>{`
        .template-gallery {
          width: 100%;
        }

        .gallery-grid {
          display: grid;
          padding: 20px 0;
        }

        .empty-gallery {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .empty-message {
          max-width: 300px;
        }

        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
            gap: 16px;
            padding: 16px 0;
          }
        }

        @media (max-width: 480px) {
          .gallery-grid {
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default TemplatePreview;