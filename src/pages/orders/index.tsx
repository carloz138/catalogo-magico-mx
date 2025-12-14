import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteService } from "@/services/quote.service";
import { FulfillmentStatus, Quote, ShippingAddressStructured } from "@/types/digital-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Package,
  Truck,
  MapPin,
  Box,
  ShoppingBag,
  PackageCheck,
  Barcode,
  CheckCircle2,
  User,
  Map as MapIcon,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// --- FUNCIÓN AUXILIAR PARA MONEDA ---
const formatMoney = (amountInCents: number) => {
  if (!amountInCents && amountInCents !== 0) return "$0.00";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
};

// --- COMPONENTE INTELIGENTE PARA MOSTRAR DIRECCIÓN ---
const AddressDisplay = ({ address }: { address: string | ShippingAddressStructured | null }) => {
  if (!address) return <p className="text-sm text-slate-400 italic">No especificada</p>;

  if (typeof address === "object" && address !== null) {
    const addr = address as ShippingAddressStructured;
    return (
      <div className="text-sm text-slate-600 space-y-0.5">
        <p className="font-medium text-slate-900">{addr.street}</p>
        <p>
          {addr.colony ? `Col. ${addr.colony}, ` : ""} C.P. {addr.zip_code}
        </p>
        <p>
          {addr.city}, {addr.state}
        </p>
        {addr.references && (
          <div className="mt-2 text-xs bg-amber-50 p-2 rounded border border-amber-100 text-amber-800 flex gap-1 items-start">
            <MapIcon className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Ref: {addr.references}</span>
          </div>
        )}
      </div>
    );
  }
  return <p className="text-sm text-slate-600 whitespace-pre-wrap">{address as string}</p>;
};

// --- TIPOS INTERNOS ---
interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_image_url?: string;
  sku?: string;
  unit_price?: number; // Agregado para display
  total?: number; // Agregado para display
  subtotal?: number; // A veces viene como subtotal
}

interface ConsolidatedOrder {
  id: string;
  created_at: string;
  status: "draft" | "sent" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address?: string;
  tracking_company?: string;
  tracking_number?: string;
  distributor?: { business_name: string; phone: string; email: string };
  items: OrderItem[];
}

// --- SUB-COMPONENTE: BADGE DE ESTATUS ---
const FulfillmentBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    unfulfilled: { label: "Por Empacar", bg: "bg-amber-100", text: "text-amber-800", icon: Box },
    processing: { label: "Empacando", bg: "bg-blue-100", text: "text-blue-800", icon: Loader2 },
    ready_for_pickup: { label: "Listo en Tienda", bg: "bg-indigo-100", text: "text-indigo-800", icon: MapPin },
    shipped: { label: "En Camino", bg: "bg-purple-100", text: "text-purple-800", icon: Truck },
    delivered: { label: "Entregado", bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle2 },
    sent: { label: "Por Surtir", bg: "bg-rose-100", text: "text-rose-800", icon: PackageCheck },
    draft: { label: "Borrador", bg: "bg-gray-100", text: "text-gray-500", icon: Box },
  };

  const info = config[status] || { label: status, bg: "bg-gray-100", text: "text-gray-800", icon: Box };
  const Icon = info.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${info.bg} ${info.text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {info.label}
    </div>
  );
};

