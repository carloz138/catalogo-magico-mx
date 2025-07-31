
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Inicio</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-primary">Subir Productos</span>
              </div>
            </div>
            
            <div className="text-sm text-neutral/60">
              ¡Hola {user?.email}!
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral mb-4">
              Transforma tus productos en catálogos profesionales
            </h1>
            <p className="text-xl text-neutral/70">
              Sube las fotos de tus productos y nosotros haremos la magia
            </p>
          </div>

          <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center space-x-2">
                <Upload className="w-6 h-6" />
                <span>Arrastra tus fotos aquí o haz clic para seleccionar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-neutral/70 mb-2">
                    Formatos aceptados: JPG, PNG, JPEG
                  </p>
                  <p className="text-sm text-neutral/60">
                    Máximo 10MB por imagen
                  </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  Seleccionar archivos
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-secondary">1</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">Sube tus fotos</h3>
              <p className="text-sm text-neutral/70">
                No importa si son de celular o con mala luz
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-accent">2</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">Completa los datos</h3>
              <p className="text-sm text-neutral/70">
                Nombre y precio del producto
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">¡Listo!</h3>
              <p className="text-sm text-neutral/70">
                En 10 minutos tienes tu catálogo profesional
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Upload;
