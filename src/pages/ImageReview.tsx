
import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileImage, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ProcessedImage {
  id: string;
  original_url: string;
  processed_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  product_name: string;
  created_at: string;
}

const ImageReview = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadProcessedImages();
  }, [user]);

  const loadProcessedImages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // This would be a call to get processed images from your database
      // For now, using mock data
      const mockImages: ProcessedImage[] = [
        {
          id: '1',
          original_url: '/placeholder.svg',
          processed_url: '/placeholder.svg',
          status: 'completed',
          product_name: 'Producto de ejemplo 1',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          original_url: '/placeholder.svg',
          processed_url: null,
          status: 'processing',
          product_name: 'Producto de ejemplo 2',
          created_at: new Date().toISOString(),
        }
      ];
      
      setImages(mockImages);
    } catch (error) {
      console.error('Error loading processed images:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes procesadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image => {
    return filterStatus === 'all' || image.status === filterStatus;
  });

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAllImages = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredImages.map(img => img.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw, text: 'Pendiente' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, text: 'Procesando' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completado' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Error' },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`} variant="outline">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="processing">Procesando</option>
          <option value="completed">Completado</option>
          <option value="failed">Error</option>
        </select>
      </div>
      
      {selectedImages.length > 0 && (
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Descargar ({selectedImages.length})
        </Button>
      )}
      
      <Button onClick={loadProcessedImages} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Actualizar
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
              <p className="text-neutral/60">Cargando imágenes...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        {images.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay imágenes procesadas
              </h3>
              <p className="text-gray-600 mb-4">
                Las imágenes que subas aparecerán aquí una vez procesadas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Selection controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedImages.length === filteredImages.length && filteredImages.length > 0}
                      onCheckedChange={selectAllImages}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedImages.length} de {filteredImages.length} imágenes seleccionadas
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={image.processed_url || image.original_url}
                        alt={image.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onCheckedChange={() => toggleImageSelection(image.id)}
                        className="bg-white"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(image.status)}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 truncate">{image.product_name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(image.created_at).toLocaleDateString('es-ES')}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      {image.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default ImageReview;
