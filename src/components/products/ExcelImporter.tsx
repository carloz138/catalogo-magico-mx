import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PRODUCT_CATEGORIES } from "@/types/products";
import { toast } from "@/hooks/use-toast";

interface ExcelImporterProps {
  onImport: (data: any[], category: string) => Promise<void>;
  isImporting: boolean;
}

export const ExcelImporter = ({ onImport, isImporting }: ExcelImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Pre-leer para contar filas y mostrar preview
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (data.length === 0) {
            toast({ title: "El archivo está vacío", variant: "destructive" });
            return;
          }
          
          setPreviewCount(data.length);
          setIsDialogOpen(true);
        } catch (error) {
          console.error(error);
          toast({ title: "Error al leer el archivo", variant: "destructive" });
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !selectedCategory) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws);

      // Mapeo inteligente de columnas (Español/Inglés)
      const formattedData = jsonData.map((row: any) => ({
        name: row["Nombre"] || row["name"] || row["Producto"] || "Producto sin nombre",
        sku: row["SKU"] || row["sku"] || null,
        description: row["Descripción"] || row["description"] || null,
        // Convertir precio decimal a centavos para DB (ej: 150.50 -> 15050)
        price_retail: (row["Precio"] || row["price_retail"]) 
          ? Math.round(parseFloat(row["Precio"] || row["price_retail"]) * 100) 
          : 0,
        price_wholesale: (row["Mayoreo"] || row["price_wholesale"]) 
          ? Math.round(parseFloat(row["Mayoreo"] || row["price_wholesale"]) * 100) 
          : null,
        wholesale_min_qty: (row["Min Qty"] || row["wholesale_min_qty"]) 
          ? parseInt(row["Min Qty"] || row["wholesale_min_qty"]) 
          : null,
        // Manejo de Tags: separar por comas
        tags: (row["Tags"] || row["tags"]) 
          ? (row["Tags"] || row["tags"]).toString().split(",").map((t: string) => t.trim()) 
          : [],
        category: selectedCategory, // Asignamos la categoría seleccionada
      }));

      await onImport(formattedData, selectedCategory);
      
      // Reset
      setIsDialogOpen(false);
      setFile(null);
      setSelectedCategory("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />
        <Button
          variant="outline"
          className="border-dashed border-slate-300 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2" />}
            Importar Excel
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !isImporting && setIsDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Importar Productos
            </DialogTitle>
            <DialogDescription>
              Se encontraron <strong>{previewCount} productos</strong> en el archivo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>¿A qué categoría pertenecen?</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-indigo-200 focus:ring-indigo-500">
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                ⚠️ Esta categoría se asignará a todos los productos importados para asegurar compatibilidad con las variantes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isImporting}>
              Cancelar
            </Button>
            <Button 
                onClick={handleConfirmImport} 
                disabled={!selectedCategory || isImporting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Importando...
                </>
              ) : (
                "Confirmar Importación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
