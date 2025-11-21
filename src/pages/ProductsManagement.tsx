import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Save,
  Tag,
  Layers,
  Trash2,
  CheckSquare,
  X,
  Package,
  AlertCircle,
  Loader2,
  Hash,
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

// --- CONSTANTES (TUS CATEGORÍAS OFICIALES) ---
// Value: Lo que se guarda en la BD (limpio). Label: Lo que se ve en la UI.
const PRODUCT_CATEGORIES = [
  { value: "Ropa", label: "Ropa 👕" },
  { value: "Calzado", label: "Calzado 👟" },
  { value: "Electrónicos", label: "Electrónicos 📱" },
  { value: "Joyería", label: "Joyería 💍" },
  { value: "Fiestas", label: "Fiestas 🎉" },
  { value: "Florería", label: "Florería 🌺" },
  { value: "General", label: "General 📦" },
];

// --- TIPOS ---
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
  isSaving?: boolean; // Estado UI
}

// --- COMPONENTE: CELDA EDITABLE INTELIGENTE ---
interface EditableCellProps {
  value: any;
  type?: "text" | "number" | "select" | "tags";
  options?: { value: string; label: string }[]; // Ajustado para soportar label/value
  onSave: (val: any) => void;
  className?: string;
  prefix?: string;
}

