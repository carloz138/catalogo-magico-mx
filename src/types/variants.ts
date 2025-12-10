// ==========================================
// TIPOS TYPESCRIPT PARA SISTEMA DE VARIANTES
// src/types/variants.ts
// ==========================================

// Tipo de entrada para variantes (select, color_picker, number_input, text_input)
export type VariantInputType = 'select' | 'color_picker' | 'number_input' | 'text_input';

// Categorías de productos soportadas
export type ProductCategory = 'ropa' | 'calzado' | 'electronica' | 'joyeria' | 'fiestas' | 'floreria' | 'general';

// ==========================================
// INTERFACES PRINCIPALES
// ==========================================

// Tipo de variante (color, talla, material, etc.)
export interface VariantType {
  id: string;
  name: string;
  display_name: string;
  category: ProductCategory | null;
  input_type: VariantInputType;
  is_required: boolean;
  is_global: boolean; // ✅ NEW: Whether this type applies to all categories
  allow_custom_values: boolean; // ✅ NEW: Whether users can type custom values
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Valor específico de una variante (rojo, M, algodón, etc.)
export interface VariantValue {
  id: string;
  variant_type_id: string;
  value: string;
  display_value: string | null;
  hex_color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Combinación de variantes para un producto específico
export interface ProductVariant {
  id: string;
  product_id: string;
  user_id: string;
  variant_combination: Record<string, string>; // { "color": "rojo", "talla": "M" }
  sku: string | null;
  price_retail: number | null; // En centavos
  price_wholesale: number | null; // En centavos
  wholesale_min_qty: number | null;
  stock_quantity: number;
  variant_images: string[] | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// INTERFACES EXTENDIDAS PARA LA UI
// ==========================================

// Tipo de variante con sus valores incluidos
export interface VariantTypeWithValues extends VariantType {
  variant_values: VariantValue[];
}

// Producto con información de variantes
export interface ProductWithVariants {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  custom_description: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  category: ProductCategory | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  features: string[] | null;
  processing_status: string;
  has_variants: boolean;
  variant_count: number;
  created_at: string;
  variants: ProductVariant[];
}

// ==========================================
// INTERFACES PARA FORMULARIOS
// ==========================================

// Datos para crear una nueva variante
export interface CreateVariantData {
  product_id: string;
  variant_combination: Record<string, string>;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  stock_quantity?: number;
  variant_images?: string[];
  is_default?: boolean;
}

// Datos para actualizar una variante existente
export interface UpdateVariantData {
  variant_combination?: Record<string, string>;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  stock_quantity?: number;
  variant_images?: string[];
  is_default?: boolean;
  is_active?: boolean;
}

// ==========================================
// INTERFACES PARA EDICIÓN INLINE
// ==========================================

// Campos editables de productos
export type EditableProductField = 
  | 'name'
  | 'sku' 
  | 'description'
  | 'custom_description'
  | 'price_retail'
  | 'price_wholesale'
  | 'wholesale_min_qty'
  | 'category'
  | 'brand'
  | 'model'
  | 'color';

// Estado de celda en edición
export interface EditingCell {
  rowId: string;
  column: EditableProductField;
}

// Filtros para la tabla de productos
export interface ProductFilters {
  search: string;
  category: ProductCategory | '';
  status: string;
  has_variants?: boolean;
}

// ==========================================
// INTERFACES PARA RESPUESTAS DE API
// ==========================================

// Respuesta de la función get_variant_types_by_category
export interface VariantTypesResponse {
  id: string;
  name: string;
  display_name: string;
  input_type: VariantInputType;
  is_required: boolean;
  variant_values: VariantValue[];
}

// Respuesta para operaciones de actualización
export interface UpdateProductResponse {
  success: boolean;
  message?: string;
  data?: ProductWithVariants;
}

// ==========================================
// TIPOS PARA CONFIGURACIÓN DE CATEGORÍAS
// ==========================================

// Configuración de categoría con icono
export interface CategoryConfig {
  value: ProductCategory;
  label: string;
  icon: string;
  description?: string;
}

// Configuración de variantes por categoría
export interface CategoryVariantConfig {
  category: ProductCategory;
  required_variants: string[];
  optional_variants: string[];
  default_values?: Record<string, string>;
}

// ==========================================
// ENUMS Y CONSTANTES
// ==========================================

// Estados de procesamiento de productos
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  DRAFT = 'draft'
}

// Mapeo de categorías a sus variantes típicas
export const CATEGORY_VARIANT_MAPPING: Record<ProductCategory, string[]> = {
  ropa: ['color', 'talla_ropa', 'material'],
  calzado: ['color_calzado', 'talla_calzado', 'marca'],
  electronica: ['color_electronico', 'capacidad', 'version'],
  joyeria: ['material_joya', 'talla_anillo'],
  fiestas: ['color_fiesta', 'tamano'],
  floreria: ['tipo_flor', 'color_flor', 'tamano_arreglo'],
  general: ['general']
};

// Configuración de categorías con iconos
export const PRODUCT_CATEGORIES: CategoryConfig[] = [
  { value: 'ropa', label: 'Ropa', icon: '👕', description: 'Camisetas, pantalones, vestidos' },
  { value: 'calzado', label: 'Calzado', icon: '👟', description: 'Zapatos, tenis, botas' },
  { value: 'electronica', label: 'Electrónicos', icon: '📱', description: 'Celulares, tablets, laptops' },
  { value: 'joyeria', label: 'Joyería', icon: '💍', description: 'Anillos, collares, pulseras' },
  { value: 'fiestas', label: 'Fiestas', icon: '🎉', description: 'Decoración, globos, piñatas' },
  { value: 'floreria', label: 'Florería', icon: '🌺', description: 'Ramos, arreglos, plantas' },
  { value: 'general', label: 'General', icon: '📦', description: 'Otros productos' }
];

// ==========================================
// HELPERS Y UTILIDADES
// ==========================================

// Función helper para convertir centavos a pesos
export const centsToPrice = (cents: number | null): string => {
  if (!cents) return '';
  return (cents / 100).toFixed(2);
};

// Función helper para convertir pesos a centavos
export const priceToCents = (price: string | number): number => {
  if (!price) return 0;
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(priceNum * 100);
};

// Función helper para formatear array de features
export const formatFeatures = (features: string[] | null): string => {
  if (!features || !Array.isArray(features)) return '';
  return features.join(', ');
};

// Función helper para parsear features desde string
export const parseFeatures = (featuresStr: string): string[] => {
  if (!featuresStr) return [];
  return featuresStr.split(',').map(f => f.trim()).filter(f => f);
};

// Función helper para obtener configuración de categoría
export const getCategoryConfig = (category: ProductCategory): CategoryConfig | undefined => {
  return PRODUCT_CATEGORIES.find(c => c.value === category);
};

// Función helper para validar combinación de variantes
export const validateVariantCombination = (
  combination: Record<string, string>,
  requiredVariants: string[]
): boolean => {
  return requiredVariants.every(variant => 
    combination[variant] && combination[variant].trim() !== ''
  );
};

// ==========================================
// TIPOS PARA HOOKS Y CONTEXTOS
// ==========================================

// Estado del hook de variantes
export interface VariantsState {
  variantTypes: VariantTypeWithValues[];
  loading: boolean;
  error: string | null;
}

// Acciones del hook de variantes
export interface VariantsActions {
  fetchVariantTypes: (category: ProductCategory) => Promise<void>;
  createVariant: (data: CreateVariantData) => Promise<ProductVariant | null>;
  updateVariant: (id: string, data: UpdateVariantData) => Promise<boolean>;
  deleteVariant: (id: string) => Promise<boolean>;
}

// ==========================================
// EXPORT DEFAULT PARA CONVENIENCIA
// ==========================================

export default {
  ProcessingStatus,
  CATEGORY_VARIANT_MAPPING,
  PRODUCT_CATEGORIES,
  centsToPrice,
  priceToCents,
  formatFeatures,
  parseFeatures,
  getCategoryConfig,
  validateVariantCombination
};