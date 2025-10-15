import { useState, useEffect } from "react";
import { ReplicationService } from "@/services/replication.service";
import type { NetworkResellerView, NetworkStats } from "@/types/digital-catalog";
import { useToast } from "@/hooks/use-toast";

export function useDistributionNetwork(distributorId: string | null) {
  const [network, setNetwork] = useState<NetworkResellerView[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    total_catalogs_created: 0,
    active_resellers: 0,
    pending_activations: 0,
    total_quotes_generated: 0,
    total_revenue: 0,
    conversion_rate: 0,
    top_product: null,
    top_reseller: null,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadNetwork = async () => {
    if (!distributorId) return;

    setLoading(true);
    try {
      // Cargar red de distribución
      const networkData = await ReplicationService.getDistributionNetwork(
        distributorId
      );
      setNetwork(networkData);

      // Cargar estadísticas
      const statsData = await ReplicationService.getNetworkStats(distributorId);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading distribution network:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la red de distribución",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (distributorId) {
      loadNetwork();
    }
  }, [distributorId]);

  const resendInvitation = async (catalogId: string) => {
    try {
      const link = await ReplicationService.getActivationLink(catalogId);
      
      // Copiar al portapapeles
      await navigator.clipboard.writeText(link);
      
      toast({
        title: "Link copiado",
        description: "Comparte este link con tu cliente para que active su catálogo",
      });
      
      return link;
    } catch (error) {
      console.error("Error getting activation link:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener el link de activación",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    network,
    stats,
    loading,
    refetch: loadNetwork,
    resendInvitation,
  };
}
