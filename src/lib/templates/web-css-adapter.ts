// src/lib/templates/web-css-adapter.ts
import { IndustryTemplate } from './industry-templates';

export class WebTemplateAdapter {
  static generateWebCSS(template: IndustryTemplate): string {
    return `
      .catalog-public[data-template="${template.id}"] {
        --primary-color: ${template.colors.primary};
        --secondary-color: ${template.colors.secondary};
        --accent-color: ${template.colors.accent};
        --background-color: ${template.colors.background};
        --border-radius: ${template.design.borderRadius}px;
      }
      
      .product-card {
        background: var(--background-color);
        border-radius: var(--border-radius);
        ${template.design.shadows ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : ''}
      }
      
      .product-name {
        color: var(--primary-color);
      }
      
      .product-price-retail {
        background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
      }
    `;
  }
}
