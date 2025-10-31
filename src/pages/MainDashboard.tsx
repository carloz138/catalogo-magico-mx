import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/RoleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpsellBanner } from "@/components/dashboard/UpsellBanner";
import { ResellerCatalogsSection } from "@/components/dashboard/ResellerCatalogsSection"; // ✅ NUEVO
import KpiDashboard from "@/components/dashboard/KpiDashboard";
import { QuotesSent } from "@/components/dashboard/QuotesSent";
import { QuotesReceived } from "@/components/dashboard/QuotesReceived";
import { Loader2, FileText, Package, Network, TrendingUp, AlertCircle, Plus } from "lucide-react";

export default function MainDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole, isLoadingRole } = useUserRole();
  const [activeTab, setActiveTab] = useState("quotes");

  if (isLoadingRole) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const isL1 = userRole === "L1" || userRole === "BOTH";
  const isL2 = userRole === "L2" || userRole === "BOTH";
  const isOnlyL2 = userRole === "L2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Principal</h1>
              <p className="text-gray-600 mt-1">Bienvenido, {user?.user_metadata?.full_name || user?.email}</p>
            </div>

            {/* Badge de Rol */}
            <div className="flex items-center gap-3">
              {isL1 && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Creador
                </Badge>
              )}
              {isL2 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  <Package className="w-3 h-3 mr-1" />
                  Revendedor
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Banner de Upsell para usuarios solo L2 */}
        {isOnlyL2 && <UpsellBanner />}

        {/* Tabs Dinámicos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 shadow-sm border w-full justify-start overflow-x-auto">
            {/* Tab: Mis Cotizaciones (visible para TODOS) */}
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mis Cotizaciones
            </TabsTrigger>

            {/* Tab: Mis Catálogos (visible para L2 o L1) */}
            {(isL2 || isL1) && (
              <TabsTrigger value="catalogs" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Mis Catálogos
                {isL2 && isL1 && (
                  <Badge variant="secondary" className="text-xs">
                    {userRole === "BOTH" ? "Ambos" : ""}
                  </Badge>
                )}
              </TabsTrigger>
            )}

            {/* Tab: Mi Red (visible solo para L1) */}
            {isL1 && (
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Mi Red
              </TabsTrigger>
            )}
          </TabsList>

          {/* ========================================= */}
          {/* TAB 1: MIS COTIZACIONES */}
          {/* ========================================= */}
          <TabsContent value="quotes" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cotizaciones Enviadas */}
              <Card className="border-2 border-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    📤 Enviadas
                  </CardTitle>
                  <CardDescription>Cotizaciones que TÚ solicitaste como cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <QuotesSent />
                </CardContent>
              </Card>

              {/* Cotizaciones Recibidas */}
              <Card className="border-2 border-green-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    📥 Recibidas
                  </CardTitle>
                  <CardDescription>Cotizaciones que te han enviado tus clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <QuotesReceived />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================= */}
          {/* TAB 2: MIS CATÁLOGOS */}
          {/* ========================================= */}
          {(isL2 || isL1) && (
            <TabsContent value="catalogs" className="space-y-6">
              {/* Catálogos Replicados (L2) */}
              {isL2 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">🤝 Catálogos para Revender</h2>
                      <p className="text-gray-600 text-sm">Catálogos que puedes distribuir y vender</p>
                    </div>
                    <Badge variant="outline">Revendedor</Badge>
                  </div>
                  <ResellerCatalogsSection /> {/* ✅ NUEVO COMPONENTE */}
                </div>
              )}

              {/* Catálogos Originales (L1) */}
              {isL1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">✨ Mis Catálogos Originales</h2>
                      <p className="text-gray-600 text-sm">Catálogos que has creado desde cero</p>
                    </div>
                    <Button onClick={() => navigate("/catalogs/new")} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Catálogo
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Aún no has creado catálogos</p>
                        <p className="text-sm mt-2 mb-4">Crea tu primer catálogo digital profesional</p>
                        <Button onClick={() => navigate("/catalogs/new")} variant="outline">
                          Empezar ahora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}

          {/* ========================================= */}
          {/* TAB 3: MI RED (Solo L1) */}
          {/* ========================================= */}
          {isL1 && (
            <TabsContent value="network" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">🌐 Mi Red de Distribución</h2>
                  <p className="text-gray-600 text-sm">Gestiona tu red de revendedores y analiza el mercado</p>
                </div>
                <Badge className="bg-purple-100 text-purple-700">Fabricante</Badge>
              </div>

              {/* KPIs */}
              <KpiDashboard />

              {/* Placeholder para Red y Radar */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Red de Distribución</CardTitle>
                    <CardDescription>Tus revendedores activos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Network className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Aún no tienes revendedores</p>
                      <p className="text-sm mt-1">Comparte tus catálogos para empezar</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Radar de Mercado</CardTitle>
                    <CardDescription>Productos más solicitados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Sin datos de mercado</p>
                      <p className="text-sm mt-1">Las solicitudes aparecerán aquí</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Mensaje si no tiene ningún rol */}
        {userRole === "NONE" && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
                <h2 className="text-xl font-semibold mb-2">¡Bienvenido a CatifyPro!</h2>
                <p className="text-gray-600 mb-6">
                  Para empezar, puedes crear tu propio catálogo o activar uno que te hayan compartido.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => navigate("/catalogs/new")} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Catálogo
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Explorar Catálogos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
