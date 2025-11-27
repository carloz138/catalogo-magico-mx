import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useUserRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Inbox, Lock, Eye, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Interfaz que coincide con lo que devuelve la RPC get_market_radar
interface MarketRequest {
  id: string;
  creado_el: string;
  fabricante_id: string;
  revendedor_id: string | null;
  catalogo_id: string;
  cliente_final_nombre: string | null;
  cliente_final_email: string | null;
  producto_nombre: string;
  producto_descripcion: string | null;
  cantidad: number;
  estatus_revendedor: string;
  estatus_fabricante: string;
  // Campos extra que trae la RPC desde auth.users
  revendedor_email_contacto?: string;
  revendedor_nombre_contacto?: string;
}

interface MarketIntelligenceProps {
  userId: string;
}

export const MarketIntelligenceWidget = ({ userId }: MarketIntelligenceProps) => {
  const { isAllowed, loading: loadingPlan, UpsellComponent } = useFeatureAccess("radar_inteligente");
  const { userRole } = useUserRole();

  const [requests, setRequests] = useState<MarketRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    // Solo cargamos si el usuario tiene permiso y ya cargó su plan
    if (isAllowed && userId && !loadingPlan) {
      fetchRequests();
    }
  }, [isAllowed, userId, loadingPlan]);

  const fetchRequests = async () => {
    if (!userId) return;
    setLoadingData(true);

    try {
      // 1. LLAMADA A LA RPC SEGURA
      // Usamos la función que creamos en SQL para poder leer el email del revendedor
      // desde auth.users sin violar la seguridad del frontend.
      const { data, error } = await supabase.rpc("get_market_radar", {
        p_user_id: userId,
      });

      if (error) throw error;

      // Casteamos la respuesta
      setRequests((data as MarketRequest[]) || []);
    } catch (error) {
      console.error("Error cargando radar:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // --- LÓGICA MAESTRA DE CONTACTO ---
  // Decide qué información mostrar y qué acción permitir según quién soy (L1 o L2)
  const getContactInfo = (req: MarketRequest) => {
    if (!userId) return null;

    // CASO A: Soy el Revendedor (L2) -> Es mi cliente directo -> VEO TODO
    if (userId === req.revendedor_id) {
      return {
        email: req.cliente_final_email,
        name: req.cliente_final_nombre || "Cliente Final",
        label: "Cliente Directo",
        canSee: true,
        action: "contact_client", // Contactar al comprador
      };
    }

    // CASO B: Soy el Fabricante (L1) y es venta directa (sin intermediario) -> VEO TODO
    if (userId === req.fabricante_id && !req.revendedor_id) {
      return {
        email: req.cliente_final_email,
        name: req.cliente_final_nombre || "Cliente Directo",
        label: "Cliente Directo",
        canSee: true,
        action: "contact_client", // Contactar al comprador
      };
    }

    // CASO C: Soy el Fabricante (L1) pero la venta es de mi Revendedor -> GESTIONO SOCIO
    // Aquí cambiamos el "Bloqueo" por "Gestión de Socio"
    if (userId === req.fabricante_id && req.revendedor_id) {
      return {
        // Mostramos los datos del L2 (Socio), no del L3 (Cliente final protegido)
        email: req.revendedor_email_contacto,
        name: req.revendedor_nombre_contacto || "Tu Revendedor",
        label: "Gestionar con Socio",
        canSee: true,
        action: "contact_partner", // Acción especial: Avisar al socio
      };
    }

    // Default (Por seguridad)
    return {
      email: "---",
      name: "Desconocido",
      label: "Protegido",
      canSee: false,
      action: "none",
    };
  };

  // --- RENDERS CONDICIONALES (Loading, Plan, Empty) ---

  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;

  if (!isAllowed) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;

  if (loadingData) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Escaneando red de distribución...</p>
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
          Tu radar está activo esperando búsquedas sin resultados.
        </p>
      </div>
    );
  }

  // --- RENDER PRINCIPAL (TABLA) ---
  return (
    <div className="bg-white min-h-[300px] relative overflow-hidden rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
            <TableHead className="w-[35%]">Producto Solicitado</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Contacto / Origen</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const contact = getContactInfo(req);
            const isNew = new Date(req.creado_el) > new Date(Date.now() - 86400000 * 2); // 2 días

            // Variable para saber si es acción de socio (L1 -> L2)
            const isPartnerAction = contact?.action === "contact_partner";

            return (
              <TableRow key={req.id} className="group hover:bg-indigo-50/30 transition-colors">
                {/* 1. COLUMNA PRODUCTO */}
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

                {/* 2. COLUMNA CANTIDAD */}
                <TableCell className="text-slate-600 align-top pt-4">
                  <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-xs">{req.cantidad} pzas</span>
                </TableCell>

                {/* 3. COLUMNA CONTACTO (Lógica dinámica L1/L2) */}
                <TableCell className="align-top pt-3">
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isPartnerAction ? "text-indigo-700" : "text-slate-700"}`}>
                      {contact?.name}
                    </span>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {/* Si es socio, mostramos badge distintivo */}
                      {isPartnerAction ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 bg-indigo-50 text-indigo-600 border-indigo-200"
                        >
                          Tu Socio (L2)
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-slate-400">Cliente Final</span>
                      )}

                      <span className="text-xs text-slate-500 truncate max-w-[140px]">
                        {contact?.canSee ? contact.email : "Info. Oculta"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* 4. COLUMNA ACCIÓN (Botón) */}
                <TableCell className="text-right align-top pt-3">
                  {contact?.canSee ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 text-xs ${
                        isPartnerAction
                          ? "border-indigo-300 text-indigo-700 hover:bg-indigo-100" // Estilo Partner
                          : "border-slate-200 text-slate-700 hover:bg-slate-50" // Estilo Cliente
                      }`}
                      onClick={() => {
                        // Generamos el mailto dinámicamente según quién sea
                        const subject = `Oportunidad de Venta: ${req.producto_nombre}`;
                        let body = "";

                        if (isPartnerAction) {
                          body = `Hola ${contact.name},\n\nUno de tus clientes en la red está buscando "${req.producto_nombre}" (${req.cantidad} pzas).\n\nTe recomiendo atender esta oportunidad desde tu panel de control.\n\nSaludos.`;
                        } else {
                          body = `Hola ${contact.name},\n\nVi que estás buscando "${req.producto_nombre}". Tengo disponibilidad...\n\nSaludos.`;
                        }

                        window.open(
                          `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                        );
                      }}
                    >
                      {isPartnerAction ? (
                        <>
                          {" "}
                          <UserCog className="w-3 h-3 mr-1.5" /> Avisar a Socio{" "}
                        </>
                      ) : (
                        <>
                          {" "}
                          <MessageSquare className="w-3 h-3 mr-1.5" /> Contactar{" "}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled className="h-8 text-xs text-slate-300">
                      <Lock className="w-3 h-3 mr-1.5" /> Privado
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
          * Los contactos marcados como "Tu Socio" son tus revendedores, no el cliente final.
        </p>
      </div>
    </div>
  );
};
