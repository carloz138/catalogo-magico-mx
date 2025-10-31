// src/components/reseller/ResellerCatalogsSection.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Rocket, 
  ExternalLink, 
  Edit, 
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReplicatedCatalog {
  id: string;
  original_catalog_id: string;
  quote_id: string;
  is_active: boolean;
  reseller_email: string;
  activation_token: string;
  activated_at: string | null;
  created_at: string;
  original_catalog: {
    name: string;
    slug: string;
  };
}

export function ResellerCatalogsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [catalogs, setCatalogs] = useState<ReplicatedCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadReplicatedCatalogs();
    }
  }, [user]);

  const loadReplicatedCatalogs = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('replicated_catalogs')
        .select(`
          id,
          original_catalog_id,
          quote_id,
          is_active,
          reseller_email,
          activation_token,
          activated_at,
          created_at,
          digital_catalogs!replicated_catalogs_original_catalog_id_fkey (
            name,
            slug
          )
        `)
        .eq('reseller_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedData = (data || []).map(item => ({
        ...item,
        original_catalog: item.digital_catalogs as any
      }));

      setCatalogs(transformedData);
    } catch (error: any) {
      console.error('Error loading replicated catalogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (catalogId: string, quoteId: string) => {
    if (!user) return;

    setActivating(catalogId);
    try {
      const { data, error } = await supabase
        .from('replicated_catalogs')
        .update({
          is_active: true,
          reseller_id: user.id,
          activated_at: new Date().toISOString(),
        })
        .eq('id', catalogId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🎉 ¡Catálogo activado!",
        description: "Ya puedes empezar a vender estos productos a tus clientes.",
      });

      // Recargar catálogos
      loadReplicatedCatalogs();

      // Opcional: navegar al catálogo
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error activating catalog:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo activar el catálogo",
        variant: "destructive",
      });
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (catalogs.length === 0) {
    return null; // No mostrar nada si no hay catálogos replicados
  }

  const pendingCatalogs = catalogs.filter(c => !c.is_active);
  const activeCatalogs = catalogs.filter(c => c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">🤝 Catálogos para Revender</h2>
      </div>

      {/* Catálogos pendientes de activar */}
      {pendingCatalogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pendientes de Activar ({pendingCatalogs.length})
          </h3>
          
          {pendingCatalogs.map((catalog) => (
            <Alert 
              key={catalog.id} 
              className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
            >
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="ml-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-yellow-900 mb-1">
                      {catalog.original_catalog?.name || 'Catálogo'}
                    </h4>
                    <p className="text-yellow-800 text-sm">
                      Este catálogo está listo para que empieces a vender. Actívalo ahora para acceder a todos los productos.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/quotes/${catalog.quote_id}`)}
                    >
                      Ver Cotización
                    </Button>
                    <Button
                      onClick={() => handleActivate(catalog.id, catalog.quote_id)}
                      disabled={activating === catalog.id}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {activating === catalog.id ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Activando...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 h-5 w-5" />
                          Activar Catálogo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Catálogos activos */}
      {activeCatalogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Activos ({activeCatalogs.length})
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCatalogs.map((catalog) => (
              <Card key={catalog.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">
                      {catalog.original_catalog?.name || 'Catálogo'}
                    </span>
                    <Badge className="bg-green-100 text-green-700">
                      Activo
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Activado el {new Date(catalog.activated_at!).toLocaleDateString('es-MX')}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`/c/${catalog.activation_token}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Catálogo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/reseller/edit-prices?catalog=${catalog.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
