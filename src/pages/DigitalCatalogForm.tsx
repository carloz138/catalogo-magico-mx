import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useCatalogLimits } from '@/hooks/useCatalogLimits';
import { DigitalCatalogService } from '@/services/digital-catalog.service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductSelector } from '@/components/catalog/ProductSelector';
import { PriceAdjustmentInput } from '@/components/catalog/PriceAdjustmentInput';
import { CatalogFormPreview } from '@/components/catalog/CatalogFormPreview';
import { ArrowLeft, CalendarIcon, Loader2, Lock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const catalogSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  expires_at: z.date().min(new Date(), 'La fecha debe ser futura'),
  price_display: z.enum(['menudeo_only', 'mayoreo_only', 'both']),
  price_adjustment_menudeo: z.number().min(-90, 'Mínimo -90%').max(100, 'Máximo 100%'),
  price_adjustment_mayoreo: z.number().min(-90, 'Mínimo -90%').max(100, 'Máximo 100%'),
  show_sku: z.boolean(),
  show_tags: z.boolean(),
  show_description: z.boolean(),
  is_private: z.boolean(),
  access_password: z.string().optional(),
  product_ids: z.array(z.string()).min(1, 'Selecciona al menos 1 producto'),
}).refine(data => {
  if (data.is_private && !data.access_password) {
    return false;
  }
  return true;
}, {
  message: 'La contraseña es requerida para catálogos privados',
  path: ['access_password'],
});

type CatalogFormData = z.infer<typeof catalogSchema>;

export default function DigitalCatalogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { limits, loading: limitsLoading } = useCatalogLimits();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogData, setCatalogData] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  
  const isEditing = !!id;
  const canCreatePrivate = limits?.planName !== 'Básico' && limits?.planName !== 'Starter';

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: '',
      description: '',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      price_display: 'both',
      price_adjustment_menudeo: 0,
      price_adjustment_mayoreo: 0,
      show_sku: true,
      show_tags: true,
      show_description: true,
      is_private: false,
      access_password: '',
      product_ids: [],
    },
  });

  const watchedValues = form.watch();

  // Cargar catálogo si es edición
  useEffect(() => {
    if (isEditing && user && id) {
      loadCatalog();
    }
  }, [isEditing, user, id]);

  const loadCatalog = async () => {
    if (!user || !id) return;
    
    setIsLoading(true);
    try {
      const catalog = await DigitalCatalogService.getCatalogById(id, user.id);
      setCatalogData(catalog);
      
      // Pre-llenar formulario
      form.reset({
        name: catalog.name,
        description: catalog.description || '',
        expires_at: catalog.expires_at ? new Date(catalog.expires_at) : new Date(),
        price_display: catalog.price_display,
        price_adjustment_menudeo: Number(catalog.price_adjustment_menudeo),
        price_adjustment_mayoreo: Number(catalog.price_adjustment_mayoreo),
        show_sku: catalog.show_sku,
        show_tags: catalog.show_tags,
        show_description: catalog.show_description,
        is_private: catalog.is_private,
        access_password: '',
        product_ids: catalog.products?.map(p => p.id) || [],
      });
      
      setSelectedProducts(catalog.products || []);
    } catch (error) {
      console.error('Error loading catalog:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el catálogo',
        variant: 'destructive',
      });
      navigate('/catalogs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CatalogFormData) => {
    if (!user) return;

    // Validar límite si es creación
    if (!isEditing) {
      if (!limits?.canGenerate) {
        toast({
          title: 'Límite alcanzado',
          description: limits?.message || 'Has alcanzado el límite de catálogos',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validar catálogo privado
    if (data.is_private && !canCreatePrivate) {
      toast({
        title: 'Plan requerido',
        description: 'Los catálogos privados requieren Plan Medio o Premium',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const catalogDTO = {
        name: data.name,
        description: data.description,
        price_display: data.price_display,
        price_adjustment_menudeo: data.price_adjustment_menudeo,
        price_adjustment_mayoreo: data.price_adjustment_mayoreo,
        show_sku: data.show_sku,
        show_tags: data.show_tags,
        show_description: data.show_description,
        is_private: data.is_private,
        access_password: data.is_private ? data.access_password : undefined,
        expires_at: data.expires_at.toISOString(),
        product_ids: data.product_ids,
      };

      if (isEditing && id) {
        await DigitalCatalogService.updateCatalog(id, user.id, catalogDTO);
        toast({
          title: 'Catálogo actualizado',
          description: 'Los cambios se guardaron correctamente',
        });
      } else {
        await DigitalCatalogService.createCatalog(user.id, catalogDTO);
        toast({
          title: 'Catálogo publicado',
          description: 'Tu catálogo está disponible para compartir',
        });
      }

      navigate('/catalogs');
    } catch (error: any) {
      console.error('Error saving catalog:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el catálogo',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || limitsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/catalogs')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a catálogos
        </Button>
        
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Catálogo' : 'Crear Catálogo Digital'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? 'Actualiza la configuración de tu catálogo'
            : 'Configura y publica tu catálogo de productos'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda: Formulario */}
            <div className="space-y-6">
              {/* 1. Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Nombre y descripción de tu catálogo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del catálogo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Catálogo Primavera 2025" {...field} />
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
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Después de esta fecha el catálogo no será accesible
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2. Configuración de Precios */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Precios</CardTitle>
                  <CardDescription>
                    Define qué precios mostrar y ajustes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price_display"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de precios a mostrar</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="menudeo_only" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Solo precio menudeo
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="mayoreo_only" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Solo precio mayoreo
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="both" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Ambos precios
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(watchedValues.price_display === 'menudeo_only' || watchedValues.price_display === 'both') && (
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(watchedValues.price_display === 'mayoreo_only' || watchedValues.price_display === 'both') && (
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* 3. Configuración de Visibilidad */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Visibilidad</CardTitle>
                  <CardDescription>
                    Qué información mostrar en cada producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="show_sku"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mostrar SKU</FormLabel>
                          <FormDescription>
                            Código de producto visible
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_tags"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mostrar Tags</FormLabel>
                          <FormDescription>
                            Etiquetas del producto
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_description"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mostrar Descripción</FormLabel>
                          <FormDescription>
                            Descripción completa del producto
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 4. Privacidad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Privacidad
                  </CardTitle>
                  <CardDescription>
                    Control de acceso al catálogo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!canCreatePrivate && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Los catálogos privados requieren Plan Medio o Premium.{' '}
                        <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/checkout')}>
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
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === 'private')}
                            value={field.value ? 'private' : 'public'}
                            className="flex flex-col space-y-1"
                            disabled={!canCreatePrivate}
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="public" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Público - Cualquiera con el link puede verlo
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="private" disabled={!canCreatePrivate} />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2">
                                Privado - Requiere contraseña
                                {!canCreatePrivate && (
                                  <Badge variant="secondary">Plan Medio/Premium</Badge>
                                )}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedValues.is_private && canCreatePrivate && (
                    <FormField
                      control={form.control}
                      name="access_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña de acceso *</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Ingresa una contraseña"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Los clientes necesitarán esta contraseña para ver el catálogo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* 5. Selección de Productos */}
              <Card>
                <CardHeader>
                  <CardTitle>Selección de Productos</CardTitle>
                  <CardDescription>
                    Elige los productos que aparecerán en el catálogo
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Botones de Acción */}
              <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/catalogs')}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Guardar Cambios' : 'Publicar Catálogo'}
                </Button>
              </div>
            </div>

            {/* Columna Derecha: Preview */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <CatalogFormPreview
                name={watchedValues.name}
                description={watchedValues.description}
                products={selectedProducts}
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
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
