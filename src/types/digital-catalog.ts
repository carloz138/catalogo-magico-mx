// Tipos para el sistema de catálogos digitales

export type PriceDisplay = "menudeo_only" | "mayoreo_only" | "both";
export type QuoteStatus = "pending" | "accepted" | "rejected";
export type PriceType = "menudeo" | "mayoreo";

export interface DigitalCatalog {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  template_id: string | null;
  web_template_id: string | null;
  // Configuración de precios
  price_display: PriceDisplay;
  price_adjustment_menudeo: number;
  price_adjustment_mayoreo: number;

  // Configuración de visibilidad
  show_sku: boolean;
  show_tags: boolean;
  show_description: boolean;

  // Diseño
  background_pattern: string | null;
  
  // Información adicional
  additional_info: string | null;

  // Privacidad
  is_private: boolean;
  access_password: string | null;

  // Control
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  enable_quotation: boolean;

  created_at: string;
  updated_at: string;
}

export interface CatalogProduct {
  id: string;
  catalog_id: string;
  product_id: string;
  sort_order: number;
  created_at: string;
}

export interface Quote {
  id: string;
  catalog_id: string;
  user_id: string;

  // Datos del cliente
  customer_name: string;
  customer_email: string;
  customer_company: string | null;
  customer_phone: string | null;
  notes: string | null;

  status: QuoteStatus;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;

  // Snapshot
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  price_type: PriceType;
  subtotal: number;

  created_at: string;
}

export interface CatalogView {
  id: string;
  catalog_id: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  viewed_at: string;
}

// DTOs para crear/actualizar
export interface CreateDigitalCatalogDTO {
  name: string;
  description?: string;
  template_id?: string;
  web_template_id?: string;
  price_display: PriceDisplay;
  price_adjustment_menudeo: number;
  price_adjustment_mayoreo: number;
  show_sku: boolean;
  show_tags: boolean;
  show_description: boolean;
  background_pattern?: string | null;
  additional_info?: string;
  is_private: boolean;
  access_password?: string;
  expires_at?: string;
  product_ids: string[];
  enable_quotation?: boolean;
}

export interface UpdateDigitalCatalogDTO {
  name?: string;
  description?: string;
  template_id?: string;
  web_template_id?: string;
  price_display?: PriceDisplay;
  price_adjustment_menudeo?: number;
  price_adjustment_mayoreo?: number;
  show_sku?: boolean;
  show_tags?: boolean;
  show_description?: boolean;
  background_pattern?: string | null;
  additional_info?: string;
  is_private?: boolean;
  access_password?: string;
  expires_at?: string;
  is_active?: boolean;
  product_ids?: string[];
  enable_quotation?: boolean;
}

export interface CreateQuoteDTO {
  catalog_id: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  customer_phone?: string;
  notes?: string;
  items: {
    product_id: string;
    product_name: string;
    product_sku: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    price_type: PriceType;
  }[];
}

export interface CatalogLimitInfo {
  can_create: boolean;
  current_count: number;
  max_allowed: number;
  message: string;
  plan_name: string;
}

// Tipo extendido para vista pública (incluye productos)
export interface PublicCatalogView extends DigitalCatalog {
  products: Array<{
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    price_retail: number;
    price_wholesale: number | null;
    wholesale_min_qty: number | null;
    image_url: string;
    tags: string[] | null;
    category: string | null;
  }>;
  business_info: {
    business_name: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  };
}
