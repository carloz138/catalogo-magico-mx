import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Radar, Users, MoreHorizontal, Check, Clock, Package } from "lucide-react";

// Tipos para los datos
type RadarAgregado = {
  producto_nombre: string;
  producto_marca: string | null;
  total_solicitudes: number;
  total_cantidad: number;
  estatus_fabricante: string;
};

type ConsultaDeRed = {
  id: string;
  creado_el: string;
  producto_nombre: string;
  cantidad: number;
  estatus_fabricante: string;
  // Añadir más campos si es necesario, ej. revendedor_id
};

export function FabricanteRadarDashboard() {
  const { user } = useAuth();
  const [loadingRadar, setLoadingRadar] = useState(true);
  const [loadingConsultas, setLoadingConsultas] = useState(true);
  const [radarData, setRadarData] = useState<RadarAgregado[]>([]);
  const [consultasData, setConsultasData] = useState<ConsultaDeRed[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchRadarAgregado() {
    if (!user) return;
    setLoadingRadar(true);
    try {
      const { data, error } = await supabase.rpc('get_radar_agregado', {
        user_id_param: user.id
      });
      if (error) throw error;
      setRadarData(data as RadarAgregado[]);
    } catch (err: any) {
      setError("Error al cargar el radar de mercado.");
    } finally {
      setLoadingRadar(false);
    }
  }

  async function fetchConsultasDeRed() {
    if (!user) return;
    setLoadingConsultas(true);
    try {
      const { data, error } = await supabase
        .from('vista_radar_fabricante')
        .select('id, creado_el, producto_nombre, cantidad, estatus_fabricante')
        .eq('fabricante_id', user.id)
        .eq('estatus_revendedor', 'consultado_proveedor') // Solo las que el L2 escaló
        .order('creado_el', { ascending: false });
        
      if (error) throw error;
      setConsultasData(data as ConsultaDeRed[]);
    } catch (err: any) {
      setError("Error al cargar las consultas de la red.");
    } finally {
      setLoadingConsultas(false);
    }
  }

  useEffect(() => {
    fetchRadarAgregado();
    fetchConsultasDeRed();
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('solicitudes_mercado')
        .update({ estatus_fabricante: newStatus })
        .eq('id', id)
        .eq('fabricante_id', user.id); // RLS lo protege, pero es buena práctica
      
      if (error) throw error;
      
      // Actualizar estado local para reflejar el cambio
      fetchRadarAgregado();
      fetchConsultasDeRed();
    } catch (err: any) {
      console.error("Error updating status:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'nuevo': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Nuevo</Badge>;
      case 'en_analisis': return <Badge variant="default" className="bg-blue-500">En Análisis</Badge>;
      case 'agregado_al_catalogo': return <Badge variant="default" className="bg-green-600"><Check className="mr-1 h-3 w-3" />Agregado</Badge>;
      case 'ignorado': return <Badge variant="destructive">Ignorado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inteligencia de Demanda</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="radar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="radar"><Radar className="mr-2 h-4 w-4" />Radar de Mercado</TabsTrigger>
            <TabsTrigger value="consultas"><Users className="mr-2 h-4 w-4" />Consultas de Red</TabsTrigger>
          </TabsList>
          
          <TabsContent value="radar" className="mt-4">
            {loadingRadar ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <RenderTableRadar data={radarData} onStatusChange={handleStatusChange} getStatusBadge={getStatusBadge} />
            )}
          </TabsContent>
          
          <TabsContent value="consultas" className="mt-4">
            {loadingConsultas ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <RenderTableConsultas data={consultasData} onStatusChange={handleStatusChange} getStatusBadge={getStatusBadge} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Componente para renderizar la tabla de Radar Agregado (optimizado para móvil)
function RenderTableRadar({ data, onStatusChange, getStatusBadge }: any) {
  if (data.length === 0) return <p className="text-center text-muted-foreground py-4">No hay solicitudes agregadas.</p>;

  return (
    <div>
      {/* Vista Móvil (lista de tarjetas) */}
      <div className="md:hidden space-y-3">
        {data.map((item: RadarAgregado, idx: number) => (
          <Card key={idx} className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{item.producto_nombre}</h4>
                  <p className="text-sm text-muted-foreground">{item.producto_marca || 'Sin marca'}</p>
                </div>
                {getStatusBadge(item.estatus_fabricante)}
              </div>
              <div className="flex justify-between items-end mt-4">
                <div className="text-sm">
                  <p><strong>{item.total_solicitudes}</strong> solicitudes</p>
                  <p><strong>{item.total_cantidad}</strong> pzas. total</p>
                </div>
                {/* Asumimos que no se puede cambiar estatus en la vista agregada, o es más complejo */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Vista Desktop (tabla) */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Total Solicitudes</TableHead>
              <TableHead>Total Cantidad</TableHead>
              <TableHead>Estatus</TableHead>
              {/* <TableHead>Acción</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: RadarAgregado, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.producto_nombre}</TableCell>
                <TableCell>{item.producto_marca || '-'}</TableCell>
                <TableCell>{item.total_solicitudes}</TableCell>
                <TableCell>{item.total_cantidad}</TableCell>
                <TableCell>{getStatusBadge(item.estatus_fabricante)}</TableCell>
                {/* El cambio de estatus en la vista agregada es complejo, 
                    se debería hacer en la vista "Consultas" o en un panel de detalle */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Componente para renderizar la tabla de Consultas de Red (optimizado para móvil)
function RenderTableConsultas({ data, onStatusChange, getStatusBadge }: any) {
  if (data.length === 0) return <p className="text-center text-muted-foreground py-4">No hay consultas activas de tu red.</p>;

  return (
    <div>
      {/* Vista Móvil (lista de tarjetas) */}
      <div className="md:hidden space-y-3">
        {data.map((item: ConsultaDeRed) => (
          <Card key={item.id} className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{item.producto_nombre}</h4>
                  <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                  <p className="text-xs text-muted-foreground">ID Revendedor: {item.id.substring(0, 8)}...</p>
                </div>
                <StatusDropdown item={item} onStatusChange={onStatusChange} getStatusBadge={getStatusBadge} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vista Desktop (tabla) */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: ConsultaDeRed) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.producto_nombre}</TableCell>
                <TableCell>{item.cantidad}</TableCell>
                <TableCell>{getStatusBadge(item.estatus_fabricante)}</TableCell>
                <TableCell className="text-right">
                  <StatusDropdown item={item} onStatusChange={onStatusChange} getStatusBadge={getStatusBadge} isDesktop={true} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Dropdown para cambiar el estatus (L1)
function StatusDropdown({ item, onStatusChange, getStatusBadge, isDesktop = false }: any) {
  const statuses = [
    { value: 'nuevo', label: 'Nuevo', icon: <Clock className="mr-2 h-4 w-4" /> },
    { value: 'en_analisis', label: 'En Análisis', icon: <Radar className="mr-2 h-4 w-4" /> },
    { value: 'agregado_al_catalogo', label: 'Agregado al Catálogo', icon: <Package className="mr-2 h-4 w-4" /> },
    { value: 'ignorado', label: 'Ignorado', icon: <AlertCircle className="mr-2 h-4 w-4" /> },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isDesktop ? (
          <Button variant="ghost" size="sm">
            Cambiar Estatus <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          getStatusBadge(item.estatus_fabricante)
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
