import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Scissors,
  Building2,
  BookOpen,
  Edit,
  CheckCircle,
  Settings,
  FileImage,
  Save,
  Eye,
  Package,
  Star,
  Loader2,
  Clock,
  DollarSign,
  Zap,
  TrendingUp,
  Award,
  Lightbulb,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  benefit: string;
  timeEstimate: string;
  valueProposition: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "upload",
      title: "Subir y Organizar Productos",
      description: "Aprende a subir fotos y organizar productos de forma inteligente",
      benefit: "Ahorra 80% del tiempo vs. crear catálogos manualmente",
      timeEstimate: "2 min",
      valueProposition: "De fotos desorganizadas a productos catalogados profesionales",
      completed: false,
    },
    {
      id: "background-removal",
      title: "Recortar Productos con IA",
      description: "Descubre cómo la IA recorta productos automáticamente en segundos",
      benefit: "Elimina costos de fotógrafo ($4,000-10,000 MXN por sesión)",
      timeEstimate: "30 seg/foto",
      valueProposition: "Fotos caseras → Productos recortados perfectamente",
      completed: false,
    },
    {
      id: "business-info",
      title: "Personalizar tu Marca",
      description: "Configura tu identidad visual para catálogos coherentes",
      benefit: "Aumenta confianza del cliente en 65%",
      timeEstimate: "3 min",
      valueProposition: "De genérico a marca profesional reconocible",
      completed: false,
    },
    {
      id: "catalog-creation",
      title: "Generar Catálogo Profesional",
      description: "Crea PDFs listos para imprimir o compartir digitalmente",
      benefit: "Genera catálogos en 5 min vs. 2-3 días con diseñador",
      timeEstimate: "30 seg",
      valueProposition: "De productos sueltos a catálogo que vende",
      completed: false,
    },
    {
      id: "inline-editing",
      title: "Actualización Rápida de Precios",
      description: "Actualiza precios y datos de productos masivamente sin rehacer todo",
      benefit: "Actualiza catálogos en minutos vs. rehacer desde cero",
      timeEstimate: "10 seg/producto",
      valueProposition: "De catálogos obsoletos a información siempre actualizada",
      completed: false,
    },
  ]);

  // Estados de simulación
  const [uploadSimulation, setUploadSimulation] = useState({
    step: 1,
    files: [] as { name: string; size: string; status: string }[],
    productName: "",
    productPrice: "",
    productCategory: "",
  });

  const [backgroundRemovalSimulation, setBackgroundRemovalSimulation] = useState({
    processing: false,
    selectedProducts: 0,
    processingStep: "idle",
  });

  const [businessInfoSimulation, setBusinessInfoSimulation] = useState({
    businessName: "",
    phone: "",
    email: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1F2937",
  });

  const [catalogSimulation, setCatalogSimulation] = useState({
    selectedProducts: 0,
    templateStyle: "professional",
    generating: false,
  });

  const [inlineEditingSimulation, setInlineEditingSimulation] = useState({
    products: [
      { id: "1", name: "Producto Demo 1", sku: "DEMO-001", price: "299.99", category: "general" },
      { id: "2", name: "Producto Demo 2", sku: "DEMO-002", price: "499.99", category: "ropa" },
    ],
    editing: null as string | null,
    editValue: "",
  });

  const markCompleted = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: true } : item)));

    const completedItem = checklist.find((item) => item.id === id);
    toast({
      title: "🎉 ¡Paso Completado!",
      description: `${completedItem?.title} - ${completedItem?.benefit}`,
    });
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;

  const advanceToNextStep = (currentStepId: string, nextAction: () => void) => {
    markCompleted(currentStepId);
    setTimeout(() => {
      nextAction();
      toast({
        title: "¡Avanzando al siguiente paso!",
        description: "Continuemos descubriendo las funcionalidades de CatifyPro",
      });
    }, 500);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🚀 Guía De Inicio - <span className="text-blue-600">CatifyPro</span>
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
              La plataforma que organiza tus productos y <strong>recorta fondos automáticamente</strong>
              para crear catálogos profesionales en minutos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="text-red-600 mb-3">❌</div>
                <h3 className="font-semibold text-red-900 mb-2">Antes (El problema)</h3>
                <ul className="text-sm text-red-800 space-y-1 text-left">
                  <li>• Fotos con mal fondo</li>
                  <li>• Catálogos en Word/PowerPoint</li>
                  <li>• 2-3 días creando cada catálogo</li>
                  <li>• Diseñador cuesta $4,000-10,000 MXN</li>
                  <li>• Actualizar = empezar de cero</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <div className="text-blue-600 mb-3">⚡</div>
                <h3 className="font-semibold text-blue-900 mb-2">Con CatifyPro</h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• IA recorta productos automático</li>
                  <li>• Templates profesionales</li>
                  <li>• Catálogo listo en 5 minutos</li>
                  <li>• Costo: $106/mes vs $10,000/catálogo</li>
                  <li>• Actualizar = 30 segundos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="text-green-600 mb-3">🎯</div>
                <h3 className="font-semibold text-green-900 mb-2">Resultado</h3>
                <ul className="text-sm text-green-800 space-y-1 text-left">
                  <li>• Ahorro 95% del tiempo</li>
                  <li>• Ahorro 90% del costo</li>
                  <li>• +65% conversión de ventas</li>
                  <li>• Productos recortados perfectamente</li>
                  <li>• Actualizaciones instantáneas</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Objetivo:</strong> En los próximos 10 minutos vas a crear tu primer catálogo profesional y
              descubrir cómo CatifyPro puede <strong>transformar tu negocio</strong>. ¡Empecemos!
            </AlertDescription>
          </Alert>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-6 border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tu Progreso de Transformación</h3>
              <p className="text-sm text-gray-600">
                Cada paso te acerca más a generar catálogos que <strong>realmente vendan</strong>
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {completedCount}/{checklist.length}
              </div>
              <div className="text-xs text-gray-500">pasos completados</div>
            </div>
          </div>

          <Progress value={progressPercent} className="mb-4 h-3" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                Tiempo total estimado: <strong>8 minutos</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span>
                Ahorro potencial: <strong>$10,000+ MXN por catálogo</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span>
                Velocidad: <strong>95% más rápido</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>
                Calidad: <strong>Nivel profesional</strong>
              </span>
            </div>
          </div>

          {progressPercent === 100 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Award className="w-5 h-5" />
                <span className="font-semibold">¡Felicidades! Eres oficialmente un CatifyPRO</span>
              </div>
              <p className="text-sm text-green-600 mb-3">
                Has dominado todas las funciones. Ahora puedes crear catálogos profesionales que impresionen a tus
                clientes y aumenten tus ventas.
              </p>
              <Button onClick={() => navigate("/products")} className="bg-green-600 hover:bg-green-700">
                <Sparkles className="w-4 h-4 mr-2" />
                ¡Crear Mi Primer Catálogo Real!
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Checklist */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Pasos para el Éxito
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Cada paso te enseña una <strong>superpoder</strong> de CatifyPro
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checklist.map((item, index) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-2 top-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                        {index + 1}
                      </div>

                      <div className="ml-6 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                          <Checkbox checked={item.completed} className="mt-1" disabled />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold ${item.completed ? "text-green-600" : "text-gray-900"}`}>
                                {item.title}
                              </h4>
                              {item.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </div>

                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                            <div className="bg-blue-50 p-2 rounded text-xs mb-2">
                              <strong className="text-blue-800">Transformación:</strong>
                              <span className="text-blue-700 ml-1">{item.valueProposition}</span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.timeEstimate}
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {item.benefit}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* PASO 1: Upload Process */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      1. Subir y Organizar Productos
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>¿Por qué esto es valioso?</strong> Convierte fotos desorganizadas en productos catalogados
                      automáticamente
                    </p>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Ahorra 80% tiempo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Beneficio clave:</strong> En lugar de pasar horas organizando fotos en carpetas y creando
                    listas en Excel, CatifyPro organiza todo automáticamente mientras subes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {uploadSimulation.step === 1 && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2">❌ Método tradicional</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            <li>• Organizar fotos manualmente</li>
                            <li>• Crear lista en Excel</li>
                            <li>• Tiempo: 2-3 horas</li>
                            <li>• Propenso a errores</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">✅ Con CatifyPro</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Sube fotos desde cualquier lugar</li>
                            <li>• Organiza automáticamente</li>
                            <li>• Tiempo: 2-3 minutos</li>
                            <li>• Sistema inteligente de catalogación</li>
                          </ul>
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Arrastra fotos aquí o haz clic para seleccionar</p>
                        <p className="text-xs text-blue-600 mt-1">
                          💡 En el sistema real: CatifyPro organiza automáticamente tus productos por categorías
                        </p>
                        <Button
                          className="mt-3"
                          onClick={() => {
                            setUploadSimulation((prev) => ({
                              ...prev,
                              step: 2,
                              files: [
                                { name: "camisa-polo-azul.jpg", size: "2.3 MB", status: "uploaded" },
                                { name: "zapatos-deportivos.jpg", size: "1.8 MB", status: "uploaded" },
                              ],
                            }));
                          }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Simular Subida Inteligente
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploadSimulation.step === 2 && (
                    <div>
                      <Alert className="mb-4 border-green-200 bg-green-50">
                        <Package className="h-4 w-4" />
                        <AlertDescription>
                          <strong>¡Organización inteligente!</strong> Observa cómo el sistema organiza automáticamente
                          tus productos por categorías. Esto te ahorra horas de trabajo manual.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3 mb-4">
                        {uploadSimulation.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-green-600" />
                              <div>
                                <span className="text-sm font-medium">{file.name}</span>
                                <div className="text-xs text-green-600">
                                  Categoría detectada: {index === 0 ? "Ropa/Camisas" : "Calzado/Deportivo"}
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Organizado</Badge>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Nombre del Producto</label>
                          <Input
                            placeholder="Camisa Polo Azul Clásica"
                            value={uploadSimulation.productName}
                            onChange={(e) => setUploadSimulation((prev) => ({ ...prev, productName: e.target.value }))}
                            className="border-blue-200 bg-blue-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Precio (MXN)</label>
                          <Input
                            placeholder="$299.00 MXN"
                            value={uploadSimulation.productPrice}
                            onChange={(e) => setUploadSimulation((prev) => ({ ...prev, productPrice: e.target.value }))}
                            className="border-blue-200 bg-blue-50"
                          />
                        </div>
                      </div>

                      <Alert className="mt-4 mb-4 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>💡 Para continuar:</strong> Solo haz clic en el botón de abajo. Si los campos están
                          vacíos, los completaremos automáticamente para la demostración.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={() => {
                          if (!uploadSimulation.productName.trim()) {
                            setUploadSimulation((prev) => ({
                              ...prev,
                              productName: "Camisa Polo Azul Clásica",
                              productPrice: "$299.00 MXN",
                            }));
                          }

                          advanceToNextStep("upload", () => {
                            setUploadSimulation((prev) => ({ ...prev, step: 3 }));
                          });
                        }}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Completar Paso 1 - Organización de Productos
                      </Button>
                    </div>
                  )}

                  {uploadSimulation.step === 3 && (
                    <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">¡Primer Superpoder Desbloqueado!</h3>
                      <p className="text-green-700 mb-3">
                        Acabas de experimentar cómo <strong>2 fotos se convirtieron en productos catalogados</strong> en
                        segundos
                      </p>
                      <div className="bg-white p-3 rounded border inline-block">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">Tiempo ahorrado</div>
                            <div className="text-green-600">8 minutos</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">Errores evitados</div>
                            <div className="text-green-600">95%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">Nivel profesional</div>
                            <div className="text-green-600">✨ Logrado</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PASO 2: Background Removal */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5" />
                      2. Recortar Productos con IA
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>¿Por qué es revolucionario?</strong> La IA recorta productos automáticamente en 30
                      segundos
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ahorra $4,000-10,000/sesión
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Ahorro real:</strong> Una sesión de fotos profesional cuesta $4,000-10,000 MXN. CatifyPro
                    hace el mismo trabajo en 30 segundos.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">❌ Sin CatifyPro</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Contratar fotógrafo: $4,000-10,000 MXN</li>
                      <li>• Esperar cita: 1-2 semanas</li>
                      <li>• Edición manual: $50-100/foto</li>
                      <li>• Total: $10,000-20,000+ por catálogo</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Con CatifyPro</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• IA automática: 30 segundos</li>
                      <li>• Tiempo: Inmediato</li>
                      <li>• Calidad profesional garantizada</li>
                      <li>• Total: $106/mes (ilimitado)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  {backgroundRemovalSimulation.processingStep === "idle" && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Selecciona productos para recortar automáticamente:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            setBackgroundRemovalSimulation((prev) => ({
                              ...prev,
                              selectedProducts: prev.selectedProducts === 1 ? 0 : 1,
                            }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={backgroundRemovalSimulation.selectedProducts >= 1} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Camisa Polo Azul</p>
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Con Fondo
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            setBackgroundRemovalSimulation((prev) => ({
                              ...prev,
                              selectedProducts: prev.selectedProducts === 2 ? 1 : 2,
                            }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={backgroundRemovalSimulation.selectedProducts === 2} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Zapatos Deportivos</p>
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Con Fondo
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          if (backgroundRemovalSimulation.selectedProducts === 0) {
                            setBackgroundRemovalSimulation((prev) => ({ ...prev, selectedProducts: 2 }));
                          }

                          setBackgroundRemovalSimulation((prev) => ({ ...prev, processingStep: "validating" }));
                          setTimeout(() => {
                            setBackgroundRemovalSimulation((prev) => ({ ...prev, processingStep: "processing" }));
                            setTimeout(() => {
                              setBackgroundRemovalSimulation((prev) => ({ ...prev, processingStep: "completed" }));
                              advanceToNextStep("background-removal", () => {});
                            }, 3000);
                          }, 1000);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        {backgroundRemovalSimulation.selectedProducts === 0
                          ? "Recortar Productos Demo (2)"
                          : `Recortar con IA (${backgroundRemovalSimulation.selectedProducts})`}
                      </Button>
                    </div>
                  )}

                  {backgroundRemovalSimulation.processingStep === "validating" && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-blue-700 font-medium">Validando imágenes...</p>
                    </div>
                  )}

                  {backgroundRemovalSimulation.processingStep === "processing" && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mx-auto mb-2" />
                      <p className="text-yellow-700 font-medium">Recortando productos con IA...</p>
                      <p className="text-sm text-yellow-600">Enviando a sistema de recorte automático</p>
                    </div>
                  )}

                  {backgroundRemovalSimulation.processingStep === "completed" && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-medium">¡Productos recortados perfectamente!</p>
                      <p className="text-sm text-green-600">Productos listos para catálogo profesional</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PASO 3: Business Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      3. Personalizar tu Marca
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>¿Por qué es crucial?</strong> Una marca profesional aumenta la confianza del cliente en
                      65%
                    </p>
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    +65% confianza
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-purple-200 bg-purple-50">
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Impacto real:</strong> Los catálogos con branding profesional generan 65% más confianza y
                    40% más conversiones que catálogos genéricos.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">❌ Sin personalización</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Catálogos genéricos</li>
                      <li>• No hay identidad visual</li>
                      <li>• Clientes desconfían</li>
                      <li>• Menor conversión de ventas</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Con CatifyPro</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Marca profesional consistente</li>
                      <li>• Colores y logo personalizados</li>
                      <li>• Mayor confianza del cliente</li>
                      <li>• +65% más conversiones</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre del Negocio *</label>
                      <Input
                        placeholder="Mi Empresa S.A. de C.V."
                        value={businessInfoSimulation.businessName}
                        onChange={(e) =>
                          setBusinessInfoSimulation((prev) => ({ ...prev, businessName: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Teléfono</label>
                      <Input
                        placeholder="+52 555 123 4567"
                        value={businessInfoSimulation.phone}
                        onChange={(e) => setBusinessInfoSimulation((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        placeholder="contacto@miempresa.com"
                        value={businessInfoSimulation.email}
                        onChange={(e) => setBusinessInfoSimulation((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Color de Marca</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={businessInfoSimulation.primaryColor}
                          onChange={(e) =>
                            setBusinessInfoSimulation((prev) => ({ ...prev, primaryColor: e.target.value }))
                          }
                          className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                        />
                        <Input
                          value={businessInfoSimulation.primaryColor}
                          onChange={(e) =>
                            setBusinessInfoSimulation((prev) => ({ ...prev, primaryColor: e.target.value }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Impacto de personalizar tu marca:</span>
                    </div>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>• ✅ Clientes perciben 65% más profesionalismo</li>
                      <li>• ✅ Mayor recordación de marca</li>
                      <li>• ✅ Diferenciación vs. competencia</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      if (!businessInfoSimulation.businessName.trim()) {
                        setBusinessInfoSimulation((prev) => ({
                          ...prev,
                          businessName: "Mi Empresa Demo",
                          phone: "+52 555 123 4567",
                          email: "contacto@miempresa.com",
                        }));
                      }

                      advanceToNextStep("business-info", () => {
                        toast({
                          title: "¡Marca personalizada!",
                          description: "Tu identidad visual está configurada para catálogos profesionales",
                        });
                      });
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {businessInfoSimulation.businessName.trim()
                      ? "Guardar Información de Marca"
                      : "Completar con Datos Demo"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* PASO 4: Catalog Creation */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      4. Generar Catálogo Profesional
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>El momento mágico:</strong> De productos sueltos a catálogo que realmente vende
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    5 min vs 2-3 días
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transformación final:</strong> En 30 segundos vas a ver cómo productos individuales se
                    convierten en un catálogo profesional listo para vender.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">❌ Método tradicional</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Contratar diseñador: $4,000-10,000 MXN</li>
                      <li>• Esperar 2-3 días</li>
                      <li>• Múltiples revisiones</li>
                      <li>• Cambios cuestan extra</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Con CatifyPro</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Catálogo automático: 30 segundos</li>
                      <li>• Listo inmediatamente</li>
                      <li>• Cambios ilimitados</li>
                      <li>• Costo: $106/mes (ilimitado)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  {!catalogSimulation.generating && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Productos listos para catálogo:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            setCatalogSimulation((prev) => ({
                              ...prev,
                              selectedProducts: prev.selectedProducts === 1 ? 0 : 1,
                            }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={catalogSimulation.selectedProducts >= 1} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Camisa Polo Azul</p>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Recortado
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            setCatalogSimulation((prev) => ({
                              ...prev,
                              selectedProducts: prev.selectedProducts === 2 ? 1 : 2,
                            }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={catalogSimulation.selectedProducts === 2} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Zapatos Deportivos</p>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Recortado
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Estilo de Template</label>
                        <select
                          value={catalogSimulation.templateStyle}
                          onChange={(e) => setCatalogSimulation((prev) => ({ ...prev, templateStyle: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="professional">Profesional</option>
                          <option value="modern">Moderno</option>
                          <option value="elegant">Elegante</option>
                          <option value="minimal">Minimalista</option>
                        </select>
                      </div>

                      <Button
                        onClick={() => {
                          if (catalogSimulation.selectedProducts === 0) {
                            setCatalogSimulation((prev) => ({ ...prev, selectedProducts: 2 }));
                          }

                          setCatalogSimulation((prev) => ({ ...prev, generating: true }));
                          setTimeout(() => {
                            setCatalogSimulation((prev) => ({ ...prev, generating: false }));
                            advanceToNextStep("catalog-creation", () => {});
                          }, 4000);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {catalogSimulation.selectedProducts === 0
                          ? "Crear Catálogo Demo (2 productos)"
                          : `Crear Catálogo Profesional (${catalogSimulation.selectedProducts})`}
                      </Button>
                    </div>
                  )}

                  {catalogSimulation.generating && (
                    <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-purple-900 mb-2">
                        🎨 Creando tu catálogo profesional...
                      </h4>
                      <p className="text-purple-700 text-sm mb-3">
                        Template: {catalogSimulation.templateStyle} | Productos recortados | Marca personalizada
                      </p>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>✅ Aplicando tu marca personalizada...</p>
                          <p>✅ Organizando productos recortados...</p>
                          <p>✅ Generando layout profesional...</p>
                          <p>✅ Optimizando para impresión...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PASO 5: Inline Editing */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      5. Actualización Rápida de Precios
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Poder final:</strong> Actualiza precios masivamente en segundos, no horas
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    10 seg vs 2 horas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Ventaja competitiva:</strong> Mientras tu competencia tarda 2 horas actualizando precios, tú
                    lo haces en 10 segundos y ya tienes nuevos catálogos listos.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">❌ Sin CatifyPro</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Editar precios uno por uno</li>
                      <li>• Reconstruir catálogo desde cero</li>
                      <li>• Tiempo: 2-3 horas</li>
                      <li>• Perder oportunidades de venta</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Con CatifyPro</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Edición masiva inteligente</li>
                      <li>• Catálogos se actualizan automáticamente</li>
                      <li>• Tiempo: 10 segundos</li>
                      <li>• Respuesta inmediata al mercado</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Haz clic en cualquier precio para editarlo:</p>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium">Producto</th>
                          <th className="p-3 text-left text-sm font-medium">SKU</th>
                          <th className="p-3 text-left text-sm font-medium">Precio (MXN)</th>
                          <th className="p-3 text-left text-sm font-medium">Categoría</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inlineEditingSimulation.products.map((product) => (
                          <tr key={product.id} className="border-t">
                            <td className="p-3">{product.name}</td>
                            <td className="p-3">{product.sku}</td>
                            <td className="p-3">
                              {inlineEditingSimulation.editing === `${product.id}-price` ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={inlineEditingSimulation.editValue}
                                    onChange={(e) =>
                                      setInlineEditingSimulation((prev) => ({
                                        ...prev,
                                        editValue: e.target.value,
                                      }))
                                    }
                                    className="h-8 text-sm w-24"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const updatedProducts = inlineEditingSimulation.products.map((p) =>
                                        p.id === product.id ? { ...p, price: inlineEditingSimulation.editValue } : p,
                                      );
                                      setInlineEditingSimulation((prev) => ({
                                        ...prev,
                                        products: updatedProducts,
                                        editing: null,
                                        editValue: "",
                                      }));

                                      if (!checklist.find((item) => item.id === "inline-editing")?.completed) {
                                        advanceToNextStep("inline-editing", () => {});
                                      }
                                    }}
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer hover:bg-gray-50 p-1 rounded text-green-600 font-semibold"
                                  onClick={() => {
                                    setInlineEditingSimulation((prev) => ({
                                      ...prev,
                                      editing: `${product.id}-price`,
                                      editValue: product.price,
                                    }));
                                  }}
                                >
                                  ${product.price} MXN
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{product.category}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-800">Poder de actualización masiva:</span>
                    </div>
                    <ul className="text-xs text-orange-700 space-y-1">
                      <li>• ✅ Actualiza precios de 100+ productos en minutos</li>
                      <li>• ✅ Catálogos se regeneran automáticamente</li>
                      <li>• ✅ Siempre tienes los precios más actuales</li>
                    </ul>
                  </div>

                  {!checklist.find((item) => item.id === "inline-editing")?.completed && (
                    <div className="text-center">
                      <Button
                        onClick={() => {
                          const updatedProducts = inlineEditingSimulation.products.map((p) => ({
                            ...p,
                            price: p.id === "1" ? "349.99" : "549.99",
                          }));

                          setInlineEditingSimulation((prev) => ({
                            ...prev,
                            products: updatedProducts,
                          }));

                          setTimeout(() => {
                            advanceToNextStep("inline-editing", () => {});
                          }, 500);
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Simular Actualización Masiva de Precios
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    💡 Tip: En el sistema real puedes editar precios, categorías, SKUs y más campos directamente. Los
                    catálogos se actualizan automáticamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Listo para transformar tu negocio?</h3>
          <p className="text-gray-600 mb-6">
            Ahora que conoces el poder de CatifyPro, ¡es hora de aplicarlo con tus productos reales!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => navigate("/products")} className="bg-blue-600 hover:bg-blue-700">
              <Package className="w-4 h-4 mr-2" />
              Ver mis Productos Reales
            </Button>
            <Button variant="outline" onClick={() => navigate("/upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Subir mis Primeras Fotos
            </Button>
            <Button variant="outline" onClick={() => navigate("/business-info")}>
              <Building2 className="w-4 h-4 mr-2" />
              Configurar mi Marca
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
