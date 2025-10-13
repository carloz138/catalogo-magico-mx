import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, CheckSquare, Square, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/price-calculator";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price_retail: number;
  price_wholesale: number | null;
  original_image_url: string;
  processed_image_url: string | null;
  image_url: string | null;
}

interface ProductSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], products: Product[]) => void;
}

export function ProductSelector({ selectedIds, onChange }: ProductSelectorProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price_retail, price_wholesale, original_image_url, processed_image_url, image_url")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)),
    );
  }, [products, searchQuery]);

  const sortedProducts = useMemo(() => {
    // Productos seleccionados primero
    return [...filteredProducts].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [filteredProducts, selectedIds]);

  // ✅ MEMOIZAR HANDLERS para evitar recreación
  const handleToggleProduct = useCallback(
    (productId: string, e?: React.MouseEvent) => {
      // ✅ IMPORTANTE: Stop propagation para evitar doble trigger
      e?.stopPropagation();

      const isSelected = selectedIds.includes(productId);
      let newSelectedIds: string[];
      let newSelectedProducts: Product[];

      if (isSelected) {
        newSelectedIds = selectedIds.filter((id) => id !== productId);
        newSelectedProducts = products.filter((p) => newSelectedIds.includes(p.id));
      } else {
        newSelectedIds = [...selectedIds, productId];
        newSelectedProducts = products.filter((p) => newSelectedIds.includes(p.id));
      }

      onChange(newSelectedIds, newSelectedProducts);
    },
    [selectedIds, products, onChange],
  );

  const handleSelectAll = useCallback(() => {
    const allIds = filteredProducts.map((p) => p.id);
    onChange(allIds, filteredProducts);
  }, [filteredProducts, onChange]);

  const handleDeselectAll = useCallback(() => {
    onChange([], []);
  }, [onChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tienes productos disponibles.</p>
        <p className="text-sm mt-2">Crea productos para incluirlos en tu catálogo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador y acciones */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectedIds.length === filteredProducts.length ? handleDeselectAll : handleSelectAll}
        >
          {selectedIds.length === filteredProducts.length ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Deseleccionar
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Seleccionar todos
            </>
          )}
        </Button>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedIds.length} producto{selectedIds.length !== 1 ? "s" : ""} seleccionado
          {selectedIds.length !== 1 ? "s" : ""}
        </span>
        {searchQuery && (
          <span className="text-muted-foreground">
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Lista de productos */}
      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4 space-y-2">
          {sortedProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron productos</p>
          ) : (
            sortedProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const imageUrl = product.processed_image_url || product.original_image_url || product.image_url;

              return (
                <label
                  key={product.id}
                  htmlFor={`product-${product.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  {/* ✅ CRÍTICO: Checkbox con onCheckedChange directo */}
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleToggleProduct(product.id)}
                  />

                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-12 w-12 rounded object-cover pointer-events-none"
                  />

                  <div className="flex-1 min-w-0 pointer-events-none">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.sku && (
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">{formatPrice(product.price_retail / 100)}</span>
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
