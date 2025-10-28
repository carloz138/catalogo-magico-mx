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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ActivatedCatalogInfo {
  id: string;
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
    console.log('🔍 Fetching activated catalogs for user:', user.id);
    
    // PASO 1: Obtener catálogos replicados del usuario
    const { data: replicatedCatalogs, error: replicaError } = await supabase
      .from("replicated_catalogs")
      .select(`
        id,
        activated_at,
        original_catalog_id,
        distributor_id
      `)
      .eq("reseller_id", user.id)
      .eq("is_active", true)
      .order("activated_at", { ascending: false });

    if (replicaError) {
      console.error('❌ Error fetching replicated catalogs:', replicaError);
      throw replicaError;
    }

    if (!replicatedCatalogs || replicatedCatalogs.length === 0) {
      console.log('ℹ️ No replicated catalogs found');
      setCatalogs([]);
      return;
    }

    console.log('✅ Replicated catalogs found:', replicatedCatalogs.length);

    // PASO 2: Obtener datos relacionados manualmente
    const catalogsWithDetails = await Promise.all(
      replicatedCatalogs.map(async (catalog) => {
        // Obtener catálogo original
        const { data: originalCatalog } = await supabase
          .from('digital_catalogs')
          .select('id, name, slug')
          .eq('id', catalog.original_catalog_id)
          .single();

        // Obtener datos del distribuidor (proveedor)
        const { data: distributor } = await supabase
          .from('users')
          .select('id, full_name, business_name')
          .eq('id', catalog.distributor_id)
          .single();

        return {
          id: catalog.id,
          activated_at: catalog.activated_at,
          original_catalog_name: originalCatalog?.name || 'Catálogo Desconocido',
          distributor_name: 
            distributor?.business_name || 
            distributor?.full_name || 
            'Proveedor Desconocido',
        };
      })
    );

    console.log('📊 Catalogs with details:', catalogsWithDetails);
    setCatalogs(catalogsWithDetails);
    
  } catch (err: any) {
    console.error("Error fetching activated catalogs:", err);
    setError(err.message || "No se pudo cargar tus catálogos activados.");
  } finally {
    setLoading(false);
  }
};

  const handleViewDashboard = (catalogId: string) => {
    navigate(`/dashboard/reseller?catalog_id=${catalogId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Cargando catálogos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (catalogs.length === 0) {
    // No mostrar nada si no tiene catálogos, el MainDashboard decidirá qué mostrar
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5 text-blue-600" /> 
          Mis Catálogos de Proveedor
        </CardTitle>
        <CardDescription>
          Catálogos que has activado de tus proveedores
        </CardDescription>
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
                <TableRow key={catalog.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {catalog.original_catalog_name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {catalog.distributor_name}
                  </TableCell>
                  <TableCell>
                    {catalog.activated_at 
                      ? format(new Date(catalog.activated_at), "d MMM yyyy", { locale: es })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDashboard(catalog.id)}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600"
                    >
                      Gestionar 
                      <ArrowRight className="ml-2 h-4 w-4" />
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