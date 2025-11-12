import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  X,
  Edit,
  Trash2,
  Plus,
  Eye,
  Package,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Palette,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
  ExternalLink,
  Tag,
  BookOpen,
  Layers,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/products";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { VariantManagementModal } from "./VariantManagementModal";
import { BulkVariantCreationModal } from "./BulkVariantCreationModal";
import { cn } from "@/lib/utils"; // Importante para clases condicionales

// ... (Tus tipos y constantes se mantienen igual) ...
type EditableProductField =
  | "name"
  | "sku"
  | "description"
  | "custom_description"
  | "price_retail"
  | "price_wholesale"
  | "wholesale_min_qty"
  | "category"
  | "brand"
  | "model"
  | "color"
  | "features"
  | "tags";
type ProductCategory = "ropa" | "calzado" | "electronica" | "joyeria" | "fiestas" | "floreria" | "general";
type EditorProduct = Product;

interface EditingCell {
  rowId: string;
  column: EditableProductField;
}

interface ProductFilters {
  search: string;
  category: ProductCategory | "";
  status: string;
}

interface ProductsTableEditorProps {
  onEditVariants?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  className?: string;
  externalProducts?: EditorProduct[];
  onProductsChange?: (products: EditorProduct[]) => void;
}

const PRODUCT_CATEGORIES = [
  { value: "ropa" as ProductCategory, label: "Ropa", icon: "👕" },
  { value: "calzado" as ProductCategory, label: "Calzado", icon: "👟" },
  { value: "electronica" as ProductCategory, label: "Electrónicos", icon: "📱" },
  { value: "joyeria" as ProductCategory, label: "Joyería", icon: "💍" },
  { value: "fiestas" as ProductCategory, label: "Fiestas", icon: "🎉" },
  { value: "floreria" as ProductCategory, label: "Florería", icon: "🌺" },
  { value: "general" as ProductCategory, label: "General", icon: "📦" },
];

const MAX_TAGS = 10;

// ... (Tus funciones auxiliares: centsToPrice, etc. se mantienen igual) ...
const centsToPrice = (cents: number | null): string => (cents ? (cents / 100).toFixed(2) : "0.00");
const priceToCents = (price: string | number): number => {
  if (!price) return 0;
  const priceNum = typeof price === "string" ? parseFloat(price) : price;
  return Math.round(priceNum * 100);
};
const formatFeatures = (features: string[] | null): string =>
  features && Array.isArray(features) ? JSON.stringify(features) : "";
const parseFeatures = (featuresStr: string): string[] => {
  try {
    return JSON.parse(featuresStr);
  } catch {
    return [];
  }
};
const formatTags = (tags: string[] | null): string => (tags && Array.isArray(tags) ? tags.join(", ") : "");
const parseTags = (tagsStr: string): string[] => {
  if (!tagsStr.trim()) return [];
  const tags = tagsStr
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, MAX_TAGS);
  return [...new Set(tags)];
};
const validateProductCategory = (category: string | null): ProductCategory | null => {
  if (!category) return null;
  const validCategories: ProductCategory[] = [
    "ropa",
    "calzado",
    "electronica",
    "joyeria",
    "fiestas",
    "floreria",
    "general",
  ];
  return validCategories.includes(category as ProductCategory) ? (category as ProductCategory) : null;
};

