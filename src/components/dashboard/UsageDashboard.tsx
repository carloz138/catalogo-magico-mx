// src/components/dashboard/UsageDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Zap
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

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual Supabase calls when tables are ready
      const mockUsage: UsageData = {
        current_plan: {
          name: "Plan Profesional",
          credits: 100,
          max_catalogs: 10,
          max_uploads: 100,
          price_mxn: 49900 // $499 MXN
        },
        current_usage: {
          catalogs_generated: 3,
          uploads_used: 45,
          credits_remaining: 75
        },
        limits: {
          can_generate_catalog: true,
          can_upload: true,
          catalogs_remaining: 7,
          uploads_remaining: 55
        }
      };

      setUsage(mockUsage);

    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Sin suscripción activa</h3>
          <p className="text-gray-600 mb-4">Necesitas una suscripción para usar la plataforma</p>
          <Button onClick={() => navigate('/pricing')}>
            Ver Planes
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isUnlimitedCatalogs = usage.current_plan.max_catalogs === 0;
  const isUnlimitedUploads = usage.current_plan.max_uploads === 0;

  return (
    <div className="space-y-6">
      {/* Plan Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Plan Actual
            </div>
            <Badge variant="outline">
              ${(usage.current_plan.price_mxn / 100).toLocaleString()}/mes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{usage.current_plan.name}</h3>
              <p className="text-gray-600">
                {usage.current_plan.credits} créditos mensuales
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
            >
              Cambiar Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uso Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Catálogos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" />
              Catálogos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {usage.current_usage.catalogs_generated}
                </span>
                <div className="text-right">
                  {isUnlimitedCatalogs ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <InfinityIcon className="w-4 h-4" />
                      <span className="text-sm">Ilimitados</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">
                      / {usage.current_plan.max_catalogs}
                    </span>
                  )}
                </div>
              </div>
              
              {!isUnlimitedCatalogs && (
                <div className="space-y-2">
                  <Progress 
                    value={(usage.current_usage.catalogs_generated / usage.current_plan.max_catalogs) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Usados este mes</span>
                    <span>{usage.limits.catalogs_remaining} restantes</span>
                  </div>
                </div>
              )}
              
              {!usage.limits.can_generate_catalog && (
                <Badge variant="destructive" className="w-full justify-center">
                  Límite alcanzado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uploads */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-4 h-4" />
              Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {usage.current_usage.uploads_used}
                </span>
                <div className="text-right">
                  {isUnlimitedUploads ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <InfinityIcon className="w-4 h-4" />
                      <span className="text-sm">Ilimitados</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">
                      / {usage.current_plan.max_uploads}
                    </span>
                  )}
                </div>
              </div>
              
              {!isUnlimitedUploads && (
                <div className="space-y-2">
                  <Progress 
                    value={(usage.current_usage.uploads_used / usage.current_plan.max_uploads) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Usados este mes</span>
                    <span>{usage.limits.uploads_remaining} restantes</span>
                  </div>
                </div>
              )}
              
              {!usage.limits.can_upload && (
                <Badge variant="destructive" className="w-full justify-center">
                  Límite alcanzado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Créditos de Procesamiento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4" />
              Créditos IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {usage.current_usage.credits_remaining}
                </span>
                <span className="text-sm text-gray-600">restantes</span>
              </div>
              
              <div className="text-xs text-gray-600">
                Para remover fondos de imágenes
              </div>
              
              {usage.current_usage.credits_remaining <= 5 && (
                <Badge variant="outline" className="w-full justify-center text-amber-600">
                  Pocos créditos restantes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resumen del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="font-semibold">{usage.current_usage.catalogs_generated}</div>
              <div className="text-sm text-gray-600">Catálogos generados</div>
            </div>
            <div>
              <div className="font-semibold">{usage.current_usage.uploads_used}</div>
              <div className="text-sm text-gray-600">Imágenes subidas</div>
            </div>
            <div>
              <div className="font-semibold">{usage.current_plan.credits - usage.current_usage.credits_remaining}</div>
              <div className="text-sm text-gray-600">Créditos usados</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">
                ${((usage.current_plan.credits - usage.current_usage.credits_remaining) * 2).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Valor procesado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};