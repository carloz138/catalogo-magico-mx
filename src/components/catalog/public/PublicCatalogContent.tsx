import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Search, ShoppingCart, Radar, DollarSign, Plus, ChevronDown, Minus, X, Eye } from "lucide-react"; // Añadimos 'Eye'
import { DigitalCatalog, Product } from "@/types/digital-catalog";
import { QuoteCartModal } from "@/components/public/QuoteCartModal";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuoteCart } from "@/contexts/QuoteCartContext";

interface PublicCatalogContentProps {
  catalog: DigitalCatalog & { isReplicated?: boolean; resellerId?: string };
  onTrackEvent: (event: string, data?: any) => void;
}

// --- COMPONENTE INTERNO: MODAL DE IMAGEN GRANDE ---
const ProductImageZoomModal = ({ product, isOpen, onClose }: { product: Product | null; isOpen: boolean; onClose: () => void }) => {
    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md md:max-w-lg lg:max-w-xl p-0 overflow-hidden rounded-lg">
                <div className="relative">
                    <img 
                        src={product.image_url || product.original_image_url || "/placeholder.png"} 
                        alt={product.name} 
                        className="w-full h-auto max-h-[80vh] object-contain" 
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-4 bg-white border-t">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {product.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// --- COMPONENTE INTERNO: TARJETA PÚBLICA ---
const PublicProductCard = ({ 
  product, 
  onAdd, 
  onView,
  onZoomImage // Nueva prop
}: { 
  product: Product; 
  onAdd: () => void; 
  onView: () => void; 
  onZoomImage: () => void; // Nueva prop
}) => {
  const price = product.price_retail ? product.price_retail / 100 : 0;
  const hasVariants = product.has_variants || (product.variants && product.variants.length > 0);

  return (
    <div 
      className="group relative flex flex-col overflow-hidden bg-white shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onView} // Clic en la tarjeta abre detalle/variantes
    >
      {/* Imagen */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.image_url || product.original_image_url ? (
            <img 
            src={product.image_url || product.original_image_url || ""} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <span className="text-xs">Sin imagen</span>
            </div>
        )}
        
        {/* Botón Flotante para Zoom */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar abrir el detalle del producto
            onZoomImage();
          }}
          className="absolute top-3 left-3 h-10 w-10 bg-white/90 backdrop-blur text-black rounded-full flex items-center justify-center shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-200 z-20"
          title="Ver imagen grande"
        >
          <Eye className="h-5 w-5" />
        </button>

        {/* Botón Flotante para Agregar */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar abrir el detalle del producto
            onAdd();
          }}
          className="absolute bottom-3 right-3 h-10 w-10 bg-white/90 backdrop-blur text-black rounded-full flex items-center justify-center shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white z-10"
          title="Agregar al carrito"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm md:text-base mb-1">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="flex flex-col">
             <span className="text-lg font-bold text-gray-900">
               ${price.toFixed(2)}
             </span>
             {hasVariants && (
                 <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 w-fit mt-1">
                     {product.variants?.length} opciones
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
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: "", max: "" });

  const [showRadarModal, setShowRadarModal] = useState(false);
  const [radarForm, setRadarForm] = useState({ name: "", email: "", product: "", quantity: "1" });

  const { addItem, items } = useQuoteCart();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Para modal de variantes
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // 👇 NUEVO ESTADO: Para el modal de zoom de imagen
  const [productToZoom, setProductToZoom] = useState<Product | null>(null);


  // Search Logs
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
       const logSearch = async () => {
         await supabase.from('search_logs').insert({
            catalog_id: catalog.id,
            search_term: debouncedSearch,
            results_count: filteredProducts.length,
            user_id: catalog.user_id
         });
       };
       logSearch();
       onTrackEvent('Search', { search_string: debouncedSearch });
    }
  }, [debouncedSearch]);

  // Filtrado
  const filteredProducts = useMemo(() => {
    return catalog.products?.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      const price = product.price_retail ? product.price_retail / 100 : 0; // Manejo seguro de precio
      const min = priceRange.min ? parseFloat(priceRange.min) : 0;
      const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchesPrice = price >= min && price <= max;
      return matchesSearch && matchesCategory && matchesPrice;
    }) || [];
  }, [catalog.products, searchTerm, selectedCategory, priceRange]);

  const categories = Array.from(new Set(catalog.products?.map(p => p.category).filter(Boolean) as string[]));

  // --- HANDLERS ---

  const handleProductInteraction = (product: Product) => {
    if (product.has_variants || (product.variants && product.variants.length > 0)) {
        setSelectedProduct(product);
        setSelectedVariantId(null);
        setQuantity(1);
        onTrackEvent('ViewContent', { 
            content_ids: [product.id], 
            content_name: product.name, 
            value: (product.price_retail || 0) / 100, // Manejo seguro
            currency: 'MXN' 
        });
    } else {
        addToCartSimple(product);
    }
  };

  const addToCartSimple = (product: Product) => {
      addItem({
          id: product.id,
          name: product.name,
          price: product.price_retail || 0, // Asegura que no sea null
          image: product.image_url || product.original_image_url,
          quantity: 1,
      });
      toast({ title: "Agregado", description: `${product.name} agregado al carrito.` });
      setIsCartOpen(true);
      onTrackEvent('AddToCart', { 
        content_ids: [product.id], 
        content_name: product.name, 
        value: (product.price_retail || 0) / 100, 
        currency: 'MXN' 
    });
  };

  const handleAddVariantToCart = () => {
      if (!selectedProduct) return;
      
      const variant = selectedProduct.variants?.find(v => v.id === selectedVariantId);
      
      if (!variant && (selectedProduct.variants && selectedProduct.variants.length > 0)) {
          toast({ title: "Selecciona una opción", description: "Debes elegir una variante (talla/color)", variant: "destructive" });
          return;
      }

      const priceToUse = variant ? (variant.price_retail || 0) : (selectedProduct.price_retail || 0); // Asegura que no sea null
      const nameToUse = variant 
        ? `${selectedProduct.name} (${Object.values(variant.attributes || {}).join(', ')})` 
        : selectedProduct.name;

      addItem({
          id: selectedProduct.id,
          variantId: variant?.id,
          name: nameToUse,
          price: priceToUse,
          image: selectedProduct.image_url || selectedProduct.original_image_url,
          quantity: quantity,
      });

      toast({ title: "Agregado", description: `${quantity}x ${nameToUse} al carrito.` });
      setSelectedProduct(null);
      setIsCartOpen(true);
      
      onTrackEvent('AddToCart', { 
        content_ids: [selectedProduct.id], 
        content_name: nameToUse, 
        value: (priceToUse / 100) * quantity, 
        currency: 'MXN' 
    });
  };

  const handleRadarSubmit = async () => {
    try {
        await supabase.from('solicitudes_mercado').insert({
            catalog_id: catalog.id,
            fabricante_id: catalog.user_id,
            revendedor_id: catalog.resellerId || null,
            cliente_final_nombre: radarForm.name,
            cliente_final_email: radarForm.email,
            producto_nombre: radarForm.product,
            cantidad: parseInt(radarForm.quantity),
            estatus_fabricante: 'nuevo'
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
            backgroundColor: catalog.brand_colors?.primary || '#1e293b'
        }}
      >
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
            {catalog.logo_url && (
                <img src={catalog.logo_url} alt="Logo" className="h-16 w-16 object-contain mb-4 rounded-full bg-white p-1" />
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
                                {(priceRange.min || priceRange.max) && <Badge variant="secondary" className="h-5 px-1 ml-1 bg-primary/10 text-primary rounded-sm">Activado</Badge>}
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
                                            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid gap-1.5 flex-1">
                                        <Label htmlFor="max">Máximo</Label>
                                        <Input 
                                            id="max" 
                                            type="number" 
                                            placeholder="Max" 
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
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
                                selectedCategory === null ? "hover:bg-primary/90" : "hover:bg-gray-100 border-gray-300"
                            )}
                            onClick={() => setSelectedCategory(null)}
                        >
                            Todos
                        </Badge>
                        {categories.map(cat => (
                            <Badge 
                                key={cat}
                                variant={selectedCategory === cat ? "default" : "outline"}
                                className={cn(
                                    "cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors",
                                    selectedCategory === cat ? "hover:bg-primary/90" : "hover:bg-gray-100 border-gray-300"
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
            <p className="text-sm text-muted-foreground">
                Mostrando {filteredProducts.length} productos
            </p>
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
                    <Button variant="link" onClick={() => {setSearchTerm(''); setSelectedCategory(null); setPriceRange({min:'', max:''});}}>
                        Ver todos los productos
                    </Button>
                </div>
            </div>
        ) : (
            /* Grid de Productos */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                    <PublicProductCard 
                        key={product.id}
                        product={product as Product}
                        onView={() => handleProductInteraction(product as Product)}
                        onAdd={() => handleProductInteraction(product as Product)}
                        // 👇 Nueva prop para el zoom de imagen
                        onZoomImage={() => setProductToZoom(product as Product)}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Botón Flotante Carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
            size="lg" 
            className="rounded-full shadow-xl h-16 w-16 p-0 bg-primary hover:bg-primary/90 transition-transform hover:scale-105 relative"
            onClick={() => setIsCartOpen(true)}
        >
            <ShoppingCart className="h-7 w-7 text-white" />
            {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full border-2 border-white">
                    {items.length}
                </span>
            )}
        </Button>
      </div>

      {/* Modales */}
      {/* Modal de Detalles del Producto (Variantes) */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[425px]">
            {selectedProduct && (
                <>
                    <DialogHeader>
                        <DialogTitle>{selectedProduct.name}</DialogTitle>
                        <DialogDescription>
                           {selectedProduct.sku && <span className="font-mono text-xs bg-gray-100 px-1 rounded mr-2">{selectedProduct.sku}</span>}
                           Selecciona las opciones
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        {/* Imagen Principal */}
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border">
                             <img 
                                src={selectedProduct.image_url || selectedProduct.original_image_url || "/placeholder.png"} 
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover" 
                             />
                        </div>

                        {/* Selector de Variantes */}
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                            <div className="space-y-2">
                                <Label>Opciones disponibles</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {selectedProduct.variants.map(variant => (
                                        <div 
                                            key={variant.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                                selectedVariantId === variant.id 
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                                    : "hover:border-gray-300"
                                            )}
                                            onClick={() => setSelectedVariantId(variant.id)}
                                        >
                                            <span className="text-sm font-medium">
                                                {Object.values(variant.attributes || {}).join(' / ')}
                                            </span>
                                            <span className="font-bold">
                                                ${((variant.price_retail || 0) / 100).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                }
                                </div>
                            </div>
                        )}

                        {/* Cantidad */}
                        <div className="flex items-center justify-between mt-2">
                            <Label>Cantidad</Label>
                            <div className="flex items-center border rounded-md">
                                <Button 
                                    variant="ghost" size="icon" className="h-9 w-9" 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">{quantity}</span>
                                <Button 
                                    variant="ghost" size="icon" className="h-9 w-9" 
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button className="w-full" onClick={handleAddVariantToCart}>
                            Agregar al Carrito
                        </Button>
                    </DialogFooter>
                </>
            )}
        </DialogContent>
      </Dialog>

      {/* 👇 NUEVO MODAL: Zoom de Imagen */}
      <ProductImageZoomModal 
        product={productToZoom} 
        isOpen={!!productToZoom} 
        onClose={() => setProductToZoom(null)} 
      />

      {/* Modal Carrito */}
      <QuoteCartModal 
        {...({
            open: isCartOpen,
            isOpen: isCartOpen,
            onClose: () => setIsCartOpen(false),
            catalog: catalog,
            onSubmitQuote: () => onTrackEvent('Lead', { currency: 'MXN', value: 0 })
        } as any)}
      />

      {/* Modal Radar */}
      <Dialog open={showRadarModal} onOpenChange={setShowRadarModal}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>¿Qué producto buscas?</DialogTitle>
                <DialogDescription>
                    Déjanos saber qué necesitas y te notificaremos cuando lo tengamos.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Producto buscado</Label>
                    <Input 
                        value={radarForm.product} 
                        onChange={e => setRadarForm({...radarForm, product: e.target.value})}
                        placeholder={searchTerm || "Ej: Tenis rojos talla 28"} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Cantidad aproximada</Label>
                    <Input 
                        type="number"
                        value={radarForm.quantity} 
                        onChange={e => setRadarForm({...radarForm, quantity: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tu Nombre</Label>
                        <Input 
                            value={radarForm.name} 
                            onChange={e => setRadarForm({...radarForm, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tu Email</Label>
                        <Input 
                            value={radarForm.email} 
                            onChange={e => setRadarForm({...radarForm, email: e.target.value})}
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
```http://googleusercontent.com/image_generation_content/0