import { useAuth } from "../../contexts/AuthContext";
import { RoleProvider } from "../../contexts/RoleContext"; // <-- IMPORTANTE: Importar RoleProvider aquí
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Redirige a la página de login si no está autenticado
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, el useEffect ya está manejando la redirección,
  // devolver null evita un renderizado momentáneo de las rutas protegidas.
  if (!user) {
    return null;
  }

  // --- CAMBIO PRINCIPAL ---
  // Ahora, cualquier ruta hija que se renderice a través del Outlet
  // tendrá acceso al contexto del rol, porque está envuelta por RoleProvider.
  return (
    <RoleProvider>
      <Outlet />
    </RoleProvider>
  );
};
