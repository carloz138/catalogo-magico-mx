
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessInfo } from '@/types/business';

export const useBusinessInfo = () => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusinessInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('business_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setBusinessInfo(data);
    } catch (err) {
      console.error('Error loading business info:', err);
      setError('Error al cargar información del negocio');
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessInfo = async (updates: Partial<BusinessInfo>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('business_info')
        .upsert({ 
          user_id: user.id, 
          ...updates 
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Recargar datos
      await loadBusinessInfo();
      return true;
    } catch (err) {
      console.error('Error updating business info:', err);
      setError('Error al actualizar información');
      return false;
    }
  };

  const hasBusinessInfo = () => {
    return businessInfo && businessInfo.business_name?.trim();
  };

  useEffect(() => {
    loadBusinessInfo();
  }, []);

  return {
    businessInfo,
    loading,
    error,
    loadBusinessInfo,
    updateBusinessInfo,
    hasBusinessInfo: hasBusinessInfo()
  };
};
