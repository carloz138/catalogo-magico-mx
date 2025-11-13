// lib/web-catalog/types.ts

export type WebCatalogLayout =
  | "modern-grid"
  | "masonry"
  | "horizontal-scroll"
  | "magazine"
  | "minimal-list"
  | "showcase"
  | "carousel";

export type WebCatalogStyle = "modern" | "elegant" | "minimal" | "bold" | "luxury" | "playful";

// 👇 LISTA CORREGIDA Y COMPLETADA
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
  | "hogar" // Nuevo
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
  | "salud" // Nuevo
  | "deportes" // Nuevo
  | "gaming" // Nuevo
  | "autos" // Nuevo
  | "propiedades" // Nuevo
  | "general"
  | "marca"
  | "corporativo"
  | "retail"
  | "impacto"
  | "app"
  | "tech"
  | "servicios"
  | "entretenimiento";

export type TemplateCategory = "basic" | "standard" | "seasonal";

export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
}

export interface WebTemplateConfig {
  columnsDesktop: 2 | 3 | 4 | 5;
  columnsMobile: 1 | 2 | 3;
  gap: "tight" | "normal" | "loose";
  cardStyle: "flat" | "elevated" | "outlined" | "glass" | "neumorphic" | "soft";
  cardRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  imageRatio: "square" | "portrait" | "landscape" | "auto";
  hoverEffect: "none" | "lift" | "zoom" | "glow" | "tilt" | "bounce" | "scale";
  clickAction: "modal" | "expand" | "sidebar" | "navigate";
  hasSearch: boolean;
  hasFilters: boolean;
  hasCart: boolean;
  hasFavorites: boolean;
  hasShareButtons: boolean;
  hasZoom: boolean;
  entranceAnimation: "none" | "fade" | "slide" | "scale" | "stagger";
  transitionSpeed: "fast" | "normal" | "slow";
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
  thumbnail: string;
  previewImages: string[];
  demoUrl?: string;
  layout: WebCatalogLayout;
  style: WebCatalogStyle;
  category: TemplateCategory;
  isPremium: boolean;
  seasonalInfo?: {
    season: "spring" | "summer" | "fall" | "winter" | "christmas" | "valentine" | "custom";
    year?: number;
    validUntil?: string;
  };
  bestFor: IndustryMatch[];
  idealProductCount: {
    min: number;
    max?: number;
  };
  features: string[];
  proFeatures?: string[];
  config: WebTemplateConfig;
  colorScheme: WebTemplateColors;
  popularity: number;
  isNew?: boolean;
  tags: string[];
}

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
