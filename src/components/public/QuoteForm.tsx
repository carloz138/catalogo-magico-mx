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
import { CheckCircle, Loader2, MapPin, Truck } from "lucide-react";
import { QuoteService } from "@/services/quote.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Declaraciones de tipos para tracking
declare global {
  interface Window {
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
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

// ✅ INTERFACE EXPLÍCITA Y EXPORTADA
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
  // Destructuring dentro del componente
  const { catalogId, replicatedCatalogId, items, totalAmount, isOpen, onClose, onSuccess, businessAddress } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      notes: "",
      delivery_method: "shipping",
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

      await (QuoteService.createQuote as any)({
        catalog_id: catalogId,
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

      console.log("Disparando eventos de conversión...");

      try {
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "generate_quote",
            value: totalAmount / 100,
            currency: "MXN",
            items_count: items.length,
          });
          console.log("Evento 'generate_quote' enviado a dataLayer (GTM).");
        }
      } catch (e) {
        console.error("Error al disparar evento GTM:", e);
      }

      try {
        if (typeof window.fbq === "function") {
          window.fbq("track", "Lead", {
            content_name: "Cotizacion Generada",
            value: totalAmount / 100,
            currency: "MXN",
          });
          console.log("Evento 'Lead' enviado a Meta Pixel (fbq).");
        }
      } catch (e) {
        console.error("Error al disparar evento Meta Pixel:", e);
      }

      setTimeout(() => {
        form.reset();
        setSubmitted(false);
        onSuccess();
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("No se pudo enviar la cotización");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">¡Cotización enviada!</h2>
            <p className="text-center text-muted-foreground mb-4">
              Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Enviamos una copia a: <strong>{form.getValues("email")}</strong>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Solicitar Cotización</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          <div className="bg-muted p-3 rounded">
            <p className="text-sm">
              <strong>{items.length}</strong> producto(s) en tu cotización
            </p>
            <p className="text-lg font-bold">Subtotal: ${(totalAmount / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">(El costo de envío se agregará después por el vendedor)</p>
          </div>

          <Form {...form}>
            <form id="quote-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <FormField
                control={form.control}
                name="delivery_method"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Método de Entrega *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="shipping" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Envío a Domicilio
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pickup" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Recoger en Tienda
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deliveryMethod === "pickup" && businessAddress && (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Puedes recoger tu pedido en: <br />
                    <strong>{businessAddress}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {deliveryMethod === "shipping" && (
                <FormField
                  control={form.control}
                  name="shipping_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección de Envío *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Calle, número, colonia, ciudad, estado, C.P. y referencias"
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Separator className="my-6" />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas adicionales</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <div className="flex gap-2 w-full">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form="quote-form" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Cotización
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
