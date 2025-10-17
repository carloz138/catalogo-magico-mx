import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, FileText, DollarSign, Eye, Users, CheckCircle, BarChart } from "lucide-react";

interface KPIData {
  active_catalogs: number;
  quotes_sent_period: number;
  total_quoted_amount_period: number;
  quote_acceptance_rate_period: number;
  total_accepted_amount_period: number;
  total_catalog_views: number;
  new_distributors_activated_period: number;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const KpiCard = ({ title, value, icon }: KpiCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default function KpiDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    if (user?.id) {
      loadUserKPIs();
    }
  }, [user]);

  const loadUserKPIs = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Obtener el plan del usuario desde la tabla users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("current_plan")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      setUserPlan(userData?.current_plan || "free");

      // Llamar a la función RPC para obtener los KPIs
      const { data: kpiResponse, error: kpiError } = await supabase.rpc(
        "get_user_kpis" as any,
        {
          user_id_param: user.id,
          days_param: 30,
        }
      );

      if (kpiError) throw kpiError;

      setKpiData(kpiResponse as KPIData);
    } catch (err: any) {
      console.error("Error loading KPIs:", err);
      setError(err.message || "Error al cargar las métricas");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number): string => {
    const amount = cents / 100;
    return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando métricas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!kpiData) {
    return (
      <Alert>
        <AlertDescription>No hay datos disponibles</AlertDescription>
      </Alert>
    );
  }

  // KPIs del Plan Básico
  const basicKPIs = (
    <>
      <KpiCard
        title="Catálogos Activos"
        value={kpiData.active_catalogs}
        icon={<BarChart className="w-5 h-5" />}
      />
      <KpiCard
        title="Cotizaciones Enviadas (30d)"
        value={kpiData.quotes_sent_period}
        icon={<FileText className="w-5 h-5" />}
      />
      <KpiCard
        title="Monto Cotizado (30d)"
        value={formatCurrency(kpiData.total_quoted_amount_period)}
        icon={<DollarSign className="w-5 h-5" />}
      />
    </>
  );

  // KPIs adicionales del Plan Crecimiento (Advanced)
  const advancedKPIs = (
    <>
      <KpiCard
        title="Tasa de Aceptación"
        value={`${kpiData.quote_acceptance_rate_period.toFixed(1)}%`}
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <KpiCard
        title="Ventas Cerradas (30d)"
        value={formatCurrency(kpiData.total_accepted_amount_period)}
        icon={<CheckCircle className="w-5 h-5" />}
      />
      <KpiCard
        title="Vistas de Catálogo"
        value={kpiData.total_catalog_views.toLocaleString("es-MX")}
        icon={<Eye className="w-5 h-5" />}
      />
    </>
  );

  // KPIs adicionales del Plan Profesional
  const proKPIs = (
    <>
      <KpiCard
        title="Nuevos Distribuidores (30d)"
        value={kpiData.new_distributors_activated_period}
        icon={<Users className="w-5 h-5" />}
      />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Métricas</h2>
          <p className="text-muted-foreground">Últimos 30 días</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Plan Básico - Mostrar siempre estos KPIs */}
        {basicKPIs}

        {/* Plan Advanced - Mostrar si el plan es 'advanced' o superior */}
        {(userPlan === "advanced" || userPlan === "pro") && advancedKPIs}

        {/* Plan Pro - Mostrar solo si el plan es 'pro' */}
        {userPlan === "pro" && proKPIs}
      </div>

      {/* Mensaje de upgrade si el plan no es pro */}
      {userPlan !== "pro" && (
        <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Mejora tu plan</strong> para desbloquear métricas avanzadas y aumentar tus ventas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
