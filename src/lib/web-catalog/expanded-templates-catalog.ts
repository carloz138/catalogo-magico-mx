// lib/web-catalog/expanded-templates-catalog.ts
import { WebCatalogTemplate, TemplateCategory } from './types';

export const EXPANDED_WEB_TEMPLATES: WebCatalogTemplate[] = [
  
  // ============================================
  // CATEGORÍA: BASIC (1 template)
  // Disponible para: Gratis, Catálogos, Básico IA, Profesional, Empresarial
  // ============================================
  
  {
    id: 'basic-catalog-free',
    name: 'Catálogo Básico',
    description: 'Template simple y funcional para mostrar tus productos',
    longDescription: 'Diseño limpio y profesional con grid ordenado. Perfecto para comenzar a mostrar tus productos de manera efectiva.',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'modern-grid',
    style: 'minimal',
    category: 'basic', // 🆕 BÁSICO
    isPremium: false,
    bestFor: ['general', 'moda', 'electronica', 'decoracion', 'alimentos'],
    idealProductCount: { min: 1, max: 200 },
    features: [
      'Grid responsive limpio',
      'Imágenes optimizadas',
      'Información básica de producto',
      'Búsqueda simple',
      'Compatible con móvil'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'outlined',
      cardRadius: 'md',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: false,
      hasCart: false,
      hasFavorites: false,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'fade',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: true
    },
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#10b981',
      background: '#f8fafc',
      cardBackground: '#ffffff',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0'
    },
    popularity: 100,
    tags: ['básico', 'gratuito', 'simple']
  },

  // ============================================
  // CATEGORÍA: STANDARD (8 templates)
  // Disponible para: Básico IA, Profesional, Empresarial
  // ============================================
  
  {
    id: 'modern-grid-clean',
    name: 'Grid Moderno Limpio',
    description: 'Grid ordenado minimalista, perfecto para cualquier producto',
    longDescription: 'Layout de grid simple y ordenado. Fondo blanco, tipografía clara. Perfecto para catálogos con muchos productos.',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'modern-grid',
    style: 'minimal',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['general', 'moda', 'alimentos', 'decoracion'],
    idealProductCount: { min: 12, max: 100 },
    features: [
      'Grid ordenado 3 columnas',
      'Carga rápida',
      'Fácil de escanear',
      'Precios destacados',
      'Badges de ofertas'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'flat',
      cardRadius: 'sm',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: false,
      hasShareButtons: false,
      hasZoom: true,
      entranceAnimation: 'fade',
      transitionSpeed: 'fast',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#ffc107',
      secondary: '#ffb300',
      accent: '#ff9800',
      background: '#ffffff',
      cardBackground: '#ffffff',
      text: '#212121',
      textMuted: '#757575',
      border: '#e0e0e0'
    },
    popularity: 90,
    tags: ['simple', 'clean', 'rápido']
  },

  {
    id: 'masonry-fashion-elegant',
    name: 'Fashion Masonry Elegante',
    description: 'Cards asimétricas con imágenes grandes, perfecto para moda',
    longDescription: 'Inspirado en revistas de moda. Layout masonry dinámico con cards de diferentes tamaños.',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'masonry',
    style: 'elegant',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['moda', 'cosmeticos', 'decoracion'],
    idealProductCount: { min: 6, max: 40 },
    features: [
      'Layout masonry asimétrico',
      'Cards de tamaños variables',
      'Círculos de colores/variantes',
      'Hover suave con elevación',
      'Tipografía limpia'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 1,
      gap: 'loose',
      cardStyle: 'elevated',
      cardRadius: 'lg',
      imageRatio: 'auto',
      hoverEffect: 'lift',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'stagger',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#2d3436',
      secondary: '#636e72',
      accent: '#00b894',
      background: '#f5f6fa',
      cardBackground: '#ffffff',
      text: '#2d3436',
      textMuted: '#636e72',
      border: '#dfe6e9'
    },
    popularity: 88,
    tags: ['moda', 'elegante', 'asimétrico']
  },

  {
    id: 'sidebar-detail-warm',
    name: 'Sidebar Detail Cálido',
    description: 'Vista de lista lateral con detalle grande, tonos cálidos',
    longDescription: 'Layout con sidebar de productos y vista detallada principal. Colores cálidos ideales para muebles, hogar y decoración.',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'magazine',
    style: 'modern',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['muebles', 'decoracion', 'electronica'],
    idealProductCount: { min: 8, max: 50 },
    features: [
      'Sidebar con grid de productos',
      'Vista detallada amplia',
      'Navegación intuitiva',
      'Rating de productos',
      'Botón de agregar directo'
    ],
    config: {
      columnsDesktop: 4,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'elevated',
      cardRadius: 'xl',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'sidebar',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'slide',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#d4845c',
      secondary: '#e8b196',
      accent: '#f4a261',
      background: '#ffe8d6',
      cardBackground: '#ffffff',
      text: '#264653',
      textMuted: '#7d8491',
      border: '#ddbea9'
    },
    popularity: 86,
    tags: ['sidebar', 'warm', 'detail']
  },

  {
    id: 'sidebar-detail-blue',
    name: 'Sidebar Detail Profesional',
    description: 'Sidebar con tonos azules, perfecto para tech',
    longDescription: 'Mismo layout de sidebar pero con paleta azul profesional. Ideal para electrónica y productos tecnológicos.',
    thumbnail: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'magazine',
    style: 'modern',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['electronica', 'ferreteria', 'general'],
    idealProductCount: { min: 8, max: 50 },
    features: [
      'Layout sidebar profesional',
      'Paleta azul corporativa',
      'Especificaciones técnicas',
      'Comparador de productos',
      'Filtros avanzados'
    ],
    config: {
      columnsDesktop: 4,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'outlined',
      cardRadius: 'lg',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'sidebar',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'fade',
      transitionSpeed: 'fast',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#2196f3',
      secondary: '#64b5f6',
      accent: '#1976d2',
      background: '#e3f2fd',
      cardBackground: '#ffffff',
      text: '#0d47a1',
      textMuted: '#546e7a',
      border: '#90caf9'
    },
    popularity: 82,
    tags: ['tech', 'blue', 'profesional']
  },

  {
    id: 'grid-colorful',
    name: 'Grid Colorido por Categorías',
    description: 'Grid con fondos de color suave para cada categoría',
    longDescription: 'Grid simple pero con fondos de colores pastel que diferencian categorías. Divertido y organizado.',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'modern-grid',
    style: 'playful',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['alimentos', 'decoracion', 'general'],
    idealProductCount: { min: 12, max: 100 },
    features: [
      'Fondos de colores por categoría',
      'Grid organizado',
      'Visual alegre',
      'Badges destacados',
      'Iconos categoría'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'flat',
      cardRadius: 'lg',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'slide',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      accent: '#ffe66d',
      background: '#f8f9fa',
      cardBackground: '#ffffff',
      text: '#2d3436',
      textMuted: '#636e72',
      border: '#dfe6e9'
    },
    popularity: 84,
    tags: ['colorful', 'fun', 'categories']
  },

  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    description: 'Grid cuadrado estilo feed de Instagram',
    longDescription: 'Grid perfecto de imágenes cuadradas como Instagram. Limpio, moderno y familiar para todos los usuarios.',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'modern-grid',
    style: 'modern',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['moda', 'cosmeticos', 'floreria'],
    idealProductCount: { min: 9, max: 60 },
    features: [
      'Grid cuadrado perfecto',
      'Estilo Instagram familiar',
      'Modal con detalles',
      'Likes y favoritos',
      'Compartir directo'
    ],
    config: {
      columnsDesktop: 2,
      columnsMobile: 2,
      gap: 'tight',
      cardStyle: 'flat',
      cardRadius: 'none',
      imageRatio: 'square',
      hoverEffect: 'zoom',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: false,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'fade',
      transitionSpeed: 'fast',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#405de6',
      secondary: '#833ab4',
      accent: '#fd1d1d',
      background: '#fafafa',
      cardBackground: '#ffffff',
      text: '#262626',
      textMuted: '#8e8e8e',
      border: '#dbdbdb',
      gradient: {
        from: '#833ab4',
        to: '#fd1d1d',
        direction: 'to-r'
      }
    },
    popularity: 93,
    tags: ['instagram', 'social', 'square']
  },

  {
    id: 'polaroid-vintage',
    name: 'Polaroid Vintage',
    description: 'Estilo polaroid vintage con fotos inclinadas',
    longDescription: 'Cards estilo foto polaroid con rotaciones aleatorias. Nostálgico y único, perfecto para productos artesanales.',
    thumbnail: 'https://images.unsplash.com/photo-1516476892398-f666b0e9d976?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'masonry',
    style: 'playful',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['decoracion', 'floreria', 'alimentos'],
    idealProductCount: { min: 6, max: 36 },
    features: [
      'Estilo polaroid único',
      'Rotaciones aleatorias',
      'Sombras realistas',
      'Textura vintage',
      'Hover interactivo'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 1,
      gap: 'loose',
      cardStyle: 'elevated',
      cardRadius: 'sm',
      imageRatio: 'square',
      hoverEffect: 'tilt',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'scale',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#8b7355',
      secondary: '#a0826d',
      accent: '#c9a66b',
      background: '#f5ebe0',
      cardBackground: '#fefefe',
      text: '#3e2723',
      textMuted: '#6d4c41',
      border: '#d7ccc8'
    },
    popularity: 73,
    tags: ['vintage', 'polaroid', 'creative']
  },

  {
    id: 'carousel-dynamic',
    name: 'Carousel Dinámico',
    description: 'Slider interactivo con múltiples vistas',
    longDescription: 'Carousel moderno con múltiples productos visibles. Perfecto para catálogos pequeños o promociones especiales.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'carousel',
    style: 'playful',
    category: 'standard', // 🆕 ESTÁNDAR
    isPremium: false,
    bestFor: ['floreria', 'alimentos', 'decoracion'],
    idealProductCount: { min: 4, max: 24 },
    features: [
      'Auto-play opcional',
      'Touch swipe',
      'Dots navigation',
      'Lazy loading'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 1,
      gap: 'normal',
      cardStyle: 'elevated',
      cardRadius: 'xl',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'modal',
      hasSearch: false,
      hasFilters: false,
      hasCart: true,
      hasFavorites: false,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'fade',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      background: '#fef3c7',
      cardBackground: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280',
      border: '#fbbf24',
      gradient: {
        from: '#fef3c7',
        to: '#fed7aa',
        direction: 'to-br'
      }
    },
    popularity: 72,
    tags: ['divertido', 'colorido', 'dinámico']
  },

  // ============================================
  // CATEGORÍA: SEASONAL (7 templates)
  // Disponible SOLO para: Profesional, Empresarial
  // ============================================

  {
    id: 'masonry-fashion-dark-premium',
    name: 'Fashion Masonry Dark Premium',
    description: 'Versión oscura y premium del masonry para moda de lujo',
    longDescription: 'Mismo layout masonry pero con esquema de colores oscuro y elegante. Perfecto para marcas premium y exclusivas.',
    thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'masonry',
    style: 'elegant',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['moda', 'joyeria', 'cosmeticos'],
    idealProductCount: { min: 6, max: 40 },
    features: [
      'Tema oscuro elegante',
      'Masonry dinámico',
      'Efectos de luz premium',
      'Colores personalizables'
    ],
    proFeatures: [
      'Tema dark mode exclusivo',
      'Sin watermark',
      'Gradientes personalizados',
      'Animaciones premium'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 1,
      gap: 'loose',
      cardStyle: 'glass',
      cardRadius: 'lg',
      imageRatio: 'auto',
      hoverEffect: 'glow',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'stagger',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#ffffff',
      secondary: '#a8a8a8',
      accent: '#ffd700',
      background: '#1a1a1a',
      cardBackground: 'rgba(255, 255, 255, 0.05)',
      text: '#ffffff',
      textMuted: '#a8a8a8',
      border: 'rgba(255, 255, 255, 0.1)',
      gradient: {
        from: '#2d2d2d',
        to: '#1a1a1a',
        direction: 'to-br'
      }
    },
    popularity: 85,
    isNew: true,
    tags: ['premium', 'dark', 'luxury', 'seasonal']
  },

  {
    id: 'sidebar-detail-luxury',
    name: 'Sidebar Luxury Premium',
    description: 'Versión premium con tema oscuro elegante y detalles dorados',
    longDescription: 'Layout sidebar con tema oscuro y detalles dorados. Sin marca de agua. Para catálogos de lujo y alta gama.',
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'magazine',
    style: 'luxury',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['joyeria', 'muebles', 'decoracion'],
    idealProductCount: { min: 8, max: 50 },
    features: [
      'Tema oscuro elegante',
      'Detalles dorados',
      'Vista 360° productos',
      'Zoom ultra HD'
    ],
    proFeatures: [
      'Sin marca de agua',
      'Galería 360° exclusiva',
      'Video preview',
      'Colores personalizables'
    ],
    config: {
      columnsDesktop: 4,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'glass',
      cardRadius: 'xl',
      imageRatio: 'square',
      hoverEffect: 'glow',
      clickAction: 'sidebar',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'scale',
      transitionSpeed: 'slow',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#d4af37',
      secondary: '#b8860b',
      accent: '#ffd700',
      background: '#1a1a1a',
      cardBackground: 'rgba(255, 255, 255, 0.05)',
      text: '#ffffff',
      textMuted: '#a8a8a8',
      border: 'rgba(212, 175, 55, 0.3)',
      gradient: {
        from: '#2d2d2d',
        to: '#1a1a1a',
        direction: 'to-b'
      }
    },
    popularity: 79,
    isNew: true,
    tags: ['premium', 'luxury', 'gold', 'seasonal']
  },

  {
    id: 'grid-compact-pro',
    name: 'Grid Compacto Pro',
    description: 'Grid denso para mostrar muchos productos',
    longDescription: 'Grid de 4-5 columnas muy compacto. Ideal para catálogos con 50+ productos. Vista de lista opcional.',
    thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'modern-grid',
    style: 'minimal',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['ferreteria', 'electronica', 'general'],
    idealProductCount: { min: 50, max: 500 },
    features: [
      'Grid de 5 columnas',
      'Vista muy compacta',
      'Toggle list/grid',
      'Filtros avanzados'
    ],
    proFeatures: [
      'Hasta 500 productos',
      'Sin marca de agua',
      'Exportar lista',
      'Comparador múltiple'
    ],
    config: {
      columnsDesktop: 5,
      columnsMobile: 2,
      gap: 'tight',
      cardStyle: 'outlined',
      cardRadius: 'sm',
      imageRatio: 'square',
      hoverEffect: 'lift',
      clickAction: 'expand',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: false,
      hasZoom: true,
      entranceAnimation: 'none',
      transitionSpeed: 'fast',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#1e88e5',
      secondary: '#64b5f6',
      accent: '#ffa726',
      background: '#fafafa',
      cardBackground: '#ffffff',
      text: '#212121',
      textMuted: '#757575',
      border: '#e0e0e0'
    },
    popularity: 76,
    tags: ['compact', 'dense', 'professional', 'seasonal']
  },

  {
    id: 'magazine-editorial-pro',
    name: 'Magazine Editorial Premium',
    description: 'Estilo revista de moda con tipografía grande',
    longDescription: 'Layout asimétrico inspirado en revistas Vogue/Harper\'s. Tipografía impactante, imágenes full-bleed.',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'magazine',
    style: 'bold',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['moda', 'joyeria', 'cosmeticos'],
    idealProductCount: { min: 6, max: 30 },
    features: [
      'Layout editorial asimétrico',
      'Tipografía display grande',
      'Imágenes full-bleed',
      'Parallax scrolling'
    ],
    proFeatures: [
      'Fuentes custom premium',
      'Sin marca de agua',
      'Video headers',
      'Animaciones parallax'
    ],
    config: {
      columnsDesktop: 3,
      columnsMobile: 1,
      gap: 'loose',
      cardStyle: 'flat',
      cardRadius: 'none',
      imageRatio: 'portrait',
      hoverEffect: 'zoom',
      clickAction: 'modal',
      hasSearch: false,
      hasFilters: false,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'slide',
      transitionSpeed: 'slow',
      showLogo: true,
      showWatermark: false,
      customFonts: ['Playfair Display', 'Montserrat']
    },
    colorScheme: {
      primary: '#000000',
      secondary: '#dc143c',
      accent: '#ffd700',
      background: '#ffffff',
      cardBackground: '#ffffff',
      text: '#000000',
      textMuted: '#666666',
      border: '#000000'
    },
    popularity: 81,
    isNew: true,
    tags: ['editorial', 'magazine', 'bold', 'seasonal']
  },

  {
    id: 'bento-modern-pro',
    name: 'Bento Box Modern Premium',
    description: 'Layout tipo "bento box" con cards de tamaños variados',
    longDescription: 'Inspirado en el diseño "bento box" de Apple. Cards de diferentes tamaños creando un layout dinámico.',
    thumbnail: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'modern-grid',
    style: 'modern',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['electronica', 'decoracion', 'general'],
    idealProductCount: { min: 8, max: 32 },
    features: [
      'Bento box layout',
      'Cards de tamaños variados',
      'Diseño premium moderno',
      'Hover con animaciones'
    ],
    proFeatures: [
      'Layout adaptativo inteligente',
      'Sin marca de agua',
      'Micro-interactions',
      'Glassmorphism effects'
    ],
    config: {
      columnsDesktop: 4,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'glass',
      cardRadius: 'xl',
      imageRatio: 'auto',
      hoverEffect: 'lift',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'stagger',
      transitionSpeed: 'normal',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#007aff',
      secondary: '#5856d6',
      accent: '#ff2d55',
      background: '#f2f2f7',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      text: '#000000',
      textMuted: '#8e8e93',
      border: 'rgba(0, 0, 0, 0.1)',
      gradient: {
        from: '#f2f2f7',
        to: '#e5e5ea',
        direction: 'to-br'
      }
    },
    popularity: 87,
    isNew: true,
    tags: ['modern', 'bento', 'apple-style', 'seasonal']
  },

  {
    id: 'netflix-carousel-pro',
    name: 'Netflix Carousel Premium',
    description: 'Carousels horizontales por categoría estilo Netflix',
    longDescription: 'Múltiples carousels horizontales organizados por categoría. Navegación fluida con scroll horizontal.',
    thumbnail: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'horizontal-scroll',
    style: 'modern',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['electronica', 'moda', 'general'],
    idealProductCount: { min: 20, max: 100 },
    features: [
      'Carousels por categoría',
      'Scroll horizontal fluido',
      'Lazy loading inteligente',
      'Navegación por flechas'
    ],
    proFeatures: [
      'Hasta 100 productos',
      'Sin marca de agua',
      'Autoplay configurable',
      'Touch gestures premium'
    ],
    config: {
      columnsDesktop: 5,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'elevated',
      cardRadius: 'md',
      imageRatio: 'landscape',
      hoverEffect: 'zoom',
      clickAction: 'modal',
      hasSearch: true,
      hasFilters: true,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'slide',
      transitionSpeed: 'fast',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#e50914',
      secondary: '#831010',
      accent: '#f5f5f1',
      background: '#141414',
      cardBackground: '#1f1f1f',
      text: '#ffffff',
      textMuted: '#b3b3b3',
      border: '#2f2f2f'
    },
    popularity: 89,
    isNew: true,
    tags: ['carousel', 'netflix', 'horizontal', 'seasonal']
  },

  {
    id: 'showcase-fullscreen-pro',
    name: 'Showcase Fullscreen Premium',
    description: 'Presentación fullscreen de alto impacto para productos exclusivos',
    longDescription: 'Template premium con efecto de showcase fullscreen. Cada producto ocupa toda la pantalla con transiciones cinematográficas.',
    thumbnail: 'https://images.unsplash.com/photo-1618005198920-f0cb6201c115?w=600&h=400&fit=crop',
    previewImages: [],
    layout: 'showcase',
    style: 'luxury',
    category: 'seasonal', // 🆕 SEASONAL
    isPremium: true,
    bestFor: ['joyeria', 'muebles', 'decoracion'],
    idealProductCount: { min: 5, max: 20 },
    features: [
      'Presentación fullscreen',
      'Transiciones cinematográficas',
      'Galería inmersiva 360°',
      'Música de fondo (opcional)'
    ],
    proFeatures: [
      'Experiencia inmersiva exclusiva',
      'Sin marca de agua',
      'Video backgrounds',
      'Animaciones 3D'
    ],
    config: {
      columnsDesktop: 2,
      columnsMobile: 2,
      gap: 'normal',
      cardStyle: 'flat',
      cardRadius: 'none',
      imageRatio: 'landscape',
      hoverEffect: 'tilt',
      clickAction: 'modal',
      hasSearch: false,
      hasFilters: false,
      hasCart: true,
      hasFavorites: true,
      hasShareButtons: true,
      hasZoom: true,
      entranceAnimation: 'scale',
      transitionSpeed: 'slow',
      showLogo: true,
      showWatermark: false
    },
    colorScheme: {
      primary: '#000000',
      secondary: '#d4af37',
      accent: '#fbbf24',
      background: '#0a0a0a',
      cardBackground: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a3a3a3',
      border: '#262626',
      gradient: {
        from: '#1e1e1e',
        to: '#0a0a0a',
        direction: 'to-b'
      }
    },
    popularity: 75,
    isNew: true,
    tags: ['premium', 'luxury', 'exclusivo', 'seasonal']
  }
];

// Helper para obtener templates por categoría
export const getTemplatesByCategory = (category: TemplateCategory) => {
  return EXPANDED_WEB_TEMPLATES.filter(t => t.category === category);
};

// Obtener templates básicos (1)
export const getBasicTemplates = () => getTemplatesByCategory('basic');

// Obtener templates estándar (8)
export const getStandardTemplates = () => getTemplatesByCategory('standard');

// Obtener templates seasonal (7)
export const getSeasonalTemplates = () => getTemplatesByCategory('seasonal');

// Obtener todos los templates por popularidad
export const getAllTemplatesByPopularity = () => {
  return [...EXPANDED_WEB_TEMPLATES].sort((a, b) => b.popularity - a.popularity);
};
