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
    original_image_url: string;
    processed_image_url?: string; // ✅ NUEVA: URL de imagen procesada
    optimized_image_data?: string; // ✅ NUEVA: Imagen optimizada en base64
    smart_analysis?: any;
    estimated_credits?: number;
    estimated_cost_mxn?: number;
  }>;
  template_style: string;
  template_config: TemplateConfig; // ✅ NUEVA: Configuración completa del template
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

// ✅ NUEVA FUNCIÓN: Redimensionar imagen para template específico
const optimizeImageForTemplate = async (
  imageUrl: string, 
  template: TemplateConfig
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // ✅ Usar el tamaño específico del template
      const targetWidth = template.imageSize.width;
      const targetHeight = template.imageSize.height;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // ✅ Calcular aspect ratio para centrar la imagen
      const imgAspectRatio = img.width / img.height;
      const canvasAspectRatio = targetWidth / targetHeight;
      
      let renderWidth, renderHeight, offsetX, offsetY;
      
      if (imgAspectRatio > canvasAspectRatio) {
        // Imagen más ancha - ajustar por altura
        renderHeight = targetHeight;
        renderWidth = renderHeight * imgAspectRatio;
        offsetX = (targetWidth - renderWidth) / 2;
        offsetY = 0;
      } else {
        // Imagen más alta - ajustar por ancho
        renderWidth = targetWidth;
        renderHeight = renderWidth / imgAspectRatio;
        offsetX = 0;
        offsetY = (targetHeight - renderHeight) / 2;
      }
      
      // ✅ Fondo del template si la imagen no llena todo el espacio
      ctx.fillStyle = template.colors.background;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // ✅ Dibujar imagen centrada y escalada
      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
      
      // ✅ Convertir a PNG para preservar transparencia
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    };

    img.onerror = () => reject(new Error('Failed to load image for optimization'));
    
    // ✅ Configurar CORS para imágenes de Supabase
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
};

// ✅ NUEVA FUNCIÓN: Validar que las imágenes sean válidas
const validateImageUrls = async (products: any[]): Promise<string[]> => {
  const invalidUrls: string[] = [];
  
  for (const product of products) {
    const imageUrl = product.image_url || product.original_image_url;
    if (!imageUrl) {
      invalidUrls.push(`Producto ${product.name}: Sin URL de imagen`);
      continue;
    }
    
    try {
      // ✅ Test de validez de URL
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        invalidUrls.push(`Producto ${product.name}: Imagen no accesible (${response.status})`);
      }
    } catch (error) {
      invalidUrls.push(`Producto ${product.name}: Error al validar imagen`);
    }
  }
  
  return invalidUrls;
};

