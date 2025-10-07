import React, { useState } from "react";
import { ProductForm, type ProductData } from "./ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  analysis?: any;
}

interface ProductFormWrapperProps {
  files: UploadedFile[];
  onComplete: (productData: ProductData[]) => void;
}

export const ProductFormWrapper = ({ files, onComplete }: ProductFormWrapperProps) => {
  const [products, setProducts] = useState<ProductData[]>(() =>
    files.map((file, index) => ({
      id: file.id,
      name: `Producto ${index + 1}`,
      sku: "",
      price_retail: 0,
      price_wholesale: 0,
      wholesale_min_qty: 12,
      category: "",
      custom_description: "",
      original_image_url: file.url || file.preview,
      smart_analysis: file.analysis,
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

  const isValid = products.every((product) => product.name.trim() !== "");

  return (
    <div className="space-y-6">
      {products.map((product, index) => (
        <ProductForm
          key={product.id}
          product={product}
          imageUrl={files[index].url || files[index].preview}
          onUpdate={(updatedProduct) => handleProductUpdate(index, updatedProduct)}
          priceDisplayMode="retail"
        />
      ))}

      <Card>
        <CardContent className="p-6 text-center">
          <Button onClick={handleSubmit} disabled={!isValid} size="lg" className="w-full md:w-auto">
            Continuar con el cálculo de costos
          </Button>
          {!isValid && <p className="text-sm text-gray-500 mt-2">Guardar</p>}
        </CardContent>
      </Card>
    </div>
  );
};
