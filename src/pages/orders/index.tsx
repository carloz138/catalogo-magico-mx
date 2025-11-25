import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes"; // Reusamos el hook, filtraremos en cliente
import { FulfillmentStatus } from "@/types/digital-catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Box,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Componente de Badge Logístico
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
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${config.bg} ${config.text} border border-transparent`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | "all">("all");

  // Cargamos todas las cotizaciones
  const { quotes, loading } = useQuotes({ autoLoad: true });

  // 1. FILTRO MAESTRO: Solo mostrar las que ya están PAGADAS
  const paidOrders = quotes.filter(q => (q as any).payment_status === 'paid');

  // 2. Filtros de UI (Búsqueda y Tabs)
  const filteredOrders = paidOrders.filter((order) => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.fulfillment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Estadísticas Rápidas
  const stats = {
    unfulfilled: paidOrders.filter(o => o.fulfillment_status === 'unfulfilled').length,
    processing: paidOrders.filter(o => o.fulfillment_status === 'processing').length,
    shipped: paidOrders.filter(o => ['shipped', 'ready_for_pickup'].includes(o.fulfillment_status)).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 pb-20 font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Pedidos</h1>
            <p className="text-slate-500 mt-1">Gestiona la logística y envíos de ventas pagadas.</p>
          </div>

          {/* KPIs Logísticos */}
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-amber-600 uppercase">
                <Box className="w-3.5 h-3.5" /> Por Empacar
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.unfulfilled}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-blue-600 uppercase">
                <Loader2 className="w-3.5 h-3.5" /> En Proceso
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.processing}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm min-w-[140px]">
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-purple-600 uppercase">
                <Truck className="w-3.5 h-3.5" /> Enviados
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.shipped}</span>
            </div>
          </div>
        </div>

        {/* TOOLBAR & LISTA */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar pedido, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {[
                  { id: 'all', label: 'Todos' },
                  { id: 'unfulfilled', label: 'Por Empacar' },
                  { id: 'processing', label: 'Procesando' },
                  { id: 'shipped', label: 'Enviados' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE PEDIDOS */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium">No hay pedidos pendientes</h3>
              <p className="text-slate-500 text-sm mt-1">
                {searchQuery ? "Intenta con otra búsqueda." : "Las ventas pagadas aparecerán aquí."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
                {/* Header Desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Pedido</div>
                    <div className="col-span-3">Cliente</div>
                    <div className="col-span-2">Fecha Pago</div>
                    <div className="col-span-2 text-center">Estado</div>
                    <div className="col-span-2 text-right">Acción</div>
                </div>

                {filteredOrders.map((order) => (
                    <div 
                        key={order.id} 
                        className="group relative md:grid md:grid-cols-12 md:gap-4 p-4 md:px-6 md:py-4 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/quotes/${order.id}`)} // Por ahora reusamos el detalle de quote
                    >
                        {/* Mobile Layout */}
                        <div className="md:hidden flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">#{order.order_number || order.id.slice(0,6)}</h3>
                                    <p className="text-xs text-slate-500">{format(new Date(order.created_at), "d MMM", { locale: es })}</p>
                                </div>
                            </div>
                            <FulfillmentBadge status={order.fulfillment_status} />
                        </div>

                        {/* Desktop Cols */}
                        <div className="hidden md:flex col-span-3 items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs">
                                {order.items_count}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">#{order.order_number || order.id.slice(0,8)}</div>
                                <div className="text-xs text-slate-500">{order.items_count} productos</div>
                            </div>
                        </div>

                        <div className="md:col-span-3 mb-2 md:mb-0">
                            <div className="font-medium text-slate-900">{order.customer_name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                {order.delivery_method === 'pickup' ? <MapPin className="w-3 h-3"/> : <Truck className="w-3 h-3"/>}
                                {order.delivery_method === 'pickup' ? "Recolección" : "Envío Domicilio"}
                            </div>
                        </div>

                        <div className="hidden md:block col-span-2 text-sm text-slate-500">
                            {/* Usamos updated_at como proxy de fecha pago si no tenemos el dato exacto en la lista */}
                            {format(new Date(order.updated_at), "d MMM, HH:mm", { locale: es })}
                        </div>

                        <div className="hidden md:flex col-span-2 justify-center">
                            <FulfillmentBadge status={order.fulfillment_status} />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button size="sm" variant="outline" className="w-full md:w-auto h-8 text-xs group-hover:border-indigo-300 group-hover:text-indigo-600">
                                Gestionar <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
