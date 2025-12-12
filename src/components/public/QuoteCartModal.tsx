import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Truck,
  ArrowRight,
  Sparkles,
  X,
  Factory,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useQuoteCart, type QuoteItem } from "@/contexts/QuoteCartContext";
import { type Tables } from "@/integrations/supabase/types";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
import { RecommendationBanner } from "@/components/quotes/RecommendationBanner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
// Asegúrate de que este archivo exista (lo creó Lovable anteriormente)
import { validateCartRules, getProgressMessage, type WholesaleRules, type CartItem } from "@/lib/utils/cart-validation";

type Product = Tables<"products">;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: () => void;
  catalogOwnerId: string | null;
  catalogId?: string | null; // ID del catálogo actual
  freeShippingThreshold: number | null;
  minOrderAmount?: number | null;
  minOrderQuantity?: number | null;
  isWholesaleOnly?: boolean; // Flag para saber si es L1 estricto
}

// --- SUBCOMPONENTE: FILA DEL CARRITO ---
function CartItemRow({
  item,
  updateQuantity,
  removeItem,
  isBackorder,
}: {
  item: QuoteItem;
  updateQuantity: (productId: string, priceType: string, quantity: number, variantId?: string | null) => void;
  removeItem: (productId: string, priceType: string, variantId?: string | null) => void;
  isBackorder: boolean;
}) {
  const imageUrl = item.product.processed_image_url || item.product.original_image_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-4 group p-3 rounded-lg", isBackorder && "bg-amber-50/50 border border-amber-100")}
    >
      <div className="h-16 w-16 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
        <img src={imageUrl || undefined} alt={item.product.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1">{item.product.name}</h4>
            <p className="font-mono font-bold text-sm text-slate-900 shrink-0">
              ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
            </p>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
            {item.variantDescription && (
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">{item.variantDescription}</span>
            )}
            {isBackorder && (
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                Bajo pedido
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity - 1, item.variantId)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.product.id, item.priceType, item.quantity + 1, item.variantId)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-300 hover:text-red-500"
            onClick={() => removeItem(item.product.id, item.priceType, item.variantId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function QuoteCartModal({
  isOpen,
  onClose,
  onRequestQuote,
  catalogOwnerId,
  catalogId,
  freeShippingThreshold,
  minOrderAmount,
  minOrderQuantity,
  isWholesaleOnly,
}: Props) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    addItem,
    backorderItems,
    readyItems,
    hasBackorderItems,
    maxLeadTimeDays,
  } = useQuoteCart();

  // 1. VALIDACIÓN DE REGLAS DE MAYOREO (Backend Logic en Frontend)
  const wholesaleValidation = useMemo(() => {
    const rules: WholesaleRules = {
      is_wholesale_only: isWholesaleOnly ?? false,
      min_order_quantity: minOrderQuantity ?? 1,
      min_order_amount: minOrderAmount ?? 0,
    };

    const cartItems: CartItem[] = items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    }));

    return validateCartRules(cartItems, rules);
  }, [items, minOrderAmount, minOrderQuantity, isWholesaleOnly]);

  // Mensaje de progreso ("Te faltan $500")
  const progressMessage = useMemo(() => {
    const rules: WholesaleRules = {
      is_wholesale_only: isWholesaleOnly ?? false,
      min_order_quantity: minOrderQuantity ?? 1,
      min_order_amount: minOrderAmount ?? 0,
    };
    const cartItems: CartItem[] = items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    }));
    return getProgressMessage(cartItems, rules);
  }, [items, minOrderAmount, minOrderQuantity, isWholesaleOnly]);

  // 2. STATUS DE ENVÍO GRATIS
  const shippingStatus = useMemo(() => {
    if (!freeShippingThreshold) return null;
    const progress = Math.min(100, (totalAmount / freeShippingThreshold) * 100);
    const amountLeft = Math.max(0, freeShippingThreshold - totalAmount);
    return { progress, amountLeft, isQualified: totalAmount >= freeShippingThreshold };
  }, [totalAmount, freeShippingThreshold]);

  // 3. SISTEMA DE RECOMENDACIONES (FIXED)
  const productIdsInCart = useMemo(() => items.map((item) => item.product.id), [items]);

  const { recommendations, loading: loadingRecommendations } = useProductRecommendations(
    productIdsInCart,
    catalogOwnerId,
    catalogId, // ⬅️ Argumento 3: ID del Catálogo (String o null)
    {
      // ⬅️ Argumento 4: Opciones (Objeto)
      // Si es "Solo Mayoreo" (L1), usamos Scope CATALOG para filtrar estricto.
      // Si NO (L2 Super Catalogo), usamos Scope STORE para buscar en todo el inventario.
      scope: isWholesaleOnly ? "CATALOG" : "STORE",
    },
  );

  const handleAddToCartFromBanner = (productToAdd: Product) => {
    addItem(productToAdd, 1, "retail", productToAdd.price_retail);
  };

  // --- RENDER ---

  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col items-center justify-center text-center">
          <ShoppingCart className="h-12 w-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">Explora el catálogo para comenzar tu pedido.</p>
          <Button onClick={onClose}>Explorar Productos</Button>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Tu Pedido ({items.length})</SheetTitle>
            <SheetClose>
              <X className="h-5 w-5" />
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Barra de Envío Gratis */}
        {shippingStatus && (
          <div className={cn("px-6 py-3 border-b", shippingStatus.isQualified ? "bg-emerald-50" : "bg-slate-50")}>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                {shippingStatus.isQualified ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-500" /> ¡Envío Gratis!
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" /> Envío
                  </>
                )}
              </span>
              {!shippingStatus.isQualified && <span>Faltan ${(shippingStatus.amountLeft / 100).toFixed(2)}</span>}
            </div>
            <Progress value={shippingStatus.progress} className="h-2" />
          </div>
        )}

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-4">
            {/* Sección Backorder */}
            {hasBackorderItems && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <Factory className="h-4 w-4" />
                  <span className="text-sm font-medium">Requiere Producción ({backorderItems.length})</span>
                  {maxLeadTimeDays > 0 && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      <Clock className="h-3 w-3 mr-1" />~{maxLeadTimeDays} días
                    </Badge>
                  )}
                </div>
                <AnimatePresence>
                  {backorderItems.map((item) => (
                    <CartItemRow
                      key={`${item.product.id}-${item.variantId}`}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                      isBackorder
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Sección Disponible */}
            {readyItems.length > 0 && (
              <div className="space-y-3">
                {hasBackorderItems && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm font-medium">Disponible ({readyItems.length})</span>
                  </div>
                )}
                <AnimatePresence>
                  {readyItems.map((item) => (
                    <CartItemRow
                      key={`${item.product.id}-${item.variantId}`}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                      isBackorder={false}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Banner de Recomendaciones (Siempre visible si hay datos) */}
            {(recommendations?.length > 0 || loadingRecommendations) && (
              <div className="mt-4 pt-4 bg-slate-50/80 -mx-6 px-4 sm:px-6 border-t border-dashed border-slate-200">
                <RecommendationBanner
                  loading={loadingRecommendations}
                  recommendations={recommendations}
                  onAddToCart={handleAddToCartFromBanner}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-6 space-y-4 bg-white z-10">
          {/* Alerta de Bloqueo por Mínimos */}
          {!wholesaleValidation.isValid && (
            <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-xs font-bold mb-1">Requisitos de Compra</AlertTitle>
              <AlertDescription className="text-xs">
                {wholesaleValidation.errors.map((error, idx) => (
                  <p key={idx} className="mb-0.5">
                    {error}
                  </p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Mensaje de Progreso (Casi llegas) */}
          {wholesaleValidation.isValid && progressMessage && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">{progressMessage}</p>
          )}

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${(totalAmount / 100).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={clearCart} className="col-span-1">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={onRequestQuote}
              className="col-span-3"
              disabled={!wholesaleValidation.isValid} // 🚫 Bloqueo Real
            >
              Solicitar Cotización <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
