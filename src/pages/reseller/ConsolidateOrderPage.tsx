import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, ShoppingCart, CheckCircle, TrendingUp, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecommendationBanner } from "@/components/quotes/RecommendationBanner";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";
// Importamos el tipo de respuesta para el RPC
import { CreateConsolidatedOrderResponse } from "@/types/consolidated-order";

// Tipo de dato para la vista previa (Fetch inicial)
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

  // IDs de productos seleccionados para recomendaciones
  const selectedProductIds = useMemo(() => {
    return items.filter((i) => selectedItems.has(i.variant_id || i.product_id)).map((i) => i.product_id);
  }, [items, selectedItems]);

  // Hook de recomendaciones basado en productos del pedido
  const { recommendations, loading: loadingRecommendations } = useProductRecommendations(
    selectedProductIds,
    catalogInfo?.user_id || null,
  );

  // Handler para agregar producto recomendado al pedido
  const handleAddRecommendation = (product: any) => {
    const existingItem = items.find((i) => i.product_id === product.id);
    if (existingItem) {
      toast({
        title: "Ya incluido",
        description: `${product.name} ya está en tu pedido`,
      });
      return;
    }

    // Agregar como nuevo item
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
      source_quote_ids: [],
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItems((prev) => new Set([...prev, product.id]));

    toast({
      title: "✅ Agregado",
      description: `${product.name} añadido al pedido`,
    });
  };

  useEffect(() => {
    if (user && supplierId) {
      fetchData();
    }
  }, [user, supplierId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Obtener Info del Catálogo Proveedor
      const { data: catData, error: catError } = await supabase
        .from("digital_catalogs")
        .select("name, user_id")
        .eq("id", supplierId)
        .maybeSingle();

      if (catError) throw catError;
      setCatalogInfo(catData);

      // 2. Obtener Info del Revendedor
      const { data: busInfo } = await supabase
        .from("business_info")
        .select("business_name, address, phone")
        .eq("user_id", user?.id)
        .maybeSingle();

      setResellerInfo(busInfo || {});

      // 3. LLAMADA AL RPC (Vista Previa)
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

  // =========================================================
  // CORE LOGIC: CREACIÓN DE ORDEN VIA RPC (SECURE MODE)
  // =========================================================
  const handleCreateOrder = async () => {
    // 1. Validaciones básicas de UI
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

    if (!resellerInfo?.address || resellerInfo.address.length < 5) {
      toast({
        title: "Falta dirección de envío",
        description: "Por favor configura tu dirección comercial en 'Configuración' para generar órdenes automáticas.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // 2. PREPARAR PAYLOAD LIMPIO
      // Solo enviamos QUÉ queremos y CUÁNTO. El Backend (PostgreSQL) decide CUÁNTO CUESTA.
      const orderPayload = itemsToOrder.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id, // Puede ser null
        quantity: item.quantity_to_order,
        source_quote_ids: item.source_quote_ids || [], // Array de IDs de las ventas L3
      }));

      // 3. LLAMADA AL RPC BLINDADO
      // 'as any' se usa temporalmente en el nombre de la función para evitar error TS estricto
      const { data, error } = await supabase.rpc("create_consolidated_order" as any, {
        p_distributor_id: user.id,
        p_supplier_id: catalogInfo.user_id, // El ID del L1
        p_catalog_id: supplierId, // El ID del catálogo
        p_items: orderPayload,
        p_shipping_address: resellerInfo.address,
        p_notes: "[REPOSICIÓN DE STOCK] Pedido consolidado automáticamente.",
      });

      if (error) throw error;

      // 4. CASTING DE RESPUESTA
      // Convertimos la respuesta JSON genérica a nuestro tipo definido
      const result = data as unknown as CreateConsolidatedOrderResponse;

      console.log("Orden Creada:", result);

      toast({
        title: "¡Orden Generada Exitosamente!",
        description: `Se ha enviado el pedido al proveedor. Total Confirmado: $${result.total_amount}`,
      });

      // 5. Redirección
      navigate("/orders");
    } catch (error: any) {
      console.error("Error creating consolidated order:", error);
      toast({
        title: "Error al procesar",
        description: error.message || "Ocurrió un error inesperado al crear la orden.",
        variant: "destructive",
      });
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
                          <img src={item.image_url} className="w-full h-full object-cover" alt={item.product_name} />
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

            {/* Banner de Recomendaciones */}
            {selectedProductIds.length > 0 && (
              <Card className="border-violet-100 bg-gradient-to-br from-violet-50/50 to-white">
                <CardContent className="p-4">
                  <RecommendationBanner
                    recommendations={recommendations}
                    onAddToCart={handleAddRecommendation}
                    loading={loadingRecommendations}
                  />
                </CardContent>
              </Card>
            )}
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
