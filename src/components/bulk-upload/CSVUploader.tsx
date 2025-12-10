import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CSVProduct } from '@/types/bulk-upload';
import { useToast } from '@/hooks/use-toast';
import { csvFileSchema, csvProductSchema } from '@/lib/validation/bulk-upload-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateCSVTemplate } from '@/lib/csv-template';

interface CSVUploaderProps {
  onCSVParsed: (products: CSVProduct[]) => void;
  csvProducts: CSVProduct[];
}

export const CSVUploader = ({ onCSVParsed, csvProducts }: CSVUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo CSV
    const fileValidation = csvFileSchema.safeParse(file);
    if (!fileValidation.success) {
      const errorMessage = fileValidation.error.issues[0]?.message || 'Archivo CSV inválido';
      toast({
        title: "Error en archivo CSV",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Normalizar headers a minúsculas
        const normalizedProducts = (results.data as any[]).map(row => {
          const normalized: any = {};
          Object.keys(row).forEach(key => {
            normalized[key.toLowerCase().trim()] = row[key];
          });
          return normalized;
        });
        
        // Validar cada producto
        const validProducts: CSVProduct[] = [];
        const invalidProducts: { product: any; errors: string[] }[] = [];
        
        normalizedProducts.forEach((product, index) => {
          const validation = csvProductSchema.safeParse(product);
          
          if (validation.success) {
            validProducts.push(validation.data as CSVProduct);
          } else {
            const errors = validation.error.issues.map(issue => issue.message);
            invalidProducts.push({ product, errors });
          }
        });

        // Si todos son inválidos, no continuar
        if (validProducts.length === 0) {
          toast({
            title: "Error en CSV",
            description: "Todos los productos tienen errores de validación",
            variant: "destructive"
          });
          setValidationErrors(invalidProducts.flatMap(ip => ip.errors));
          return;
        }

        // Si hay productos inválidos, mostrar resumen
        if (invalidProducts.length > 0) {
          const errorSummary = invalidProducts.reduce((acc, ip) => {
            ip.errors.forEach(error => {
              acc[error] = (acc[error] || 0) + 1;
            });
            return acc;
          }, {} as Record<string, number>);

          const errorMessages = Object.entries(errorSummary).map(
            ([error, count]) => `${count} con: ${error}`
          );

          setValidationErrors(errorMessages);
        } else {
          setValidationErrors([]);
        }

        // Llamar con productos válidos solamente
        onCSVParsed(validProducts);
        
        toast({
          title: "CSV cargado",
          description: invalidProducts.length > 0
            ? `${validProducts.length} productos válidos, ${invalidProducts.length} con errores`
            : `${validProducts.length} productos encontrados`,
          variant: invalidProducts.length > 0 ? "default" : "default"
        });
      },
      error: (error) => {
        toast({
          title: "Error al leer CSV",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  }, [onCSVParsed, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Descarga nuestro template para ver el formato exacto requerido.
                Las imágenes se optimizan automáticamente a WebP.
              </p>
        <Button
          variant="outline"
          size="sm"
          onClick={generateCSVTemplate}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Descargar Template CSV
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errores de validación en CSV</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {csvProducts.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Sube tu archivo CSV</p>
          <p className="text-sm text-muted-foreground mb-3">
            Formato: sku, nombre, precio, descripcion, categoria
          </p>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar CSV
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{csvProducts.length} productos en CSV</p>
                <p className="text-sm text-muted-foreground">
                  Listo para matching con imágenes
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Cambiar CSV
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded border">
        <p className="font-medium mb-1">Ejemplo de CSV válido:</p>
        <pre className="text-xs overflow-x-auto">
          sku,nombre,precio,precio_mayoreo,descripcion,categoria,tags,allow_backorder,lead_time_days
          PROD001,Camisa Azul M,299,250,Camisa de algodón,ropa,nuevo,false,0
          PROD002,Zapatos Negros 42,899,750,Zapatos de cuero,calzado,premium,true,14
        </pre>
        <p className="mt-2 text-muted-foreground">
          <strong>allow_backorder:</strong> true/false | <strong>lead_time_days:</strong> días de fabricación
        </p>
      </div>
    </div>
  );
};
