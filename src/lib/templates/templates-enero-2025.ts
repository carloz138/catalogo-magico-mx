// src/lib/templates/templates-enero-2025.ts
// 🎨 NUEVOS TEMPLATES ENERO 2025 - Inspirados en catálogos de referencia

import { IndustryTemplate } from './industry-templates';

// ===== BATCH ENERO 2025: TEMPLATES INSPIRADOS EN REFERENCIAS =====

export const TEMPLATES_ENERO_2025: Record<string, IndustryTemplate> = {

  // 🌸 FLORERÍA TEMPLATE 1: ELEGANTE ROSA (Gratuito)
  'floreria-elegante-rosa': {
    id: 'floreria-elegante-rosa',
    name: 'floreria-elegante-rosa',
    displayName: 'Florería Elegante Rosa',
    description: 'Diseño femenino y elegante con tonos rosa suave, perfecto para floristerías y eventos especiales',
    industry: 'floreria',
    density: 'media',
    isPremium: false,
    
    productsPerPage: 6,
    gridColumns: 3,
    imageSize: { width: 250, height: 250 },
    
    colors: {
      primary: '#E8A5B8',        // Rosa suave principal
      secondary: '#F4E6EA',      // Rosa muy claro para fondos
      accent: '#C7889B',         // Rosa más oscuro para acentos
      background: '#FDF8F9',     // Fondo casi blanco con toque rosa
      text: '#5A2E3A',           // Texto oscuro rosado
      cardBackground: '#FFFFFF'  // Cards blancos
    },
    
    design: {
      borderRadius: 15,
      shadows: true,
      spacing: 'normal'
    },
    
    showInfo: {
      description: true,
      sku: false,
      category: false,
      specifications: false
    }
  },

  // 🌿 FLORERÍA TEMPLATE 2: VINTAGE PASTEL (Premium)
  'floreria-vintage-pastel': {
    id: 'floreria-vintage-pastel',
    name: 'floreria-vintage-pastel',
    displayName: 'Florería Vintage Pastel',
    description: 'Estilo vintage con colores pastel, ideal para arreglos clásicos y bodas retro',
    industry: 'floreria',
    density: 'media',
    isPremium: true,
    
    productsPerPage: 6,
    gridColumns: 3,
    imageSize: { width: 250, height: 250 },
    
    colors: {
      primary: '#B8A9C9',        // Lavanda suave
      secondary: '#E8E2D4',      // Beige pastel
      accent: '#D4A574',         // Dorado vintage
      background: '#F7F5F3',     // Crema vintage
      text: '#4A4A4A',           // Gris carbón
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 20,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      description: true,
      sku: true,
      category: true,
      specifications: false
    }
  },

  // 🌱 FLORERÍA TEMPLATE 3: MODERNA CLEAN (Premium)
  'floreria-moderna-clean': {
    id: 'floreria-moderna-clean',
    name: 'floreria-moderna-clean',
    displayName: 'Florería Moderna Clean',
    description: 'Diseño minimalista y moderno, perfecto para floristerías contemporáneas',
    industry: 'floreria',
    density: 'media',
    isPremium: true,
    
    productsPerPage: 6,
    gridColumns: 3,
    imageSize: { width: 250, height: 250 },
    
    colors: {
      primary: '#2E8B57',        // Verde bosque moderno
      secondary: '#F0F8F0',      // Verde muy claro
      accent: '#FFB347',         // Naranja suave
      background: '#FAFAFA',     // Gris muy claro
      text: '#2D3748',           // Gris oscuro
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 8,
      shadows: false,
      spacing: 'normal'
    },
    
    showInfo: {
      description: false,
      sku: false,
      category: false,
      specifications: false
    }
  },

  // 👗 MODA TEMPLATE 4: MAGAZINE PRO (Gratuito)
  'moda-magazine-pro': {
    id: 'moda-magazine-pro',
    name: 'moda-magazine-pro',
    displayName: 'Moda Magazine Pro',
    description: 'Estilo revista de moda con diseño profesional, inspirado en catálogos premium',
    industry: 'moda',
    density: 'media',
    isPremium: false,
    
    productsPerPage: 6,
    gridColumns: 3,
    imageSize: { width: 250, height: 250 },
    
    colors: {
      primary: '#E91E63',        // Rosa vibrante (como referencia)
      secondary: '#FCE4EC',      // Rosa muy claro
      accent: '#AD1457',         // Rosa oscuro
      background: '#FFFFFF',     // Blanco limpio
      text: '#212121',           // Negro
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 0,           // Sin bordes redondeados (estilo magazine)
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

  // 🖤 MODA TEMPLATE 5: URBAN BOLD (Premium)
  'moda-urban-bold': {
    id: 'moda-urban-bold',
    name: 'moda-urban-bold',
    displayName: 'Moda Urban Bold',
    description: 'Diseño urbano y atrevido para streetwear y moda juvenil',
    industry: 'moda',
    density: 'media',
    isPremium: true,
    
    productsPerPage: 6,
    gridColumns: 3,
    imageSize: { width: 250, height: 250 },
    
    colors: {
      primary: '#FF6B35',        // Naranja vibrante
      secondary: '#2C3E50',      // Azul marino oscuro
      accent: '#F39C12',         // Amarillo dorado
      background: '#ECEFF1',     // Gris muy claro
      text: '#2C3E50',           // Azul marino
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 5,
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

  // ✨ MODA TEMPLATE 6: BOUTIQUE LUXURY (Premium)
  'moda-boutique-luxury': {
    id: 'moda-boutique-luxury',
    name: 'moda-boutique-luxury',
    displayName: 'Moda Boutique Luxury',
    description: 'Elegancia suprema para boutiques de alta gama y moda de lujo',
    industry: 'moda',
    density: 'baja',           // Menos productos para mostrar exclusividad
    isPremium: true,
    
    productsPerPage: 3,
    gridColumns: 3,
    imageSize: { width: 300, height: 300 },
    
    colors: {
      primary: '#D4AF37',        // Dorado elegante
      secondary: '#2C3E50',      // Azul marino sofisticado
      accent: '#8E24AA',         // Púrpura real
      background: '#F8F9FA',     // Gris perla
      text: '#2C3E50',           // Azul marino
      cardBackground: '#FFFFFF'
    },
    
    design: {
      borderRadius: 12,
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

// ===== HELPER FUNCTIONS ESPECÍFICAS PARA ESTE BATCH =====

export const getTemplatesEnero2025 = (): IndustryTemplate[] => {
  return Object.values(TEMPLATES_ENERO_2025);
};

export const getFloreriaEnero = (): IndustryTemplate[] => {
  return Object.values(TEMPLATES_ENERO_2025).filter(t => t.industry === 'floreria');
};

export const getModaEnero = (): IndustryTemplate[] => {
  return Object.values(TEMPLATES_ENERO_2025).filter(t => t.industry === 'moda');
};

export const getGratuitosEnero = (): IndustryTemplate[] => {
  return Object.values(TEMPLATES_ENERO_2025).filter(t => !t.isPremium);
};

export const getPremiumEnero = (): IndustryTemplate[] => {
  return Object.values(TEMPLATES_ENERO_2025).filter(t => t.isPremium);
};

// ===== CHANGELOG ENERO 2025 =====
export const CHANGELOG_ENERO_2025 = {
  fecha: '2025-01-10',
  templates_agregados: 6,
  description: 'Batch inspirado en catálogos de referencia de florería y moda',
  templates: [
    'floreria-elegante-rosa - Inspirado en catálogo rosa femenino, gratuito',
    'floreria-vintage-pastel - Estilo vintage con toques dorados, premium',
    'floreria-moderna-clean - Minimalista verde moderno, premium',
    'moda-magazine-pro - Estilo revista profesional, gratuito',
    'moda-urban-bold - Diseño urbano streetwear, premium',
    'moda-boutique-luxury - Lujo con densidad baja, premium'
  ],
  estadisticas: {
    por_industria: { floreria: 3, moda: 3 },
    por_densidad: { alta: 0, media: 5, baja: 1 },
    por_plan: { gratuitos: 2, premium: 4 }
  }
};

export default TEMPLATES_ENERO_2025;