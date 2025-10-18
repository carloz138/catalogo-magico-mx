import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // Asumo que tienes un hook de autenticación
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validación del formulario
const formSchema = z.object({
  producto_nombre: z.string().min(3, "El nombre del producto es requerido"),
  producto_marca: z.string().optional(),
  producto_descripcion: z.string().optional(),
  cantidad: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
  cliente_final_nombre: z.string().min(3, "Tu nombre es requerido"),
  cliente_final_email: z.string().email("Ingresa un email válido"),
});

type FormData = z.infer<typeof formSchema>;

interface MarketRadarFormProps {
  fabricanteId: string; // El ID del L1 (dueño del catálogo principal)
  revendedorId?: string; // El ID del L2 (dueño del catálogo replicado)
  catalogoId: string; // El ID del catálogo donde se hace la solicitud
}

export function MarketRadarForm({ fabricanteId, revendedorId, catalogoId }: MarketRadarFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cantidad: 1,
    }
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: insertError } = await supabase
        .from("solicitudes_mercado" as any)
        .insert({
          fabricante_id: fabricanteId,
          revendedor_id: revendedorId || null,
          catalogo_id: catalogoId,
          cliente_final_nombre: data.cliente_final_nombre,
          cliente_final_email: data.cliente_final_email,
          producto_nombre: data.producto_nombre,
          producto_marca: data.producto_marca || null,
          producto_descripcion: data.producto_descripcion || null,
          cantidad: data.cantidad,
        } as any);

      if (insertError) throw insertError;

      setSuccess(true);
      reset();
    } catch (err: any) {
      console.error("Error submitting request:", err);
      setError("No pudimos enviar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ¡Solicitud recibida! Te contactaremos si podemos conseguir este producto para ti.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>¿No encuentras lo que buscas?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Dinos qué necesitas y haremos lo posible por conseguirlo.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_final_nombre">Tu Nombre</Label>
              <Input id="cliente_final_nombre" {...register("cliente_final_nombre")} />
              {errors.cliente_final_nombre && <p className="text-xs text-red-500">{errors.cliente_final_nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente_final_email">Tu Email</Label>
              <Input id="cliente_final_email" type="email" {...register("cliente_final_email")} />
              {errors.cliente_final_email && <p className="text-xs text-red-500">{errors.cliente_final_email.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="producto_nombre">Nombre del Producto</Label>
            <Input id="producto_nombre" {...register("producto_nombre")} />
            {errors.producto_nombre && <p className="text-xs text-red-500">{errors.producto_nombre.message}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="producto_marca">Marca (Opcional)</Label>
              <Input id="producto_marca" {...register("producto_marca")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" {...register("cantidad")} />
              {errors.cantidad && <p className="text-xs text-red-500">{errors.cantidad.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="producto_descripcion">Descripción (Opcional)</Label>
            <Textarea id="producto_descripcion" placeholder="Ej. color, tamaño, modelo..." {...register("producto_descripcion")} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Solicitud
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