const ProductsTableEditor: React.FC<ProductsTableEditorProps> = ({
  onEditVariants,
  onViewProduct,
  className = "",
  externalProducts,
  onProductsChange,
}) => {
  const { user } = useAuth();

  // Estados (se mantienen igual)
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showCatalogPreview, setShowCatalogPreview] = useState(false);
  const [catalogTitle, setCatalogTitle] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EditorProduct | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<EditorProduct | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);

  // Modales Bulk
  const [showBulkTagsModal, setShowBulkTagsModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [showBulkWholesaleMinModal, setShowBulkWholesaleMinModal] = useState(false);
  const [showBulkVariantsModal, setShowBulkVariantsModal] = useState(false);
  const [bulkTags, setBulkTags] = useState("");
  const [bulkPriceType, setBulkPriceType] = useState<"retail" | "wholesale">("retail");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkWholesaleMin, setBulkWholesaleMin] = useState("");

  const [filters, setFilters] = useState<ProductFilters>({ search: "", category: "", status: "" });
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantProduct, setVariantProduct] = useState<EditorProduct | null>(null);

  // ... (Tus useEffects y fetchProducts se mantienen igual) ...
  useEffect(() => {
    if (externalProducts) {
      setProducts(externalProducts);
      setLoading(false);
    } else if (user) {
      fetchProducts();
    }
  }, [user, externalProducts]);

  useEffect(() => {
    if (onProductsChange && !externalProducts) onProductsChange(products);
  }, [products, onProductsChange, externalProducts]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`*`) // Simplificado para el ejemplo, usa tu select completo
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Mapeo (simplificado, usa el tuyo completo)
      const productsData: Product[] = data
        ? data.map((p) => ({ ...p, category: validateProductCategory(p.category) }))
        : [];
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ... (Tus funciones startEdit, cancelEdit, saveEdit, handleKeyDown se mantienen igual) ...
  const startEdit = (rowId: string, column: EditableProductField, currentValue: any) => {
    setEditingCell({ rowId, column });
    if (column === "price_retail" || column === "price_wholesale")
      setEditingValue(currentValue ? centsToPrice(currentValue) : "");
    else if (column === "features") setEditingValue(formatFeatures(currentValue));
    else if (column === "tags") setEditingValue(formatTags(currentValue));
    else if (column === "wholesale_min_qty") setEditingValue(currentValue ? currentValue.toString() : "");
    else setEditingValue(currentValue || "");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const saveEdit = async () => {
    if (!editingCell || saving) return;
    const { rowId, column } = editingCell;
    let processedValue: any = editingValue;

    // ... (Tu lógica de validación y parseo se mantiene igual) ...
    if (column === "price_retail" || column === "price_wholesale") {
      const num = parseFloat(editingValue);
      if (isNaN(num)) return; // Manejar error visualmente mejor luego
      processedValue = priceToCents(num);
    } else if (column === "tags") {
      processedValue = parseTags(editingValue);
    } else if (column === "wholesale_min_qty") {
      processedValue = parseInt(editingValue) || 0;
    }

    setSaving(rowId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ [column]: processedValue })
        .eq("id", rowId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === rowId ? { ...p, [column]: processedValue } : p)));
      toast({ title: "Actualizado", description: "Cambio guardado" });
      cancelEdit();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    else if (e.key === "Escape") cancelEdit();
  };

  // ... (Tus funciones masivas: handleCreateCatalog, etc. se mantienen igual) ...
  // ... (Solo asegúrate de incluirlas todas en el archivo final) ...
  // Por brevedad, asumo que están aquí (handleCreateCatalog, confirmCreateCatalog, deleteProducts, bulkUpdate...)

  // Funciones de Selección
  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };
  const selectAllVisible = () => setSelectedProducts(filteredProducts.map((p) => p.id));
  const clearSelection = () => setSelectedProducts([]);

  // Filtros
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !filters.search ||
        product.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.sku?.toLowerCase()?.includes(filters.search.toLowerCase());
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesStatus = !filters.status || product.processing_status === filters.status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, filters]);

  // Renderers de Celda (Mejorados visualmente)
  const renderEditableCell = (
    product: EditorProduct,
    column: EditableProductField,
    value: any,
    type: string = "text",
  ) => {
    const isEditing = editingCell?.rowId === product.id && editingCell?.column === column;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 min-w-[120px]">
          <Input
            type={type}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            className="h-8 text-sm shadow-sm border-blue-500"
            autoFocus
          />
        </div>
      );
    }

    let displayValue: React.ReactNode = value ?? <span className="text-gray-300 italic text-xs">Vacío</span>;
    if (column.includes("price")) displayValue = value ? `$${centsToPrice(value)}` : "-";
    if (column === "tags" && Array.isArray(value) && value.length > 0) {
      displayValue = (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1 h-5">
              {tag}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1 h-5">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={() => startEdit(product.id, column, value)}
        className="group cursor-pointer hover:bg-blue-50 p-2 rounded-md min-h-[32px] flex items-center transition-colors relative -ml-2"
      >
        <span className="truncate flex-1">{displayValue}</span>
        <Edit className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 absolute right-2 transition-opacity" />
      </div>
    );
  };

  const renderSelectCell = (
    product: EditorProduct,
    column: EditableProductField,
    value: any,
    options: typeof PRODUCT_CATEGORIES,
  ) => {
    // ... (Similar lógica mejorada)
    // Simplemente usa el renderizado que tenías, envuelto en el div hoverable
    const option = options.find((opt) => opt.value === value);
    const isEditing = editingCell?.rowId === product.id && editingCell?.column === column;

    if (isEditing) {
      return (
        <select
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={saveEdit}
          className="h-8 text-sm border rounded px-2 w-full shadow-sm border-blue-500"
          autoFocus
        >
          <option value="">Seleccionar</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <div
        onClick={() => startEdit(product.id, column, value)}
        className="group cursor-pointer hover:bg-blue-50 p-2 rounded-md min-h-[32px] flex items-center relative -ml-2"
      >
        <span className="truncate flex-1">{option ? `${option.icon} ${option.label}` : "-"}</span>
        <Edit className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 absolute right-2" />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    // ... (Tu lógica existente de badges) ...
    return <Badge variant="outline">{status}</Badge>; // Placeholder
  };

  if (loading)
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header y Filtros (Compacto) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Aquí podrías poner los filtros de categoría/estado como dropdowns pequeños */}
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/upload")}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo
          </Button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 w-10 sticky left-0 bg-gray-50 z-20">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                    onChange={selectedProducts.length === filteredProducts.length ? clearSelection : selectAllVisible}
                  />
                </th>
                <th className="p-3 min-w-[200px] sticky left-10 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Producto
                </th>
                <th className="p-3 w-32">SKU</th>
                <th className="p-3 w-32">Categoría</th>
                <th className="p-3 w-32 text-right">Precio</th>
                <th className="p-3 w-32 text-right">Mayoreo</th>
                <th className="p-3 w-24 text-center">Mín.</th>
                <th className="p-3 w-40">Etiquetas</th>
                <th className="p-3 w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.includes(product.id);
                return (
                  <tr
                    key={product.id}
                    className={cn("group hover:bg-gray-50/50 transition-colors", isSelected && "bg-blue-50/30")}
                  >
                    <td className="p-3 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3 sticky left-10 bg-white group-hover:bg-gray-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="font-medium text-gray-900 truncate max-w-[250px]" title={product.name}>
                        {renderEditableCell(product, "name", product.name)}
                      </div>
                    </td>
                    <td className="p-3">{renderEditableCell(product, "sku", product.sku)}</td>
                    <td className="p-3">
                      {renderSelectCell(product, "category", product.category, PRODUCT_CATEGORIES)}
                    </td>
                    <td className="p-3 text-right">
                      {renderEditableCell(product, "price_retail", product.price_retail, "number")}
                    </td>
                    <td className="p-3 text-right">
                      {renderEditableCell(product, "price_wholesale", product.price_wholesale, "number")}
                    </td>
                    <td className="p-3 text-center">
                      {renderEditableCell(product, "wholesale_min_qty", product.wholesale_min_qty, "number")}
                    </td>
                    <td className="p-3">{renderEditableCell(product, "tags", product.tags)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onViewProduct?.(product.id)}
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                        {/* Botón Eliminar (Opcional, si lo tienes en props) */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👇 BARRA FLOTANTE DE ACCIONES MASIVAS (Sticky Bottom) */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-gray-700">
          <div className="flex items-center gap-2 pl-2 border-r border-gray-700 pr-4">
            <span className="bg-white text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedProducts.length}
            </span>
            <span className="text-sm font-medium">seleccionados</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-800 h-8"
              onClick={() => setShowBulkTagsModal(true)}
            >
              <Tag className="w-3.5 h-3.5 mr-1.5" /> Etiquetas
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-800 h-8"
              onClick={() => {
                setBulkPriceType("retail");
                setShowBulkPriceModal(true);
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Precios
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-800 h-8"
              // ... otras acciones
            >
              <Package className="w-3.5 h-3.5 mr-1.5" /> Catálogo
            </Button>
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8"
              onClick={() => setShowBulkDeleteConfirm(true)} // Asume que tienes esta función del padre o props
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-gray-800 text-gray-400"
            onClick={clearSelection}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* ... (Aquí van tus modales: BulkTags, BulkPrice, etc. que ya tenías) ... */}
      {/* Asegúrate de renderizarlos aquí abajo para que funcionen */}
    </div>
  );
};

export default ProductsTableEditor;