const EditableCell = ({ value, type = "text", options, onSave, className = "", prefix = "" }: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    // Validación simple para evitar guardar si no hubo cambios
    // Para tags comparamos strings json, para otros igualdad simple
    const hasChanged = JSON.stringify(localValue) !== JSON.stringify(value);
    if (hasChanged) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  // Renderizado Edición: SELECT (Categorías)
  if (isEditing && type === "select") {
    return (
      <Select
        value={localValue as string}
        onValueChange={(val) => {
          setLocalValue(val);
          onSave(val); // Guardar al seleccionar inmediatamente
          setIsEditing(false);
        }}
        defaultOpen
      >
        <SelectTrigger className="h-8 w-full border-indigo-500 ring-1 ring-indigo-500 bg-white z-50">
          <SelectValue placeholder="Selecciona..." />
        </SelectTrigger>
        <SelectContent>
          {options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Renderizado Edición: INPUTS (Text, Number, Tags)
  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type === "tags" ? "text" : type}
        value={type === "tags" ? ((localValue as string[]) || []).join(", ") : localValue || ""}
        onChange={(e) => {
          if (type === "number")
            setLocalValue(e.target.value); // Mantenemos como string temporalmente para permitir borrar
          else if (type === "tags")
            setLocalValue(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            );
          else setLocalValue(e.target.value);
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onWheel={(e) => e.currentTarget.blur()} // Bloquear scroll accidental en números
        autoFocus
        className={`h-8 text-sm px-2 bg-white border-indigo-500 ring-1 ring-indigo-500 ${className}`}
      />
    );
  }

  // Renderizado Lectura
  let displayValue = value;

  if (type === "select" && options) {
    const selectedOption = options.find((o) => o.value === value);
    displayValue = selectedOption ? selectedOption.label : value || <span className="text-slate-300 italic">---</span>;
  } else if (type === "tags") {
    displayValue =
      ((value as string[]) || []).length > 0 ? (
        (value as string[])
          .slice(0, 3)
          .map((t: string) => `#${t}`)
          .join(" ") + ((value as string[])?.length > 3 ? "..." : "")
      ) : (
        <span className="text-slate-300 italic">Sin tags</span>
      );
  } else if (!value && value !== 0) {
    displayValue = <span className="text-slate-300 italic">---</span>;
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`h-8 flex items-center px-2 rounded hover:bg-slate-100 cursor-pointer transition-colors text-sm truncate select-none ${className}`}
      title="Clic para editar"
    >
      {prefix && value ? <span className="text-slate-400 mr-1">{prefix}</span> : null}
      {displayValue}
    </div>
  );
};

// --- COMPONENTE: TARJETA MÓVIL ---
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
            <EditableCell
              value={product.category}
              type="select"
              options={PRODUCT_CATEGORIES}
              onSave={(val) => onSaveField(product.id, "category", val)}
              className="text-xs text-indigo-600 bg-indigo-50 w-auto px-2 rounded-full"
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
                onWheel={(e) => e.currentTarget.blur()}
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
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- PÁGINA PRINCIPAL ---
const ProductsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selección
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Estados para Diálogos Bulk Actions
  const [bulkAction, setBulkAction] = useState<{ type: "category" | "min_qty" | "tags" | null; value: any }>({
    type: null,
    value: "",
  });

  // --- DATA FETCHING ---
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

  // --- FILTRADO ---
  const filteredProducts = React.useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  // --- LOGICA SELECCIÓN INTELIGENTE (FIX BUSCADOR) ---
  const toggleSelectAll = () => {
    const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      filteredProducts.forEach((p) => newSet.add(p.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- INLINE SAVE ---
  const handleSaveField = async (id: string, field: string, value: any) => {
    // Optimistic UI
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
      fetchProducts(); // Revert
    }
  };

  // --- BULK ACTIONS ---
  const executeBulkUpdate = async () => {
    const { type, value } = bulkAction;
    if (!type) return;

    const ids = Array.from(selectedIds);
    const fieldMap = { category: "category", min_qty: "wholesale_min_qty", tags: "tags" };
    const dbField = fieldMap[type];

    // Para tags, convertir el string a array
    let finalValue = value;
    if (type === "tags") {
      if (typeof value === "string") {
        finalValue = value.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    // Optimistic
    setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, [dbField]: finalValue } : p)));
    setBulkAction({ type: null, value: "" });

    try {
      await supabase
        .from("products")
        .update({ [dbField]: finalValue })
        .in("id", ids);
      toast({ title: "Actualización masiva completada" });
      setSelectedIds(new Set());
    } catch (err) {
      toast({ title: "Error en actualización", variant: "destructive" });
      fetchProducts();
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} productos permanentemente?`)) return;
    const ids = Array.from(selectedIds);
    const promises = ids.map((id) =>
      supabase.rpc("soft_delete_product", { product_id: id, requesting_user_id: user?.id, reason: "Bulk" }),
    );
    await Promise.all(promises);
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    toast({ title: "Productos eliminados" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-bold text-slate-900 hidden md:block">Inventario</h1>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU o categoría..."
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>
          <Button onClick={() => navigate("/upload")} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Agregar
          </Button>
        </div>

        {/* BULK BAR */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-indigo-50 border-b border-indigo-100 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-2 flex items-center gap-4 text-sm">
                <span className="font-bold text-indigo-900 flex gap-2 items-center">
                  <CheckSquare className="w-4 h-4" /> {selectedIds.size} seleccionados
                </span>
                <div className="h-4 w-px bg-indigo-200" />

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-indigo-700 hover:bg-indigo-100 h-8"
                    onClick={() => setBulkAction({ type: "category", value: "" })}
                  >
                    <Layers className="w-3.5 h-3.5 mr-2" /> Categoría
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-indigo-700 hover:bg-indigo-100 h-8"
                    onClick={() => setBulkAction({ type: "tags", value: "" })}
                  >
                    <Tag className="w-3.5 h-3.5 mr-2" /> Tags
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-indigo-700 hover:bg-indigo-100 h-8"
                    onClick={() => setBulkAction({ type: "min_qty", value: "" })}
                  >
                    <Hash className="w-3.5 h-3.5 mr-2" /> Min. Mayoreo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-100 h-8"
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

      {/* TABLE AREA */}
      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-4 py-3 bg-slate-50">
                    <Checkbox
                      checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id))}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 w-14">Imagen</th>
                  <th className="px-4 py-3 w-28">SKU</th>
                  <th className="px-4 py-3 min-w-[200px]">Nombre</th>
                  <th className="px-4 py-3 w-44">Categoría</th>
                  <th className="px-4 py-3 w-48">Tags</th>
                  <th className="px-4 py-3 w-28 text-right">Menudeo</th>
                  <th className="px-4 py-3 w-28 text-right">Mayoreo</th>
                  <th className="px-4 py-3 w-24 text-center">Min Qty</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-slate-400">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
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
                        <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 overflow-hidden">
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
                        <EditableCell
                          value={product.category}
                          type="select"
                          options={PRODUCT_CATEGORIES}
                          onSave={(val) => handleSaveField(product.id, "category", val)}
                          className="text-slate-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <EditableCell
                          value={product.tags}
                          type="tags"
                          onSave={(val) => handleSaveField(product.id, "tags", val)}
                          className="text-xs text-indigo-600 font-medium"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <span className="text-slate-400 text-xs self-center">$</span>
                          <EditableCell
                            value={(product.price_retail / 100).toFixed(2)}
                            type="number"
                            onSave={(val) => handleSaveField(product.id, "price_retail", parseFloat(val) * 100)}
                            className="text-right font-mono w-20"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <span className="text-slate-400 text-xs self-center">$</span>
                          <EditableCell
                            value={product.price_wholesale ? (product.price_wholesale / 100).toFixed(2) : ""}
                            type="number"
                            onSave={(val) =>
                              handleSaveField(product.id, "price_wholesale", val ? parseFloat(val) * 100 : null)
                            }
                            className="text-right font-mono text-emerald-600 w-20"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <EditableCell
                          value={product.wholesale_min_qty || ""}
                          type="number"
                          onSave={(val) => handleSaveField(product.id, "wholesale_min_qty", val ? parseInt(val) : null)}
                          className="text-center w-16 mx-auto font-bold text-slate-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
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

      {/* --- DIÁLOGOS BULK --- */}
      <Dialog open={!!bulkAction.type} onOpenChange={(open) => !open && setBulkAction({ type: null, value: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualización Masiva</DialogTitle>
            <DialogDescription>
              Aplicando cambios a <strong>{selectedIds.size} productos</strong> seleccionados.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {bulkAction.type === "category" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva Categoría</label>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (separados por comas)</label>
                <Input
                  placeholder="Ej: verano, oferta, nuevo"
                  value={bulkAction.value}
                  onChange={(e) => setBulkAction((prev) => ({ ...prev, value: e.target.value }))}
                />
                <p className="text-xs text-slate-500">Estos tags reemplazarán los existentes en los productos seleccionados</p>
              </div>
            )}
            {bulkAction.type === "min_qty" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad Mínima para Mayoreo</label>
                <Input
                  type="number"
                  placeholder="Ej. 12"
                  onChange={(e) => setBulkAction((prev) => ({ ...prev, value: parseInt(e.target.value) }))}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction({ type: null, value: "" })}>
              Cancelar
            </Button>
            <Button onClick={executeBulkUpdate} className="bg-indigo-600 text-white">
              Aplicar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsManagement;
