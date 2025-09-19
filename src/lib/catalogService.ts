// src/lib/catalogService.ts
// MODIFICADO: Agregado tracking de catálogos

import { supabase } from '@/integrations/supabase/client';
import { getTemplateById, TemplateConfig } from '@/lib/templates';

const N8N_WEBHOOK_URL = 'https://min8n-tellezn8n.fqr2ax.easypanel.host/webhook/process-catalog';

export interface CatalogCreationRequest {
  catalog_id: string;
  user_id: string;
  user_plan: string;
  business_info: {
    business_name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  products: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    price_retail?: number;
    price_wholesale?: number;
    wholesale_min_qty?: number;
    original_image_url: string;
    processed_image_url?: string;
    optimized_image_data?: string;
    smart_analysis?: any;
    estimated_credits?: number;
    estimated_cost_mxn?: number;
  }>;
  template_style: string;
  template_config: TemplateConfig;
  estimated_total_credits: number;
  estimated_total_cost: number;
}

export interface ProcessedImage {
  product_id: string;
  product_name: string;
  original_url: string;
  processed_url: string;
  api_used: string;
  expires_at: string;
  credits_estimated: number;
  cost_mxn: number;
}

// NUEVO: Función para validar límites de catálogos antes de crear
const validateCatalogLimits = async (userId: string): Promise<{ 
  canGenerate: boolean; 
  reason?: string; 
  message?: string;
  catalogsUsed?: number;
  catalogsLimit?: number;
}> => {
  try {
    const { data, error } = await (supabase as any).rpc('can_generate_catalog', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error checking catalog limits:', error);
      return { canGenerate: false, reason: 'error', message: 'Error verificando límites' };
    }

    // Parse the JSON response if it's a string
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return {
      canGenerate: result.can_generate || false,
      reason: result.reason || 'unknown',
      message: result.message || 'Sin información',
      catalogsUsed: result.catalogs_used || 0,
      catalogsLimit: result.catalogs_limit || 0
    };

  } catch (error) {
    console.error('Exception checking catalog limits:', error);
    return { canGenerate: false, reason: 'error', message: 'Error verificando límites' };
  }
};

// NUEVO: Función para incrementar contador de catálogos
const incrementCatalogUsage = async (userId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data, error } = await (supabase as any).rpc('increment_catalog_usage', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error incrementing catalog usage:', error);
      return { success: false, message: 'Error actualizando contador' };
    }

    // Parse the JSON response if it's a string
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return {
      success: result.success || false,
      message: result.message || 'Actualizado'
    };

  } catch (error) {
    console.error('Exception incrementing catalog usage:', error);
    return { success: false, message: 'Error actualizando contador' };
  }
};

