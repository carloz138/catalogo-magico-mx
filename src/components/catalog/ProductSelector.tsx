import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Loader2, 
  X,
  Package,
  Store,
  Users,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// TYPES
// ==========================================

interface OwnProduct {
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

interface SubscribedProduct {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_description: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  image_url: string | null;
  vendor_name: string;
  catalog_id: string;
  catalog_name: string;
}

interface UnifiedProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  imageUrl: string;
  source: "own" | "vendor";
  vendorName?: string;
}

interface ProductSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], products: any[], hasVendorProducts: boolean) => void;
  catalogType?: "standard" | "super";
}

// ==========================================
// DATA FETCHING HOOKS
// ==========================================

function useOwnProducts(userId: string | undefined) {
  return useQuery({
    queryKey: ["own-products", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, sku, description, tags,
          price_retail, price_wholesale,
          original_image_url, processed_image_url, 
          catalog_image_url, thumbnail_image_url, image_url
        `)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as OwnProduct[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

function useSubscribedProducts(userId: string | undefined) {
  return useQuery({
    queryKey: ["subscribed-products", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase.rpc('get_subscribed_catalog_products', {
        p_subscriber_id: userId
      });

      if (error) throw error;
      return (data || []) as SubscribedProduct[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ==========================================
// COMPONENT
// ==========================================

export function ProductSelector({ selectedIds, onChange, catalogType = "standard" }: ProductSelectorProps) {
  const { user } = useAuth();
  
  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"own" | "vendors">("own");

  // Data queries
  const { 
    data: ownProducts = [], 
    isLoading: loadingOwn 
  } = useOwnProducts(user?.id);
  
  const { 
    data: subscribedProducts = [], 
    isLoading: loadingSubscribed 
  } = useSubscribedProducts(user?.id);

  // ==========================================
  // UNIFIED PRODUCT LISTS
  // ==========================================

  const unifiedOwnProducts: UnifiedProduct[] = useMemo(() => {
    return ownProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price_retail || 0,
      imageUrl: p.catalog_image_url || p.processed_image_url || p.thumbnail_image_url || p.original_image_url || p.image_url || "",
      source: "own" as const,
    }));
  }, [ownProducts]);

  const unifiedSubscribedProducts: UnifiedProduct[] = useMemo(() => {
    return subscribedProducts.map(p => ({
      id: p.product_id,
      name: p.product_name,
      sku: p.product_sku,
      price: p.price_retail || 0,
      imageUrl: p.image_url || "",
      source: "vendor" as const,
      vendorName: p.vendor_name,
    }));
  }, [subscribedProducts]);

  // ==========================================
  // FILTERING
  // ==========================================

  const filterProducts = useCallback((products: UnifiedProduct[]) => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const filteredOwnProducts = useMemo(() => 
    filterProducts(unifiedOwnProducts), 
    [unifiedOwnProducts, filterProducts]
  );

  const filteredSubscribedProducts = useMemo(() => 
    filterProducts(unifiedSubscribedProducts), 
    [unifiedSubscribedProducts, filterProducts]
  );

  // ==========================================
  // SELECTION HANDLERS
  // ==========================================

  const handleToggleProduct = useCallback((productId: string) => {
    const isSelected = selectedIds.includes(productId);
    let newSelectedIds: string[];

    if (isSelected) {
      newSelectedIds = selectedIds.filter(id => id !== productId);
    } else {
      newSelectedIds = [...selectedIds, productId];
    }

    // Build full products array for onChange
    const allProducts = [...ownProducts, ...subscribedProducts.map(p => ({
      id: p.product_id,
      name: p.product_name,
      sku: p.product_sku,
      price_retail: p.price_retail,
      image_url: p.image_url,
      _isVendor: true, // Mark vendor products
    }))];
    
    const selectedProducts = allProducts.filter(p => 
      newSelectedIds.includes('id' in p ? p.id : (p as any).product_id)
    );

    // Check if any selected product is from vendors
    const hasVendorProducts = selectedProducts.some((p: any) => p._isVendor);

    onChange(newSelectedIds, selectedProducts, hasVendorProducts);
  }, [selectedIds, ownProducts, subscribedProducts, onChange]);

  // ==========================================
  // COUNTS
  // ==========================================

  const selectedOwnCount = useMemo(() => 
    unifiedOwnProducts.filter(p => selectedIds.includes(p.id)).length,
    [unifiedOwnProducts, selectedIds]
  );

  const selectedVendorCount = useMemo(() => 
    unifiedSubscribedProducts.filter(p => selectedIds.includes(p.id)).length,
    [unifiedSubscribedProducts, selectedIds]
  );

  const totalSelected = selectedIds.length;

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderProductCard = (product: UnifiedProduct) => {
    const isSelected = selectedIds.includes(product.id);

    return (
      <div
        key={product.id}
        onClick={() => handleToggleProduct(product.id)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
          "active:scale-[0.98] touch-manipulation",
          "md:p-4",
          isSelected 
            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
            : "border-border bg-card hover:border-muted-foreground/30"
        )}
      >
        {/* Checkbox - Large tap target */}
        <div 
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleToggleProduct(product.id)}
            className="h-6 w-6 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        {/* Image */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Product Name - truncated */}
          <h4 className="font-medium text-sm leading-tight truncate" title={product.name}>
            {product.name}
          </h4>
          
          {/* Origin Badge + SKU row */}
          <div className="flex items-center gap-1.5">
            {product.source === "own" ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground font-normal shrink-0">
                Propio
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-normal shrink-0 max-w-[100px] truncate">
                {product.vendorName || "Proveedor"}
              </Badge>
            )}
            
            {product.sku && (
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[60px]" title={product.sku}>
                {product.sku}
              </span>
            )}
          </div>

          {/* Price - formatted correctly (divide by 100 for cents) */}
          <p className="text-sm font-semibold text-primary">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price / 100)}
          </p>
        </div>
      </div>
    );
  };

  const renderEmptyState = (type: "own" | "vendors") => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {type === "own" ? (
        <>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium mb-1">No tienes productos propios</p>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Crea productos en tu inventario para agregarlos aquí
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="font-medium mb-1">Sin productos de proveedores</p>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Suscríbete a catálogos para agregar productos externos
          </p>
        </>
      )}
    </div>
  );

  const renderNoResults = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium mb-1">Sin resultados</p>
      <p className="text-sm text-muted-foreground">
        Intenta con otros términos de búsqueda
      </p>
    </div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Cargando productos...</p>
      </div>
    </div>
  );

  const renderProductGrid = (products: UnifiedProduct[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 pb-4">
      {products.map(renderProductCard)}
    </div>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================

  const isLoading = loadingOwn || loadingSubscribed;
  const hasVendorProducts = subscribedProducts.length > 0;
  const showTabs = catalogType === "super" || hasVendorProducts;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-20 bg-background pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 md:h-10 text-base md:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {showTabs ? (
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as "own" | "vendors")} 
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 mb-3 h-11">
              <TabsTrigger value="own" className="gap-1.5 text-sm data-[state=active]:bg-background">
                <Store className="h-4 w-4" />
                <span className="hidden xs:inline">Mis Productos</span>
                <span className="xs:hidden">Míos</span>
                {selectedOwnCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] bg-primary text-primary-foreground">
                    {selectedOwnCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-1.5 text-sm data-[state=active]:bg-background">
                <Users className="h-4 w-4" />
                <span className="hidden xs:inline">Proveedores</span>
                <span className="xs:hidden">Ext.</span>
                {selectedVendorCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] bg-violet-600 text-white">
                    {selectedVendorCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="own" className="flex-1 m-0 min-h-0">
              <ScrollArea className="h-[calc(100vh-420px)] md:h-[380px]">
                {loadingOwn ? renderLoading() : (
                  filteredOwnProducts.length === 0 ? (
                    searchQuery ? renderNoResults() : renderEmptyState("own")
                  ) : (
                    renderProductGrid(filteredOwnProducts)
                  )
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="vendors" className="flex-1 m-0 min-h-0">
              <ScrollArea className="h-[calc(100vh-420px)] md:h-[380px]">
                {loadingSubscribed ? renderLoading() : (
                  filteredSubscribedProducts.length === 0 ? (
                    searchQuery ? renderNoResults() : renderEmptyState("vendors")
                  ) : (
                    renderProductGrid(filteredSubscribedProducts)
                  )
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          // Standard catalog: only own products
          <ScrollArea className="h-[calc(100vh-360px)] md:h-[420px]">
            {loadingOwn ? renderLoading() : (
              filteredOwnProducts.length === 0 ? (
                searchQuery ? renderNoResults() : renderEmptyState("own")
              ) : (
                renderProductGrid(filteredOwnProducts)
              )
            )}
          </ScrollArea>
        )}
      </div>

      {/* Floating Counter */}
      <div className={cn(
        "sticky bottom-0 mt-auto pt-3 border-t bg-background",
        "flex items-center justify-between gap-3"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            totalSelected > 0 ? "bg-primary/10" : "bg-muted"
          )}>
            <ShoppingBag className={cn(
              "h-4 w-4",
              totalSelected > 0 ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <span className={cn(
            "text-sm font-medium",
            totalSelected > 0 ? "text-foreground" : "text-muted-foreground"
          )}>
            {totalSelected} producto{totalSelected !== 1 ? "s" : ""} seleccionado{totalSelected !== 1 ? "s" : ""}
          </span>
        </div>

        {showTabs && totalSelected > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="bg-muted px-2 py-1 rounded-full">{selectedOwnCount} propios</span>
            <span className="bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded-full text-violet-700 dark:text-violet-300">
              {selectedVendorCount} ext.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
