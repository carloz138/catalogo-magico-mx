// src/lib/templates/enhanced-config.ts
// 🎨 CONFIGURACIONES DE TEMPLATES PROFESIONALES CON SOMBRAS

export interface EnhancedTemplateConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPremium: boolean;
  
  // Layout configuration
  layout: {
    type: 'grid' | 'asymmetric' | 'magazine' | 'masonry' | 'hero';
    productsPerPage: number;
    gridColumns?: number;
    featuredProduct?: boolean;
  };
  
  // Visual design
  design: {
    imageSize: { width: number; height: number };
    borderRadius: number;
    shadows: boolean;
    animations: boolean;
    decorativeElements: boolean;
  };
  
  // Color system
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    gradient?: string;
  };
  
  // Typography
  typography: {
    headerFont: string;
    bodyFont: string;
    headerSize: string;
    bodySize: string;
    titleWeight: number;
    spacing: 'tight' | 'normal' | 'loose';
  };
  
  // Elements & Features
  elements: {
    logo: boolean;
    badges: boolean;
    priceHighlight: boolean;
    backgroundPattern: boolean;
    geometricShapes: boolean;
    diagonalAccents: boolean;
  };
  
  // Category & Tags
  category: 'business' | 'creative' | 'seasonal' | 'lifestyle' | 'luxury' | 'tech' | 'fashion';
  tags: string[];
  industry?: string[];
}

// ✅ ADD REFERENCE TEMPLATES (empty for now, will be imported from reference-inspired.ts)
export const REFERENCE_TEMPLATES: Record<string, EnhancedTemplateConfig> = {};

