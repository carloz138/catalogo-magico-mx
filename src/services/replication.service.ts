import { supabase } from "@/integrations/supabase/client";
import type {
  CreateReplicatedCatalogDTO,
  ActivateReplicatedCatalogDTO,
  ReplicatedCatalog,
  CatalogByTokenResponse,
  NetworkResellerView,
  NetworkStats,
  ActivateWithEmailDTO,
  MagicLinkResponse,
  ResellerDashboardData,
} from "@/types/digital-catalog";

// Define the expected return type from the Edge Function
interface ActivationResponse {
  success: boolean;
  message: string;
  userExisted: boolean;
  requiresConfirmation: boolean;
}

export class ReplicationService {
  /**
   * Crear catálogo replicado cuando se acepta una cotización
   */
  static async createReplica(data: CreateReplicatedCatalogDTO): Promise<ReplicatedCatalog> {
    const { data: catalogId, error } = await supabase.rpc("create_replicated_catalog", {
      p_original_catalog_id: data.original_catalog_id,
      p_quote_id: data.quote_id,
      p_distributor_id: data.distributor_id,
    });

    if (error) {
      console.error("Error creating replicated catalog:", error);
      throw new Error(`Error al crear catálogo replicado: ${error.message}`);
    }

    // Obtener el catálogo recién creado
    const { data: catalog, error: fetchError } = await supabase
      .from("replicated_catalogs")
      .select("*")
      .eq("id", catalogId)
      .single();

    if (fetchError) {
      console.error("Error fetching created catalog:", fetchError);
      throw new Error(`Error al obtener catálogo creado: ${fetchError.message}`);
    }

    return catalog;
  }

