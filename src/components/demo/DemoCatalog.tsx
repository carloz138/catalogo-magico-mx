import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Plus, Zap, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(amount / 100);
};

const ProductCard = ({ product, onAdd }: { product: any; onAdd: () => void }) => (
  <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer">
    <div className="aspect-square bg-slate-100 relative overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <button
        onClick={onAdd}
        className="absolute bottom-3 right-3 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
    <div className="p-4">
      <p className="text-xs font-bold text-slate-400 uppercase">{product.category}</p>
      <h3 className="font-medium text-slate-900 line-clamp-1">{product.name}</h3>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-bold text-lg text-slate-900">{formatCurrency(product.price_retail)}</span>
      </div>
    </div>
  </div>
);

const DemoCart = ({ isOpen, onClose, items, setItems }: any) => {
  const handleAddUpsell = () => {
    setItems([
      ...items,
      {
        name: "Pack Promocional",
        price: 45000,
        image: "https://images.unsplash.com/photo-1556228720-191845bb5668?auto=format&fit=crop&w=200",
      },
    ]);
  };

  const total = items.reduce((acc: number, item: any) => acc + item.price, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-slate-50">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Tu Pedido Demo</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingCart className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">Carrito vacío.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex gap-4 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <img src={item.image} className="w-16 h-16 rounded-md object-cover bg-slate-100" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900">{item.name}</p>
                  <p className="text-slate-500 text-sm font-bold">{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-xl ring-2 ring-indigo-200 ring-offset-2"
            >
              <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/20 p-2 rounded-full blur-xl w-24 h-24"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1 rounded-md backdrop-blur-sm animate-pulse">
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  </div>
                  <h4 className="font-bold text-sm tracking-wide uppercase">¡Potencia tu ticket!</h4>
                </div>

                <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                  La IA detectó que los clientes que llevan esto, también compran el <strong>Pack Promocional</strong>.
                </p>

                <div className="flex gap-3 bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/20">
                  <div className="h-10 w-10 bg-white rounded-md shrink-0 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1556228720-191845bb5668?auto=format&fit=crop&w=200"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Pack Promo</p>
                      <p className="text-[10px] text-indigo-200 line-through">$550.00</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-50"
                      onClick={handleAddUpsell}
                    >
                      Agregar +$450
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="border-t pt-4 bg-white p-4 -mx-6 -mb-6">
          <div className="flex justify-between font-bold text-lg mb-4 text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Button
            className="w-full bg-slate-900 text-white h-12 text-base shadow-lg shadow-slate-200"
            onClick={() => alert("¡Pedido Simulado Enviado!")}
          >
            Enviar Cotización de Prueba <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default function DemoCatalog({ products, color }: { products: any[]; color: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (p: any) => {
    setItems([...items, { ...p, price: p.price_retail }]);
  };

  return (
    <div className="min-h-[600px] bg-slate-50/50 pb-24 relative font-sans">
      <div
        className="h-48 relative overflow-hidden bg-slate-900 flex items-center justify-center text-center px-4"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-white">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Catálogo Digital</h2>
          <p className="opacity-90 font-light text-lg">Explora nuestros productos disponibles</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Buscar productos..."
              className="pl-12 h-12 text-base border-slate-200 bg-slate-50 focus:bg-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={() => handleAdd(p)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto"
          >
            <Button
              onClick={() => setIsCartOpen(true)}
              size="lg"
              className="w-full md:w-auto rounded-full shadow-2xl shadow-indigo-500/30 px-8 h-14 bg-slate-900 hover:bg-slate-800 text-white gap-4 text-base border border-white/10"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                  {items.length}
                </span>
              </div>
              <span className="font-bold">
                Ver Pedido | {formatCurrency(items.reduce((a: any, b: any) => a + b.price, 0))}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <DemoCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={items} setItems={setItems} />
    </div>
  );
}
