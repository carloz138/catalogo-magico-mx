// lib/web-catalog/types.ts

export type WebCatalogLayout =
  | "modern-grid" // Grid moderno con cards
  | "masonry" // Pinterest style
  | "horizontal-scroll" // Scroll horizontal
  | "magazine" // Editorial style
  | "minimal-list" // Lista simple
  | "showcase" // Fullscreen showcase
  | "carousel"; // Slider principal

export type WebCatalogStyle = "modern" | "elegant" | "minimal" | "bold" | "luxury" | "playful";

// Lista expandida de industrias
export type IndustryMatch =
  | "joyeria"
  | "moda"
  | "electronica"
  | "tecnologia"
  | "ferreteria"
  | "floreria"
  | "cosmeticos"
  | "skincare"
  | "decoracion"
  | "muebles"
  | "alimentos"
  | "postres"
  | "artesania"
  | "niños"
  | "juguetes"
  | "mascotas"
  | "regalos"
  | "eventos"
  | "licores"
  | "arte"
  | "fotografia"
  | "lenceria"
  | "calzado"
  | "accesorios"
  | "oficina"
  | "arquitectura"
  | "vip"
  | "gala"
  | "relojes"
  | "navidad"
  | "fiestas"
  | "general"
  | "marca"
  | "corporativo"
  | "retail"
  | "impacto"
  | "app"
  | "tech"
  | "servicios"
  | "entretenimiento";

// Categoría de template
export type TemplateCategory =
  | "basic" // Template básico gratuito
  | "standard" // Templates estándar
  | "seasonal"; // Templates de temporada/especiales (Premium)

export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
}

export interface WebTemplateConfig {
  // Layout
  columnsDesktop: 2 | 3 | 4 | 5;
  columnsMobile: 1 | 2 | 3; // Agregado 3 para Instagram style
  gap: "tight" | "normal" | "loose";

  // Card appearance
  // 'glass' y 'soft' son nuevos para los templates premium
  cardStyle: "flat" | "elevated" | "outlined" | "glass" | "neumorphic" | "soft";

  // '2xl', '3xl' y 'full' son nuevos para estilos muy redondos
  cardRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

  imageRatio: "square" | "portrait" | "landscape" | "auto";

  // Interactions
  hoverEffect: "none" | "lift" | "zoom" | "glow" | "tilt" | "bounce" | "scale";

  clickAction: "modal" | "expand" | "sidebar" | "navigate";

  // Features
  hasSearch: boolean;
  hasFilters: boolean;
  hasCart: boolean;
  hasFavorites: boolean;
  hasShareButtons: boolean;
  hasZoom: boolean;

  // Animations
  entranceAnimation: "none" | "fade" | "slide" | "scale" | "stagger";
  transitionSpeed: "fast" | "normal" | "slow";

  // Branding
  showLogo: boolean;
  showWatermark: boolean;
  customFonts?: string[]; // Para importar fuentes de Google Fonts
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
  previewImages: string[];
  demoUrl?: string;

  // Clasificación
  layout: WebCatalogLayout;
  style: WebCatalogStyle;

  // Categoría del template
  category: TemplateCategory;

  isPremium: boolean;

  // Para templates de temporada
  seasonalInfo?: {
    season: "spring" | "summer" | "fall" | "winter" | "christmas" | "valentine" | "custom";
    year?: number;
    validUntil?: string;
  };

  // Recomendaciones
  bestFor: IndustryMatch[];
  idealProductCount: {
    min: number;
    max?: number;
  };

  // Features destacados
  features: string[];
  proFeatures?: string[];

  // Configuración
  config: WebTemplateConfig;
  colorScheme: WebTemplateColors;

  // Meta
  popularity: number;
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
  price_menudeo?: number;
  price_mayoreo?: number;
  image_url?: string;
  additional_images?: string[];
  is_featured?: boolean;
  sort_order?: number;
  badge?: string;
}

// Configuración completa del catálogo web
export interface WebCatalogConfig {
  name: string;
  description?: string;
  template_id: string;
  products: WebCatalogProduct[];
  price_display: "menudeo_only" | "mayoreo_only" | "both" | "hidden";
  price_adjustment_menudeo: number;
  price_adjustment_mayoreo: number;
  show_sku: boolean;
  show_tags: boolean;
  show_description: boolean;
  show_category: boolean;
  enable_quotation: boolean;
  quotation_button_text?: string;
  business_name?: string;
  business_logo?: string;
  business_contact?: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
  custom_colors?: Partial<WebTemplateColors>;
  use_brand_colors?: boolean;
  brand_colors?: BrandColors;
  background_pattern?: string | null;
}

export interface WebCatalogPreviewData {
  template: WebCatalogTemplate;
  config: WebCatalogConfig;
  mode: "desktop" | "tablet" | "mobile";
}
