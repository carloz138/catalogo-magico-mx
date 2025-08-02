
import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = 'https://min8n-tellezn8n.fqr2ax.easypanel.host/webhook-test/process-catalog';

export interface CatalogCreationRequest {
  catalog_id: string;
  user_id: string;
  user_plan: string; // NUEVO: plan del usuario
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
    smart_analysis?: any; // NUEVO
    estimated_credits?: number; // NUEVO
    estimated_cost_mxn?: number; // NUEVO
  }>;
  template_style: string;
  // NUEVO: totales estimados
  estimated_total_credits: number;
  estimated_total_cost: number;
}

export const createCatalog = async (
  selectedProducts: any[],
  businessInfo: any,
  templateStyle: string = 'minimalista'
): Promise<{ success: boolean; catalog_id?: string; error?: string }> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // NUEVO: Obtener plan del usuario
    const { data: userData } = await supabase
      .from('users')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    const userPlan = userData?.plan_type || 'basic';

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
        credits_used: 0 // Will be updated by webhook if needed
      })
      .select()
      .single();

    if (catalogError) throw catalogError;

    // MODIFICAR webhookPayload para incluir análisis
    const webhookPayload: CatalogCreationRequest = {
      catalog_id: catalog.id,
      user_id: user.id,
      user_plan: userPlan, // NUEVO: plan del usuario
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
        smart_analysis: product.smart_analysis ? JSON.parse(product.smart_analysis) : null, // NUEVO
        estimated_credits: product.estimated_credits || 1, // NUEVO
        estimated_cost_mxn: product.estimated_cost_mxn || 0.20 // NUEVO
      })),
      template_style: templateStyle,
      // NUEVO: totales estimados
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
