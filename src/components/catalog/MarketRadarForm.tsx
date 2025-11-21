import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Loader2,
  AlertCircle,
  Radar,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Send,
  Search,
  XCircle,
  PackageSearch,
} from "lucide-react";

// --- MOCKS PARA PREVIEW (Reemplazar con tus imports reales) ---
// import { supabase } from "@/integrations/supabase/client";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/components/ui/use-toast";

const useAuth = () => ({ user: { id: "mock-user-id" } }); // Mock Auth
const useToast = () => ({
  toast: ({ title, description, variant, className }: any) =>
    console.log(`Toast: ${title} - ${description} (${variant})`),
});

// Datos de ejemplo para simular la respuesta de Supabase
const MOCK_DATA: SolicitudCliente[] = [
  {
    id: "1",
    creado_el: new Date().toISOString(),
    cliente_final_nombre: "Ferretería El Martillo",
    cliente_final_email: "contacto@elmartillo.mx",
    producto_nombre: "Taladro Industrial Bosch 18V",
    cantidad: 5,
    estatus_revendedor: "nuevo",
  },
  {
    id: "2",
    creado_el: new Date(Date.now() - 86400000).toISOString(), // Ayer
    cliente_final_nombre: "Constructora Norte",
    cliente_final_email: "compras@cnorte.com",
    producto_nombre: "Cemento Blanco Tolteca 50kg",
    cantidad: 100,
    estatus_revendedor: "consultado_proveedor",
  },
  {
    id: "3",
    creado_el: new Date(Date.now() - 172800000).toISOString(), // Anteayer
    cliente_final_nombre: "Juan Pérez (Particular)",
    cliente_final_email: "jperez@gmail.com",
    producto_nombre: "Juego de Llaves Allen Milimétricas",
    cantidad: 1,
    estatus_revendedor: "conseguido",
  },
  {
    id: "4",
    creado_el: new Date(Date.now() - 250000000).toISOString(), // Hace días
    cliente_final_nombre: "Taller Mecánico Rapid",
    cliente_final_email: "taller@rapid.com",
    producto_nombre: "Gato Hidráulico 3 Toneladas",
    cantidad: 2,
    estatus_revendedor: "rechazado",
  },
];

// --- TYPES & CONFIGURATION ---

type SolicitudCliente = {
  id: string;
  creado_el: string;
  cliente_final_nombre: string;
  cliente_final_email: string;
  producto_nombre: string;
  cantidad: number;
  estatus_revendedor: SolicitudStatus;
};

type SolicitudStatus = "nuevo" | "revisando" | "consultado_proveedor" | "conseguido" | "rechazado";

