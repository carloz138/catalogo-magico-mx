// ==========================================
// FUNCION: generate-catalog-feed (FIX L2 PRICES)
// ESTADO: PROD_V2 (Sincronizado con lógica Frontend)
// ==========================================
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8';

const DEPLOY_VERSION = Deno.env.get("FUNCTION_HASH") || "FIX_L2_PRICES_V2";
const BASE_DOMAIN = "https://catifypro.com"; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const escapeXml = (unsafe: string | null | undefined) => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

Deno.serve(async (req) => {
  console.log(JSON.stringify({
    event: "FUNC_START",
    function: "generate-catalog-feed",
    version: DEPLOY_VERSION,
    timestamp: new Date().toISOString()
  }));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const catalogId = url.searchParams.get('catalog_id');

    if (!catalogId) throw new Error('catalog_id es requerido en la URL');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 1. IDENTIFICAR CATÁLOGO
    let catalogInfo: any = null;
    let isL2 = false;
    let targetProductSourceId = catalogId; 
    let resellerId: string | null = null;

    // A. Buscar en L1
    const { data: l1Data } = await supabaseAdmin
      .from('digital_catalogs')
      .select('id, name, description, slug')
      .eq('id', catalogId)
      .maybeSingle();

    if (l1Data) {
      catalogInfo = l1Data;
    } else {
      // B. Buscar en L2
      const { data: l2Data } = await supabaseAdmin
        .from('replicated_catalogs')
        .select(`
          id, 
          slug, 
          original_catalog_id,
          reseller_id,
          digital_catalogs ( name, description )
        `)
        .eq('id', catalogId)
        .maybeSingle();

      if (l2Data) {
        isL2 = true;
        catalogInfo = {
          id: l2Data.id, // ID de la Réplica
          name: l2Data.digital_catalogs?.name || "Catálogo",
          description: l2Data.digital_catalogs?.description || "",
          slug: l2Data.slug
        };
        targetProductSourceId = l2Data.original_catalog_id; // Productos del padre
        resellerId = l2Data.reseller_id;
        console.log("🔄 L2 Detectado. ID Réplica:", l2Data.id);
      }
    }

    if (!catalogInfo) throw new Error('Catálogo no encontrado');

    // 2. OBTENER PRODUCTOS BASE
    const { data: productsData, error: prodError } = await supabaseAdmin
      .from('catalog_products')
      .select(`
        product_id,
        products!catalog_products_product_id_fkey (
          id, name, description, sku, 
          price_retail, 
          image_url, original_image_url
        )
      `)
      .eq('catalog_id', targetProductSourceId);

    if (prodError) throw prodError;

    let finalProducts = productsData?.map((p: any) => p.products).filter(Boolean) || [];

    // 3. SOBRESCRIBIR PRECIOS (CORREGIDO PARA USAR LA COLUMNA CORRECTA)
    if (isL2) {
      console.log("🔎 Buscando precios para Réplica ID:", catalogId);
      
      const { data: overrides } = await supabaseAdmin
        .from('reseller_product_prices')
        .select('product_id, custom_price_retail')
        // AQUÍ ESTABA EL ERROR: Usamos replicated_catalog_id en lugar de catalog_id
        .eq('replicated_catalog_id', catalogId); 

      if (overrides && overrides.length > 0) {
        const priceMap = new Map(overrides.map((o: any) => [o.product_id, o.custom_price_retail]));
        
        finalProducts = finalProducts.map((prod: any) => {
          const customPrice = priceMap.get(prod.id);
          // Solo sobrescribimos si existe un precio personalizado
          if (customPrice !== undefined && customPrice !== null) {
             return { ...prod, price_retail: customPrice };
          }
          return prod;
        });
        console.log(`✅ ${overrides.length} precios actualizados correctamente.`);
      } else {
        console.log("⚠️ No se encontraron precios personalizados para esta réplica.");
      }
    }

    // 4. GENERAR XML
    let xmlItems = '';

    for (const product of finalProducts) {
      const priceValue = (product.price_retail / 100).toFixed(2);
      const imageUrl = product.image_url || product.original_image_url;
      const productLink = `${BASE_DOMAIN}/c/${catalogInfo.slug}?product_highlight=${product.id}`;

      if (imageUrl && product.name) {
        xmlItems += `
    <item>
      <g:id>${escapeXml(product.sku || product.id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(product.description || product.name)}</g:description>
      <g:link>${escapeXml(productLink)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>CatifyPro</g:brand>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${priceValue} MXN</g:price>
    </item>`;
      }
    }

    const xmlFeed = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(catalogInfo.name)}</title>
    <link>${BASE_DOMAIN}/c/${catalogInfo.slug}</link>
    <description>${escapeXml(catalogInfo.description)}</description>
${xmlItems}
  </channel>
</rss>`;

    return new Response(xmlFeed, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache' // Forzamos no-cache para ver cambios rápido
      },
      status: 200
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
