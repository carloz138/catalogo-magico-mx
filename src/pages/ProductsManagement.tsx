
import React from 'react';
import { ProductsTableEditor } from '@/components/products/ProductsTableEditor';

const ProductsManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestión de Productos
          </h1>
          <p className="text-muted-foreground">
            Administra y edita tus productos de forma eficiente con edición en línea
          </p>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm">
          <ProductsTableEditor />
        </div>
      </div>
    </div>
  );
};

export default ProductsManagement;
