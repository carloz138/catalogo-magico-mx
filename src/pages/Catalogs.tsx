import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  Share2, 
  Edit, 
  Trash2, 
  Plus, 
  Lock,
  Globe,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DigitalCatalogService } from '@/services/digital-catalog.service';
import { toast } from '@/hooks/use-toast';
import { useCatalogLimits } from '@/hooks/useCatalogLimits';
import { CatalogShareModal } from '@/components/catalog/CatalogShareModal';
import { DeleteCatalogDialog } from '@/components/catalog/DeleteCatalogDialog';
import { DigitalCatalog } from '@/types/digital-catalog';

const CatalogCard = ({ 
  catalog,
  onShare,
  onDelete
}: { 
  catalog: DigitalCatalog;
  onShare: (catalog: DigitalCatalog) => void;
  onDelete: (catalog: DigitalCatalog) => void;
}) => {
  const navigate = useNavigate();
  const isExpired = catalog.expires_at ? new Date(catalog.expires_at) < new Date() : false;
  const isActive = catalog.is_active && !isExpired;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewCatalog = () => {
    window.open(`/c/${catalog.slug}`, '_blank');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Imagen de portada */}
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
        <FileText className="w-16 h-16 text-primary/30 group-hover:scale-110 transition-transform" />
        <div className="absolute top-2 right-2 flex gap-1">
          {catalog.is_private && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur">
              <Lock className="w-3 h-3 mr-1" />
              Privado
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1">{catalog.name}</h3>
            <Badge variant={isActive ? "default" : "destructive"} className="shrink-0">
              {isActive ? 'Activo' : 'Expirado'}
            </Badge>
          </div>
          {catalog.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {catalog.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{catalog.view_count || 0}</span>
          </div>
          {catalog.is_private ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
        </div>

        {/* Dates */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Creado: {formatDate(catalog.created_at)}</span>
          </div>
          {catalog.expires_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className={isExpired ? 'text-destructive' : ''}>
                Expira: {formatDate(catalog.expires_at)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            onClick={handleViewCatalog}
            disabled={!isActive}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onShare(catalog)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/catalogs/${catalog.id}/edit`)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onDelete(catalog)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CatalogSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-video" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </CardContent>
  </Card>
);

const Catalogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shareModalCatalog, setShareModalCatalog] = useState<DigitalCatalog | null>(null);
  const [deleteCatalog, setDeleteCatalog] = useState<DigitalCatalog | null>(null);

  // Fetch catalog limits
  const { limits, loading: limitsLoading } = useCatalogLimits();

  // Fetch catalogs
  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ['digital-catalogs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await DigitalCatalogService.getUserCatalogs(user.id);
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      if (!user) throw new Error('No user');
      await DigitalCatalogService.deleteCatalog(catalogId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-catalogs'] });
      toast({
        title: 'Catálogo eliminado',
        description: 'El catálogo ha sido eliminado correctamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el catálogo',
        variant: 'destructive',
      });
    },
  });

  const handleCreateNew = () => {
    if (!limits?.canGenerate) {
      toast({
        title: 'Límite alcanzado',
        description: limits?.message || 'Has alcanzado el límite de catálogos',
        variant: 'destructive',
      });
      // TODO: Mostrar modal de upgrade
      return;
    }
    navigate('/catalogs/create');
  };

  const actions = (
    <div className="flex items-center gap-3">
      {!limitsLoading && limits && (
        <div className="text-sm text-muted-foreground">
          {limits.catalogsLimit === 'unlimited' 
            ? `${limits.catalogsUsed} catálogos creados`
            : `${limits.catalogsUsed} de ${limits.catalogsLimit} catálogos`
          }
        </div>
      )}
      <Button onClick={handleCreateNew} disabled={!limits?.canGenerate}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Nuevo Catálogo
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout actions={actions}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CatalogSkeleton key={i} />
            ))}
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Catálogos Digitales</h1>
            <p className="text-muted-foreground">
              Crea y comparte catálogos interactivos de tus productos
            </p>
          </div>

          {catalogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Aún no has creado ningún catálogo digital
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crea tu primer catálogo para compartir tus productos con clientes
              </p>
              <Button size="lg" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Crear mi primer catálogo
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogs.map(catalog => (
                <CatalogCard 
                  key={catalog.id} 
                  catalog={catalog}
                  onShare={setShareModalCatalog}
                  onDelete={setDeleteCatalog}
                />
              ))}
            </div>
          )}
        </div>

        {/* Share Modal */}
        <CatalogShareModal
          catalog={shareModalCatalog}
          open={!!shareModalCatalog}
          onOpenChange={(open) => !open && setShareModalCatalog(null)}
        />

        {/* Delete Dialog */}
        <DeleteCatalogDialog
          catalog={deleteCatalog}
          open={!!deleteCatalog}
          onOpenChange={(open) => !open && setDeleteCatalog(null)}
          onConfirm={() => {
            if (deleteCatalog) {
              deleteMutation.mutate(deleteCatalog.id);
              setDeleteCatalog(null);
            }
          }}
        />
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Catalogs;
