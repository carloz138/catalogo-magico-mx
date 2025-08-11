
export interface EnhancedTemplateConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPremium: boolean;
  category: 'business' | 'creative' | 'seasonal' | 'lifestyle' | 'luxury';
  
  // Enhanced layout configuration
  layout: {
    type: 'grid' | 'list' | 'magazine' | 'masonry';
    productsPerPage: number;
    columns: number;
    spacing: number;
  };
  
  // Enhanced image settings
  imageSettings: {
    width: number;
    height: number;
    quality: 'standard' | 'high' | 'ultra';
    borderRadius: number;
    shadow: boolean;
    backgroundRemoval: boolean;
  };
  
  // Enhanced typography
  typography: {
    primaryFont: string;
    secondaryFont: string;
    titleSize: number;
    bodySize: number;
    priceSize: number;
  };
  
  // Enhanced color scheme
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text: string;
    surface: string;
    border: string;
  };
  
  // Enhanced features
  features: {
    watermark: boolean;
    pageNumbers: boolean;
    tableOfContents: boolean;
    categoryDividers: boolean;
    priceDisplay: 'retail' | 'wholesale' | 'both' | 'none';
    qrCode: boolean;
    socialMedia: boolean;
  };
  
  // Professional elements
  professional: {
    headerHeight: number;
    footerHeight: number;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    branding: {
      logoPosition: 'top-left' | 'top-center' | 'top-right';
      logoSize: number;
      showCompanyInfo: boolean;
    };
  };
}

export const ENHANCED_TEMPLATE_CONFIGS: Record<string, EnhancedTemplateConfig> = {
  'professional-corporate': {
    id: 'professional-corporate',
    name: 'professional-corporate',
    displayName: 'Corporativo Profesional Enhanced',
    description: 'Diseño corporativo mejorado con elementos profesionales avanzados',
    isPremium: false,
    category: 'business',
    
    layout: {
      type: 'grid',
      productsPerPage: 6,
      columns: 3,
      spacing: 20
    },
    
    imageSettings: {
      width: 300,
      height: 300,
      quality: 'high',
      borderRadius: 8,
      shadow: true,
      backgroundRemoval: true
    },
    
    typography: {
      primaryFont: 'Inter',
      secondaryFont: 'Roboto',
      titleSize: 18,
      bodySize: 12,
      priceSize: 16
    },
    
    colors: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      background: '#FFFFFF',
      text: '#1F2937',
      surface: '#F8FAFC',
      border: '#E5E7EB'
    },
    
    features: {
      watermark: false,
      pageNumbers: true,
      tableOfContents: true,
      categoryDividers: true,
      priceDisplay: 'retail',
      qrCode: true,
      socialMedia: true
    },
    
    professional: {
      headerHeight: 80,
      footerHeight: 60,
      margins: {
        top: 40,
        bottom: 40,
        left: 30,
        right: 30
      },
      branding: {
        logoPosition: 'top-left',
        logoSize: 60,
        showCompanyInfo: true
      }
    }
  },
  
  'luxury-premium': {
    id: 'luxury-premium',
    name: 'luxury-premium',
    displayName: 'Lujo Premium Enhanced',
    description: 'Elegancia máxima con detalles dorados y tipografía refinada',
    isPremium: true,
    category: 'luxury',
    
    layout: {
      type: 'magazine',
      productsPerPage: 4,
      columns: 2,
      spacing: 30
    },
    
    imageSettings: {
      width: 400,
      height: 400,
      quality: 'ultra',
      borderRadius: 12,
      shadow: true,
      backgroundRemoval: true
    },
    
    typography: {
      primaryFont: 'Playfair Display',
      secondaryFont: 'Source Sans Pro',
      titleSize: 22,
      bodySize: 14,
      priceSize: 20
    },
    
    colors: {
      primary: '#B8860B',
      secondary: '#DAA520',
      accent: '#FFD700',
      background: '#FFFEF7',
      text: '#2C1810',
      surface: '#FDF6E3',
      border: '#E6D7B8'
    },
    
    features: {
      watermark: true,
      pageNumbers: true,
      tableOfContents: true,
      categoryDividers: true,
      priceDisplay: 'retail',
      qrCode: true,
      socialMedia: true
    },
    
    professional: {
      headerHeight: 100,
      footerHeight: 80,
      margins: {
        top: 50,
        bottom: 50,
        left: 40,
        right: 40
      },
      branding: {
        logoPosition: 'top-center',
        logoSize: 80,
        showCompanyInfo: true
      }
    }
  }
};

export const getEnhancedTemplateById = (templateId: string): EnhancedTemplateConfig | undefined => {
  return ENHANCED_TEMPLATE_CONFIGS[templateId];
};

export const getAllEnhancedTemplates = (): EnhancedTemplateConfig[] => {
  return Object.values(ENHANCED_TEMPLATE_CONFIGS);
};

export const getEnhancedTemplatesByCategory = (category: EnhancedTemplateConfig['category']): EnhancedTemplateConfig[] => {
  return Object.values(ENHANCED_TEMPLATE_CONFIGS).filter(template => template.category === category);
};
