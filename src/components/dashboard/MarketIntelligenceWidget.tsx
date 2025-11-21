import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext"; // Necesitamos saber quién está logueado
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Inbox, Lock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns"; // Si no tienes date-fns, puedes usar JS nativo

// 1. Interfaz exacta basada en tu tabla 'solicitudes_mercado'
interface MarketRequest {
  id: string;
  creado_el: string;
  fabricante_id: string;
  revendedor_id: string | null; // Puede ser null si es venta directa del L1
  catalogo_id: string;
  cliente_final_nombre: string | null;
  cliente_final_email: string | null;
  producto_nombre: string;
  producto_descripcion: string | null;
  cantidad: number;
  estatus_revendedor: string;
  estatus_fabricante: string;
}

interface MarketIntelligenceProps {
  catalogId: string | null;
}

export const MarketIntelligenceWidget = ({ catalogId }: MarketIntelligenceProps) => {
  // Gating y Auth
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("radar_inteligente");
  const { user } = useAuth(); // Para saber si soy L1 o L2
  
  // Estado de datos
  const [requests, setRequests] = useState<MarketRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isAllowed && catalogId && user && !loadingPlan) {
      fetchRequests();
    }
  }, [isAllowed, catalogId, user, loadingPlan]);

  const fetchRequests = async () => {
    if (!catalogId) return;
    setLoadingData(true);
    
    try {
      // CONSULTA A TU TABLA REAL 'solicitudes_mercado'
      const { data, error } = await supabase
        .from("solicitudes_mercado")
        .select("*")
        .eq("catalogo_id", catalogId) // Filtramos por el catálogo actual
        .order("creado_el", { ascending: false })
        .limit(20); // Traemos las últimas 20

      if (error) throw error;
      setRequests(data as MarketRequest[] || []);
    } catch (error) {
      console.error("Error cargando radar:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // --- LÓGICA DE VISUALIZACIÓN DE CONTACTO ---
  const getContactInfo = (req: MarketRequest) => {
    if (!user) return null;

    // Caso A: Soy el Revendedor (L2) de esta solicitud -> VEO TODO
    if (user.id === req.revendedor_id) {
      return {
        email: req.cliente_final_email,
        name: req.cliente_final_nombre,
        canSee: true
      };
    }

    // Caso B: Soy el Fabricante (L1) Y es una venta directa mía (no hay revendedor) -> VEO TODO
    if (user.id === req.fabricante_id && req.revendedor_id === null) {
      return {
        email: req.cliente_final_email,
        name: req.cliente_final_nombre,
        canSee: true
      };
    }

    // Caso C: Soy el Fabricante (L1) pero la venta es de un Revendedor -> OCULTO
    // OJO: Aquí podríamos agregar la lógica de "Si Plan == Enterprise -> canSee: true" en el futuro
    return {
      email: "Datos protegidos del Revendedor",
      name: "Cliente de Red",
      canSee: false
    };
  };

  // Renderizados condicionales (Carga, Gating, Vacío)
  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!isAllowed) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;
  
  if (loadingData) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Escaneando mercado...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
            <Inbox className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-600 font-medium">Sin solicitudes nuevas</p>
        <p className="text-xs text-slate-400 max-w-xs text-center mt-1">
          Tu radar está activo. Las búsquedas fallidas aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[300px] relative overflow-hidden rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
            <TableHead className="w-[35%]">Producto Solicitado</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const contact = getContactInfo(req);
            const isNew = new Date(req.creado_el) > new Date(Date.now() - 86400000 * 2); // 2 días

            return (
              <TableRow key={req.id} className="group hover:bg-indigo-50/30 transition-colors">
                {/* Columna PRODUCTO */}
                <TableCell className="font-medium text-slate-900 py-3 align-top">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      {req.producto_nombre}
                      {isNew && (
                        <Badge className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                          Nuevo
                        </Badge>
                      )}
                    </span>
                    {req.producto_descripcion && (
                      <span className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1">
                        {req.producto_descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Columna CANTIDAD */}
                <TableCell className="text-slate-600 align-top pt-4">
                   <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-xs">
                     {req.cantidad} pzas
                   </span>
                </TableCell>

                {/* Columna CONTACTO (Con lógica L1/L2) */}
                <TableCell className="align-top pt-3">
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${contact?.canSee ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                       {contact?.name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                       {contact?.canSee ? (
                         contact.email
                       ) : (
                         <>
                           <Lock className="w-3 h-3" /> Info. Oculta
                         </>
                       )}
                    </span>
                  </div>
                </TableCell>

                {/* Columna ACCIÓN */}
                <TableCell className="text-right align-top pt-3">
                  {contact?.canSee ? (
                     <Button size="sm" variant="outline" className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                       <MessageSquare className="w-3 h-3 mr-1.5" /> Contactar
                     </Button>
                  ) : (
                     <Button size="sm" variant="ghost" disabled className="h-8 text-xs text-slate-300">
                       <Eye className="w-3 h-3 mr-1.5" /> Solo L2
                     </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      <div className="p-2 text-center border-t border-slate-100 bg-slate-50 mt-auto">
        <p className="text-[10px] text-slate-400">
          * Los contactos de la red de revendedores están protegidos por privacidad.
        </p>
      </div>
    </div>
  );
};
