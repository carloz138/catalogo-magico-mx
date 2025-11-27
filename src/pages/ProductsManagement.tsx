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

// --- IMPORTACIONES DE NUESTROS COMPONENTES ---
import { ProductTable } from "@/components/products/table/ProductTable";
import { ExcelImporter } from "@/components/products/ExcelImporter";
import { VariantManagementModal } from "@/components/products/VariantManagementModal";
import { ProductWithUI, PRODUCT_CATEGORIES } from "@/types/products";
// Importamos la función de exportación inteligente
import { handleExportFullInventory } from "@/utils/exportUtils";

const ProductsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados principales
  const [products, setProducts] = useState<ProductWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [variantModalProduct, setVariantModalProduct] = useState<ProductWithUI | null>(null);

  // Estados para Acciones Masivas (Barra flotante negra)
  const [bulkAction, setBulkAction] = useState<{
    type: "category" | "min_qty" | "tags" | null;
    value: any;
    ids: string[];
  }>({ type: null, value: "", ids: [] });
  const [appendTagsMode, setAppendTagsMode] = useState(true);

  // --- 1. CARGAR PRODUCTOS ---
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Usamos 'active_products' si es una vista, o 'products' directo con filtro
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
      // Formateamos los datos para la UI
      const formatted: ProductWithUI[] = (data || []).map((p) => ({
        ...p,
        isSaving: false,
        tags: Array.isArray(p.tags) ? p.tags : [], // Asegurar que siempre sea array
      }));
      setProducts(formatted);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, fetchProducts]);

  // --- 2. ACTUALIZACIÓN INDIVIDUAL (Inline Edit) ---
  const handleUpdateProduct = async (id: string, field: string, value: any) => {
    // UI Optimista
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value, isSaving: true } : p)));

    try {
      const { error } = await supabase
        .from("products")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
      // Quitamos loading
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isSaving: false } : p)));
    } catch (err) {
      toast({ title: "Error al guardar", variant: "destructive" });
      fetchProducts(); // Revertir
    }
  };

  // --- 3. ACCIONES MASIVAS: BORRAR ---
  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`¿Eliminar ${ids.length} productos?`)) return;
    try {
      const promises = ids.map((id) =>
        supabase.rpc("soft_delete_product", { product_id: id, requesting_user_id: user?.id }),
      );
      await Promise.all(promises);
      toast({ title: "Productos eliminados" });
      // Actualizamos UI localmente
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (err) {
      toast({ title: "Error al eliminar", variant: "destructive" });
      fetchProducts();
    }
  };

  // --- 4. ACCIONES MASIVAS: ACTUALIZAR (Tags, Categoría, MinQty) ---
  const executeBulkUpdate = async () => {
    const { type, value, ids } = bulkAction;
    if (!type || !user) return;

    try {
      if (type === "tags") {
        const newTags =
          typeof value === "string"
            ? value
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
            : [];

        if (appendTagsMode) {
          // Modo Agregar: Leer actuales + Nuevos
          const updates = ids.map(async (id) => {
            const currentProduct = products.find((p) => p.id === id);
            const mergedTags = Array.from(new Set([...(currentProduct?.tags || []), ...newTags]));
            // Update local
            setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, tags: mergedTags } : p)));
            // Update DB
            return supabase.from("products").update({ tags: mergedTags }).eq("id", id);
          });
          await Promise.all(updates);
        } else {
          // Modo Reemplazar
          setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, tags: newTags } : p)));
          await supabase.from("products").update({ tags: newTags }).in("id", ids);
        }
      } else {
        // Categoría o Min Qty
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
      toast({ title: "Error en actualización masiva", variant: "destructive" });
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
              {products.length} productos
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 🔥 AQUÍ ESTÁ EL IMPORTADOR/EXPORTADOR CONECTADO 🔥 
                isImporting: le pasamos false porque ahora maneja su propio loading interno
                onImportSuccess: le pasamos fetchProducts para que recargue la tabla al terminar
                onExportTemplate: le pasamos la función con el user.id
            */}
            <ExcelImporter
              isImporting={false}
              onImportSuccess={fetchProducts}
              onExportTemplate={() => user && handleExportFullInventory(user.id)}
            />

            <Button
              onClick={() => navigate("/upload")}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Nuevo Producto</span>
            </Button>
          </div>
        </div>
      </div>

      {/* --- TABLA PRINCIPAL --- */}
      <div className="container mx-auto p-4 md:p-6">
        <ProductTable
          data={products}
          isLoading={loading}
          onUpdateProduct={handleUpdateProduct}
          onBulkDelete={handleBulkDelete}
          onBulkCatalog={(ids) => console.log("Catálogo", ids)}
          onOpenVariants={setVariantModalProduct}
          onBulkAction={(type, ids) => setBulkAction({ type, value: "", ids })}
        />
      </div>

      {/* --- DIÁLOGO EDICIÓN MASIVA --- */}
      <Dialog
        open={!!bulkAction.type}
        onOpenChange={(open) => !open && setBulkAction({ type: null, value: "", ids: [] })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edición Masiva</DialogTitle>
            <DialogDescription>Editando {bulkAction.ids.length} productos seleccionados.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
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
            {bulkAction.type === "tags" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Etiquetas</Label>
                  <Input
                    placeholder="Ej: verano, oferta"
                    onChange={(e) => setBulkAction((prev) => ({ ...prev, value: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <Label className="text-sm">Agregar a existentes</Label>
                  <Switch checked={appendTagsMode} onCheckedChange={setAppendTagsMode} />
                </div>
              </div>
            )}
            {bulkAction.type === "min_qty" && (
              <div className="space-y-2">
                <Label>Cantidad Mínima</Label>
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
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL VARIANTES --- */}
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
