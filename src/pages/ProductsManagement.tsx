// /src/pages/ProductsManagement.tsx - VERSIÓN FINAL CORREGIDA
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import ProductsTableEditor from '@/components/products/ProductsTableEditor';
import { Button } from '@/components/ui/button';
import { Plus, Settings, BarChart3, Package } from 'lucide-react';
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

  // ==========================================
  // ✅ ACCIONES DEL HEADER CORREGIDAS
  // ==========================================

  const actions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleGoToAnalytics}
        className="flex items-center gap-2 h-9"
      >
        <BarChart3 className="w-4 h-4" />
        <span className="hidden md:inline">Analytics</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleGoToCatalog}
        className="flex items-center gap-2 h-9"
      >
        <Package className="w-4 h-4" />
        <span className="hidden md:inline">Crear Catálogo</span>
      </Button>
      
      <Button 
        size="sm"
        onClick={handleGoToUpload}
        className="flex items-center gap-2 h-9"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden md:inline">Agregar</span>
      </Button>
    </div>
  );

  // ==========================================
  // ✅ RENDER OPTIMIZADO Y CORREGIDO
  // ==========================================

  return (
    <ProtectedRoute>
      <AppLayout 
        title="Gestión Avanzada"
        subtitle="Edición inline, variantes y gestión masiva de productos"
        actions={actions}
      >
        {/* ✅ CONTENIDO OPTIMIZADO PARA EL NUEVO LAYOUT */}
        <div className="space-y-6">
          
          {/* ✅ STATS CARDS MEJORADOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Con Variantes</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Procesados</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ PRODUCTS TABLE - OPTIMIZADA PARA NUEVO LAYOUT */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <ProductsTableEditor
              onEditVariants={handleEditVariants}
              onViewProduct={handleViewProduct}
              className="border-0 shadow-none rounded-none" // ✅ Eliminar bordes/sombras duplicadas
            />
          </div>
        </div>

        {/* ✅ MODAL OPTIMIZADO */}
        {showVariantsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Gestión de Variantes</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowVariantsModal(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <span className="sr-only">Cerrar</span>
                  ✕
                </Button>
              </div>
              <div className="py-12 text-center text-gray-500">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Componente de gestión de variantes en desarrollo</p>
                <p className="text-sm">Producto ID: {selectedProductId}</p>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default ProductsManagement;