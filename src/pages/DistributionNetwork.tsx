import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDistributionNetwork } from "@/hooks/useDistributionNetwork";
import { StatCard } from "@/components/replication/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Mail, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function DistributionNetwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { network, stats, loading, refetch, resendInvitation } =
    useDistributionNetwork(user?.id || null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleResendInvitation = async (catalogId: string) => {
    setActionLoading(catalogId);
    try {
      const link = await resendInvitation(catalogId);
      toast({
        title: "✅ Link copiado",
        description: "El link de activación se copió al portapapeles",
      });
    } catch (error) {
      // El error ya se maneja en el hook
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCatalog = (catalogId: string) => {
    // Navegar a la vista del catálogo
    navigate(`/catalogs/${catalogId}`);
  };

  const handleViewResellerDetails = (resellerId: string) => {
    // Navegar a detalles del revendedor (lo implementaremos después)
    toast({
      title: "Función en desarrollo",
      description: "Pronto podrás ver detalles completos del revendedor",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return "Fecha inválida";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando red de distribución...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mi Red de Distribución
        </h1>
        <p className="text-gray-600">
          Gestiona y monitorea a todos tus revendedores desde aquí
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon="🏪"
          label="Revendedores Activos"
          value={stats.active_resellers}
          subtitle={`${stats.pending_activations} pendientes`}
        />
        <StatCard
          icon="📦"
          label="Catálogos Replicados"
          value={stats.total_catalogs_created}
          subtitle={`$${stats.total_revenue} MXN generados`}
        />
        <StatCard
          icon="📝"
          label="Cotizaciones Generadas"
          value={stats.total_quotes_generated}
          subtitle={`${stats.conversion_rate}% tasa de activación`}
        />
        <StatCard
          icon={stats.top_reseller ? "⭐" : "📊"}
          label={stats.top_reseller ? "Top Revendedor" : "Performance"}
          value={stats.top_reseller?.name || "N/A"}
          subtitle={
            stats.top_reseller
              ? `${stats.top_reseller.quotes} cotizaciones`
              : "Sin datos aún"
          }
        />
      </div>

      {/* Empty State */}
      {network.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏪</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no tienes revendedores
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Cuando aceptes cotizaciones y repliques catálogos, tus clientes
              aparecerán aquí como parte de tu red de distribución.
            </p>
            <Button onClick={() => navigate("/quotes")}>
              Ver cotizaciones pendientes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Revendedores */}
      {network.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tus Revendedores ({network.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={refetch}>
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-gray-900">
                      Revendedor
                    </th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">
                      Estado
                    </th>
                    <th className="pb-3 font-semibold text-gray-900">
                      Catálogo
                    </th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">
                      Cotizaciones
                    </th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">
                      Conversión
                    </th>
                    <th className="pb-3 font-semibold text-gray-900">
                      Creado
                    </th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {network.map((reseller) => (
                    <tr key={reseller.network_id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {reseller.reseller_name || reseller.reseller_email || "Sin nombre"}
                          </p>
                          {reseller.reseller_company && (
                            <p className="text-sm text-gray-500">
                              {reseller.reseller_company}
                            </p>
                          )}
                          {reseller.reseller_email && (
                            <p className="text-xs text-gray-400">
                              {reseller.reseller_email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        {reseller.is_active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            ✅ Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            ⏳ Pendiente
                          </Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleViewCatalog(reseller.catalog_id)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {reseller.catalog_name}
                        </button>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {reseller.total_quotes}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={`font-semibold ${
                            reseller.conversion_rate >= 50
                              ? "text-green-600"
                              : reseller.conversion_rate >= 25
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }`}
                        >
                          {reseller.conversion_rate}%
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(reseller.created_at)}
                        </span>
                        {reseller.activated_at && (
                          <p className="text-xs text-green-600">
                            Activado {formatDate(reseller.activated_at)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === reseller.catalog_id}
                            >
                              {actionLoading === reseller.catalog_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!reseller.is_active && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleResendInvitation(reseller.catalog_id)
                                }
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar link de activación
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewCatalog(reseller.catalog_id)
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver catálogo
                            </DropdownMenuItem>
                            {reseller.reseller_id && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewResellerDetails(reseller.reseller_id!)
                                }
                              >
                                📊 Ver detalles
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guía rápida */}
      {network.length > 0 && network.some((r) => !r.is_active) && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Tienes revendedores pendientes de activar
            </h3>
            <p className="text-sm text-blue-800">
              Recuerda compartir el link de activación con tus clientes. Ellos
              podrán activar su catálogo por $29 MXN y empezar a recibir
              cotizaciones automáticamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
