
import { EnhancedTemplateConfig } from './enhanced-config';

// Reference-inspired templates based on professional catalog designs
export const REFERENCE_INSPIRED_TEMPLATES: Record<string, EnhancedTemplateConfig> = {
  'apple-minimal': {
    id: 'apple-minimal',
    name: 'apple-minimal',
    displayName: 'Minimalista Apple-Inspired',
    description: 'Diseño limpio inspirado en los catálogos de Apple con mucho espacio en blanco',
    isPremium: true,
    category: 'business',
    
    layout: {
      type: 'magazine',
      productsPerPage: 3,
      columns: 1,
      spacing: 40
    },
    
    imageSettings: {
      width: 500,
      height: 400,
      quality: 'ultra',
      borderRadius: 0,
      shadow: false,
      backgroundRemoval: true
    },
    
    typography: {
      primaryFont: 'Helvetica Neue',
      secondaryFont: 'SF Pro Display',
      titleSize: 24,
      bodySize: 14,
      priceSize: 18
    },
    
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      text: '#1D1D1F',
      surface: '#FAFAFA',
      border: '#D2D2D7'
    },
    
    features: {
      watermark: false,
      pageNumbers: false,
      tableOfContents: false,
      categoryDividers: false,
      priceDisplay: 'retail',
      qrCode: false,
      socialMedia: false
    },
    
    professional: {
      headerHeight: 60,
      footerHeight: 40,
      margins: {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60
      },
      branding: {
        logoPosition: 'top-center',
        logoSize: 40,
        showCompanyInfo: false
      }
    }
  },
  
  'ikea-catalog': {
    id: 'ikea-catalog',
    name: 'ikea-catalog',
    displayName: 'Catálogo IKEA-Style',
    description: 'Diseño funcional inspirado en los catálogos de IKEA con información práctica',
    isPremium: true,
    category: 'lifestyle',
    
    layout: {
      type: 'grid',
      productsPerPage: 9,
      columns: 3,
      spacing: 15
    },
    
    imageSettings: {
      width: 250,
      height: 250,
      quality: 'high',
      borderRadius: 4,
      shadow: true,
      backgroundRemoval: true
    },
    
    typography: {
      primaryFont: 'Noto Sans',
      secondaryFont: 'Verdana',
      titleSize: 14,
      bodySize: 10,
      priceSize: 16
    },
    
    colors: {
      primary: '#0058A3',
      secondary: '#FBD914',
      accent: '#0F2C75',
      background: '#FFFFFF',
      text: '#111111',
      surface: '#F5F5F5',
      border: '#E5E5E5'
    },
    
    features: {
      watermark: false,
      pageNumbers: true,
      tableOfContents: true,
      categoryDividers: true,
      priceDisplay: 'retail',
      qrCode: true,
      socialMedia: false
    },
    
    professional: {
      headerHeight: 80,
      footerHeight: 60,
      margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      },
      branding: {
        logoPosition: 'top-left',
        logoSize: 50,
        showCompanyInfo: true
      }
    }
  },
  
  'magazine-editorial': {
    id: 'magazine-editorial',
    name: 'magazine-editorial',
    displayName: 'Editorial Magazine',
    description: 'Diseño editorial sofisticado inspirado en revistas de moda y lifestyle',
    isPremium: true,
    category: 'creative',
    
    layout: {
      type: 'magazine',
      productsPerPage: 4,
      columns: 2,
      spacing: 25
    },
    
    imageSettings: {
      width: 350,
      height: 400,
      quality: 'ultra',
      borderRadius: 8,
      shadow: true,
      backgroundRemoval: true
    },
    
    typography: {
      primaryFont: 'Baskerville',
      secondaryFont: 'Avenir',
      titleSize: 20,
      bodySize: 12,
      priceSize: 14
    },
    
    colors: {
      primary: '#2C2C2C',
      secondary: '#8B8B8B',
      accent: '#D4AF37',
      background: '#FFFFFF',
      text: '#333333',
      surface: '#F8F8F8',
      border: '#E0E0E0'
    },
    
    features: {
      watermark: true,
      pageNumbers: true,
      tableOfContents: true,
      categoryDividers: true,
      priceDisplay: 'none',
      qrCode: false,
      socialMedia: true
    },
    
    professional: {
      headerHeight: 100,
      footerHeight: 80,
      margins: {
        top: 40,
        bottom: 40,
        left: 30,
        right: 30
      },
      branding: {
        logoPosition: 'top-center',
        logoSize: 70,
        showCompanyInfo: true
      }
    }
  }
};

export const getAllReferenceTemplates = (): EnhancedTemplateConfig[] => {
  return Object.values(REFERENCE_INSPIRED_TEMPLATES);
};

export const getReferenceTemplateById = (templateId: string): EnhancedTemplateConfig | undefined => {
  return REFERENCE_INSPIRED_TEMPLATES[templateId];
};
