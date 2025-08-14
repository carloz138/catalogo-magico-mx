
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Menu,
  Search,
  Bell,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSidebar?: boolean;
}

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Panel principal de control' },
  '/upload': { title: 'Subir Productos', subtitle: 'Agrega nuevos productos a tu inventario' },
  '/products': { title: 'Mi Biblioteca', subtitle: 'Gestiona tus productos guardados' },
  '/products-management': { title: 'Gestión Avanzada', subtitle: 'Administra tu inventario con edición inline y variantes' },
  '/image-review': { title: 'Centro de Imágenes', subtitle: 'Revisa y edita las imágenes procesadas' },
  '/template-selection': { title: 'Crear Catálogo', subtitle: 'Selecciona el estilo perfecto para tu catálogo' },
  '/catalogs': { title: 'Mis Catálogos', subtitle: 'Historial de catálogos generados' },
  '/business-info': { title: 'Información del Negocio', subtitle: 'Configura los datos de tu empresa para personalizar tus catálogos' },
  '/checkout': { title: 'Comprar Créditos', subtitle: 'Selecciona un paquete y método de pago' }
};

const pagesWithoutSidebar = [
  '/login',
  '/register', 
  '/payment-success',
  '/payment-instructions',
  '/checkout'
];

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  actions,
  showSidebar 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine if sidebar should be shown
  const shouldShowSidebar = showSidebar !== false && !pagesWithoutSidebar.includes(location.pathname);

  // Get page title and subtitle
  const pageInfo = pageTitles[location.pathname] || { title: 'CatalogPro' };
  const displayTitle = title || pageInfo.title;
  const displaySubtitle = subtitle || pageInfo.subtitle;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      )}

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        shouldShowSidebar ? "lg:ml-64" : ""
      )}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            {shouldShowSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden mr-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{displayTitle}</h1>
              {displaySubtitle && (
                <p className="text-sm text-gray-600 hidden sm:block">{displaySubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search - Desktop only */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Avatar */}
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
