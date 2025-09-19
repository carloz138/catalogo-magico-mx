// src/lib/templates/industry-templates.ts
// 🎯 SISTEMA DE TEMPLATES ACTUALIZADO - Enero 2025

// ===== IMPORTS =====
import { TEMPLATES_ENERO_2025, CHANGELOG_ENERO_2025 } from './templates-enero-2025';

export type ProductDensity = 'alta' | 'media' | 'baja';
export type IndustryType = 'joyeria' | 'moda' | 'electronica' | 'ferreteria' | 'floreria' | 'cosmeticos' | 'decoracion' | 'muebles';

export interface IndustryTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  industry: IndustryType;
  density: ProductDensity;
  isPremium: boolean;
  
  // Configuración de productos
  productsPerPage: number;
  gridColumns: number;
  imageSize: {
    width: number;
    height: number;
  };
  
  // Colores del template
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardBackground: string;
  };
  
  // Configuración visual
  design: {
    borderRadius: number;
    shadows: boolean;
    spacing: 'compacto' | 'normal' | 'amplio';
  };
  
 // Información que se muestra
showInfo: {
  description: boolean;
  sku: boolean;
  category: boolean;
  specifications: boolean;
  wholesalePrice: boolean;  // NUEVO: Mostrar precio de mayoreo
  wholesaleMinQty: boolean; // NUEVO: Mostrar cantidad mínima
};

// ===== CONFIGURACIONES POR DENSIDAD =====
const DENSITY_CONFIG = {
  alta: {
    productsPerPage: 12,
    gridColumns: 4,
    imageSize: { width: 180, height: 180 },
    spacing: 'compacto'
  },
  media: {
    productsPerPage: 6,
    gridColumns: 3,
    imageSize: { width: 250, height: 250 },
    spacing: 'normal'
  },
  baja: {
    productsPerPage: 3,
    gridColumns: 3,
    imageSize: { width: 300, height: 300 },
    spacing: 'amplio'
  }
};

