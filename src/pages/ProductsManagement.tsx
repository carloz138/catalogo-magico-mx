import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Importamos componentes
import { ProductTable } from "@/components/products/table/ProductTable";
import { ExcelImporter } from "@/components/products/ExcelImporter";
import { VariantManagementModal } from "@/components/products/VariantManagementModal";
import { ProductWithUI, PRODUCT_CATEGORIES } from "@/types/products";

const ProductsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState<ProductWithUI | null>(null);

  // Estados para Acciones Masivas
  const [bulkAction, setBulkAction] = useState<{
    type: "category" | "min_qty" | "tags" | null;
    value: any;
    ids: string[];
  }>({ type: null, value: "", ids: [] });
  const [appendTagsMode, setAppendTagsMode] = useState(true);

  // --- FETCH ---
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("active_products")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast({ title: "Error cargando productos", variant: "destructive" });
    } else {
      const formatted: ProductWithUI[] = (data || []).map((p) => ({
        ...p,
        isSaving: false,
        tags: Array.isArray(p.tags) ? p.tags : [],
      }));
      setProducts(formatted);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, fetchProducts]);

  // --- UPDATE INDIVIDUAL ---
  const handleUpdateProduct = async (id: string, field: string, value: any) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value, isSaving: true } : p)));
    try {
      const { error } = await supabase
        .from("products")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isSaving: false } : p)));
    } catch (err) {
      toast({ title: "Error al guardar", variant: "destructive" });
      fetchProducts();
    }
  };

  // --- EXCEL IMPORT ---
  const handleImportExcel = async (data: any[], category: string) => {
    if (!user) return;
    setIsImporting(true);
    try {
      const productsToInsert = data.map((p) => ({
        ...p,
        user_id: user.id,
        category,
        has_variants: false,
        variant_count: 0,
      }));
      const { error } = await supabase.from("products").insert(productsToInsert);
      if (error) throw error;
      toast({ title: "Importación completada" });
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Error en importación", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  // --- DELETE MASIVO ---
  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`¿Eliminar ${ids.length} productos?`)) return;
    try {
      const promises = ids.map((id) =>
        supabase.rpc("soft_delete_product", { product_id: id, requesting_user_id: user?.id }),
      );
      await Promise.all(promises);
      toast({ title: "Productos eliminados" });
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (err) {
      toast({ title: "Error al eliminar", variant: "destructive" });
      fetchProducts();
    }
  };

  // --- EJECUTAR UPDATE MASIVO ---
  const executeBulkUpdate = async () => {
    const { type, value, ids } = bulkAction;
    if (!type || !user) return;

    try {
      // 1. Tags Logic
      if (type === "tags") {
        const newTags =
          typeof value === "string"
            ? value
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [];

        if (appendTagsMode) {
          // Append: Leer actuales + Nuevos
          const updates = ids.map(async (id) => {
            const currentProduct = products.find((p) => p.id === id);
            const currentTags = currentProduct?.tags || [];
            const mergedTags = Array.from(new Set([...currentTags, ...newTags]));

            // Optimistic
            setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, tags: mergedTags } : p)));
            return supabase.from("products").update({ tags: mergedTags }).eq("id", id);
          });
          await Promise.all(updates);
        } else {
          // Replace
          setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, tags: newTags } : p)));
          await supabase.from("products").update({ tags: newTags }).in("id", ids);
        }
      }
      // 2. Category / Min Qty Logic
      else {
        const field = type === "category" ? "category" : "wholesale_min_qty";
        setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, [field]: value } : p)));
        await supabase
          .from("products")
          .update({ [field]: value })
          .in("id", ids);
      }

      toast({ title: "Actualización masiva completada" });
      setBulkAction({ type: null, value: "", ids: [] });
    } catch (error) {
      console.error(error);
      toast({ title: "Error en actualización masiva", variant: "destructive" });
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
              {products.length} productos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ExcelImporter onImport={handleImportExcel} isImporting={isImporting} />
            <Button
              onClick={() => navigate("/upload")}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Nuevo Producto</span>
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="container mx-auto p-4 md:p-6">
        <ProductTable
          data={products}
          isLoading={loading}
          onUpdateProduct={handleUpdateProduct}
          onBulkDelete={handleBulkDelete}
          onBulkCatalog={(ids) => console.log("Catálogo", ids)}
          onOpenVariants={setVariantModalProduct}
          // 🔥 CONEXIÓN DE ACCIONES MASIVAS 🔥
          onBulkAction={(type, ids) => setBulkAction({ type, value: "", ids })}
        />
      </div>

      {/* DIÁLOGO DE ACTUALIZACIÓN MASIVA */}
      <Dialog
        open={!!bulkAction.type}
        onOpenChange={(open) => !open && setBulkAction({ type: null, value: "", ids: [] })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edición Masiva</DialogTitle>
            <DialogDescription>
              Editando <strong>{bulkAction.ids.length} productos</strong> seleccionados.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* 1. CATEGORÍA */}
            {bulkAction.type === "category" && (
              <div className="space-y-2">
                <Label>Nueva Categoría</Label>
                <Select onValueChange={(val) => setBulkAction((prev) => ({ ...prev, value: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 2. TAGS */}
            {bulkAction.type === "tags" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Etiquetas (separar por comas)</Label>
                  <Input
                    placeholder="Ej: verano, oferta, nuevo"
                    onChange={(e) => setBulkAction((prev) => ({ ...prev, value: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Agregar a existentes</Label>
                    <p className="text-xs text-slate-500">
                      {appendTagsMode
                        ? "Suma las etiquetas sin borrar las actuales."
                        : "Reemplaza todas las etiquetas anteriores."}
                    </p>
                  </div>
                  <Switch checked={appendTagsMode} onCheckedChange={setAppendTagsMode} />
                </div>
              </div>
            )}

            {/* 3. MIN QTY */}
            {bulkAction.type === "min_qty" && (
              <div className="space-y-2">
                <Label>Cantidad Mínima Mayoreo</Label>
                <Input
                  type="number"
                  placeholder="Ej: 12"
                  onChange={(e) => setBulkAction((prev) => ({ ...prev, value: parseInt(e.target.value) }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction({ type: null, value: "", ids: [] })}>
              Cancelar
            </Button>
            <Button onClick={executeBulkUpdate} className="bg-indigo-600 text-white">
              Aplicar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL VARIANTES */}
      {variantModalProduct && (
        <VariantManagementModal
          open={!!variantModalProduct}
          onOpenChange={(open) => {
            if (!open) {
              setVariantModalProduct(null);
              fetchProducts();
            }
          }}
          productId={variantModalProduct.id}
          productName={variantModalProduct.name}
          productCategory={variantModalProduct.category || undefined}
          basePrice={variantModalProduct.price_retail || 0}
          basePriceWholesale={variantModalProduct.price_wholesale || undefined}
        />
      )}
    </div>
  );
};

export default ProductsManagement;