// FUNCIÓN PRINCIPAL MODIFICADA: createCatalog con tracking
export const createCatalog = async (
  selectedProducts: any[],
  businessInfo: any,
  templateStyle: string = 'minimalista-gris',
  catalogTitle?: string
): Promise<{ success: boolean; catalog_id?: string; error?: string }> => {
  try {
    console.log('Iniciando creación de catálogo');
    console.log('Template seleccionado:', templateStyle);
    console.log('Productos recibidos:', selectedProducts.length);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    if (!selectedProducts || selectedProducts.length === 0) {
      throw new Error('No hay productos seleccionados');
    }

    // NUEVO: 1. VALIDAR LÍMITES ANTES DE CREAR EL CATÁLOGO
    console.log('Validando límites de catálogos...');
    const limitValidation = await validateCatalogLimits(user.id);
    
    if (!limitValidation.canGenerate) {
      console.log('Límite de catálogos alcanzado:', limitValidation.message);
      return {
        success: false,
        error: limitValidation.message || 'Has alcanzado el límite de catálogos para este mes'
      };
    }

    console.log('Límites OK, continuando con la creación...');

    const template = getTemplateById(templateStyle);
    if (!template) {
      throw new Error(`Template '${templateStyle}' no encontrado`);
    }
    
    console.log('Template config:', template);

    let userPlan = 'basic';
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('plan_type')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && userData?.plan_type) {
        userPlan = userData.plan_type;
      }
    } catch (error) {
      console.log('Plan type not available, using basic as default');
    }

    console.log('Preparando inserción en tabla catalogs...');
    
    const catalogData = {
      user_id: user.id,
      name: catalogTitle || `Catálogo ${template.displayName} - ${new Date().toLocaleDateString()}`,
      product_ids: selectedProducts.map(p => p.id),
      template_style: templateStyle,
      brand_colors: {
        primary: businessInfo?.primary_color || template.colors.primary,
        secondary: businessInfo?.secondary_color || template.colors.secondary
      },
      logo_url: businessInfo?.logo_url || null,
      show_retail_prices: true,
      show_wholesale_prices: false,
      total_products: selectedProducts.length,
      credits_used: 0
    };
    
    console.log('Datos a insertar:', catalogData);

    const { data: catalog, error: catalogError } = await supabase
      .from('catalogs')
      .insert(catalogData)
      .select()
      .single();

    if (catalogError) {
      console.error('DETALLES COMPLETOS DEL ERROR:', catalogError);
      throw new Error(`Error en base de datos: ${catalogError.message}`);
    }

    console.log('Catálogo creado en BD:', catalog.id);

    const webhookPayload: CatalogCreationRequest = {
      catalog_id: catalog.id,
      user_id: user.id,
      user_plan: userPlan,
      business_info: {
        business_name: businessInfo?.business_name || 'Mi Empresa',
        logo_url: businessInfo?.logo_url,
        primary_color: businessInfo?.primary_color || template.colors.primary,
        secondary_color: businessInfo?.secondary_color || template.colors.secondary,
        phone: businessInfo?.phone,
        email: businessInfo?.email,
        address: businessInfo?.address
      },
      products: selectedProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.custom_description || product.description || `Descripción de ${product.name}`,
        category: product.category || 'General',
        price_retail: product.price_retail || 0,
        price_wholesale: product.price_wholesale || 0,
        wholesale_min_qty: product.wholesale_min_qty,
        original_image_url: product.original_image_url,
        processed_image_url: product.processed_image_url || product.image_url,
        optimized_image_data: product.optimized_image_data,
        smart_analysis: product.smart_analysis ? 
          (typeof product.smart_analysis === 'string' ? JSON.parse(product.smart_analysis) : product.smart_analysis) 
          : null,
        estimated_credits: product.estimated_credits || 1,
        estimated_cost_mxn: product.estimated_cost_mxn || 0.20
      })),
      template_style: templateStyle,
      template_config: template,
      estimated_total_credits: selectedProducts.reduce((sum, p) => sum + (p.estimated_credits || 1), 0),
      estimated_total_cost: selectedProducts.reduce((sum, p) => sum + (p.estimated_cost_mxn || 0.20), 0)
    };

    console.log('Enviando payload a n8n:', {
      catalog_id: webhookPayload.catalog_id,
      template: templateStyle,
      products_count: webhookPayload.products.length
    });

    let webhookResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        webhookResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        if (webhookResponse.ok) break;
        
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`Intento ${attempts} falló, reintentando...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        console.log(`Error en intento ${attempts}, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    if (!webhookResponse || !webhookResponse.ok) {
      console.error(`Webhook failed after ${maxAttempts} attempts: ${webhookResponse?.status}`);
      
      // NUEVO: Si el webhook falla, el catálogo ya se creó en BD, por lo que NO incrementamos contador
      return {
        success: false,
        error: `Webhook failed after ${maxAttempts} attempts: ${webhookResponse?.status}`
      };
    }

    const result = await webhookResponse.json();
    console.log('n8n webhook response:', result);

    // NUEVO: 2. INCREMENTAR CONTADOR SOLO SI EL WEBHOOK FUE EXITOSO
    console.log('Incrementando contador de catálogos...');
    const usageResult = await incrementCatalogUsage(user.id);
    
    if (!usageResult.success) {
      console.warn('Error actualizando contador de catálogos:', usageResult.message);
      // No fallar la operación completa por esto, solo advertir
    } else {
      console.log('Contador de catálogos actualizado exitosamente');
    }

    console.log('Catálogo enviado a n8n para procesamiento');

    return {
      success: true,
      catalog_id: catalog.id
    };

  } catch (error) {
    console.error('Error creating catalog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al crear catálogo'
    };
  }
};