export default function UnifiedOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sales");

  // --- LÓGICA RETAIL ---
  const { quotes, loading: loadingQuotes, refetch: refetchQuotes } = useQuotes({ autoLoad: true });
  const [retailSearch, setRetailSearch] = useState("");
  const [selectedRetailOrder, setSelectedRetailOrder] = useState<Quote | null>(null);
  const [isRetailModalOpen, setIsRetailModalOpen] = useState(false);
  const [retailTracking, setRetailTracking] = useState({ code: "", carrier: "" });
  const [isSubmittingRetail, setIsSubmittingRetail] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Quote | null>(null);

  const retailOrders = quotes.filter((q) => (q as any).payment_status === "paid");
  const filteredRetail = retailOrders.filter(
    (o) =>
      o.customer_name.toLowerCase().includes(retailSearch.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(retailSearch.toLowerCase()),
  );

  const handleUpdateRetail = async () => {
    if (!selectedRetailOrder || !user) return;
    setIsSubmittingRetail(true);
    try {
      const isPickup = selectedRetailOrder.delivery_method === "pickup";
      const newStatus = isPickup ? "ready_for_pickup" : "shipped";

      await QuoteService.updateFulfillmentStatus(
        selectedRetailOrder.id,
        user.id,
        newStatus,
        isPickup ? undefined : { code: retailTracking.code, carrier: retailTracking.carrier },
      );

      toast({ title: "✅ Pedido Actualizado", description: "El cliente ha sido notificado." });
      setIsRetailModalOpen(false);
      refetchQuotes();
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmittingRetail(false);
    }
  };

  // --- LÓGICA WHOLESALE ---
  const [wholesaleSearch, setWholesaleSearch] = useState("");
  const [selectedWholesaleOrder, setSelectedWholesaleOrder] = useState<ConsolidatedOrder | null>(null);
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const [wholesaleTracking, setWholesaleTracking] = useState({ code: "", carrier: "" });

  const { data: wholesaleOrders = [], isLoading: loadingWholesale } = useQuery({
    queryKey: ["supplier-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("consolidated_orders")
        .select(
          `*, items:consolidated_order_items(*), distributor:business_info!consolidated_orders_distributor_id_fkey(business_name)`,
        )
        .eq("supplier_id", user.id)
        .neq("status", "draft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ConsolidatedOrder[];
    },
    enabled: !!user,
  });

  const fulfillMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWholesaleOrder) return;
      const { error } = await supabase
        .from("consolidated_orders")
        .update({
          status: "shipped",
          tracking_company: wholesaleTracking.carrier,
          tracking_number: wholesaleTracking.code,
          shipped_at: new Date().toISOString(),
        })
        .eq("id", selectedWholesaleOrder.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "✅ Orden Despachada", description: "El revendedor ha sido notificado." });
      setIsWholesaleModalOpen(false);
      setWholesaleTracking({ carrier: "", code: "" });
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
    },
  });

  const filteredWholesale = wholesaleOrders.filter(
    (o) =>
      o.distributor?.business_name.toLowerCase().includes(wholesaleSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(wholesaleSearch.toLowerCase()),
  );

  const pendingWholesaleCount = wholesaleOrders.filter((o) => o.status === "sent").length;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-20 font-sans text-slate-900">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Pedidos</h1>
        <p className="text-slate-500 mt-1">Administra tus ventas directas y tus envíos a revendedores.</p>
      </header>

      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-slate-200 mb-6 p-1 h-auto w-full md:w-auto grid grid-cols-2 md:inline-flex">
            <TabsTrigger
              value="sales"
              className="py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Mis Ventas
              {retailOrders.filter((o) => o.fulfillment_status === "unfulfilled").length > 0 && (
                <Badge className="ml-2 bg-indigo-600 hover:bg-indigo-700 h-5 px-1.5">
                  {retailOrders.filter((o) => o.fulfillment_status === "unfulfilled").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="wholesale"
              className="py-2.5 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700"
            >
              <PackageCheck className="w-4 h-4 mr-2" />
              Surtir a Revendedores
              {pendingWholesaleCount > 0 && (
                <Badge className="ml-2 bg-rose-600 hover:bg-rose-700 h-5 px-1.5">{pendingWholesaleCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* === TAB 1: MIS VENTAS (RETAIL) === */}
          <TabsContent value="sales" className="space-y-6 animate-in fade-in-50">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar cliente final..."
                  className="pl-10 bg-white"
                  value={retailSearch}
                  onChange={(e) => setRetailSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingQuotes ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-indigo-600" />
              </div>
            ) : filteredRetail.length === 0 ? (
              <EmptyState title="Sin ventas recientes" desc="Aquí aparecerán tus ventas a cliente final." />
            ) : (
              <div className="space-y-3">
                {filteredRetail.map((order) => (
                  <Card
                    key={order.id}
                    className="hover:border-indigo-300 transition-all cursor-pointer group"
                    // ✅ CLIC EN TODA LA TARJETA
                    onClick={() => setViewingOrder(order)}
                  >
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            #{order.order_number}
                          </span>
                          <FulfillmentBadge status={order.fulfillment_status} />
                        </div>
                        <div className="text-sm text-slate-600 font-medium">{order.customer_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          {order.delivery_method === "pickup" ? (
                            <MapPin className="w-3 h-3" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          {order.delivery_method === "pickup" ? "Recolección" : "Envío a Domicilio"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <div className="font-bold text-slate-900">{formatMoney(order.total_amount || 0)}</div>
                          <div className="text-xs text-slate-400">
                            {format(new Date(order.created_at), "PPP", { locale: es })}
                          </div>
                        </div>

                        {/* Botones de acción */}
                        {order.fulfillment_status === "unfulfilled" || order.fulfillment_status === "processing" ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              // ✅ PREVENIR QUE EL CLIC DEL BOTÓN ABRA LOS DETALLES
                              e.stopPropagation();
                              setSelectedRetailOrder(order);
                              setRetailTracking({ code: order.tracking_code || "", carrier: order.carrier_name || "" });
                              setIsRetailModalOpen(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                          >
                            Atender
                          </Button>
                        ) : (
                          <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* === TAB 2: WHOLESALE === */}
          <TabsContent value="wholesale" className="space-y-6 animate-in fade-in-50">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar revendedor o ID..."
                  className="pl-10 bg-white"
                  value={wholesaleSearch}
                  onChange={(e) => setWholesaleSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingWholesale ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-rose-600" />
              </div>
            ) : filteredWholesale.length === 0 ? (
              <EmptyState title="Sin pedidos de abasto" desc="No tienes solicitudes de otros revendedores." />
            ) : (
              <div className="space-y-3">
                {filteredWholesale.map((order) => (
                  <Card
                    key={order.id}
                    className="hover:border-rose-300 transition-all border-l-4 border-l-rose-500 cursor-pointer group"
                    // ✅ CLIC EN TODA LA TARJETA
                    onClick={() => {
                      // Adaptamos el consolidatedOrder a Quote para que el modal lo lea
                      // Ojo: En un mundo ideal tendríamos un tipo unificado, pero esto funciona visualmente
                      const adapter: any = {
                        ...order,
                        order_number: order.id.slice(0, 6),
                        customer_name: order.distributor?.business_name || "Revendedor",
                        customer_email: order.distributor?.email,
                        customer_phone: order.distributor?.phone,
                        delivery_method: "shipping", // Wholesale suele ser envío
                        fulfillment_status: order.status,
                        // Convertir items de wholesale a items de visor
                        items: order.items.map((i) => ({
                          ...i,
                          unit_price: 0, // A veces no viene en consolidated, poner 0 o calcular
                          total: 0,
                        })),
                      };
                      setViewingOrder(adapter);
                    }}
                  >
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                            ABASTO #{order.id.slice(0, 6)}
                          </span>
                          <FulfillmentBadge status={order.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">{order.distributor?.business_name || "Revendedor"}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{order.items.length} productos para empacar</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {order.status === "sent" ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              // ✅ STOP PROPAGATION
                              e.stopPropagation();
                              setSelectedWholesaleOrder(order);
                              setWholesaleTracking({ carrier: "", code: "" });
                              setIsWholesaleModalOpen(true);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 shadow-sm"
                          >
                            Despachar <Package className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                Enviado
                              </Badge>
                              <div className="text-xs text-slate-400 mt-1">{order.tracking_company}</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-400" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* --- MODAL 1: ATENDER --- */}
      <Dialog open={isRetailModalOpen} onOpenChange={setIsRetailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atender Pedido #{selectedRetailOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {selectedRetailOrder?.delivery_method === "pickup"
                ? "El cliente pasará a recoger."
                : "Ingresa los datos de envío."}
            </DialogDescription>
          </DialogHeader>
          {selectedRetailOrder?.delivery_method !== "pickup" && (
            <div className="space-y-3 py-4">
              <div className="space-y-1">
                <Label>Paquetería</Label>
                <Input
                  value={retailTracking.carrier}
                  onChange={(e) => setRetailTracking({ ...retailTracking, carrier: e.target.value })}
                  placeholder="DHL, FedEx..."
                />
              </div>
              <div className="space-y-1">
                <Label>Guía</Label>
                <Input
                  value={retailTracking.code}
                  onChange={(e) => setRetailTracking({ ...retailTracking, code: e.target.value })}
                  placeholder="12345..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateRetail} disabled={isSubmittingRetail} className="bg-indigo-600">
              {isSubmittingRetail ? <Loader2 className="animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: WHOLESALE --- */}
      <Dialog open={isWholesaleModalOpen} onOpenChange={setIsWholesaleModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Surtir Pedido #{selectedWholesaleOrder?.id.slice(0, 6)}</DialogTitle>
            <DialogDescription>Confirma los productos antes de enviar.</DialogDescription>
          </DialogHeader>

          {selectedWholesaleOrder && (
            <div className="space-y-6 py-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <Box className="w-3 h-3" /> Picking List
                </div>
                <div className="space-y-2">
                  {selectedWholesaleOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-white p-2 rounded border border-slate-200"
                    >
                      <div className="text-sm font-medium truncate max-w-[200px]">{item.product_name}</div>
                      <Badge variant="secondary">x{item.quantity}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Paquetería</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      value={wholesaleTracking.carrier}
                      onChange={(e) => setWholesaleTracking({ ...wholesaleTracking, carrier: e.target.value })}
                      placeholder="DHL, Estafeta..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Número de Rastreo</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      value={wholesaleTracking.code}
                      onChange={(e) => setWholesaleTracking({ ...wholesaleTracking, code: e.target.value })}
                      placeholder="TRACK123..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => fulfillMutation.mutate()}
              disabled={fulfillMutation.isPending || !wholesaleTracking.code}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {fulfillMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: VISOR DETALLES (Corregido para ver productos) --- */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
              <DialogTitle className="text-xl">Orden #{viewingOrder?.order_number}</DialogTitle>
              {viewingOrder && <FulfillmentBadge status={viewingOrder.fulfillment_status} />}
            </div>
            <DialogDescription>
              Realizada el {viewingOrder && format(new Date(viewingOrder.created_at), "PPP p", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-6 mt-2">
              <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-1">Cliente</h4>
                  <p className="text-sm text-slate-600">{viewingOrder.customer_name}</p>
                  <p className="text-sm text-slate-500">{viewingOrder.customer_email}</p>
                  <p className="text-sm text-slate-500">{viewingOrder.customer_phone}</p>
                  {viewingOrder.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                      <strong>Nota:</strong> {viewingOrder.notes}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-1">Entrega</h4>
                  {viewingOrder.delivery_method === "pickup" ? (
                    <div className="text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Recolección en Tienda
                      </span>
                    </div>
                  ) : (
                    <>
                      <AddressDisplay address={viewingOrder.shipping_address} />
                      {viewingOrder.tracking_code && (
                        <div className="mt-2 text-xs bg-white p-1.5 border rounded w-fit">
                          <span className="font-bold">{viewingOrder.carrier_name}:</span> {viewingOrder.tracking_code}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <Box className="w-4 h-4 text-slate-500" /> Productos
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                      <tr>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2 text-center">Cant.</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {/* ✅ AQUÍ ESTÁ EL ARREGLO DE LAS PARTIDAS: Busca en items O en quote_items */}
                      {((viewingOrder as any).items || (viewingOrder as any).quote_items || []).map(
                        (item: any, idx: number) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.product_image_url && (
                                  <img
                                    src={item.product_image_url}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover border bg-slate-100"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-slate-900 line-clamp-1">
                                    {item.product_name || item.name}
                                  </p>
                                  <p className="text-xs text-slate-500">{item.sku}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {/* Manejo seguro de precios */}
                              {formatMoney(item.subtotal || item.total || item.unit_price * item.quantity)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <div className="w-48 space-y-2">
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatMoney(viewingOrder.total_amount || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewingOrder(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="font-medium text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}
