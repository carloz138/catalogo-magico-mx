import React, { useEffect, useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useUserRole } from "@/contexts/RoleContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Inbox, Lock, UserCog, Phone, Mail } from "lucide-react"; // Nuevos iconos
import { supabase } from "@/integrations/supabase/client";

interface MarketRequest {
  id: string;
  creado_el: string;
  fabricante_id: string;
  revendedor_id: string | null;
  catalogo_id: string;
  cliente_final_nombre: string | null;
  cliente_final_email: string | null;
  cliente_final_telefono?: string | null; // Nuevo campo (asegúrate que exista en tu tabla)
  producto_nombre: string;
  producto_descripcion: string | null;
  cantidad: number;
  estatus_revendedor: string;
  estatus_fabricante: string;
  // Campos extra RPC
  revendedor_email_contacto?: string;
  revendedor_nombre_contacto?: string;
  revendedor_telefono_contacto?: string; // Nuevo campo RPC
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
    if (isAllowed && userId && !loadingPlan) {
      fetchRequests();
    }
  }, [isAllowed, userId, loadingPlan]);

  const fetchRequests = async () => {
    if (!userId) return;
    setLoadingData(true);
    try {
      const { data, error } = await supabase.rpc("get_market_radar", { p_user_id: userId });
      if (error) throw error;
      setRequests((data as unknown as MarketRequest[]) || []);
    } catch (error) {
      console.error("Error cargando radar:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // --- HELPER: Limpiar teléfono para Link de WhatsApp ---
  const formatPhoneForWA = (phone: string | null | undefined) => {
    if (!phone) return null;
    // Quita todo lo que no sea números (guiones, espacios, parentesis, el +)
    return phone.replace(/\D/g, "");
  };

  // --- LÓGICA DE CONTACTO ---
  const getContactInfo = (req: MarketRequest) => {
    if (!userId) return null;

    // CASO A: Soy L2 -> Cliente Directo
    if (userId === req.revendedor_id) {
      return {
        phone: req.cliente_final_telefono,
        email: req.cliente_final_email,
        name: req.cliente_final_nombre || "Cliente Final",
        label: "Cliente Directo",
        canSee: true,
        isPartner: false,
      };
    }

    // CASO B: Soy L1 -> Cliente Directo
    if (userId === req.fabricante_id && !req.revendedor_id) {
      return {
        phone: req.cliente_final_telefono,
        email: req.cliente_final_email,
        name: req.cliente_final_nombre || "Cliente Directo",
        label: "Cliente Directo",
        canSee: true,
        isPartner: false,
      };
    }

    // CASO C: Soy L1 -> Gestionar con Socio (L2)
    if (userId === req.fabricante_id && req.revendedor_id) {
      return {
        phone: req.revendedor_telefono_contacto, // Prioridad WhatsApp Socio
        email: req.revendedor_email_contacto,
        name: req.revendedor_nombre_contacto || "Tu Revendedor",
        label: "Gestionar con Socio",
        canSee: true,
        isPartner: true,
      };
    }

    return { phone: null, email: "---", name: "Desconocido", label: "Protegido", canSee: false, isPartner: false };
  };

  if (loadingPlan) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  if (!isAllowed) return <div className="h-full min-h-[300px]">{UpsellComponent}</div>;
  if (loadingData)
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  if (requests.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
          <Inbox className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-600 font-medium">Sin solicitudes nuevas</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[300px] relative overflow-hidden rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="w-[35%]">Producto</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const contact = getContactInfo(req);
            const isNew = new Date(req.creado_el) > new Date(Date.now() - 86400000 * 2);
            const waNumber = formatPhoneForWA(contact?.phone);

            // Mensaje predefinido para WhatsApp
            const waMessage = contact?.isPartner
              ? `Hola ${contact.name}, vi en el sistema que tienes un cliente buscando "${req.producto_nombre}" (${req.cantidad} pzas). ¿Te ayudo a cerrar esa venta?`
              : `Hola ${contact?.name}, vi que buscas "${req.producto_nombre}". Tengo disponibilidad para entrega inmediata.`;

            return (
              <TableRow key={req.id} className="hover:bg-indigo-50/30">
                <TableCell className="font-medium text-slate-900 align-top py-3">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      {req.producto_nombre}
                      {isNew && (
                        <Badge className="h-5 px-1 bg-emerald-100 text-emerald-700 border-0 text-[10px]">Nuevo</Badge>
                      )}
                    </span>
                    {req.producto_descripcion && (
                      <span className="text-xs text-slate-400 font-normal line-clamp-1">
                        {req.producto_descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-slate-600 align-top pt-4">
                  <span className="font-semibold bg-slate-100 px-2 py-1 rounded text-xs">{req.cantidad} pzas</span>
                </TableCell>

                <TableCell className="align-top pt-3">
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${contact?.isPartner ? "text-indigo-700" : "text-slate-700"}`}
                    >
                      {contact?.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {contact?.isPartner ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 bg-indigo-50 text-indigo-600 border-indigo-200"
                        >
                          Socio
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-slate-400">Cliente</span>
                      )}
                      <span className="text-xs text-slate-500 truncate max-w-[120px]">
                        {contact?.canSee ? (waNumber ? "Disponible" : contact.email) : "Oculto"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right align-top pt-3">
                  {contact?.canSee ? (
                    waNumber ? (
                      // 🟢 OPCIÓN A: BOTÓN WHATSAPP (PRIORIDAD)
                      <Button
                        size="sm"
                        className={`h-8 text-xs gap-1.5 ${
                          contact.isPartner
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        }`}
                        onClick={() =>
                          window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, "_blank")
                        }
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {contact.isPartner ? "Avisar WA" : "WhatsApp"}
                      </Button>
                    ) : (
                      // 🟡 OPCIÓN B: BOTÓN EMAIL (FALLBACK)
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-slate-300 text-slate-600 hover:bg-slate-50 gap-1.5"
                        onClick={() =>
                          window.open(`mailto:${contact.email}?subject=Oportunidad: ${req.producto_nombre}`)
                        }
                      >
                        <Mail className="w-3.5 h-3.5" /> Correo
                      </Button>
                    )
                  ) : (
                    <Button size="sm" variant="ghost" disabled className="h-8 text-xs text-slate-300">
                      <Lock className="w-3 h-3 mr-1" /> Privado
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
