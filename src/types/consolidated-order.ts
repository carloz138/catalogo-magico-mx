// Types para Pedidos Consolidados

export type ConsolidatedOrderStatus = "draft" | "sent" | "accepted" | "rejected";

export interface ConsolidatedOrder {
  id: string;
  distributor_id: string;
  supplier_id: string;
  original_catalog_id: string;
  replicated_catalog_id: string;
  status: ConsolidatedOrderStatus;
  quote_id: string | null;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
}

export interface ConsolidatedOrderItem {
  id: string;
  consolidated_order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_description: string | null;
  product_image_url: string | null;
  quantity: number;
  unit_price: number; // en centavos
  subtotal: number; // en centavos
  source_quote_ids: string[]; // Array de quote IDs
  created_at: string;
  updated_at: string;
}

// Tipo extendido con información adicional
export interface ConsolidatedOrderWithDetails extends ConsolidatedOrder {
  items: ConsolidatedOrderItem[];
  items_count: number;
  total_amount: number; // en centavos
  supplier_name: string;
  supplier_business_name: string | null;
  catalog_name: string;
  source_quotes_count: number; // Cuántas cotizaciones originaron este consolidado
}

// Para crear/actualizar items
export interface ConsolidatedOrderItemInput {
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  product_sku?: string | null;
  variant_description?: string | null;
  product_image_url?: string | null;
  quantity: number;
  unit_price: number; // en centavos
  source_quote_ids?: string[];
}

// Para el proceso de agrupación de productos desde cotizaciones
export interface ProductAggregation {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_description: string | null;
  product_image_url: string | null;
  total_quantity: number;
  unit_price: number; // Precio del catálogo original (mayoreo)
  source_quote_ids: string[];
}

// DTO para enviar el pedido consolidado
export interface SendConsolidatedOrderDTO {
  consolidated_order_id: string;
  notes?: string;
}

// Response de creación de borrador
export interface CreateDraftResponse {
  consolidated_order: ConsolidatedOrder;
  is_new: boolean; // true si se creó, false si ya existía
  items: ConsolidatedOrderItem[];
}

export interface CreateConsolidatedOrderResponse {
  success: boolean;
  consolidated_order_id: string;
  quote_id: string;
  total_amount: number;
}
