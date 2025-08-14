
// Types for Product Variants System

export interface VariantType {
  id: string;
  name: string;
  display_name: string;
  category?: string;
  input_type: 'select' | 'color' | 'text' | 'number';
  is_required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VariantValue {
  id: string;
  variant_type_id: string;
  value: string;
  display_value?: string;
  hex_color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VariantTypeWithValues extends VariantType {
  variant_values: VariantValue[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  user_id: string;
  variant_combination: Record<string, string>;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  stock_quantity: number;
  variant_images?: {
    [key: string]: string;
  };
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariantCombination {
  [variantTypeName: string]: string;
}

export interface CreateVariantRequest {
  product_id: string;
  variant_combination: VariantCombination;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  stock_quantity?: number;
  is_default?: boolean;
}

export interface UpdateVariantRequest {
  id: string;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  stock_quantity?: number;
  variant_images?: Record<string, string>;
  is_default?: boolean;
  is_active?: boolean;
}

export interface VariantFormData {
  combination: VariantCombination;
  sku: string;
  price_retail: string;
  price_wholesale: string;
  stock_quantity: string;
  is_default: boolean;
}

export interface CategoryVariantConfig {
  category: string;
  required_variants: string[];
  optional_variants: string[];
}

// Utility types for variant management
export interface VariantStats {
  total_variants: number;
  active_variants: number;
  out_of_stock: number;
  default_variant?: ProductVariant;
}

export interface VariantFilter {
  category?: string;
  is_active?: boolean;
  has_stock?: boolean;
  variant_type?: string;
}

export interface VariantSort {
  field: 'created_at' | 'updated_at' | 'price_retail' | 'stock_quantity' | 'sku';
  direction: 'asc' | 'desc';
}

// Form validation types
export interface VariantValidationError {
  field: string;
  message: string;
}

export interface VariantFormValidation {
  isValid: boolean;
  errors: VariantValidationError[];
}

// Bulk operations
export interface BulkVariantUpdate {
  variant_ids: string[];
  updates: Partial<UpdateVariantRequest>;
}

export interface BulkVariantResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    variant_id: string;
    error: string;
  }>;
}
