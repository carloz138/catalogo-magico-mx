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
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { DuplicateWarning } from '@/components/bulk-upload/DuplicateWarning';
import { CSVProduct, ImageFile, UploadProgress as UploadProgressType } from '@/types/bulk-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { bulkUploadSchema } from '@/lib/validation/bulk-upload-schemas';
import { processBatchWithConcurrency } from '@/lib/concurrency-control';
import { batchInsert } from '@/lib/batch-processing';

export default function BulkUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { matches, processMatches, getStats, cleanFileName } = useBulkUploadMatching();
  const { duplicates, checkDuplicates, isChecking } = useDuplicateDetection();

  const [images, setImages] = useState<ImageFile[]>([]);
  const [csvProducts, setCSVProducts] = useState<CSVProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

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

    const matchedProducts = matches.filter(m => m.csvData !== null);
    if (matchedProducts.length === 0) {
      toast({
        title: "Sin productos para subir",
        description: "No hay productos con match válido",
        variant: "destructive"
      });
      return;
    }

    const validation = bulkUploadSchema.safeParse({
      images: images.map(i => i.file),
      products: csvProducts
    });

    if (!validation.success) {
      const errors = validation.error.issues.map(i => i.message);
      setValidationErrors(errors);
      toast({
        title: "Errores de validación",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    setValidationErrors([]);

    // Detectar duplicados
    const duplicateInfo = await checkDuplicates(csvProducts);
    
    if (duplicateInfo.length > 0 && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    // Si llegamos aquí, el usuario confirmó continuar
    setShowDuplicateWarning(false);

    // Filtrar productos duplicados
    const duplicateSkus = new Set(duplicateInfo.map(d => d.sku));
    const uniqueMatches = matchedProducts.filter(m => !duplicateSkus.has(m.csvData!.sku));

    if (uniqueMatches.length === 0) {
      toast({
        title: "Todos son duplicados",
        description: "Todos los productos ya existen en tu catálogo",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress({
      total: uniqueMatches.length,
      uploaded: 0,
      failed: 0,
      current: 'Subiendo imágenes...'
    });

    // FASE 1: Upload todas las imágenes primero
    const uploadedImages: Array<{
      match: typeof matchedProducts[0];
      mainImageUrl: string;
      secondaryUrls: string[];
    }> = [];

    const uploadImage = async (match: typeof matchedProducts[0], index: number) => {
      if (!match.csvData) throw new Error('No CSV data');

      const timestamp = Date.now();
      const mainImagePath = `${user.id}/${timestamp}_${match.image.file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(mainImagePath, match.image.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(mainImagePath);

      const secondaryUrls: string[] = [];
      if (match.secondaryImages && match.secondaryImages.length > 0) {
        for (const secImg of match.secondaryImages) {
          const secPath = `${user.id}/${timestamp}_${secImg.file.name}`;
          const { error: secError } = await supabase.storage
            .from('product-images')
            .upload(secPath, secImg.file);
          
          if (!secError) {
            const { data: { publicUrl: secUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(secPath);
            secondaryUrls.push(secUrl);
          }
        }
      }

      setUploadProgress(prev => prev ? {
        ...prev,
        uploaded: index + 1,
        current: `Subiendo imágenes... ${index + 1}/${matchedProducts.length}`
      } : null);

      return {
        match,
        mainImageUrl: publicUrl,
        secondaryUrls
      };
    };

    const { successful: successfulImages, failed: failedImages } = await processBatchWithConcurrency(
      uniqueMatches,
      uploadImage,
      3
    );

    uploadedImages.push(...successfulImages);

    if (uploadedImages.length === 0) {
      setUploading(false);
      toast({
        title: "Error",
        description: "No se pudo subir ninguna imagen",
        variant: "destructive"
      });
      return;
    }

    // FASE 2: Batch insert de productos
    setUploadProgress(prev => prev ? {
      ...prev,
      current: 'Guardando productos en base de datos...'
    } : null);

    const productsToInsert = uploadedImages.map(({ match, mainImageUrl, secondaryUrls }) => ({
      user_id: user.id,
      name: match.csvData!.nombre,
      sku: match.csvData!.sku,
      price_retail: parseInt(match.csvData!.precio),
      price_wholesale: match.csvData!.precio_mayoreo ? parseInt(match.csvData!.precio_mayoreo) : null,
      description: match.csvData!.descripcion || null,
      category: match.csvData!.categoria || null,
      original_image_url: mainImageUrl,
      processing_status: 'pending',
      processed_images: secondaryUrls.length > 0 ? { secondary: secondaryUrls } : null
    }));

    const { successful: insertedProducts, failed: failedInserts } = await batchInsert(
      'products',
      productsToInsert,
      500,
      supabase
    );

    setUploading(false);
    
    const totalFailed = failedImages.length + failedInserts.length;
    
    toast({
      title: "Carga completada",
      description: `${insertedProducts.length} productos subidos exitosamente${totalFailed > 0 ? `, ${totalFailed} fallidos` : ''}`,
    });

    if (insertedProducts.length > 0) {
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

        {/* Duplicate Warning */}
        {showDuplicateWarning && duplicates.length > 0 && (
          <DuplicateWarning
            duplicates={duplicates}
            onContinue={() => {
              setShowDuplicateWarning(false);
              uploadToSupabase();
            }}
            onCancel={() => {
              setShowDuplicateWarning(false);
              toast({
                title: "Carga cancelada",
                description: "Puedes modificar tu CSV y volver a intentar",
              });
            }}
          />
        )}

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
                disabled={!canUpload || validationErrors.length > 0 || isChecking}
                className="bg-gradient-to-r from-primary to-purple-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isChecking ? 'Verificando...' : `Subir ${stats.matched} Producto${stats.matched !== 1 ? 's' : ''}`}
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