// FUNCIÓN CORREGIDA: processImagesOnly con PARSING MEJORADO (sin cambios de tracking ya que no cuenta como catálogo)
export const processImagesOnly = async (
  selectedProducts: any[],
  businessInfo: any
): Promise<{ success: boolean; processed_images?: ProcessedImage[]; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    let userPlan = 'basic';
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('plan_type')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && userData?.plan_type) {
        userPlan = userData.plan_type;
      }
    } catch (error) {
      console.log('Plan type not available, using basic as default');
    }

    const processOnlyPayload = {
      action: "process_only",
      user_id: user.id,
      user_plan: userPlan,
      business_info: {
        business_name: businessInfo?.business_name || 'Mi Empresa',
        logo_url: businessInfo?.logo_url,
        primary_color: businessInfo?.primary_color || '#3B82F6',
        secondary_color: businessInfo?.secondary_color || '#1F2937',
        phone: businessInfo?.phone,
        email: businessInfo?.email,
        address: businessInfo?.address
      },
      products: selectedProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        original_image_url: product.original_image_url,
        smart_analysis: product.smart_analysis ? 
          (typeof product.smart_analysis === 'string' ? JSON.parse(product.smart_analysis) : product.smart_analysis) 
          : null,
        estimated_credits: product.estimated_credits || 1,
        estimated_cost_mxn: product.estimated_cost_mxn || 0.20
      })),
      template_style: 'professional',
      estimated_total_credits: selectedProducts.reduce((sum, p) => sum + (p.estimated_credits || 1), 0),
      estimated_total_cost: selectedProducts.reduce((sum, p) => sum + (p.estimated_cost_mxn || 0.20), 0)
    };

    console.log('Sending PROCESS_ONLY to n8n webhook:', processOnlyPayload);

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processOnlyPayload)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`);
    }

    const result = await webhookResponse.json();
    console.log('n8n webhook response RAW:', result);

    // PARSING MEJORADO: Manejar diferentes formatos de respuesta
    let webhookData;
    let processed_images: ProcessedImage[] = [];

    // Caso 1: Respuesta es array (como tu ejemplo)
    if (Array.isArray(result)) {
      console.log('Webhook response is array, using first element');
      webhookData = result[0];
    } else {
      console.log('Webhook response is object');
      webhookData = result;
    }

    console.log('Webhook data to parse:', webhookData);

    // VERIFICAR SI HAY DATOS EN debug_info.apiResponse
    if (webhookData.debug_info?.apiResponse) {
      console.log('Found debug_info.apiResponse, checking for processed images...');
      const apiResponse = webhookData.debug_info.apiResponse;
      
      // EXTRAER IMÁGENES PROCESADAS DEL API RESPONSE
      if (apiResponse.products && Array.isArray(apiResponse.products)) {
        console.log(`Found ${apiResponse.products.length} products in apiResponse`);
        
        processed_images = apiResponse.products
          .filter((product: any) => product.processing_result?.success === true)
          .map((product: any) => ({
            product_id: product.id,
            product_name: product.name,
            original_url: product.original_image_url,
            processed_url: product.processing_result.processedImageUrl || product.processing_result.result_url,
            api_used: product.processing_result.usedApi || 'pixelcut',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
            credits_estimated: product.estimated_credits || 1,
            cost_mxn: product.processing_result.actualCostMXN || product.estimated_cost_mxn || 0.20
          }));
        
        console.log(`Extracted ${processed_images.length} processed images:`, processed_images);
      }
    }

    // VERIFICAR SI REALMENTE HAY IMÁGENES PROCESADAS
    if (processed_images.length > 0) {
      console.log('SUCCESS: Found processed images, updating database...');
      
      // ACTUALIZAR BASE DE DATOS CON IMÁGENES PROCESADAS
      for (const img of processed_images) {
        try {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              processed_image_url: img.processed_url,
              processing_status: 'completed',
              is_processed: true,
              processed_at: new Date().toISOString(),
              credits_used: img.credits_estimated,
              service_type: img.api_used
            })
            .eq('id', img.product_id);

          if (updateError) {
            console.warn(`Error updating product ${img.product_id}:`, updateError);
          } else {
            console.log(`Updated product ${img.product_id} with processed image`);
          }
        } catch (updateError) {
          console.warn(`Exception updating product ${img.product_id}:`, updateError);
        }
      }

      return {
        success: true,
        processed_images: processed_images
      };
    } else {
      // NO HAY IMÁGENES PROCESADAS
      console.warn('No processed images found in webhook response');
      console.log('Full webhook data for debugging:', JSON.stringify(webhookData, null, 2));
      
      return {
        success: false,
        error: 'No se encontraron imágenes procesadas en la respuesta del webhook'
      };
    }

  } catch (error) {
    console.error('Error processing images only:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// MANTENER OTRAS FUNCIONES IGUAL
export const generateTemplatePreview = async (
  products: any[],
  templateId: string,
  businessInfo: any
): Promise<{ success: boolean; preview_html?: string; error?: string }> => {
  try {
    const template = getTemplateById(templateId);
    if (!template) throw new Error('Template no encontrado');

    const previewProducts = products.slice(0, template.productsPerPage);
    
    const previewHtml = `
      <div class="template-body-${templateId}" style="min-height: 800px; padding: 40px;">
        <div class="catalog">
          <div class="header" style="margin-bottom: 40px;">
            <h1 style="font-size: 32px; margin-bottom: 10px;">
              ${businessInfo?.business_name || 'Mi Catálogo'}
            </h1>
            <p style="font-size: 16px; opacity: 0.8;">
              ${previewProducts.length} productos seleccionados
            </p>
          </div>
          
          <div class="products-grid" style="
            display: grid; 
            grid-template-columns: repeat(${template.layout === 'list' ? '1' : 'auto-fit, minmax(300px, 1fr)'}, 1fr);
            gap: 30px;
          ">
            ${previewProducts.map(product => `
              <div class="product" style="
                padding: 20px;
                border-radius: 8px;
                text-align: center;
              ">
                <div class="product-img" style="
                  width: ${template.imageSize.width / 2}px;
                  height: ${template.imageSize.height / 2}px;
                  margin: 0 auto 15px;
                  border-radius: 8px;
                  overflow: hidden;
                  background: #f5f5f5;
                ">
                  <img 
                    src="${product.image_url || product.original_image_url}" 
                    alt="${product.name}"
                    style="width: 100%; height: 100%; object-fit: cover;"
                  />
                </div>
                <h2 class="product-title" style="font-size: 18px; margin-bottom: 8px;">
                  ${product.name}
                </h2>
                <div class="product-price" style="font-size: 20px; font-weight: bold;">
                  $${((product.price_retail || 0) / 100).toFixed(2)} MXN
                </div>
                <p class="product-desc" style="font-size: 14px; margin-top: 10px; opacity: 0.8;">
                  ${product.description || product.custom_description || `Descripción de ${product.name}`}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    return {
      success: true,
      preview_html: previewHtml
    };

  } catch (error) {
    console.error('Error generating template preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generando preview'
    };
  }
};

export const getCatalogStats = (products: any[], template: TemplateConfig) => {
  const totalProducts = products.length;
  const totalPages = Math.ceil(totalProducts / template.productsPerPage);
  const totalCredits = products.reduce((sum, p) => sum + (p.estimated_credits || 1), 0);
  const totalCost = products.reduce((sum, p) => sum + (p.estimated_cost_mxn || 0.20), 0);
  
  return {
    totalProducts,
    totalPages,
    totalCredits,
    totalCost,
    averageCreditsPerProduct: totalCredits / totalProducts,
    templateOptimization: {
      imageSize: template.imageSize,
      productsPerPage: template.productsPerPage,
      layout: template.layout,
      category: template.category
    }
  };
};
