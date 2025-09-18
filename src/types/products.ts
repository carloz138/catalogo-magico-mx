// src/types/products.ts
// ✅ TIPOS BASADOS EN TU ESTRUCTURA REAL DE SUPABASE

export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku?: string;
  description?: string;
  custom_description?: string;
  price_retail?: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  features?: string[];
  tags?: string[] | null; // ← CAMPO AGREGADO
  
  // ✅ CAMPOS DE IMÁGENES CORRECTOS
  original_image_url: string; // NO NULL en tu BD
  processed_image_url?: string;
  hd_image_url?: string;
  image_url?: string; // Imagen actual mostrada
  video_url?: string;
  social_media_urls?: any;
  
  // ✅ CAMPOS DE PROCESAMIENTO CORRECTOS
  processing_status?: string; // 'pending' | 'processing' | 'completed' | 'failed'
  processing_progress?: number; // 0-100
  error_message?: string;
  is_processed?: boolean;
  processed_at?: string;
  processed_images?: any; // jsonb
  processing_metadata?: any; // jsonb
  
  // ✅ CAMPOS DE IA
  ai_description?: string;
  ai_tags?: string[];
  ai_confidence_score?: number;
  smart_analysis?: any;
  
  // ✅ CAMPOS DE CRÉDITOS
  credits_used?: number;
  estimated_credits?: number;
  estimated_cost_mxn?: number;
  service_type?: string;
  
  // ✅ CAMPOS DE VARIANTES
  has_variants?: boolean;
  variant_count?: number;
  
  // ✅ CAMPOS DE SISTEMA
  created_at: string;
  updated_at: string;
  cleanup_scheduled_at?: string;
  cleanup_grace_period?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  user_id: string;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  stock_quantity?: number;
  variant_combination: any; // jsonb
  variant_images?: any; // jsonb
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VariantType {
  id: string;
  name: string;
  display_name: string;
  category?: string;
  input_type?: string;
  is_required?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VariantValue {
  id: string;
  variant_type_id: string;
  value: string;
  display_value?: string;
  hex_color?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

// ✅ TIPO PARA UI DE REVISIÓN DE IMÁGENES
export interface ProcessedImageForUI {
  id: string;
  product_id: string;
  original_url: string;
  processed_url: string | null;
  hd_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  product_name: string;
  product_description?: string;
  price_retail?: number;
  category?: string;
  credits_used?: number;
  service_type?: string;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

// ✅ FUNCIÓN HELPER: Convertir Product a ProcessedImageForUI
export const productToProcessedImage = (product: Product): ProcessedImageForUI => ({
  id: product.id,
  product_id: product.id,
  original_url: product.original_image_url,
  processed_url: product.processed_image_url || null,
  hd_url: product.hd_image_url || null,
  status: (product.processing_status as any) || 'pending',
  progress: product.processing_progress || 0,
  product_name: product.name,
  product_description: product.description,
  category: product.category,
  credits_used: product.credits_used,
  service_type: product.service_type,
  error_message: product.error_message,
  created_at: product.created_at,
  processed_at: product.processed_at
});

// ✅ FUNCIÓN HELPER: Determinar URL de imagen a mostrar
export const getDisplayImageUrl = (product: Product): string => {
  // Prioridad: processed_image_url > hd_image_url > image_url > original_image_url
  return product.processed_image_url || 
         product.hd_image_url || 
         product.image_url || 
         product.original_image_url;
};

// ✅ FUNCIÓN HELPER: Determinar estado de procesamiento
export const getProcessingStatus = (product: Product): 'pending' | 'processing' | 'completed' | 'failed' => {
  // Si hay error_message = failed
  if (product.error_message) return 'failed';
  
  // Si is_processed = true = completed
  if (product.is_processed) return 'completed';
  
  // Si processing_status está definido, usarlo
  if (product.processing_status) {
    return product.processing_status as any;
  }
  
  // Si processed_image_url existe = completed
  if (product.processed_image_url) return 'completed';
  
  // Si fue creado hace menos de 10 minutos = processing
  const createdAt = new Date(product.created_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  
  if (diffMinutes < 10) return 'processing';
  
  return 'pending';
};

// ✅ FUNCIÓN HELPER: Verificar si tiene comparación antes/después
export const hasBeforeAfterComparison = (product: Product): boolean => {
  return !!(product.original_image_url && 
           product.processed_image_url && 
           product.original_image_url !== product.processed_image_url);
};
