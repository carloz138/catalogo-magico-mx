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
      primary: '#2563eb',
      secondary: '#475569',
      accent: '#059669',
      background: '#f8fafc',
      cardBackground: '#ffffff',
      text: '#0f172a',
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
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      background: '#ffffff',
      cardBackground: '#fafafa',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e5e7eb'
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
      primary: '#0f172a',
      secondary: '#475569',
      accent: '#06b6d4',
      background: '#f8fafc',
      cardBackground: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0'
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
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
      background: '#fff7ed',
      cardBackground: '#ffffff',
      text: '#1c1917',
      textMuted: '#78716c',
      border: '#fed7aa'
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
      primary: '#0284c7',
      secondary: '#0ea5e9',
      accent: '#06b6d4',
      background: '#f0f9ff',
      cardBackground: '#ffffff',
      text: '#0c4a6e',
      textMuted: '#64748b',
      border: '#bae6fd'
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
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#c084fc',
      background: '#faf5ff',
      cardBackground: '#ffffff',
      text: '#1e1b4b',
      textMuted: '#6b7280',
      border: '#e9d5ff'
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
      primary: '#db2777',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#fdf2f8',
      cardBackground: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280',
      border: '#fbcfe8',
      gradient: {
        from: '#ec4899',
        to: '#f472b6',
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
      primary: '#78716c',
      secondary: '#a8a29e',
      accent: '#d6d3d1',
      background: '#fafaf9',
      cardBackground: '#ffffff',
      text: '#1c1917',
      textMuted: '#57534e',
      border: '#e7e5e4'
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
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#f87171',
      background: '#fef2f2',
      cardBackground: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280',
      border: '#fecaca',
      gradient: {
        from: '#fee2e2',
        to: '#fecaca',
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
      primary: '#f8fafc',
      secondary: '#94a3b8',
      accent: '#fbbf24',
      background: '#0f172a',
      cardBackground: 'rgba(248, 250, 252, 0.05)',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: 'rgba(248, 250, 252, 0.1)',
      gradient: {
        from: '#1e293b',
        to: '#0f172a',
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
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#fde047',
      background: '#0f172a',
      cardBackground: 'rgba(251, 191, 36, 0.05)',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: 'rgba(251, 191, 36, 0.2)',
      gradient: {
        from: '#1e293b',
        to: '#0f172a',
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
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#93c5fd',
      background: '#f8fafc',
      cardBackground: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0'
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
      primary: '#0f172a',
      secondary: '#dc2626',
      accent: '#fbbf24',
      background: '#ffffff',
      cardBackground: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0'
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
      primary: '#0ea5e9',
      secondary: '#6366f1',
      accent: '#ec4899',
      background: '#f8fafc',
      cardBackground: 'rgba(255, 255, 255, 0.8)',
      text: '#0f172a',
      textMuted: '#64748b',
      border: 'rgba(15, 23, 42, 0.1)',
      gradient: {
        from: '#f8fafc',
        to: '#f1f5f9',
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
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#fbbf24',
      background: '#0f172a',
      cardBackground: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#334155'
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
      primary: '#0f172a',
      secondary: '#fbbf24',
      accent: '#f59e0b',
      background: '#000000',
      cardBackground: '#0f172a',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#1e293b',
      gradient: {
        from: '#0f172a',
        to: '#000000',
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