// ===== TEMPLATES ORIGINALES =====
const ORIGINAL_TEMPLATES: Record<string, IndustryTemplate> = {
  
  // JOYERÍA
  'joyeria-elegante': {
    id: 'joyeria-elegante',
    name: 'joyeria-elegante',
    displayName: 'Joyería Elegante',
    description: 'Perfect para mostrar múltiples piezas de joyería con elegancia',
    industry: 'joyeria',
    density: 'alta',
    isPremium: false,
    
    ...DENSITY_CONFIG.alta,
    
    colors: {
      primary: '#D4AF37',
      secondary: '#F5F5DC',
      accent: '#8B4513',
      background: '#FFFEF7',
      text: '#2C1810',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 8,
      shadows: true,
      spacing: 'compacto'
    },
    
    showInfo: {
      description: false,
      sku: true,
      category: false,
      specifications: false
    }
  },

  'joyeria-luxury': {
    id: 'joyeria-luxury',
    name: 'joyeria-luxury',
    displayName: 'Joyería Luxury',
    description: 'Template premium con detalles dorados para joyería de alta gama',
    industry: 'joyeria',
    density: 'alta',
    isPremium: true,
    
    ...DENSITY_CONFIG.alta,
    
    colors: {
      primary: '#FFD700',
      secondary: '#1A1A1A',
      accent: '#C9B037',
      background: '#0F0F0F',
      text: '#FFFFFF',
      cardBackground: '#2A2A2A'
    },
    
    design: {
      borderRadius: 12,
      shadows: true,
      spacing: 'compacto'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: false
    }
  },

  // MODA
  'moda-boutique': {
    id: 'moda-boutique',
    name: 'moda-boutique',
    displayName: 'Moda Boutique',
    description: 'Perfecto para mostrar ropa y accesorios con estilo',
    industry: 'moda',
    density: 'media',
    isPremium: false,
    
    ...DENSITY_CONFIG.media,
    
    colors: {
      primary: '#E91E63',
      secondary: '#F8BBD9',
      accent: '#AD1457',
      background: '#FFF0F5',
      text: '#2E2E2E',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 15,
      shadows: true,
      spacing: 'normal'
    },
    
    showInfo: {
      description: true,
      sku: false,
      category: true,
      specifications: false
    }
  },

  'moda-urban': {
    id: 'moda-urban',
    name: 'moda-urban',
    displayName: 'Moda Urban',
    description: 'Template moderno para ropa urbana y streetwear',
    industry: 'moda',
    density: 'media',
    isPremium: true,
    
    ...DENSITY_CONFIG.media,
    
    colors: {
      primary: '#212121',
      secondary: '#616161',
      accent: '#FF5722',
      background: '#FAFAFA',
      text: '#212121',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 0,
      shadows: true,
      spacing: 'normal'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: false
    }
  },

  // ELECTRÓNICOS
  'electronica-tech': {
    id: 'electronica-tech',
    name: 'electronica-tech',
    displayName: 'Electrónicos Tech',
    description: 'Para dispositivos electrónicos con especificaciones técnicas',
    industry: 'electronica',
    density: 'baja',
    isPremium: false,
    
    ...DENSITY_CONFIG.baja,
    
    colors: {
      primary: '#1976D2',
      secondary: '#E3F2FD',
      accent: '#FF9800',
      background: '#F5F5F5',
      text: '#212121',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 8,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: true
    }
  },

  'electronica-gaming': {
    id: 'electronica-gaming',
    name: 'electronica-gaming',
    displayName: 'Gaming Pro',
    description: 'Template especializado para productos gaming',
    industry: 'electronica',
    density: 'baja',
    isPremium: true,
    
    ...DENSITY_CONFIG.baja,
    
    colors: {
      primary: '#7C4DFF',
      secondary: '#1A1A1A',
      accent: '#00E676',
      background: '#0D0D0D',
      text: '#FFFFFF',
      cardBackground: '#1E1E1E'
    },
    
    design: {
      borderRadius: 16,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: true
    }
  },

  // FERRETERÍA
  'ferreteria-pro': {
    id: 'ferreteria-pro',
    name: 'ferreteria-pro',
    displayName: 'Ferretería Pro',
    description: 'Para herramientas y productos de ferretería con detalles técnicos',
    industry: 'ferreteria',
    density: 'baja',
    isPremium: false,
    
    ...DENSITY_CONFIG.baja,
    
    colors: {
      primary: '#FF5722',
      secondary: '#FBE9E7',
      accent: '#795548',
      background: '#F5F5F5',
      text: '#212121',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 4,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: true
    }
  },

  // FLORERÍA
  'floreria-natural': {
    id: 'floreria-natural',
    name: 'floreria-natural',
    displayName: 'Florería Natural',
    description: 'Para mostrar múltiples arreglos florales y plantas',
    industry: 'floreria',
    density: 'alta',
    isPremium: false,
    
    ...DENSITY_CONFIG.alta,
    
    colors: {
      primary: '#4CAF50',
      secondary: '#E8F5E8',
      accent: '#FF9800',
      background: '#F1F8E9',
      text: '#2E7D32',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 20,
      shadows: false,
      spacing: 'compacto'
    },
    
    showInfo: {
      description: true,
      sku: false,
      category: false,
      specifications: false
    }
  },

  'floreria-boda': {
    id: 'floreria-boda',
    name: 'floreria-boda',
    displayName: 'Florería Bodas',
    description: 'Template elegante para arreglos de boda y eventos especiales',
    industry: 'floreria',
    density: 'alta',
    isPremium: true,
    
    ...DENSITY_CONFIG.alta,
    
    colors: {
      primary: '#E91E63',
      secondary: '#FCE4EC',
      accent: '#D4AF37',
      background: '#FFF8F8',
      text: '#880E4F',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 25,
      shadows: true,
      spacing: 'compacto'
    },
    
    showInfo: {
      description: true,
      sku: false,
      category: true,
      specifications: false
    }
  },

  // COSMÉTICOS
  'cosmeticos-beauty': {
    id: 'cosmeticos-beauty',
    name: 'cosmeticos-beauty',
    displayName: 'Beauty & Cosmetics',
    description: 'Para productos de belleza y cuidado personal',
    industry: 'cosmeticos',
    density: 'media',
    isPremium: false,
    
    ...DENSITY_CONFIG.media,
    
    colors: {
      primary: '#E91E63',
      secondary: '#F8BBD9',
      accent: '#9C27B0',
      background: '#FFF0F5',
      text: '#2E2E2E',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 20,
      shadows: true,
      spacing: 'normal'
    },
    
    showInfo: {
      description: true,
      sku: false,
      category: true,
      specifications: false
    }
  },

  // MUEBLES
  'muebles-hogar': {
    id: 'muebles-hogar',
    name: 'muebles-hogar',
    displayName: 'Muebles Hogar',
    description: 'Para muebles y decoración del hogar con detalles completos',
    industry: 'muebles',
    density: 'baja',
    isPremium: false,
    
    ...DENSITY_CONFIG.baja,
    
    colors: {
      primary: '#8D6E63',
      secondary: '#EFEBE9',
      accent: '#FF5722',
      background: '#FAFAFA',
      text: '#3E2723',
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 8,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: true
    }
  }
};

