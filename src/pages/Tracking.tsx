import React, { useState, FormEvent } from 'react';
// ⚠️ Asegúrate de que esta ruta apunte a tu archivo de configuración real
import { supabase } from '../lib/supabaseClient'; 
import { 
  Package, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Clock, 
  Truck, 
  Home,
  AlertCircle,
  LucideIcon 
} from 'lucide-react';

// --- DEFINICIÓN DE TIPOS (INTERFACES) ---

// 1. Estructura de un producto dentro de la orden
interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number; // Viene en centavos
  image_url: string | null;
}

// 2. Estructura de la Orden completa (coincide con el return de tu SQL)
interface Order {
  id: string;
  quote_number: number | null;
  status: string;
  total_amount: number; // Viene en centavos
  currency: string;
  created_at: string;
  items: OrderItem[];
}

// 3. Estructura del formulario de búsqueda
interface SearchFormData {
  id: string;
  email: string;
}

// 4. Estructura para los pasos del Timeline
interface TimelineStep {
  key: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  match: string[];
}

export default function Tracking() {
  const [loading, setLoading] = useState<boolean>(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>('');
  const [showItems, setShowItems] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<SearchFormData>({ id: '', email: '' });

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Llamada RPC tipada genéricamente
      const { data, error } = await supabase.rpc('get_order_status_public', {
        p_lookup_id: formData.id.trim(),
        p_email: formData.email.trim()
      });

      if (error) throw error;

      // Validación manual: si data es un array vacío
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError('No encontramos el pedido. Verifica tus datos.');
        return;
      }

      // Supabase a veces devuelve 'any', aseguramos que es del tipo Order
      // Como rpc devuelve un set, tomamos el primero (data[0])
      setOrder(data[0] as Order);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al buscar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Helper de Estatus Visual
  const getStatusConfig = (status: string) => {
    const steps: TimelineStep[] = [
      { key: 'received', label: 'Solicitud Recibida', desc: 'Tu pedido ha sido registrado.', icon: Clock, match: ['draft', 'sent'] },
      { key: 'processing', label: 'Procesando', desc: 'Estamos preparando tu paquete.', icon: Package, match: ['accepted', 'paid'] },
      { key: 'shipped', label: 'En Camino', desc: 'Tu pedido salió a ruta.', icon: Truck, match: ['shipped', 'in_transit'] },
      { key: 'delivered', label: 'Entregado', desc: '¡Disfruta tu compra!', icon: Home, match: ['delivered'] },
    ];

    const currentIndex = steps.findIndex(s => s.match.includes(status));
    const activeStep = currentIndex === -1 ? 0 : currentIndex; // Default al paso 1 si no encuentra
    
    return { steps, activeStep, isCancelled: status === 'cancelled' };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      
      {/* --- HEADER --- */}
      <div className="w-full max-w-md mb-6 text-center mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Rastreo de Envíos</h1>
        <p className="text-gray-500 text-sm">Ingresa tus datos para ver el estatus</p>
      </div>

      {/* --- CARD PRINCIPAL --- */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden mb-10">
        
        {/* BUSCADOR: Se oculta si ya hay orden encontrada para limpiar la vista */}
        {!order && (
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">No. Pedido / ID</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder="Ej: QT-1024 o UUID"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-70 disabled:scale-100 flex justify-center items-center gap-2"
              >
                {loading ? 'Buscando...' : 'Rastrear ahora'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* --- RESULTADOS (TIMELINE VERTICAL) --- */}
        {order && (
          <div className="animate-fade-in">
            {/* Cabecera del Resultado */}
            <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-indigo-200 text-sm font-medium">Pedido #{order.quote_number || order.id.slice(0,6)}</p>
                  <h2 className="text-3xl font-bold mt-1">
                    ${(order.total_amount / 100).toFixed(2)} <span className="text-base font-normal text-indigo-200">{order.currency}</span>
                  </h2>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Timeline Vertical */}
            <div className="p-6 bg-white">
              <h3 className="font-bold text-gray-900 mb-6 text-lg">Historial</h3>
              
              {(() => {
                const { steps, activeStep, isCancelled } = getStatusConfig(order.status);
                
                if (isCancelled) return (
                  <div className="text-red-600 font-bold text-center py-6 bg-red-50 rounded-xl border border-red-100">
                    🚫 Este pedido ha sido cancelado
                  </div>
                );

                return (
                  <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 ml-2">
                    {steps.map((step, index) => {
                      const isActive = index <= activeStep;
                      const isCurrent = index === activeStep;
                      const Icon = step.icon; // Componente Icono
                      
                      return (
                        <div key={step.key} className="relative pl-8">
                          {/* Bolita del Timeline */}
                          <div className={`absolute -left-[23px] top-0 w-10 h-10 rounded-full border-4 flex items-center justify-center transition-colors duration-300 z-10 ${
                            isActive 
                              ? 'bg-indigo-600 border-white shadow-md text-white' 
                              : 'bg-gray-100 border-white text-gray-400'
                          }`}>
                            {isActive ? <CheckCircle size={18} /> : <Icon size={18} />}
                          </div>

                          {/* Textos */}
                          <div className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                            <h4 className={`font-bold text-sm ${isCurrent ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {step.label}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Acordeón de Productos */}
            <div className="border-t border-gray-100">
              <button 
                onClick={() => setShowItems(!showItems)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <span className="text-sm font-medium text-gray-600">
                  {showItems ? 'Ocultar productos' : `Ver productos (${order.items?.length || 0})`}
                </span>
                {showItems ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              
              {showItems && (
                <div className="bg-gray-50 px-4 pb-4 space-y-3 animate-slide-down">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      {/* Imagen Miniatura */}
                      <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Info Producto */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                      </div>
                      
                      {/* Precio */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">${(item.unit_price / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Botón nueva búsqueda */}
                  <button 
                    onClick={() => setOrder(null)}
                    className="w-full mt-4 text-xs font-semibold text-indigo-600 py-3 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                  >
                    Hacer otra búsqueda
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
