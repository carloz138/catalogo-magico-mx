import { useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CSVProduct } from '@/types/bulk-upload';
import { useToast } from '@/hooks/use-toast';

interface CSVUploaderProps {
  onCSVParsed: (products: CSVProduct[]) => void;
  csvProducts: CSVProduct[];
}

export const CSVUploader = ({ onCSVParsed, csvProducts }: CSVUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const products = results.data as CSVProduct[];
        
        // Validate required fields
        const hasRequiredFields = products.every(p => p.sku && p.nombre && p.precio);
        
        if (!hasRequiredFields) {
          toast({
            title: "Error en CSV",
            description: "El CSV debe contener las columnas: sku, nombre, precio",
            variant: "destructive"
          });
          return;
        }

        onCSVParsed(products);
        toast({
          title: "CSV cargado",
          description: `${products.length} productos encontrados`,
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

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
        <pre className="text-xs">
          sku,nombre,precio,descripcion,categoria
          PROD001,Camisa Azul M,299,Camisa de algodón,ropa
          PROD002,Zapatos Negros 42,899,Zapatos de cuero,calzado
        </pre>
      </div>
    </div>
  );
};
