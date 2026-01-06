// ==========================================
// ENUMS & TYPES BÁSICOS
// ==========================================
export type PriceDisplay = "menudeo_only" | "mayoreo_only" | "both";
export type QuoteStatus = "pending" | "negotiation" | "accepted" | "rejected" | "shipped";
export type PriceType = "menudeo" | "mayoreo";
export type DeliveryMethod = "pickup" | "shipping";
export type FulfillmentStatus = "unfulfilled" | "processing" | "ready_for_pickup" | "shipped" | "delivered";

// ✅ NUEVO: Interfaz para la dirección estructurada
export interface ShippingAddressStructured {
  street?: string;
  colony?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  references?: string;
}

// ==========================================
// INTERFACES DE BASE DE DATOS (Entidades)
// ==========================================

export interface DigitalCatalog {
  id: string;
  user_id: string;
  name: string;
  slug: string;

  // ✅ CAMBIO: Identificador para Super Tiendas
  catalog_type?: "standard" | "super";

  description: string | null;
  template_id: string | null;
  web_template_id: string | null;
  background_pattern: string | null;
  logo_url?: string | null;
  brand_colors?: {
    primary: string;
    secondary: string;
  } | null;

  price_display: PriceDisplay;
  price_adjustment_menudeo: number;
  price_adjustment_mayoreo: number;

  show_sku: boolean;
  show_tags: boolean;
  show_description: boolean;
  show_stock: boolean;

  additional_info: string | null;

  is_private: boolean;
  access_password: string | null;

  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  enable_quotation: boolean;
  enable_variants: boolean;
  enable_distribution: boolean;
  enable_free_shipping: boolean;
  free_shipping_min_amount: number;

  min_order_quantity: number | null;
  min_order_amount: number | null;
  is_wholesale_only: boolean;

  tracking_head_scripts: string | null;
  tracking_body_scripts: string | null;
  tracking_config?: {
    pixelId?: string;
    accessToken?: string;
    meta_capi?: {
      enabled: boolean;
      pixel_id?: string;
      access_token?: string;
      test_code?: string;
    };
  } | null;

  products?: any[];

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

  order_number?: string | null;

  customer_name: string;
  customer_email: string;
  customer_company: string | null;
  customer_phone: string | null;
  notes: string | null;

  status: QuoteStatus;
  created_at: string;
  updated_at: string;

  delivery_method: DeliveryMethod;

  // ✅ CAMBIO CLAVE: Acepta string (viejo) O estructura (nuevo)
  shipping_address: string | ShippingAddressStructured | null;

  shipping_cost: number | null;
  total_amount: number;
  estimated_delivery_date?: string | null;

  fulfillment_status: FulfillmentStatus;
  tracking_code?: string | null;
  carrier_name?: string | null;

  items: QuoteItem[];
  catalog?: DigitalCatalog;

  replicated_catalogs?: string | null;
  tracking_token?: string | null;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  variant_id?: string | null;

  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  variant_description: string | null;
  quantity: number;
  unit_price: number;
  price_type: PriceType;
  subtotal: number;

  created_at: string;
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

// ==========================================
// DATA TRANSFER OBJECTS (DTOs)
// ==========================================

export interface CreateDigitalCatalogDTO {
  name: string;

  // ✅ CAMBIO: Campo opcional para crear Super Tiendas
  catalog_type?: "standard" | "super";

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
  enable_free_shipping?: boolean;
  free_shipping_min_amount?: number;
  tracking_head_scripts?: string | null;
  tracking_body_scripts?: string | null;
  tracking_config?: any;
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
  enable_free_shipping?: boolean;
  free_shipping_min_amount?: number;
  tracking_head_scripts?: string | null;
  tracking_body_scripts?: string | null;
  tracking_config?: any;
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

  // ✅ CAMBIO CLAVE AQUÍ TAMBIÉN
  shipping_address: string | ShippingAddressStructured | null;

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
    origin_replicated_catalog_id?: string | null;
  }[];
}

export interface CatalogLimitInfo {
  can_create: boolean;
  current_count: number;
  max_allowed: number;
  message: string;
  plan_name: string;
}

// ==========================================
// VISTAS PÚBLICAS Y REPLICACIÓN (Sin Cambios)
// ==========================================

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
  purchasedVariantIds?: string[];
  isReplicated?: boolean;
  replicatedCatalogId?: string;
  originalOwnerId?: string;
  resellerInfo?: {
    reseller_id: string;
  };
}

export interface ReplicatedCatalog {
  id: string;
  original_catalog_id: string;
  quote_id: string | null;
  reseller_id: string | null;
  distributor_id: string;
  reseller_email: string | null;
  custom_name?: string | null;
  custom_description?: string | null;
  custom_logo_url?: string | null;
  is_active: boolean;
  activation_token: string;
  activation_paid: boolean;
  activated_at: string | null;
  expires_at: string | null;
  product_limit: number | null;
  created_at: string;
  updated_at: string;
}

export interface DistributionNetwork {
  id: string;
  distributor_id: string;
  reseller_id: string | null;
  replicated_catalog_id: string;
  total_quotes_generated: number;
  total_quotes_accepted: number;
  conversion_rate: number;
  last_quote_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReplicatedCatalogDTO {
  original_catalog_id: string;
  quote_id: string;
  distributor_id: string;
}

export interface ActivateReplicatedCatalogDTO {
  token: string;
  reseller_id: string;
}

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

// ✅ TYPE HELPER EXPORTADO
export type QuoteWithMetadata = Quote & {
  items_count: number;
  total_amount: number;
  has_replicated_catalog: boolean;
  is_from_replicated: boolean;
  catalog_name?: string;
  payment_status?: string;
};
