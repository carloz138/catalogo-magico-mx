import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Crown, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  credit_packages: {
    name: string;
    credits: number;
    price_mxn: number;
  };
}

interface SubscriptionCardProps {
  compact?: boolean;
  showTitle?: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  compact = false, 
  showTitle = true 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          credit_packages (
            name,
            credits,
            price_mxn
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.stripe_subscription_id,
          cancelAtPeriodEnd: true
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Suscripción actualizada",
          description: data.message,
        });
        
        await fetchSubscription();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la suscripción",
        variant: "destructive"
      });
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToCheckout = () => {
    navigate('/checkout?plan=monthly');
  };

  // No mostrar nada mientras carga
  if (loading) {
    return null;
  }

  // Si no hay suscripción, no mostrar nada
  if (!subscription) {
    return null;
  }

  // Versión compacta
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-sm">{subscription.credit_packages.name}</p>
              <p className="text-xs text-gray-600">
                Renueva: {formatDate(subscription.current_period_end)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">
              ${(subscription.credit_packages.price_mxn / 100).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">/mes</p>
          </div>
        </div>
        
        {subscription.cancel_at_period_end && (
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Cancelación programada para {formatDate(subscription.current_period_end)}
          </div>
        )}
        
        <div className="mt-3 flex gap-2">
          {!subscription.cancel_at_period_end ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tu suscripción se cancelará al final del período actual 
                    ({formatDate(subscription.current_period_end)}). 
                    Conservarás acceso hasta esa fecha.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mantener</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {canceling ? 'Cancelando...' : 'Cancelar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-xs"
              onClick={handleCancelSubscription}
              disabled={canceling}
            >
              {canceling ? 'Reactivando...' : 'Reactivar'}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/checkout')}
            className="text-xs"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Versión completa para card
  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5" />
            Mi Suscripción
          </CardTitle>
          <CardDescription>
            Plan mensual activo
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Plan actual */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold">{subscription.credit_packages.name}</h3>
            <p className="text-sm text-gray-600">
              {subscription.credit_packages.credits} créditos/mes
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">
              ${(subscription.credit_packages.price_mxn / 100).toLocaleString()} MXN
            </p>
            <p className="text-sm text-gray-600">/mes</p>
          </div>
        </div>

        {/* Próxima renovación */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">Próxima renovación</p>
            <p className="font-semibold text-sm">{formatDate(subscription.current_period_end)}</p>
          </div>
        </div>

        {/* Estado de cancelación */}
        {subscription.cancel_at_period_end && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 text-sm">
                  Programada para cancelar
                </h4>
                <p className="text-xs text-yellow-700">
                  Se cancelará el {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          {!subscription.cancel_at_period_end ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  Cancelar Plan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tu suscripción se cancelará al final del período actual 
                    ({formatDate(subscription.current_period_end)}). 
                    Conservarás acceso hasta esa fecha y no se te cobrará más.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {canceling ? 'Cancelando...' : 'Sí, cancelar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={handleCancelSubscription}
              disabled={canceling}
            >
              {canceling ? 'Reactivando...' : 'Reactivar Plan'}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={goToCheckout}
          >
            Cambiar Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;