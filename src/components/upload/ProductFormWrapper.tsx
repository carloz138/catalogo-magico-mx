import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Tag } from "lucide-react";
import { useProductIntelligence } from "@/hooks/useProductIntelligence";

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  price_retail: number;
  price_wholesale: number;
  wholesale_min_qty: number;
  category: string; // ✅ Ya tenía el tipo, ahora tendrá input
  custom_description: string;
  original_image_url: string;
  smart_analysis?: any;
  tags?: string[];
}

interface ProductFormProps {
  product: ProductData;
  imageUrl: string;
  onUpdate: (product: ProductData) => void;
  priceDisplayMode?: "retail" | "wholesale" | "both";
}

export const ProductForm = ({ product, imageUrl, onUpdate, priceDisplayMode = "both" }: ProductFormProps) => {
  const { analyzeTags, suggestedTags, clearSuggestions } = useProductIntelligence();

  const handleChange = (field: keyof ProductData, value: any) => {
    onUpdate({ ...product, [field]: value });
  };

  // ⚡ MEJORA 1: Helper para números seguros
  const handleNumberChange = (field: keyof ProductData, value: string) => {
    if (value === "") {
      handleChange(field, 0); // O undefined si prefieres que quede vacío
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  // ⚡ MEJORA 2: Bloqueo de Scroll accidental
  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const addTag = (tag: string) => {
    const currentTags = product.tags || [];
    if (!currentTags.includes(tag)) {
      handleChange("tags", [...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = product.tags || [];
    handleChange(
      "tags",
      currentTags.filter((t) => t !== tagToRemove),
    );
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Columna Izquierda: Imagen */}
          <div className="w-full md:w-48 h-48 md:h-auto bg-gray-100 relative flex-shrink-0 group">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
            {/* Overlay sutil */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>

          {/* Columna Derecha: Campos */}
          <div className="flex-1 p-6 space-y-5">
            {/* Fila 1: Datos Principales */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 space-y-2">
                <Label>Nombre del Producto</Label>
                <Input
                  value={product.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ej. Tenis Deportivos Nike"
                  className="font-medium"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Categoría</Label>
                <Input
                  value={product.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="Ej. Calzado"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label className="text-gray-500">SKU</Label>
                <Input
                  value={product.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            {/* Fila 2: Descripción + IA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Descripción</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                  onClick={() => analyzeTags(product.name, product.custom_description)}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Sugerir Tags con IA
                </Button>
              </div>
              <Textarea
                value={product.custom_description}
                onChange={(e) => handleChange("custom_description", e.target.value)}
                placeholder="Detalles, medidas, material..."
                className="min-h-[80px]"
              />
            </div>

            {/* ZONA DE TAGS (Chips) */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center min-h-[2rem]">
                {(!product.tags || product.tags.length === 0) && (
                  <span className="text-xs text-gray-400 italic flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Sin etiquetas
                  </span>
                )}
                {(product.tags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {tag}
                    <div className="p-0.5 rounded-full hover:bg-gray-300 cursor-pointer" onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </div>
                  </Badge>
                ))}
              </div>

              {/* Sugerencias IA */}
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Sugerencias
                    </span>
                    <span
                      className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 hover:underline"
                      onClick={clearSuggestions}
                    >
                      Descartar
                    </span>
                  </div>
                  {suggestedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer bg-white hover:border-purple-400 hover:text-purple-700 transition-all active:scale-95"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Fila 3: Precios (Retail y Wholesale) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              {/* Menudeo */}
              {(priceDisplayMode === "retail" || priceDisplayMode === "both") && (
                <div className="space-y-2">
                  <Label className="text-blue-600 font-medium">Precio Menudeo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-light">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      onWheel={preventScrollChange} // ⚡ FIX SCROLL
                      value={product.price_retail || ""}
                      onChange={(e) => handleNumberChange("price_retail", e.target.value)}
                      className="pl-7 font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Mayoreo */}
              {(priceDisplayMode === "wholesale" || priceDisplayMode === "both") && (
                <>
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Precio Mayoreo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-light">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        onWheel={preventScrollChange} // ⚡ FIX SCROLL
                        value={product.price_wholesale || ""}
                        onChange={(e) => handleNumberChange("price_wholesale", e.target.value)}
                        className="pl-7 font-medium"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-600">Mínimo Mayoreo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-400">Cant.</span>
                      <Input
                        type="number"
                        min="1"
                        onWheel={preventScrollChange} // ⚡ FIX SCROLL
                        value={product.wholesale_min_qty || ""}
                        onChange={(e) => handleNumberChange("wholesale_min_qty", e.target.value)}
                        className="pl-10"
                        placeholder="12"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
