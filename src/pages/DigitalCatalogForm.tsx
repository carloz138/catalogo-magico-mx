import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { DigitalCatalogService } from "@/services/digital-catalog.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductSelector } from "@/components/catalog/ProductSelector";
import { PriceAdjustmentInput } from "@/components/catalog/PriceAdjustmentInput";
import { CatalogFormPreview } from "@/components/catalog/CatalogFormPreview";
import { WebTemplateSelector } from "@/components/templates/WebTemplateSelector";
import { BackgroundPatternSelector } from "@/components/catalog/BackgroundPatternSelector";
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Lock,
  AlertCircle,
  Palette,
  Check,
  ChevronRight,
  Package,
  DollarSign,
  Eye,
  Settings,
  ExternalLink,
  AlertTriangle,
  Truck,
  Radar,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getUserPlanTier, getPlanFeatures, PlanTier } from "@/lib/web-catalog/plan-restrictions";

// --- SCHEMA ---
const catalogSchema = z
  .object({
    name: z.string().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
    additional_info: z.string().max(5000, "Máximo 5000 caracteres").optional(),
    expires_at: z.date().min(new Date(), "La fecha debe ser futura"),
    web_template_id: z.string().min(1, "Selecciona un template"),
    background_pattern: z.string().nullable().optional(),
    price_display: z.enum(["menudeo_only", "mayoreo_only", "both"]),
    price_adjustment_menudeo: z.number().min(-90, "Mínimo -90%").max(100, "Máximo 100%"),
    price_adjustment_mayoreo: z.number().min(-90, "Mínimo -90%").max(100, "Máximo 100%"),
    show_sku: z.boolean(),
    show_tags: z.boolean(),
    show_description: z.boolean(),
    show_stock: z.boolean(),
    is_private: z.boolean(),
    access_password: z.string().optional(),
    product_ids: z.array(z.string()).min(1, "Selecciona al menos 1 producto"),
    enable_quotation: z.boolean().optional(),
    enable_variants: z.boolean().optional(),
    enable_distribution: z.boolean().optional(),
    enable_free_shipping: z.boolean().optional(),
    free_shipping_min_amount: z.coerce.number().min(0).optional(),
    tracking_head_scripts: z.string().optional().nullable(),
    tracking_body_scripts: z.string().optional().nullable(),
    pixelId: z.string().optional(),
    accessToken: z.string().optional(),
    tracking_config: z
      .object({
        meta_capi: z
          .object({
            enabled: z.boolean().default(false),
            pixel_id: z.string().optional(),
            access_token: z.string().optional(),
            test_code: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine((data) => !(data.is_private && !data.access_password), {
    message: "La contraseña es requerida para catálogos privados",
    path: ["access_password"],
  });

type CatalogFormData = z.infer<typeof catalogSchema>;

// --- COMPONENTES DE SECCIÓN (DEFINIDOS FUERA PARA ESTABILIDAD) ---

const SectionProducts = ({
  form,
  setSelectedProducts,
}: {
  form: UseFormReturn<CatalogFormData>;
  setSelectedProducts: (p: any[]) => void;
}) => (
  <FormField
    control={form.control}
    name="product_ids"
    render={({ field }) => (
      <FormItem>
        <ProductSelector
          selectedIds={field.value}
          onChange={(ids, products) => {
            field.onChange(ids);
            setSelectedProducts(products);
          }}
        />
        <FormMessage />
      </FormItem>
    )}
  />
);

const SectionDesign = ({
  form,
  userPlanId,
  userPlanName,
  productCount,
}: {
  form: UseFormReturn<CatalogFormData>;
  userPlanId?: string;
  userPlanName?: string;
  productCount: number;
}) => (
  <div className="space-y-6">
    <FormField
      control={form.control}
      name="web_template_id"
      render={({ field }) => (
        <FormItem>
          <WebTemplateSelector
            selectedTemplate={field.value}
            onTemplateSelect={field.onChange}
            userPlanId={userPlanId}
            userPlanName={userPlanName}
            productCount={productCount}
          />
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="background_pattern"
      render={({ field }) => (
        <FormItem>
          <BackgroundPatternSelector
            selectedPattern={field.value}
            onPatternChange={field.onChange}
            webTemplateId={form.watch("web_template_id")}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const SectionInfo = ({ form, isMobile }: { form: UseFormReturn<CatalogFormData>; isMobile: boolean }) => (
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre del catálogo *</FormLabel>
          <FormControl>
            <Input placeholder="Ej: Catálogo Primavera 2025" className="h-12 text-base" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Descripción (opcional)</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe tu catálogo..."
              className="min-h-[120px] resize-none text-base"
              {...field}
            />
          </FormControl>
          <FormDescription>{field.value?.length || 0}/500 caracteres</FormDescription>
        </FormItem>
      )}
    />
    {!isMobile && (
      <FormField
        control={form.control}
        name="additional_info"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Información Adicional (opcional)</FormLabel>
            <FormControl>
              <Textarea placeholder="Términos y condiciones..." className="resize-none min-h-[120px]" {...field} />
            </FormControl>
            <FormDescription>{field.value?.length || 0}/5000 caracteres</FormDescription>
          </FormItem>
        )}
      />
    )}
  </div>
);

const SectionPricing = ({
  form,
  productsWithoutWholesaleMin,
}: {
  form: UseFormReturn<CatalogFormData>;
  productsWithoutWholesaleMin: any[];
}) => {
  const priceDisplay = useWatch({ control: form.control, name: "price_display" });
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="price_display"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Tipo de precios a mostrar</FormLabel>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
              {[
                { val: "menudeo_only", label: "Solo precio menudeo" },
                { val: "mayoreo_only", label: "Solo precio mayoreo" },
                { val: "both", label: "Ambos precios" },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]",
                    field.value === opt.val && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem value={opt.val} className="h-5 w-5" />
                  <div className="flex-1 font-medium">{opt.label}</div>
                </label>
              ))}
            </RadioGroup>
          </FormItem>
        )}
      />
      {productsWithoutWholesaleMin.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{productsWithoutWholesaleMin.length} producto(s) con precio mayoreo sin cantidad mínima.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => window.open("https://catifypro.com/products-management", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Ir a Gestión
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {(priceDisplay === "menudeo_only" || priceDisplay === "both") && (
        <FormField
          control={form.control}
          name="price_adjustment_menudeo"
          render={({ field }) => (
            <FormItem>
              <PriceAdjustmentInput
                label="Ajuste de precio menudeo"
                value={field.value}
                onChange={field.onChange}
                basePrice={100}
              />
            </FormItem>
          )}
        />
      )}
      {(priceDisplay === "mayoreo_only" || priceDisplay === "both") && (
        <FormField
          control={form.control}
          name="price_adjustment_mayoreo"
          render={({ field }) => (
            <FormItem>
              <PriceAdjustmentInput
                label="Ajuste de precio mayoreo"
                value={field.value}
                onChange={field.onChange}
                basePrice={100}
              />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

const SectionShipping = ({ form }: { form: UseFormReturn<CatalogFormData> }) => {
  const enabled = useWatch({ control: form.control, name: "enable_free_shipping" });
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="enable_free_shipping"
        render={({ field }) => (
          <div
            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => field.onChange(!field.value)}
          >
            <div className="flex-1">
              <div className="font-medium text-base">Habilitar Envío Gratis</div>
              <div className="text-sm text-muted-foreground">Ofrece envío gratis sobre un monto mínimo</div>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} className="pointer-events-none" />
          </div>
        )}
      />
      {enabled && (
        <FormField
          control={form.control}
          name="free_shipping_min_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto mínimo ($MXN)</FormLabel>
              <FormControl>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    className="h-12 text-base pl-10"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

const SectionVisibility = ({ form }: { form: UseFormReturn<CatalogFormData> }) => (
  <div className="space-y-3">
    {[
      { name: "show_sku", label: "Mostrar SKU", desc: "Código de producto visible" },
      { name: "show_tags", label: "Mostrar Tags", desc: "Etiquetas del producto" },
      { name: "show_description", label: "Mostrar Descripción", desc: "Descripción completa" },
      { name: "show_stock", label: "Mostrar Stock", desc: "Cantidad disponible" },
    ].map((item) => (
      <FormField
        key={item.name}
        control={form.control}
        name={item.name as any}
        render={({ field }) => (
          <div
            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => field.onChange(!field.value)}
          >
            <div className="flex-1">
              <div className="font-medium text-base">{item.label}</div>
              <div className="text-sm text-muted-foreground">{item.desc}</div>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} className="pointer-events-none" />
          </div>
        )}
      />
    ))}
  </div>
);

const SectionAdvanced = ({
  form,
  canCreatePrivate,
  navigate,
}: {
  form: UseFormReturn<CatalogFormData>;
  canCreatePrivate: boolean;
  navigate: any;
}) => {
  const isPrivate = useWatch({ control: form.control, name: "is_private" });
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="expires_at"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Fecha de expiración *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal text-base",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Selecciona una fecha</span>}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
      {!canCreatePrivate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Catálogos privados requieren Plan Medio o Premium.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/checkout")}>
              Ver planes
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <FormField
        control={form.control}
        name="is_private"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de catálogo</FormLabel>
            <RadioGroup
              onValueChange={(value) => field.onChange(value === "private")}
              value={field.value ? "private" : "public"}
              className="flex flex-col space-y-2"
              disabled={!canCreatePrivate}
            >
              <label
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer",
                  !field.value && "border-primary bg-primary/5",
                )}
              >
                <RadioGroupItem value="public" className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Público</div>
                  <div className="text-sm text-muted-foreground">Cualquiera con el link puede verlo</div>
                </div>
              </label>
              <label
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2",
                  field.value && "border-primary bg-primary/5",
                  !canCreatePrivate && "opacity-50",
                )}
              >
                <RadioGroupItem value="private" className="h-5 w-5" disabled={!canCreatePrivate} />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    Privado {!canCreatePrivate && <Badge variant="secondary">Pro</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">Solo con contraseña</div>
                </div>
              </label>
            </RadioGroup>
          </FormItem>
        )}
      />
      {isPrivate && canCreatePrivate && (
        <FormField
          control={form.control}
          name="access_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña de acceso *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Ingresa una contraseña" className="h-12 text-base" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

const SectionQuotation = ({
  form,
  hasQuotation,
  navigate,
}: {
  form: UseFormReturn<CatalogFormData>;
  hasQuotation: boolean;
  navigate: any;
}) => {
  const enabled = useWatch({ control: form.control, name: "enable_quotation" });
  if (!hasQuotation)
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Disponible en Plan Profesional y Empresarial.{" "}
          <Button variant="link" onClick={() => navigate("/checkout")}>
            Actualizar
          </Button>
        </AlertDescription>
      </Alert>
    );

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="enable_quotation"
        render={({ field }) => (
          <div
            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => field.onChange(!field.value)}
          >
            <div className="flex-1">
              <div className="font-medium text-base">Habilitar cotizaciones</div>
              <div className="text-sm text-muted-foreground">Los clientes podrán solicitar cotización</div>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} className="pointer-events-none" />
          </div>
        )}
      />
      {enabled && (
        <>
          <FormField
            control={form.control}
            name="enable_variants"
            render={({ field }) => (
              <div
                className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => field.onChange(!field.value)}
              >
                <div className="flex-1">
                  <div className="font-medium text-base">Permitir variantes</div>
                  <div className="text-sm text-muted-foreground">Elegir talla/color al cotizar</div>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} className="pointer-events-none" />
              </div>
            )}
          />
          <FormField
            control={form.control}
            name="enable_distribution"
            render={({ field }) => (
              <div
                className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all bg-indigo-50 border-indigo-200"
                onClick={() => field.onChange(!field.value)}
              >
                <div className="flex-1">
                  <div className="font-medium text-base flex items-center gap-2">
                    Clientes pueden crear catálogos <Badge variant="secondary">Nuevo</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Viraliza tus productos permitiendo la reventa</div>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} className="pointer-events-none" />
              </div>
            )}
          />
        </>
      )}
    </div>
  );
};

const SectionTracking = ({
  form,
  canUseCAPI,
  navigate,
}: {
  form: UseFormReturn<CatalogFormData>;
  canUseCAPI: boolean;
  navigate: any;
}) => {
  const capiEnabled = useWatch({ control: form.control, name: "tracking_config.meta_capi.enabled" });
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "border rounded-lg p-4 space-y-4 transition-all",
          canUseCAPI ? "bg-blue-50/50 border-blue-100" : "bg-gray-50 opacity-75 relative",
        )}
      >
        {!canUseCAPI && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg text-center p-4">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-semibold text-gray-900">Tracking Server-Side (CAPI)</h4>
            <Button size="sm" variant="outline" onClick={() => navigate("/checkout")}>
              Actualizar a Profesional
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-base flex items-center gap-2">Meta (Facebook) CAPI</h4>
            <p className="text-sm text-muted-foreground">Conexión directa servidor-a-servidor.</p>
          </div>
          <FormField
            control={form.control}
            name="tracking_config.meta_capi.enabled"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canUseCAPI} />
            )}
          />
        </div>
        {capiEnabled && (
          <div className="grid gap-4 pl-1 border-l-2 border-blue-200 ml-1">
            <FormField
              control={form.control}
              name="tracking_config.meta_capi.pixel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Pixel ID</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tracking_config.meta_capi.access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Access Token</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="bg-white font-mono text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
      <div className="pt-4 border-t space-y-4">
        <FormField
          control={form.control}
          name="pixelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook Pixel ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accessToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Access Token (Opcional)</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function DigitalCatalogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { businessInfo } = useBusinessInfo();
  const { limits, loading: limitsLoading } = useCatalogLimits();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [catalogData, setCatalogData] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [userPlanTier, setUserPlanTier] = useState<PlanTier>("free");
  const [userPlanId, setUserPlanId] = useState<string | undefined>();
  const [userPlanName, setUserPlanName] = useState<string | undefined>();

  const isEditing = !!id;
  const canCreatePrivate = limits?.planName !== "Básico" && limits?.planName !== "Starter";
  const canUseCAPI = userPlanTier === "professional" || userPlanTier === "enterprise";

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: "",
      description: "",
      additional_info: "",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      web_template_id: "",
      background_pattern: null,
      price_display: "both",
      price_adjustment_menudeo: 0,
      price_adjustment_mayoreo: 0,
      show_sku: true,
      show_tags: true,
      show_description: true,
      show_stock: true,
      is_private: false,
      access_password: "",
      product_ids: [],
      enable_quotation: false,
      enable_variants: true,
      enable_distribution: false,
      enable_free_shipping: false,
      free_shipping_min_amount: 0,
      tracking_head_scripts: "",
      tracking_body_scripts: "",
      tracking_config: { meta_capi: { enabled: false, pixel_id: "", access_token: "", test_code: "" } },
    },
  });

  // Watchers globales mínimos para Preview
  const watchedValues = {
    name: useWatch({ control: form.control, name: "name" }) || "",
    description: useWatch({ control: form.control, name: "description" }) || "",
    web_template_id: useWatch({ control: form.control, name: "web_template_id" }) || "",
    background_pattern: useWatch({ control: form.control, name: "background_pattern" }),
    price_display: useWatch({ control: form.control, name: "price_display" }) || "both",
    price_adjustment_menudeo: useWatch({ control: form.control, name: "price_adjustment_menudeo" }) || 0,
    price_adjustment_mayoreo: useWatch({ control: form.control, name: "price_adjustment_mayoreo" }) || 0,
    show_sku: useWatch({ control: form.control, name: "show_sku" }) ?? true,
    show_tags: useWatch({ control: form.control, name: "show_tags" }) ?? true,
    show_description: useWatch({ control: form.control, name: "show_description" }) ?? true,
  };

  const productIds = form.watch("product_ids") || [];
  const webTemplateId = form.watch("web_template_id");

  useEffect(() => {
    if (user) loadUserPlan();
  }, [user]);
  useEffect(() => {
    if (!isEditing && userPlanTier) {
      const hasQuotation = getPlanFeatures(userPlanTier).hasQuotation;
      form.setValue("enable_quotation", hasQuotation);
      if (hasQuotation) form.setValue("enable_variants", true);
    }
  }, [userPlanTier, isEditing, form]);
  useEffect(() => {
    if (isEditing && user && id) loadCatalog();
  }, [isEditing, user, id]);

  const productsWithoutWholesaleMin = useMemo(() => {
    const priceDisplay = watchedValues.price_display;
    if (priceDisplay !== "mayoreo_only" && priceDisplay !== "both") return [];
    return selectedProducts.filter((product) => {
      const hasWholesalePrice = product.price_wholesale && product.price_wholesale > 0;
      const hasWholesaleMin = product.wholesale_min_qty && product.wholesale_min_qty > 0;
      return hasWholesalePrice && !hasWholesaleMin;
    });
  }, [selectedProducts, watchedValues.price_display]);

  const loadUserPlan = async () => {
    if (!user) return;
    try {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select(`status, package_id, credit_packages (id, name, package_type)`)
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();
      if (subscription?.credit_packages) {
        const pkg = subscription.credit_packages as any;
        setUserPlanId(pkg.id);
        setUserPlanName(pkg.name);
        setUserPlanTier(getUserPlanTier(pkg.id, pkg.name));
      } else {
        setUserPlanTier("free");
      }
    } catch (error) {
      console.error("Error loading user plan:", error);
      setUserPlanTier("free");
    }
  };

  const loadCatalog = async () => {
    if (!user || !id) return;
    setIsLoading(true);
    try {
      const catalog = await DigitalCatalogService.getCatalogById(id, user.id);
      setCatalogData(catalog);
      form.reset({
        ...catalog,
        description: catalog.description || "",
        additional_info: catalog.additional_info || "",
        expires_at: catalog.expires_at ? new Date(catalog.expires_at) : new Date(),
        web_template_id: catalog.web_template_id || "",
        background_pattern: catalog.background_pattern || null,
        price_adjustment_menudeo: Number(catalog.price_adjustment_menudeo),
        price_adjustment_mayoreo: Number(catalog.price_adjustment_mayoreo),
        product_ids: catalog.products?.map((p) => p.id) || [],
        access_password: "",
        enable_quotation: catalog.enable_quotation || false,
        enable_variants: catalog.enable_variants ?? true,
        enable_distribution: catalog.enable_distribution || false,
        show_stock: catalog.show_stock || false,
        enable_free_shipping: catalog.enable_free_shipping || false,
        free_shipping_min_amount: catalog.free_shipping_min_amount ? catalog.free_shipping_min_amount / 100 : 0,
        pixelId: (catalog.tracking_config as any)?.pixelId || "",
        accessToken: (catalog.tracking_config as any)?.accessToken || "",
        tracking_config: (catalog as any).tracking_config || { meta_capi: { enabled: false } },
      });
      setSelectedProducts(catalog.products || []);
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast({ title: "Error", description: "No se pudo cargar el catálogo", variant: "destructive" });
      navigate("/catalogs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CatalogFormData) => {
    if (!user) return;
    if (!isEditing && !limits?.canGenerate) {
      toast({
        title: "Límite alcanzado",
        description: limits?.message || "Has alcanzado el límite",
        variant: "destructive",
      });
      return;
    }
    if (data.is_private && !canCreatePrivate) {
      toast({
        title: "Plan requerido",
        description: "Los catálogos privados requieren Plan Medio o Premium",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const catalogDTO = {
        ...data,
        access_password: data.is_private ? data.access_password : undefined,
        expires_at: data.expires_at.toISOString(),
        enable_quotation: getPlanFeatures(userPlanTier).hasQuotation && data.enable_quotation,
        free_shipping_min_amount:
          data.enable_free_shipping && data.free_shipping_min_amount
            ? Math.round(data.free_shipping_min_amount * 100)
            : 0,
        tracking_config: {
          ...data.tracking_config,
          meta_capi: data.tracking_config?.meta_capi
            ? {
                ...data.tracking_config.meta_capi,
                pixel_id: data.tracking_config.meta_capi.pixel_id || undefined,
                access_token: data.tracking_config.meta_capi.access_token || undefined,
              }
            : undefined,
          pixelId: data.pixelId,
          accessToken: data.accessToken,
        },
      };
      if (isEditing && id) {
        await DigitalCatalogService.updateCatalog(id, user.id, catalogDTO as any);
        toast({ title: "Catálogo actualizado", description: "Los cambios se guardaron correctamente" });
      } else {
        await DigitalCatalogService.createCatalog(user.id, catalogDTO as any);
        toast({ title: "Catálogo publicado", description: "Tu catálogo está disponible para compartir" });
      }
      navigate("/catalogs");
    } catch (error: any) {
      console.error("Error saving catalog:", error);
      toast({ title: "Error", description: error.message || "No se pudo guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || limitsLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // DEFINICIÓN DE SECCIONES (Ahora usamos los componentes externos)
  // Nota: Pasamos el 'form' y props necesarios.

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          onClick={() => navigate("/catalogs")}
          className="mb-3 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {isMobile ? "Volver" : "Volver a catálogos"}
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{isEditing ? "Editar Catálogo" : "Crear Catálogo Digital"}</h1>
        {!isMobile && (
          <p className="text-muted-foreground mt-2">
            {isEditing ? "Actualiza la configuración" : "Configura y publica tu catálogo"}
          </p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={cn(isMobile && "pb-24")}>
          {isMobile ? (
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
                <TabsTrigger value="form">Configuración</TabsTrigger>
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              </TabsList>
              <TabsContent value="form">
                <Accordion type="single" collapsible className="space-y-3">
                  <AccordionItem value="products" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          {productIds.length > 0 ? <Check className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 text-left font-semibold">Productos</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionProducts form={form} setSelectedProducts={setSelectedProducts} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="design" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          {webTemplateId ? <Check className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 text-left font-semibold">Diseño</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionDesign
                        form={form}
                        userPlanId={userPlanId}
                        userPlanName={userPlanName}
                        productCount={selectedProducts.length}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="info" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          {form.watch("name") ? <Check className="h-5 w-5" /> : "3"}
                        </div>
                        <div className="flex-1 text-left font-semibold">Información</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionInfo form={form} isMobile={isMobile} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="pricing" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left font-semibold">Precios</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionPricing form={form} productsWithoutWholesaleMin={productsWithoutWholesaleMin} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="shipping" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left font-semibold">Envíos</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionShipping form={form} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="visibility" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Eye className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left font-semibold">Visibilidad</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionVisibility form={form} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="advanced" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left font-semibold">Avanzado</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionAdvanced form={form} canCreatePrivate={canCreatePrivate} navigate={navigate} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="quotation" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left font-semibold">Cotización</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionQuotation
                        form={form}
                        hasQuotation={getPlanFeatures(userPlanTier).hasQuotation}
                        navigate={navigate}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tracking" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Radar className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left font-semibold">Tracking</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <SectionTracking form={form} canUseCAPI={canUseCAPI} navigate={navigate} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              <TabsContent value="preview">
                <CatalogFormPreview
                  name={watchedValues.name}
                  description={watchedValues.description}
                  webTemplateId={watchedValues.web_template_id}
                  products={selectedProducts || []}
                  priceConfig={{
                    display: watchedValues.price_display,
                    adjustmentMenudeo: watchedValues.price_adjustment_menudeo,
                    adjustmentMayoreo: watchedValues.price_adjustment_mayoreo,
                  }}
                  visibilityConfig={{
                    showSku: watchedValues.show_sku,
                    showTags: watchedValues.show_tags,
                    showDescription: watchedValues.show_description,
                  }}
                  backgroundPattern={watchedValues.background_pattern}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      1. Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionProducts form={form} setSelectedProducts={setSelectedProducts} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      2. Diseño
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionDesign
                      form={form}
                      userPlanId={userPlanId}
                      userPlanName={userPlanName}
                      productCount={selectedProducts.length}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">3. Información</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionInfo form={form} isMobile={false} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      4. Precios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionPricing form={form} productsWithoutWholesaleMin={productsWithoutWholesaleMin} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      5. Envíos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionShipping form={form} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      6. Visibilidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionVisibility form={form} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      7. Avanzado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionAdvanced form={form} canCreatePrivate={canCreatePrivate} navigate={navigate} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5" />
                      8. Cotización
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionQuotation
                      form={form}
                      hasQuotation={getPlanFeatures(userPlanTier).hasQuotation}
                      navigate={navigate}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Radar className="h-5 w-5" />
                      9. Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionTracking form={form} canUseCAPI={canUseCAPI} navigate={navigate} />
                  </CardContent>
                </Card>
                <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t z-10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/catalogs")}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isEditing ? "Guardar" : "Publicar"}
                  </Button>
                </div>
              </div>
              <div className="lg:sticky lg:top-8 lg:self-start">
                <CatalogFormPreview
                  name={watchedValues.name}
                  description={watchedValues.description}
                  webTemplateId={watchedValues.web_template_id}
                  products={selectedProducts || []}
                  priceConfig={{
                    display: watchedValues.price_display,
                    adjustmentMenudeo: watchedValues.price_adjustment_menudeo,
                    adjustmentMayoreo: watchedValues.price_adjustment_mayoreo,
                  }}
                  visibilityConfig={{
                    showSku: watchedValues.show_sku,
                    showTags: watchedValues.show_tags,
                    showDescription: watchedValues.show_description,
                  }}
                  backgroundPattern={watchedValues.background_pattern}
                />
              </div>
            </div>
          )}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/catalogs")}
                  disabled={isSaving}
                  className="flex-1 h-12"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="flex-1 h-12">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isEditing ? "Guardar" : "Publicar"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
