// lib/web-catalog/types.ts
// Sistema completamente separado para catálogos digitales web

export type WebCatalogLayout =
  | "modern-grid" // Grid moderno con cards
  | "masonry" // Pinterest style
  | "horizontal-scroll" // Scroll horizontal
  | "magazine" // Editorial style
  | "minimal-list" // Lista simple
  | "showcase" // Fullscreen showcase
  | "carousel"; // Slider principal

export type WebCatalogStyle = "modern" | "elegant" | "minimal" | "bold" | "luxury" | "playful"; // Este ya estaba, es correcto

// 👇 AQUÍ ESTABA EL PRINCIPAL ERROR: Faltaban muchas industrias
export type IndustryMatch =
  | "joyeria"
  | "moda"
  | "electronica"
  | "tecnologia" // Nuevo
  | "ferreteria"
  | "floreria"
  | "cosmeticos"
  | "skincare" // Nuevo
  | "decoracion"
  | "muebles"
  | "alimentos"
  | "postres" // Nuevo
  | "artesania" // Nuevo
  | "niños" // Nuevo
  | "juguetes" // Nuevo
  | "mascotas" // Nuevo
  | "regalos" // Nuevo
  | "eventos" // Nuevo
  | "licores" // Nuevo
  | "arte" // Nuevo
  | "fotografia" // Nuevo
  | "lenceria" // Nuevo
  | "calzado" // Nuevo
  | "accesorios" // Nuevo
  | "oficina" // Nuevo
  | "arquitectura" // Nuevo
  | "vip" // Nuevo
  | "gala" // Nuevo
  | "relojes" // Nuevo
  | "navidad" // Nuevo
  | "fiestas" // Nuevo
  | "general";

// Categoría de template
export type TemplateCategory =
  | "basic" // Template básico gratuito
  | "standard" // Templates estándar (incluidos en Básico IA)
  | "seasonal"; // Templates de temporada/especiales (solo Profesional+)

export interface WebTemplateConfig {
  // Layout
  columnsDesktop: 2 | 3 | 4 | 5;
  columnsMobile: 1 | 2;
  gap: "tight" | "normal" | "loose";

  // Card appearance
  // 👇 ACTUALIZADO: Agregado 'soft'
  cardStyle: "flat" | "elevated" | "outlined" | "glass" | "neumorphic" | "soft";

  // 👇 ACTUALIZADO: Agregados '2xl' y 'full'
  cardRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  imageRatio: "square" | "portrait" | "landscape" | "auto";

  // Interactions
  // 👇 ACTUALIZADO: Agregados 'bounce' y 'scale'
  hoverEffect: "none" | "lift" | "zoom" | "glow" | "tilt" | "bounce" | "scale";

  clickAction: "modal" | "expand" | "sidebar" | "navigate";

  // Features
  hasSearch: boolean;
  hasFilters: boolean;
  hasCart: boolean; // Para cotización
  hasFavorites: boolean;
  hasShareButtons: boolean;
  hasZoom: boolean;

  // Animations
  entranceAnimation: "none" | "fade" | "slide" | "scale" | "stagger";
  transitionSpeed: "fast" | "normal" | "slow";

  // Branding
  showLogo: boolean;
  showWatermark: boolean;
  customFonts?: string[];
}

export interface WebTemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBackground: string;
  text: string;
  textMuted: string;
  border: string;
  // Para gradientes y efectos
  gradient?: {
    from: string;
    to: string;
    direction: "to-r" | "to-br" | "to-b";
  };
}

export interface WebCatalogTemplate {
  id: string;
  name: string;
  description: string;
  longDescription?: string;

  // Visual
  thumbnail: string;
  previewImages: string[]; // Múltiples screenshots
  demoUrl?: string; // Link a demo en vivo

  // Clasificación
  layout: WebCatalogLayout;
  style: WebCatalogStyle;

  // Categoría del template
  category: TemplateCategory;

  // isPremium ahora se calcula desde category
  isPremium: boolean;

  // Para templates de temporada
  seasonalInfo?: {
    season: "spring" | "summer" | "fall" | "winter" | "christmas" | "valentine" | "custom";
    year?: number;
    validUntil?: string; // ISO date
  };

  // Recomendaciones
  bestFor: IndustryMatch[];
  idealProductCount: {
    min: number;
    max?: number;
  };

  // Features destacados
  features: string[];
  proFeatures?: string[]; // Features solo en premium

  // Configuración
  config: WebTemplateConfig;
  colorScheme: WebTemplateColors;

  // Meta
  popularity: number; // Para ordenar por más usado
  isNew?: boolean;
  tags: string[];
}

// Configuración del producto en el catálogo
export interface WebCatalogProduct {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  tags?: string[];

  // Precios
  price_menudeo?: number;
  price_mayoreo?: number;

  // Imágenes
  image_url?: string;
  additional_images?: string[];

  // Metadata para el catálogo
  is_featured?: boolean;
  sort_order?: number;
  badge?: string; // "NUEVO", "OFERTA", etc.
}

// Configuración completa del catálogo web
export interface WebCatalogConfig {
  // Info básica
  name: string;
  description?: string;

  // Template
  template_id: string;

  // Productos
  products: WebCatalogProduct[];

  // Precios
  price_display: "menudeo_only" | "mayoreo_only" | "both" | "hidden";
  price_adjustment_menudeo: number;
  price_adjustment_mayoreo: number;

  // Visibilidad
  show_sku: boolean;
  show_tags: boolean;
  show_description: boolean;
  show_category: boolean;

  // Cotización
  enable_quotation: boolean;
  quotation_button_text?: string;

  // Branding
  business_name?: string;
  business_logo?: string;
  business_contact?: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };

  // Personalización de colores (override del template)
  custom_colors?: Partial<WebTemplateColors>;

  // Patrón de fondo
  background_pattern?: string | null;
}

// Para el preview en tiempo real
export interface WebCatalogPreviewData {
  template: WebCatalogTemplate;
  config: WebCatalogConfig;
  mode: "desktop" | "tablet" | "mobile";
}
