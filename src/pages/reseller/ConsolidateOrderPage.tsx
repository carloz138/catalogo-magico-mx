import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  CheckCircle,
  TrendingUp,
  Loader2,
  MapPin, // Icono para indicar que tenemos la dirección
  Store,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuoteService } from "@/services/quote.service";

// Tipo de dato que devuelve tu RPC
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
  source_quote_ids: string[];
}

interface PriceRule {
  retail: number;
  wholesale: number;
  min_qty: number;
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

  // Info del Proveedor (L1)
  const [catalogInfo, setCatalogInfo] = useState<{ name: string; user_id: string } | null>(null);

  // Info del Revendedor (Tú - L2) para pre-llenado
  const [resellerInfo, setResellerInfo] = useState<{
    business_name?: string;
    address?: string;
    phone?: string;
  } | null>(null);

  useEffect(() => {
    if (user && supplierId) {
      fetchData();
    }
  }, [user, supplierId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener Info del Catálogo Proveedor (Para saber a quién le compramos)
      const { data: catData, error: catError } = await supabase
        .from("digital_catalogs")
        .select("name, user_id")
        .eq("id", supplierId)
        .single();

      if (catError) throw catError;
      setCatalogInfo(catData);

      // 2. Obtener Info del Revendedor (Para pre-llenar la orden de compra)
      const { data: busInfo } = await supabase
        .from("business_info")
        .select("business_name, address, phone")
        .eq("user_id", user?.id)
        .maybeSingle();

      setResellerInfo(busInfo || {});

      // 3. LLAMADA AL RPC (Items a pedir)
      const { data: consolidationData, error: rpcError } = await supabase.rpc("get_consolidation_preview" as any, {
        p_distributor_id: user?.id,
        p_catalog_id: supplierId,
      });

      if (rpcError) throw rpcError;

      const safeData = (consolidationData || []) as unknown as ConsolidationItem[];
      setItems(safeData);

      const allIds = safeData.map((i) => i.variant_id || i.product_id);
      setSelectedItems(new Set(allIds));
    } catch (error: any) {
      console.error("Error fetching consolidation:", error);
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

    const itemsToOrder = items.filter((i) => selectedItems.has(i.variant_id || i.product_id));
    if (itemsToOrder.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes elegir al menos un ítem para pedir.",
        variant: "destructive",
      });
      return;
    }

    // Validación básica de dirección
    if (!resellerInfo?.address || resellerInfo.address.length < 5) {
      toast({
        title: "Falta dirección de envío",
        description: "Por favor configura tu dirección comercial en 'Configuración' para generar órdenes automáticas.",
        variant: "destructive",
      });
      // Opcional: navigate('/business-info')
      return;
    }

