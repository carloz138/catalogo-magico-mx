import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  TrendingUp,
  Loader2,
  MapPin,
  AlertCircle,
  Store,
  Truck,
  Package,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecommendationBanner } from "@/components/quotes/RecommendationBanner";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";

// Interface local alineada con la respuesta de la RPC get_consolidation_preview
interface ConsolidationItem {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string | null;
  image_url: string | null;
  variant_description: string | null;
  total_demand: number;
  current_stock: number;
  quantity_to_order: number;
}

export default function ConsolidateOrderPage() {
  const { supplierId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState<ConsolidationItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Estado para método de entrega
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");

  const [catalogInfo, setCatalogInfo] = useState<{ name: string; user_id: string } | null>(null);
  const [resellerInfo, setResellerInfo] = useState<{
    business_name?: string;
    address?: any;  // Json from database
    phone?: string;
  } | null>(null);

  const selectedProductIds = useMemo(() => {
    return items.filter((i) => selectedItems.has(i.variant_id || i.product_id)).map((i) => i.product_id);
  }, [items, selectedItems]);

  // Smart recommendations with CATALOG scope for strict wholesale filtering
  const { recommendations, loading: loadingRecommendations } = useProductRecommendations(
    selectedProductIds,
    catalogInfo?.user_id || null,
    supplierId || null,
    { scope: "CATALOG" }
  );

  const handleAddRecommendation = (product: any) => {
    const existingItem = items.find((i) => i.product_id === product.id);
    if (existingItem) {
      toast({ title: "Ya incluido", description: `${product.name} ya está en tu pedido` });
      return;
    }
    // Agregamos recomendación como un item manual (stock 0, pedir 1)
    const newItem: ConsolidationItem = {
      product_id: product.id,
      variant_id: null,
      product_name: product.name,
      sku: product.sku || null,
      image_url: product.processed_image_url || product.image_url || null,
      variant_description: null,
      total_demand: 0,
      current_stock: 0,
      quantity_to_order: 1,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedItems((prev) => new Set([...prev, product.id]));
    toast({ title: "✅ Agregado", description: `${product.name} añadido al pedido` });
  };

  useEffect(() => {
    if (user && supplierId) {
      fetchData();
    }
  }, [user, supplierId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Info del Catálogo (Proveedor)
      const { data: catData, error: catError } = await supabase
        .from("digital_catalogs")
        .select("name, user_id")
        .eq("id", supplierId)
        .maybeSingle();

      if (catError) throw catError;
      if (!catData) {
        toast({ title: "Error", description: "Catálogo no encontrado", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setCatalogInfo(catData);

      // 2. Info del Revendedor (Para dirección de envío)
      const { data: busInfo } = await supabase
        .from("business_info")
        .select("business_name, address, phone")
        .eq("user_id", user?.id)
        .maybeSingle();
      setResellerInfo(busInfo || {});

      // 3. RPC: Obtener vista previa de lo que falta (Backorder)
      // Como actualizaste types, ya no necesitamos 'as any' si la función está generada
      const { data: consolidationData, error: rpcError } = await supabase.rpc("get_consolidation_preview", {
        p_distributor_id: user?.id,
        p_catalog_id: supplierId,
      });

      if (rpcError) throw rpcError;

      // Mapeo seguro de datos
      const safeData = (consolidationData || []).map((item: any) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        sku: item.sku,
        image_url: item.image_url,
        variant_description: item.variant_description,
        total_demand: item.total_demand,
        current_stock: item.current_stock,
        quantity_to_order: item.quantity_to_order,
      }));

      setItems(safeData);

      // Auto-seleccionar todo lo sugerido
      const allIds = safeData.map((i) => i.variant_id || i.product_id);
      setSelectedItems(new Set(allIds));
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Error", description: "No se pudo cargar la vista previa.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const handleCreateOrder = async () => {
    if (!user || !catalogInfo || !supplierId) return;

    // Filtrar solo items seleccionados
    const itemsToOrder = items.filter((i) => selectedItems.has(i.variant_id || i.product_id));

    if (itemsToOrder.length === 0) {
      toast({ title: "Selecciona productos", description: "Elige al menos uno.", variant: "destructive" });
      return;
    }

    // Validación de dirección
    if (deliveryMethod === "shipping" && (!resellerInfo?.address || resellerInfo.address.length < 5)) {
      toast({
        title: "Falta dirección",
        description: "Para envíos a domicilio, necesitas configurar tu dirección en Perfil.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Preparar payload simple para la RPC
      const orderPayload = itemsToOrder.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity_to_order,
      }));

      // Llamada RPC para crear la orden
      const { data, error } = await supabase.rpc("create_consolidated_order", {
        p_distributor_id: user.id,
        p_supplier_id: catalogInfo.user_id,
        p_catalog_id: supplierId,
        p_items: orderPayload as any, // Jsonb casting
        p_shipping_address: deliveryMethod === "shipping" ? resellerInfo.address || "" : "Recoger en Tienda",
        p_notes: `[REPOSICIÓN] Pedido consolidado. Método: ${deliveryMethod === "pickup" ? "RECOGER EN TIENDA" : "ENVÍO A DOMICILIO"}`,
        p_delivery_method: deliveryMethod,
      });

      if (error) throw error;

      const result = data as any; // { success: true, quote_id: ..., total_amount: ... }

      toast({
        title: "¡Orden Generada!",
        description: `Enviada al proveedor. Total: $${(result.total_amount / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      });

      // Redirigir a la lista de órdenes (Quotes)
      navigate("/orders");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "No se pudo crear la orden", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full md:w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalItems = items.filter((i) => selectedItems.has(i.variant_id || i.product_id)).length;
  const totalUnits = items
    .filter((i) => selectedItems.has(i.variant_id || i.product_id))
    .reduce((sum, i) => sum + i.quantity_to_order, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8 pb-36">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2 md:ml-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Consolidar Pedidos</h1>
              <p className="text-sm text-slate-500 flex flex-wrap items-center gap-1">
                Proveedor: <span className="font-semibold text-slate-700">{catalogInfo?.name}</span>
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="border-dashed border-2 py-12 text-center bg-slate-50/50">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">¡Estás al día!</h3>
            <p className="text-slate-500 max-w-md mx-auto px-4">
              Tu stock actual cubre toda la demanda. No tienes deuda de inventario con este proveedor.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => navigate("/dashboard")}>
              Volver al Dashboard
            </Button>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <Alert className="bg-indigo-50 border-indigo-200 text-indigo-900">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-xs md:text-sm">
                Hemos detectado <strong>{items.filter((i) => i.current_stock < 0).length} productos</strong> con
                inventario negativo. Se sugiere pedir lo necesario para saldar la deuda.
              </AlertDescription>
            </Alert>

            {/* Selector de Método de Entrega */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Método de Entrega</h3>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setDeliveryMethod("shipping")}
                  className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all ${deliveryMethod === "shipping" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
                >
                  <Truck
                    className={`w-6 h-6 ${deliveryMethod === "shipping" ? "text-indigo-600" : "text-slate-400"}`}
                  />
                  <span className="text-xs font-bold">Envío a Domicilio</span>
                </div>

                <div
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all ${deliveryMethod === "pickup" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
                >
                  <Store className={`w-6 h-6 ${deliveryMethod === "pickup" ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold">Recoger en Tienda</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs md:text-sm text-slate-500">
                {deliveryMethod === "shipping" ? (
                  resellerInfo?.address ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                      <span>
                        Se enviará a: <strong>{resellerInfo.address}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Necesitas configurar tu dirección de envío.</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>Pasarás a recoger el pedido. No se cobrará envío.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Items */}
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {items.map((item) => {
                const id = item.variant_id || item.product_id;
                const isSelected = selectedItems.has(id);

                return (
                  <div
                    key={id}
                    onClick={() => toggleSelection(id)}
                    className={`
                      relative bg-white rounded-xl border p-3 md:p-4 transition-all cursor-pointer
                      ${isSelected ? "border-indigo-500 shadow-md bg-indigo-50/10 ring-1 ring-indigo-500" : "border-slate-200 hover:border-slate-300"}
                    `}
                  >
                    <div className="flex gap-3 md:gap-4 items-start">
                      <div className="pt-1">
                        <Checkbox
                          checked={isSelected}
                          className="w-5 h-5 md:w-4 md:h-4 data-[state=checked]:bg-indigo-600 border-slate-300"
                        />
                      </div>

                      <div className="w-16 h-16 md:w-14 md:h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                        {item.image_url ? (
                          <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Package className="p-3 text-slate-300 w-full h-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm md:text-base leading-tight">
                              {item.product_name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {item.variant_description || item.sku || "Estándar"}
                            </p>
                          </div>

                          <div className="mt-2 md:mt-0 flex items-center gap-2 md:block md:text-right">
                            <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm inline-flex items-center gap-1">
                              <span className="opacity-80 font-normal mr-1">PEDIR:</span>
                              <span className="text-sm">{item.quantity_to_order}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 md:flex md:justify-end gap-2 text-xs md:text-sm">
                          <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-center md:text-right md:bg-transparent md:border-none md:p-0">
                            <span className="text-slate-400 font-medium md:mr-1 block md:inline">EN DEUDA:</span>
                            <span className="font-bold text-red-600">
                              {item.current_stock < 0 ? Math.abs(item.current_stock) : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Recommendations - Mobile-First Responsive */}
            {(selectedProductIds.length > 0 && (recommendations?.length > 0 || loadingRecommendations)) && (
              <Card className="border-violet-100 bg-gradient-to-br from-violet-50/50 to-white overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  <div className="p-3 md:p-4">
                    <RecommendationBanner
                      recommendations={recommendations}
                      onAddToCart={handleAddRecommendation}
                      loading={loadingRecommendations}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* --- BARRA FLOTANTE DE ACCIÓN --- */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 px-4 py-3 md:px-8 md:py-4 safe-area-bottom">
          <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total a Pedir</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-bold text-slate-900">{totalUnits}</span>
                <span className="text-sm text-slate-500 font-medium">uds</span>
              </div>
            </div>

            <Button
              onClick={handleCreateOrder}
              disabled={processing || totalItems === 0 || (deliveryMethod === "shipping" && !resellerInfo?.address)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl h-12 md:h-11 px-6 md:px-8 text-sm md:text-base font-semibold flex items-center gap-2 grow md:grow-0 justify-center"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden sm:inline">Procesando...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>{deliveryMethod === "pickup" ? "Confirmar Recolección" : "Confirmar Envío"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
