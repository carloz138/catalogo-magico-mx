import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Save,
  Tag,
  Layers,
  DollarSign,
  Trash2,
  CheckSquare,
  Square,
  Check,
  AlertCircle,
  Package,
  BarChart3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// --- TIPOS ---
// Extendemos tu tipo base para manejo local
interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  original_image_url: string | null;
  processed_image_url: string | null;
  tags: string[] | null;
  // UI states
  isSaving?: boolean;
}

// --- COMPONENTE: CELDA EDITABLE (INLINE EDITING) ---
const EditableCell = ({
  value,
  type = "text",
  onSave,
  className = "",
  prefix = "",
}: {
  value: string | number | null;
  type?: "text" | "number";
  onSave: (val: string | number) => void;
  className?: string;
  prefix?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(localValue || "");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") inputRef.current?.blur();
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={localValue || ""}
        onChange={(e) => setLocalValue(type === "number" ? parseFloat(e.target.value) : e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`h-8 text-sm px-2 bg-white border-indigo-500 ring-1 ring-indigo-500 ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`h-8 flex items-center px-2 rounded hover:bg-slate-100 cursor-text transition-colors text-sm truncate ${className} ${!value ? "text-slate-400 italic" : ""}`}
    >
      {prefix && value ? <span className="text-slate-400 mr-1">{prefix}</span> : null}
      {value || "---"}
    </div>
  );
};

// --- COMPONENTE: TARJETA MÓVIL (OPTIMIZADA) ---
const MobileProductCard = ({
  product,
  onSaveField,
  isSelected,
  onToggleSelect,
}: {
  product: Product;
  onSaveField: (id: string, field: string, value: any) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) => (
  <div
    className={`bg-white rounded-xl border ${isSelected ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10" : "border-slate-200"} shadow-sm p-4 transition-all`}
  >
    <div className="flex gap-4">
      {/* Checkbox & Image */}
      <div className="flex flex-col items-center gap-3">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
          <img
            src={product.processed_image_url || product.original_image_url || ""}
            alt=""
            className="w-full h-full object-cover mix-blend-multiply"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      </div>

      {/* Info & Inputs */}
      <div className="flex-1 space-y-3 min-w-0">
        <div>
          <EditableCell
            value={product.name}
            onSave={(val) => onSaveField(product.id, "name", val)}
            className="font-semibold text-slate-900 mb-1"
          />
          <div className="flex gap-2">
            <EditableCell
              value={product.sku}
              onSave={(val) => onSaveField(product.id, "sku", val)}
              className="text-xs font-mono text-slate-500 bg-slate-50 w-24"
              prefix="#"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Menudeo</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                type="number"
                className="w-full h-9 pl-5 pr-2 text-sm font-medium border border-slate-200 rounded bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                defaultValue={(product.price_retail / 100).toFixed(2)}
                onBlur={(e) => onSaveField(product.id, "price_retail", parseFloat(e.target.value) * 100)}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400">Mayoreo</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                type="number"
                className="w-full h-9 pl-5 pr-2 text-sm font-medium border border-slate-200 rounded bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-emerald-600"
                defaultValue={product.price_wholesale ? (product.price_wholesale / 100).toFixed(2) : ""}
                placeholder="-"
                onBlur={(e) =>
                  onSaveField(product.id, "price_wholesale", e.target.value ? parseFloat(e.target.value) * 100 : null)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL: PRODUCT MANAGEMENT ---
const ProductsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selección y Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkCategoryDialog, setShowBulkCategoryDialog] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");

  // Data Fetching
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, fetchProducts]);

  // --- LÓGICA INLINE EDITING ---
  const handleSaveField = async (id: string, field: string, value: any) => {
    // 1. Optimistic Update
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value, isSaving: true } : p)));

    // 2. DB Update
    try {
      const { error } = await supabase
        .from("products")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      // Success State
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isSaving: false } : p)));
      toast({
        description: "Guardado",
        duration: 1000,
        className: "bg-emerald-50 border-emerald-200 text-emerald-800 py-2",
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error al guardar", variant: "destructive" });
      fetchProducts(); // Revertir
    }
  };

  // --- LÓGICA DE SELECCIÓN ---
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => p.id)));
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- LÓGICA BULK ACTIONS ---
  const handleBulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} productos?`)) return;

    try {
      const ids = Array.from(selectedIds);
      const promises = ids.map((id) =>
        supabase.rpc("soft_delete_product", { product_id: id, requesting_user_id: user?.id, reason: "Bulk" }),
      );
      await Promise.all(promises);

      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      toast({ title: "Productos eliminados" });
    } catch (err) {
      toast({ title: "Error masivo", variant: "destructive" });
    }
  };

  const handleBulkUpdateCategory = async () => {
    if (!bulkCategory) return;
    const ids = Array.from(selectedIds);

    // Optimistic
    setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, category: bulkCategory } : p)));
    setShowBulkCategoryDialog(false);

    try {
      await supabase.from("products").update({ category: bulkCategory }).in("id", ids);
      toast({ title: "Categorías actualizadas" });
      setBulkCategory("");
      setSelectedIds(new Set());
    } catch (err) {
      fetchProducts(); // Revert
    }
  };

  // Filtro Rápido
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Categorías únicas para el dropdown
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-bold text-slate-900 hidden md:block">Inventario</h1>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")} className="hidden md:flex">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <Button size="sm" onClick={() => navigate("/upload")} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Producto</span>
            </Button>
          </div>
        </div>

        {/* --- BULK ACTIONS BAR (Floating) --- */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-16 left-0 w-full bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between z-20"
            >
              <div className="flex items-center gap-4 container mx-auto">
                <span className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  {selectedIds.size} seleccionados
                </span>
                <div className="h-4 w-px bg-indigo-200" />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-indigo-700 hover:bg-indigo-100 h-8"
                    onClick={() => setShowBulkCategoryDialog(true)}
                  >
                    <Layers className="w-3.5 h-3.5 mr-2" /> Categoría
                  </Button>
                  <Button size="sm" variant="ghost" className="text-indigo-700 hover:bg-indigo-100 h-8">
                    <Tag className="w-3.5 h-3.5 mr-2" /> Tags
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-100 hover:text-red-700 h-8"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                  </Button>
                </div>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* --- DESKTOP TABLE --- */}
        <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selectedIds.size === products.length && products.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 w-16">Img</th>
                  <th className="px-4 py-3 w-32">SKU</th>
                  <th className="px-4 py-3">Nombre del Producto</th>
                  <th className="px-4 py-3 w-40">Categoría</th>
                  <th className="px-4 py-3 w-32 text-right">P. Menudeo</th>
                  <th className="px-4 py-3 w-32 text-right">P. Mayoreo</th>
                  <th className="px-4 py-3 w-24 text-center">Min May.</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`group hover:bg-slate-50 transition-colors ${selectedIds.has(product.id) ? "bg-indigo-50/30" : ""}`}
                  >
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelectRow(product.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden">
                        <img
                          src={product.processed_image_url || product.original_image_url || ""}
                          className="w-full h-full object-cover mix-blend-multiply"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell
                        value={product.sku}
                        onSave={(val) => handleSaveField(product.id, "sku", val)}
                        className="font-mono text-xs text-slate-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell
                        value={product.name}
                        onSave={(val) => handleSaveField(product.id, "name", val)}
                        className="font-medium text-slate-900"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {/* TODO: Make this a Combobox later for better UX */}
                      <EditableCell
                        value={product.category}
                        onSave={(val) => handleSaveField(product.id, "category", val)}
                        className="text-slate-600"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 text-xs">$</span>
                        <EditableCell
                          value={(product.price_retail / 100).toFixed(2)}
                          type="number"
                          onSave={(val) => handleSaveField(product.id, "price_retail", parseFloat(val as string) * 100)}
                          className="text-right font-mono w-20"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 text-xs">$</span>
                        <EditableCell
                          value={product.price_wholesale ? (product.price_wholesale / 100).toFixed(2) : ""}
                          type="number"
                          onSave={(val) =>
                            handleSaveField(product.id, "price_wholesale", val ? parseFloat(val as string) * 100 : null)
                          }
                          className="text-right font-mono text-emerald-600 w-20"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell
                        value={product.wholesale_min_qty || ""}
                        type="number"
                        onSave={(val) =>
                          handleSaveField(product.id, "wholesale_min_qty", val ? parseInt(val as string) : null)
                        }
                        className="text-center w-16 mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/products/${product.id}`)}>
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedIds(new Set([product.id]));
                              handleBulkDelete();
                            }}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MOBILE GRID --- */}
        <div className="lg:hidden space-y-4">
          {filteredProducts.map((product) => (
            <MobileProductCard
              key={product.id}
              product={product}
              onSaveField={handleSaveField}
              isSelected={selectedIds.has(product.id)}
              onToggleSelect={() => toggleSelectRow(product.id)}
            />
          ))}
        </div>
      </div>

      {/* --- BULK CATEGORY DIALOG --- */}
      <Dialog open={showBulkCategoryDialog} onOpenChange={setShowBulkCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Categoría</DialogTitle>
            <DialogDescription>
              Esto actualizará la categoría para <strong>{selectedIds.size} productos</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar o escribir nueva</label>
              {/* Combobox simple simulado con datalist por brevedad */}
              <Input
                list="categories"
                placeholder="Ej. Ropa, Electrónica..."
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
              />
              <datalist id="categories">
                {uniqueCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkUpdateCategory} className="bg-indigo-600 text-white">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsManagement;
