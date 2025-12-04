import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Loader2,
  MapPin,
  Truck,
  ChevronDown,
  ChevronUp,
  Store,
  Building2,
  StickyNote,
} from "lucide-react";
import { QuoteService } from "@/services/quote.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Asegúrate de tener esta utilidad, si no, usa template strings

// Declaraciones de tipos para tracking
declare global {
  interface Window {
    dataLayer?: any[];
  }
}

const schema = z
  .object({
    name: z.string().min(2, "El nombre completo es requerido."),
    email: z.string().email("El email ingresado no es válido."),
    company: z.string().optional(),
    phone: z.string().optional(),
    delivery_method: z.enum(["pickup", "shipping"], {
      required_error: "Debes seleccionar un método de entrega.",
    }),
    shipping_address: z.string().optional(),
    notes: z.string().max(500, "Las notas no pueden exceder los 500 caracteres.").optional(),
  })
  .refine(
    (data) => {
      if (data.delivery_method === "shipping") {
        return !!data.shipping_address && data.shipping_address.length > 10;
      }
      return true;
    },
    {
      message: "La dirección de envío es requerida y debe tener al menos 10 caracteres.",
      path: ["shipping_address"],
    },
  );

type FormData = z.infer<typeof schema>;

export interface QuoteFormProps {
  catalogId: string;
  replicatedCatalogId?: string | undefined;
  items: any[];
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessAddress: string | null;
}

export function QuoteForm(props: QuoteFormProps) {
  const { catalogId, replicatedCatalogId, items, totalAmount, isOpen, onClose, onSuccess, businessAddress } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Estado para controlar la visibilidad de campos opcionales
  const [showExtras, setShowExtras] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      notes: "",
      delivery_method: "pickup", // UX: Default a Pickup si queremos priorizarlo, o shipping según tu negocio
      shipping_address: "",
    },
  });

  const deliveryMethod = form.watch("delivery_method");

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      console.log("📤 Enviando cotización con:", {
        catalog_id: catalogId,
        replicated_catalog_id: replicatedCatalogId,
        isReplicated: !!replicatedCatalogId,
      });

      await QuoteService.createQuote({
        catalog_id: catalogId,
        user_id: null,
        replicated_catalog_id: replicatedCatalogId,
        customer_name: data.name,
        customer_email: data.email,
        customer_company: data.company,
        customer_phone: data.phone,
        notes: data.notes,
        delivery_method: data.delivery_method,
        shipping_address: data.delivery_method === "shipping" ? data.shipping_address : null,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku || "",
          product_image_url: item.product.processed_image_url || item.product.original_image_url,
          quantity: item.quantity,
          price_type: item.priceType === "retail" ? "menudeo" : "mayoreo",
          unit_price: item.unitPrice,
          variant_id: item.variantId || null,
          variant_description: item.variantDescription || null,
        })),
      });

      setSubmitted(true);
      toast.success("Cotización enviada correctamente");

      try {
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "generate_quote",
            value: totalAmount / 100,
            currency: "MXN",
            items_count: items.length,
          });
        }
      } catch (e) {
        console.error("Error GTM:", e);
      }

      try {
        const fbq = (window as any).fbq;
        if (typeof fbq === "function") {
          fbq("track", "Lead", {
            content_name: "Cotizacion Generada",
            value: totalAmount / 100,
            currency: "MXN",
          });
        }
      } catch (e) {
        console.error("Error Pixel:", e);
      }

      setTimeout(() => {
        form.reset();
        setSubmitted(false);
        onSuccess();
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Error al crear cotización:", error);
      const errorMessage = error?.message || "No se pudo enviar la cotización";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md rounded-xl">
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">¡Pedido Recibido!</h2>
            <p className="text-muted-foreground mb-6">
              Gracias <strong>{form.getValues("name")}</strong>. Hemos recibido tu solicitud correctamente.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg w-full text-sm border border-gray-100">
              <p className="text-gray-500">Enviamos el comprobante a:</p>
              <p className="font-medium text-gray-900 mt-1">{form.getValues("email")}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg flex flex-col max-h-[90vh] p-0 rounded-xl overflow-hidden sm:w-full">
        {/* Header Compacto */}
        <DialogHeader className="p-5 border-b bg-white z-10">
          <DialogTitle className="text-lg md:text-xl flex items-center gap-2">🛒 Finalizar Cotización</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1 flex justify-between items-center">
            <span>{items.length} productos</span>
            <span className="font-bold text-primary">${(totalAmount / 100).toFixed(2)}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50">
          <Form {...form}>
            <form id="quote-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 1. SELECCIÓN DE MÉTODO (Tile Design para Mobile) */}
              <div className="space-y-3">
                <FormLabel className="text-base font-semibold text-gray-900">¿Cómo deseas recibir tu pedido?</FormLabel>
                <FormField
                  control={form.control}
                  name="delivery_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          {/* Opción Pickup */}
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="pickup" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50/50 cursor-pointer transition-all h-full text-center">
                              <Store className="mb-2 h-6 w-6 text-gray-500 peer-data-[state=checked]:text-primary" />
                              <span className="font-semibold text-sm">Recoger en Tienda</span>
                            </FormLabel>
                          </FormItem>

                          {/* Opción Envío */}
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="shipping" className="peer sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50/50 cursor-pointer transition-all h-full text-center">
                              <Truck className="mb-2 h-6 w-6 text-gray-500 peer-data-[state=checked]:text-primary" />
                              <span className="font-semibold text-sm">Envío a Domicilio</span>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Alerta de Dirección de Recolección (Solo si es Pickup) */}
              {deliveryMethod === "pickup" && businessAddress && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium">Ubicación de la tienda:</p>
                    <p className="text-blue-700 mt-0.5">{businessAddress}</p>
                  </div>
                </div>
              )}

              {/* 2. DATOS DE CONTACTO (Agrupados) */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Tus Datos</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs font-medium text-gray-500 uppercase">Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Juan Pérez" {...field} className="bg-gray-50 border-gray-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-500 uppercase">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="nombre@correo.com"
                            {...field}
                            className="bg-gray-50 border-gray-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-500 uppercase">
                          Teléfono (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="10 dígitos"
                            {...field}
                            className="bg-gray-50 border-gray-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 3. DIRECCIÓN DE ENVÍO (Solo si es Shipping) */}
              {deliveryMethod === "shipping" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <FormField
                    control={form.control}
                    name="shipping_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">¿A dónde enviamos?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Calle, número, colonia, código postal, ciudad..."
                            {...field}
                            rows={3}
                            className="resize-none bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* 4. EXTRAS (Colapsables para reducir ruido visual) */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowExtras(!showExtras)}
                  className="w-full justify-between text-muted-foreground hover:text-foreground h-auto py-2 px-1"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {showExtras ? "Ocultar detalles opcionales" : "Agregar notas o datos de empresa"}
                  </span>
                  {showExtras ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {showExtras && (
                  <div className="space-y-4 mt-3 pl-2 border-l-2 border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase">
                            <Building2 className="h-3 w-3" /> Empresa / Facturación
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre de la empresa (Opcional)"
                              {...field}
                              className="bg-white h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase">
                            <StickyNote className="h-3 w-3" /> Notas Adicionales
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="Instrucciones especiales..."
                              className="bg-white min-h-[60px] text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>

        {/* Footer Fijo en Mobile */}
        <DialogFooter className="p-4 border-t bg-white">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-gray-200"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="quote-form"
              disabled={isSubmitting}
              className="flex-[2] h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20"
            >
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {deliveryMethod === "pickup" ? "Confirmar Recolección" : "Solicitar Envío"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
