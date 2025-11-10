// Tipos para el sistema de catálogos digitales

export type PriceDisplay = "menudeo_only" | "mayoreo_only" | "both";
export type QuoteStatus = "pending" | "accepted" | "rejected" | "shipped";
export type PriceType = "menudeo" | "mayoreo";
export type DeliveryMethod = "pickup" | "shipping";

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
  show_stock: boolean;

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
  enable_variants: boolean;
  enable_distribution: boolean;

  // Tracking
  tracking_head_scripts: string | null;
  tracking_body_scripts: string | null;

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

  delivery_method: DeliveryMethod;
  shipping_address: string | null;
  shipping_cost: number | null;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  variant_id?: string | null;

  // Snapshot
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  variant_description: string | null;
  quantity: number;
  unit_price: number;
  price_type: PriceType;
  subtotal: number;

  created_at: string;
  
  // ✅ Indica si el producto/variante está en stock para L2
  is_in_stock?: boolean;
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
  show_stock: boolean;
  background_pattern?: string | null;
  additional_info?: string;
  is_private: boolean;
  access_password?: string;
  expires_at?: string;
  product_ids: string[];
  enable_quotation?: boolean;
  enable_variants?: boolean;
  enable_distribution?: boolean;
  tracking_head_scripts?: string | null;
  tracking_body_scripts?: string | null;
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
  show_stock?: boolean;
  background_pattern?: string | null;
  additional_info?: string;
  is_private?: boolean;
  access_password?: string;
  expires_at?: string;
  is_active?: boolean;
  product_ids?: string[];
  enable_quotation?: boolean;
  enable_variants?: boolean;
  enable_distribution?: boolean;
  tracking_head_scripts?: string | null;
  tracking_body_scripts?: string | null;
}

export interface CreateQuoteDTO {
  catalog_id: string;
  user_id: string | null;
  replicated_catalog_id?: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  customer_phone?: string;
  notes?: string;

  delivery_method: DeliveryMethod;
  shipping_address: string | null;

  items: {
    product_id: string;
    product_name: string;
    product_sku: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    price_type: PriceType;
    variant_id?: string | null;
    variant_description?: string | null;
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
    has_variants?: boolean;
    variants?: Array<{
      id: string;
      variant_combination: Record<string, string>;
      sku: string | null;
      price_retail: number;
      price_wholesale: number | null;
      stock_quantity: number;
      is_default: boolean;
    }>;
  }>;
  business_info: {
    business_name: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
  };
  enable_variants: boolean;
  purchasedProductIds?: string[];
  purchasedVariantIds?: string[]; // ✅ NUEVO: IDs de variantes compradas
  isReplicated?: boolean;
  replicatedCatalogId?: string;
  originalOwnerId?: string;
  resellerInfo?: {
    reseller_id: string;
  };
}

// ============================================
// TIPOS PARA SISTEMA DE REPLICACIÓN
// ============================================

export interface ReplicatedCatalog {
  id: string;
  original_catalog_id: string;
  quote_id: string | null;
  reseller_id: string | null;
  distributor_id: string;
  reseller_email: string | null;

  // Estado
  is_active: boolean;
  activation_token: string;
  activation_paid: boolean;
  activated_at: string | null;
  expires_at: string | null;

  // Límites
  product_limit: number | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DistributionNetwork {
  id: string;
  distributor_id: string;
  reseller_id: string | null;
  replicated_catalog_id: string;

  // Estadísticas
  total_quotes_generated: number;
  total_quotes_accepted: number;
  conversion_rate: number;
  last_quote_at: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

// DTOs para replicación
export interface CreateReplicatedCatalogDTO {
  original_catalog_id: string;
  quote_id: string;
  distributor_id: string;
}

export interface ActivateReplicatedCatalogDTO {
  token: string;
  reseller_id: string;
}

// Respuesta de get_catalog_by_token
export interface CatalogByTokenResponse {
  catalog_id: string;
  original_catalog_id: string;
  distributor_id: string;
  distributor_name: string | null;
  distributor_company: string | null;
  is_active: boolean;
  product_limit: number | null;
  expires_at: string | null;
  product_count: number;
  catalog_name: string;
  catalog_description: string | null;
  reseller_email?: string | null;
}

// Vista extendida para red de distribución
export interface NetworkResellerView {
  network_id: string;
  reseller_id: string | null;
  reseller_email: string | null;
  reseller_name: string | null;
  reseller_company: string | null;
  catalog_id: string;
  catalog_name: string;
  is_active: boolean;
  total_quotes: number;
  conversion_rate: number;
  created_at: string;
  activated_at: string | null;
}

// Estadísticas de red
export interface NetworkStats {
  total_catalogs_created: number;
  active_resellers: number;
  pending_activations: number;
  total_quotes_generated: number;
  total_revenue: number;
  conversion_rate: number;
  top_product: {
    name: string;
    sales: number;
  } | null;
  top_reseller: {
    name: string;
    quotes: number;
  } | null;
}

// Tipos para activación híbrida con Magic Link
export interface ActivateWithEmailDTO {
  token: string;
  email: string;
  name?: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
  magic_link?: string;
}

export interface ResellerDashboardData {
  catalog: {
    id: string;
    slug: string;
    name: string;
    product_count: number;
    public_url: string;
  };
  original_quote: {
    id: string;
    status: string;
    total_amount: number;
    items_count: number;
    created_at: string;
  } | null;
  received_quotes: Array<{
    id: string;
    customer_name: string;
    customer_email: string;
    status: string;
    total_amount: number;
    created_at: string;
  }>;
  stats: {
    total_quotes: number;
    pending_quotes: number;
    accepted_quotes: number;
  };
}
