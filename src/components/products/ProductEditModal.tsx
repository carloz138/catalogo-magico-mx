
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price_retail: number | null;
  price_wholesale: number | null;
  wholesale_min_qty: number | null;
  category: string;
  custom_description: string | null;
  original_image_url: string;
  processing_status: string;
  created_at: string;
}

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: (updatedProduct: Product) => void;
}

const categories = [
  // PIXELCUT CATEGORIES (13 categorías - productos con fondos uniformes)
  'Electrónicos y Tecnología',      // Smartphones, laptops, tablets, cámaras
  'Electrodomésticos',              // Microondas, licuadoras, cafeteras  
  'Gadgets y Accesorios Tech',      // Cables, cargadores, fundas
  'Muebles y Decoración',           // Mesas, sillas, lámparas
  'Artículos para el Hogar',        // Utensilios cocina, organizadores
  'Oficina y Papelería',            // Libretas, plumas, calculadoras
  'Libros y Material Educativo',    // Libros, revistas, cursos
  'Herramientas y Ferretería',      // Martillos, destornilladores
  'Refacciones y Automóviles',      // Partes automotrices, aceites
  'Juguetes y Figuras',             // Carros, robots, figuras de acción
  'Equipos Deportivos',             // Balones, raquetas, pesas
  'Instrumentos Musicales',         // Guitarras, teclados, micrófonos
  'Alimentos Empaquetados',         // Productos en cajas/latas
  
  // REMOVE.BG CATEGORIES (3 categorías - productos complejos solamente)
  'Ropa y Textiles',                // Camisas, vestidos, telas
  'Belleza y Cuidado Personal',     // Productos para cabello, maquillaje
  'Mascotas y Artículos Pet'        // Animales, juguetes blandos
];

type PricingMode = 'none' | 'retail' | 'both';

export const ProductEditModal = ({ product, isOpen, onClose, onProductUpdate }: ProductEditModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    custom_description: '',
    price_retail: '',
    price_wholesale: '',
    wholesale_min_qty: '12'
  });
  const [pricingMode, setPricingMode] = useState<PricingMode>('none');
  const [loading, setSaving] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        custom_description: product.custom_description || '',
        price_retail: product.price_retail ? (product.price_retail / 100).toString() : '',
        price_wholesale: product.price_wholesale ? (product.price_wholesale / 100).toString() : '',
        wholesale_min_qty: product.wholesale_min_qty?.toString() || '12'
      });

      // Determine pricing mode
      if (product.price_retail && product.price_wholesale) {
        setPricingMode('both');
      } else if (product.price_retail) {
        setPricingMode('retail');
      } else {
        setPricingMode('none');
      }
    }
  }, [product, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Error",
        description: "La categoría es obligatoria",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Prepare update data
      const updateData: any = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        category: formData.category,
        custom_description: formData.custom_description.trim() || null,
        wholesale_min_qty: pricingMode === 'both' ? parseInt(formData.wholesale_min_qty) || 12 : null
      };

      // Handle pricing based on mode
      switch (pricingMode) {
        case 'none':
          updateData.price_retail = null;
          updateData.price_wholesale = null;
          break;
        case 'retail':
          updateData.price_retail = formData.price_retail ? Math.round(parseFloat(formData.price_retail) * 100) : null;
          updateData.price_wholesale = null;
          break;
        case 'both':
          updateData.price_retail = formData.price_retail ? Math.round(parseFloat(formData.price_retail) * 100) : null;
          updateData.price_wholesale = formData.price_wholesale ? Math.round(parseFloat(formData.price_wholesale) * 100) : null;
          break;
      }

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      onProductUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.original_image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre del producto *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: iPhone 15 Pro Max"
                maxLength={32}
              />
              <div className="text-xs text-muted-foreground text-right">
                {formData.name.length}/32 caracteres
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU / Código
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Ej: IPH15PM-256GB"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Categoría *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Configuración de precios</Label>
              <RadioGroup
                value={pricingMode}
                onValueChange={(value) => setPricingMode(value as PricingMode)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="text-sm">Solo información del producto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="retail" id="retail" />
                  <Label htmlFor="retail" className="text-sm">Solo precio de venta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="text-sm">Precio de venta y mayoreo</Label>
                </div>
              </RadioGroup>
            </div>

            {(pricingMode === 'retail' || pricingMode === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="price-retail" className="text-sm font-medium">
                  Precio de venta *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="price-retail"
                    type="number"
                    value={formData.price_retail}
                    onChange={(e) => handleInputChange('price_retail', e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}

            {pricingMode === 'both' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price-wholesale" className="text-sm font-medium">
                    Precio mayoreo
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price-wholesale"
                      type="number"
                      value={formData.price_wholesale}
                      onChange={(e) => handleInputChange('price_wholesale', e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholesale-min" className="text-sm font-medium">
                    Cantidad mínima mayoreo
                  </Label>
                  <Input
                    id="wholesale-min"
                    type="number"
                    value={formData.wholesale_min_qty}
                    onChange={(e) => handleInputChange('wholesale_min_qty', e.target.value)}
                    placeholder="12"
                    min="1"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción personalizada
              </Label>
              <Textarea
                id="description"
                value={formData.custom_description}
                onChange={(e) => handleInputChange('custom_description', e.target.value)}
                placeholder="Describe características especiales, beneficios, etc."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
