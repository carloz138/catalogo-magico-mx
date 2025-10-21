import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, Package, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface ActivatedCatalogInfo {
  id: string; // ID of the replicated catalog
  activated_at: string | null;
  distributor_name: string | null;
  original_catalog_name: string | null;
}

export function MyActivatedCatalogsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<ActivatedCatalogInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchActivatedCatalogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchActivatedCatalogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('replicated_catalogs')
        .select(`
          id,
          activated_at,
          original_catalog:digital_catalogs!replicated_catalogs_original_catalog_id_fkey(name),
          distributor:users!replicated_catalogs_distributor_id_fkey(full_name, business_name) 
        `)
        .eq('reseller_id', user.id)
        .eq('is_active', true)
        .order('activated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedData = data?.map(item => ({
        id: item.id,
        activated_at: item.activated_at,
        original_catalog_name: (item.original_catalog as any)?.name || 'Catálogo Desconocido',
        distributor_name: (item.distributor as any)?.business_name || (item.distributor as any)?.full_name || 'Proveedor Desconocido',
      })) || [];

      setCatalogs(mappedData);

    } catch (err: any) {
      console.error("Error fetching activated catalogs:", err);
      setError("No se pudo cargar tus catálogos activados.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDashboard = (catalogId: string) => {
    navigate(`/dashboard/reseller?catalog_id=${catalogId}`);
  };

  if (loading) {
    return <Card><CardContent className="pt-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><CardTitle>Error</CardTitle><CardDescription>{error}</CardDescription></Alert>;
  }
  
  if (catalogs.length === 0) {
    // No mostrar nada si no tiene catálogos de este tipo, el MainDashboard decidirá si mostrar otras cosas.
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Package className="mr-2 h-5 w-5" /> Mis Catálogos de Proveedor (Activados)</CardTitle>
        <CardDescription>Estos son los catálogos que has activado de tus proveedores.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Catálogo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha de Activación</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogs.map((catalog) => (
                <TableRow key={catalog.id}>
                  <TableCell className="font-medium">{catalog.original_catalog_name}</TableCell>
                  <TableCell>{catalog.distributor_name}</TableCell>
                  <TableCell>
                    {catalog.activated_at ? format(new Date(catalog.activated_at), "d MMM yyyy", { locale: es }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                     <Button variant="outline" size="sm" onClick={() => handleViewDashboard(catalog.id)}>
                         Gestionar <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
