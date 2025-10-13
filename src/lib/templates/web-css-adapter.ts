// src/lib/templates/web-css-adapter.ts
import { WebCatalogTemplate } from '@/lib/web-catalog/types';

export class WebTemplateAdapter {
  static generateWebCSS(template: WebCatalogTemplate, backgroundPattern?: string | null): string {
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
    
    // Importar el patrón si existe
    const patternUrls: Record<string, string> = {
      'taco': '/src/assets/patterns/pattern-taco.png',
    };
    
    const patternUrl = backgroundPattern ? patternUrls[backgroundPattern] : null;
    
    // Calcular filtro de color para el patrón basado en el primary color
    // Extraer hue del primary color y aplicarlo al patrón
    const getColorFilter = (hexColor: string) => {
      // Convertir hex a HSL y crear un filtro CSS que tinte la imagen
      // Este filtro hará que la imagen negra tome el color del tema
      return `
        filter: brightness(0) saturate(100%) invert(${hexColor.includes('#2') || hexColor.includes('#3') ? '30' : '60'}%) sepia(100%) saturate(500%) hue-rotate(${getHueFromHex(hexColor)}deg) brightness(0.9);
        opacity: 0.08;
      `;
    };
    
    const getHueFromHex = (hex: string): number => {
      // Extracción simplificada del hue basada en el color hex
      const colors: Record<string, number> = {
        '#': 0,
        '2': 200, '3': 180, '4': 160, '5': 140,
        '6': 120, '7': 100, '8': 80, '9': 60,
        'a': 40, 'b': 20, 'c': 0, 'd': 340,
        'e': 320, 'f': 300
      };
      const firstChar = hex.toLowerCase().charAt(1);
      return colors[firstChar] || 0;
    };
    
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
        
        background-color: var(--background-color) !important;
        min-height: 100vh;
        position: relative;
      }
      
      ${patternUrl ? `
      .catalog-public-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${patternUrl}');
        background-repeat: repeat;
        background-size: 80px 80px;
        ${getColorFilter(colors.primary)}
        pointer-events: none;
        z-index: 0;
      }
      
      .catalog-public-container > * {
        position: relative;
        z-index: 1;
      }
      ` : ''}
      
      /* Grid de productos */
      .catalog-public-container .grid {
        gap: var(--grid-gap) !important;
      }
      
      /* Cards de productos - usando el selector real del componente */
      .catalog-public-container .catalog-product-card {
        background: var(--card-background) !important;
        border-radius: var(--border-radius) !important;
        border-color: var(--border-color) !important;
        transition: all 0.3s ease;
        ${config.cardStyle === 'elevated' ? 'box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;' : ''}
        ${config.cardStyle === 'outlined' ? 'border-width: 2px !important;' : ''}
      }
      
      .catalog-public-container .catalog-product-card:hover {
        ${config.hoverEffect === 'lift' ? 'transform: translateY(-4px) !important; box-shadow: 0 8px 12px rgba(0,0,0,0.15) !important;' : ''}
        ${config.hoverEffect === 'zoom' ? 'transform: scale(1.03) !important;' : ''}
        ${config.hoverEffect === 'tilt' ? 'transform: rotate(1deg) scale(1.02) !important;' : ''}
      }
      
      /* Nombre del producto */
      .catalog-public-container .catalog-product-name {
        color: var(--text-color) !important;
      }
      
      /* Precio del producto */
      .catalog-public-container .catalog-product-price {
        color: var(--primary-color) !important;
        font-size: 1.5rem !important;
      }
      
      /* Tags */
      .catalog-public-container .catalog-product-tag {
        background: var(--accent-color) !important;
        color: var(--text-color) !important;
        border-radius: calc(var(--border-radius) / 2) !important;
        font-weight: 600 !important;
      }
      
      /* Botón agregar a cotización */
      .catalog-public-container .catalog-add-button {
        background: var(--primary-color) !important;
        border-radius: var(--border-radius) !important;
        transition: all 0.2s ease !important;
      }
      
      .catalog-public-container .catalog-add-button:hover {
        background: var(--secondary-color) !important;
        transform: translateY(-2px);
      }
      
      /* Textos mutados */
      .catalog-public-container .text-muted-foreground {
        color: var(--text-muted) !important;
      }
    `;
  }
}
