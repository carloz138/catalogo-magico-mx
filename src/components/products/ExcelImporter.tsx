import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PRODUCT_CATEGORIES } from "@/types/products";
import { toast } from "@/hooks/use-toast";

// Definimos la estructura de lo que esperamos del Excel procesado
export interface ImportedProductData {
  id?: string; // Opcional: si existe es update, si no es create
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  tags: string[];
  category: string;
}

interface ExcelImporterProps {
  onImport: (data: ImportedProductData[]) => Promise<void>; // Cambio en la firma
  onExportTemplate: () => void; // Nueva prop para bajar el template
  isImporting: boolean;
}

export const ExcelImporter = ({ onImport, onExportTemplate, isImporting }: ExcelImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState({ updates: 0, creates: 0, total: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ImportedProductData[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rawData = XLSX.utils.sheet_to_json(ws);

          if (rawData.length === 0) {
            toast({ title: "Archivo vacío", variant: "destructive" });
            return;
          }

          // Procesamos los datos preliminarmente para contar
          let updatesCount = 0;
          let createsCount = 0;

          const processed = rawData.map((row: any) => {
            // Buscamos el ID en varias posibles columnas
            const id = row["ID_SISTEMA (NO TOCAR)"] || row["id"] || row["ID"];

            if (id) updatesCount++;
            else createsCount++;

            // Mapeo básico (el real se hace al confirmar)
            return { raw: row, hasId: !!id };
          });

          setStats({
            updates: updatesCount,
            creates: createsCount,
            total: rawData.length,
          });

          setIsDialogOpen(true);
        } catch (error) {
          console.error(error);
          toast({ title: "Error al leer archivo", variant: "destructive" });
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws);

      const formattedData: ImportedProductData[] = jsonData.map((row: any) => {
        // Detectar ID
        const id = row["ID_SISTEMA (NO TOCAR)"] || row["id"] || row["ID"];

        // Detectar Categoría: Prioridad a la del Excel, si no, la seleccionada (solo para nuevos)
        // Nota: Mantenemos la lógica de forzar categoria seleccionada si es CREACIÓN para evitar huerfanos,
        // pero si es UPDATE y el excel trae categoría, respetamos la del excel.
        let rowCategory = row["Categoría"] || row["Category"] || row["category"];

        // Normalizar categoría (buscar match en nuestras constantes para que sea válido)
        const matchedCat = PRODUCT_CATEGORIES.find((c) => c.label === rowCategory || c.value === rowCategory);
        const finalCategory = matchedCat ? matchedCat.value : selectedCategory || "General";

        return {
          id: id ? String(id).trim() : undefined, // Si hay ID, es update
          name: row["Nombre"] || row["name"] || "Producto sin nombre",
          sku: row["SKU"] || row["sku"] || null,
          description: row["Descripción"] || row["description"] || null,
          // Precios: Excel suele tener decimales (150.50), DB quiere centavos (15050)
          price_retail: Math.round(parseFloat(row["Precio Menudeo"] || row["price_retail"] || "0") * 100),
          price_wholesale: row["Precio Mayoreo"] ? Math.round(parseFloat(row["Precio Mayoreo"] || "0") * 100) : null,
          wholesale_min_qty: row["Min. Mayoreo"] ? parseInt(row["Min. Mayoreo"]) : null,
          tags: (row["Tags"] || "")
            .toString()
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
          category: finalCategory,
        };
      });

      await onImport(formattedData);

      setIsDialogOpen(false);
      setFile(null);
      setSelectedCategory("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex gap-2">
      {/* Botón Exportar Template/Inventario */}
      <Button
        variant="outline"
        onClick={onExportTemplate}
        className="text-slate-600 border-slate-300"
        title="Descargar inventario actual para editar"
      >
        <Download className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Plantilla / Exportar</span>
      </Button>

      {/* Input Archivo Oculto */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

      {/* Botón Importar */}
      <Button
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Importar Excel
      </Button>

      {/* Modal de Confirmación "Inteligente" */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isImporting && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resumen de Importación</DialogTitle>
            <DialogDescription>Hemos analizado tu archivo. Esto es lo que sucederá:</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-amber-600">{stats.updates}</span>
              <span className="text-xs text-amber-700 font-medium uppercase mt-1">Actualizaciones</span>
              <span className="text-[10px] text-amber-600/80 leading-tight mt-1">
                Productos existentes que cambiarán
              </span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-emerald-600">{stats.creates}</span>
              <span className="text-xs text-emerald-700 font-medium uppercase mt-1">Nuevos</span>
              <span className="text-[10px] text-emerald-600/80 leading-tight mt-1">Productos que se crearán</span>
            </div>
          </div>

          {/* Selector de Categoría (Solo si hay nuevos) */}
          {stats.creates > 0 && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-100">
              <Label className="text-xs font-semibold text-slate-700">
                Categoría para los {stats.creates} productos nuevos:
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Selecciona si el Excel no tiene categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400">
                * Si el Excel ya tiene columna "Categoría", se usará esa prioridad.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isImporting}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isImporting || (stats.creates > 0 && !selectedCategory)}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              {isImporting ? "Procesando..." : "Confirmar y Aplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
