import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Scissors, 
  Building2, 
  BookOpen, 
  Edit, 
  CheckCircle, 
  Play, 
  Settings,
  FileImage,
  Palette,
  Save,
  Eye,
  Package,
  Star,
  Loader2,
  Tag,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  
  // Estados para el checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'upload',
      title: 'Proceso de Subir Fotos',
      description: 'Simular subida de imágenes y completar información de productos',
      completed: false
    },
    {
      id: 'background-removal',
      title: 'Quitar Fondo de Imágenes',
      description: 'Probar el proceso de eliminación de fondos',
      completed: false
    },
    {
      id: 'business-info',
      title: 'Información del Negocio',
      description: 'Completar datos básicos de la empresa',
      completed: false
    },
    {
      id: 'catalog-creation',
      title: 'Crear Primer Catálogo',
      description: 'Generar un catálogo con productos de prueba',
      completed: false
    },
    {
      id: 'inline-editing',
      title: 'Edición Inline',
      description: 'Probar la edición directa de productos en tabla',
      completed: false
    }
  ]);

  // Estados para simulaciones
  const [uploadSimulation, setUploadSimulation] = useState({
    step: 1,
    files: [] as { name: string; size: string; status: string }[],
    productName: '',
    productPrice: '',
    productCategory: ''
  });

  const [backgroundRemovalSimulation, setBackgroundRemovalSimulation] = useState({
    processing: false,
    selectedProducts: 0,
    processingStep: 'idle' // 'idle', 'validating', 'processing', 'completed'
  });

  const [businessInfoSimulation, setBusinessInfoSimulation] = useState({
    businessName: '',
    phone: '',
    email: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937'
  });

  const [catalogSimulation, setCatalogSimulation] = useState({
    selectedProducts: 0,
    templateStyle: 'professional',
    generating: false
  });

  const [inlineEditingSimulation, setInlineEditingSimulation] = useState({
    products: [
      { id: '1', name: 'Producto Demo 1', sku: 'DEMO-001', price: '29.99', category: 'general' },
      { id: '2', name: 'Producto Demo 2', sku: 'DEMO-002', price: '49.99', category: 'ropa' },
    ],
    editing: null as string | null,
    editValue: ''
  });

  // Función para marcar como completado
  const markCompleted = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: true } : item
    ));
    toast({
      title: "¡Proceso completado!",
      description: `Has completado exitosamente: ${checklist.find(item => item.id === id)?.title}`,
    });
  };

  // Calcular progreso general
  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🚀 Onboarding Interactivo
            </h1>
            <p className="text-gray-600 mb-4">
              Prueba todos los procesos de la plataforma con datos de ejemplo. 
              Completa cada sección para familiarizarte con las funcionalidades.
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso General</span>
                <span className="text-sm text-gray-500">{completedCount}/{checklist.length}</span>
              </div>
              <Progress value={progressPercent} className="mb-2" />
              {progressPercent === 100 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">¡Felicidades! Has completado todos los procesos</span>
                </div>
              )}
            </div>
          </div>

          {/* Checklist Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Checklist de Procesos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <Checkbox 
                          checked={item.completed}
                          className="mt-1"
                          disabled
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${item.completed ? 'text-green-600' : 'text-gray-700'}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        {item.completed && <CheckCircle className="w-4 h-4 text-green-600 mt-1" />}
                      </div>
                    ))}
                  </div>
                  
                  {completedCount === checklist.length && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        onClick={() => navigate('/products')} 
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Ir a Productos Reales
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* 1. Upload Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    1. Proceso de Subir Fotos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uploadSimulation.step === 1 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Simula subir archivos de imágenes:</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Arrastra fotos aquí o haz clic para seleccionar</p>
                          <Button 
                            className="mt-3"
                            onClick={() => {
                              setUploadSimulation(prev => ({
                                ...prev,
                                step: 2,
                                files: [
                                  { name: 'producto-demo-1.jpg', size: '2.3 MB', status: 'uploaded' },
                                  { name: 'producto-demo-2.jpg', size: '1.8 MB', status: 'uploaded' }
                                ]
                              }));
                            }}
                          >
                            Simular Subida
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {uploadSimulation.step === 2 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Archivos subidos - Completar información:</p>
                        <div className="space-y-3 mb-4">
                          {uploadSimulation.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileImage className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-gray-500">{file.size}</span>
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Subido
                              </Badge>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Nombre del Producto</label>
                            <Input 
                              placeholder="Ej: Camisa Polo Azul"
                              value={uploadSimulation.productName}
                              onChange={(e) => setUploadSimulation(prev => ({ ...prev, productName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Precio</label>
                            <Input 
                              placeholder="29.99"
                              value={uploadSimulation.productPrice}
                              onChange={(e) => setUploadSimulation(prev => ({ ...prev, productPrice: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            if (uploadSimulation.productName && uploadSimulation.productPrice) {
                              markCompleted('upload');
                              setUploadSimulation(prev => ({ ...prev, step: 3 }));
                            } else {
                              toast({
                                title: "Completa los campos",
                                description: "Ingresa nombre y precio del producto",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="w-full mt-4"
                        >
                          Guardar Productos
                        </Button>
                      </div>
                    )}
                    
                    {uploadSimulation.step === 3 && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-green-700 font-medium">¡Proceso de subida completado!</p>
                        <p className="text-sm text-green-600">Productos guardados exitosamente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 2. Background Removal Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    2. Quitar Fondo de Imágenes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {backgroundRemovalSimulation.processingStep === 'idle' && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Selecciona productos para quitar el fondo:</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                               onClick={() => setBackgroundRemovalSimulation(prev => ({ 
                                 ...prev, 
                                 selectedProducts: prev.selectedProducts === 1 ? 0 : 1 
                               }))}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={backgroundRemovalSimulation.selectedProducts >= 1} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Producto Demo 1</p>
                                <Badge variant="outline" className="text-orange-600 border-orange-600">Con Fondo</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                               onClick={() => setBackgroundRemovalSimulation(prev => ({ 
                                 ...prev, 
                                 selectedProducts: prev.selectedProducts === 2 ? 1 : 2 
                               }))}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={backgroundRemovalSimulation.selectedProducts === 2} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Producto Demo 2</p>
                                <Badge variant="outline" className="text-orange-600 border-orange-600">Con Fondo</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          disabled={backgroundRemovalSimulation.selectedProducts === 0}
                          onClick={() => {
                            setBackgroundRemovalSimulation(prev => ({ ...prev, processingStep: 'validating' }));
                            setTimeout(() => {
                              setBackgroundRemovalSimulation(prev => ({ ...prev, processingStep: 'processing' }));
                              setTimeout(() => {
                                setBackgroundRemovalSimulation(prev => ({ ...prev, processingStep: 'completed' }));
                                markCompleted('background-removal');
                              }, 3000);
                            }, 1000);
                          }}
                        >
                          <Scissors className="w-4 h-4 mr-2" />
                          Quitar Fondo ({backgroundRemovalSimulation.selectedProducts})
                        </Button>
                      </div>
                    )}
                    
                    {backgroundRemovalSimulation.processingStep === 'validating' && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                        <p className="text-blue-700 font-medium">Validando créditos...</p>
                      </div>
                    )}
                    
                    {backgroundRemovalSimulation.processingStep === 'processing' && (
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
                        <p className="text-yellow-700 font-medium">Procesando imágenes...</p>
                        <p className="text-sm text-yellow-600">Enviando a API externa (Pixelcut/Remove.bg)</p>
                      </div>
                    )}
                    
                    {backgroundRemovalSimulation.processingStep === 'completed' && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-green-700 font-medium">¡Fondos eliminados exitosamente!</p>
                        <p className="text-sm text-green-600">Productos movidos a "Sin Fondo"</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 3. Business Info Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    3. Información del Negocio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre del Negocio *</label>
                        <Input 
                          placeholder="Mi Empresa S.A. de C.V."
                          value={businessInfoSimulation.businessName}
                          onChange={(e) => setBusinessInfoSimulation(prev => ({ ...prev, businessName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <Input 
                          placeholder="+52 555 123 4567"
                          value={businessInfoSimulation.phone}
                          onChange={(e) => setBusinessInfoSimulation(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input 
                          placeholder="contacto@miempresa.com"
                          value={businessInfoSimulation.email}
                          onChange={(e) => setBusinessInfoSimulation(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Color Primario</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={businessInfoSimulation.primaryColor}
                            onChange={(e) => setBusinessInfoSimulation(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                          />
                          <Input 
                            value={businessInfoSimulation.primaryColor}
                            onChange={(e) => setBusinessInfoSimulation(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        if (businessInfoSimulation.businessName && 
                            (businessInfoSimulation.phone || businessInfoSimulation.email)) {
                          markCompleted('business-info');
                          toast({
                            title: "Información guardada",
                            description: "Los datos de tu negocio se han guardado correctamente"
                          });
                        } else {
                          toast({
                            title: "Completa los campos requeridos",
                            description: "Nombre del negocio y al menos un método de contacto son obligatorios",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Información
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Catalog Creation Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    4. Crear Primer Catálogo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!catalogSimulation.generating && (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Selecciona productos para el catálogo:</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                               onClick={() => setCatalogSimulation(prev => ({ 
                                 ...prev, 
                                 selectedProducts: prev.selectedProducts === 1 ? 0 : 1 
                               }))}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={catalogSimulation.selectedProducts >= 1} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Producto Demo 1</p>
                                <Badge variant="outline" className="text-green-600 border-green-600">Sin Fondo</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                               onClick={() => setCatalogSimulation(prev => ({ 
                                 ...prev, 
                                 selectedProducts: prev.selectedProducts === 2 ? 1 : 2 
                               }))}>
                            <div className="flex items-center gap-2">
                              <Checkbox checked={catalogSimulation.selectedProducts === 2} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Producto Demo 2</p>
                                <Badge variant="outline" className="text-green-600 border-green-600">Sin Fondo</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-1">Estilo de Template</label>
                          <select 
                            value={catalogSimulation.templateStyle}
                            onChange={(e) => setCatalogSimulation(prev => ({ ...prev, templateStyle: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          >
                            <option value="professional">Profesional</option>
                            <option value="modern">Moderno</option>
                            <option value="elegant">Elegante</option>
                            <option value="minimal">Minimalista</option>
                          </select>
                        </div>
                        
                        <Button 
                          disabled={catalogSimulation.selectedProducts === 0}
                          onClick={() => {
                            setCatalogSimulation(prev => ({ ...prev, generating: true }));
                            setTimeout(() => {
                              setCatalogSimulation(prev => ({ ...prev, generating: false }));
                              markCompleted('catalog-creation');
                            }, 4000);
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Crear Catálogo ({catalogSimulation.selectedProducts})
                        </Button>
                      </div>
                    )}
                    
                    {catalogSimulation.generating && (
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
                        <p className="text-purple-700 font-medium">Generando catálogo...</p>
                        <p className="text-sm text-purple-600">Template: {catalogSimulation.templateStyle}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 5. Inline Editing Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    5. Edición Inline de Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Haz clic en cualquier celda para editarla:</p>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-left text-sm font-medium">Nombre</th>
                            <th className="p-3 text-left text-sm font-medium">SKU</th>
                            <th className="p-3 text-left text-sm font-medium">Precio</th>
                            <th className="p-3 text-left text-sm font-medium">Categoría</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inlineEditingSimulation.products.map((product) => (
                            <tr key={product.id} className="border-t">
                              <td className="p-3">
                                {inlineEditingSimulation.editing === `${product.id}-name` ? (
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      value={inlineEditingSimulation.editValue}
                                      onChange={(e) => setInlineEditingSimulation(prev => ({ 
                                        ...prev, 
                                        editValue: e.target.value 
                                      }))}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                    <Button 
                                      size="sm" 
                                      onClick={() => {
                                        const updatedProducts = inlineEditingSimulation.products.map(p => 
                                          p.id === product.id ? { ...p, name: inlineEditingSimulation.editValue } : p
                                        );
                                        setInlineEditingSimulation(prev => ({ 
                                          ...prev, 
                                          products: updatedProducts,
                                          editing: null,
                                          editValue: ''
                                        }));
                                        if (!checklist.find(item => item.id === 'inline-editing')?.completed) {
                                          markCompleted('inline-editing');
                                        }
                                      }}
                                    >
                                      <Save className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div 
                                    className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                                    onClick={() => {
                                      setInlineEditingSimulation(prev => ({ 
                                        ...prev, 
                                        editing: `${product.id}-name`,
                                        editValue: product.name
                                      }));
                                    }}
                                  >
                                    {product.name}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="cursor-pointer hover:bg-gray-50 p-1 rounded">
                                  {product.sku}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="cursor-pointer hover:bg-gray-50 p-1 rounded">
                                  ${product.price}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{product.category}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      💡 Tip: En el sistema real puedes editar precios, categorías, SKUs y más campos directamente
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => navigate('/products')}
            >
              <Package className="w-4 h-4 mr-2" />
              Ver Productos Reales
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir Mis Productos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/business-info')}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Completar Mi Info
            </Button>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default OnboardingPage;