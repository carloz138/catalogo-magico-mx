// src/components/dashboard/UsageDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Upload, 
  CreditCard, 
  AlertTriangle,
  Infinity as InfinityIcon,
  Calendar,
  Zap,
  RefreshCw
} from 'lucide-react';

interface UsageData {
  current_plan: {
    name: string;
    credits: number;
    max_catalogs: number;
    max_uploads: number;
    price_mxn: number;
  };
  
  current_usage: {
    catalogs_generated: number;
    uploads_used: number;
    credits_remaining: number;
  };
  
  limits: {
    can_generate_catalog: boolean;
    can_upload: boolean;
    catalogs_remaining: number;
    uploads_remaining: number;
  };
}

export const UsageDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentMonth = parseInt(
        new Date().getFullYear().toString() + 
        new Date().getMonth().toString().padStart(2, '0')
      ); // Format: YYYYMM (ej: 202509)

      // 1. Query a catalog_usage (tabla real pero no en tipos)
      const { data: catalogUsage, error: catalogError } = await supabase
        .from('catalog_usage' as any)
        .select('catalogs_generated, uploads_used')
        .eq('user_id', user.id)
        .eq('usage_month', currentMonth)
        .maybeSingle();

      if (catalogError && catalogError.code !== 'PGRST116') {
        console.error('Error fetching catalog usage:', catalogError);
      }

      // 2. Query a subscriptions usando el campo correcto
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('package_id, status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing']) // Estados activos
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
      }

      if (!subscription) {
        setUsage(null);
        return;
      }

      // 3. Query a credit_packages para obtener detalles del plan
      const { data: planData, error: planError } = await supabase
        .from('credit_packages')
        .select('name, credits, max_catalogs, max_uploads, price_mxn')
        .eq('id', subscription.package_id)
        .single();

      if (planError) {
        console.error('Error fetching plan data:', planError);
        throw new Error('No se pudo obtener información del plan');
      }

      // 4. Query a credit_usage para obtener créditos restantes
      const { data: creditData, error: creditError } = await supabase
        .from('credit_usage')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (creditError && creditError.code !== 'PGRST116') {
        console.error('Error fetching credits:', creditError);
      }

      // 5. Construir datos de forma segura
      const currentUsage = catalogUsage || { 
        catalogs_generated: 0, 
        uploads_used: 0 
      };
      
      const creditsRemaining = creditData?.credits_remaining || planData.credits || 0;
      
      const isUnlimitedCatalogs = planData.max_catalogs === null || planData.max_catalogs === 0;
      const isUnlimitedUploads = planData.max_uploads === null || planData.max_uploads === 0;

      const usageData: UsageData = {
        current_plan: {
          name: planData.name,
          credits: planData.credits,
          max_catalogs: planData.max_catalogs || 0,
          max_uploads: planData.max_uploads || 0,
          price_mxn: planData.price_mxn
        },
        current_usage: {
          catalogs_generated: currentUsage.catalogs_generated || 0,
          uploads_used: currentUsage.uploads_used || 0,
          credits_remaining: creditsRemaining
        },
        limits: {
          can_generate_catalog: isUnlimitedCatalogs || 
            (currentUsage.catalogs_generated || 0) < (planData.max_catalogs || 0),
          can_upload: isUnlimitedUploads || 
            (currentUsage.uploads_used || 0) < (planData.max_uploads || 0),
          catalogs_remaining: isUnlimitedCatalogs ? 0 : 
            Math.max(0, (planData.max_catalogs || 0) - (currentUsage.catalogs_generated || 0)),
          uploads_remaining: isUnlimitedUploads ? 0 : 
            Math.max(0, (planData.max_uploads || 0) - (currentUsage.uploads_used || 0))
        }
      };

      setUsage(usageData);

    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton responsive
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 text-center">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2 text-sm sm:text-base">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4 text-xs sm:text-sm">{error}</p>
          <Button onClick={fetchUsageData} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No subscription state
  if (!usage) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 text-center">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2 text-sm sm:text-base">Sin suscripción activa</h3>
          <p className="text-gray-600 mb-4 text-xs sm:text-sm">
            Necesitas una suscripción para usar la plataforma
          </p>
          <Button onClick={() => navigate('/pricing')} size="sm">
            Ver Planes
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isUnlimitedCatalogs = usage.current_plan.max_catalogs === 0;
  const isUnlimitedUploads = usage.current_plan.max_uploads === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Plan Actual - Mobile optimized */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Plan Actual</span>
            </div>
            <Badge variant="outline" className="w-fit text-xs sm:text-sm">
              ${(usage.current_plan.price_mxn / 100).toLocaleString()}/mes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">{usage.current_plan.name}</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                {usage.current_plan.credits} créditos mensuales
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              size="sm"
              className="w-full sm:w-auto"
            >
              Cambiar Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uso Actual - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Catálogos */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Package className="w-4 h-4" />
              Catálogos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold">
                  {usage.current_usage.catalogs_generated}
                </span>
                <div className="text-right">
                  {isUnlimitedCatalogs ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <InfinityIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Ilimitados</span>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-600">
                      / {usage.current_plan.max_catalogs}
                    </span>
                  )}
                </div>
              </div>
              
              {!isUnlimitedCatalogs && (
                <div className="space-y-2">
                  <Progress 
                    value={(usage.current_usage.catalogs_generated / usage.current_plan.max_catalogs) * 100}
                    className="h-1.5 sm:h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Usados este mes</span>
                    <span>{usage.limits.catalogs_remaining} restantes</span>
                  </div>
                </div>
              )}
              
              {!usage.limits.can_generate_catalog && (
                <Badge variant="destructive" className="w-full justify-center text-xs">
                  Límite alcanzado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uploads */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Upload className="w-4 h-4" />
              Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold">
                  {usage.current_usage.uploads_used}
                </span>
                <div className="text-right">
                  {isUnlimitedUploads ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <InfinityIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Ilimitados</span>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-600">
                      / {usage.current_plan.max_uploads}
                    </span>
                  )}
                </div>
              </div>
              
              {!isUnlimitedUploads && (
                <div className="space-y-2">
                  <Progress 
                    value={(usage.current_usage.uploads_used / usage.current_plan.max_uploads) * 100}
                    className="h-1.5 sm:h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Usados este mes</span>
                    <span>{usage.limits.uploads_remaining} restantes</span>
                  </div>
                </div>
              )}
              
              {!usage.limits.can_upload && (
                <Badge variant="destructive" className="w-full justify-center text-xs">
                  Límite alcanzado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Créditos de Procesamiento */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Zap className="w-4 h-4" />
              Créditos IA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-bold">
                  {usage.current_usage.credits_remaining}
                </span>
                <span className="text-xs sm:text-sm text-gray-600">restantes</span>
              </div>
              
              <div className="text-xs text-gray-600">
                Para remover fondos de imágenes
              </div>
              
              {usage.current_usage.credits_remaining <= 5 && (
                <Badge variant="outline" className="w-full justify-center text-xs text-amber-600">
                  Pocos créditos restantes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Mensual - Mobile optimized */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Resumen del Mes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div>
              <div className="font-semibold text-base sm:text-lg">
                {usage.current_usage.catalogs_generated}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Catálogos generados
              </div>
            </div>
            <div>
              <div className="font-semibold text-base sm:text-lg">
                {usage.current_usage.uploads_used}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Imágenes subidas
              </div>
            </div>
            <div>
              <div className="font-semibold text-base sm:text-lg">
                {usage.current_plan.credits - usage.current_usage.credits_remaining}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Créditos usados
              </div>
            </div>
            <div>
              <div className="font-semibold text-green-600 text-base sm:text-lg">
                ${((usage.current_plan.credits - usage.current_usage.credits_remaining) * 2).toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Valor procesado
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};