// ✅ FUNCIÓN PRINCIPAL MEJORADA: createCatalog
export const createCatalog = async (
  selectedProducts: any[],
  businessInfo: any,
  templateStyle: string = 'minimalista-gris'
): Promise<{ success: boolean; catalog_id?: string; error?: string }> => {
  try {
    console.log('🎨 Iniciando creación de catálogo');
    console.log('🎨 Template seleccionado:', templateStyle);
    console.log('🎨 Productos recibidos:', selectedProducts.length);
    
    // ✅ VALIDACIÓN 1: Usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // ✅ VALIDACIÓN 2: Productos válidos
    if (!selectedProducts || selectedProducts.length === 0) {
      throw new Error('No hay productos seleccionados');
    }

    // ✅ VALIDACIÓN 3: Template existe
    const template = getTemplateById(templateStyle);
    if (!template) {
      throw new Error(`Template '${templateStyle}' no encontrado`);
    }
    
    console.log('✅ Template config:', template);

    // ✅ VALIDACIÓN 4: URLs de imágenes válidas
    console.log('🔍 Validando URLs de imágenes...');
    const invalidUrls = await validateImageUrls(selectedProducts);
    if (invalidUrls.length > 0) {
      console.warn('⚠️ Imágenes inválidas:', invalidUrls);
      // Continuar pero logear advertencia
    }

    // ✅ OPTIMIZACIÓN: Redimensionar imágenes para el template
    console.log('🖼️ Optimizando imágenes para template...');
    const optimizedProducts = await Promise.all(
      selectedProducts.map(async (product) => {
        const imageUrl = product.image_url || product.original_image_url;
        
        try {
          // ✅ Optimizar imagen específicamente para este template
          const optimizedImageData = await optimizeImageForTemplate(imageUrl, template);
          
          return {
            ...product,
            processed_image_url: product.image_url, // ✅ URL original para referencia
            optimized_image_data: optimizedImageData, // ✅ Imagen optimizada
            template_optimized: true
          };
        } catch (error) {
          console.warn(`⚠️ No se pudo optimizar imagen para ${product.name}:`, error);
          return {
            ...product,
            processed_image_url: imageUrl,
            template_optimized: false
          };
        }
      })
    );

    // ✅ OBTENER PLAN DEL USUARIO
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

    // ✅ CREAR REGISTRO EN BD PRIMERO
    console.log('💾 Creando registro en base de datos...');
    const { data: catalog, error: catalogError } = await supabase
      .from('catalogs')
      .insert({
        user_id: user.id,
        name: `Catálogo ${template.displayName} - ${new Date().toLocaleDateString()}`,
        product_ids: selectedProducts.map(p => p.id),
        template_style: templateStyle,
        brand_colors: {
          primary: businessInfo?.primary_color || template.colors.primary,
          secondary: businessInfo?.secondary_color || template.colors.secondary
        },
        logo_url: businessInfo?.logo_url,
        show_retail_prices: true,
        show_wholesale_prices: false,
        total_products: selectedProducts.length,
        credits_used: 0,
        status: 'processing' // ✅ Estado inicial
      })
      .select()
      .single();

    if (catalogError) {
      console.error('❌ Error creating catalog record:', catalogError);
      throw new Error('No se pudo crear el registro del catálogo');
    }

    console.log('✅ Catálogo creado en BD:', catalog.id);

    // ✅ PAYLOAD MEJORADO PARA N8N
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
      products: optimizedProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.custom_description || product.description || `Descripción de ${product.name}`,
        category: product.category || 'General',
        price_retail: product.price_retail || 0,
        price_wholesale: product.price_wholesale || 0,
        original_image_url: product.original_image_url,
        processed_image_url: product.processed_image_url || product.image_url, // ✅ URL procesada
        optimized_image_data: product.optimized_image_data, // ✅ Imagen optimizada en base64
        smart_analysis: product.smart_analysis ? 
          (typeof product.smart_analysis === 'string' ? JSON.parse(product.smart_analysis) : product.smart_analysis) 
          : null,
        estimated_credits: product.estimated_credits || 1,
        estimated_cost_mxn: product.estimated_cost_mxn || 0.20
      })),
      template_style: templateStyle,
      template_config: template, // ✅ NUEVO: Configuración completa del template
      estimated_total_credits: selectedProducts.reduce((sum, p) => sum + (p.estimated_credits || 1), 0),
      estimated_total_cost: selectedProducts.reduce((sum, p) => sum + (p.estimated_cost_mxn || 0.20), 0)
    };

    console.log('🚀 Enviando payload optimizado a n8n:', {
      catalog_id: webhookPayload.catalog_id,
      template: templateStyle,
      products_count: webhookPayload.products.length,
      template_config: template,
      optimized_images: optimizedProducts.filter(p => p.template_optimized).length
    });

    // ✅ ENVIAR A N8N CON RETRY LOGIC
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
          console.log(`⚠️ Intento ${attempts} falló, reintentando...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        console.log(`⚠️ Error en intento ${attempts}, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    if (!webhookResponse || !webhookResponse.ok) {
      // ✅ Actualizar estado del catálogo a error
      await supabase
        .from('catalogs')
        .update({ status: 'error' })
        .eq('id', catalog.id);
        
      throw new Error(`Webhook failed after ${maxAttempts} attempts: ${webhookResponse?.status}`);
    }

    const result = await webhookResponse.json();
    console.log('✅ n8n webhook response:', result);

    // ✅ Actualizar estado del catálogo a processing
    await supabase
      .from('catalogs')
      .update({ 
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', catalog.id);

    return {
      success: true,
      catalog_id: catalog.id
    };

  } catch (error) {
    console.error('❌ Error creating catalog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al crear catálogo'
    };
  }
};

// ✅ FUNCIÓN ORIGINAL: SOLO PROCESAR IMÁGENES (mantener igual)
export const processImagesOnly = async (
  selectedProducts: any[],
  businessInfo: any
): Promise<{ success: boolean; processed_images?: ProcessedImage[]; error?: string }> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener plan del usuario
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

    // ✅ PAYLOAD ESPECÍFICO PARA PROCESS_ONLY
    const processOnlyPayload = {
      action: "process_only", // ✅ FLAG CRÍTICO
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
      // DATOS MÍNIMOS PARA WORKFLOW
      template_style: 'professional',
      estimated_total_credits: selectedProducts.reduce((sum, p) => sum + (p.estimated_credits || 1), 0),
      estimated_total_cost: selectedProducts.reduce((sum, p) => sum + (p.estimated_cost_mxn || 0.20), 0)
    };

    console.log('🚀 Sending PROCESS_ONLY to n8n webhook:', processOnlyPayload);

    // Send to n8n webhook
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
    console.log('✅ n8n webhook response:', result);

    // VERIFICAR FORMATO DE RESPUESTA
    if (result[0]?.processed_images && result[0]?.workflow_mode === 'process_only') {
      return {
        success: true,
        processed_images: result[0].processed_images
      };
    } else if (result.processed_images && result.workflow_mode === 'process_only') {
      return {
        success: true,
        processed_images: result.processed_images
      };
    } else {
      console.log('⚠️ Workflow returned unexpected format:', result);
      return {
        success: false,
        error: 'El workflow no retornó el formato esperado para process_only'
      };
    }

  } catch (error) {
    console.error('❌ Error processing images only:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// ✅ NUEVA FUNCIÓN: Preview de template con productos reales
export const generateTemplatePreview = async (
  products: any[],
  templateId: string,
  businessInfo: any
): Promise<{ success: boolean; preview_html?: string; error?: string }> => {
  try {
    const template = getTemplateById(templateId);
    if (!template) throw new Error('Template no encontrado');

    // ✅ Tomar solo los productos que caben en una página
    const previewProducts = products.slice(0, template.productsPerPage);
    
    // ✅ Generar HTML del preview con productos reales
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
    console.error('❌ Error generating template preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generando preview'
    };
  }
};

// ✅ NUEVA FUNCIÓN: Obtener estadísticas del catálogo
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