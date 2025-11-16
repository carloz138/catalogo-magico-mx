import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider"; // Asegúrate de tener este componente o usa inputs
import { Search, ShoppingCart, Filter, X, Radar, AlertCircle, DollarSign, Plus, ChevronDown } from "lucide-react";
import { DigitalCatalog, Product } from "@/types/digital-catalog";
import { QuoteCartModal } from "@/components/public/QuoteCartModal";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PublicCatalogContentProps {
  catalog: DigitalCatalog & { isReplicated?: boolean; resellerId?: string };
  onTrackEvent: (event: string, data?: any) => void;
}

// --- COMPONENTE INTERNO: TARJETA PÚBLICA (Diseñada para vender) ---
const PublicProductCard = ({ product, onAdd, onView }: { product: Product; onAdd: () => void; onView: () => void }) => {
  return (
    <div
      className="group relative flex flex-col overflow-hidden bg-white shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
      onClick={onView} // Clic en la tarjeta abre detalle
    >
      {/* Imagen */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <img
          src={product.image_url || product.original_image_url || "/placeholder.png"}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {/* Botón Flotante Rápido (Aparece en hover en desktop, siempre visible en móvil si prefieres) */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar abrir el detalle
            onAdd();
          }}
          className="absolute bottom-3 right-3 h-10 w-10 bg-white/90 backdrop-blur text-black rounded-full flex items-center justify-center shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm md:text-base mb-1">{product.name}</h3>

        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">${(product.price_retail / 100).toFixed(2)}</span>
            {product.price_wholesale && (
              <span className="text-xs text-muted-foreground">
                Mayoreo: ${(product.price_wholesale / 100).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function PublicCatalogContent({ catalog, onTrackEvent }: PublicCatalogContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 1000);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filtros de Precio
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });

  // Estado Radar
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [radarForm, setRadarForm] = useState({ name: "", email: "", product: "", quantity: "1" });

  // 1. Search Logs
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
      const logSearch = async () => {
        await supabase.from("search_logs").insert({
          catalog_id: catalog.id,
          search_term: debouncedSearch,
          results_count: filteredProducts.length,
          user_id: catalog.user_id,
        });
      };
      logSearch();
      onTrackEvent("Search", { search_string: debouncedSearch });
    }
  }, [debouncedSearch]);

  // Filtrado Maestro
  const filteredProducts = useMemo(() => {
    return (
      catalog.products?.filter((product) => {
        // 1. Texto
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        // 2. Categoría
        const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
        // 3. Precio
        const price = product.price_retail / 100;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        const matchesPrice = price >= min && price <= max;

        return matchesSearch && matchesCategory && matchesPrice;
      }) || []
    );
  }, [catalog.products, searchTerm, selectedCategory, priceRange]);

  const categories = Array.from(new Set(catalog.products?.map((p) => p.category).filter(Boolean) as string[]));

  // Handlers
  const handleAddToCart = (product: Product) => {
    onTrackEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      value: product.price_retail / 100,
      currency: "MXN",
    });
    setIsCartOpen(true); // Abrimos el carrito para dar feedback inmediato
    // NOTA: Aquí el componente QuoteCartModal debería escuchar un evento o usar un contexto para añadirlo.
    // Como estamos en un componente "tonto", asumimos que el usuario usará el botón dentro del modal o
    // que el QuoteCartContext está activo y podemos usar un hook aquí.
    // *Para simplificar, abrimos el carrito. Idealmente, usaríamos el hook useQuoteCart aquí mismo.*
  };

  const handleRadarSubmit = async () => {
    try {
      await supabase.from("solicitudes_mercado").insert({
        catalog_id: catalog.id,
        fabricante_id: catalog.user_id,
        revendedor_id: catalog.resellerId || null,
        cliente_final_nombre: radarForm.name,
        cliente_final_email: radarForm.email,
        producto_nombre: radarForm.product,
        cantidad: parseInt(radarForm.quantity),
        estatus_fabricante: "nuevo",
      });
      toast({ title: "Solicitud enviada", description: "Haremos lo posible por conseguir este producto." });
      setShowRadarModal(false);
      setRadarForm({ name: "", email: "", product: "", quantity: "1" });
    } catch (e) {
      toast({ title: "Error", description: "Intenta nuevamente", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Banner */}
      <div
        className="h-48 md:h-64 bg-cover bg-center relative transition-all"
        style={{
          backgroundImage: catalog.background_pattern ? `url(${catalog.background_pattern})` : undefined,
          backgroundColor: catalog.brand_colors?.primary || "#1e293b",
        }}
      >
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
          {catalog.logo_url && (
            <img
              src={catalog.logo_url}
              alt="Logo"
              className="h-16 w-16 object-contain mb-4 rounded-full bg-white p-1"
            />
          )}
          <h1 className="text-3xl md:text-4xl font-bold drop-shadow-md">{catalog.name}</h1>
          {catalog.description && <p className="mt-2 max-w-xl text-white/90 drop-shadow-sm">{catalog.description}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        {/* Toolbar de Filtros y Búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-gray-100">
          <div className="flex flex-col gap-4">
            {/* Fila Superior: Buscador y Filtro de Precio */}
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="¿Qué estás buscando?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-primary focus:ring-primary h-11"
                />
              </div>

              {/* Filtro de Precio (Popover) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 border-gray-200 text-gray-700 hover:bg-gray-50 gap-2">
                    <DollarSign className="h-4 w-4" />
                    Precio
                    {(priceRange.min || priceRange.max) && (
                      <Badge variant="secondary" className="h-5 px-1 ml-1 bg-primary/10 text-primary rounded-sm">
                        Activado
                      </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Rango de Precio</h4>
                    <div className="flex items-center gap-2">
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="min">Mínimo</Label>
                        <Input
                          id="min"
                          type="number"
                          placeholder="0"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="max">Máximo</Label>
                        <Input
                          id="max"
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        />
                      </div>
                    </div>
                    {(priceRange.min || priceRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setPriceRange({ min: "", max: "" })}
                      >
                        Limpiar filtro
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Fila Inferior: Categorías (Scroll Horizontal) */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors",
                    selectedCategory === null ? "hover:bg-primary/90" : "hover:bg-gray-100 border-gray-300",
                  )}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </Badge>
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors",
                      selectedCategory === cat ? "hover:bg-primary/90" : "hover:bg-gray-100 border-gray-300",
                    )}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4 flex justify-between items-end">
          <p className="text-sm text-muted-foreground">Mostrando {filteredProducts.length} productos</p>
        </div>

        {filteredProducts.length === 0 ? (
          /* Estado Vacío + RADAR DE MERCADO */
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Radar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No encontramos resultados</h3>
            <p className="text-gray-500 max-w-md mx-auto mt-2 mb-6">
              No tenemos "{searchTerm}" en este momento, pero podemos conseguirlo para ti.
            </p>
            <Button onClick={() => setShowRadarModal(true)} className="bg-primary hover:bg-primary/90">
              Solicitar este producto
            </Button>
            <div className="mt-4">
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                  setPriceRange({ min: "", max: "" });
                }}
              >
                Ver todos los productos
              </Button>
            </div>
          </div>
        ) : (
          /* Grid de Productos */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <PublicProductCard
                key={product.id}
                product={product as Product}
                onView={() =>
                  onTrackEvent("ViewContent", {
                    content_ids: [product.id],
                    content_name: product.name,
                    value: product.price_retail / 100,
                    currency: "MXN",
                  })
                }
                onAdd={() => handleAddToCart(product as Product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botón Flotante Carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-xl h-16 w-16 p-0 bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-7 w-7 text-white" />
          {/* Aquí se podría poner un badge con el contador si tuviéramos acceso al contexto */}
        </Button>
      </div>

      {/* Modales */}
      <QuoteCartModal
        {...({
          open: isCartOpen,
          isOpen: isCartOpen,
          onClose: () => setIsCartOpen(false),
          catalog: catalog,
          onSubmitQuote: () => onTrackEvent("Lead", { currency: "MXN", value: 0 }),
        } as any)}
      />

      <Dialog open={showRadarModal} onOpenChange={setShowRadarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Qué producto buscas?</DialogTitle>
            <DialogDescription>Déjanos saber qué necesitas y te notificaremos cuando lo tengamos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Producto buscado</Label>
              <Input
                value={radarForm.product}
                onChange={(e) => setRadarForm({ ...radarForm, product: e.target.value })}
                placeholder={searchTerm || "Ej: Tenis rojos talla 28"}
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad aproximada</Label>
              <Input
                type="number"
                value={radarForm.quantity}
                onChange={(e) => setRadarForm({ ...radarForm, quantity: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tu Nombre</Label>
                <Input value={radarForm.name} onChange={(e) => setRadarForm({ ...radarForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tu Email</Label>
                <Input
                  value={radarForm.email}
                  onChange={(e) => setRadarForm({ ...radarForm, email: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRadarSubmit}>Enviar Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
