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

interface ExcelImporterProps {
  onImportSuccess: () => void; // Callback para recargar la tabla
  onExportTemplate: () => void;
  isImporting: boolean;
}

// Helper para la regla de oro: "Si está vacío en excel, es NULL en DB"
const getExcelValue = (val: any, isNumber: boolean = false) => {
  if (val === undefined || val === null || val === "") return null;
  if (isNumber) {
    const num = parseFloat(val);
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
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Fallback para nuevos
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
          const tipo = (row["TIPO_FILA"] || "").toLowerCase();
          const id = row["ID_SISTEMA"] || row["ID_SISTEMA (NO TOCAR)"];

          if (!id && !row["ID_VARIANTE"]) newCount++;
          else if (tipo === "variante" || row["ID_VARIANTE"]) vCount++;
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

      // Obtenemos el ID de usuario actual para los inserts
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      for (const row of data) {
        const tipo = (row["TIPO_FILA"] || "producto").toLowerCase();
        const idSistema = row["ID_SISTEMA"] || row["ID_SISTEMA (NO TOCAR)"];
        const idVariante = row["ID_VARIANTE"];

        // 1. Valores procesados con la regla "Empty = Null"
        const nombre = getExcelValue(row["Nombre"]);
        const sku = getExcelValue(row["SKU"]);
        const catExcel = getExcelValue(row["Categoría"]);
        // Precios a centavos
        const pRetailRaw = getExcelValue(row["Precio Menudeo"], true);
        const pWholesaleRaw = getExcelValue(row["Precio Mayoreo"], true);
        const priceRetail = pRetailRaw !== null ? Math.round(pRetailRaw * 100) : null;
        const priceWholesale = pWholesaleRaw !== null ? Math.round(pWholesaleRaw * 100) : null;

        const stock = getExcelValue(row["Stock"], true); // Null = Infinito
        const minQty = getExcelValue(row["Min. Mayoreo"], true);
        const desc = getExcelValue(row["Descripción"]);
        const tagsRaw = getExcelValue(row["Tags"]);
        const tags = tagsRaw
          ? String(tagsRaw)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        // Lógica de Categoría
        let categoryToUse = selectedCategory;
        if (catExcel) {
          const match = PRODUCT_CATEGORIES.find((c) => c.label === catExcel || c.value === catExcel);
          if (match) categoryToUse = match.value;
        }

        // --- CLASIFICACIÓN DE ACCIONES ---

        if (tipo === "variante" && idVariante) {
          // UPDATE VARIANTE
          updatesVariants.push({
            id: idVariante,
            sku: sku, // Se puede borrar
            price_retail: priceRetail, // Se puede borrar
            price_wholesale: priceWholesale, // Se puede borrar
            stock_quantity: stock, // Se puede borrar (infinito)
          });
        } else if (idSistema) {
          // UPDATE PRODUCTO PADRE
          updatesProducts.push({
            id: idSistema,
            name: nombre, // Nombre es requerido en DB, cuidado si lo borran (usar fallback o ignorar)
            sku: sku,
            category: catExcel ? categoryToUse : undefined, // Solo actualizamos categoria si viene en excel
            description: desc,
            price_retail: priceRetail,
            price_wholesale: priceWholesale,
            wholesale_min_qty: minQty,
            stock_quantity: stock, // Si tiene variantes, esto no afectará visualmente nada importante
            tags: tags,
          });
        } else {
          // INSERT PRODUCTO NUEVO (SIMPLE)
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

      try {
        // Ejecutar Actualizaciones en Lotes (Promise.all para velocidad)
        const promises = [];

        // Update Products (iterar porque update masivo con valores distintos no es directo en Supabase JS sin RPC)
        if (updatesProducts.length > 0) {
          // Para optimizar, lo hacemos 1 por 1 en paralelo (Supabase aguanta bien batches pequeños)
          // O idealmente crear un RPC "bulk_update_products", pero aquí usaremos loop paralelo
          const productUpdates = updatesProducts.map((p) => supabase.from("products").update(p).eq("id", p.id));
          promises.push(...productUpdates);
        }

        // Update Variants
        if (updatesVariants.length > 0) {
          const variantUpdates = updatesVariants.map((v) => supabase.from("product_variants").update(v).eq("id", v.id));
          promises.push(...variantUpdates);
        }

        // Inserts (Batch es nativo)
        if (insertsProducts.length > 0) {
          promises.push(supabase.from("products").insert(insertsProducts));
        }

        await Promise.all(promises);

        toast({ title: "Importación exitosa", description: "Se han aplicado todos los cambios." });
        onImportSuccess();
        setIsDialogOpen(false);
        setFile(null);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error en la importación",
          description: "Revisa el formato de los datos.",
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
      <Button variant="outline" onClick={onExportTemplate} className="text-slate-600">
        <Download className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Descargar Inventario</span>
      </Button>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

      <Button
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading || parentLoading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        Subir Cambios
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(o) => !loading && setIsDialogOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Importación</DialogTitle>
            <DialogDescription>Se detectaron los siguientes movimientos:</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4 text-center">
            <div className="bg-blue-50 p-2 rounded border border-blue-100">
              <div className="text-xl font-bold text-blue-700">{stats.products}</div>
              <div className="text-[10px] uppercase text-blue-600">Productos</div>
            </div>
            <div className="bg-purple-50 p-2 rounded border border-purple-100">
              <div className="text-xl font-bold text-purple-700">{stats.variants}</div>
              <div className="text-[10px] uppercase text-purple-600">Variantes</div>
            </div>
            <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
              <div className="text-xl font-bold text-emerald-700">{stats.newProducts}</div>
              <div className="text-[10px] uppercase text-emerald-600">Nuevos</div>
            </div>
          </div>

          {stats.newProducts > 0 && (
            <div className="bg-slate-50 p-3 rounded">
              <Label className="text-xs mb-2 block">Categoría por defecto para nuevos:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 bg-white">
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
              {loading ? "Procesando..." : "Aplicar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
