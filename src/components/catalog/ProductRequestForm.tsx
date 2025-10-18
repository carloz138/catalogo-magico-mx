import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductRequestFormProps {
  fabricanteId: string;
  catalogoId: string;
  revendedorId?: string | null;
  onSuccess?: () => void;
}

export function ProductRequestForm({ 
  fabricanteId, 
  catalogoId, 
  revendedorId,
  onSuccess 
}: ProductRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clienteName: "",
    clienteEmail: "",
    productoNombre: "",
    productoDescripcion: "",
    cantidad: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clienteName || !formData.clienteEmail || !formData.productoNombre) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("solicitudes_mercado")
        .insert({
          fabricante_id: fabricanteId,
          catalogo_id: catalogoId,
          revendedor_id: revendedorId || null,
          cliente_final_nombre: formData.clienteName,
          cliente_final_email: formData.clienteEmail,
          producto_nombre: formData.productoNombre,
          producto_descripcion: formData.productoDescripcion || null,
          cantidad: formData.cantidad,
          estatus_fabricante: "nuevo",
          estatus_revendedor: "nuevo",
        });

      if (error) throw error;

      toast.success("¡Solicitud enviada! Te contactaremos pronto.");
      
      // Limpiar formulario
      setFormData({
        clienteName: "",
        clienteEmail: "",
        productoNombre: "",
        productoDescripcion: "",
        cantidad: 1,
      });
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error al enviar solicitud:", error);
      toast.error("Error al enviar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clienteName">Tu nombre *</Label>
        <Input
          id="clienteName"
          value={formData.clienteName}
          onChange={(e) => setFormData({ ...formData, clienteName: e.target.value })}
          placeholder="Nombre completo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clienteEmail">Tu email *</Label>
        <Input
          id="clienteEmail"
          type="email"
          value={formData.clienteEmail}
          onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
          placeholder="correo@ejemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="productoNombre">Producto que buscas *</Label>
        <Input
          id="productoNombre"
          value={formData.productoNombre}
          onChange={(e) => setFormData({ ...formData, productoNombre: e.target.value })}
          placeholder="Ej: iPhone 15 Pro, Playera Nike, etc."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="productoDescripcion">Descripción (opcional)</Label>
        <Textarea
          id="productoDescripcion"
          value={formData.productoDescripcion}
          onChange={(e) => setFormData({ ...formData, productoDescripcion: e.target.value })}
          placeholder="Detalles adicionales: color, talla, características específicas..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cantidad">Cantidad</Label>
        <Input
          id="cantidad"
          type="number"
          min="1"
          value={formData.cantidad}
          onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar Solicitud"
        )}
      </Button>
    </form>
  );
}
