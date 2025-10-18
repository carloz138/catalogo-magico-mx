import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Users, MoreHorizontal, Check, Clock, Send, SearchCheck } from "lucide-react";

// Tipos para los datos
type SolicitudCliente = {
  id: string;
  creado_el: string;
  cliente_final_nombre: string;
  cliente_final_email: string;
  producto_nombre: string;
  cantidad: number;
  estatus_revendedor: string;
};

export function RevendedorRequestsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<SolicitudCliente[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchSolicitudes() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vista_solicitudes_revendedor' as any)
        .select('*')
        .eq('revendedor_id', user.id)
        .order('creado_el', { ascending: false });
        
      if (error) throw error;
      setSolicitudes(data as unknown as SolicitudCliente[]);
    } catch (err: any) {
      setError("Error al cargar las solicitudes de clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSolicitudes();
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('solicitudes_mercado' as any)
        .update({ estatus_revendedor: newStatus } as any)
        .eq('id', id)
        .eq('revendedor_id', user?.id);
      
      if (error) throw error;
      fetchSolicitudes();
    } catch (err: any) {
      console.error("Error updating status:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'nuevo': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Nuevo</Badge>;
      case 'revisando': return <Badge variant="default" className="bg-blue-500">Revisando</Badge>;
      case 'consultado_proveedor': return <Badge variant="default" className="bg-yellow-500 text-black"><Send className="mr-1 h-3 w-3" />Consultado</Badge>;
      case 'conseguido': return <Badge variant="default" className="bg-green-600"><Check className="mr-1 h-3 w-3" />Conseguido</Badge>;
      case 'rechazado': return <Badge variant="destructive">Rechazado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Solicitudes de mis Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <RenderTableSolicitudes data={solicitudes} onStatusChange={handleStatusChange} getStatusBadge={getStatusBadge} />
        )}
      </CardContent>
    </Card>
  );
}

// Componente para renderizar la tabla de Solicitudes de Clientes (optimizado para móvil)
function RenderTableSolicitudes({ data, onStatusChange, getStatusBadge }: any) {
  if (data.length === 0) return <p className="text-center text-muted-foreground py-4">No tienes solicitudes de clientes.</p>;

  return (
    <div>
      {/* Vista Móvil (lista de tarjetas) */}
      <div className="md:hidden space-y-3">
        {data.map((item: SolicitudCliente) => (
          <Card key={item.id} className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{item.producto_nombre}</h4>
                  <p className="text-sm text-muted-foreground">Cliente: {item.cliente_final_nombre}</p>
                  <p className="text-xs text-muted-foreground">Email: {item.cliente_final_email}</p>
                </div>
                <StatusDropdownL2 item={item} onStatusChange={onStatusChange} getStatusBadge={getStatusBadge} />
              </div>
              <p className="text-sm mt-2">Cantidad: <strong>{item.cantidad}</strong></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vista Desktop (tabla) */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: SolicitudCliente) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.cliente_final_nombre}</div>
                  <div className="text-xs text-muted-foreground">{item.cliente_final_email}</div>
                </TableCell>
                <TableCell className="font-medium">{item.producto_nombre}</TableCell>
                <TableCell>{item.cantidad}</TableCell>
                <TableCell>{getStatusBadge(item.estatus_revendedor)}</TableCell>
                <TableCell className="text-right">
                  <StatusDropdownL2 item={item} onStatusChange={onStatusChange} getStatusBadge={getStatusBadge} isDesktop={true} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Dropdown para cambiar el estatus (L2)
function StatusDropdownL2({ item, onStatusChange, getStatusBadge, isDesktop = false }: any) {
  const statuses = [
    { value: 'nuevo', label: 'Nuevo', icon: <Clock className="mr-2 h-4 w-4" /> },
    { value: 'revisando', label: 'Revisando', icon: <SearchCheck className="mr-2 h-4 w-4" /> },
    { value: 'consultado_proveedor', label: 'Consultar Proveedor', icon: <Send className="mr-2 h-4 w-4" /> },
    { value: 'conseguido', label: 'Conseguido', icon: <Check className="mr-2 h-4 w-4" /> },
    { value: 'rechazado', label: 'Rechazado', icon: <AlertCircle className="mr-2 h-4 w-4" /> },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isDesktop ? (
          <Button variant="ghost" size="sm">
            Gestionar <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          getStatusBadge(item.estatus_revendedor)
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isDesktop ? "end" : "start"}>
        {statuses.map(status => (
          <DropdownMenuItem key={status.value} onClick={() => onStatusChange(item.id, status.value)}>
            {status.icon}
            <span>{status.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
