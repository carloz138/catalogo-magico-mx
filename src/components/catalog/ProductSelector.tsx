import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  CheckSquare, 
  Square, 
  Loader2, 
  X,
  ShoppingCart,
  Package,
  Filter,
  CheckCircle2
} from "lucide-react";
import { formatPrice } from "@/lib/utils/price-calculator";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/useMediaQuery";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price_retail: number;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  original_image_url: string;
  processed_image_url: string | null;
  catalog_image_url: string | null;
  thumbnail_image_url: string | null;
  image_url: string | null;
  tags: string[] | null;
}

interface ProductSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], products: Product[]) => void;
}

export function ProductSelector({ selectedIds, onChange }: ProductSelectorProps) {
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
        .select(`
          id, 
          name, 
          sku,
          description,
          tags,
          price_retail, 
          price_wholesale,
          wholesale_min_qty,
          original_image_url, 
          processed_image_url, 
          catalog_image_url,
          thumbnail_image_url,
          image_url
        `)
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

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)),
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.tags || !Array.isArray(p.tags)) return false;
        return selectedTags.some((tag) => p.tags!.includes(tag));
      });
    }

    return filtered;
  }, [products, searchQuery, selectedTags]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [filteredProducts, selectedIds]);

  const handleToggleProduct = useCallback(
    (productId: string, e?: React.MouseEvent) => {
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

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTags([]);
  }, []);

  const SelectorContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-base font-medium mb-1">No tienes productos disponibles</p>
          <p className="text-sm text-muted-foreground">Crea productos para incluirlos en tu catálogo</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Búsqueda prominente */}
        <div className="space-y-3">
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
              isMobile ? "h-5 w-5" : "h-4 w-4"
            )} />
            <Input
              placeholder={isMobile ? "Buscar productos..." : "Buscar por nombre o SKU..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 pr-10",
                isMobile ? "h-12 text-base" : "h-11 text-sm"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={selectedIds.length === filteredProducts.length ? handleDeselectAll : handleSelectAll}
              className={cn(
                "flex-1",
                isMobile && "h-11"
              )}
            >
              {selectedIds.length === filteredProducts.length ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Deseleccionar todo
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Seleccionar todo
                </>
              )}
            </Button>

            {(searchQuery || selectedTags.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size={isMobile ? "default" : "sm"}
                onClick={handleClearFilters}
                className={isMobile ? "h-11 px-4" : ""}
              >
                <X className="h-4 w-4 mr-2" />
                {!isMobile && "Limpiar"}
              </Button>
            )}
          </div>
        </div>

        {/* Filtros por tags */}
        {availableTags.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por categoría</span>
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {selectedTags.length} activo{selectedTags.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <ScrollArea className="w-full">
              <div className={cn(
                "flex gap-2",
                isMobile ? "pb-2" : "flex-wrap"
              )}>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        isMobile && "px-4 py-2.5 text-sm whitespace-nowrap",
                        !isMobile && "px-3 py-1.5 hover:bg-accent",
                        isMobile && "active:scale-95",
                        isSelected && "bg-primary text-primary-foreground shadow-sm"
                      )}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Contador visual */}
        <div className={cn(
          "flex items-center justify-between py-2 px-3 rounded-lg",
          selectedIds.length > 0 ? "bg-primary/10 border border-primary/20" : "bg-muted"
        )}>
          <div className="flex items-center gap-2">
            <ShoppingCart className={cn(
              "h-4 w-4",
              selectedIds.length > 0 ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              selectedIds.length > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {selectedIds.length} producto{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          {(searchQuery || selectedTags.length > 0) && (
            <span className="text-xs text-muted-foreground">
              {filteredProducts.length} en resultados
            </span>
          )}
        </div>

        {/* Grid de productos */}
        <ScrollArea className={cn(
          "rounded-lg border",
          isMobile ? "h-[calc(100vh-420px)]" : isTablet ? "h-[400px]" : "h-[450px]"
        )}>
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">No se encontraron productos</p>
              <p className="text-xs text-muted-foreground">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className={cn(
              "p-3 gap-3",
              isMobile ? "grid grid-cols-1" : isTablet ? "grid grid-cols-2" : "grid grid-cols-2 lg:grid-cols-3"
            )}>
              {sortedProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const imageUrl = product.catalog_image_url || 
                                product.processed_image_url || 
                                product.thumbnail_image_url || 
                                product.original_image_url || 
                                product.image_url;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleToggleProduct(product.id)}
                    className={cn(
                      "group relative rounded-lg border-2 cursor-pointer transition-all",
                      "hover:shadow-md",
                      isMobile && "active:scale-[0.98]",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {/* Checkbox visual */}
                    <div className={cn(
                      "absolute top-2 left-2 z-10",
                      isMobile ? "top-3 left-3" : "top-2 left-2"
                    )}>
                      <div className={cn(
                        "rounded-md border-2 transition-all flex items-center justify-center",
                        isMobile ? "h-7 w-7" : "h-6 w-6",
                        isSelected 
                          ? "bg-primary border-primary" 
                          : "bg-background border-border group-hover:border-primary/50"
                      )}>
                        {isSelected && (
                          <CheckCircle2 className={cn(
                            "text-primary-foreground",
                            isMobile ? "h-5 w-5" : "h-4 w-4"
                          )} />
                        )}
                      </div>
                    </div>

                    {/* Imagen */}
                    <div className={cn(
                      "relative overflow-hidden rounded-t-lg bg-muted",
                      isMobile ? "aspect-square" : "aspect-[4/3]"
                    )}>
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {!isMobile && (
                        <div className={cn(
                          "absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all pointer-events-none"
                        )} />
                      )}
                    </div>

                    {/* Info del producto */}
                    <div className={cn(
                      "p-3 space-y-2",
                      isMobile && "p-4"
                    )}>
                      <h4 className={cn(
                        "font-semibold line-clamp-2 leading-tight",
                        isMobile ? "text-base" : "text-sm"
                      )}>
                        {product.name}
                      </h4>
                      
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "font-bold text-primary",
                          isMobile ? "text-base" : "text-sm"
                        )}>
                          {formatPrice(product.price_retail / 100)}
                        </span>
                        
                        {product.sku && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {product.sku}
                          </Badge>
                        )}
                      </div>

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, isMobile ? 2 : 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              +{product.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Badge seleccionado */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm">
                        Seleccionado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  // Mobile: Sheet Drawer
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full rounded-lg border-2 transition-all",
            "hover:border-primary/50 active:scale-[0.98]",
            selectedIds.length > 0 
              ? "border-primary bg-primary/5" 
              : "border-border bg-background"
          )}
        >
          <div className="flex items-center gap-3 p-4">
            <div className={cn(
              "flex items-center justify-center rounded-lg h-12 w-12 flex-shrink-0 relative",
              selectedIds.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <ShoppingCart className="h-6 w-6" />
              {selectedIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center font-bold">
                  {selectedIds.length}
                </span>
              )}
            </div>
            
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">
                {selectedIds.length === 0 
                  ? "Seleccionar productos" 
                  : `${selectedIds.length} producto${selectedIds.length !== 1 ? 's' : ''} seleccionado${selectedIds.length !== 1 ? 's' : ''}`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedIds.length === 0 
                  ? "Toca para elegir productos" 
                  : "Toca para modificar selección"
                }
              </p>
            </div>

            <div className="text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent 
            side="bottom" 
            className="h-[95vh] flex flex-col p-0 rounded-t-2xl"
          >
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle className="text-xl">Seleccionar Productos</SheetTitle>
              <SheetDescription>
                Toca los productos que quieres incluir en tu catálogo
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden px-6 pt-4">
              <SelectorContent />
            </div>

            <div className="border-t p-4 bg-background">
              <Button 
                className="w-full h-12 text-base font-semibold" 
                onClick={() => setIsOpen(false)}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmar selección ({selectedIds.length})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Tablet: Dialog Modal
  if (isTablet) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full rounded-lg border-2 transition-all hover:border-primary/50",
            selectedIds.length > 0 
              ? "border-primary bg-primary/5" 
              : "border-border bg-background"
          )}
        >
          <div className="flex items-center gap-3 p-4">
            <div className={cn(
              "flex items-center justify-center rounded-lg h-10 w-10 flex-shrink-0 relative",
              selectedIds.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <ShoppingCart className="h-5 w-5" />
              {selectedIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center font-bold">
                  {selectedIds.length}
                </span>
              )}
            </div>
            
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">
                {selectedIds.length === 0 
                  ? "Seleccionar productos" 
                  : `${selectedIds.length} seleccionado${selectedIds.length !== 1 ? 's' : ''}`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Haz clic para elegir productos
              </p>
            </div>
          </div>
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle className="text-lg">Seleccionar Productos</DialogTitle>
              <DialogDescription>
                Elige los productos que aparecerán en tu catálogo
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden px-6 pt-4">
              <SelectorContent />
            </div>

            <div className="border-t p-4 flex gap-3">
              <Button 
                variant="outline"
                className="flex-1 h-10" 
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 h-10" 
                onClick={() => setIsOpen(false)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar ({selectedIds.length})
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Inline
  return (
    <div className="space-y-4">
      <SelectorContent />
    </div>
  );
}
