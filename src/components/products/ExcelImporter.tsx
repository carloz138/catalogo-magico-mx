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

// Helper de limpieza robusto
const getExcelValue = (val: any, isNumber: boolean = false): any => {
  if (val === undefined || val === null || val === "") return null;

  if (isNumber) {
    if (typeof val === "number") return val;
    // Limpiar símbolos de moneda, espacios y comas
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

      const updatesProducts: any[] = [];
      const updatesVariants: any[] = [];
      const insertsProducts: any[] = [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("--- PROCESANDO DATOS EXCEL ---");

      for (const row of data) {
        const tipo = (row["TIPO_FILA"] || "producto").toLowerCase();

        // ID Limpio (CRÍTICO)
        let idSistema = getExcelValue(row["ID_SISTEMA (NO TOCAR)"] || row["ID_SISTEMA"] || row["id"] || row["ID"]);
        if (idSistema) idSistema = String(idSistema).trim(); // Forzar string y quitar espacios

        let idVariante = getExcelValue(row["ID_VARIANTE"]);
        if (idVariante) idVariante = String(idVariante).trim();

        const nombre = getExcelValue(row["Nombre"] || row["name"]);
        const sku = getExcelValue(row["SKU"] || row["sku"]);
        const catExcel = getExcelValue(row["Categoría"] || row["category"]);

        // Precios
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

        // Lógica de Categoría Segura
        let validCategory: string | undefined = undefined;
        if (catExcel) {
          // Solo aceptamos la categoría si existe en nuestra lista oficial
          // Esto evita errores de Foreign Key o Enum en la BD
          const match = PRODUCT_CATEGORIES.find((c) => c.label === catExcel || c.value === catExcel);
          if (match) validCategory = match.value;
        }

        if (tipo === "variante" && idVariante) {
          // VARIANTES
          updatesVariants.push({
            id: idVariante,
            sku: sku,
            price_retail: priceRetail,
            price_wholesale: priceWholesale,
            stock_quantity: stock,
          });
        } else if (idSistema) {
          // PRODUCTO PADRE
          updatesProducts.push({
            id: idSistema,
            name: nombre,
            sku: sku,
            // Si category venía en excel y es válida, la actualizamos. Si no, enviamos undefined para no tocarla
            category: validCategory,
            description: desc,
            price_retail: priceRetail,
            price_wholesale: priceWholesale,
            wholesale_min_qty: minQty,
            stock_quantity: stock,
            tags: tags,
          });
        } else {
          // NUEVO
          if (nombre && priceRetail !== null) {
            insertsProducts.push({
              user_id: user.id,
              name: nombre,
              sku: sku,
              category: validCategory || selectedCategory || "General", // Fallback seguro
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

      try {
        const promises = [];

        // --- ACTUALIZAR PADRES ---
        if (updatesProducts.length > 0) {
          const productUpdates = updatesProducts.map((p) => {
            // 🔥 CORRECCIÓN 400: Sacar el ID del cuerpo
            const { id, ...rest } = p;

            // Limpiar undefineds (pero mantener nulls)
            const cleanPayload = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));

            // Log de diagnóstico (solo el primero para no saturar)
            if (p === updatesProducts[0]) console.log("Ejemplo Payload Padre:", cleanPayload);

            return supabase.from("products").update(cleanPayload).eq("id", id);
          });
          promises.push(...productUpdates);
        }

        // --- ACTUALIZAR VARIANTES ---
        if (updatesVariants.length > 0) {
          const variantUpdates = updatesVariants.map((v) => {
            const { id, ...rest } = v;
            const cleanPayload = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));
            return supabase.from("product_variants").update(cleanPayload).eq("id", id);
          });
          promises.push(...variantUpdates);
        }

        // --- INSERTAR NUEVOS ---
        if (insertsProducts.length > 0) {
          promises.push(supabase.from("products").insert(insertsProducts));
        }

        // Ejecutar
        const results = await Promise.all(promises);

        // Chequear errores
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          console.error("Errores detallados:", errors);
          throw new Error(`Fallaron ${errors.length} actualizaciones. Revisa la consola.`);
        }

        toast({ title: "Importación exitosa", description: "Inventario actualizado." });
        onImportSuccess();
        setIsDialogOpen(false);
        setFile(null);
      } catch (err: any) {
        console.error("Error Catch:", err);
        toast({
          title: "Error en la importación",
          description: err.message || "Ocurrió un error al enviar los datos.",
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
            <DialogDescription>Resumen de la operación:</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-4 text-center">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <div className="text-2xl font-bold text-amber-600">{stats.products}</div>
              <div className="text-[10px] uppercase font-bold text-amber-700">Productos</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{stats.variants}</div>
              <div className="text-[10px] uppercase font-bold text-purple-700">Variantes</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600">{stats.newProducts}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-700">Nuevos</div>
            </div>
          </div>

          {stats.newProducts > 0 && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <Label className="text-xs mb-2 block font-medium text-slate-700">Categoría para nuevos:</Label>
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