  /**
   * Obtener información de catálogo por token (para página de activación)
   */
  static async getCatalogByToken(token: string): Promise<CatalogByTokenResponse> {
    console.log("🔍 Getting catalog by token:", token);

    const { data, error } = await supabase.rpc("get_catalog_by_token", {
      p_token: token,
    });

    console.log("📦 Response data:", data);
    console.log("❌ Response error:", error);
    console.log("📊 Data type:", typeof data);
    console.log("📏 Data length:", Array.isArray(data) ? data.length : "not array");

    if (error) {
      console.error("Error getting catalog by token:", error);
      throw new Error(`Error al obtener catálogo: ${error.message}`);
    }

    if (!data) {
      throw new Error("Catálogo no encontrado - data es null/undefined");
    }

    // Si data es un array
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error("Catálogo no encontrado - array vacío");
      }
      console.log("✅ Returning data[0]:", data[0]);
      return data[0];
    }

    // Si data es un objeto directo
    console.log("✅ Returning data directly:", data);
    return data as CatalogByTokenResponse;
  }

  /**
   * Activar catálogo tras pago de $29 MXN
   */
  static async activateCatalog(data: ActivateReplicatedCatalogDTO): Promise<boolean> {
    const { data: result, error } = await supabase.rpc("activate_replicated_catalog", {
      p_token: data.token,
      p_reseller_id: data.reseller_id,
    });

    if (error) {
      console.error("Error activating catalog:", error);
      throw new Error(`Error al activar catálogo: ${error.message}`);
    }

    return result;
  }

  /**
   * Obtener red de distribución de un usuario (Nivel 2)
   */
  static async getDistributionNetwork(distributorId: string): Promise<NetworkResellerView[]> {
    const { data, error } = await supabase.rpc("get_distribution_network", {
      p_distributor_id: distributorId,
    });

    if (error) {
      console.error("Error getting distribution network:", error);
      throw new Error(`Error al obtener red de distribución: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener estadísticas de red para dashboard
   */
  static async getNetworkStats(distributorId: string): Promise<NetworkStats> {
    // Obtener la red completa
    const network = await this.getDistributionNetwork(distributorId);

    // Calcular estadísticas
    const total_catalogs_created = network.length;
    const active_resellers = network.filter((r) => r.is_active).length;
    const pending_activations = network.filter((r) => !r.is_active).length;

    const total_quotes_generated = network.reduce((sum, r) => sum + (r.total_quotes || 0), 0);

    // Sistema gratuito - revenue por otras fuentes (upgrades, features premium)
    const total_revenue = 0;

    const conversion_rate = total_catalogs_created > 0 ? (active_resellers / total_catalogs_created) * 100 : 0;

    // Top reseller
    const sortedByQuotes = [...network]
      .filter((r) => r.is_active && r.reseller_name)
      .sort((a, b) => (b.total_quotes || 0) - (a.total_quotes || 0));

    const top_reseller =
      sortedByQuotes.length > 0
        ? {
            name: sortedByQuotes[0].reseller_name || "Desconocido",
            quotes: sortedByQuotes[0].total_quotes || 0,
          }
        : null;

    // Para top_product necesitaríamos una query adicional
    // Por ahora lo dejamos null
    const top_product = null;

    return {
      total_catalogs_created,
      active_resellers,
      pending_activations,
      total_quotes_generated,
      total_revenue,
      conversion_rate: Math.round(conversion_rate * 100) / 100,
      top_product,
      top_reseller,
    };
  }

  /**
   * Reenviar link de activación
   */
  static async getActivationLink(catalogId: string): Promise<string> {
    const { data, error } = await supabase
      .from("replicated_catalogs")
      .select("activation_token")
      .eq("id", catalogId)
      .single();

    if (error) {
      console.error("Error getting activation token:", error);
      throw new Error(`Error al obtener link de activación: ${error.message}`);
    }

    return `${window.location.origin}/activar/${data.activation_token}`;
  }

  /**
   * Verificar si un catálogo ya expiró (gratis sin activar)
   */
  static async checkExpiration(token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("replicated_catalogs")
      .select("expires_at, is_active")
      .eq("activation_token", token)
      .single();

    if (error || !data) {
      return true; // Considerar expirado si hay error
    }

    if (data.is_active) {
      return false; // Activos nunca expiran
    }

    if (!data.expires_at) {
      return false; // Sin fecha de expiración
    }

    const expirationDate = new Date(data.expires_at);
    const now = new Date();

    return now > expirationDate;
  }

  /**
   * Obtener catálogos replicados de un revendedor (Nivel 3)
   */
  static async getResellerCatalogs(resellerId: string): Promise<ReplicatedCatalog[]> {
    const { data, error } = await supabase
      .from("replicated_catalogs")
      .select("*")
      .eq("reseller_id", resellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting reseller catalogs:", error);
      throw new Error(`Error al obtener catálogos del revendedor: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Eliminar catálogo replicado (solo si no está activo)
   */
  static async deleteReplica(catalogId: string): Promise<void> {
    // Verificar que no esté activo
    const { data: catalog } = await supabase
      .from("replicated_catalogs")
      .select("is_active")
      .eq("id", catalogId)
      .single();

    if (catalog?.is_active) {
      throw new Error("No se puede eliminar un catálogo activo");
    }

    const { error } = await supabase.from("replicated_catalogs").delete().eq("id", catalogId);

    if (error) {
      console.error("Error deleting replica:", error);
      throw new Error(`Error al eliminar catálogo: ${error.message}`);
    }
  }

  /**
   * Activar catálogo con solo email (sin password) - Sistema híbrido
   */
  static async activateWithEmail(
    data: ActivateWithEmailDTO, // Or use { token: string; email: string; name?: string } directly
  ): Promise<ActivationResponse> {
    // <-- Use the specific return type
    try {
      console.log("Calling activate-replicated-catalog Edge Function with:", data);
      const { data: functionResponse, error } = await supabase.functions.invoke<ActivationResponse>( // <-- Specify the return type here
        "activate-replicated-catalog",
        {
          body: {
            token: data.token,
            email: data.email,
            name: data.name || undefined, // Send name only if it exists
          },
        },
      );

      if (error) {
        console.error("Error invoking activate-replicated-catalog:", error);
        // Try to extract a more useful error message if possible
        const message =
          (error as any).context?.message || error.message || "Error al contactar el servidor de activación.";
        throw new Error(message);
      }

      // Validate the function's response structure
      if (!functionResponse || typeof functionResponse.success !== "boolean") {
        console.error("Invalid response from activation function:", functionResponse);
        throw new Error("Respuesta inesperada del servidor de activación.");
      }

      // If the function itself reported an internal failure (even with a 200 status)
      if (!functionResponse.success) {
        throw new Error(functionResponse.message || "Ocurrió un error durante la activación en el servidor.");
      }

      console.log("Activation function response:", functionResponse);
      // Return the full response from the Edge Function
      return functionResponse;
    } catch (error: any) {
      console.error("Error in activateWithEmail:", error);
      // Re-throw the error so ActivateCatalog.tsx can catch and display it
      throw error;
    }
  }

  /**
   * Completar activación después de confirmar email
   */
  static async completeActivation(token: string, userId: string): Promise<any> {
    try {
      console.log('📞 Llamando a complete_catalog_activation');
      console.log('Token:', token);
      console.log('User ID:', userId);
      
      const { data, error } = await supabase.rpc('complete_catalog_activation', {
        p_token: token,
      });

      if (error) {
        console.error('❌ Error RPC complete_catalog_activation:', error);
        throw new Error(`Error al completar activación: ${error.message}`);
      }

      console.log('✅ RPC exitoso:', data);
      
      // Verificar que data tenga la estructura esperada
      if (!data || typeof data !== 'object') {
        console.warn('⚠️ Respuesta inesperada del RPC:', data);
        throw new Error('Respuesta inválida del servidor');
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error general en completeActivation:', error);
      throw error;
    }
  }


  /**
   * Obtener datos del dashboard del revendedor
   */
  static async getResellerDashboard(catalogId: string, userId: string): Promise<ResellerDashboardData> {
    try {
      // 1. Obtener catálogo replicado
      const { data: replicatedCatalog, error: catalogError } = await supabase
        .from("replicated_catalogs")
        .select(
          `
          id,
          original_catalog_id,
          quote_id,
          digital_catalogs!replicated_catalogs_original_catalog_id_fkey (
            name,
            slug
          )
        `,
        )
        .eq("id", catalogId)
        .eq("reseller_id", userId)
        .single();

      if (catalogError || !replicatedCatalog) {
        throw new Error("Catálogo no encontrado");
      }

      const originalCatalog = (replicatedCatalog as any).digital_catalogs;

      // 2. Contar productos del catálogo original
      const { count: productCount } = await supabase
        .from("catalog_products")
        .select("*", { count: "exact", head: true })
        .eq("catalog_id", replicatedCatalog.original_catalog_id);

      // 3. Obtener cotización original (la que hizo el revendedor)
      let originalQuote = null;
      if (replicatedCatalog.quote_id) {
        const { data: quoteData } = await supabase
          .from("quotes")
          .select(
            `
            id,
            status,
            created_at,
            quote_items (subtotal)
          `,
          )
          .eq("id", replicatedCatalog.quote_id)
          .single();

        if (quoteData) {
          const items = (quoteData as any).quote_items || [];
          const total = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

          originalQuote = {
            id: quoteData.id,
            status: quoteData.status,
            total_amount: total,
            items_count: items.length,
            created_at: quoteData.created_at,
          };
        }
      }

      // 4. Obtener cotizaciones recibidas del nuevo catálogo del revendedor
      // Por ahora este catálogo aún no tiene slug propio, usaremos el original
      // TODO: En el futuro, cada catálogo replicado tendrá su propio slug

      const receivedQuotes: any[] = []; // Placeholder por ahora
      const stats = {
        total_quotes: 0,
        pending_quotes: 0,
        accepted_quotes: 0,
      };

      return {
        catalog: {
          id: replicatedCatalog.id,
          slug: originalCatalog.slug, // Por ahora usa el slug original
          name: originalCatalog.name,
          product_count: productCount || 0,
          public_url: `${window.location.origin}/c/${originalCatalog.slug}`,
        },
        original_quote: originalQuote,
        received_quotes: receivedQuotes,
        stats,
      };
    } catch (error: any) {
      console.error("Error getting reseller dashboard:", error);
      throw error;
    }
  }
}