// Configuración Centralizada de Estados (Catify Prime Colors)
const STATUS_CONFIG: Record<SolicitudStatus, { label: string; color: string; icon: any }> = {
  nuevo: {
    label: "Nuevo",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  },
  revisando: {
    label: "Revisando",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200", // Action Color
    icon: Search,
  },
  consultado_proveedor: {
    label: "En Red L1",
    color: "bg-violet-50 text-violet-700 border-violet-200", // Network Color
    icon: Send,
  },
  conseguido: {
    label: "Conseguido",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200", // Sales/Money Color
    icon: CheckCircle2,
  },
  rechazado: {
    label: "No Disponible",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

// --- MAIN COMPONENT ---

export function RevendedorRequestsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<SolicitudCliente[]>([]);

  const fetchSolicitudes = async () => {
    if (!user) return;
    setLoading(true);

    // SIMULACIÓN DE LLAMADA A SUPABASE
    // En producción: descomentar la lógica real
    try {
      /* const { data, error } = await supabase
        .from("vista_solicitudes_revendedor")
        .select("*")
        .eq("revendedor_id", user.id)
        .order("creado_el", { ascending: false });
      if (error) throw error;
      setSolicitudes(data as any);
      */

      // Mock delay
      setTimeout(() => {
        setSolicitudes(MOCK_DATA);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error fetching:", err);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No pudimos cargar el radar de mercado.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: SolicitudStatus) => {
    // Optimistic UI Update
    const originalData = [...solicitudes];
    setSolicitudes((prev) => prev.map((item) => (item.id === id ? { ...item, estatus_revendedor: newStatus } : item)));

    try {
      /*
      const { error } = await supabase
        .from("solicitudes_mercado")
        .update({ estatus_revendedor: newStatus })
        .eq("id", id);
      if (error) throw error;
      */

      // Simulación de éxito
      toast({
        title: "Estatus actualizado",
        description: `La solicitud ahora está en: ${STATUS_CONFIG[newStatus].label}`,
        className: "bg-emerald-50 border-emerald-200 text-emerald-800",
      });
    } catch (err) {
      setSolicitudes(originalData); // Revert on error
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "Inténtalo de nuevo.",
      });
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent sm:bg-white sm:border sm:shadow-sm w-full">
      <CardHeader className="px-0 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <Radar className="mr-2 h-6 w-6 text-violet-600" />
              Radar de Mercado
            </CardTitle>
            <CardDescription className="mt-1 text-slate-500">
              Productos solicitados que no estaban en catálogo.
            </CardDescription>
          </div>
          <Button
            onClick={fetchSolicitudes}
            variant="outline"
            size="sm"
            className="h-9 bg-white border-slate-200 text-slate-600 w-full sm:w-auto"
          >
            <Clock className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0 sm:px-6">
        {loading ? (
          <DashboardSkeleton />
        ) : solicitudes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Mobile View: Card Stack */}
            <div className="md:hidden space-y-4">
              <AnimatePresence>
                {solicitudes.map((item) => (
                  <MobileRequestCard key={item.id} item={item} onStatusChange={handleStatusChange} />
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop View: High Density Table */}
            <div className="hidden md:block rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[250px]">Producto Solicitado</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((item) => (
                    <DesktopRequestRow key={item.id} item={item} onStatusChange={handleStatusChange} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// --- SUB-COMPONENTS ---

function MobileRequestCard({ item, onStatusChange }: { item: SolicitudCliente; onStatusChange: any }) {
  const statusConfig = STATUS_CONFIG[item.estatus_revendedor] || STATUS_CONFIG.nuevo;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.producto_nombre}</h4>
          <span className="text-xs font-medium text-slate-400">Cant: {item.cantidad} u.</span>
        </div>
        <Badge variant="outline" className={`${statusConfig.color} px-2 py-1 h-7`}>
          <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
        <div className="flex items-center text-slate-700 font-medium mb-1">{item.cliente_final_nombre}</div>
        <div className="text-slate-500 text-xs truncate">{item.cliente_final_email}</div>
        <div className="mt-2 text-xs text-slate-400 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {format(new Date(item.creado_el), "dd MMM, HH:mm")}
        </div>
      </div>

      <div className="grid grid-cols-1">
        <StatusActionDropdown
          currentStatus={item.estatus_revendedor}
          onChange={(s: any) => onStatusChange(item.id, s)}
          isMobile={true}
        />
      </div>
    </motion.div>
  );
}

function DesktopRequestRow({ item, onStatusChange }: { item: SolicitudCliente; onStatusChange: any }) {
  const statusConfig = STATUS_CONFIG[item.estatus_revendedor] || STATUS_CONFIG.nuevo;
  const StatusIcon = statusConfig.icon;

  return (
    <TableRow className="hover:bg-slate-50/50">
      <TableCell className="font-medium text-slate-900">
        <div className="flex flex-col">
          <span>{item.producto_nombre}</span>
          <span className="text-xs text-slate-500">Cantidad: {item.cantidad}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm text-slate-700">{item.cliente_final_nombre}</span>
          <span className="text-xs text-slate-400">{item.cliente_final_email}</span>
        </div>
      </TableCell>
      <TableCell className="text-slate-500 text-sm">{format(new Date(item.creado_el), "dd MMM yyyy")}</TableCell>
      <TableCell>
        <Badge variant="outline" className={`${statusConfig.color} font-medium`}>
          <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <StatusActionDropdown
          currentStatus={item.estatus_revendedor}
          onChange={(s: any) => onStatusChange(item.id, s)}
        />
      </TableCell>
    </TableRow>
  );
}

function StatusActionDropdown({ currentStatus, onChange, isMobile }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isMobile ? "default" : "ghost"}
          size={isMobile ? "lg" : "icon"}
          className={isMobile ? "w-full bg-slate-900 text-white hover:bg-slate-800" : "h-8 w-8"}
        >
          {isMobile ? (
            <span className="flex items-center">
              Gestionar Solicitud <MoreHorizontal className="ml-2 h-4 w-4" />
            </span>
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onChange(key)}
            className={`cursor-pointer ${key === currentStatus ? "bg-slate-100" : ""}`}
          >
            <config.icon className={`mr-2 h-4 w-4 ${key === currentStatus ? "text-indigo-600" : "text-slate-500"}`} />
            <span className={key === currentStatus ? "font-medium text-indigo-700" : ""}>
              Marcar como {config.label}
            </span>
            {key === currentStatus && <CheckCircle2 className="ml-auto h-4 w-4 text-indigo-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- LOADING & EMPTY STATES ---

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-4 py-4 px-2 border-b">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-[120px]" />
            <Skeleton className="h-8 w-8 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <PackageSearch className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Todo cubierto</h3>
      <p className="text-sm text-slate-500 max-w-xs mt-1">
        Tus clientes están encontrando todo lo que buscan. Las solicitudes fallidas aparecerán aquí.
      </p>
    </div>
  );
}
