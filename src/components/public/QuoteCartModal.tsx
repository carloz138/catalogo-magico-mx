import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Minus, Plus, Trash2, ShoppingCart, Truck, ArrowRight, PackageOpen, Sparkles, X } from "lucide-react";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { type Tables } from "@/integrations/supabase/types";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { RecommendationBanner } from "@/components/quotes/RecommendationBanner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Product = Tables<"products">;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: () => void;
  catalogOwnerId: string | null;
  freeShippingThreshold: number | null;
}

export function QuoteCartModal({ isOpen, onClose, onRequestQuote, catalogOwnerId, freeShippingThreshold }: Props) {
  const { items, updateQuantity, removeItem, clearCart, totalAmount, addItem } = useQuoteCart();

  // --- LÓGICA DE ENVÍO GRATIS (GAMIFICACIÓN) ---
  const shippingStatus = useMemo(() => {
    if (!freeShippingThreshold) return null;
    const progress = Math.min(100, (totalAmount / freeShippingThreshold) * 100);
    const amountLeft = Math.max(0, freeShippingThreshold - totalAmount);
    const isQualified = totalAmount >= freeShippingThreshold;
    return { progress, amountLeft, isQualified };
  }, [totalAmount, freeShippingThreshold]);

  // --- RECOMENDACIONES ---
  const productIdsInCart = useMemo(() => items.map((item) => item.product.id), [items]);
  const { recommendations, loading: loadingRecommendations } = useProductRecommendations(
    productIdsInCart,
    catalogOwnerId,
  );

  const handleAddToCartFromBanner = (productToAdd: Product) => {
    addItem(productToAdd, 1, "retail", productToAdd.price_retail);
  };

  // --- VISTA: CARRITO VACÍO ---
  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-50 p-6 rounded-full mb-6 ring-8 ring-slate-50/50"
          >
            <ShoppingCart className="h-12 w-12 text-slate-300" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-slate-500 max-w-xs mb-8 leading-relaxed">
            Parece que aún no has seleccionado productos. Explora el catálogo para comenzar tu pedido.
          </p>
          <Button
            onClick={onClose}
            size="lg"
            className="bg-slate-900 hover:bg-slate-800 text-white w-full max-w-xs rounded-full"
          >
            Explorar Productos
          </Button>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0 bg-white gap-0 border-l border-slate-200 shadow-2xl">
        {/* 1. HEADER */}
        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-xl font-bold text-slate-900">Tu Pedido</SheetTitle>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-5 w-5 text-slate-400" />
              <span className="sr-only">Cerrar</span>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* 2. PROGRESS BAR (STICKY O TOP) */}
        {shippingStatus && (
          <div
            className={cn(
              "px-6 py-3 border-b transition-colors duration-500",
              shippingStatus.isQualified ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100",
            )}
          >
            <div className="flex justify-between items-center mb-2 text-sm">
              <span
                className={cn(
                  "font-medium flex items-center gap-2",
                  shippingStatus.isQualified ? "text-emerald-700" : "text-slate-600",
                )}
              >
                {shippingStatus.isQualified ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-500" /> ¡Envío Gratis conseguido!
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 text-indigo-500" /> Envío
                  </>
                )}
              </span>
              {!shippingStatus.isQualified && (
                <span className="text-slate-500 text-xs">
                  Faltan{" "}
                  <span className="font-bold text-slate-900">${(shippingStatus.amountLeft / 100).toFixed(2)}</span>
                </span>
              )}
            </div>
            <Progress
              value={shippingStatus.progress}
              className="h-2 bg-slate-200"
              indicatorClassName={shippingStatus.isQualified ? "bg-emerald-500" : "bg-indigo-600"}
            />
          </div>
        )}

        {/* 3. PRODUCT LIST (SCROLLABLE) */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-6">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const imageUrl = item.product.processed_image_url || item.product.original_image_url;

                return (
                  <motion.div
                    key={`${item.product.id}-${item.priceType}-${item.variantId || "default"}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 group"
                  >
                    {/* Imagen */}
                    <div className="h-20 w-20 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      <img
                        src={imageUrl || undefined}
                        alt={item.product.name}
                        className="w-full h-full object-cover mix-blend-multiply"
                      />
                    </div>

                    {/* Info & Controls */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">
                            {item.product.name}
                          </h4>
                          <p className="font-mono font-bold text-sm text-slate-900 shrink-0">
                            ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                          {item.variantDescription && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {item.variantDescription}
                            </span>
                          )}
                          <span>{item.priceType === "retail" ? "Menudeo" : "Mayoreo"}</span>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-slate-500"
                            onClick={() =>
                              updateQuantity(item.product.id, item.priceType, item.quantity - 1, item.variantId)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm text-slate-900"
                            onClick={() =>
                              updateQuantity(item.product.id, item.priceType, item.quantity + 1, item.variantId)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => removeItem(item.product.id, item.priceType, item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* RECOMMENDATIONS SECTION INSIDE SCROLL */}
            {recommendations && recommendations.length > 0 && (
              <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900">Te podría interesar</h3>
                </div>
                <RecommendationBanner
                  loading={loadingRecommendations}
                  recommendations={recommendations}
                  onAddToCart={handleAddToCartFromBanner}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 4. FOOTER (STICKY BOTTOM) */}
        <div className="border-t border-slate-100 bg-white p-6 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>${(totalAmount / 100).toFixed(2)}</span>
            </div>
            {shippingStatus && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Envío</span>
                <span>{shippingStatus.isQualified ? "Gratis" : "Por calcular"}</span>
              </div>
            )}
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-end pt-2">
              <span className="text-base font-bold text-slate-900">Total Estimado</span>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                ${(totalAmount / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={clearCart}
              className="col-span-1 h-12 border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
              title="Vaciar carrito"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button
              onClick={onRequestQuote}
              className="col-span-3 h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              Solicitar Cotización <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
