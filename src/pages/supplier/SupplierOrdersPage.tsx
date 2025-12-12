import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Search, 
  Box, 
  ArrowRight, 
  User,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// --- TIPOS ---
interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_image_url?: string;
  sku?: string;
  unit_price?: number;
}

interface ConsolidatedOrder {
  id: string;
  created_at: string;
  status: 'draft' | 'sent' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address?: string;
  tracking_company?: string;
  tracking_number?: string;
  distributor?: {
    business_name: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
}

export default function SupplierOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = useState<ConsolidatedOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ carrier: "", code: "" });
  const [searchQuery, setSearchQuery] = useState("");

  // 1. FETCH DE PEDIDOS CONSOLIDADOS (Solo lo que me toca surtir)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["supplier-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("consolidated_orders")
        .select(`
          *,
          items:consolidated_order_items (
            id, product_name, quantity, product_image_url, sku, unit_price
          ),
          distributor:business_info!consolidated_orders_distributor_id_fkey (
            business_name, phone, email
          )
        `)
        .eq("supplier_id", user.id)
        .neq("status", "draft") // Ignoramos borradores, solo lo confirmado
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ConsolidatedOrder[];
    },
    enabled: !!user,
  });

  // 2. MUTACIÓN PARA DESPACHAR
  const fulfillMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) return;
      
      const { error } = await supabase
        .from("consolidated_orders")
        .update({
          status: "shipped",
          tracking_company: trackingForm.carrier,
          tracking_number: trackingForm.code,
          shipped_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Orden Despachada", description: "El revendedor ha sido notificado." });
      setIsModalOpen(false);
      setTrackingForm({ carrier: "", code: "" });
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
    },
    onError: () => toast({ title: "Error", description: "No se pudo actualizar la orden", variant: "destructive" }),
  });

  // Filtros de Frontend
  const filteredOrders = orders.filter(order => {
    const term = searchQuery.toLowerCase();
    const distributorName = order.distributor?.business_name?.toLowerCase() || "";
    const orderId = order.id.toLowerCase();
    return distributorName.includes(term) || orderId.includes(term);
  });

  const pendingOrders = filteredOrders.filter(o => o.status === 'sent'); // Pendiente de envío
  const historyOrders = filteredOrders.filter(o => o.status === 'shipped' || o.status === 'delivered');

  const handleOpenFulfillment = (order: ConsolidatedOrder) => {
    setSelectedOrder(order);
    setTrackingForm({ carrier: "", code: "" });
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 pb-20">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Surtido</h1>
        <p className="text-slate-500 mt-1">Gestiona los pedidos de abasto de tus revendedores.</p>
        
        {/* Stats Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Pendientes</div>
            <div className="text-2xl font-bold text-amber-600">{pendingOrders.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Completados</div>
            <div className="text-2xl font-bold text-indigo-600">{historyOrders.length}</div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por ID o Revendedor..." 
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-white border border-slate-200 mb-6">
            <TabsTrigger value="pending">Por Surtir ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="history">Historial ({historyOrders.length})</TabsTrigger>
          </TabsList>

          {/* LISTA DE PENDIENTES */}
          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <EmptyState title="Todo al día" desc="No tienes pedidos pendientes de surtir." />
            ) : (
              pendingOrders.map(order => (
                <OrderCard key={order.id} order={order} onAction={() => handleOpenFulfillment(order)} actionLabel="Despachar" />
              ))
            )}
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="history" className="space-y-4">
            {historyOrders.length === 0 ? (
              <EmptyState title="Sin historial" desc="Aún no has enviado ningún pedido." />
            ) : (
              historyOrders.map(order => (
                <OrderCard key={order.id} order={order} isHistory />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL DE DESPACHO (PICKING LIST) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Despachar Orden</DialogTitle>
            <DialogDescription>
              Confirma los artículos y agrega la guía de rastreo.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* 1. INFORMACIÓN DE ENVÍO */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" /> Dirección de Entrega
                </div>
                <p className="text-slate-600 whitespace-pre-line">
                  {selectedOrder.shipping_address || "Dirección no especificada"}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200 flex gap-4 text-xs text-slate-500">
                   <span>Revendedor: <span className="font-medium text-slate-900">{selectedOrder.distributor?.business_name || "N/A"}</span></span>
                </div>
              </div>

              {/* 2. PICKING LIST (QUÉ EMPACAR) */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                  <Box className="w-3.5 h-3.5" /> Lista de Empaque (Picking List)
                </h4>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-md overflow-hidden shrink-0">
                        {item.product_image_url ? (
                          <img src={item.product_image_url} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 m-auto text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.product_name}</div>
                        <div className="text-xs text-slate-500">SKU: {item.sku || 'N/A'}</div>
                      </div>
                      <Badge variant="secondary" className="text-sm font-bold h-7 px-2">
                        x{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. INPUTS DE GUÍA */}
              <div className="grid gap-4 bg-white p-1">
                <div className="space-y-2">
                  <Label>Paquetería</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="DHL, FedEx, Estafeta..." 
                      className="pl-9"
                      value={trackingForm.carrier}
                      onChange={e => setTrackingForm({...trackingForm, carrier: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Número de Rastreo</Label>
                  <Input 
                    placeholder="Ej. 1Z999..." 
                    value={trackingForm.code}
                    onChange={e => setTrackingForm({...trackingForm, code: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => fulfillMutation.mutate()} 
              disabled={fulfillMutation.isPending || !trackingForm.carrier || !trackingForm.code}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {fulfillMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirmar Envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente Tarjeta de Orden
function OrderCard({ order, onAction, actionLabel, isHistory }: { order: ConsolidatedOrder, onAction?: () => void, actionLabel?: string, isHistory?: boolean }) {
  return (
    <Card className="hover:border-indigo-200 transition-all shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          
          {/* Columna Izquierda: Info Principal */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline" className="font-mono text-xs">
                #{order.id.slice(0, 8)}
              </Badge>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(order.created_at), "PPP", { locale: es })}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">{order.distributor?.business_name || "Revendedor Desconocido"}</span>
            </div>
            
            <div className="text-sm text-slate-500">
              {order.items.length} productos • Total: <span className="font-medium text-emerald-600">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Columna Derecha: Estado y Acción */}
          <div className="flex flex-col items-end justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 md:pl-4 md:border-l border-slate-100">
            {isHistory ? (
              <div className="text-right">
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mb-1">Enviado</Badge>
                <div className="text-xs text-slate-500">
                  {order.tracking_company} - {order.tracking_number}
                </div>
              </div>
            ) : (
              <>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 w-fit">Por Surtir</Badge>
                {onAction && (
                  <Button size="sm" onClick={onAction} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                    {actionLabel} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="font-medium text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}
