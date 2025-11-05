import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle, Clock, XCircle, Rocket, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function TrackQuotePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [replicating, setReplicating] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

const loadQuote = async () => {
  try {
    // 1. Obtener cotización
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (*),
        digital_catalogs (name, slug)
      `)
      .eq('tracking_token', token)
      .single();

    if (error) throw error;

    // 2. Verificar si tiene catálogo replicado
    const { data: replicaData } = await supabase
      .from('replicated_catalogs')
      .select('id, is_active')
      .eq('quote_id', data.id)
      .maybeSingle();

    // 3. Combinar datos
    setQuote({
      ...data,
      replicated_catalogs: replicaData
    });
  } catch (error) {
    console.error('Error loading quote:', error);
    toast({
      title: 'Error',
      description: 'No se pudo cargar la cotización',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

const handleReplicate = async () => {
  if (!user) {
    setShowAuthModal(true);
    return;
  }

  setReplicating(true);
  try {
    // Crear catálogo replicado
    const { data: replicatedCatalog, error } = await supabase
      .from('replicated_catalogs')
      .insert({
        original_catalog_id: quote.catalog_id,
        quote_id: quote.id,
        distributor_id: user.id,
        is_active: true,
        activated_at: new Date().toISOString(),
        activation_token: crypto.randomUUID()
      })
      .select()
      .single();

    if (error) throw error;

    toast({
      title: '🎉 ¡Catálogo creado!',
      description: 'Ya puedes empezar a vender',
    });

    setTimeout(() => {
      navigate('/catalogs');
    }, 1500);
  } catch (error: any) {
    console.error('Error replicating:', error);
    toast({
      title: 'Error',
      description: error.message || 'No se pudo crear el catálogo',
      variant: 'destructive',
    });
  } finally {
    setReplicating(false);
  }
};

  if (loading) {
    return (
      <div className="container mx-auto py-20 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto py-20 text-center min-h-screen flex flex-col items-center justify-center">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Cotización no encontrada</h1>
        <p className="text-muted-foreground">Verifica el link que recibiste por email</p>
      </div>
    );
  }

  const total = quote.quote_items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const canReplicate = quote.status === 'accepted' && !quote.replicated_catalogs;
  const alreadyReplicated = !!quote.replicated_catalogs;

  const statusConfig = {
    pending: { 
      icon: Clock, 
      label: 'Pendiente', 
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
      description: 'Tu cotización está siendo revisada por el proveedor' 
    },
    accepted: { 
      icon: CheckCircle, 
      label: 'Aceptada', 
      color: 'bg-green-50 text-green-700 border-green-200', 
      description: '¡Excelentes noticias! Tu cotización fue aceptada' 
    },
    rejected: { 
      icon: XCircle, 
      label: 'Rechazada', 
      color: 'bg-red-50 text-red-700 border-red-200', 
      description: 'Tu cotización fue rechazada. Contacta al proveedor para más información' 
    },
  };

  const status = statusConfig[quote.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            CatifyPro
          </h1>
          <p className="text-muted-foreground text-sm">Seguimiento de cotización</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">
                  Cotización #{quote.id.slice(0, 8)}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  📦 Catálogo: {quote.digital_catalogs.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  📅 Enviada: {format(new Date(quote.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <Badge className={`${status.color} border h-fit`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {status.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Estado actual */}
            <Alert className={status.color}>
              <StatusIcon className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <strong>{status.description}</strong>
              </AlertDescription>
            </Alert>

            {/* Información del cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm text-gray-700">Tus datos</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Nombre:</span> <strong>{quote.customer_name}</strong></p>
                <p><span className="text-muted-foreground">Email:</span> <strong>{quote.customer_email}</strong></p>
                {quote.customer_company && (
                  <p><span className="text-muted-foreground">Empresa:</span> <strong>{quote.customer_company}</strong></p>
                )}
                {quote.customer_phone && (
                  <p><span className="text-muted-foreground">Teléfono:</span> <strong>{quote.customer_phone}</strong></p>
                )}
              </div>
            </div>

            {/* Lista de productos */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Productos ({quote.quote_items.length})
              </h3>
              <div className="space-y-2">
                {quote.quote_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-muted-foreground text-xs">
                        Cantidad: {item.quantity} × ${(item.unit_price / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-purple-600">
                      ${(item.subtotal / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                <span>Total:</span>
                <span className="text-purple-600">
                  ${(total / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>

            {/* CTA de replicación */}
            {canReplicate && (
              <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200 shadow-md">
                <CardContent className="p-6 text-center">
                  <Rocket className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-bold mb-2">¿Quieres revender estos productos?</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Crea tu catálogo GRATIS y empieza a vender sin inventario
                  </p>
                  <div className="bg-white/50 p-4 rounded-lg mb-6">
                    <ul className="text-sm text-left space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Comparte tu catálogo personalizado en segundos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Recibe cotizaciones automáticas 24/7</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Ajusta precios y márgenes a tu conveniencia</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Panel de control completo para gestionar todo</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleReplicate}
                    disabled={replicating}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {replicating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creando tu catálogo...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Crear Mi Catálogo Gratis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Mensaje de catálogo ya replicado */}
            {alreadyReplicated && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="ml-2">
                  <strong>¡Catálogo creado exitosamente!</strong>
                  <br />
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-green-700 hover:text-green-800"
                    onClick={() => navigate('/catalogs')}
                  >
                    Ver mis catálogos →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Mensaje para estado pendiente */}
            {quote.status === 'pending' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="ml-2 text-sm">
                  Te enviaremos un email cuando tu cotización sea revisada. 
                  Puedes guardar este link para consultarla en cualquier momento.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Auth */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea tu cuenta para continuar</DialogTitle>
            <DialogDescription>
              Necesitas una cuenta gratuita para crear tu catálogo y empezar a vender.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600" 
              onClick={() => navigate('/login?redirect=/track/' + token)}
            >
              Crear cuenta / Iniciar sesión
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Es gratis y toma menos de 1 minuto
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