    setProcessing(true);
    try {
      // 1. OBTENER REGLAS DE PRECIO
      const productIds = itemsToOrder.map((i) => i.product_id);
      const { data: costData } = await supabase
        .from("catalog_products")
        .select(
          `
                product_id,
                products (
                    id, price_retail, price_wholesale, wholesale_min_qty,
                    product_variants (id, price_retail, price_wholesale)
                )
            `,
        )
        .eq("catalog_id", supplierId)
        .in("product_id", productIds);

      const priceMap = new Map<string, PriceRule>();

      costData?.forEach((cp: any) => {
        const p = cp.products;
        priceMap.set(cp.product_id, {
          retail: p.price_retail || 0,
          wholesale: p.price_wholesale || 0,
          min_qty: p.wholesale_min_qty || 0,
        });

        p.product_variants.forEach((v: any) => {
          priceMap.set(v.id, {
            retail: v.price_retail || p.price_retail || 0,
            wholesale: v.price_wholesale || p.price_wholesale || 0,
            min_qty: p.wholesale_min_qty || 0,
          });
        });
      });

      // 2. CONSTRUIR ITEMS
      const quoteItems = itemsToOrder.map((item) => {
        const id = item.variant_id || item.product_id;
        const rules = priceMap.get(id);
        const qty = item.quantity_to_order;

        let finalPrice = 0;
        let priceType = "menudeo";

        if (rules) {
          if (rules.wholesale > 0 && qty >= rules.min_qty) {
            finalPrice = rules.wholesale;
            priceType = "mayoreo";
          } else {
            finalPrice = rules.retail;
            priceType = "menudeo";
          }
        }

        return {
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          product_sku: item.sku || "",
          product_image_url: item.image_url,
          variant_description: item.variant_description,
          quantity: qty,
          unit_price: finalPrice,
          price_type: priceType,
        };
      });

      // 3. CREAR COTIZACIÓN PRE-LLENADA (LA MAGIA DE ONE-CLICK)
      const quotePayload = {
        catalog_id: supplierId,
        user_id: catalogInfo.user_id, // El dueño de la venta es el L1

        // --- DATOS PRELLENADOS DEL REVENDEDOR ---
        customer_name: user.user_metadata?.full_name || user.email,
        customer_email: user.email || "",
        customer_company: resellerInfo?.business_name || "Revendedor CatifyPro", // Si no tiene nombre comercial, ponemos uno genérico
        customer_phone: resellerInfo?.phone || "",

        delivery_method: "shipping" as const,
        shipping_address: resellerInfo?.address || "Dirección pendiente de confirmar",

        notes: "[REPOSICIÓN DE STOCK] Pedido consolidado automáticamente por sistema.",
        items: quoteItems,
      };

      const createdQuote = await QuoteService.createQuote(quotePayload);

      // 4. Guardar Registro de Consolidación
      const { data: consolidatedOrder } = await supabase
        .from("consolidated_orders")
        .insert({
          distributor_id: user.id,
          supplier_id: catalogInfo.user_id,
          original_catalog_id: supplierId,
          replicated_catalog_id: supplierId,
          status: "created",
          quote_id: createdQuote.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      // 5. Guardar Items Detallados
      if (consolidatedOrder) {
        const consolidatedItems = quoteItems.map((qItem, idx) => ({
          consolidated_order_id: consolidatedOrder.id,
          product_id: qItem.product_id,
          variant_id: qItem.variant_id,
          product_name: qItem.product_name,
          quantity: qItem.quantity,
          unit_price: qItem.unit_price,
          subtotal: qItem.unit_price * qItem.quantity,
          source_quote_ids: itemsToOrder[idx].source_quote_ids,
        }));
        await supabase.from("consolidated_order_items").insert(consolidatedItems);
      }

      toast({
        title: "¡Orden Generada!",
        description: `Se enviaron tus datos de envío y facturación al proveedor. Pedido #${createdQuote.id.slice(0, 8)}`,
      });

      navigate("/orders"); // OJO: Asegúrate que esta ruta muestre las compras (Inbound)
    } catch (error: any) {
      console.error("Error creating consolidated order:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalItems = items.filter((i) => selectedItems.has(i.variant_id || i.product_id)).length;
  const totalUnits = items
    .filter((i) => selectedItems.has(i.variant_id || i.product_id))
    .reduce((sum, i) => sum + i.quantity_to_order, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Consolidar Pedidos</h1>
              <p className="text-slate-500">
                Proveedor: <span className="font-semibold text-slate-700">{catalogInfo?.name}</span>
              </p>
            </div>
          </div>
          {/* Info de Envío Prellenada (Feedback Visual) */}
          {resellerInfo?.address && (
            <Badge
              variant="outline"
              className="bg-white text-slate-600 border-slate-200 py-1.5 px-3 flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              Enviando a: <span className="font-medium max-w-[200px] truncate">{resellerInfo.address}</span>
            </Badge>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="border-dashed border-2 py-12 text-center bg-slate-50/50">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">¡Estás al día!</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              No tienes ventas pendientes por surtir para este proveedor. Tu stock actual cubre la demanda.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => navigate("/dashboard")}>
              Volver al Dashboard
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {!resellerInfo?.address && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <strong>Atención:</strong> No tienes una dirección de envío configurada.
                  <Button
                    variant="link"
                    className="p-0 h-auto font-bold ml-1 text-red-900 underline"
                    onClick={() => navigate("/business-info")}
                  >
                    Configurar aquí
                  </Button>{" "}
                  para poder generar la orden automática.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-indigo-50 border-indigo-200 text-indigo-900">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <AlertDescription>
                Hemos detectado una demanda de <strong>{items.reduce((s, i) => s + i.total_demand, 0)} unidades</strong>{" "}
                en tus ventas recientes.
              </AlertDescription>
            </Alert>

            {/* Lista de Items */}
            <div className="grid gap-4">
              {items.map((item) => {
                const id = item.variant_id || item.product_id;
                const isSelected = selectedItems.has(id);

                return (
                  <Card
                    key={id}
                    className={`transition-all ${isSelected ? "border-indigo-200 shadow-sm" : "opacity-60 border-slate-100"}`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(id)} />

                      <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="p-2 text-slate-300 w-full h-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{item.product_name}</h4>
                        <p className="text-xs text-slate-500 truncate">
                          {item.variant_description || item.sku || "Estándar"}
                        </p>
                      </div>

                      {/* Estadísticas */}
                      <div className="flex items-center gap-4 text-sm text-right">
                        <div className="hidden md:block">
                          <div className="text-slate-400 text-xs uppercase font-bold">Demanda</div>
                          <div className="font-medium">{item.total_demand}</div>
                        </div>
                        <div className="hidden md:block">
                          <div className="text-slate-400 text-xs uppercase font-bold">Bodega</div>
                          <div className="font-medium text-emerald-600">{item.current_stock}</div>
                        </div>
                        <div className="bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 min-w-[80px] text-center">
                          <div className="text-indigo-400 text-[10px] uppercase font-bold">A Pedir</div>
                          <div className="font-bold text-lg text-indigo-700">{item.quantity_to_order}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="text-sm">
              <span className="font-bold text-slate-900">{totalItems} productos</span> seleccionados ({totalUnits} uds)
            </div>
            <Button
              onClick={handleCreateOrder}
              disabled={processing || totalItems === 0 || !resellerInfo?.address}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando Orden...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Enviar Pedido a Proveedor
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
