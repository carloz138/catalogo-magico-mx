import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ProductsTableEditor from '@/components/products/ProductsTableEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, BarChart3, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ==========================================
// PÁGINA PRINCIPAL DE GESTIÓN DE PRODUCTOS
// ==========================================

const ProductsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleEditVariants = (productId: string) => {
    setSelectedProductId(productId);
    setShowVariantsModal(true);
    // TODO: Abrir modal de gestión de variantes
    toast({
      title: "Gestión de Variantes",
      description: "Función de variantes en desarrollo",
    });
  };

  const handleViewProduct = (productId: string) => {
    // Navegar a vista detallada del producto
    navigate(`/products/${productId}`);
  };

  const handleGoToUpload = () => {
    navigate('/upload');
  };

  const handleGoToCatalog = () => {
    navigate('/template-selection');
  };

  const handleGoToAnalytics = () => {
    // TODO: Implementar analytics
    toast({
      title: "Analytics",
      description: "Función de analytics en desarrollo",
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Inicio</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Productos
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Administra tu inventario con edición inline y variantes
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
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
        </main>

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
      </div>
    </ProtectedRoute>
  );
};

export default ProductsManagement;
