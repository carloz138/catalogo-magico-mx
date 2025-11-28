import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PRODUCT_CATEGORIES } from "@/types/products";
import { supabase } from "@/integrations/supabase/client";

export interface ImportedProductData {
  id?: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  tags: string[];
  category: string;
  stock_quantity?: number | null;
}

interface ExcelImporterProps {
  onImportSuccess: () => void;
  onExportTemplate: () => void;
  isImporting: boolean;
}

// 🔥 HELPER MEJORADO: LIMPIA DINERO Y ESPACIOS 🔥
const getExcelValue = (val: any, isNumber: boolean = false): any => {
  if (val === undefined || val === null || val === "") return null;

  if (isNumber) {
    // Si es número directo, retornarlo
    if (typeof val === "number") return val;

    // Si es string (ej: "$ 1,500.00"), limpiarlo quitando todo lo que no sea número, punto o menos
    const stringVal = String(val).replace(/[^0-9.-]+/g, "");
    const num = parseFloat(stringVal);
    return isNaN(num) ? null : num;
  }

  return String(val).trim();
};

export const ExcelImporter = ({
  onImportSuccess,
  onExportTemplate,
  isImporting: parentLoading,
}: ExcelImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState({ products: 0, variants: 0, newProducts: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      analyzeFile(selectedFile);
    }
  };

  const analyzeFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast({ title: "Archivo vacío", variant: "destructive" });
          return;
        }

        let pCount = 0;
        let vCount = 0;
        let newCount = 0;

        data.forEach((row) => {
          // Buscamos el ID con varias opciones por si Excel cambió el header
          const id = row["ID_SISTEMA (NO TOCAR)"] || row["ID_SISTEMA"] || row["id"] || row["ID"];
          const tipo = (row["TIPO_FILA"] || "").toLowerCase();
          const idVariante = row["ID_VARIANTE"];

          if (!id && !idVariante) newCount++;
          else if (tipo === "variante" || idVariante) vCount++;
          else pCount++;
        });

        setStats({ products: pCount, variants: vCount, newProducts: newCount });
        setIsDialogOpen(true);
      } catch (e) {
        toast({ title: "Error leyendo archivo", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(f);
  };

  const processImport = async () => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      const updatesProducts = [];
      const updatesVariants = [];
      const insertsProducts = [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("--- INICIANDO PROCESAMIENTO DE EXCEL ---");

      for (const row of data) {
        const tipo = (row["TIPO_FILA"] || "producto").toLowerCase();
        // Búsqueda robusta de ID
        const idSistema = getExcelValue(row["ID_SISTEMA (NO TOCAR)"] || row["ID_SISTEMA"] || row["id"] || row["ID"]);
        const idVariante = getExcelValue(row["ID_VARIANTE"]);

        const nombre = getExcelValue(row["Nombre"] || row["name"]);
        const sku = getExcelValue(row["SKU"] || row["sku"]);
        const catExcel = getExcelValue(row["Categoría"] || row["category"]);

        // PRECIOS: Convertir a centavos (Multiplicar por 100)
        const pRetailRaw = getExcelValue(row["Precio Menudeo"] || row["price_retail"] || row["Price"], true);
        const pWholesaleRaw = getExcelValue(row["Precio Mayoreo"] || row["price_wholesale"], true);

        const priceRetail = pRetailRaw !== null ? Math.round((pRetailRaw as number) * 100) : null;
        const priceWholesale = pWholesaleRaw !== null ? Math.round((pWholesaleRaw as number) * 100) : null;

        const stock = getExcelValue(row["Stock"] || row["stock_quantity"], true);
        const minQty = getExcelValue(row["Min. Mayoreo"] || row["wholesale_min_qty"], true);
        const desc = getExcelValue(row["Descripción"] || row["description"]);
        const tagsRaw = getExcelValue(row["Tags"] || row["tags"]);
        const tags = tagsRaw
          ? String(tagsRaw)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        let categoryToUse = selectedCategory;
        if (catExcel) {
          const match = PRODUCT_CATEGORIES.find((c) => c.label === catExcel || c.value === catExcel);
          if (match) categoryToUse = match.value;
        }

        if (tipo === "variante" && idVariante) {
          // UPDATE VARIANTE
          updatesVariants.push({
            id: idVariante,
            sku: sku,
            price_retail: priceRetail,
            price_wholesale: priceWholesale,
            stock_quantity: stock,
          });
        } else if (idSistema) {
          // UPDATE PRODUCTO PADRE
          updatesProducts.push({
            id: idSistema,
            name: nombre,
            sku: sku,
            category: catExcel ? categoryToUse : undefined, // Solo si viene en excel
            description: desc,
            price_retail: priceRetail,
            price_wholesale: priceWholesale,
            wholesale_min_qty: minQty,
            stock_quantity: stock,
            tags: tags,
          });
        } else {
          // INSERT NUEVO
          if (nombre && priceRetail !== null) {
            insertsProducts.push({
              user_id: user.id,
              name: nombre,
              sku: sku,
              category: categoryToUse || "General",
              description: desc,
              price_retail: priceRetail,
              price_wholesale: priceWholesale,
              wholesale_min_qty: minQty,
              stock_quantity: stock,
              tags: tags,
              has_variants: false,
              variant_count: 0,
            });
          }
        }
      }

      console.log(
        `Resumen: ${updatesProducts.length} updates padre, ${updatesVariants.length} updates variantes, ${insertsProducts.length} inserts.`,
      );

      try {
        const promises = [];

        // --- 1. ACTUALIZAR PRODUCTOS PADRE ---
        if (updatesProducts.length > 0) {
          const productUpdates = updatesProducts.map((p) => {
            // 🔥 CORRECCIÓN: Extraemos el ID para no enviarlo en el body
            const { id, ...rest } = p;

            // Limpiamos undefined (pero dejamos null si queremos borrar el dato)
            const cleanPayload = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));

            return supabase.from("products").update(cleanPayload).eq("id", id);
          });
          promises.push(...productUpdates);
        }

        // --- 2. ACTUALIZAR VARIANTES ---
        if (updatesVariants.length > 0) {
          const variantUpdates = updatesVariants.map((v) => {
            const { id, ...rest } = v;

            const cleanPayload = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));

            return supabase.from("product_variants").update(cleanPayload).eq("id", id);
          });
          promises.push(...variantUpdates);
        }

        // --- 3. INSERTAR NUEVOS ---
        if (insertsProducts.length > 0) {
          promises.push(supabase.from("products").insert(insertsProducts));
        }

        // Ejecutamos todas las promesas
        const results = await Promise.all(promises);

        // Verificación básica de errores
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          console.error("Algunos updates fallaron:", errors[0].error);
          throw new Error(`Error en ${errors.length} operaciones. Revisa la consola.`);
        }

        toast({ title: "Importación exitosa", description: "Precios y stock actualizados." });
        onImportSuccess();
        setIsDialogOpen(false);
        setFile(null);
      } catch (err: any) {
        console.error("Error Crítico Supabase:", err);
        toast({
          title: "Error en la importación",
          description: err.message || "Error desconocido.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onExportTemplate} className="text-slate-600 hover:bg-slate-50">
        <Download className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Descargar Inventario</span>
      </Button>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />

      <Button
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading || parentLoading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Subir Cambios
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !loading && setIsDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cambios</DialogTitle>
            <DialogDescription>Hemos analizado tu archivo. Se aplicarán los siguientes cambios:</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-4 text-center">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <div className="text-2xl font-bold text-amber-600">{stats.products}</div>
              <div className="text-[10px] uppercase font-bold text-amber-700">Productos</div>
              <div className="text-[9px] text-amber-600/70">Actualizar</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{stats.variants}</div>
              <div className="text-[10px] uppercase font-bold text-purple-700">Variantes</div>
              <div className="text-[9px] text-purple-600/70">Actualizar</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600">{stats.newProducts}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-700">Nuevos</div>
              <div className="text-[9px] text-emerald-600/70">Crear</div>
            </div>
          </div>

          {stats.newProducts > 0 && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <Label className="text-xs mb-2 block font-medium text-slate-700">Categoría para los nuevos:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={processImport}
              disabled={loading || (stats.newProducts > 0 && !selectedCategory)}
              className="bg-indigo-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...
                </>
              ) : (
                "Confirmar y Aplicar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
