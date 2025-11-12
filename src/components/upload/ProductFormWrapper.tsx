import React, { useState } from "react";
// 👇 Importamos el componente individual que acabamos de crear arriba
import { ProductForm, type ProductData } from "./ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// 👇 Asegúrate de que esta ruta apunte a tu archivo de types o al Uploader
import { type UploadedFile } from "@/components/upload/FileUploader";

interface ProductFormWrapperProps {
  files: UploadedFile[];
  onComplete: (productData: ProductData[]) => void;
}

export const ProductFormWrapper = ({ files, onComplete }: ProductFormWrapperProps) => {
  // Inicializamos el estado con los archivos recibidos
  const [products, setProducts] = useState<ProductData[]>(() =>
    files.map((file, index) => ({
      id: file.id,
      // Si viene nombre pre-llenado (del Radar), lo usamos. Si no, "Producto X"
      name: (file as any).productData?.name || `Producto ${index + 1}`,
      sku: "",
      price_retail: 0,
      price_wholesale: 0,
      wholesale_min_qty: 12,
      category: "",
      custom_description: "",
      original_image_url: file.url || file.preview,
      smart_analysis: file.analysis,
      tags: (file as any).productData?.tags || []
    })),
  );

  const handleProductUpdate = (index: number, updatedProduct: ProductData) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setProducts(newProducts);
  };

  const handleSubmit = () => {
    onComplete(products);
  };

  // Validación simple: que tengan nombre
  const isValid = products.every((product) => product.name.trim() !== "");

  return (
    <div className="space-y-6">
      {products.map((product, index) => (
        <ProductForm
          key={product.id}
          product={product}
          imageUrl={files[index].url || files[index].preview}
          onUpdate={(updatedProduct) => handleProductUpdate(index, updatedProduct)}
          // 👇 Aquí habilitamos que se vean AMBOS precios
          priceDisplayMode="both" 
        />
      ))}

      <Card>
        <CardContent className="p-6 text-center">
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid} 
            size="lg" 
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Guardar Productos
          </Button>
          {!isValid && (
            <p className="text-sm text-red-500 mt-2">
              Por favor asigna un nombre a todos los productos para continuar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
