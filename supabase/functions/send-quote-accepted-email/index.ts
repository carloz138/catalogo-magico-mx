import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote_id } = await req.json();
    if (!quote_id) {
      throw new Error("Se requiere el ID de la cotización (quote_id).");
    }

    // 1. Inicializar Clientes (Admin)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // 2. Obtener la cotización para saber el email del cliente (L2)
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        id, 
        customer_email, 
        customer_name, 
        catalog_id,
        digital_catalogs ( enable_distribution )
      `)
      .eq("id", quote_id)
      .single();

    if (quoteError) throw new Error("Cotización no encontrada.");
    if (!quote.customer_email) throw new Error("La cotización no tiene un email de cliente.");

    const canReplicate = quote.digital_catalogs?.enable_distribution;
    let activationLink = "";
    let replicationId = "";

    if (canReplicate) {
      // 3. Buscar el catálogo replicado (que ya debería existir)
      const { data: replication, error: repError } = await supabase
        .from("replicated_catalogs")
        .select("id, original_catalog_id, distributor_id")
        .eq("quote_id", quote_id)
        .single();

      if (repError || !replication) {
        throw new Error("Esta cotización no tiene un registro de replicación asociado.");
      }
      
      replicationId = replication.id;

      // 4. Generar y guardar el token de activación
      const token = crypto.randomUUID();
      // 👇 CORRECCIÓN CRÍTICA: Usar /track/TOKEN en lugar de /activate?token=
      activationLink = `${Deno.env.get("SITE_URL")}/track/${token}`; 
      
      const { error: updateError } = await supabase
        .from("replicated_catalogs")
        .update({
          activation_token: token,
          reseller_email: quote.customer_email,
        })
        .eq("id", replication.id);

      if (updateError) throw new Error("Error al generar el token de activación.");

    } 
    
    // 5. Obtener info del L1 (Fabricante) y del Catálogo para el email
    const { data: distributor } = await supabase
        .from("business_info")
        .select("business_name")
        .eq("user_id", (quote as any).digital_catalogs.user_id) 
        .single();
        
    const distributorName = distributor?.business_name || "Tu Proveedor";
    const catalogName = (quote as any).digital_catalogs.name || "Catálogo de Productos";

    // 6. Enviar el Email (con o sin link de activación)
    const { data, error: emailError } = await resend.emails.send({
      from: `CatifyPro <noreply@catifypro.com>`,
      to: quote.customer_email,
      subject: `¡Tu cotización de ${distributorName} fue aceptada!`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>¡Felicidades, ${quote.customer_name || 'cliente'}!</h2>
          <p>Tu cotización para el catálogo "<strong>${catalogName}</strong>" de <strong>${distributorName}</strong> ha sido aceptada.</p>
          
          ${canReplicate ? `
            <p>Como siguiente paso, <strong>${distributorName}</strong> te invita a convertirte en su revendedor oficial. Hemos preparado un catálogo digital con estos productos, listo para que le pongas tu propia marca y precios.</p>
            <p>Haz clic en el botón de abajo para activar tu cuenta de revendedor y empezar a vender hoy mismo:</p>
            <a href="${activationLink}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Activar mi Catálogo Ahora
            </a>
          ` : `
            <p>Ponte en contacto con <strong>${distributorName}</strong> para coordinar el pago y la entrega.</p>
          `}

          <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
            Si no solicitaste esto, puedes ignorar este correo.
          </p>
        </div>
      `
    });

    if (emailError) {
      throw new Error(`Error al enviar el email: ${emailError.message}`);
    }

    // 7. Actualizar la cotización a 'accepted'
    await supabase
        .from("quotes")
        .update({ status: 'accepted' })
        .eq("id", quote_id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de aceptación enviado.",
      replication_enabled: canReplicate,
      replication_id: canReplicate ? replicationId : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error en send-quote-accepted-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
