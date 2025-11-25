import { supabase } from "@/integrations/supabase/client";
import type {
  CreateReplicatedCatalogDTO,
  ActivateReplicatedCatalogDTO,
  ReplicatedCatalog,
  CatalogByTokenResponse,
  NetworkResellerView,
  NetworkStats,
  ActivateWithEmailDTO,
  ResellerDashboardData,
  MagicLinkResponse, // Asegúrate de tener este tipo o quítalo si no se usa
} from "@/types/digital-catalog";

// Respuesta esperada de la Edge Function de activación
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
   * ✅ ACTUALIZADO: Obtener información de catálogo por token
   * Usa la Edge Function 'get-quote-by-token' para soportar lógica dual y seguridad
   */
  static async getCatalogByToken(token: string): Promise<CatalogByTokenResponse> {
    console.log("🔍 Buscando catálogo por token de activación:", token);

    // Llamamos a la Edge Function que ya validamos (soporta tracking y activation tokens)
    const { data, error } = await supabase.functions.invoke("get-quote-by-token", {
      body: { token: token },
    });

    if (error) {
      console.error("Error invocando Edge Function:", error);
      throw new Error("Error de conexión con el servidor.");
    }

    if (!data.success || !data.quote) {
      console.error("Error en respuesta:", data);
      throw new Error(data.error || "Catálogo no encontrado o token inválido.");
    }

    const quote = data.quote;
    const catalog = quote.digital_catalogs;

    // Determinamos si es un token de activación específico
    // La Edge Function devuelve 'replicated_catalogs' si encontró el token ahí
    const replicaData = quote.replicated_catalogs;
    // Nota: Si replicaData es array, tomamos el primero, si es objeto lo usamos, si es null intentamos buscarlo
    const activeReplica = Array.isArray(replicaData) ? replicaData[0] : replicaData;

    // Mapeamos la respuesta compleja de la cotización al formato simple que espera la página de Activación
    return {
      catalog_id: activeReplica?.id, // ID de la réplica (si existe/se encontró)
      original_catalog_id: catalog.id,
      distributor_id: catalog.user_id,
      distributor_name: catalog.users?.full_name || catalog.users?.business_name || "Proveedor",
      distributor_company: catalog.users?.business_name,
      is_active: activeReplica?.is_active || false,
      product_limit: 50, // Límite default o traer de DB si existe columna
      expires_at: activeReplica?.expires_at || null,
      product_count: quote.items?.length || 0, // Usamos items de la cotización como aproximado
      catalog_name: catalog.name,
      catalog_description: catalog.description,
      reseller_email: null, // Se llenará si el usuario ya existe en el flujo de activación
    } as CatalogByTokenResponse;
  }

  /**
   * Activar catálogo tras pago (Legacy o flujo manual)
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

    // Usamos /track para mantener consistencia con el nuevo flujo
    return `${window.location.origin}/track?token=${data.activation_token}`;
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
      .select(
        `
        *,
        digital_catalogs!replicated_catalogs_original_catalog_id_fkey (
          id,
          name,
          slug,
          description
        )
      `,
      )
      .eq("reseller_id", resellerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting reseller catalogs:", error);
      throw new Error(`Error al obtener catálogos del revendedor: ${error.message}`);
    }

    return (data || []) as unknown as ReplicatedCatalog[];
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
  static async activateWithEmail(data: ActivateWithEmailDTO): Promise<ActivationResponse> {
    try {
      console.log("Calling activate-replicated-catalog Edge Function with:", data);
      const { data: functionResponse, error } = await supabase.functions.invoke<ActivationResponse>(
        "activate-replicated-catalog",
        {
          body: {
            token: data.token,
            email: data.email,
            name: data.name || undefined,
          },
        },
      );

      if (error) {
        console.error("Error invoking activate-replicated-catalog:", error);
        const message =
          (error as any).context?.message || error.message || "Error al contactar el servidor de activación.";
        throw new Error(message);
      }

      if (!functionResponse || typeof functionResponse.success !== "boolean") {
        console.error("Invalid response from activation function:", functionResponse);
        throw new Error("Respuesta inesperada del servidor de activación.");
      }

      if (!functionResponse.success) {
        throw new Error(functionResponse.message || "Ocurrió un error durante la activación en el servidor.");
      }

      return functionResponse;
    } catch (error: any) {
      console.error("Error in activateWithEmail:", error);
      throw error;
    }
  }

  /**
   * Completar activación después de confirmar email
   */
  static async completeActivation(token: string, userId: string): Promise<any> {
    try {
      console.log("📞 Llamando a complete_catalog_activation");

      const { data, error } = await supabase.rpc("complete_catalog_activation", {
        p_token: token,
      });

      if (error) {
        console.error("❌ Error RPC complete_catalog_activation:", error);
        throw new Error(`Error al completar activación: ${error.message}`);
      }

      if (!data || typeof data !== "object") {
        console.warn("⚠️ Respuesta inesperada del RPC:", data);
        throw new Error("Respuesta inválida del servidor");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error general en completeActivation:", error);
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
          activation_token,
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
            total_amount, 
            quote_items (subtotal)
          `,
          )
          .eq("id", replicatedCatalog.quote_id)
          .single();

        if (quoteData) {
          const items = (quoteData as any).quote_items || [];
          // Usar total_amount si existe, si no sumar items
          const total =
            quoteData.total_amount || items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

          originalQuote = {
            id: quoteData.id,
            status: quoteData.status,
            total_amount: total,
            items_count: items.length,
            created_at: quoteData.created_at,
          };
        }
      }

      // 4. Datos de ejemplo para recibidos
      const receivedQuotes: any[] = [];
      const stats = {
        total_quotes: 0,
        pending_quotes: 0,
        accepted_quotes: 0,
      };

      return {
        catalog: {
          id: replicatedCatalog.id,
          slug: originalCatalog.slug,
          name: originalCatalog.name,
          product_count: productCount || 0,
          public_url: `${window.location.origin}/c/${replicatedCatalog.activation_token}`, // Ojo: Aquí podrías querer usar slug propio si lo implementas después
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
