
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import ProductsTableEditor from '@/components/products/ProductsTableEditor';
import { Button } from '@/components/ui/button';
import { Plus, Settings, BarChart3, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ProductsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleEditVariants = (productId: string) => {
    setSelectedProductId(productId);
    setShowVariantsModal(true);
    toast({
      title: "Gestión de Variantes",
      description: "Función de variantes en desarrollo",
    });
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleGoToUpload = () => {
    navigate('/upload');
  };

  const handleGoToCatalog = () => {
    navigate('/template-selection');
  };

  const handleGoToAnalytics = () => {
    toast({
      title: "Analytics",
      description: "Función de analytics en desarrollo",
    });
  };

  const actions = (
    <>
      <Button 
        variant="outline" 
        onClick={handleGoToAnalytics}
        className="flex items-center gap-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span className="hidden sm:inline">Analytics</span>
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleGoToCatalog}
        className="flex items-center gap-2"
      >
        <Package className="w-4 h-4" />
        <span className="hidden sm:inline">Crear Catálogo</span>
      </Button>
      
      <Button 
        onClick={handleGoToUpload}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Agregar Productos</span>
        <span className="sm:hidden">Agregar</span>
      </Button>
    </>
  );

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Variantes</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Procesados</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border">
          <ProductsTableEditor
            onEditVariants={handleEditVariants}
            onViewProduct={handleViewProduct}
          />
        </div>

        {/* Modal de Variantes (Placeholder) */}
        {showVariantsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Gestión de Variantes</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowVariantsModal(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-8 text-center text-gray-500">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Componente de gestión de variantes en desarrollo</p>
                <p className="text-sm mt-2">Producto ID: {selectedProductId}</p>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default ProductsManagement;