// ===== COMBINANDO TODOS LOS TEMPLATES =====
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  ...ORIGINAL_TEMPLATES,
  ...TEMPLATES_ENERO_2025  // 🎯 NUEVOS TEMPLATES INTEGRADOS
};

// ===== MAPEO DE INDUSTRIAS =====
export const INDUSTRY_MAP = {
  joyeria: {
    name: 'Joyería',
    description: 'Anillos, collares, pulseras y accesorios',
    recommendedDensity: 'alta',
    icon: '💎'
  },
  moda: {
    name: 'Moda y Ropa',
    description: 'Ropa, calzado y accesorios de moda',
    recommendedDensity: 'media',
    icon: '👗'
  },
  electronica: {
    name: 'Electrónicos',
    description: 'Dispositivos, gadgets y tecnología',
    recommendedDensity: 'baja',
    icon: '📱'
  },
  ferreteria: {
    name: 'Ferretería',
    description: 'Herramientas, materiales de construcción',
    recommendedDensity: 'baja',
    icon: '🔧'
  },
  floreria: {
    name: 'Florería',
    description: 'Flores, plantas y arreglos florales',
    recommendedDensity: 'alta',
    icon: '🌸'
  },
  cosmeticos: {
    name: 'Cosméticos',
    description: 'Maquillaje, cuidado personal y belleza',
    recommendedDensity: 'media',
    icon: '💄'
  },
  decoracion: {
    name: 'Decoración',
    description: 'Artículos decorativos para el hogar',
    recommendedDensity: 'media',
    icon: '🏠'
  },
  muebles: {
    name: 'Muebles',
    description: 'Muebles y mobiliario para hogar/oficina',
    recommendedDensity: 'baja',
    icon: '🪑'
  }
} as const;

// ===== HELPER FUNCTION PARA DEFAULTS DE MAYOREO =====
export const addWholesaleDefaults = (template: Partial<IndustryTemplate>): IndustryTemplate => {
  return {
    ...template,
    showInfo: {
      ...template.showInfo,
      wholesalePrice: template.showInfo?.wholesalePrice ?? true,
      wholesaleMinQty: template.showInfo?.wholesaleMinQty ?? true
    }
  } as IndustryTemplate;
};

export const getTemplatesByIndustry = (industry: IndustryType): IndustryTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES).filter(template => template.industry === industry);
};

export const getTemplatesByDensity = (density: ProductDensity): IndustryTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES).filter(template => template.density === density);
};