export const ENHANCED_TEMPLATES: Record<string, EnhancedTemplateConfig> = {
  
  // ✨ TEMPLATE: TECH MODERN PRO
  'tech-modern-pro': {
    id: 'tech-modern-pro',
    name: 'tech-modern-pro',
    displayName: 'Tech Modern Pro',
    description: 'Diseño futurista con elementos geométricos, gradientes dinámicos y sombras profesionales',
    isPremium: true,
    
    layout: {
      type: 'asymmetric',
      productsPerPage: 6,
      gridColumns: 3,
      featuredProduct: true
    },
    
    design: {
      imageSize: { width: 400, height: 400 },
      borderRadius: 20,
      shadows: true, // ✅ SOMBRAS ACTIVADAS
      animations: true,
      decorativeElements: true
    },
    
    colors: {
      primary: '#0066cc',
      secondary: '#00d4aa',
      accent: '#ff6b35',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      surface: '#ffffff',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    
    typography: {
      headerFont: 'Inter',
      bodyFont: 'Inter',
      headerSize: '36px',
      bodySize: '16px',
      titleWeight: 700,
      spacing: 'normal'
    },
    
    elements: {
      logo: true,
      badges: true,
      priceHighlight: true,
      backgroundPattern: false,
      geometricShapes: true,
      diagonalAccents: true
    },
    
    category: 'tech',
    tags: ['moderno', 'tecnología', 'gradientes', 'geométrico', 'sombras'],
    industry: ['tecnología', 'software', 'electrónicos']
  },

  // ✨ TEMPLATE: LUXURY FASHION ELITE
  'luxury-fashion-elite': {
    id: 'luxury-fashion-elite',
    name: 'luxury-fashion-elite',
    displayName: 'Luxury Fashion Elite',
    description: 'Elegancia suprema con tipografía serif, elementos dorados y sombras sutiles',
    isPremium: true,
    
    layout: {
      type: 'magazine',
      productsPerPage: 4,
      gridColumns: 2,
      featuredProduct: true
    },
    
    design: {
      imageSize: { width: 500, height: 500 },
      borderRadius: 0,
      shadows: true, // ✅ SOMBRAS SUTILES PARA LUJO
      animations: false,
      decorativeElements: true
    },
    
    colors: {
      primary: '#d4af37',
      secondary: '#2c3e50',
      accent: '#e74c3c',
      background: '#f8f9fa',
      surface: '#ffffff',
      textPrimary: '#2c3e50',
      textSecondary: '#7f8c8d'
    },
    
    typography: {
      headerFont: 'Playfair Display',
      bodyFont: 'Lato',
      headerSize: '42px',
      bodySize: '15px',
      titleWeight: 300,
      spacing: 'loose'
    },
    
    elements: {
      logo: true,
      badges: false,
      priceHighlight: true,
      backgroundPattern: false,
      geometricShapes: false,
      diagonalAccents: false
    },
    
    category: 'luxury',
    tags: ['elegante', 'premium', 'moda', 'sofisticado', 'sombras sutiles'],
    industry: ['moda', 'joyería', 'cosméticos', 'lujo']
  },

  // ✨ TEMPLATE: MINIMALIST FURNITURE
  'minimalist-furniture-pro': {
    id: 'minimalist-furniture-pro',
    name: 'minimalist-furniture-pro',
    displayName: 'Minimalist Furniture Pro',
    description: 'Diseño limpio y espacioso con sombras minimalistas para muebles y decoración',
    isPremium: true,
    
    layout: {
      type: 'masonry',
      productsPerPage: 6,
      gridColumns: 3,
      featuredProduct: false
    },
    
    design: {
      imageSize: { width: 450, height: 450 },
      borderRadius: 0,
      shadows: true, // ✅ SOMBRAS MINIMALISTAS
      animations: false,
      decorativeElements: false
    },
    
    colors: {
      primary: '#2d3436',
      secondary: '#636e72',
      accent: '#00b894',
      background: '#fdcb6e',
      surface: '#dddddd',
      textPrimary: '#2d3436',
      textSecondary: '#636e72'
    },
    
    typography: {
      headerFont: 'Inter',
      bodyFont: 'Inter',
      headerSize: '32px',
      bodySize: '14px',
      titleWeight: 300,
      spacing: 'loose'
    },
    
    elements: {
      logo: false,
      badges: false,
      priceHighlight: true,
      backgroundPattern: false,
      geometricShapes: false,
      diagonalAccents: false
    },
    
    category: 'lifestyle',
    tags: ['minimalista', 'limpio', 'espacioso', 'moderno', 'sombras sutiles'],
    industry: ['muebles', 'decoración', 'hogar', 'diseño']
  },

  // ✨ TEMPLATE: VIBRANT ECOMMERCE (GRATIS CON SOMBRAS)
  'vibrant-ecommerce': {
    id: 'vibrant-ecommerce',
    name: 'vibrant-ecommerce',
    displayName: 'Vibrant E-commerce',
    description: 'Diseño colorido y dinámico con sombras vibrantes para tiendas online',
    isPremium: false,
    
    layout: {
      type: 'grid',
      productsPerPage: 9,
      gridColumns: 3,
      featuredProduct: false
    },
    
    design: {
      imageSize: { width: 350, height: 350 },
      borderRadius: 15,
      shadows: true, // ✅ SOMBRAS VIBRANTES GRATUITAS
      animations: true,
      decorativeElements: true
    },
    
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#45b7d1',
      background: '#f8f9fa',
      surface: '#ffffff',
      textPrimary: '#2c3e50',
      textSecondary: '#7f8c8d',
      gradient: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)'
    },
    
    typography: {
      headerFont: 'Poppins',
      bodyFont: 'Inter',
      headerSize: '28px',
      bodySize: '14px',
      titleWeight: 600,
      spacing: 'normal'
    },
    
    elements: {
      logo: true,
      badges: true,
      priceHighlight: true,
      backgroundPattern: true,
      geometricShapes: true,
      diagonalAccents: false
    },
    
    category: 'business',
    tags: ['colorido', 'ecommerce', 'vibrante', 'moderno', 'sombras dinámicas'],
    industry: ['retail', 'tienda online', 'productos variados']
  },

  // ✨ TEMPLATE: CLEAN BUSINESS (GRATIS CON SOMBRAS)
  'clean-business': {
    id: 'clean-business',
    name: 'clean-business',
    displayName: 'Clean Business',
    description: 'Diseño corporativo limpio y profesional con sombras elegantes',
    isPremium: false,
    
    layout: {
      type: 'grid',
      productsPerPage: 6,
      gridColumns: 3,
      featuredProduct: false
    },
    
    design: {
      imageSize: { width: 400, height: 400 },
      borderRadius: 8,
      shadows: true, // ✅ SOMBRAS CORPORATIVAS GRATUITAS
      animations: false,
      decorativeElements: false
    },
    
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280'
    },
    
    typography: {
      headerFont: 'Inter',
      bodyFont: 'Inter',
      headerSize: '32px',
      bodySize: '16px',
      titleWeight: 600,
      spacing: 'normal'
    },
    
    elements: {
      logo: true,
      badges: false,
      priceHighlight: true,
      backgroundPattern: false,
      geometricShapes: false,
      diagonalAccents: false
    },
    
    category: 'business',
    tags: ['limpio', 'corporativo', 'profesional', 'simple', 'sombras elegantes'],
    industry: ['servicios', 'consultoría', 'tecnología']
  }
};

// ✨ HELPER FUNCTIONS
export const getTemplatesByIndustry = (industry: string): EnhancedTemplateConfig[] => {
  return Object.values(ENHANCED_TEMPLATES).filter(template => 
    template.industry?.includes(industry.toLowerCase())
  );
};

