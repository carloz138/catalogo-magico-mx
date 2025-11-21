import React from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchStatsProps {
  catalogId: string;
}

export const SearchStatsWidget = ({ catalogId }: SearchStatsProps) => {
  // 1. USAMOS EL MISMO GATING (O puedes crear uno nuevo 'search_analytics')
  const { isAllowed, loading, UpsellComponent } = useFeatureAccess("radar_inteligente");

  if (loading) {
    return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  }

  // 2. SI NO TIENE PERMISO, MOSTRAMOS EL UPSELL
  if (!isAllowed) {
    return (
      <div className="h-full min-h-[300px]">
        {UpsellComponent}
      </div>
    );
  }

  // 3. VISTA AUTORIZADA (Nube de Palabras / Lista Top)
  // Datos Dummy visuales
  const topTerms = [
    { term: "Varilla 3/8", count: 145, trend: "up" },
    { term: "Cemento", count: 98, trend: "up" },
    { term: "Clavos", count: 65, trend: "down" },
    { term: "Martillo", count: 42, trend: "stable" },
    { term: "Impermeabilizante", count: 38, trend: "up" },
    { term: "Pintura Blanca", count: 25, trend: "down" },
    { term: "Brochas", count: 20, trend: "stable" },
  ];

  return (
    <ScrollArea className="h-[300px] w-full bg-white p-4">
      <div className="space-y-4">
        {/* Simulación de Nube de Tags Visual */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
            {topTerms.map((item, idx) => (
                <span 
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all hover:scale-105
                        ${idx === 0 ? 'bg-indigo-600 text-white text-lg shadow-md' : ''}
                        ${idx === 1 ? 'bg-indigo-400 text-white text-base' : ''}
                        ${idx > 1 ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100' : ''}
                    `}
                >
                    {item.term}
                </span>
            ))}
        </div>

        {/* Lista Detallada */}
        <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle de Búsquedas</h4>
            {topTerms.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm group hover:bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-700 font-medium">"{item.term}"</span>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs">{item.count} búsquedas</span>
                        <div className={`h-1.5 w-1.5 rounded-full ${item.trend === 'up' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </ScrollArea>
  );
};
