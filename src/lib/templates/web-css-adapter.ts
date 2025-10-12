// src/lib/templates/web-css-adapter.ts
import { WebCatalogTemplate } from '@/lib/web-catalog/types';

export class WebTemplateAdapter {
  static generateWebCSS(template: WebCatalogTemplate): string {
    const colors = template.colorScheme;
    const config = template.config;
    
    // Determinar border radius basado en config
    const borderRadiusMap = {
      'none': '0px',
      'sm': '0.375rem',
      'md': '0.5rem',
      'lg': '0.75rem',
      'xl': '1rem'
    };
    const borderRadius = borderRadiusMap[config.cardRadius] || '0.5rem';
    
    // Determinar gap basado en config
    const gapMap = {
      'tight': '0.5rem',
      'normal': '1rem',
      'loose': '1.5rem'
    };
    const gap = gapMap[config.gap] || '1rem';
    
    return `
      .catalog-public-container {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --background-color: ${colors.background};
        --card-background: ${colors.cardBackground};
        --text-color: ${colors.text};
        --text-muted: ${colors.textMuted};
        --border-color: ${colors.border};
        --border-radius: ${borderRadius};
        --grid-gap: ${gap};
        --columns-desktop: ${config.columnsDesktop};
        --columns-mobile: ${config.columnsMobile};
        
        background: var(--background-color);
        color: var(--text-color);
      }
      
      .catalog-public-container .product-grid {
        display: grid;
        grid-template-columns: repeat(var(--columns-mobile), 1fr);
        gap: var(--grid-gap);
      }
      
      @media (min-width: 768px) {
        .catalog-public-container .product-grid {
          grid-template-columns: repeat(var(--columns-desktop), 1fr);
        }
      }
      
      .catalog-public-container .product-card {
        background: var(--card-background);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
        ${config.cardStyle === 'elevated' ? 'box-shadow: 0 4px 6px rgba(0,0,0,0.1);' : ''}
        ${config.cardStyle === 'outlined' ? 'border: 2px solid var(--border-color);' : ''}
      }
      
      .catalog-public-container .product-card:hover {
        ${config.hoverEffect === 'lift' ? 'transform: translateY(-4px); box-shadow: 0 8px 12px rgba(0,0,0,0.15);' : ''}
        ${config.hoverEffect === 'zoom' ? 'transform: scale(1.03);' : ''}
        ${config.hoverEffect === 'tilt' ? 'transform: rotate(1deg) scale(1.02);' : ''}
      }
      
      .catalog-public-container .product-name {
        color: var(--text-color);
        font-weight: 600;
      }
      
      .catalog-public-container .product-price {
        color: var(--primary-color);
        font-weight: 700;
      }
      
      .catalog-public-container .product-description {
        color: var(--text-muted);
      }
      
      .catalog-public-container .badge {
        background: var(--accent-color);
        color: white;
        border-radius: calc(var(--border-radius) / 2);
      }
      
      .catalog-public-container button {
        background: var(--primary-color);
        color: white;
        border-radius: var(--border-radius);
        transition: all 0.2s ease;
      }
      
      .catalog-public-container button:hover {
        background: var(--secondary-color);
      }
    `;
  }
}
