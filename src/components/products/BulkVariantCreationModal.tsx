import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { batchInsert } from '@/lib/batch-processing';

interface VariantType {
  id: string;
  name: string;
  display_name: string;
  input_type: string;
  is_required: boolean;
  variant_values: Array<{
    id: string;
    value: string;
    display_value: string;
    hex_color?: string;
  }>;
}

interface BulkVariantCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Array<{
    id: string;
    name: string;
    category: string | null;
    price_retail: number;
    price_wholesale: number;
  }>;
  userId: string;
  onSuccess: () => void;
}

export const BulkVariantCreationModal: React.FC<BulkVariantCreationModalProps> = ({
  open,
  onOpenChange,
  selectedProducts,
  userId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
  
  // Categorías de los productos seleccionados
  const uniqueCategories = [...new Set(selectedProducts.map(p => p.category).filter(Boolean))];
  const hasMultipleCategories = uniqueCategories.length > 1;

  useEffect(() => {
    if (open && uniqueCategories.length > 0) {
      loadVariantTypes(uniqueCategories[0] as string);
    }
  }, [open, uniqueCategories]);

  const loadVariantTypes = async (category: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_variant_types_by_category', {
        category_name: category
      });

      if (error) throw error;
      // Cast the data to the correct type
      const typedData = (data || []) as VariantType[];
      setVariantTypes(typedData);
    } catch (error) {
      console.error('Error loading variant types:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de variantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVariantValue = (typeName: string, valueId: string) => {
    setSelectedVariants(prev => {
      const current = prev[typeName] || [];
      const updated = current.includes(valueId)
        ? current.filter(id => id !== valueId)
        : [...current, valueId];
      
      return {
        ...prev,
        [typeName]: updated
      };
    });
  };

  const generateVariantCombinations = () => {
    const selectedTypes = Object.keys(selectedVariants).filter(
      key => selectedVariants[key].length > 0
    );

    if (selectedTypes.length === 0) return [];

    // Generar todas las combinaciones posibles
    const combinations: Record<string, string>[] = [{}];
    
    for (const typeName of selectedTypes) {
      const valueIds = selectedVariants[typeName];
      const newCombinations: Record<string, string>[] = [];
      
      for (const combination of combinations) {
        for (const valueId of valueIds) {
          const variantType = variantTypes.find(vt => vt.name === typeName);
          const value = variantType?.variant_values.find(v => v.id === valueId);
          
          if (value) {
            newCombinations.push({
              ...combination,
              [typeName]: value.value
            });
          }
        }
      }
      
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    return combinations;
  };

  const handleCreateVariants = async () => {
    const combinations = generateVariantCombinations();
    
    if (combinations.length === 0) {
      toast({
        title: "Selecciona variantes",
        description: "Debes seleccionar al menos un valor de variante",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      // Crear variantes para cada producto
      const allVariants = [];
      
      for (const product of selectedProducts) {
        for (let i = 0; i < combinations.length; i++) {
          const combination = combinations[i];
          allVariants.push({
            product_id: product.id,
            user_id: userId,
            variant_combination: combination,
            sku: `${product.id.slice(0, 8)}-VAR-${i + 1}`,
            price_retail: product.price_retail,
            price_wholesale: product.price_wholesale,
            stock_quantity: 0,
            is_default: i === 0, // Primera variante como default
            is_active: true
          });
        }
      }

      // Insertar en batch usando la función de batch-processing
      const result = await batchInsert(
        'product_variants',
        allVariants,
        500,
        supabase
      );

      if (result.failed.length > 0) {
        console.error('Some variants failed to create:', result.failed);
        toast({
          title: "Variantes creadas parcialmente",
          description: `Se crearon ${result.successful.length} variantes, pero ${result.failed.length} fallaron`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Variantes creadas",
          description: `Se crearon ${result.successful.length} variantes para ${selectedProducts.length} productos`,
        });
      }

      // Actualizar productos con has_variants y variant_count
      for (const product of selectedProducts) {
        const variantCount = combinations.length;
        await supabase
          .from('products')
          .update({ 
            has_variants: true,
            variant_count: variantCount 
          })
          .eq('id', product.id);
      }

      onSuccess();
      onOpenChange(false);
      setSelectedVariants({});
    } catch (error) {
      console.error('Error creating variants:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las variantes",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const combinationsCount = generateVariantCombinations().length;
  const totalVariantsToCreate = combinationsCount * selectedProducts.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-xl my-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Crear Variantes Masivamente</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedProducts.length} producto(s) seleccionado(s)
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {hasMultipleCategories && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Productos de diferentes categorías</p>
              <p className="text-xs text-yellow-700 mt-1">
                Los productos seleccionados tienen categorías diferentes. Se usarán las variantes de: {uniqueCategories[0]}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-6 max-h-[60vh] overflow-y-auto">
              {variantTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay tipos de variantes disponibles para esta categoría</p>
                </div>
              ) : (
                variantTypes.map((variantType) => (
                  <div key={variantType.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">
                        {variantType.display_name}
                        {variantType.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {selectedVariants[variantType.name]?.length > 0 && (
                        <Badge variant="secondary">
                          {selectedVariants[variantType.name].length} seleccionado(s)
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {variantType.variant_values.map((value) => {
                        const isSelected = selectedVariants[variantType.name]?.includes(value.id) || false;
                        
                        return (
                          <label
                            key={value.id}
                            className={`
                              flex items-center gap-2 p-3 border rounded-lg cursor-pointer
                              transition-all hover:border-primary hover:bg-primary/5
                              ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-200'}
                            `}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleVariantValue(variantType.name, value.id)}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              {value.hex_color && (
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: value.hex_color }}
                                />
                              )}
                              <span className="text-sm truncate">
                                {value.display_value || value.value}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {combinationsCount > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Se crearán {totalVariantsToCreate} variantes en total
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {combinationsCount} combinación(es) × {selectedProducts.length} producto(s)
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateVariants}
                disabled={creating || combinationsCount === 0}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear {totalVariantsToCreate} Variantes
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
