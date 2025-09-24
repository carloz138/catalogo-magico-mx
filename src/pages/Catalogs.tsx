
import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, Eye, FileText, Clock, CheckCircle, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Catalog {
  id: string;
  name: string;
  total_products: number;
  total_pages: number | null;
  file_size_bytes: number | null;
  credits_used: number;
  pdf_url: string | null;
  preview_image_url: string | null;
  template_style: string;
  created_at: string;
}

const getStatusFromCatalog = (catalog: Catalog) => {
  if (catalog.pdf_url) return 'completed';
  return 'processing';
};

const StatusBadge = ({ catalog }: { catalog: Catalog }) => {
  const status = getStatusFromCatalog(catalog);
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'processing':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" />, text: 'Procesando' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, text: 'Completado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3" />, text: 'Desconocido' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
      {config.icon}
      {config.text}
    </Badge>
  );
};

const CatalogCard = ({ catalog }: { catalog: Catalog }) => {
  const isCompleted = getStatusFromCatalog(catalog) === 'completed';
  
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        {catalog.preview_image_url ? (
          <img 
            src={catalog.preview_image_url} 
            alt={catalog.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText className="w-12 h-12 text-gray-400" />
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg truncate flex-1">{catalog.name}</h3>
          <StatusBadge catalog={catalog} />
        </div>
        
        <div className="text-sm text-gray-600 space-y-1 mb-4">
          <p>{catalog.total_products} productos</p>
          <p>{catalog.total_pages || 'N/A'} páginas</p>
          <p>{formatFileSize(catalog.file_size_bytes)}</p>
          <p className="text-xs">Creado: {formatDate(catalog.created_at)}</p>
        </div>
        
        <div className="flex gap-2">
          {isCompleted ? (
            <>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(catalog.pdf_url!, '_blank')}
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(catalog.pdf_url!, '_blank')}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Procesando...
            </Button>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          <p>Estilo: {catalog.template_style}</p>
          <p>Créditos usados: {catalog.credits_used}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const Catalogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCatalogs();
  }, [user]);

  // Auto-refresh cada 30 segundos para detectar catálogos completados
  useEffect(() => {
    const interval = setInterval(() => {
      if (catalogs.some(c => !c.pdf_url)) {
        fetchCatalogs();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [catalogs]);

  const fetchCatalogs = async (showRefreshing = false) => {
    if (!user) return;

    if (showRefreshing) setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📋 Catálogos obtenidos:', data?.map(c => ({
        id: c.id,
        name: c.name,
        has_pdf: !!c.pdf_url,
        pdf_url: c.pdf_url
      })));
      
      setCatalogs(data || []);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus catálogos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCatalogs(true);
    toast({
      title: "Actualizando",
      description: "Refrescando catálogos..."
    });
  };

  const actions = (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
      <Button onClick={() => navigate('/products')}>
        <Plus className="w-4 h-4 mr-2" />
        Crear nuevo catálogo
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando catálogos...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        {catalogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes catálogos creados
            </h3>
            <p className="text-gray-600 mb-4">
              Ve a tu biblioteca de productos y selecciona algunos para crear tu primer catálogo
            </p>
            <Button onClick={() => navigate('/products')}>
              Ver mi biblioteca
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogs.map(catalog => (
              <CatalogCard key={catalog.id} catalog={catalog} />
            ))}
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Catalogs;
