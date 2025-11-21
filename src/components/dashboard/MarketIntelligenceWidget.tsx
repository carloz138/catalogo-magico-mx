import React from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface MarketIntelligenceProps {
  catalogId: string;
}

export const MarketIntelligenceWidget = ({ catalogId }: MarketIntelligenceProps) => {
  // 1. PREGUNTAMOS AL GUARDIA DE SEGURIDAD
  const { isAllowed, loading, UpsellComponent } = useFeatureAccess("radar_inteligente");

  // 2. ESTADO DE CARGA
  if (loading) {
    return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />;
  }

  // 3. SI NO PAGA, LE VENDEMOS (GATING)
  if (!isAllowed) {
    return (
      <div className="h-full min-h-[300px]">
        {UpsellComponent}
      </div>
    );
  }

  // 4. SI PAGA, LE MOSTRAMOS LA DATA (Aquí conectaremos Supabase después)
  return (
    <div className="bg-white min-h-[300px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Producto Solicitado</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* DATOS DUMMY PARA VALIDAR UI */}
          <TableRow className="group hover:bg-indigo-50/30 transition-colors cursor-pointer">
            <TableCell className="font-medium text-slate-900">
              Tubería PVC 4" Hidráulica
              <Badge variant="secondary" className="ml-2 text-[10px] bg-amber-100 text-amber-800">
                Alta Demanda
              </Badge>
            </TableCell>
            <TableCell>50 pzas</TableCell>
            <TableCell className="text-slate-500">obras_monterrey@gmail.com</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-indigo-600">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
          
          <TableRow className="group hover:bg-indigo-50/30 transition-colors cursor-pointer">
            <TableCell className="font-medium text-slate-900">
              Cemento Gris Tolteca
            </TableCell>
            <TableCell>2 Toneladas</TableCell>
            <TableCell className="text-slate-500">arq.perez@hotmail.com</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-indigo-600">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div className="p-4 text-center border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          Mostrando las últimas solicitudes no encontradas en tu catálogo.
        </p>
      </div>
    </div>
  );
};