export const getFreeTemplates = (): IndustryTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES).filter(template => !template.isPremium);
};

export const getPremiumTemplates = (): IndustryTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES).filter(template => template.isPremium);
};

export const getTemplateById = (id: string): IndustryTemplate | null => {
  return INDUSTRY_TEMPLATES[id] || null;
};

// ===== RECOMENDACIONES MEJORADAS CON NUEVOS TEMPLATES =====
export const getRecommendedTemplates = (industry?: IndustryType, productCount?: number): IndustryTemplate[] => {
  let recommendations: IndustryTemplate[] = [];
  
  // Priorizar nuevos templates por industria
  if (industry) {
    const industryTemplates = getTemplatesByIndustry(industry);
    // Poner nuevos templates primero
    const nuevosTemplates = industryTemplates.filter(t => Object.keys(TEMPLATES_ENERO_2025).includes(t.id));
    const originalTemplates = industryTemplates.filter(t => !Object.keys(TEMPLATES_ENERO_2025).includes(t.id));
    recommendations.push(...nuevosTemplates, ...originalTemplates);
  }
  
  // Recomendar por densidad según cantidad de productos
  if (productCount) {
    const recommendedDensity: ProductDensity = 
      productCount <= 4 ? 'baja' : 
      productCount <= 8 ? 'media' : 'alta';
    
    const densityTemplates = getTemplatesByDensity(recommendedDensity)
      .filter(t => !recommendations.find(r => r.id === t.id));
    recommendations.push(...densityTemplates.slice(0, 2));
  }
  
  // Si no hay suficientes, agregar populares (priorizando nuevos)
  if (recommendations.length < 4) {
    const popular = [
      // NUEVOS TEMPLATES PRIMERO
      INDUSTRY_TEMPLATES['floreria-elegante-rosa'],
      INDUSTRY_TEMPLATES['moda-magazine-pro'],
      INDUSTRY_TEMPLATES['floreria-vintage-pastel'],
      INDUSTRY_TEMPLATES['moda-boutique-luxury'],
      // ORIGINALES
      INDUSTRY_TEMPLATES['moda-boutique'],
      INDUSTRY_TEMPLATES['joyeria-elegante'],
      INDUSTRY_TEMPLATES['electronica-tech']
    ].filter(t => t && !recommendations.find(r => r.id === t.id));
    recommendations.push(...popular);
  }
  
  return recommendations.slice(0, 6);
};

// ===== ESTADÍSTICAS DEL SISTEMA =====
export const getTemplateStats = () => {
  const allTemplates = Object.values(INDUSTRY_TEMPLATES);
  const newTemplates = Object.values(TEMPLATES_ENERO_2025);
  
  return {
    total: allTemplates.length,
    nuevos: newTemplates.length,
    byIndustry: Object.keys(INDUSTRY_MAP).reduce((acc, industry) => {
      acc[industry] = getTemplatesByIndustry(industry as IndustryType).length;
      return acc;
    }, {} as Record<string, number>),
    byDensity: {
      alta: getTemplatesByDensity('alta').length,
      media: getTemplatesByDensity('media').length,
      baja: getTemplatesByDensity('baja').length
    },
    byPremium: {
      free: getFreeTemplates().length,
      premium: getPremiumTemplates().length
    },
    changelog: CHANGELOG_ENERO_2025
  };
};

// ===== NUEVAS FUNCIONES PARA GESTIÓN =====
export const getNewTemplates = (): IndustryTemplate[] => {
  return Object.values(TEMPLATES_ENERO_2025);
};

export const getTemplatesByBatch = (batch: 'enero-2025' | 'original'): IndustryTemplate[] => {
  if (batch === 'enero-2025') {
    return Object.values(TEMPLATES_ENERO_2025);
  }
  return Object.values(ORIGINAL_TEMPLATES);
};

export default INDUSTRY_TEMPLATES;