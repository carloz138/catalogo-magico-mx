import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageDropzone } from '@/components/bulk-upload/ImageDropzone';
import { CSVUploader } from '@/components/bulk-upload/CSVUploader';
import { MatchingTable } from '@/components/bulk-upload/MatchingTable';
import { UploadProgress } from '@/components/bulk-upload/UploadProgress';
import { useBulkUploadMatching } from '@/hooks/useBulkUploadMatching';
import { CSVProduct, ImageFile, UploadProgress as UploadProgressType } from '@/types/bulk-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { bulkUploadSchema } from '@/lib/validation/bulk-upload-schemas';

export default function BulkUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { matches, processMatches, getStats, cleanFileName } = useBulkUploadMatching();

  const [images, setImages] = useState<ImageFile[]>([]);
  const [csvProducts, setCSVProducts] = useState<CSVProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleImagesSelected = (newImages: ImageFile[]) => {
    const processedImages = newImages.map(img => ({
      ...img,
      cleanName: cleanFileName(img.file.name)
    }));
    setImages(processedImages);
    
    if (csvProducts.length > 0) {
      processMatches(processedImages, csvProducts);
    }
  };

  const handleCSVParsed = (products: CSVProduct[]) => {
    setCSVProducts(products);
    
    if (images.length > 0) {
      processMatches(images, products);
    }
  };

  const uploadToSupabase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión",
        variant: "destructive"
      });
      return;
    }

    // Validar batch completo antes de subir
    const validation = bulkUploadSchema.safeParse({
      images: images.map(i => i.file),
      products: csvProducts
    });

    if (!validation.success) {
      const errors = validation.error.issues.map(issue => issue.message);
      setValidationErrors(errors);
      toast({
        title: "Errores de validación",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    // Limpiar errores previos
    setValidationErrors([]);

    const matchedProducts = matches.filter(m => m.csvData !== null);
    if (matchedProducts.length === 0) {
      toast({
        title: "Sin productos para subir",
        description: "No hay productos con match válido",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress({
      total: matchedProducts.length,
      uploaded: 0,
      failed: 0,
      current: ''
    });

    let uploaded = 0;
    let failed = 0;

    for (const match of matchedProducts) {
      if (!match.csvData) continue;

      setUploadProgress(prev => prev ? {
        ...prev,
        current: match.csvData!.nombre
      } : null);

      try {
        // Upload main image
        const timestamp = Date.now();
        const mainImagePath = `${user.id}/${timestamp}_${match.image.file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(mainImagePath, match.image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(mainImagePath);

        // Upload secondary images if any
        const secondaryUrls: string[] = [];
        if (match.secondaryImages) {
          for (const secImg of match.secondaryImages) {
            const secPath = `${user.id}/${timestamp}_${secImg.file.name}`;
            await supabase.storage
              .from('product-images')
              .upload(secPath, secImg.file);
            
            const { data: { publicUrl: secUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(secPath);
            
            secondaryUrls.push(secUrl);
          }
        }

        // Insert product
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: match.csvData.nombre,
            sku: match.csvData.sku,
            price_retail: parseInt(match.csvData.precio),
            description: match.csvData.descripcion || null,
            category: match.csvData.categoria || null,
            original_image_url: publicUrl,
            processing_status: 'pending',
            processed_images: secondaryUrls.length > 0 ? { secondary: secondaryUrls } : null
          });

        if (insertError) throw insertError;

        uploaded++;
      } catch (error) {
        console.error('Error uploading product:', match.csvData.nombre, error);
        failed++;
      }

      setUploadProgress(prev => prev ? {
        ...prev,
        uploaded,
        failed
      } : null);
    }

    setUploading(false);
    
    toast({
      title: "Carga completada",
      description: `${uploaded} productos subidos exitosamente${failed > 0 ? `, ${failed} fallidos` : ''}`,
    });

    if (uploaded > 0) {
      setTimeout(() => navigate('/products'), 2000);
    }
  };

  const stats = getStats();
  const canUpload = stats.matched > 0 && !uploading;

  return (
    <AppLayout
      title="Carga Masiva de Productos"
      subtitle="Sube múltiples productos con imágenes y datos CSV"
    >
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Productos
        </Button>

        {/* Statistics */}
        {matches.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.matched}</p>
                  <p className="text-sm text-muted-foreground">Matcheados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats.unmatched}</p>
                  <p className="text-sm text-muted-foreground">Sin Match</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{images.length}</p>
                  <p className="text-sm text-muted-foreground">Imágenes</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.withSecondary}</p>
                  <p className="text-sm text-muted-foreground">Multi-imagen</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Upload Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">1. Sube las Imágenes</h3>
            <ImageDropzone images={images} onImagesSelected={handleImagesSelected} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">2. Sube el CSV</h3>
            <CSVUploader csvProducts={csvProducts} onCSVParsed={handleCSVParsed} />
          </Card>
        </div>

        {/* Matching Results */}
        {matches.length > 0 && (
          <Card className="p-6">
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errores de validación</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">3. Revisa los Matches</h3>
              <Button
                onClick={uploadToSupabase}
                disabled={!canUpload || validationErrors.length > 0}
                className="bg-gradient-to-r from-primary to-purple-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir {stats.matched} Producto{stats.matched !== 1 ? 's' : ''}
              </Button>
            </div>

            {stats.unmatched > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {stats.unmatched} imagen{stats.unmatched !== 1 ? 'es' : ''} no encontró match. 
                  Verifica los nombres de archivo o el contenido del CSV.
                </AlertDescription>
              </Alert>
            )}

            <MatchingTable matches={matches} />
          </Card>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <Card className="p-6">
            <UploadProgress progress={uploadProgress} />
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
