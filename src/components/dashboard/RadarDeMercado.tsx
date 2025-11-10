import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactWordcloud from "react-wordcloud";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Radar, Calendar, TrendingUp, Sparkles, AlertCircle, X, Filter } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

// Tipos
type WordCloudData = {
  text: string;
  value: number;
};

type Solicitud = {
  id: string;
  creado_el: string;
  producto_nombre: string;
  producto_marca: string | null;
  producto_descripcion: string | null;
  cantidad: number;
  cliente_final_nombre: string;
  estatus_fabricante: string;
  estatus_revendedor: string;
};

// Opciones predefinidas de fechas
const DATE_PRESETS = [
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 90 días", days: 90 },
  { label: "Último año", days: 365 },
];

export function RadarDeMercado() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wordCloudData, setWordCloudData] = useState<WordCloudData[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [dateRange, setDateRange] = useState(30); // días por defecto
  const [stats, setStats] = useState({ total: 0, nuevas: 0 });
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de la nube de palabras
  const fetchRadarTerms = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const fechaInicio = subDays(new Date(), dateRange);
      const fechaFin = new Date();

      const { data, error } = await supabase.rpc("fn_get_radar_terms", {
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString(),
        min_frequency: 1,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setWordCloudData(data);
      } else {
        setWordCloudData([]);
      }

      // Obtener estadísticas
      const { count: totalCount } = await supabase
        .from("solicitudes_mercado")
        .select("*", { count: "exact", head: true })
        .gte("creado_el", fechaInicio.toISOString())
        .or(`fabricante_id.eq.${user.id},revendedor_id.eq.${user.id}`);

      const { count: nuevasCount } = await supabase
        .from("solicitudes_mercado")
        .select("*", { count: "exact", head: true })
        .gte("creado_el", subDays(new Date(), 7).toISOString())
        .or(`fabricante_id.eq.${user.id},revendedor_id.eq.${user.id}`);

      setStats({
        total: totalCount || 0,
        nuevas: nuevasCount || 0,
      });
    } catch (err: any) {
      console.error("Error fetching radar terms:", err);
      setError("Error al cargar los términos del radar");
    } finally {
      setLoading(false);
    }
  };

  // Cargar solicitudes filtradas por término
  const fetchSolicitudesByTerm = async (term: string) => {
    if (!user) return;

    try {
      const fechaInicio = subDays(new Date(), dateRange);

      // SOLUCIÓN: Usar OR con múltiples estrategias de búsqueda
      const { data, error } = await supabase
        .from("solicitudes_mercado")
        .select("*")
        .gte("creado_el", fechaInicio.toISOString())
        .or(`fabricante_id.eq.${user.id},revendedor_id.eq.${user.id}`)
        .or(
          // Estrategia 1: Buscar en producto_nombre (ILIKE para match parcial)
          `producto_nombre.ilike.%${term}%,` +
            // Estrategia 2: Buscar en producto_marca
            `producto_marca.ilike.%${term}%,` +
            // Estrategia 3: Buscar en descripción
            `producto_descripcion.ilike.%${term}%`,
        )
        .order("creado_el", { ascending: false });

      if (error) throw error;
      setSolicitudes(data || []);
    } catch (err: any) {
      console.error("Error fetching solicitudes:", err);
      setSolicitudes([]);
    }
  };

  useEffect(() => {
    fetchRadarTerms();
  }, [user, dateRange]);

  useEffect(() => {
    if (selectedTerm) {
      fetchSolicitudesByTerm(selectedTerm);
    } else {
      setSolicitudes([]);
    }
  }, [selectedTerm]);

  // Configuración de la nube de palabras
  const wordCloudOptions = {
    colors: ["#8b5cf6", "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4"],
    enableTooltip: true,
    deterministic: false,
    fontFamily: "Inter, system-ui, sans-serif",
    fontSizes: [16, 80] as [number, number],
    fontStyle: "normal",
    fontWeight: "600",
    padding: 2,
    rotations: 2,
    rotationAngles: [0, 0] as [number, number],
    scale: "sqrt" as const, // ← AGREGAR 'as const'
    spiral: "archimedean" as const, // ← AGREGAR 'as const' también aquí
    transitionDuration: 1000,
  };

  const wordCloudCallbacks = {
    onWordClick: (word: WordCloudData) => {
      setSelectedTerm(word.text);
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Radar className="h-6 w-6 text-purple-600" />
                Radar de Mercado Inteligente
              </CardTitle>
              <CardDescription className="mt-2">
                Descubre qué productos están solicitando tus clientes con IA
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              IA
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Total Solicitudes"
              value={stats.total}
              variant="default"
            />
            <StatCard
              icon={<Calendar className="h-4 w-4" />}
              label="Últimos 7 días"
              value={stats.nuevas}
              variant="success"
            />
            <StatCard
              icon={<Filter className="h-4 w-4" />}
              label="Período actual"
              value={`${dateRange}d`}
              variant="info"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Términos únicos"
              value={wordCloudData.length}
              variant="purple"
            />
          </div>

          {/* Filtros de fecha */}
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.days}
                variant={dateRange === preset.days ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Nube de Palabras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Términos Más Solicitados
          </CardTitle>
          <CardDescription>Haz clic en cualquier palabra para ver las solicitudes detalladas</CardDescription>
        </CardHeader>
        <CardContent>
          {wordCloudData.length > 0 ? (
            <div className="h-[400px] w-full bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-lg p-4">
              <ReactWordcloud words={wordCloudData} options={wordCloudOptions} callbacks={wordCloudCallbacks} />
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-center p-8">
              <div>
                <Radar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay datos suficientes</h3>
                <p className="text-sm text-gray-500">
                  Cuando tus clientes empiecen a solicitar productos, verás aquí los términos más populares.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de solicitudes filtradas */}
      {selectedTerm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Solicitudes de: <Badge variant="secondary">{selectedTerm}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTerm(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {solicitudes.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitudes.map((sol) => (
                      <TableRow key={sol.id}>
                        <TableCell>
                          <div className="font-medium">{sol.producto_nombre}</div>
                          {sol.producto_marca && (
                            <div className="text-xs text-muted-foreground">{sol.producto_marca}</div>
                          )}
                        </TableCell>
                        <TableCell>{sol.cliente_final_nombre}</TableCell>
                        <TableCell>{sol.cantidad}</TableCell>
                        <TableCell>{format(new Date(sol.creado_el), "dd MMM yyyy", { locale: es })}</TableCell>
                        <TableCell>
                          <StatusBadge status={sol.estatus_fabricante} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No se encontraron solicitudes para este término</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente auxiliar para las tarjetas de estadísticas
function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant: "default" | "success" | "info" | "purple";
}) {
  const colors = {
    default: "bg-white border-gray-200",
    success: "bg-green-50 border-green-200",
    info: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[variant]}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Componente auxiliar para badges de estado
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    nuevo: { label: "Nuevo", className: "bg-blue-100 text-blue-800" },
    revisando: { label: "Revisando", className: "bg-yellow-100 text-yellow-800" },
    aprobado: { label: "Aprobado", className: "bg-green-100 text-green-800" },
    rechazado: { label: "Rechazado", className: "bg-red-100 text-red-800" },
  };

  const variant = variants[status] || variants.nuevo;

  return <Badge className={variant.className}>{variant.label}</Badge>;
}
