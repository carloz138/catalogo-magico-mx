import { supabase } from "@/integrations/supabase/client";
import type {
  CreateReplicatedCatalogDTO,
  ActivateReplicatedCatalogDTO,
  ReplicatedCatalog,
  CatalogByTokenResponse,
  NetworkResellerView,
  NetworkStats,
} from "@/types/digital-catalog";

export class ReplicationService {
  /**
   * Crear catálogo replicado cuando se acepta una cotización
   */
  static async createReplica(
    data: CreateReplicatedCatalogDTO
  ): Promise<ReplicatedCatalog> {
    const { data: catalogId, error } = await supabase.rpc(
      "create_replicated_catalog",
      {
        p_original_catalog_id: data.original_catalog_id,
        p_quote_id: data.quote_id,
        p_distributor_id: data.distributor_id,
      }
    );

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
  static async getCatalogByToken(
    token: string
  ): Promise<CatalogByTokenResponse> {
    const { data, error } = await supabase.rpc("get_catalog_by_token", {
      p_token: token,
    });

    if (error) {
      console.error("Error getting catalog by token:", error);
      throw new Error(`Error al obtener catálogo: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Catálogo no encontrado o token inválido");
    }

    return data[0];
  }

  /**
   * Activar catálogo tras pago de $29 MXN
   */
  static async activateCatalog(
    data: ActivateReplicatedCatalogDTO
  ): Promise<boolean> {
    const { data: result, error } = await supabase.rpc(
      "activate_replicated_catalog",
      {
        p_token: data.token,
        p_reseller_id: data.reseller_id,
      }
    );

    if (error) {
      console.error("Error activating catalog:", error);
      throw new Error(`Error al activar catálogo: ${error.message}`);
    }

    return result;
  }

  /**
   * Obtener red de distribución de un usuario (Nivel 2)
   */
  static async getDistributionNetwork(
    distributorId: string
  ): Promise<NetworkResellerView[]> {
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

    const total_quotes_generated = network.reduce(
      (sum, r) => sum + (r.total_quotes || 0),
      0
    );

    const total_revenue = active_resellers * 29; // $29 MXN por activación

    const conversion_rate =
      total_catalogs_created > 0
        ? (active_resellers / total_catalogs_created) * 100
        : 0;

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
  static async getResellerCatalogs(
    resellerId: string
  ): Promise<ReplicatedCatalog[]> {
    const { data, error } = await supabase
      .from("replicated_catalogs")
      .select("*")
      .eq("reseller_id", resellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting reseller catalogs:", error);
      throw new Error(
        `Error al obtener catálogos del revendedor: ${error.message}`
      );
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

    const { error } = await supabase
      .from("replicated_catalogs")
      .delete()
      .eq("id", catalogId);

    if (error) {
      console.error("Error deleting replica:", error);
      throw new Error(`Error al eliminar catálogo: ${error.message}`);
    }
  }
}