export const getTemplatesByDesignFeature = (feature: keyof EnhancedTemplateConfig['elements']): EnhancedTemplateConfig[] => {
  return Object.values(ENHANCED_TEMPLATES).filter(template => 
    template.elements[feature] === true
  );
};

export const getTemplatesByCategory = (category: EnhancedTemplateConfig['category']): EnhancedTemplateConfig[] => {
  return Object.values(ENHANCED_TEMPLATES).filter(template => 
    template.category === category
  );
};

export const getTemplateRecommendations = (products: any[], businessType?: string): EnhancedTemplateConfig[] => {
  const productCount = products.length;
  let recommendations: EnhancedTemplateConfig[] = [];
  
  if (businessType) {
    recommendations = getTemplatesByIndustry(businessType);
  }
  
  if (productCount > 10) {
    recommendations = recommendations.filter(t => t.layout.productsPerPage >= 6);
  }
  
  return recommendations.length > 0 ? recommendations : Object.values(ENHANCED_TEMPLATES).slice(0, 3);
};

export const generateTemplateCSS = (template: EnhancedTemplateConfig): string => {
  return `
    /* Template: ${template.displayName} */
    .template-${template.id} {
      --primary-color: ${template.colors.primary};
      --secondary-color: ${template.colors.secondary};
      --accent-color: ${template.colors.accent};
      --background: ${template.colors.background};
      --surface: ${template.colors.surface};
      --text-primary: ${template.colors.textPrimary};
      --text-secondary: ${template.colors.textSecondary};
      
      --header-font: '${template.typography.headerFont}', sans-serif;
      --body-font: '${template.typography.bodyFont}', sans-serif;
      --header-size: ${template.typography.headerSize};
      --body-size: ${template.typography.bodySize};
      --title-weight: ${template.typography.titleWeight};
      
      --border-radius: ${template.design.borderRadius}px;
      --image-width: ${template.design.imageSize.width}px;
      --image-height: ${template.design.imageSize.height}px;
      
      font-family: var(--body-font);
      background: var(--background);
      color: var(--text-primary);
    }
    
    .template-${template.id} .catalog-header {
      font-family: var(--header-font);
      font-size: var(--header-size);
      font-weight: var(--title-weight);
      color: var(--text-primary);
    }
    
    .template-${template.id} .product-grid {
      display: grid;
      grid-template-columns: repeat(${template.layout.gridColumns || 3}, 1fr);
      gap: 30px;
      ${template.layout.type === 'masonry' ? 'grid-auto-rows: auto;' : ''}
    }
    
    .template-${template.id} .product-card {
      background: var(--surface);
      border-radius: var(--border-radius);
      
      /* ✅ SOMBRAS CONDICIONALES MEJORADAS */
      ${template.design.shadows ? `
        box-shadow: 
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06),
          0 0 0 1px rgba(0, 0, 0, 0.05);
      ` : 'border: 1px solid rgba(0, 0, 0, 0.1);'}
      
      ${template.design.animations ? 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);' : ''}
    }
    
    ${template.design.animations && template.design.shadows ? `
    .template-${template.id} .product-card:hover {
      box-shadow: 
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(0, 0, 0, 0.05);
      transform: translateY(-5px);
    }
    ` : template.design.animations ? `
    .template-${template.id} .product-card:hover {
      transform: translateY(-5px);
    }
    ` : ''}
    
    .template-${template.id} .product-image {
      width: var(--image-width);
      height: var(--image-height);
      object-fit: contain;
      
      /* ✅ SOMBRA PROFESIONAL PARA IMÁGENES */
      ${template.design.shadows ? 'filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));' : ''}
    }
    
    .template-${template.id} .product-title {
      font-family: var(--header-font);
      font-weight: var(--title-weight);
      color: var(--text-primary);
      
      /* ✅ SOMBRA SUTIL PARA TÍTULOS */
      ${template.design.shadows ? 'text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);' : ''}
    }
    
    .template-${template.id} .product-price {
      color: var(--primary-color);
      font-weight: 700;
      font-size: 1.5em;
      
      /* ✅ SOMBRA PARA PRECIOS */
      ${template.design.shadows ? 'text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);' : ''}
    }

    /* ===== FIX IMÁGENES - AGREGAR AL FINAL ===== */
.product-image-container {
  padding: 3mm !important;
  box-sizing: border-box !important;
}

.product-image {
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  margin: 0 auto !important;
}

/* ===== FIX PUPPETEER TAMBIÉN ===== */
.image-container {
  padding: 4mm !important;
  box-sizing: border-box !important;
}
  `;
};
