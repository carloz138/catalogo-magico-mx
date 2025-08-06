import { supabase } from '@/integrations/supabase/client';

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
    smart_analysis?: any;
    estimated_credits?: number;
    estimated_cost_mxn?: number;
  }>;
  template_style: string;
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

// ✅ NUEVA FUNCIÓN: SOLO PROCESAR IMÁGENES
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

// ✅ FUNCIÓN ORIGINAL: CREAR CATÁLOGO COMPLETO (mantener igual)
export const createCatalog = async (
  selectedProducts: any[],
  businessInfo: any,
  templateStyle: string = 'minimalista'
): Promise<{ success: boolean; catalog_id?: string; error?: string }> => {
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

    // Create catalog record in database first
    const { data: catalog, error: catalogError } = await supabase
      .from('catalogs')
      .insert({
        user_id: user.id,
        name: `Catálogo ${new Date().toLocaleDateString()}`,
        product_ids: selectedProducts.map(p => p.id),
        template_style: templateStyle,
        brand_colors: {
          primary: businessInfo?.primary_color || '#3B82F6',
          secondary: businessInfo?.secondary_color || '#1F2937'
        },
        logo_url: businessInfo?.logo_url,
        show_retail_prices: true,
        show_wholesale_prices: false,
        total_products: selectedProducts.length,
        credits_used: 0
      })
      .select()
      .single();

    if (catalogError) throw catalogError;

    // Webhook payload NORMAL (sin action)
    const webhookPayload: CatalogCreationRequest = {
      catalog_id: catalog.id,
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
        description: product.custom_description || product.description,
        category: product.category,
        price_retail: product.price_retail,
        price_wholesale: product.price_wholesale,
        original_image_url: product.original_image_url,
        smart_analysis: product.smart_analysis ? JSON.parse(product.smart_analysis) : null,
        estimated_credits: product.estimated_credits || 1,
        estimated_cost_mxn: product.estimated_cost_mxn || 0.20
      })),
      template_style: templateStyle,
      estimated_total_credits: selectedProducts.reduce((sum, p) => sum + (p.estimated_credits || 1), 0),
      estimated_total_cost: selectedProducts.reduce((sum, p) => sum + (p.estimated_cost_mxn || 0.20), 0)
    };

    console.log('🚀 Sending to n8n webhook:', webhookPayload);

    // Send to n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`);
    }

    const result = await webhookResponse.json();
    console.log('✅ n8n webhook response:', result);

    return {
      success: true,
      catalog_id: catalog.id
    };

  } catch (error) {
    console.error('❌ Error creating catalog:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
