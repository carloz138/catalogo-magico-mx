import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Tag, Package } from "lucide-react";
import { useProductIntelligence } from "@/hooks/useProductIntelligence";

export interface ProductData {
  id: string;
  name: string;
  sku: string;
  price_retail: number;
  price_wholesale: number;
  wholesale_min_qty: number;
  category: string;
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

  // Helper para números
  const handleNumberChange = (field: keyof ProductData, value: string) => {
    if (value === "") {
      handleChange(field, 0);
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, num);
    }
  };

  // Fix Scroll Accidental
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
        <div className="flex flex-col md:flex-row h-full">
          {/* --- COLUMNA IZQUIERDA: IMAGEN (Optimizada) --- */}
          {/* Usamos h-64 en móvil para que no sea enorme, y w-56 fijo en desktop */}
          <div className="w-full md:w-56 h-64 md:h-auto bg-gray-50 relative flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100 flex items-center justify-center p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Preview"
                // 'object-contain' evita que se corte la imagen
                className="max-w-full max-h-full object-contain shadow-sm rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Package className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
          </div>

          {/* --- COLUMNA DERECHA: CAMPOS --- */}
          {/* Ajustamos padding para móvil (p-4) y desktop (p-6) */}
          <div className="flex-1 p-4 md:p-6 space-y-5">
            {/* Fila 1: Datos Principales */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Producto</Label>
                <Input
                  value={product.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ej. Tenis Deportivos Nike"
                  className="font-medium text-base h-10"
                />
              </div>
              {/* En móvil ocupan ancho completo, en desktop se dividen */}
              <div className="grid grid-cols-2 gap-4 md:col-span-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</Label>
                  <Input
                    value={product.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="Ej. Calzado"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</Label>
                  <Input
                    value={product.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="Opcional"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Descripción + IA */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] sm:text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700 px-2"
                  onClick={() => analyzeTags(product.name, product.custom_description)}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  IA Sugerir Tags
                </Button>
              </div>
              <Textarea
                value={product.custom_description}
                onChange={(e) => handleChange("custom_description", e.target.value)}
                placeholder="Detalles, medidas, material..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* ZONA DE TAGS (Chips) - Contenedor flexible */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center min-h-[2rem] p-1">
                {(!product.tags || product.tags.length === 0) && (
                  <span className="text-xs text-gray-400 italic flex items-center gap-1 select-none">
                    <Tag className="w-3 h-3" /> Sin etiquetas
                  </span>
                )}
                {(product.tags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="pl-2.5 pr-1 py-1 flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  >
                    {tag}
                    <div
                      className="p-0.5 rounded-full hover:bg-gray-300 cursor-pointer transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </div>
                  </Badge>
                ))}
              </div>

              {/* Sugerencias IA - Animación suave */}
              {suggestedTags.length > 0 && (
                <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2">
                  <div className="w-full flex justify-between items-center">
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
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer bg-white hover:border-purple-400 hover:text-purple-700 transition-all active:scale-95 select-none"
                        onClick={() => addTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fila 3: Precios (Retail y Wholesale) */}
            <div className="pt-4 border-t border-gray-100">
              {/* Usamos grid responsive: 1 col móvil, 2 cols tablet, 3 cols desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Menudeo */}
                {(priceDisplayMode === "retail" || priceDisplayMode === "both") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Precio Menudeo</Label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-light group-focus-within:text-blue-500 transition-colors">
                        $
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        onWheel={preventScrollChange}
                        value={product.price_retail || ""}
                        onChange={(e) => handleNumberChange("price_retail", e.target.value)}
                        className="pl-7 font-medium border-blue-100 focus-visible:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {/* Mayoreo */}
                {(priceDisplayMode === "wholesale" || priceDisplayMode === "both") && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-green-600 uppercase tracking-wider">
                        Precio Mayoreo
                      </Label>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-light group-focus-within:text-green-500 transition-colors">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          onWheel={preventScrollChange}
                          value={product.price_wholesale || ""}
                          onChange={(e) => handleNumberChange("price_wholesale", e.target.value)}
                          className="pl-7 font-medium border-green-100 focus-visible:ring-green-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mín. Mayoreo</Label>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 uppercase font-bold group-focus-within:text-gray-600">
                          Cant.
                        </span>
                        <Input
                          type="number"
                          min="1"
                          onWheel={preventScrollChange}
                          value={product.wholesale_min_qty || ""}
                          onChange={(e) => handleNumberChange("wholesale_min_qty", e.target.value)}
                          className="pl-11" // Más padding para que quepa "Cant."
                          placeholder="12"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
