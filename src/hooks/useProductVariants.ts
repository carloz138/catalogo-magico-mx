import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProductVariant, CreateVariantData, UpdateVariantData, VariantTypeWithValues } from '@/types/variants';

export function useProductVariants(productId: string) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantTypes, setVariantTypes] = useState<VariantTypeWithValues[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Cargar variantes del producto
  const loadVariants = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_product_variants', { product_uuid: productId });

      if (error) throw error;

      const formattedVariants: ProductVariant[] = (data || []).map((v: any) => ({
        id: v.variant_id,
        product_id: productId,
        user_id: '', // No viene en la respuesta pero no lo necesitamos aquí
        variant_combination: v.combination,
        sku: v.sku,
        price_retail: v.price_retail,
        price_wholesale: v.price_wholesale,
        wholesale_min_qty: null,
        stock_quantity: v.stock_quantity || 0,
        variant_images: v.variant_images,
        is_default: v.is_default,
        is_active: true,
        created_at: '',
        updated_at: ''
      }));

      setVariants(formattedVariants);
    } catch (error) {
      console.error('Error loading variants:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las variantes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  // Cargar tipos de variantes por categoría
  const loadVariantTypes = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_variant_types_by_category', { category_name: category });

      if (error) throw error;

      const formatted: VariantTypeWithValues[] = (data || []).map((vt: any) => ({
        id: vt.id,
        name: vt.name,
        display_name: vt.display_name,
        category: category as any,
        input_type: vt.input_type,
        is_required: vt.is_required,
        sort_order: 0,
        created_at: '',
        updated_at: '',
        variant_values: vt.variant_values || []
      }));

      setVariantTypes(formatted);
    } catch (error) {
      console.error('Error loading variant types:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de variantes',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Crear variante
  const createVariant = useCallback(async (data: CreateVariantData) => {
    try {
      const { data: result, error } = await supabase
        .from('product_variants')
        .insert({
          product_id: data.product_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          variant_combination: data.variant_combination,
          sku: data.sku,
          price_retail: data.price_retail,
          price_wholesale: data.price_wholesale,
          stock_quantity: data.stock_quantity || 0,
          variant_images: data.variant_images,
          is_default: data.is_default || false,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Variante creada',
        description: 'La variante se creó correctamente'
      });

      await loadVariants();
      return result;
    } catch (error) {
      console.error('Error creating variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la variante',
        variant: 'destructive'
      });
      return null;
    }
  }, [loadVariants, toast]);

  // Actualizar variante
  const updateVariant = useCallback(async (variantId: string, data: UpdateVariantData) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({
          variant_combination: data.variant_combination,
          sku: data.sku,
          price_retail: data.price_retail,
          price_wholesale: data.price_wholesale,
          stock_quantity: data.stock_quantity,
          variant_images: data.variant_images,
          is_default: data.is_default,
          is_active: data.is_active
        })
        .eq('id', variantId);

      if (error) throw error;

      toast({
        title: 'Variante actualizada',
        description: 'Los cambios se guardaron correctamente'
      });

      await loadVariants();
      return true;
    } catch (error) {
      console.error('Error updating variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la variante',
        variant: 'destructive'
      });
      return false;
    }
  }, [loadVariants, toast]);

  // Eliminar variante (soft delete)
  const deleteVariant = useCallback(async (variantId: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', variantId);

      if (error) throw error;

      toast({
        title: 'Variante eliminada',
        description: 'La variante se eliminó correctamente'
      });

      await loadVariants();
      return true;
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la variante',
        variant: 'destructive'
      });
      return false;
    }
  }, [loadVariants, toast]);

  // Establecer variante por defecto
  const setDefaultVariant = useCallback(async (variantId: string) => {
    try {
      // Primero quitar default de todas
      await supabase
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', productId);

      // Luego marcar la nueva como default
      const { error } = await supabase
        .from('product_variants')
        .update({ is_default: true })
        .eq('id', variantId);

      if (error) throw error;

      toast({
        title: 'Variante predeterminada',
        description: 'Se estableció como variante predeterminada'
      });

      await loadVariants();
      return true;
    } catch (error) {
      console.error('Error setting default variant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo establecer como predeterminada',
        variant: 'destructive'
      });
      return false;
    }
  }, [productId, loadVariants, toast]);

  return {
    variants,
    variantTypes,
    loading,
    loadVariants,
    loadVariantTypes,
    createVariant,
    updateVariant,
    deleteVariant,
    setDefaultVariant
  };
}
