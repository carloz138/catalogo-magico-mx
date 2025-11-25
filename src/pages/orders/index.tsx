import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteService } from "@/services/quote.service";
import { FulfillmentStatus, Quote } from "@/types/digital-catalog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Package, Truck, CheckCircle2, MapPin, Box, ArrowRight, Barcode } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const FulfillmentBadge = ({ status }: { status: FulfillmentStatus }) => {
  const config = {
    unfulfilled: { label: "Por Empacar", bg: "bg-amber-100", text: "text-amber-800", icon: Box },
    processing: { label: "Empacando", bg: "bg-blue-100", text: "text-blue-800", icon: Loader2 },
    ready_for_pickup: { label: "Listo en Tienda", bg: "bg-indigo-100", text: "text-indigo-800", icon: MapPin },
    shipped: { label: "En Camino", bg: "bg-purple-100", text: "text-purple-800", icon: Truck },
    delivered: { label: "Entregado", bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle2 },
  }[status] || { label: status, bg: "bg-gray-100", text: "text-gray-800", icon: Box };

  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${config.bg} ${config.text} border border-transparent`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | "all">("all");

  const [selectedOrder, setSelectedOrder] = useState<Quote | null>(null);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [trackingCode, setTrackingCode] = useState("");
  const [carrierName, setCarrierName] = useState("");

  const { quotes, loading, refetch } = useQuotes({ autoLoad: true });

  const paidOrders = quotes.filter((q) => (q as any).payment_status === "paid");

  const filteredOrders = paidOrders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.fulfillment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    unfulfilled: paidOrders.filter((o) => o.fulfillment_status === "unfulfilled").length,
    processing: paidOrders.filter((o) => o.fulfillment_status === "processing").length,
    shipped: paidOrders.filter((o) => ["shipped", "ready_for_pickup"].includes(o.fulfillment_status)).length,
  };

  const openFulfillmentModal = (order: Quote) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_code || "");
    setCarrierName(order.carrier_name || "");
    setShowFulfillmentModal(true);
  };

  const handleFulfillOrder = async () => {
    if (!selectedOrder || !user) return;

    setIsSubmitting(true);
    try {
      // ✅ CORRECCIÓN LÓGICA: Si no es explícitamente pickup, asumimos shipping
      const isPickup = selectedOrder.delivery_method === "pickup";

      const newStatus: FulfillmentStatus = isPickup ? "ready_for_pickup" : "shipped";

      // Validación estricta solo si NO es pickup
      if (!isPickup && (!trackingCode || !carrierName)) {
        toast({
          title: "Datos incompletos",
          description: "Debes ingresar la paquetería y el número de guía.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await QuoteService.updateFulfillmentStatus(
        selectedOrder.id,
        user.id,
        newStatus,
        isPickup ? undefined : { code: trackingCode, carrier: carrierName },
      );

      toast({
        title: isPickup ? "✅ Listo para Recoger" : "✅ Pedido Enviado",
        description: "La información de rastreo ha sido actualizada.",
      });

      setShowFulfillmentModal(false);
      refetch();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo actualizar el pedido.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper para determinar el tipo visualmente
  const isPickupOrder = selectedOrder?.delivery_method === "pickup";

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-20 font-sans text-slate-900">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Pedidos</h1>
            <p className="text-slate-500 mt-1">Gestiona la logística y envíos de ventas pagadas.</p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-amber-600 uppercase">
                <Box className="w-3.5 h-3.5" /> Por Empacar
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.unfulfilled}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-purple-600 uppercase">
                <Truck className="w-3.5 h-3.5" /> Enviados
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.shipped}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar pedido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {[
                { id: "all", label: "Todos" },
                { id: "unfulfilled", label: "Por Empacar" },
                { id: "shipped", label: "Enviados" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === tab.id ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-24">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-slate-900 font-medium">No hay pedidos</h3>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase">
                <div className="col-span-3">Pedido</div>
                <div className="col-span-3">Cliente</div>
                <div className="col-span-2">Fecha Pago</div>
                <div className="col-span-2 text-center">Estado</div>
                <div className="col-span-2 text-right">Acción</div>
              </div>

              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="group md:grid md:grid-cols-12 md:gap-4 p-4 md:px-6 md:py-4 items-center hover:bg-slate-50 transition-colors"
                >
                  <div className="md:hidden flex justify-between mb-3">
                    <div className="font-bold">#{order.order_number || order.id.slice(0, 6)}</div>
                    <FulfillmentBadge status={order.fulfillment_status} />
                  </div>

                  <div className="hidden md:flex col-span-3 items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                      {order.items_count}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">#{order.order_number || order.id.slice(0, 8)}</div>
                      <div className="text-xs text-slate-500">{order.items_count} items</div>
                    </div>
                  </div>

                  <div className="md:col-span-3 mb-2 md:mb-0">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {order.delivery_method === "pickup" ? (
                        <MapPin className="w-3 h-3" />
                      ) : (
                        <Truck className="w-3 h-3" />
                      )}
                      {order.delivery_method === "pickup" ? "Recolección" : "Envío Domicilio"}
                    </div>
                  </div>

                  <div className="hidden md:block col-span-2 text-sm text-slate-500">
                    {format(new Date(order.updated_at), "d MMM, HH:mm", { locale: es })}
                  </div>

                  <div className="hidden md:flex col-span-2 justify-center">
                    <FulfillmentBadge status={order.fulfillment_status} />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2">
                    {order.fulfillment_status === "unfulfilled" || order.fulfillment_status === "processing" ? (
                      <Button
                        size="sm"
                        className="w-full md:w-auto h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        onClick={() => openFulfillmentModal(order)}
                      >
                        Despachar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full md:w-auto h-8 text-xs"
                        onClick={() => openFulfillmentModal(order)}
                      >
                        Ver Guía
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* --- MODAL DE DESPACHO --- */}
      <Dialog open={showFulfillmentModal} onOpenChange={setShowFulfillmentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              {isPickupOrder
                ? "El cliente pasará a recoger este pedido a tu ubicación."
                : "Ingresa los datos de la paquetería para notificar al cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* ✅ CORRECCIÓN: Usamos !isPickupOrder para que salga por defecto si es null o shipping */}
            {!isPickupOrder && (
              <>
                <div className="space-y-2">
                  <Label>Paquetería / Servicio</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Ej. DHL, FedEx, Uber Flash"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Número de Rastreo (Tracking)</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Ej. 1Z999AA101..."
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {isPickupOrder && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Confirmar Disponibilidad</h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    Al confirmar, el sistema notificará al cliente que su paquete está listo en mostrador.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFulfillmentModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFulfillOrder} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              {isPickupOrder ? "Marcar Listo" : "Confirmar Envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
