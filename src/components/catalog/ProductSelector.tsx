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
import { Search, CheckSquare, Square, Loader2, Tag, X, ChevronRight } from "lucide-react";
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
  const { isMobile, isTablet, isDesktop, isUltraWide } = useBreakpoint();
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

  // Obtener todas las etiquetas únicas disponibles
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

    // Filtrar por búsqueda de texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)),
      );
    }

    // Filtrar por etiquetas seleccionadas
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.tags || !Array.isArray(p.tags)) return false;
        // El producto debe tener al menos una de las etiquetas seleccionadas
        return selectedTags.some((tag) => p.tags!.includes(tag));
      });
    }

    return filtered;
  }, [products, searchQuery, selectedTags]);

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

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTags([]);
  }, []);

  // ✅ COMPONENTE COMPARTIDO: El contenido del selector
  const SelectorContent = () => {
    // Determinar altura del ScrollArea según dispositivo
    const scrollHeight = isMobile ? 'h-[50vh]' : 
                         isTablet ? 'h-[55vh]' : 
                         isDesktop ? 'h-[400px]' : 
                         'h-[500px]'; // Ultra-wide

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
        {/* Búsqueda y acciones */}
        <div className={cn(
          "gap-2",
          isMobile ? "space-y-3" : "flex items-center"
        )}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-9",
                isMobile ? "h-12 text-base" : "h-10 text-sm"
              )}
            />
          </div>
          
          <div className={cn(
            "flex gap-2",
            isMobile && "w-full"
          )}>
            <Button
              type="button"
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={selectedIds.length === filteredProducts.length ? handleDeselectAll : handleSelectAll}
              className={isMobile ? "flex-1 h-12" : ""}
            >
              {selectedIds.length === filteredProducts.length ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  {isMobile ? "Deseleccionar" : "Deseleccionar todos"}
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {isMobile ? "Seleccionar" : "Seleccionar todos"}
                </>
              )}
            </Button>
            
            {isMobile && (searchQuery || selectedTags.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={handleClearFilters}
                className="h-12 px-4"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros por etiquetas - RESPONSIVE */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrar por etiquetas</span>
              </div>
              {!isMobile && (searchQuery || selectedTags.length > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
            
            <ScrollArea className={isMobile ? "w-full" : ""}>
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
                        isMobile && "px-4 py-2 text-sm whitespace-nowrap min-h-10 active:scale-95",
                        isTablet && "px-3 py-1.5 text-sm hover:bg-accent",
                        (isDesktop || isUltraWide) && "hover:bg-accent",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Contador */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
          </span>
          {(searchQuery || selectedTags.length > 0) && (
            <span>
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Lista de productos - ALTURA RESPONSIVE */}
        <ScrollArea className={cn("rounded-md border", scrollHeight)}>
          <div className={cn(
            "space-y-2",
            isMobile ? "p-3" : "p-4"
          )}>
            {sortedProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No se encontraron productos
              </p>
            ) : (
              sortedProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const imageUrl = product.catalog_image_url || 
                                product.processed_image_url || 
                                product.thumbnail_image_url || 
                                product.original_image_url || 
                                product.image_url;

                return (
                  <label
                    key={product.id}
                    htmlFor={`product-${product.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border cursor-pointer transition-all",
                      isMobile && "active:scale-[0.98] p-4 min-h-[80px]",
                      isTablet && "hover:bg-accent p-3.5",
                      (isDesktop || isUltraWide) && "hover:bg-accent p-3",
                      isSelected ? "border-primary bg-primary/5" : ""
                    )}
                  >
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleProduct(product.id)}
                      className={cn(
                        isMobile ? "h-6 w-6" : "h-5 w-5"
                      )}
                    />

                    <img
                      src={imageUrl}
                      alt={product.name}
                      className={cn(
                        "rounded object-cover pointer-events-none",
                        isMobile && "h-16 w-16",
                        isTablet && "h-14 w-14",
                        (isDesktop || isUltraWide) && "h-12 w-12"
                      )}
                    />

                    <div className="flex-1 min-w-0 pointer-events-none">
                      <p className={cn(
                        "font-medium truncate",
                        isMobile ? "text-base" : "text-sm"
                      )}>
                        {product.name}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {product.sku && (
                          <Badge variant="outline" className="text-xs">
                            {product.sku}
                          </Badge>
                        )}
                        <span className={cn(
                          "text-muted-foreground",
                          isMobile && "text-sm font-medium",
                          !isMobile && "text-sm"
                        )}>
                          {formatPrice(product.price_retail / 100)}
                        </span>
                      </div>
                      
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {product.tags.slice(0, isMobile ? 2 : 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > (isMobile ? 2 : 3) && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              +{product.tags.length - (isMobile ? 2 : 3)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // ✅ RENDERIZADO CONDICIONAL POR DISPOSITIVO
  
  // MOBILE: Sheet drawer (bottom)
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-between"
          onClick={() => setIsOpen(true)}
        >
          <span className="text-sm">
            {selectedIds.length === 0 
              ? "Seleccionar productos" 
              : `${selectedIds.length} producto${selectedIds.length !== 1 ? 's' : ''} seleccionado${selectedIds.length !== 1 ? 's' : ''}`
            }
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle>Seleccionar Productos</SheetTitle>
              <SheetDescription>
                Toca para agregar o quitar productos del catálogo
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-hidden p-6 pt-4">
              <SelectorContent />
            </div>

            <div className="border-t p-4 bg-background">
              <Button 
                className="w-full h-12" 
                onClick={() => setIsOpen(false)}
              >
                Confirmar ({selectedIds.length} producto{selectedIds.length !== 1 ? 's' : ''})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // TABLET: Dialog modal (más control de espacio)
  if (isTablet) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 justify-between"
          onClick={() => setIsOpen(true)}
        >
          <span className="text-sm">
            {selectedIds.length === 0 
              ? "Seleccionar productos" 
              : `${selectedIds.length} seleccionado${selectedIds.length !== 1 ? 's' : ''}`
            }
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>Seleccionar Productos</DialogTitle>
              <DialogDescription>
                Selecciona los productos que aparecerán en el catálogo
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden p-6 pt-4">
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
                Confirmar ({selectedIds.length})
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // DESKTOP & ULTRA-WIDE: Inline (sin modal)
  return <SelectorContent />;
}
