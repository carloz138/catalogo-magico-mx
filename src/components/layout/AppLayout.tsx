// /src/components/layout/AppLayout.tsx - VERSIÓN CORREGIDA
import React from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search, Bell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ==========================================
// INTERFACES
// ==========================================

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// ==========================================
// PÁGINAS SIN SIDEBAR
// ==========================================

const NO_SIDEBAR_ROUTES = [
  "/login",
  "/register", 
  "/reset-password",
  "/payment-success",
  "/payment-instructions",
];

// ==========================================
// BREADCRUMB MAPPING ACTUALIZADO
// ==========================================

const ROUTE_BREADCRUMBS: { [key: string]: { title: string; subtitle?: string; parent?: string } } = {
  "/": { title: "Dashboard", subtitle: "Resumen de tu actividad" },
  "/analytics": { title: "Analytics", subtitle: "Métricas y análisis de rendimiento", parent: "Análisis" },
  "/upload": { title: "Subir Productos", subtitle: "Agrega nuevos productos a tu biblioteca", parent: "Productos" },
  "/products": { title: "Mi Biblioteca", subtitle: "Gestiona tus productos guardados", parent: "Productos" },
  "/products-management": { title: "Editar Productos", subtitle: "Edición inline, variantes y gestión masiva", parent: "Productos" },
  "/image-review": { title: "Centro de Imágenes", subtitle: "Revisa y confirma imágenes procesadas", parent: "Productos" },
  "/template-selection": { title: "Crear Catálogo", subtitle: "Selecciona un template para tu catálogo", parent: "Catálogos" },
  "/catalogs": { title: "Mis Catálogos", subtitle: "Historial de catálogos generados", parent: "Catálogos" },
  "/business-info": { title: "Información del Negocio", subtitle: "Configura los datos de tu empresa", parent: "Configuración" },
  "/checkout": { title: "Comprar Créditos", subtitle: "Selecciona un paquete de créditos" },
};

// ==========================================
// COMPONENTE PRINCIPAL CORREGIDO
// ==========================================

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showSidebar = true,
  title: customTitle,
  subtitle: customSubtitle,
  actions,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Determinar si mostrar sidebar
  const shouldShowSidebar = showSidebar && !NO_SIDEBAR_ROUTES.includes(location.pathname);

  // Obtener información de la ruta actual
  const routeInfo = ROUTE_BREADCRUMBS[location.pathname] || {
    title: "Página",
    subtitle: "",
  };

  const pageTitle = customTitle || routeInfo.title;
  const pageSubtitle = customSubtitle || routeInfo.subtitle;

  // ✅ CORRECCIÓN: Si no hay sidebar, usar layout simple
  if (!shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // ==========================================
  // ✅ LAYOUT CORREGIDO CON SIDEBAR
  // ==========================================

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {/* ✅ SIDEBAR FIJO */}
        <AppSidebar />
        
        {/* ✅ CONTENIDO PRINCIPAL CORREGIDO */}
        <SidebarInset className="flex-1 min-h-screen">
          {/* ✅ HEADER CORREGIDO */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              
              {/* ✅ BREADCRUMB MEJORADO */}
              <Breadcrumb>
                <BreadcrumbList>
                  {routeInfo.parent && (
                    <>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink className="text-gray-600 hover:text-gray-900">
                          {routeInfo.parent}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                    </>
                  )}
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-gray-900">
                      {pageTitle}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* ✅ RIGHT SIDE ACTIONS OPTIMIZADO */}
            <div className="flex items-center gap-3">
              {/* Search - solo desktop */}
              <div className="hidden lg:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>

              {/* Custom actions */}
              {actions && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">{actions}</div>
                </>
              )}

              {/* User section */}
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.email?.split("@")[0] || "Usuario"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ✅ PAGE TITLE SECTION MEJORADO */}
          {pageSubtitle && (
            <div className="bg-white border-b px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                <p className="text-gray-600 mt-1">{pageSubtitle}</p>
              </div>
            </div>
          )}

          {/* ✅ MAIN CONTENT AREA CORREGIDO */}
          <main className="flex-1 bg-gray-50 min-h-[calc(100vh-4rem)]">
            <div className="p-6 w-full max-w-none">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
