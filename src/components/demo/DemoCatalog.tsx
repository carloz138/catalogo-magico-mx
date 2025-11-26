import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Plus, Check, Sparkles, X, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTES SIMPLES ---
const ProductCard = ({ product, onAdd }: { product: any, onAdd: () => void }) => (
  <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer">
    <div className="aspect-square bg-slate-100 relative overflow-hidden">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <button onClick={onAdd} className="absolute bottom-3 right-3 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300">
        <Plus className="w-5 h-5" />
      </button>
    </div>
    <div className="p-4">
      <p className="text-xs font-bold text-slate-400 uppercase">{product.category}</p>
      <h3 className="font-medium text-slate-900 line-clamp-1">{product.name}</h3>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-bold text-lg text-slate-900">${(product.price_retail / 100).toFixed(2)}</span>
      </div>
    </div>
  </div>
);

// --- CART MODAL FALSO ---
const DemoCart = ({ isOpen, onClose, items, onClear }: any) => {
    // Recomendaciones Falsas (Upsell)
    const recommendations = items.length > 0 ? [
        { id: "upsell1", name: "Producto Complementario VIP", price: 450, image: "https://images.unsplash.com/photo-1556228720-191845bb5668?auto=format&fit=crop&w=200" }
    ] : [];

    const total = items.reduce((acc: number, item: any) => acc + item.price, 0);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
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
                             <div key={i} className="flex gap-4">
                                 <img src={item.image} className="w-16 h-16 rounded-md object-cover bg-slate-100"/>
                                 <div>
                                     <p className="font-medium text-sm">{item.name}</p>
                                     <p className="text-slate-500 text-sm">${(item.price/100).toFixed(2)}</p>
                                 </div>
                             </div>
                         ))}

                         {/* ZONA DE RECOMENDACIÓN (La que pediste) */}
                         <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <h4 className="font-bold text-indigo-900 text-sm">Sugerencia IA</h4>
                            </div>
                            <div className="flex gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                <div className="h-12 w-12 bg-slate-100 rounded-md"></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Pack Promocional</p>
                                    <p className="text-xs text-slate-500">Los clientes suelen llevar esto junto.</p>
                                </div>
                                <Button size="sm" variant="outline" className="ml-auto h-8 text-xs">Agregar</Button>
                            </div>
                         </div>
                    </div>
                )}

                <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Total</span>
                        <span>${(total/100).toFixed(2)}</span>
                    </div>
                    <Button className="w-full bg-slate-900 text-white" onClick={() => alert("¡Pedido Simulado Enviado!")}>
                        Enviar Cotización de Prueba
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// --- CATALOG CONTENT ---
export default function DemoCatalog({ products, color }: { products: any[], color: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (p: any) => {
    setItems([...items, { ...p, price: p.price_retail }]);
  };

  return (
    <div className="min-h-[600px] bg-slate-50/50 pb-20 relative">
      {/* HEADER CATALOGO */}
      <div className="h-48 relative overflow-hidden bg-slate-900 flex items-center justify-center text-center px-4" style={{ backgroundColor: color }}>
         <div className="absolute inset-0 bg-black/20" />
         <div className="relative z-10 text-white">
            <h2 className="text-3xl font-bold mb-2">Catálogo Digital</h2>
            <p className="opacity-90">Explora nuestros productos disponibles</p>
         </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 mb-6">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                <Input 
                    placeholder="Buscar productos..." 
                    className="pl-10 h-12 text-base"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
             </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => handleAdd(p)} />
            ))}
        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      <AnimatePresence>
        {items.length > 0 && (
            <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
                <Button 
                    onClick={() => setIsCartOpen(true)}
                    size="lg" 
                    className="rounded-full shadow-2xl px-8 h-14 bg-slate-900 hover:bg-slate-800 text-white gap-3"
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-bold">{items.length} | ${(items.reduce((a:any,b:any)=>a+b.price,0)/100).toFixed(2)}</span>
                </Button>
            </motion.div>
        )}
      </AnimatePresence>

      <DemoCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={items} />
    </div>
  );
}
