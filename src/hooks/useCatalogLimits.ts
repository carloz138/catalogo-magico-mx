import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CatalogLimits {
  canGenerate: boolean;
  reason: string;
  message: string;
  catalogsUsed: number;
  catalogsLimit: number | 'unlimited';
  catalogs_limit?: number | 'unlimited'; // For backward compatibility
  remaining?: number;
  planName?: string;
}

interface CatalogValidation {
  canGenerate: boolean;
  message?: string;
}

export const useCatalogLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<CatalogLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkLimits();
    }
  }, [user]);

  const checkLimits = async () => {
    console.log('🔍 DEBUG: checkLimits iniciado');
    console.log('🔍 DEBUG: user objeto:', user);
    
    if (!user) {
      console.log('🔍 DEBUG: No hay usuario autenticado');
      setLimits({
        canGenerate: false,
        reason: 'not_authenticated',
        message: 'Debes iniciar sesión',
        catalogsUsed: 0,
        catalogsLimit: 0,
        catalogs_limit: 0,
        remaining: 0
      });
      setLoading(false);
      return;
    }

    console.log('🔍 DEBUG: user.id:', user.id);

    try {
      console.log('🔍 DEBUG: Llamando a can_generate_catalog con user_id:', user.id);
      
      // Use any to bypass TypeScript issues with missing function
      const { data, error } = await (supabase as any).rpc('can_generate_catalog', {
        p_user_id: user.id
      });

      console.log('🔍 DEBUG: Respuesta de supabase - data:', data);
      console.log('🔍 DEBUG: Respuesta de supabase - error:', error);

      if (error) throw error;

      // Parse the JSON response
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      console.log('🔍 DEBUG: Resultado parseado:', result);
      
      setLimits({
        canGenerate: result.can_generate || false,
        reason: result.reason || 'unknown',
        message: result.message || 'Sin información',
        catalogsUsed: result.catalogs_used || 0,
        catalogsLimit: result.catalogs_limit === 'unlimited' ? 'unlimited' : (result.catalogs_limit || 0),
        catalogs_limit: result.catalogs_limit === 'unlimited' ? 'unlimited' : (result.catalogs_limit || 0),
        remaining: result.remaining,
        planName: result.plan_name
      });

      console.log('🔍 DEBUG: Limits establecidos correctamente');
      
    } catch (error) {
      console.error('🔍 DEBUG: Error en checkLimits:', error);
      setLimits({
        canGenerate: false,
        reason: 'error',
        message: 'Error al verificar límites',
        catalogsUsed: 0,
        catalogsLimit: 0,
        catalogs_limit: 0,
        remaining: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeGeneration = async (): Promise<CatalogValidation> => {
    if (!limits) {
      await checkLimits();
    }
    
    return {
      canGenerate: limits?.canGenerate || false,
      message: limits?.message
    };
  };

  const refreshLimits = () => {
    setLoading(true);
    checkLimits();
  };

  return {
    limits,
    loading,
    refreshLimits,
    checkLimits,
    validateBeforeGeneration,
    canGenerate: limits?.canGenerate || false,
    validation: limits || {
      canGenerate: false,
      reason: 'loading',
      message: 'Cargando...',
      catalogsUsed: 0,
      catalogsLimit: 0,
      remaining: 0,
      catalogs_limit: 0
    },
    catalogsUsed: limits?.catalogsUsed || 0,
    catalogsLimit: limits?.catalogsLimit || 0
  };
};

// Simple component helper function
export const getCatalogUsageDisplay = (limits: CatalogLimits | null): string => {
  if (!limits) return '';
  if (limits.catalogsLimit === 'unlimited') {
    return `${limits.catalogsUsed} catálogos generados`;
  } else {
    return `${limits.catalogsUsed}/${limits.catalogsLimit} catálogos este mes`;
  }
};

// Export a simple component display function
export const CatalogUsageDisplay = getCatalogUsageDisplay;